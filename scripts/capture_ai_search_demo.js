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
    '--remote-debugging-port=9229',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_ai_search_' + Date.now(),
    '--window-size=1280,1100'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9229/json/version');
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
    const res = await fetch('http://127.0.0.1:9229/json/new', { method: 'PUT' });
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
    console.log('=== 1. CHỤP GIAO DIỆN TÌM KIẾM AI & BỘ LỌC TỔNG THỂ (DEFAULT) ===');
    const page = await createPage('http://localhost:8080/san-pham.html');
    await sleep(1000);

    // Cuộn nhẹ tới đầu thanh AI search
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('ai-search-filter-section');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await sleep(500);

    const ssOverview = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'ai_search_overview.png'), Buffer.from(ssOverview.data, 'base64'));
    console.log('✅ Đã lưu ai_search_overview.png');

    // 2. Click AI Chip "học bài"
    console.log('=== 2. CHỤP KHI BẤM CHIP AI "học bài" (LỌC THEO MỤC ĐÍCH SINH VIÊN) ===');
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        const chip = document.querySelector('.ai-chip-btn[data-chip="học bài"]');
        if (chip) chip.click();
      })()`
    });
    await sleep(700);

    const ssChip = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'ai_search_chip_filter.png'), Buffer.from(ssChip.data, 'base64'));
    console.log('✅ Đã lưu ai_search_chip_filter.png');

    // 3. Kết hợp chọn bộ lọc: Giá "Trên 100k" và Ưu đãi "Đồng giá ship 15k"
    console.log('=== 3. CHỤP KẾT HỢP BỘ LỌC: SHIP 15K + COMBO TRÊN 100K ===');
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        // Reset chip trước
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) resetBtn.click();
      })()`
    });
    await sleep(300);

    await page.send('Runtime.evaluate', {
      expression: `(() => {
        const dealSelect = document.getElementById('filter-deal-select');
        if (dealSelect) {
          dealSelect.value = 'ship15k';
          dealSelect.dispatchEvent(new Event('change'));
        }
        const priceSelect = document.getElementById('filter-price-select');
        if (priceSelect) {
          priceSelect.value = 'over-100k';
          priceSelect.dispatchEvent(new Event('change'));
        }
      })()`
    });
    await sleep(700);

    const ssCombined = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'ai_search_combined_filter.png'), Buffer.from(ssCombined.data, 'base64'));
    console.log('✅ Đã lưu ai_search_combined_filter.png');

    // 4. Tìm kiếm từ khóa không khớp để xem Empty State
    console.log('=== 4. CHỤP TRẠNG THÁI KHÔNG TÌM THẤY SẢN PHẨM (EMPTY STATE SANG TRỌNG) ===');
    await page.send('Runtime.evaluate', {
      expression: `(() => {
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) resetBtn.click();
        const input = document.getElementById('ai-product-search-input');
        if (input) {
          input.value = 'mùi hoa lavender tím vô định';
          input.dispatchEvent(new Event('input'));
        }
      })()`
    });
    await sleep(700);

    const ssEmpty = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'ai_search_empty_state.png'), Buffer.from(ssEmpty.data, 'base64'));
    console.log('✅ Đã lưu ai_search_empty_state.png');

    page.close();
    console.log('\n🎉 ĐÃ CHỤP THÀNH CÔNG TẤT CẢ SCREENSHOT MINH HỌA!');
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Lỗi khi chụp ảnh:', err);
  process.exit(1);
});
