const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEST = '/Users/minmin091299/.gemini/antigravity-ide/brain/654cb005-8a8e-4de5-afc1-859808fa9ae5';

async function runVerification() {
  console.log('🚀 Bắt đầu khởi động Chrome để kiểm thử toàn diện...');

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const targets = await fetch('http://127.0.0.1:9223/json').then(r => r.json());
  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const consoleErrors = [];

  ws.addEventListener('message', (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        consoleErrors.push(data.params.args.map(a => a.value || a.description).join(' '));
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(data.params.exceptionDetails.text);
    }
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const curId = id++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  async function setViewport(width, height, isMobile = false) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile
    });
  }

  async function navigate(url) {
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 600));
  }

  async function takeScreenshot(filePath) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`📸 Đã lưu ảnh: ${path.basename(filePath)} (${fs.statSync(filePath).size} bytes)`);
  }

  async function evaluate(code) {
    const res = await send('Runtime.evaluate', { expression: code, returnByValue: true });
    return res.result.value;
  }

  const results = {
    navigation: {},
    facebookLinks: {},
    consoleErrors: [],
    screenshots: []
  };

  // ==========================================
  // 1. KIỂM THỬ GIAO DIỆN DESKTOP (1280x800)
  // ==========================================
  console.log('\n--- 1. Kiểm thử Desktop (1280x800) ---');
  await setViewport(1280, 800, false);

  // Index
  await navigate('http://127.0.0.1:8080/index.html');
  const indexActive = await evaluate('document.querySelector(".nav-link.active")?.innerText');
  results.navigation['index_desktop_active'] = indexActive;
  await takeScreenshot(path.join(DEST, 'desktop_index.png'));

  // San Pham
  await navigate('http://127.0.0.1:8080/san-pham.html');
  const spActive = await evaluate('document.querySelector(".nav-link.active")?.innerText');
  results.navigation['san_pham_desktop_active'] = spActive;
  await takeScreenshot(path.join(DEST, 'desktop_san_pham.png'));

  // Ve Chung Toi
  await navigate('http://127.0.0.1:8080/ve-chung-toi.html');
  const vctActive = await evaluate('document.querySelector(".nav-link.active")?.innerText');
  results.navigation['ve_chung_toi_desktop_active'] = vctActive;
  await takeScreenshot(path.join(DEST, 'desktop_ve_chung_toi.png'));

  // ==========================================
  // 2. KIỂM THỬ LIÊN KẾT FACEBOOK
  // ==========================================
  console.log('\n--- 2. Kiểm thử liên kết Facebook ([data-fb]) ---');
  const fbCheck = await evaluate(`(() => {
    const els = Array.from(document.querySelectorAll('[data-fb]'));
    return els.map(el => ({
      tag: el.tagName,
      href: el.getAttribute('href'),
      target: el.getAttribute('target'),
      rel: el.getAttribute('rel'),
      text: el.innerText.trim()
    }));
  })()`);
  results.facebookLinks = fbCheck;
  console.log(`Tìm thấy ${fbCheck.length} nút/liên kết Facebook trên trang ve-chung-toi.html:`);
  fbCheck.forEach((b, idx) => {
    console.log(`  [${idx + 1}] "${b.text}" -> href: ${b.href} | target: ${b.target} | rel: ${b.rel}`);
  });

  // ==========================================
  // 3. KIỂM THỬ MOBILE (~390px iPhone)
  // ==========================================
  console.log('\n--- 3. Kiểm thử Mobile Responsive (390x844) ---');
  await setViewport(390, 844, true);

  // Mobile Index
  await navigate('http://127.0.0.1:8080/index.html');
  const mobileOverflow = await evaluate(`(() => {
    const docW = document.documentElement.scrollWidth;
    const winW = window.innerWidth;
    return { docW, winW, hasOverflow: docW > winW };
  })()`);
  console.log('Kiểm tra tràn viền mobile index:', mobileOverflow);
  await takeScreenshot(path.join(DEST, 'mobile_index.png'));

  // Thử click nút Hamburger Menu trên Mobile
  console.log('Thử click mở Hamburger Menu...');
  await evaluate(`document.querySelector('.menu-toggle').click()`);
  await new Promise(r => setTimeout(r, 400));
  const isMenuOpen = await evaluate(`document.querySelector('.nav-menu').classList.contains('is-open')`);
  console.log('Trạng thái menu mở:', isMenuOpen);
  await takeScreenshot(path.join(DEST, 'mobile_menu_open.png'));

  // Mobile San Pham
  await navigate('http://127.0.0.1:8080/san-pham.html');
  await takeScreenshot(path.join(DEST, 'mobile_san_pham.png'));

  // Mobile Ve Chung Toi
  await navigate('http://127.0.0.1:8080/ve-chung-toi.html');
  await takeScreenshot(path.join(DEST, 'mobile_ve_chung_toi.png'));

  // ==========================================
  // 4. KIỂM TRA LỖI CONSOLE
  // ==========================================
  console.log('\n--- 4. Kiểm tra Console Errors ---');
  console.log(`Số lỗi console phát hiện: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Chi tiết lỗi console:', consoleErrors);
  } else {
    console.log('✅ ZERO CONSOLE ERRORS! (Không có bất kỳ lỗi nào)');
  }

  results.consoleErrors = consoleErrors;

  ws.close();
  chrome.kill();
  console.log('\n🎉 Hoàn thành kiểm thử!');
  fs.writeFileSync(path.join(DEST, 'test_summary.json'), JSON.stringify(results, null, 2));
}

runVerification().catch(err => {
  console.error('Lỗi khi chạy script kiểm thử:', err);
  process.exit(1);
});
