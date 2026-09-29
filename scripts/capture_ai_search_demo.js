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
    '--remote-debugging-port=9231',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_ai_luxury_' + Date.now(),
    '--window-size=1280,1150'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9231/json/version');
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
    const res = await fetch('http://127.0.0.1:9231/json/new', { method: 'PUT' });
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
    console.log('=== 1. CHỤP GIAO DIỆN LUXURY AI CONTROL CENTER TỔNG THỂ ===');
    const page = await createPage('http://localhost:8080/san-pham.html');
    await sleep(1000);

    // Cuộn nhẹ tới đầu thanh AI search
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('ai-search-filter-section');
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset - 85;
          window.scrollTo({ top, behavior: 'instant' });
        }
      })()`
    });
    await sleep(500);

    const ssOverview = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'ai_search_luxury_overview.png'), Buffer.from(ssOverview.data, 'base64'));
    console.log('✅ Đã lưu ai_search_luxury_overview.png');

    // 2. Chụp Dropdown gợi ý trực tiếp (Suggestions Popover)
    console.log('=== 2. CHỤP DROPDOWN GỢI Ý TRỰC TIẾP AI (SUGGESTIONS POPOVER) ===');
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.getElementById('ai-product-search-input');
        if (input) {
          input.focus();
          input.dispatchEvent(new Event('focus'));
        }
      })()`
    });
    await sleep(800);

    const ssPopover = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'ai_search_popover_suggestions.png'), Buffer.from(ssPopover.data, 'base64'));
    console.log('✅ Đã lưu ai_search_popover_suggestions.png');

    // 3. Lọc theo Phân Loại "Sáp bỏ túi 50g (SP01)" và Mục đích AI "Học bài & Ôn thi"
    console.log('=== 3. CHỤP BỘ LỌC CHÍNH XÁC: PHÂN LOẠI SP01 & MỤC ĐÍCH HỌC BÀI ===');
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.getElementById('ai-product-search-input');
        if (input) input.value = '';
        const popover = document.getElementById('ai-search-suggestions');
        if (popover) popover.style.display = 'none';

        const typeSelect = document.getElementById('filter-type-select');
        if (typeSelect) {
          typeSelect.value = 'sp01';
          typeSelect.dispatchEvent(new Event('change'));
        }

        const purposeSelect = document.getElementById('filter-purpose-select');
        if (purposeSelect) {
          purposeSelect.value = 'study';
          purposeSelect.dispatchEvent(new Event('change'));
        }
      })()`
    });
    await sleep(800);

    const ssFilterPrecise = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'ai_search_purpose_filter.png'), Buffer.from(ssFilterPrecise.data, 'base64'));
    console.log('✅ Đã lưu ai_search_purpose_filter.png');

    // 4. Lọc chỉ xem Gói Combo Chiến Lược
    console.log('=== 4. CHỤP KHI LỌC RIÊNG COMBO CHIẾN LƯỢC (KHÔNG GẶP KHOẢNG TRỐNG THỪA) ===');
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) resetBtn.click();
        const comboTab = document.querySelector('.category-filter-btn[data-filter="combo"]');
        if (comboTab) comboTab.click();
      })()`
    });
    await sleep(800);

    const ssComboFilter = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'ai_search_combo_seamless.png'), Buffer.from(ssComboFilter.data, 'base64'));
    console.log('✅ Đã lưu ai_search_combo_seamless.png');

    page.close();
    console.log('\n🎉 ĐÃ CHỤP THÀNH CÔNG TẤT CẢ SCREENSHOT NÂNG CẤP!');
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Lỗi khi chụp ảnh:', err);
  process.exit(1);
});
