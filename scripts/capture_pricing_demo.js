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
  const artifactDir = '/Users/minmin091299/.gemini/antigravity-ide/brain/fbf92e3f-5923-4a37-b465-cd8ed2e53135';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_pricing_demo_' + Date.now(),
    '--window-size=1280,1050'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9227/json/version');
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
    const res = await fetch('http://127.0.0.1:9227/json/new', { method: 'PUT' });
    const target = await res.json();
    const cdp = new SimpleCDP(target.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Page.navigate', { url });
    await sleep(1500);
    return cdp;
  }

  try {
    console.log('=== 1. CHỤP ĐẦU TRANG SAN-PHAM.HTML (KHÔNG CÒN BẢNG 1 BÁN LẺ) ===');
    const pageSanpham = await createPage('http://localhost:8080/san-pham.html');
    await sleep(1000);

    const ssTable = await pageSanpham.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'pricing_table_preview.png'), Buffer.from(ssTable.data, 'base64'));
    console.log('✅ Đã lưu pricing_table_preview.png');

    // Cuộn tới khu vực Combo Cards
    console.log('=== 2. CHỤP KHU VỰC CÁC GÓI COMBO TRÊN SAN-PHAM.HTML ===');
    await pageSanpham.send('Runtime.evaluate', {
      expression: `(() => {
        const comboSec = document.getElementById('combo');
        if (comboSec) comboSec.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await sleep(800);

    const ssCombos = await pageSanpham.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'combo_cards_preview.png'), Buffer.from(ssCombos.data, 'base64'));
    console.log('✅ Đã lưu combo_cards_preview.png');

    // Click thêm combo CB02 vào giỏ hàng
    console.log('=== 3. CHỤP CART DRAWER VỚI COMBO CB02 & CHÍNH SÁCH SHIP 15K ===');
    await pageSanpham.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-add-to-cart="cb02"]');
        if (btn) btn.click();
      })()`
    });
    await sleep(800);

    const ssCart = await pageSanpham.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cart_drawer_combo_preview.png'), Buffer.from(ssCart.data, 'base64'));
    console.log('✅ Đã lưu cart_drawer_combo_preview.png');

    pageSanpham.close();

    // 4. Mở trang Checkout
    console.log('=== 4. CHỤP TRANG CHECKOUT VỚI TÓM TẮT COMBO & SHIP 15K ===');
    const pageCheckout = await createPage('http://localhost:8080/thanh-toan.html');
    await sleep(1000);

    const ssCheckout = await pageCheckout.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'checkout_combo_preview.png'), Buffer.from(ssCheckout.data, 'base64'));
    console.log('✅ Đã lưu checkout_combo_preview.png');

    pageCheckout.close();
    chromeProc.kill();
    console.log('🎉 TẤT CẢ SCREENSHOT ĐÃ ĐƯỢC CHỤP THÀNH CÔNG VÀ LƯU VÀO ARTIFACT DIR!');
  } catch (err) {
    chromeProc.kill();
    throw err;
  }
}

run().catch((e) => {
  console.error('Lỗi chụp ảnh:', e);
  process.exit(1);
});
