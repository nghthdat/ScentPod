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
    '--disable-gpu',
    '--remote-debugging-port=9226',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_fb_flow_' + Date.now(),
    '--window-size=1280,1000'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      const res = await fetch('http://127.0.0.1:9226/json/version');
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Không kết nối được Chrome');
    chromeProc.kill();
    process.exit(1);
  }

  const browserCdp = new SimpleCDP(wsUrl);
  await browserCdp.connect();

  async function createPage(url) {
    const target = await browserCdp.send('Target.createTarget', { url });
    const pageTargets = await fetch('http://127.0.0.1:9226/json/list').then(r => r.json());
    const pageTarget = pageTargets.find(t => t.id === target.targetId);
    const cdp = new SimpleCDP(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');
    await sleep(800);
    return { cdp, targetId: target.targetId };
  }

  console.log('=== KIỂM THỬ GIAO DIỆN & LUỒNG FACEBOOK INBOX SCENTPOD ===\n');

  // 1. KIỂM TRA TRANG CHỦ (INDEX.HTML)
  console.log('--- 1. Kiểm tra Trang chủ (index.html) ---');
  const { cdp: pageHome } = await createPage('http://localhost:3000/index.html');

  const homeHeaderCheck = await pageHome.send('Runtime.evaluate', {
    expression: `(() => {
      const headerAuth = document.querySelector('#header-auth-btn, .header-auth-btn');
      const headerCart = document.querySelector('#open-cart-btn, .nav-cart-btn');
      const headerFb = document.querySelector('.header-fb-btn');
      const footerAuthLink = document.querySelector('footer a[href*="dang-nhap"]');
      const inboxBtns = document.querySelectorAll('.btn-inbox-order');
      const detailBtns = document.querySelectorAll('.btn-scent-detail');
      return {
        hasHeaderAuth: !!headerAuth,
        hasHeaderCart: !!headerCart,
        hasHeaderFb: !!headerFb,
        headerFbText: headerFb ? headerFb.innerText.trim() : null,
        headerFbHref: headerFb ? (headerFb.href || headerFb.getAttribute('href')) : null,
        hasFooterAuthLink: !!footerAuthLink,
        inboxBtnsCount: inboxBtns.length,
        detailBtnsCount: detailBtns.length
      };
    })()`,
    returnByValue: true
  });
  console.log('Kết quả kiểm tra header & nút trên Trang chủ:', homeHeaderCheck.result.value);

  // 2. KIỂM TRA TRANG SẢN PHẨM (SAN-PHAM.HTML)
  console.log('\n--- 2. Kiểm tra Trang Sản Phẩm (san-pham.html) ---');
  const { cdp: pageProduct } = await createPage('http://localhost:3000/san-pham.html');

  const productHeaderCheck = await pageProduct.send('Runtime.evaluate', {
    expression: `(() => {
      const headerAuth = document.querySelector('#header-auth-btn, .header-auth-btn');
      const headerCart = document.querySelector('#open-cart-btn, .nav-cart-btn');
      const headerFb = document.querySelector('.header-fb-btn');
      const footerAuthLink = document.querySelector('footer a[href*="dang-nhap"]');
      const singleInboxBtns = document.querySelectorAll('#single-candles-grid .btn-inbox-order');
      const comboInboxBtns = document.querySelectorAll('#combo-grid .btn-inbox-order');
      return {
        hasHeaderAuth: !!headerAuth,
        hasHeaderCart: !!headerCart,
        hasHeaderFb: !!headerFb,
        headerFbText: headerFb ? headerFb.innerText.trim() : null,
        hasFooterAuthLink: !!footerAuthLink,
        singleInboxBtnsCount: singleInboxBtns.length,
        comboInboxBtnsCount: comboInboxBtns.length
      };
    })()`,
    returnByValue: true
  });
  console.log('Kết quả kiểm tra trên Trang Sản phẩm:', productHeaderCheck.result.value);

  // 3. KIỂM TRA BẤM XEM CHI TIẾT SẢN PHẨM (MỞ MODAL & CHỌN SIZE & INBOX FACEBOOK)
  console.log('\n--- 3. Kiểm tra Modal Tầng Hương & Nút Inbox Facebook ---');
  await pageProduct.send('Runtime.evaluate', {
    expression: `(() => {
      const firstDetailBtn = document.querySelector('.btn-scent-detail[data-open-scent="first-class"]');
      if (firstDetailBtn) firstDetailBtn.click();
    })()`
  });
  await sleep(600);

  const modalCheck = await pageProduct.send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('#scent-detail-modal');
      const isOpen = modal ? modal.classList.contains('is-open') : false;
      const sizePills = modal ? Array.from(modal.querySelectorAll('.modal-size-pill')).map(p => ({
        size: p.getAttribute('data-modal-size'),
        text: p.innerText.trim(),
        isActive: p.classList.contains('is-active')
      })) : [];
      const priceText = modal ? modal.querySelector('#scent-modal-price').innerText.trim() : '';
      const giftText = modal ? modal.querySelector('#modal-gift-text').innerText.trim() : '';
      const inboxBtn = modal ? modal.querySelector('#btn-modal-inbox') : null;
      return {
        isOpen,
        sizePills,
        priceText,
        giftText,
        hasInboxBtn: !!inboxBtn,
        inboxBtnText: inboxBtn ? inboxBtn.innerText.trim() : ''
      };
    })()`,
    returnByValue: true
  });
  console.log('Kết quả kiểm tra Modal khi mở:', modalCheck.result.value);

  // Test chuyển đổi phân loại trong Modal sang Sáp 50g (SP01)
  console.log('\n--- 3.1 Chuyển phân loại sang Sáp 50g (SP01) trong Modal ---');
  await pageProduct.send('Runtime.evaluate', {
    expression: `(() => {
      const sp01Btn = document.querySelector('.modal-size-pill[data-modal-size="sp01"]');
      if (sp01Btn) sp01Btn.click();
    })()`
  });
  await sleep(200);

  const sizeSwitchCheck = await pageProduct.send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('#scent-detail-modal');
      const priceText = modal ? modal.querySelector('#scent-modal-price').innerText.trim() : '';
      const giftText = modal ? modal.querySelector('#modal-gift-text').innerText.trim() : '';
      const activeSize = modal ? modal.querySelector('.modal-size-pill.is-active').getAttribute('data-modal-size') : '';
      return { activeSize, priceText, giftText };
    })()`,
    returnByValue: true
  });
  console.log('Kết quả sau khi chọn Sáp 50g trong Modal:', sizeSwitchCheck.result.value);

  // Chụp ảnh Modal
  const screenshotData = await pageProduct.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot_verify_modal_facebook.png', Buffer.from(screenshotData.data, 'base64'));
  console.log('📸 Đã lưu ảnh minh chứng: screenshot_verify_modal_facebook.png');

  // Đóng modal
  await pageProduct.send('Runtime.evaluate', {
    expression: `(() => {
      const closeBtn = document.querySelector('.scent-modal-close');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await sleep(300);

  // Chụp ảnh Header & Hero trang chủ
  const homeScreenshot = await pageHome.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot_verify_header_home.png', Buffer.from(homeScreenshot.data, 'base64'));
  console.log('📸 Đã lưu ảnh minh chứng: screenshot_verify_header_home.png');

  // Đóng Chrome
  browserCdp.close();
  chromeProc.kill();
  console.log('\n✅ TẤT CẢ CÁC BƯỚC KIỂM THỬ ĐÃ HOÀN TẤT THÀNH CÔNG!');
}

run().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
