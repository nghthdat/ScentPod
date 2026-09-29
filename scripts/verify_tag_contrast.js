const { spawn } = require('child_process');
const http = require('http');
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
    '--remote-debugging-port=9245',
    '--window-size=1280,900',
    '--no-sandbox'
  ]);

  console.log('=== KIỂM THỬ ĐỘ TƯƠNG PHẢN (CONTRAST) CỦA CÁC TAG TRONG DARK MODE ===\n');

  try {
    await sleep(1500);

    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9245/json/list', (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = targets.find((t) => t.type === 'page');
    const cdp = new SimpleCDP(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:8080/san-pham.html' });
    await sleep(1500);

    // 1. Phân tích computed style của các tag chưa được chọn
    const evalResult = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const chips = Array.from(document.querySelectorAll('.ai-chip-btn'));
        const chipThucKhuya = document.querySelector('.ai-chip-btn[data-chip="thức khuya"]');
        const chipKhuMui = document.querySelector('.ai-chip-btn[data-chip="khử mùi"]');
        const container = document.querySelector('.ai-search-filter-section');
        
        function getStyles(el) {
          const comp = window.getComputedStyle(el);
          return {
            text: el.textContent.trim(),
            color: comp.color,
            backgroundColor: comp.backgroundColor,
            borderColor: comp.borderColor,
            fontWeight: comp.fontWeight,
            fontSize: comp.fontSize,
            boxShadow: comp.boxShadow
          };
        }

        return {
          containerBg: window.getComputedStyle(container).backgroundColor,
          totalChips: chips.length,
          thucKhuya: getStyles(chipThucKhuya),
          khuMui: getStyles(chipKhuMui)
        };
      })()`,
      returnByValue: true
    });

    console.log('1. Thông số độ tương phản của các Tag (Unselected State):');
    console.log(JSON.stringify(evalResult.result.value, null, 2));

    // 2. Chụp ảnh cận cảnh khu vực Gợi ý & Tags tìm kiếm
    const clipResult = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cloud = document.querySelector('.ai-keywords-cloud');
        const rect = cloud.getBoundingClientRect();
        return {
          x: Math.max(0, rect.x - 20),
          y: Math.max(0, rect.y - 20),
          width: rect.width + 40,
          height: rect.height + 40,
          scale: 1
        };
      })()`,
      returnByValue: true
    });

    const clip = clipResult.result.value;
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: clip
    });
    const imgPath = path.join(artifactDir, 'tag_contrast_improved_closeup.png');
    fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
    console.log('\n✅ Đã lưu ảnh cận cảnh các tag mới: tag_contrast_improved_closeup.png');

    // 3. Chụp ảnh toàn bộ Section AI Search & Filter
    const sectionClipResult = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.querySelector('.ai-search-filter-section');
        const rect = sec.getBoundingClientRect();
        return {
          x: Math.max(0, rect.x - 10),
          y: Math.max(0, rect.y - 10),
          width: rect.width + 20,
          height: rect.height + 20,
          scale: 1
        };
      })()`,
      returnByValue: true
    });
    const sectionClip = sectionClipResult.result.value;
    const secShot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: sectionClip
    });
    const secImgPath = path.join(artifactDir, 'tag_contrast_improved_section.png');
    fs.writeFileSync(secImgPath, Buffer.from(secShot.data, 'base64'));
    console.log('✅ Đã lưu ảnh toàn bộ khung tìm kiếm & bộ lọc: tag_contrast_improved_section.png');

    // 4. Click chọn tag "Thức khuya ôn thi" để kiểm tra trạng thái tương phản Active vs Unselected
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const chip = document.querySelector('.ai-chip-btn[data-chip="thức khuya"]');
        if (chip) chip.click();
      })()`
    });
    await sleep(400);

    const activeShot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: clip
    });
    const activeImgPath = path.join(artifactDir, 'tag_contrast_active_comparison.png');
    fs.writeFileSync(activeImgPath, Buffer.from(activeShot.data, 'base64'));
    console.log('✅ Đã lưu ảnh so sánh tag đã chọn và chưa chọn: tag_contrast_active_comparison.png');

    cdp.close();
  } catch (err) {
    console.error('Lỗi kiểm thử:', err);
    process.exitCode = 1;
  } finally {
    try {
      chromeProc.kill();
    } catch (e) {}
  }
}

run();
