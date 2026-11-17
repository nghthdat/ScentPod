const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  loadCatalog,
  generateAdvisorResponse,
  getCart,
  addToCart,
  updateCart,
  clearCart,
  checkout
} = require('./ai_shopping_assistant');

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

// ------------------------------------------------------------------------------
// RATE LIMITING & BẢO VỆ CHỐNG SPAM (30 requests / phút / IP)
// ------------------------------------------------------------------------------
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 phút
const RATE_LIMIT_MAX = 30; // 30 requests

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  const record = rateLimitMap.get(ip);
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + RATE_LIMIT_WINDOW;
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count++;
  return true;
}

// Định kỳ dọn dẹp bộ nhớ rateLimitMap
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

// Helper đọc JSON body
function parseJsonBody(req, res, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > maxBytes) {
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Payload quá lớn.' }));
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const json = body ? JSON.parse(body) : {};
        resolve(json);
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Định dạng JSON không hợp lệ.' }));
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // ----------------------------------------------------------------------------
  // A. BACKEND APIS CHO TRỢ LÝ MUA HÀNG AI & GIỎ HÀNG
  // ----------------------------------------------------------------------------

  // 1. API: Danh sách sản phẩm trong Catalog thật
  if (req.method === 'GET' && pathname === '/api/products') {
    const catalog = loadCatalog();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      products: catalog.products || [],
      shippingPolicy: catalog.defaultShippingPolicy || {}
    }));
    return;
  }

  // 2. API: Chi tiết 1 sản phẩm
  if (req.method === 'GET' && pathname.startsWith('/api/products/')) {
    const id = pathname.replace('/api/products/', '').trim();
    const catalog = loadCatalog();
    const product = (catalog.products || []).find(p => p.id === id);
    if (!product) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Không tìm thấy sản phẩm.' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, product }));
    return;
  }

  // 3. API: Hội thoại tư vấn với Trợ lý AI (/api/chat)
  if (req.method === 'POST' && pathname === '/api/chat') {
    if (!checkRateLimit(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        error: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau giây lát.'
      }));
      return;
    }

    try {
      const data = await parseJsonBody(req, res, 64 * 1024);
      let message = (data.message || '').trim();
      const sessionId = data.sessionId || req.headers['x-session-id'] || 'sess_default';
      const history = Array.isArray(data.history) ? data.history : [];

      // Kiểm tra tính hợp lệ của đầu vào
      if (!message || message.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Nội dung tin nhắn không được để trống.' }));
        return;
      }

      if (message.length > 500) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Nội dung tin nhắn tối đa 500 ký tự.' }));
        return;
      }

      // Xử lý tư vấn sản phẩm an toàn với Grounded Catalog Engine
      const result = await generateAdvisorResponse({
        message,
        sessionId,
        history
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        ...result
      }));
    } catch (err) {
      console.error('[API /api/chat Error]:', err);
      // Fallback an toàn, không làm gián đoạn người dùng
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          sessionId: req.headers['x-session-id'] || 'sess_fallback',
          reply: 'Chào bạn! Tụi mình đang bảo dưỡng kết nối AI một chút. Nhưng bạn yên tâm, 4 mùi nến thơm 50g của ScentPod (85k/hũ) vẫn sẵn sàng để bạn chọn lựa ngay bên dưới nhé!',
          suggestedProducts: (loadCatalog().products || []).slice(0, 2)
        }));
      }
    }
    return;
  }

  // 4. API: Lấy giỏ hàng theo phiên (/api/cart)
  if (req.method === 'GET' && pathname === '/api/cart') {
    const sessionId = urlObj.searchParams.get('sessionId') || req.headers['x-session-id'] || 'sess_default';
    const cart = getCart(sessionId);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, ...cart }));
    return;
  }

  // 5. API: Thêm sản phẩm vào giỏ hàng (/api/cart/add)
  if (req.method === 'POST' && pathname === '/api/cart/add') {
    try {
      const data = await parseJsonBody(req, res);
      const sessionId = data.sessionId || req.headers['x-session-id'] || 'sess_default';
      const productId = data.productId;
      const quantity = parseInt(data.quantity, 10) || 1;

      if (!productId) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Thiếu productId' }));
        return;
      }

      const result = addToCart(sessionId, productId, quantity);
      const statusCode = result.success ? 200 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Lỗi server khi thêm vào giỏ.' }));
      }
    }
    return;
  }

  // 6. API: Cập nhật số lượng giỏ hàng (/api/cart/update)
  if (req.method === 'POST' && pathname === '/api/cart/update') {
    try {
      const data = await parseJsonBody(req, res);
      const sessionId = data.sessionId || req.headers['x-session-id'] || 'sess_default';
      const productId = data.productId;
      const quantity = parseInt(data.quantity, 10);

      const result = updateCart(sessionId, productId, quantity);
      const statusCode = result.success ? 200 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Lỗi server khi cập nhật giỏ.' }));
      }
    }
    return;
  }

  // 7. API: Xóa giỏ hàng (/api/cart/clear)
  if (req.method === 'POST' && pathname === '/api/cart/clear') {
    try {
      const data = await parseJsonBody(req, res);
      const sessionId = data.sessionId || req.headers['x-session-id'] || 'sess_default';
      const result = clearCart(sessionId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Lỗi server khi xóa giỏ.' }));
      }
    }
    return;
  }

  // 8. API: Đặt hàng / Checkout (/api/checkout)
  if (req.method === 'POST' && pathname === '/api/checkout') {
    try {
      const data = await parseJsonBody(req, res);
      const sessionId = data.sessionId || req.headers['x-session-id'] || 'sess_default';
      const orderInfo = data.orderInfo || {};

      const result = checkout(sessionId, orderInfo);
      const statusCode = result.success ? 200 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Lỗi server khi đặt hàng.' }));
      }
    }
    return;
  }

  // 9. API: Upload ảnh sản phẩm trực tiếp vào thư mục images/ (Giữ nguyên)
  if (req.method === 'POST' && pathname === '/api/upload') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'File quá lớn (tối đa 20MB)' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const { productId, imageData, filename } = JSON.parse(body);
        if (!productId || !imageData) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Thiếu productId hoặc imageData' }));
          return;
        }

        const matches = imageData.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        const base64Data = matches ? matches[2] : imageData;
        const buffer = Buffer.from(base64Data, 'base64');

        if (!fs.existsSync(IMAGES_DIR)) {
          fs.mkdirSync(IMAGES_DIR, { recursive: true });
        }

        const safeFilename = (filename && /^[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|webp)$/i.test(filename))
          ? filename
          : `${productId}.jpg`;
        const targetFilePath = path.join(IMAGES_DIR, safeFilename);

        fs.writeFileSync(targetFilePath, buffer);
        console.log(`✅ [ĐÃ LƯU ẢNH MỚI] images/${safeFilename} (${Math.round(buffer.length / 1024)} KB)`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          message: `Đã lưu ảnh thành công vào thư mục images/${safeFilename}!`,
          file: `images/${safeFilename}`,
          sizeKb: Math.round(buffer.length / 1024)
        }));
      } catch (err) {
        console.error('Lỗi khi xử lý lưu ảnh:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Lỗi server khi lưu file ảnh' }));
      }
    });
    return;
  }

  // ----------------------------------------------------------------------------
  // B. STATIC FILE SERVER
  // ----------------------------------------------------------------------------
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, decodeURIComponent(reqPath));

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
  console.log('='.repeat(70));
  console.log(`🌿 SCENTPOD COMMERCE & AI ASSISTANT SERVER ĐANG CHẠY`);
  console.log(`👉 Trang chủ website: http://localhost:${PORT}`);
  console.log(`🤖 Trợ lý mua hàng AI API: http://localhost:${PORT}/api/chat`);
  console.log(`🛒 Giỏ hàng API: http://localhost:${PORT}/api/cart`);
  console.log(`📦 Catalog API: http://localhost:${PORT}/api/products`);
  console.log('='.repeat(70));
});
