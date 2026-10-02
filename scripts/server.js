const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT_DIR, 'images');

// ==========================================================================
// XÁC THỰC ADMIN BẰNG JWT (HS256, không cần thư viện ngoài)
// ==========================================================================
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ||
  'datnhatquang@gmail.com,khonghieu924@gmail.com,tranlam6a@gmail.com,hoaip3061@gmail.com')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
// Không đặt JWT_SECRET thì sinh ngẫu nhiên mỗi lần khởi động (token cũ hết hiệu lực khi restart)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_TTL_SECONDS = 8 * 60 * 60; // 8 giờ

const b64url = (input) => Buffer.from(input).toString('base64url');

function signJwt(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + JWT_TTL_SECONDS }));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

  try {
    const { alg } = JSON.parse(Buffer.from(header, 'base64url').toString());
    if (alg !== 'HS256') return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Middleware: chỉ cho qua khi có JWT hợp lệ, role admin và email nằm trong danh sách Admin.
 * Hợp lệ -> trả về payload; không hợp lệ -> tự trả 401/403 và trả về null.
 */
function requireAdmin(req, res) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers['authorization'] || '');
  const payload = match && verifyJwt(match[1]);
  if (!payload) {
    sendJson(res, 401, { error: 'Chưa đăng nhập hoặc phiên đã hết hạn' });
    return null;
  }
  if (payload.role !== 'admin' || !ADMIN_EMAILS.includes(payload.sub)) {
    sendJson(res, 403, { error: 'Chỉ Quản trị viên mới được thực hiện thao tác này' });
    return null;
  }
  return payload;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 0. API: Đăng nhập Admin -> cấp JWT
  if (req.method === 'POST' && req.url === '/api/auth/login') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        const cleanEmail = String(email || '').trim().toLowerCase();
        const okPassword = safeEqual(password || '', ADMIN_PASSWORD);
        if (!ADMIN_EMAILS.includes(cleanEmail) || !okPassword) {
          sendJson(res, 401, { error: 'Email hoặc mật khẩu Admin không đúng' });
          return;
        }
        sendJson(res, 200, { token: signJwt({ sub: cleanEmail, role: 'admin' }), expiresIn: JWT_TTL_SECONDS });
      } catch (e) {
        sendJson(res, 400, { error: 'Dữ liệu không hợp lệ' });
      }
    });
    return;
  }

  // 1. API: Upload ảnh sản phẩm trực tiếp vào thư mục images/ (CHỈ ADMIN)
  if (req.method === 'POST' && req.url === '/api/upload') {
    const admin = requireAdmin(req, res);
    if (!admin) {
      req.resume();
      return;
    }
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Giới hạn dữ liệu tối đa 20MB
      if (body.length > 20 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File quá lớn (tối đa 20MB)' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const { productId, imageData, filename } = JSON.parse(body);
        if (!productId || !imageData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Thiếu productId hoặc imageData' }));
          return;
        }

        // Tách chuỗi base64
        const matches = imageData.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        const base64Data = matches ? matches[2] : imageData;
        const buffer = Buffer.from(base64Data, 'base64');

        // Đảm bảo thư mục images tồn tại
        if (!fs.existsSync(IMAGES_DIR)) {
          fs.mkdirSync(IMAGES_DIR, { recursive: true });
        }

        // Lưu file vào thư mục images/ (dùng filename chuẩn nếu có)
        const safeFilename = (filename && /^[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|webp)$/i.test(filename))
          ? filename
          : `${productId}.jpg`;
        const targetFilePath = path.join(IMAGES_DIR, safeFilename);

        fs.writeFileSync(targetFilePath, buffer);
        console.log(`✅ [ĐÃ LƯU ẢNH MỚI] images/${safeFilename} (${Math.round(buffer.length / 1024)} KB) bởi ${admin.sub}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Đã lưu ảnh thành công vào thư mục images/${safeFilename}!`,
          file: `images/${safeFilename}`,
          sizeKb: Math.round(buffer.length / 1024)
        }));
      } catch (err) {
        console.error('Lỗi khi xử lý lưu ảnh:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Lỗi server khi lưu file ảnh' }));
      }
    });
    return;
  }

  // 2. Static file server
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, decodeURIComponent(reqPath));

  // Bảo vệ không cho đọc ra ngoài thư mục dự án
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Không tìm thấy trang hoặc file');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(65));
  console.log(`🌿 SCENTPOD LOCAL SERVER ĐANG CHẠY`);
  console.log(`👉 Truy cập website: http://localhost:${PORT}`);
  console.log(`📸 Tính năng tải ảnh: Mọi ảnh tải lên trên web sẽ tự động`);
  console.log(`   lưu trực tiếp đè vào thư mục 'images/' trên máy tính!`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('⚠️  Đang dùng mật khẩu Admin mặc định. Đặt biến môi trường ADMIN_PASSWORD để an toàn hơn.');
  }
  console.log('='.repeat(65));
});
