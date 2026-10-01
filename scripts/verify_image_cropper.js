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
    '--remote-debugging-port=9225',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_cropper_profile_' + Date.now(),
    '--window-size=1280,1050'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9225/json/version');
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
    const res = await fetch('http://127.0.0.1:9225/json/new', { method: 'PUT' });
    const target = await res.json();
    const cdp = new SimpleCDP(target.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Page.navigate', { url });
    await sleep(1500);
    return cdp;
  }

  try {
    console.log('=== BẮT ĐẦU KIỂM TRA BỘ CÔNG CỤ CHỈNH SỬA KHUNG ẢNH (SCENTPOD CROPPER) ===');
    const cdp = await createPage('http://localhost:8080/index.html');
    await sleep(1000);

    // 1. Kiểm tra sự hiện diện của nút "Chỉnh khung" trên thẻ sản phẩm
    const buttonCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.product-img-wrapper[data-product-id="first-class"]');
        if (!card) return { passed: false, error: 'Không tìm thấy thẻ first-class' };

        const cropBtn = card.querySelector('.btn-card-crop');
        const uploadBtn = card.querySelector('.btn-card-upload');

        return {
          passed: !!(cropBtn && uploadBtn),
          hasCropBtn: !!cropBtn,
          hasUploadBtn: !!uploadBtn,
          cropBtnText: cropBtn ? cropBtn.textContent.trim() : '',
          uploadBtnText: uploadBtn ? uploadBtn.textContent.trim() : ''
        };
      })()`,
      returnByValue: true
    });
    console.log('1. Kiểm tra nút thao tác trên thẻ sản phẩm:', buttonCheck.result.value);

    // 2. Click nút "Chỉnh khung" để mở Modal Cropper
    console.log('2. Mở Modal Chỉnh Sửa Khung Ảnh...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cropBtn = document.querySelector('.product-img-wrapper[data-product-id="first-class"] .btn-card-crop');
        if (cropBtn) cropBtn.click();
      })()`
    });
    await sleep(1200);

    // 3. Kiểm tra trạng thái và các thành phần của Cropper Modal
    const modalCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.scentpod-cropper-backdrop');
        if (!modal) return { passed: false, error: 'Không tìm thấy .scentpod-cropper-backdrop' };

        const isOpen = modal.classList.contains('is-open');
        const title = modal.querySelector('#cropper-title')?.textContent.trim();
        const badge = modal.querySelector('.cropper-product-badge')?.textContent.trim();
        const viewport = modal.querySelector('#cropper-viewport');
        const cropBox = modal.querySelector('#cropper-crop-box');
        const corners = modal.querySelectorAll('.crop-corner').length;
        const gridLines = modal.querySelectorAll('.crop-grid-lines span').length;
        const ratioBtns = Array.from(modal.querySelectorAll('.btn-ratio')).map(b => b.textContent.trim());
        const zoomSlider = modal.querySelector('#cropper-zoom-slider');
        const previewCanvas = modal.querySelector('#cropper-preview-canvas');
        const applyBtn = modal.querySelector('.btn-cropper-apply');

        return {
          passed: isOpen && corners === 4 && gridLines === 4 && !!applyBtn,
          isOpen,
          title,
          badge,
          hasViewport: !!viewport,
          hasCropBox: !!cropBox,
          cropBoxWidth: cropBox ? cropBox.offsetWidth : 0,
          cropBoxHeight: cropBox ? cropBox.offsetHeight : 0,
          cornersCount: corners,
          gridLinesCount: gridLines,
          ratioBtns,
          zoomValue: zoomSlider ? zoomSlider.value : null,
          hasPreviewCanvas: !!previewCanvas,
          hasApplyBtn: !!applyBtn
        };
      })()`,
      returnByValue: true
    });
    console.log('3. Kiểm tra thành phần Cropper Modal:', modalCheck.result.value);

    // Chụp screenshot modal cropper đang mở
    const screenshotModal = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    fs.writeFileSync('images/cropper_modal_demo.jpg', Buffer.from(screenshotModal.data, 'base64'));
    console.log('📸 Đã lưu ảnh minh chứng: images/cropper_modal_demo.jpg');

    // 4. Thao tác điều khiển khung ảnh:
    console.log('4. Thử nghiệm chuyển tỉ lệ sang 1:1 (Vuông) và Zoom...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        // Chuyển sang 1:1
        const squareBtn = Array.from(document.querySelectorAll('.btn-ratio')).find(b => b.dataset.ratio === '1:1');
        if (squareBtn) squareBtn.click();
      })()`
    });
    await sleep(500);

    const squareCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const cropBox = document.querySelector('#cropper-crop-box');
        return {
          boxW: cropBox.offsetWidth,
          boxH: cropBox.offsetHeight,
          isSquare: Math.abs(cropBox.offsetWidth - cropBox.offsetHeight) <= 2
        };
      })()`,
      returnByValue: true
    });
    console.log('4.1 Kiểm tra tỉ lệ 1:1:', squareCheck.result.value);

    // Chuyển lại về 4:5 chuẩn thẻ ScentPod, thử zoom và xoay
    console.log('4.2 Chuyển lại về 4:5 chuẩn ScentPod, zoom lên 1.25x và dịch chuyển pan...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const podBtn = Array.from(document.querySelectorAll('.btn-ratio')).find(b => b.dataset.ratio === '4:5');
        if (podBtn) podBtn.click();
        
        // Zoom lên
        setCropperZoom(1.25);

        // Pan ảnh
        cropperState.panX = 20;
        cropperState.panY = -15;
        updateCropperTransform();
        updateCropperPreview();
      })()`
    });
    await sleep(500);

    // Chụp screenshot sau khi zoom & pan
    const screenshotAdjusted = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    fs.writeFileSync('images/cropper_adjusted_demo.jpg', Buffer.from(screenshotAdjusted.data, 'base64'));
    console.log('📸 Đã lưu ảnh minh chứng: images/cropper_adjusted_demo.jpg');

    // 5. Thử nghiệm Cắt & Áp dụng
    console.log('5. Bấm nút "Cắt & Áp dụng"...');
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const applyBtn = document.querySelector('.btn-cropper-apply');
        if (applyBtn) applyBtn.click();
      })()`
    });
    await sleep(1500);

    // 6. Kiểm tra xem thẻ sản phẩm đã nhận ảnh tùy chỉnh mới chưa
    const resultCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.product-img-wrapper[data-product-id="first-class"]');
        const img = card ? card.querySelector('img') : null;
        const badge = card ? card.querySelector('.custom-badge-indicator') : null;
        const modal = document.querySelector('.scentpod-cropper-backdrop');

        return {
          modalClosed: modal ? !modal.classList.contains('is-open') : true,
          hasCustomBadge: !!badge,
          isBase64Src: img && img.src.startsWith('data:image/jpeg;base64,'),
          imgSrcPrefix: img ? img.src.substring(0, 35) : ''
        };
      })()`,
      returnByValue: true
    });
    console.log('6. Kiểm tra kết quả sau khi Cắt & Áp dụng:', resultCheck.result.value);

    // Chụp screenshot kết quả trên thẻ sản phẩm
    const screenshotFinal = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    fs.writeFileSync('images/cropper_applied_card.jpg', Buffer.from(screenshotFinal.data, 'base64'));
    console.log('📸 Đã lưu ảnh minh chứng: images/cropper_applied_card.jpg');

    // 7. Khôi phục lại ảnh mặc định
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        removeCustomImage('first-class');
        applyProductImages();
      })()`
    });
    console.log('7. Đã hoàn tất kiểm tra và dọn dẹp trạng thái.');

    cdp.close();
    chromeProc.kill();

    const allPassed = buttonCheck.result.value.passed &&
                      modalCheck.result.value.passed &&
                      squareCheck.result.value.isSquare &&
                      resultCheck.result.value.modalClosed &&
                      resultCheck.result.value.hasCustomBadge &&
                      resultCheck.result.value.isBase64Src;

    console.log('\n========================================');
    console.log(allPassed ? '✅ TẤT CẢ CÁC BÀI KIỂM TRA ĐỀU THÀNH CÔNG RỰC RỠ!' : '❌ CÓ BÀI KIỂM TRA CHƯA ĐẠT!');
    console.log('========================================\n');

  } catch (err) {
    console.error('Lỗi khi chạy verify:', err);
    chromeProc.kill();
    process.exit(1);
  }
}

run();
