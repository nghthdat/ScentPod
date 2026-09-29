const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class SimpleCDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const WebSocket = global.WebSocket || require('ws');
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_admin_profile_' + Date.now(),
    '--window-size=1280,1000'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
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

  async function createPage(url) {
    const res = await fetch('http://127.0.0.1:9223/json/new?' + url, { method: 'PUT' });
    const target = await res.json();
    const cdp = new SimpleCDP(target.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    return { cdp, targetId: target.id };
  }

  console.log('=== BẮT ĐẦU KIỂM THỬ TRANG ĐĂNG NHẬP & ADMIN DASHBOARD ===');

  const { cdp } = await createPage('http://localhost:8080/dang-nhap.html');
  await sleep(1000);

  // 1. Kiểm tra danh sách 4 admin emails trong window.ScentPod
  const eval1 = await cdp.send('Runtime.evaluate', {
    expression: `JSON.stringify(window.ScentPod.AUTHORIZED_ADMIN_EMAILS);`,
    returnByValue: true
  });
  const emails = JSON.parse(eval1.result.value);
  console.log('1. Danh sách Admin Emails:', emails);
  const expected = ["hoaip3061@gmail.com", "khonghieu924@gmail.com", "tranlam6a@gmail.com", "datnhatquang@gmail.com"];
  const allMatch = expected.every(e => emails.includes(e));
  if (allMatch) {
    console.log('✅ Đủ 4 Gmail quản trị viên chính xác!');
  } else {
    throw new Error('❌ Danh sách Admin Gmail không khớp');
  }

  // 2. Chuyển sang tab Admin và thử đăng nhập email lạ
  console.log('2. Kiểm tra chặn email không hợp lệ trên cổng Quản Trị...');
  const eval2 = await cdp.send('Runtime.evaluate', {
    expression: `
      document.getElementById('tab-btn-admin').click();
      document.getElementById('admin-email').value = 'khongcoquyen@gmail.com';
      document.getElementById('form-login-admin').dispatchEvent(new Event('submit'));
      const err = document.getElementById('admin-auth-error');
      ({
        displayed: err && err.style.display !== 'none',
        text: err ? err.innerText : ''
      });
    `,
    returnByValue: true
  });
  console.log('Kết quả chặn:', eval2.result.value);
  if (eval2.result.value.displayed) {
    console.log('✅ Chặn email không được ủy quyền thành công!');
  } else {
    throw new Error('❌ Không chặn được email lạ');
  }

  // 3. Đăng nhập bằng Gmail Admin (Nghiêm Thành Đạt)
  console.log('3. Đăng nhập bằng datnhatquang@gmail.com...');
  const eval3 = await cdp.send('Runtime.evaluate', {
    expression: `
      window.quickLoginAdmin('datnhatquang@gmail.com');
      const user = window.ScentPod.getCurrentUser();
      ({
        role: user ? user.role : null,
        name: user ? user.name : null,
        email: user ? user.email : null
      });
    `,
    returnByValue: true
  });
  console.log('Kết quả đăng nhập Đạt:', eval3.result.value);
  if (eval3.result.value.role === 'admin' && eval3.result.value.name === 'Nghiêm Thành Đạt') {
    console.log('✅ Đăng nhập Admin thành công với quyền hạn chính xác!');
  } else {
    throw new Error('❌ Đăng nhập Admin thất bại');
  }

  await sleep(600);

  // 4. Chụp ảnh Dashboard Admin - Tab Đơn hàng
  const shotOrders = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/minmin091299/.gemini/antigravity-ide/brain/3da43f97-921a-4289-a9cf-b1a8a259c5c4/admin_dashboard_orders.png', Buffer.from(shotOrders.data, 'base64'));
  console.log('📸 Đã chụp admin_dashboard_orders.png');

  // 5. Chuyển sang Tab Thống kê sản phẩm
  console.log('5. Kiểm tra Tab Thống Kê Số Lượng Đơn Từng Sản Phẩm...');
  await cdp.send('Runtime.evaluate', {
    expression: `document.getElementById('btn-subnav-products').click();`
  });
  await sleep(600);
  const statsCheck = await cdp.send('Runtime.evaluate', {
    expression: `
      const stats = window.ScentPod.getProductOrderStats();
      stats.map(s => ({ code: s.code, name: s.name, orders: s.orderCount, sold: s.totalQtySold, stock: s.stock }));
    `,
    returnByValue: true
  });
  console.log('Thống kê 4 sản phẩm:', statsCheck.result.value);
  const shotProducts = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/minmin091299/.gemini/antigravity-ide/brain/3da43f97-921a-4289-a9cf-b1a8a259c5c4/admin_dashboard_products.png', Buffer.from(shotProducts.data, 'base64'));
  console.log('📸 Đã chụp admin_dashboard_products.png');

  // 6. Chuyển sang Tab Kho Còn Tồn
  console.log('6. Kiểm tra Tab Kho Còn Tồn & Số Lượng...');
  await cdp.send('Runtime.evaluate', {
    expression: `document.getElementById('btn-subnav-inventory').click();`
  });
  await sleep(600);

  // Thử điều chỉnh tồn kho: +10 hũ cho First Class
  const adjustCheck = await cdp.send('Runtime.evaluate', {
    expression: `
      const stockBefore = window.ScentPod.getInventory()['first-class'].stock;
      window.ScentPod.adjustProductStock('first-class', 10);
      const stockAfter = window.ScentPod.getInventory()['first-class'].stock;
      ({ stockBefore, stockAfter });
    `,
    returnByValue: true
  });
  console.log('Thử tăng tồn kho First Class:', adjustCheck.result.value);
  if (adjustCheck.result.value.stockAfter === adjustCheck.result.value.stockBefore + 10) {
    console.log('✅ Điều chỉnh tồn kho kho hàng hoạt động hoàn hảo!');
  }

  // Refresh tab inventory
  await cdp.send('Runtime.evaluate', {
    expression: `document.getElementById('btn-subnav-inventory').click();`
  });
  await sleep(600);

  const shotInventory = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/minmin091299/.gemini/antigravity-ide/brain/3da43f97-921a-4289-a9cf-b1a8a259c5c4/admin_dashboard_inventory.png', Buffer.from(shotInventory.data, 'base64'));
  console.log('📸 Đã chụp admin_dashboard_inventory.png');

  // 7. Thử đăng nhập với các admin còn lại
  console.log('7. Thử nghiệm đăng nhập các admin còn lại:');
  const otherAdmins = ['khonghieu924@gmail.com', 'tranlam6a@gmail.com', 'hoaip3061@gmail.com'];
  for (const adm of otherAdmins) {
    const res = await cdp.send('Runtime.evaluate', {
      expression: `
        window.quickLoginAdmin('${adm}');
        const u = window.ScentPod.getCurrentUser();
        ({ name: u.name, email: u.email, role: u.role });
      `,
      returnByValue: true
    });
    console.log(` - Admin ${adm}:`, res.result.value);
  }

  cdp.close();
  chromeProc.kill();
  console.log('\n🎉 TẤT CẢ KIỂM THỬ CDP TRÊN CHROME ĐÃ HOÀN THÀNH XUẤT SẮC!');
}

run().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
