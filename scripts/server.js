const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT_DIR, 'images');

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: Upload ảnh sản phẩm trực tiếp vào thư mục images/
  if (req.method === 'POST' && req.url === '/api/upload') {
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
        console.log(`✅ [ĐÃ LƯU ẢNH MỚI] images/${safeFilename} (${Math.round(buffer.length / 1024)} KB)`);

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
  console.log('='.repeat(65));
});
