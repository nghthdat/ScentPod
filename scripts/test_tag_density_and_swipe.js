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
  console.log('=== BẮT ĐẦU KIỂM THỬ GIẢM MẬT ĐỘ HIỂN THỊ TAG & THANH CUỘN NGANG ===\n');

  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9250',
    '--window-size=1280,850',
    '--no-sandbox'
  ]);
  await sleep(1500);

  const targets = await new Promise((resolve) => {
    http.get('http://localhost:9250/json/list', (res) => {
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

  // 1. Kiểm tra cấu trúc ban đầu: 1 dòng ngang, không rớt dòng
  const initialMetrics = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const cloud = document.getElementById('ai-keywords-cloud');
      const toggleBtn = document.getElementById('btn-toggle-chips-view');
      const lists = Array.from(document.querySelectorAll('.ai-chips-list'));
      const rect = cloud ? cloud.getBoundingClientRect() : null;
      
      const listMetrics = lists.map((l, i) => ({
        index: i,
        scrollWidth: l.scrollWidth,
        clientWidth: l.clientWidth,
        isScrollable: l.scrollWidth > l.clientWidth,
        chipsCount: l.querySelectorAll('.ai-chip-btn').length,
        firstChipTop: l.firstElementChild ? l.firstElementChild.getBoundingClientRect().top : 0,
        lastChipTop: l.lastElementChild ? l.lastElementChild.getBoundingClientRect().top : 0,
        isOnSingleLine: l.firstElementChild && l.lastElementChild 
          ? Math.abs(l.firstElementChild.getBoundingClientRect().top - l.lastElementChild.getBoundingClientRect().top) < 4
          : true
      }));

      return {
        cloudHeight: rect ? rect.height : 0,
        hasToggleBtn: !!toggleBtn,
        toggleBtnText: toggleBtn ? toggleBtn.textContent.trim() : '',
        listMetrics
      };
    })()`,
    returnByValue: true
  });

  console.log('1. Đánh giá mật độ hiển thị Desktop (Mặc định 1 dòng):');
  console.log(JSON.stringify(initialMetrics.result.value, null, 2));

  // Chụp ảnh desktop ở trạng thái thu gọn 1 dòng
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('ai-search-filter-section');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollBy(0, -90);
    })()`
  });
  await sleep(600);

  const shotDesktopCollapsed = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'tags_density_desktop_collapsed.png'), Buffer.from(shotDesktopCollapsed.data, 'base64'));
  console.log('✅ Đã lưu ảnh: tags_density_desktop_collapsed.png');

  // 2. Thao tác bấm nút Xem tất cả [+] để mở rộng
  const expandAction = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-toggle-chips-view');
      if (!btn) return { success: false };
      btn.click();
      const cloud = document.getElementById('ai-keywords-cloud');
      return {
        success: true,
        isExpanded: cloud.classList.contains('is-expanded'),
        newHeight: cloud.getBoundingClientRect().height,
        btnText: btn.textContent.trim()
      };
    })()`,
    returnByValue: true
  });
  console.log('\n2. Trạng thái sau khi bấm Xem tất cả (+):', expandAction.result.value);

  await sleep(400);
  const shotDesktopExpanded = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'tags_density_desktop_expanded.png'), Buffer.from(shotDesktopExpanded.data, 'base64'));
  console.log('✅ Đã lưu ảnh: tags_density_desktop_expanded.png');

  // 3. Thu gọn lại trạng thái 1 dòng
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-toggle-chips-view');
      if (btn) btn.click();
    })()`
  });
  await sleep(300);

  // 4. Kiểm tra trên Mobile Viewport (iPhone 375 x 812)
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(800);

  const mobileMetrics = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const cloud = document.getElementById('ai-keywords-cloud');
      const lists = Array.from(document.querySelectorAll('.ai-chips-list'));
      return {
        cloudHeight: cloud ? cloud.getBoundingClientRect().height : 0,
        lists: lists.map((l, i) => ({
          index: i,
          scrollWidth: l.scrollWidth,
          clientWidth: l.clientWidth,
          isSwipeable: l.scrollWidth > l.clientWidth,
          firstChipTop: l.firstElementChild ? l.firstElementChild.getBoundingClientRect().top : 0,
          lastChipTop: l.lastElementChild ? l.lastElementChild.getBoundingClientRect().top : 0,
          isOnSingleLine: l.firstElementChild && l.lastElementChild
            ? Math.abs(l.firstElementChild.getBoundingClientRect().top - l.lastElementChild.getBoundingClientRect().top) < 4
            : true
        }))
      };
    })()`,
    returnByValue: true
  });
  console.log('\n3. Đánh giá trên màn hình điện thoại (Mobile 375px):');
  console.log(JSON.stringify(mobileMetrics.result.value, null, 2));

  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('ai-search-filter-section');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollBy(0, -70);
    })()`
  });
  await sleep(600);

  const shotMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'tags_density_mobile_swipeable.png'), Buffer.from(shotMobile.data, 'base64'));
  console.log('✅ Đã lưu ảnh: tags_density_mobile_swipeable.png');

  // 5. Thử nghiệm cuộn ngang trên mobile
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const list = document.querySelector('.ai-chips-list');
      if (list) list.scrollLeft = 120;
    })()`
  });
  await sleep(400);

  const shotMobileScrolled = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'tags_density_mobile_swiped.png'), Buffer.from(shotMobileScrolled.data, 'base64'));
  console.log('✅ Đã lưu ảnh sau khi vuốt: tags_density_mobile_swiped.png');

  cdp.close();
  chromeProc.kill();

  const allOnSingleLine = initialMetrics.result.value.listMetrics.every((m) => m.isOnSingleLine);
  const mobileSwipeable = mobileMetrics.result.value.lists.every((m) => m.isSwipeable && m.isOnSingleLine);

  if (allOnSingleLine && mobileSwipeable && expandAction.result.value.isExpanded) {
    console.log('\n🎉 THÀNH CÔNG RỰC RỠ: Tag hiển thị 1 dòng cuộn ngang mượt mà, hỗ trợ vuốt chạm trên mobile và nút toggle mở rộng hoạt động hoàn hảo 100%!');
  } else {
    console.error('❌ Kiểm tra không đạt yêu cầu!');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
