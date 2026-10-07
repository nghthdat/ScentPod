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

const http = require('http');

async function run() {
  // 1. Tạo local server phục vụ file tĩnh
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, 'http://127.0.0.1:8190');
    let filePath = path.join(__dirname, '..', parsedUrl.pathname);
    if (parsedUrl.pathname === '/') filePath = path.join(__dirname, '../chi-tiet-san-pham.html');
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  await new Promise(r => server.listen(8190, '127.0.0.1', r));
  console.log('Local HTTP server running on http://127.0.0.1:8190');

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_detail_opt_' + Date.now(),
    '--window-size=1280,900'
  ], { stdio: 'ignore' });

  let pageWsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(200);
    try {
      const res = await fetch('http://127.0.0.1:9230/json/new', { method: 'PUT' });
      const target = await res.json();
      if (target && target.webSocketDebuggerUrl) {
        pageWsUrl = target.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!pageWsUrl) {
    console.error('Không tìm thấy Chrome CDP WebSocket!');
    chromeProc.kill();
    server.close();
    process.exit(1);
  }

  const cdp = new SimpleCDP(pageWsUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  const targetUrl = 'http://127.0.0.1:8190/chi-tiet-san-pham.html?id=late-night';
  console.log('Navigating to:', targetUrl);
  await cdp.send('Page.navigate', { url: targetUrl });
  await sleep(2000);

  // 1. Kiểm tra trên Desktop:
  const desktopCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const priceText = document.getElementById("detail-price")?.textContent;
      const originalPriceText = document.getElementById("detail-original-price")?.textContent;
      const savingsText = document.getElementById("detail-savings")?.textContent;
      const cards = Array.from(document.querySelectorAll(".detail-size-card")).map(c => ({
        size: c.getAttribute("data-size"),
        title: c.querySelector(".size-card-title")?.textContent,
        price: c.querySelector(".size-card-price")?.textContent,
        original: c.querySelector(".size-card-original")?.textContent,
        isActive: c.classList.contains("is-active")
      }));
      const giftText = document.getElementById("detail-gift-text")?.textContent;
      const buyNowBtn = document.getElementById("btn-buy-now")?.textContent.trim();
      const addCartBtn = document.getElementById("btn-add-cart")?.textContent.trim();
      const messengerBtn = document.getElementById("btn-messenger-order")?.textContent.trim();
      const perksCount = document.querySelectorAll(".detail-perks-list .perk-item").length;

      return {
        priceText,
        originalPriceText,
        savingsText,
        cards,
        giftText,
        buyNowBtn,
        addCartBtn,
        messengerBtn,
        perksCount
      };
    })()`,
    returnByValue: true
  });

  console.log('Desktop Check Result:', JSON.stringify(desktopCheck.result.value, null, 2));

  // Chụp ảnh Desktop
  const desktopShot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  const desktopPath = path.resolve(__dirname, '../detail_desktop_preview.jpg');
  fs.writeFileSync(desktopPath, Buffer.from(desktopShot.data, 'base64'));
  console.log('Saved desktop screenshot to:', desktopPath);

  // 2. Thử tương tác chọn size: bấm vào sp01 (Sáp bỏ túi 50g)
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const cardSp01 = document.querySelector('.detail-size-card[data-size="sp01"]');
      if (cardSp01) cardSp01.click();
    })()`
  });
  await sleep(500);

  const sp01PriceCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => ({
      price: document.getElementById("detail-price")?.textContent,
      savings: document.getElementById("detail-savings")?.textContent,
      gift: document.getElementById("detail-gift-text")?.textContent,
      sp01Active: document.querySelector('.detail-size-card[data-size="sp01"]')?.classList.contains('is-active')
    }))()`,
    returnByValue: true
  });
  console.log('After clicking SP01:', sp01PriceCheck.result.value);

  // 3. Test Mobile Viewport 375x812:
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(500);

  // Cuộn xuống 2200px (khu vực Tabs tầng hương / HDSD) để kiểm tra Mobile Sticky Bar
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo({ top: 2200, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    })()`
  });
  await sleep(500);

  const mobileCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const stickyBar = document.getElementById("mobile-sticky-bar");
      const isVisible = stickyBar?.classList.contains("is-visible");
      const stickyPrice = document.getElementById("sticky-price")?.textContent;
      const stickyPill = document.getElementById("sticky-size-pill")?.textContent;
      const stickyName = document.getElementById("sticky-prod-name")?.textContent;
      const computedDisplay = stickyBar ? window.getComputedStyle(stickyBar).display : null;
      const computedTransform = stickyBar ? window.getComputedStyle(stickyBar).transform : null;

      return {
        isVisible,
        stickyPrice,
        stickyPill,
        stickyName,
        computedDisplay,
        computedTransform
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Sticky Bar Check:', mobileCheck.result.value);

  // Chụp ảnh Mobile
  const mobileShot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  const mobilePath = path.resolve(__dirname, '../detail_mobile_preview.jpg');
  fs.writeFileSync(mobilePath, Buffer.from(mobileShot.data, 'base64'));
  console.log('Saved mobile screenshot to:', mobilePath);

  cdp.close();
  chromeProc.kill();
  server.close();
  console.log('Test completed successfully!');
}

run().catch(console.error);
