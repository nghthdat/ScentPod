/**
 * ==============================================================================
 * SCENTPOD - KIỂM THỬ TÍCH HỢP HTTP SERVER & CÁC ENDPOINT REST APIS
 * ==============================================================================
 */

const http = require('http');

async function makeRequest(port, method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  const TEST_PORT = 3100;
  process.env.PORT = TEST_PORT;

  // Khởi động server
  const server = require('./server');

  // Đợi server lắng nghe
  await new Promise(r => setTimeout(r, 600));

  console.log('🧪 BẮT ĐẦU KIỂM THỬ TÍCH HỢP HTTP SERVER TRÊN CỔNG ' + TEST_PORT);

  const testSession = 'sess_http_test_' + Date.now();

  try {
    // 1. Test GET /api/products
    const pRes = await makeRequest(TEST_PORT, 'GET', '/api/products');
    console.log(`1. GET /api/products -> Status ${pRes.statusCode} (${pRes.json?.products?.length} sản phẩm)`);
    if (pRes.statusCode !== 200 || pRes.json?.products?.length !== 4) {
      throw new Error('GET /api/products thất bại');
    }

    // 2. Test GET /api/products/first-class
    const singleRes = await makeRequest(TEST_PORT, 'GET', '/api/products/first-class');
    console.log(`2. GET /api/products/first-class -> Status ${singleRes.statusCode} (${singleRes.json?.product?.name})`);
    if (singleRes.statusCode !== 200 || singleRes.json?.product?.id !== 'first-class') {
      throw new Error('GET /api/products/:id thất bại');
    }

    // 3. Test POST /api/chat
    const chatRes = await makeRequest(TEST_PORT, 'POST', '/api/chat', {
      sessionId: testSession,
      message: 'Tư vấn nến để bàn học tập trung ôn thi'
    });
    console.log(`3. POST /api/chat -> Status ${chatRes.statusCode} (Gợi ý: ${chatRes.json?.suggestedProducts?.length} SP)`);
    if (chatRes.statusCode !== 200 || !chatRes.json?.reply) {
      throw new Error('POST /api/chat thất bại');
    }

    // 4. Test POST /api/cart/add
    const addRes = await makeRequest(TEST_PORT, 'POST', '/api/cart/add', {
      sessionId: testSession,
      productId: 'first-class',
      quantity: 2
    });
    console.log(`4. POST /api/cart/add -> Status ${addRes.statusCode} (${addRes.json?.message})`);
    if (addRes.statusCode !== 200 || !addRes.json?.success) {
      throw new Error('POST /api/cart/add thất bại');
    }

    // 5. Test GET /api/cart
    const cartRes = await makeRequest(TEST_PORT, 'GET', `/api/cart?sessionId=${testSession}`);
    console.log(`5. GET /api/cart -> Status ${cartRes.statusCode} (Tổng: ${cartRes.json?.totalQuantity} hũ, Ship: ${cartRes.json?.shippingFeeFormatted})`);
    if (cartRes.statusCode !== 200 || cartRes.json?.totalQuantity !== 2 || cartRes.json?.shippingFee !== 15000) {
      throw new Error('GET /api/cart thất bại hoặc tính sai phí ship 15k');
    }

    // 6. Test Static Files
    const staticPages = ['/index.html', '/san-pham.html', '/thanh-toan.html', '/css/ai-chat.css', '/js/ai-chat.js', '/js/cart.js'];
    for (const page of staticPages) {
      const sRes = await makeRequest(TEST_PORT, 'GET', page);
      console.log(`Static file ${page} -> Status ${sRes.statusCode}`);
      if (sRes.statusCode !== 200) {
        throw new Error(`File tĩnh ${page} trả về ${sRes.statusCode}`);
      }
    }

    console.log('\n🎉 TẤT CẢ HTTP ENDPOINTS ĐÃ QUA KIỂM THỬ THÀNH CÔNG 100%!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi kiểm thử HTTP:', err);
    process.exit(1);
  }
}

run();

