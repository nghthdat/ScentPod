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

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_header_demo_' + Date.now(),
    '--window-size=1280,800'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9228/json/version');
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
    throw new Error('Không kết nối được Chrome');
  }

  async function createPage(url, viewport = { width: 1280, height: 800 }) {
    const res = await fetch('http://127.0.0.1:9228/json/new', { method: 'PUT' });
    const target = await res.json();
    const cdp = new SimpleCDP(target.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768
    });
    await cdp.send('Page.navigate', { url });
    await sleep(1500);
    return cdp;
  }

  try {
    // 1. Chụp Desktop Header trên trang chủ
    console.log('Chụp Header Desktop trên index.html...');
    const pageIndex = await createPage('http://localhost:8080/index.html', { width: 1280, height: 800 });
    const ssDesktop = await pageIndex.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'header_order_preview.png'), Buffer.from(ssDesktop.data, 'base64'));
    console.log('✅ Đã lưu header_order_preview.png');
    pageIndex.close();

    // 2. Chụp Header trên trang Sản phẩm
    console.log('Chụp Header Desktop trên san-pham.html...');
    const pageSanpham = await createPage('http://localhost:8080/san-pham.html', { width: 1280, height: 800 });
    const ssSanpham = await pageSanpham.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'header_order_sanpham.png'), Buffer.from(ssSanpham.data, 'base64'));
    console.log('✅ Đã lưu header_order_sanpham.png');
    pageSanpham.close();

    // 3. Chụp Header Mobile
    console.log('Chụp Header Mobile...');
    const pageMobile = await createPage('http://localhost:8080/index.html', { width: 390, height: 844 });
    const ssMobile = await pageMobile.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'header_order_mobile.png'), Buffer.from(ssMobile.data, 'base64'));
    console.log('✅ Đã lưu header_order_mobile.png');
    pageMobile.close();

    chromeProc.kill();
    console.log('🎉 TẤT CẢ SCREENSHOT HEADER ĐÃ HOÀN TẤT!');
  } catch (e) {
    chromeProc.kill();
    throw e;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
