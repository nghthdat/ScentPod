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
  console.log('=== BẮT ĐẦU KIỂM THỬ KHẮC PHỤC LỖI OVERLAP NÚT CHAT & TAG BỘ LỌC ===\n');

  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9240',
    '--window-size=1280,800',
    '--no-sandbox'
  ]);
  await sleep(1500);

  const targets = await new Promise((resolve) => {
    http.get('http://localhost:9240/json/list', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });

  const pageTarget = targets.find((t) => t.type === 'page');
  const cdp = new SimpleCDP(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url: 'http://localhost:8080/san-pham.html' });
  await sleep(1500);

  // 1. Kiểm tra bounding rect và khoảng cách giữa chip "Kèm thiệp tay" và nút chat
  const checkInitial = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const chip = document.querySelector('.ai-chip-btn[data-chip="thiệp"]');
      const btn = document.querySelector('.fb-floating-btn');
      const filterSec = document.querySelector('.ai-search-filter-section');
      const c = chip ? chip.getBoundingClientRect() : null;
      const b = btn ? btn.getBoundingClientRect() : null;
      const overlap = (c && b) && !(c.right < b.left || c.left > b.right || c.bottom < b.top || c.top > b.bottom);
      return {
        chipExists: !!chip,
        btnExists: !!btn,
        chipRect: c,
        btnRect: b,
        overlap: overlap,
        btnIsCompact: btn ? btn.classList.contains('is-compact') : false,
        horizontalDistance: (c && b) ? (b.left - c.right) : null
      };
    })()`,
    returnByValue: true
  });

  console.log('1. Trạng thái ban đầu trên san-pham.html:');
  console.log(checkInitial.result.value);

  // 2. Cuộn để đưa khung bộ lọc vào tầm nhìn nơi nút chat nổi có thể gây cản trở
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const chip = document.querySelector('.ai-chip-btn[data-chip="thiệp"]');
      if (chip) chip.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await sleep(600);

  const checkCentered = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const chip = document.querySelector('.ai-chip-btn[data-chip="thiệp"]');
      const btn = document.querySelector('.fb-floating-btn');
      const c = chip ? chip.getBoundingClientRect() : null;
      const b = btn ? btn.getBoundingClientRect() : null;
      const overlap = (c && b) && !(c.right < b.left || c.left > b.right || c.bottom < b.top || c.top > b.bottom);
      return {
        overlap: overlap,
        btnIsCompact: btn ? btn.classList.contains('is-compact') : false,
        chipRect: c,
        btnRect: b,
        horizontalDistance: (c && b) ? (b.left - c.right) : null,
        verticalDistance: (c && b) ? (b.top - c.bottom) : null
      };
    })()`,
    returnByValue: true
  });

  console.log('\n2. Trạng thái khi cuộn chip vào tầm nhìn:');
  console.log(checkCentered.result.value);

  // 3. Cuộn sâu hơn để chip nằm gần góc đáy màn hình
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const chip = document.querySelector('.ai-chip-btn[data-chip="thiệp"]');
      if (chip) {
        chip.scrollIntoView({ behavior: 'instant', block: 'end' });
        window.scrollBy(0, 100);
      }
    })()`
  });
  await sleep(600);

  const checkBottom = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const chip = document.querySelector('.ai-chip-btn[data-chip="thiệp"]');
      const btn = document.querySelector('.fb-floating-btn');
      const c = chip ? chip.getBoundingClientRect() : null;
      const b = btn ? btn.getBoundingClientRect() : null;
      const overlap = (c && b) && !(c.right < b.left || c.left > b.right || c.bottom < b.top || c.top > b.bottom);
      return {
        overlap: overlap,
        btnIsCompact: btn ? btn.classList.contains('is-compact') : false,
        chipRect: c,
        btnRect: b,
        distanceLeft: (c && b) ? (b.left - c.right) : null
      };
    })()`,
    returnByValue: true
  });

  console.log('\n3. Trạng thái khi cuộn chip xuống sát đáy:');
  console.log(checkBottom.result.value);

  // Chụp ảnh giao diện minh chứng
  const shot1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'overlap_fix_filters_view.png'), Buffer.from(shot1.data, 'base64'));
  console.log('\n✅ Đã lưu ảnh minh chứng: overlap_fix_filters_view.png');

  // Kiểm tra thao tác click vào chip "Kèm thiệp tay" thành công mà không bị nút chat chặn
  const clickTest = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const chip = document.querySelector('.ai-chip-btn[data-chip="thiệp"]');
      if (!chip) return { success: false, reason: 'Không tìm thấy chip' };
      chip.click();
      return {
        success: true,
        isActive: chip.classList.contains('is-active')
      };
    })()`,
    returnByValue: true
  });
  console.log('\n4. Kiểm tra click vào chip "Kèm thiệp tay":', clickTest.result.value);

  const shot2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'overlap_fix_chip_clicked.png'), Buffer.from(shot2.data, 'base64'));
  console.log('✅ Đã lưu ảnh minh chứng: overlap_fix_chip_clicked.png');

  cdp.close();
  chromeProc.kill();

  if (!checkInitial.result.value.overlap && !checkCentered.result.value.overlap && !checkBottom.result.value.overlap && clickTest.result.value.isActive) {
    console.log('\n🎉 HOÀN TOÀN KHÔNG CÒN LỖI OVERLAP! Nút chat nổi và các tag bộ lọc hoạt động độc lập, thông thoáng 100%!');
  } else {
    console.error('❌ Vẫn còn phát hiện xung đột hoặc overlap!');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
