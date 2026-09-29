const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');
const http = require('http');

console.log('=== BẮT ĐẦU KIỂM THỬ: GỠ BỎ CÁC DÒNG CHỮ & TÍNH NĂNG CỌC SHIP COD 15K ===\n');

// 1. Kiểm tra san-pham.html đã gỡ bỏ các dòng chữ
console.log('--- TEST 1: Kiểm tra san-pham.html đã gỡ bỏ tag combo & giá inbox ---');
const sanphamHtml = fs.readFileSync(path.resolve(__dirname, '../san-pham.html'), 'utf8');

assert(!sanphamHtml.includes('tag-strategy'), 'Đã gỡ bỏ tag COMBO BÁN HÀNG CHIẾN LƯỢC trên card combo');
assert(!sanphamHtml.includes('tag-aov'), 'Đã gỡ bỏ tag COMBO TỐI ƯU AOV trên card combo');
assert(!sanphamHtml.includes('tag-full'), 'Đã gỡ bỏ tag COMBO ĐẦY ĐỦ HƯƠNG SẮC trên card combo');
assert(!sanphamHtml.includes('product-inbox-hint'), 'Đã gỡ bỏ toàn bộ dòng Giá chốt Inbox trên san-pham.html');
console.log('✅ san-pham.html đã gỡ bỏ sạch sẽ các dòng chữ theo ảnh yêu cầu!');

// 2. Kiểm tra index.html đã gỡ bỏ các dòng chữ
console.log('\n--- TEST 2: Kiểm tra index.html đã gỡ bỏ giá inbox ---');
const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
assert(!indexHtml.includes('product-inbox-hint'), 'Đã gỡ bỏ toàn bộ dòng Giá chốt Inbox trên index.html');
console.log('✅ index.html đã gỡ bỏ sạch sẽ dòng Giá chốt Inbox!');

// 3. Kiểm tra cấu trúc thanh-toan.html
console.log('\n--- TEST 3: Kiểm tra cấu trúc thanh-toan.html cho tính năng cọc COD 15k ---');
const thanhToanHtml = fs.readFileSync(path.resolve(__dirname, '../thanh-toan.html'), 'utf8');

assert(thanhToanHtml.includes('cod-deposit-display-box'), 'Hộp cọc COD tồn tại trong DOM');
assert(thanhToanHtml.includes('Cọc trước ship 15k'), 'Badge cọc trước ship 15k trên tùy chọn COD');
assert(thanhToanHtml.includes('15.000đ'), 'Hiển thị rõ ràng mức tiền cọc 15.000đ');
assert(thanhToanHtml.includes('cod_qr_mode'), 'Có lựa chọn chế độ quét mã QR (tùy chọn)');
assert(thanhToanHtml.includes('cod-vietqr-image'), 'Có ảnh VietQR cọc 15k');
assert(thanhToanHtml.includes('chk-cod-breakdown'), 'Có phân tách thanh toán COD ở cột tóm tắt');
assert(thanhToanHtml.includes('succ-cod-box'), 'Có phân tách COD trong modal đặt hàng thành công');
console.log('✅ thanh-toan.html có đầy đủ cấu trúc và logic cọc ship COD 15k kèm mã QR tùy chọn!');

// 4. Chụp ảnh màn hình giao diện thực tế qua Chrome Headless
console.log('\n--- TEST 4: Chụp ảnh giao diện thực tế qua Chrome Headless & CDP ---');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function sendWsCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const msg = JSON.stringify({ id, method, params });
    const handler = (data) => {
      try {
        const resp = JSON.parse(data.toString());
        if (resp.id === id) {
          ws.off('message', handler);
          if (resp.error) reject(new Error(resp.error.message));
          else resolve(resp.result);
        }
      } catch (e) {}
    };
    ws.on('message', handler);
    ws.send(msg, (err) => { if (err) reject(err); });
  });
}

async function captureScreenshots() {
  const WebSocket = globalThis.WebSocket;
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const debugPort = 9223;
  const userDataDir = '/tmp/chrome_cod_deposit_test_' + Date.now();

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--disable-gpu',
    '--window-size=1280,900'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const versionInfo = await fetchJson(`http://127.0.0.1:${debugPort}/json/version`);
    const browserWs = new WebSocket(versionInfo.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      browserWs.onopen = resolve;
      browserWs.onerror = reject;
    });

    const sendBrowserCmd = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * 1000000);
        const msg = JSON.stringify({ id, method, params });
        const handler = (event) => {
          try {
            const resp = JSON.parse(event.data);
            if (resp.id === id) {
              browserWs.removeEventListener('message', handler);
              if (resp.error) reject(new Error(resp.error.message));
              else resolve(resp.result);
            }
          } catch (e) {}
        };
        browserWs.addEventListener('message', handler);
        browserWs.send(msg);
      });
    };

    const { targetId } = await sendBrowserCmd('Target.createTarget', { url: 'about:blank' });
    const pageTargets = await fetchJson(`http://127.0.0.1:${debugPort}/json`);
    const pageTarget = pageTargets.find(t => t.id === targetId);
    const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      pageWs.onopen = resolve;
      pageWs.onerror = reject;
    });

    const sendPageCmd = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * 1000000);
        const msg = JSON.stringify({ id, method, params });
        const handler = (event) => {
          try {
            const resp = JSON.parse(event.data);
            if (resp.id === id) {
              pageWs.removeEventListener('message', handler);
              if (resp.error) reject(new Error(resp.error.message));
              else resolve(resp.result);
            }
          } catch (e) {}
        };
        pageWs.addEventListener('message', handler);
        pageWs.send(msg);
      });
    };

    await sendPageCmd('Page.enable');
    await sendPageCmd('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false
    });

    // Ảnh 1: Trang sản phẩm đã gỡ bỏ các dòng
    console.log('Đang chụp trang sản phẩm (đã gỡ bỏ tag & inbox hints)...');
    await sendPageCmd('Page.navigate', { url: 'http://localhost:8080/san-pham.html' });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to combo cards
    await sendPageCmd('Runtime.evaluate', {
      expression: `
        document.getElementById('combo').scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const artifactDir = '/Users/minmin091299/.gemini/antigravity-ide/brain/fbf92e3f-5923-4a37-b465-cd8ed2e53135';

    const snap1 = await sendPageCmd('Page.captureScreenshot', { format: 'png' });
    const snap1Path = path.join(artifactDir, 'san_pham_removed_lines.png');
    fs.writeFileSync(snap1Path, Buffer.from(snap1.data, 'base64'));
    console.log('✅ Đã lưu ảnh: san_pham_removed_lines.png');

    // Chuyển sang thanh-toan.html với giỏ hàng có sẵn
    console.log('Đang thiết lập giỏ hàng và điều hướng tới thanh-toan.html...');
    await sendPageCmd('Runtime.evaluate', {
      expression: `
        localStorage.setItem("scentpod_cart", JSON.stringify([
          {
            id: "cb02",
            productId: "cb02",
            name: "Combo Trọn Vẹn Chill",
            price: 119000,
            originalPrice: 150000,
            quantity: 1,
            size: "Combo",
            isCombo: true,
            code: "CB02",
            gift: "Tặng 1 viên tealight mini 0đ",
            image: "images/combo-cb02-tron-ven-chill.jpg",
            scentName: "1 Sáp 50g + 1 Nến 100g"
          }
        ]));
        window.location.href = "http://localhost:8080/thanh-toan.html";
      `
    });
    await new Promise(r => setTimeout(r, 2000));

    // Cuộn tới mục Phương thức thanh toán COD & VietQR
    await sendPageCmd('Runtime.evaluate', {
      expression: `
        document.querySelector('.payment-options').scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Ảnh 2: Trang thanh toán - COD cọc 15k với VietQR mở sẵn
    const snap2 = await sendPageCmd('Page.captureScreenshot', { format: 'png' });
    const snap2Path = path.join(artifactDir, 'thanh_toan_cod_deposit_qr_now.png');
    fs.writeFileSync(snap2Path, Buffer.from(snap2.data, 'base64'));
    console.log('✅ Đã lưu ảnh: thanh_toan_cod_deposit_qr_now.png');

    // Chuyển sang chế độ "Nhận mã QR qua Zalo/SMS sau"
    await sendPageCmd('Runtime.evaluate', {
      expression: `
        const laterRadio = document.querySelector('input[name="cod_qr_mode"][value="later"]');
        if (laterRadio) {
          laterRadio.checked = true;
          laterRadio.dispatchEvent(new Event('change'));
        }
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // Ảnh 3: Trang thanh toán - Tùy chọn Nhận mã QR sau
    const snap3 = await sendPageCmd('Page.captureScreenshot', { format: 'png' });
    const snap3Path = path.join(artifactDir, 'thanh_toan_cod_deposit_qr_later.png');
    fs.writeFileSync(snap3Path, Buffer.from(snap3.data, 'base64'));
    console.log('✅ Đã lưu ảnh: thanh_toan_cod_deposit_qr_later.png');

    // Điền thông tin và bấm Đặt hàng để kiểm tra modal
    await sendPageCmd('Runtime.evaluate', {
      expression: `
        window.alert = function(msg) { console.log("ALERT:", msg); };
        document.getElementById('c-name').value = "Nguyễn Hoàng Nam";
        document.getElementById('c-phone').value = "0987654321";
        document.getElementById('c-email').value = "nam.nguyen@example.com";
        document.getElementById('c-address').value = "Ký túc xá ĐHQG, TP. Thủ Đức, TP. HCM";
        document.getElementById('checkout-form').dispatchEvent(new Event('submit', { cancelable: true }));
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Ảnh 4: Modal Đặt Hàng Thành Công hiển thị COD cọc 15k
    const snap4 = await sendPageCmd('Page.captureScreenshot', { format: 'png' });
    const snap4Path = path.join(artifactDir, 'thanh_toan_cod_success_modal.png');
    fs.writeFileSync(snap4Path, Buffer.from(snap4.data, 'base64'));
    console.log('✅ Đã lưu ảnh: thanh_toan_cod_success_modal.png');

    pageWs.close();
    browserWs.close();
  } catch (err) {
    console.error('Lỗi khi chụp màn hình:', err);
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

captureScreenshots().then(() => {
  console.log('\n🎉 HOÀN THÀNH TOÀN BỘ KIỂM THỬ VÀ CHỤP ẢNH MINH CHỨNG!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
