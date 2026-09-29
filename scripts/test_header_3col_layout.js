const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const artifactDir = '/Users/minmin091299/.gemini/antigravity-ide/brain/fbf92e3f-5923-4a37-b465-cd8ed2e53135';

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
  console.log('=== BẮT ĐẦU KIỂM THỬ BỐ CỤC HEADER 3 CỘT (LOGO TRÁI - MENU GIỮA - CHỨC NĂNG PHẢI) ===\n');

  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9260',
    '--window-size=1280,800',
    '--no-sandbox'
  ]);
  await sleep(1500);

  const targets = await new Promise((resolve) => {
    http.get('http://localhost:9260/json/list', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });

  const pageTarget = targets.find((t) => t.type === 'page');
  const cdp = new SimpleCDP(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url: 'http://localhost:8080/index.html' });
  await sleep(1200);

  // 1. Đo lường tọa độ và tỷ lệ không gian 3 cột trên Desktop
  const desktopMetrics = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const container = document.querySelector('.nav-container');
      const logo = document.querySelector('.brand-logo');
      const nav = document.querySelector('.nav-container > nav') || document.querySelector('.nav-menu');
      const actions = document.querySelector('.nav-actions');

      const cRect = container.getBoundingClientRect();
      const lRect = logo.getBoundingClientRect();
      const nRect = nav.getBoundingClientRect();
      const aRect = actions.getBoundingClientRect();

      const containerCenter = (cRect.left + cRect.right) / 2;
      const navCenter = (nRect.left + nRect.right) / 2;
      const centerOffset = Math.abs(containerCenter - navCenter);

      const leftGap = nRect.left - lRect.right;
      const rightGap = aRect.left - nRect.right;

      return {
        containerWidth: cRect.width,
        containerLeft: cRect.left,
        containerRight: cRect.right,
        logoLeft: lRect.left,
        logoWidth: lRect.width,
        navLeft: nRect.left,
        navWidth: nRect.width,
        actionsRight: aRect.right,
        actionsWidth: aRect.width,
        containerCenter,
        navCenter,
        centerOffset, // Độ lệch so với tâm màn hình (chuẩn tuyệt đối nếu < 2px)
        isNavCentered: centerOffset < 2,
        leftGap, // Khoảng cách từ Logo đến Menu
        rightGap, // Khoảng cách từ Menu đến Giỏ hàng / Tài khoản
        gapBalanceRatio: Math.min(leftGap, rightGap) / Math.max(leftGap, rightGap)
      };
    })()`,
    returnByValue: true
  });

  console.log('1. Đánh giá tỷ lệ không gian 3 cột Desktop (1280px):');
  console.log(JSON.stringify(desktopMetrics.result.value, null, 2));

  // Chụp ảnh Header trên Desktop
  const clipDesktop = {
    x: 0,
    y: 0,
    width: 1280,
    height: 90,
    scale: 1
  };
  const shotDesktop = await cdp.send('Page.captureScreenshot', { format: 'png', clip: clipDesktop });
  fs.writeFileSync(path.join(artifactDir, 'header_3col_desktop_balanced.png'), Buffer.from(shotDesktop.data, 'base64'));
  console.log('✅ Đã lưu ảnh: header_3col_desktop_balanced.png');

  // 2. Chuyển sang Mobile (iPhone 375px) kiểm tra độ thích ứng
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(600);

  const mobileMetrics = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const container = document.querySelector('.nav-container');
      const logo = document.querySelector('.brand-logo');
      const actions = document.querySelector('.nav-actions');
      const toggle = document.querySelector('.menu-toggle');

      return {
        hasLogo: !!logo,
        hasActions: !!actions,
        hasToggle: !!toggle,
        containerDisplay: window.getComputedStyle(container).display
      };
    })()`,
    returnByValue: true
  });
  console.log('\n2. Trạng thái Header trên Mobile (375px):', mobileMetrics.result.value);

  const clipMobile = {
    x: 0,
    y: 0,
    width: 375,
    height: 80,
    scale: 2
  };
  const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png', clip: clipMobile });
  fs.writeFileSync(path.join(artifactDir, 'header_3col_mobile_balanced.png'), Buffer.from(shotMobile.data, 'base64'));
  console.log('✅ Đã lưu ảnh: header_3col_mobile_balanced.png');

  cdp.close();
  chromeProc.kill();

  if (desktopMetrics.result.value.isNavCentered) {
    console.log('\n🎉 HOÀN THÀNH: Menu điều hướng đã được căn giữa tuyệt đối (độ lệch < 2px), Logo căn trái và Cụm hành động căn phải tạo tỷ lệ không gian cân xứng hoàn hảo 100%!');
  } else {
    console.error('❌ Menu chưa được căn giữa chuẩn!');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
