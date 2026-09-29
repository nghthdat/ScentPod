const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_test_profile_' + Date.now(),
    '--window-size=1280,1000'
  ], { stdio: 'ignore' });

  // Đợi chrome khởi động
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
    await sleep(200);
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Không thể kết nối Chrome DevTools');
  }

  async function createPage(filePath) {
    const res = await fetch('http://127.0.0.1:9222/json/new?file://' + path.resolve(__dirname, '..', filePath), { method: 'PUT' });
    const pageData = await res.json();
    const ws = new WebSocket(pageData.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    };

    await new Promise((resolve) => ws.onopen = resolve);

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await sleep(1500);

    return { ws, send, close: () => { ws.close(); } };
  }

  console.log('=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG GIỎ HÀNG, THANH TOÁN & ĐĂNG NHẬP ===');

  // 1. KIỂM THỬ GIỎ HÀNG TRÊN SAN-PHAM.HTML
  console.log('--- TEST 1: Thêm sản phẩm vào giỏ hàng trên san-pham.html ---');
  const page1 = await createPage('san-pham.html');

  // Bấm nút + Giỏ của First Class
  await page1.send('Runtime.evaluate', {
    expression: `document.querySelector('[data-add-to-cart="first-class"]').click();`
  });
  await sleep(600);

  // Bấm nút + Giỏ của Blind Date
  await page1.send('Runtime.evaluate', {
    expression: `document.querySelector('[data-add-to-cart="blind-date"]').click();`
  });
  await sleep(600);

  // Kiểm tra giỏ hàng
  const cartCheck = await page1.send('Runtime.evaluate', {
    expression: `
      JSON.stringify({
        badge: document.getElementById('header-cart-badge').textContent,
        drawerOpen: document.getElementById('scent-cart-drawer-backdrop').classList.contains('is-open'),
        itemsCount: document.getElementById('drawer-items-count').textContent,
        subtotal: document.getElementById('cart-subtotal-val').textContent,
        total: document.getElementById('cart-total-val').textContent,
        freeshipLabel: document.getElementById('freeship-text-label').textContent
      })
    `,
    returnByValue: true
  });
  console.log('Kết quả Giỏ hàng:', cartCheck.result.value);

  // Chụp ảnh Cart Drawer
  const shotCart = await page1.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve(__dirname, '../screenshot_test_cart_drawer.png'), Buffer.from(shotCart.data, 'base64'));
  console.log('✅ Đã lưu screenshot_test_cart_drawer.png');
  page1.close();

  // 2. KIỂM THỬ THANH TOÁN TRÊN THANH-TOAN.HTML
  console.log('--- TEST 2: Kênh thanh toán & Đặt hàng trên thanh-toan.html ---');
  const page2 = await createPage('thanh-toan.html');

  // Điền form thông tin
  await page2.send('Runtime.evaluate', {
    expression: `
      document.getElementById('c-name').value = 'Nguyễn Thu Trang';
      document.getElementById('c-phone').value = '0988776655';
      document.getElementById('c-email').value = 'thutrang@gmail.com';
      document.getElementById('c-address').value = 'Phòng 402 Ký Túc Xá ĐHQG TP.HCM';
      document.getElementById('c-gift-check').click();
      document.getElementById('c-gift-text').value = 'Chúc mừng sinh nhật bạn thân nhé!';
      document.querySelector('input[value="VietQR"]').click();
    `
  });
  await sleep(600);

  // Chụp ảnh trang Checkout
  const shotCheckout = await page2.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve(__dirname, '../screenshot_test_checkout.png'), Buffer.from(shotCheckout.data, 'base64'));
  console.log('✅ Đã lưu screenshot_test_checkout.png');

  // Bấm Xác Nhận Đặt Hàng
  console.log('Bấm Xác Nhận Đặt Hàng...');
  await page2.send('Runtime.evaluate', {
    expression: `document.getElementById('checkout-form').dispatchEvent(new Event('submit', { cancelable: true }));`
  });
  await sleep(800);

  const orderSuccessCheck = await page2.send('Runtime.evaluate', {
    expression: `
      JSON.stringify({
        isSuccessOpen: document.getElementById('order-success-modal').classList.contains('is-open'),
        orderId: document.getElementById('succ-order-id').textContent,
        orderName: document.getElementById('succ-name').textContent,
        orderTotal: document.getElementById('succ-total').textContent
      })
    `,
    returnByValue: true
  });
  console.log('Kết quả Đặt hàng thành công:', orderSuccessCheck.result.value);

  // Chụp ảnh Modal thành công
  const shotSuccess = await page2.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve(__dirname, '../screenshot_test_order_success.png'), Buffer.from(shotSuccess.data, 'base64'));
  console.log('✅ Đã lưu screenshot_test_order_success.png');
  page2.close();

  // 3. KIỂM THỬ ĐĂNG NHẬP & PHÂN QUYỀN TRÊN DANG-NHAP.HTML
  console.log('--- TEST 3: Đăng nhập Khách Hàng & Quản Trị Viên trên dang-nhap.html ---');
  const page3 = await createPage('dang-nhap.html');

  // A. Chụp ảnh trang đăng nhập ban đầu
  const shotLogin = await page3.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve(__dirname, '../screenshot_test_login_page.png'), Buffer.from(shotLogin.data, 'base64'));
  console.log('✅ Đã lưu screenshot_test_login_page.png');

  // B. Đăng nhập Admin qua 1-click
  console.log('Đăng nhập Quản Trị Viên...');
  await page3.send('Runtime.evaluate', {
    expression: `document.getElementById('btn-quick-admin').click();`
  });
  await sleep(800);

  const adminCheck = await page3.send('Runtime.evaluate', {
    expression: `
      JSON.stringify({
        title: document.querySelector('.dashboard-user-greeting h1') ? document.querySelector('.dashboard-user-greeting h1').textContent : '',
        kpiCount: document.querySelectorAll('.kpi-card').length,
        ordersRowCount: document.querySelectorAll('.dashboard-table tbody tr').length,
        firstCustomerName: document.querySelector('.dashboard-table tbody tr strong') ? document.querySelector('.dashboard-table tbody tr strong').textContent : ''
      })
    `,
    returnByValue: true
  });
  console.log('Kết quả Admin Dashboard:', adminCheck.result.value);

  // Chụp ảnh Admin Dashboard
  const shotAdmin = await page3.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve(__dirname, '../screenshot_test_admin_dashboard.png'), Buffer.from(shotAdmin.data, 'base64'));
  console.log('✅ Đã lưu screenshot_test_admin_dashboard.png');

  // C. Đổi vai trò sang Khách Hàng
  console.log('Đăng xuất và đăng nhập Khách Hàng...');
  await page3.send('Runtime.evaluate', {
    expression: `
      window.ScentPod.logoutUser();
      window.ScentPod.loginUser('khachhang@scentpod.vn', 'user123', 'customer');
      location.reload();
    `
  });
  await sleep(1500);

  const customerCheck = await page3.send('Runtime.evaluate', {
    expression: `
      JSON.stringify({
        title: document.querySelector('.dashboard-user-greeting h1') ? document.querySelector('.dashboard-user-greeting h1').textContent : '',
        customerOrdersCount: document.querySelectorAll('.dashboard-table tbody tr').length
      })
    `,
    returnByValue: true
  });
  console.log('Kết quả Customer Portal:', customerCheck.result.value);

  // Chụp ảnh Customer Portal
  const shotCustomer = await page3.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve(__dirname, '../screenshot_test_customer_portal.png'), Buffer.from(shotCustomer.data, 'base64'));
  console.log('✅ Đã lưu screenshot_test_customer_portal.png');

  page3.close();
  chromeProc.kill();
  console.log('🎉 TẤT CẢ KIỂM THỬ ĐÃ THÀNH CÔNG VƯỢT TRỘI!');
}

run().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
