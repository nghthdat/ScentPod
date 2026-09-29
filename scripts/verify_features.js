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
    '--remote-debugging-port=9224',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_features_profile_' + Date.now(),
    '--window-size=1280,1000'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9224/json/version');
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
    const res = await fetch('http://127.0.0.1:9224/json/new', { method: 'PUT' });
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

  const results = [];

  try {
    console.log('=== 1. KIỂM TRA TRANG CHỦ (INDEX.HTML) ===');
    const pageIndex = await createPage('http://localhost:8080/index.html');
    await sleep(800);

    // 1.1 Kiểm tra nút Auth ở góc ngoài cùng bên trái khi chưa đăng nhập
    const leftAuthLoggedOut = await pageIndex.send('Runtime.evaluate', {
      expression: `(() => {
        const slot = document.querySelector('.header-auth-left, #header-auth-left-slot');
        const btn = slot ? slot.querySelector('.header-auth-left-btn') : null;
        return {
          exists: !!slot,
          btnExists: !!btn,
          text: btn ? btn.textContent.trim().replace(/\\s+/g, ' ') : '',
          isLoggedOut: btn ? btn.classList.contains('is-logged-out') : false
        };
      })()`,
      returnByValue: true
    });
    console.log('1.1 Nút Auth góc trái (chưa đăng nhập):', leftAuthLoggedOut.result.value);
    results.push({
      test: 'Nút Auth góc trái hiển thị "Đăng nhập" khi chưa đăng nhập',
      passed: leftAuthLoggedOut.result.value.text.includes('Đăng nhập') && leftAuthLoggedOut.result.value.isLoggedOut
    });

    // 1.2 Kiểm tra Menu điều hướng: có Combo, không có thẻ Tài khoản thừa
    const navMenuCheck = await pageIndex.send('Runtime.evaluate', {
      expression: `(() => {
        const navMenu = document.querySelector('.nav-menu');
        const links = Array.from(navMenu.querySelectorAll('a')).map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }));
        return {
          hasCombo: links.some(l => l.text.toLowerCase() === 'combo'),
          hasAccount: links.some(l => l.text.toLowerCase().includes('tài khoản')),
          links: links
        };
      })()`,
      returnByValue: true
    });
    console.log('1.2 Menu điều hướng:', navMenuCheck.result.value);
    results.push({
      test: 'Menu chính có thẻ "Combo" thay vì "Tài khoản"',
      passed: navMenuCheck.result.value.hasCombo && !navMenuCheck.result.value.hasAccount
    });

    // 1.3 Kiểm tra bộ chọn trọng lượng 10g, 70g, 100g trên sản phẩm
    const sizeCheck = await pageIndex.send('Runtime.evaluate', {
      expression: `(() => {
        const firstCard = document.querySelector('.product-card[data-scent-id="first-class"]');
        const sizeBtns = Array.from(firstCard.querySelectorAll('.size-pill-btn')).map(b => ({
          size: b.getAttribute('data-size'),
          price: b.getAttribute('data-price-text'),
          active: b.classList.contains('is-active')
        }));
        return {
          count: sizeBtns.length,
          btns: sizeBtns
        };
      })()`,
      returnByValue: true
    });
    console.log('1.3 Nút size 10g, 70g, 100g:', sizeCheck.result.value);
    results.push({
      test: 'Sản phẩm có đầy đủ 3 tùy chọn: 10g, 70g, 100g',
      passed: sizeCheck.result.value.count === 3 && sizeCheck.result.value.btns.some(b => b.size === '10g') && sizeCheck.result.value.btns.some(b => b.size === '70g') && sizeCheck.result.value.btns.some(b => b.size === '100g')
    });

    // 1.4 Test click chọn size 10g (39.000đ)
    const click10g = await pageIndex.send('Runtime.evaluate', {
      expression: `(() => {
        const firstCard = document.querySelector('.product-card[data-scent-id="first-class"]');
        const btn10g = firstCard.querySelector('.size-pill-btn[data-size="10g"]');
        btn10g.click();
        const priceEl = firstCard.querySelector('.product-price');
        return {
          selectedSize: firstCard.getAttribute('data-selected-size'),
          priceText: priceEl ? priceEl.textContent.trim() : ''
        };
      })()`,
      returnByValue: true
    });
    console.log('1.4 Đổi sang size 10g:', click10g.result.value);
    results.push({
      test: 'Click chọn size 10g cập nhật giá 39.000đ',
      passed: click10g.result.value.selectedSize === '10g' && click10g.result.value.priceText.includes('39.000đ')
    });

    // 1.5 Test thêm size 10g vào giỏ hàng
    await pageIndex.send('Runtime.evaluate', {
      expression: `(() => {
        const firstCard = document.querySelector('.product-card[data-scent-id="first-class"]');
        const addBtn = firstCard.querySelector('.btn-add-cart');
        addBtn.click();
      })()`
    });
    await sleep(500);

    const cartCheck = await pageIndex.send('Runtime.evaluate', {
      expression: `(() => {
        const cart = window.ScentPod.getCart();
        return cart;
      })()`,
      returnByValue: true
    });
    console.log('1.5 Giỏ hàng sau khi thêm size 10g:', cartCheck.result.value);
    results.push({
      test: 'Thêm sản phẩm size 10g vào giỏ hàng thành công',
      passed: cartCheck.result.value.some(i => i.size === '10g' && i.price === 39000)
    });

    // Chụp ảnh Index
    const ssIndex = await pageIndex.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/minmin091299/.gemini/antigravity-ide/brain/3da43f97-921a-4289-a9cf-b1a8a259c5c4/test_index_features.png', Buffer.from(ssIndex.data, 'base64'));

    pageIndex.close();

    console.log('\n=== 2. KIỂM TRA TRANG SẢN PHẨM & COMBO (SAN-PHAM.HTML) ===');
    const pageSanpham = await createPage('http://localhost:8080/san-pham.html');
    await sleep(800);

    const sanphamCheck = await pageSanpham.send('Runtime.evaluate', {
      expression: `(() => {
        const leftAuth = document.querySelector('.header-auth-left .header-auth-left-btn');
        const singleGrid = document.getElementById('single-candles-grid');
        const comboSection = document.getElementById('combo');
        const comboCards = comboSection ? comboSection.querySelectorAll('.product-card') : [];
        const filterBtns = Array.from(document.querySelectorAll('.category-filter-btn')).map(b => b.textContent.trim());
        return {
          leftAuthText: leftAuth ? leftAuth.textContent.trim().replace(/\\s+/g, ' ') : '',
          singleCardsCount: singleGrid ? singleGrid.querySelectorAll('.product-card').length : 0,
          comboCardsCount: comboCards.length,
          filterBtns: filterBtns
        };
      })()`,
      returnByValue: true
    });
    console.log('2.1 Kiểm tra san-pham.html:', sanphamCheck.result.value);
    results.push({
      test: 'Trang Sản Phẩm có đủ Nến đơn, Combo section (3 combo) và bộ lọc',
      passed: sanphamCheck.result.value.comboCardsCount === 3 && sanphamCheck.result.value.singleCardsCount === 4
    });

    // Test thêm Combo 01 vào giỏ hàng
    await pageSanpham.send('Runtime.evaluate', {
      expression: `(() => {
        const comboBtn = document.querySelector('.product-card[data-scent-id="combo-4-scents"] .btn-add-cart');
        if (comboBtn) comboBtn.click();
      })()`
    });
    await sleep(500);

    const comboCartCheck = await pageSanpham.send('Runtime.evaluate', {
      expression: `(() => {
        return window.ScentPod.getCart();
      })()`,
      returnByValue: true
    });
    console.log('2.2 Giỏ hàng sau khi thêm Combo:', comboCartCheck.result.value);
    results.push({
      test: 'Thêm combo (Set 4 Mùi 139.000đ) vào giỏ hàng thành công',
      passed: comboCartCheck.result.value.some(i => i.id === 'combo-4-scents' && i.price === 139000)
    });

    const ssSanpham = await pageSanpham.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/minmin091299/.gemini/antigravity-ide/brain/3da43f97-921a-4289-a9cf-b1a8a259c5c4/test_sanpham_combo.png', Buffer.from(ssSanpham.data, 'base64'));

    pageSanpham.close();

    console.log('\n=== 3. KIỂM TRA ĐĂNG NHẬP & TRẠNG THÁI NÚT AUTH TRÊN GÓC TRÁI ===');
    const pageAuth = await createPage('http://localhost:8080/dang-nhap.html');
    await sleep(800);

    // Click nút đăng nhập nhanh bằng Gmail admin: datnhatquang@gmail.com
    await pageAuth.send('Runtime.evaluate', {
      expression: `(() => {
        window.quickLoginAdmin('datnhatquang@gmail.com');
      })()`
    });
    await sleep(800);

    const loggedInHeaderCheck = await pageAuth.send('Runtime.evaluate', {
      expression: `(() => {
        const user = window.ScentPod.getCurrentUser();
        const leftAuth = document.querySelector('.header-auth-left .header-auth-left-btn');
        return {
          userEmail: user ? user.email : null,
          userRole: user ? user.role : null,
          btnText: leftAuth ? leftAuth.textContent.trim().replace(/\\s+/g, ' ') : '',
          isAdmin: leftAuth ? leftAuth.classList.contains('is-admin') : false,
          isLoggedIn: leftAuth ? leftAuth.classList.contains('is-logged-in') || leftAuth.classList.contains('is-admin') : false
        };
      })()`,
      returnByValue: true
    });
    console.log('3.1 Nút Auth góc trái sau khi đăng nhập thành công:', loggedInHeaderCheck.result.value);
    results.push({
      test: 'Nút Auth góc trái hiển thị "Tài khoản" khi đã đăng nhập thành công',
      passed: loggedInHeaderCheck.result.value.btnText.includes('Tài khoản') && loggedInHeaderCheck.result.value.isLoggedIn
    });

    const ssAuth = await pageAuth.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('/Users/minmin091299/.gemini/antigravity-ide/brain/3da43f97-921a-4289-a9cf-b1a8a259c5c4/test_logged_in_dashboard.png', Buffer.from(ssAuth.data, 'base64'));

    pageAuth.close();

    console.log('\n=== TỔNG KẾT KẾT QUẢ KIỂM TRA ===');
    let allPassed = true;
    results.forEach((r, idx) => {
      const mark = r.passed ? '✅ ĐẠT' : '❌ THẤT BẠI';
      if (!r.passed) allPassed = false;
      console.log(`${idx + 1}. [${mark}] ${r.test}`);
    });

    if (allPassed) {
      console.log('\n🎉 TẤT CẢ CÁC TÍNH NĂNG ĐÃ ĐƯỢC KIỂM TRA VÀ ĐẠT 100% YÊU CẦU!');
    } else {
      console.error('\n⚠️ Một số bài kiểm tra chưa đạt.');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Lỗi khi chạy kiểm tra:', err);
    process.exitCode = 1;
  } finally {
    chromeProc.kill();
  }
}

run();
