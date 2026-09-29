const { spawn } = require('child_process');
const fs = require('fs');

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
    '--remote-debugging-port=9226',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_clean_prev_' + Date.now(),
    '--window-size=1280,1050'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9226/json/version');
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
    return;
  }

  async function createPage(url) {
    const res = await fetch('http://127.0.0.1:9226/json/new', { method: 'PUT' });
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
    const page = await createPage('http://localhost:8080/san-pham.html');
    await sleep(1000);

    // 1. Chụp phần trên cùng của trang sản phẩm (header có nút Đăng nhập góc trái + nến đơn có nút chọn size)
    const ss1 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/minmin091299/.gemini/antigravity-ide/brain/3da43f97-921a-4289-a9cf-b1a8a259c5c4/preview_sanpham_sizes.png', Buffer.from(ss1.data, 'base64'));
    console.log('✅ Đã chụp preview_sanpham_sizes.png');

    // 2. Cuộn xuống phần combo
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        const combo = document.getElementById('combo');
        if (combo) combo.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await sleep(800);

    const ss2 = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/minmin091299/.gemini/antigravity-ide/brain/3da43f97-921a-4289-a9cf-b1a8a259c5c4/preview_sanpham_combos.png', Buffer.from(ss2.data, 'base64'));
    console.log('✅ Đã chụp preview_sanpham_combos.png');

    page.close();
  } finally {
    chromeProc.kill();
  }
}

run();
