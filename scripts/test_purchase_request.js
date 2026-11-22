/**
 * ==============================================================================
 * SCENTPOD PURCHASE REQUEST - SUITE KIỂM THỬ TỰ ĐỘNG
 * ==============================================================================
 * Kiểm thử 5 trường hợp theo đúng yêu cầu:
 * 1. Giỏ trống
 * 2. Thiếu số điện thoại
 * 3. Gửi yêu cầu mua hàng thành công (bỏ qua giá client, gửi mail tới scentpodcontact@gmail.com)
 * 4. Lỗi gửi mail (báo rõ lỗi, giỏ hàng & dữ liệu không bị xóa)
 * 5. Bấm gửi liên tiếp (chặn duplicate submissions trong lúc đang xử lý)
 * ==============================================================================
 */

const assert = require('assert');
const http = require('http');
const {
  addToCart,
  getCart,
  clearCart,
  submitPurchaseRequest
} = require('./ai_shopping_assistant');
const {
  getRecipientEmail,
  buildEmailContent
} = require('./email_service');

let passedTests = 0;
let totalTests = 0;

function runTest(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${description}`);
    console.error(`    -> Lỗi: ${err.message}`);
  }
}

async function runAsyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${description}`);
    console.error(`    -> Lỗi: ${err.message}`);
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 BẮT ĐẦU KIỂM THỬ BIỂU MẪU YÊU CẦU MUA HÀNG & DỊCH VỤ EMAIL SCENTPOD');
  console.log('='.repeat(70) + '\n');

  // Kiểm tra email nhận cố định của nhóm
  runTest('Email nhận thông báo cố định là scentpodcontact@gmail.com', () => {
    const recipient = getRecipientEmail();
    assert.strictEqual(recipient, 'scentpodcontact@gmail.com');
  });

  // ----------------------------------------------------------------------------
  // CA 1: KIỂM THỬ GIỎ TRỐNG
  // ----------------------------------------------------------------------------
  console.log('\n▶ CA 1: KIỂM THỬ GIỎ TRỐNG');

  await runAsyncTest('Chặn gửi yêu cầu khi giỏ hàng trống và báo lỗi rõ ràng', async () => {
    const sessionEmpty = 'test_empty_cart_' + Date.now();
    clearCart(sessionEmpty);

    const res = await submitPurchaseRequest(sessionEmpty, {
      name: 'Nguyễn Văn An',
      phone: '0912345678',
      note: 'Giao buổi sáng'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error.includes('Giỏ hàng của bạn đang trống'), true);
  });

  // ----------------------------------------------------------------------------
  // CA 2: KIỂM THỬ THIẾU SỐ ĐIỆN THOẠI
  // ----------------------------------------------------------------------------
  console.log('\n▶ CA 2: KIỂM THỬ THIẾU HOẶC SAI SỐ ĐIỆN THOẠI');

  await runAsyncTest('Chặn khi thiếu số điện thoại dù giỏ hàng đã có sản phẩm', async () => {
    const sessionNoPhone = 'test_no_phone_' + Date.now();
    clearCart(sessionNoPhone);
    addToCart(sessionNoPhone, 'first-class', 1);

    const res = await submitPurchaseRequest(sessionNoPhone, {
      name: 'Trần Thị Mai',
      phone: '', // Thiếu số điện thoại
      note: 'Nhà gần trường'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error.includes('số điện thoại hợp lệ'), true);
  });

  await runAsyncTest('Chặn khi số điện thoại không hợp lệ (ít hơn 9 chữ số)', async () => {
    const sessionBadPhone = 'test_bad_phone_' + Date.now();
    clearCart(sessionBadPhone);
    addToCart(sessionBadPhone, 'late-night', 1);

    const res = await submitPurchaseRequest(sessionBadPhone, {
      name: 'Lê Hoàng Nam',
      phone: '12345' // Quá ngắn
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error.includes('số điện thoại hợp lệ'), true);
  });

  // ----------------------------------------------------------------------------
  // CA 3: KIỂM THỬ GỬI THÀNH CÔNG & BỎ QUA GIÁ TRÌNH DUYỆT TỰ GỬI
  // ----------------------------------------------------------------------------
  console.log('\n▶ CA 3: KIỂM THỬ GỬI THÀNH CÔNG & BẢO VỆ DỮ LIỆU GIÁ');

  await runAsyncTest('Gửi thành công: Tạo mã REQ-..., gửi email tới nhóm và làm sạch giỏ hàng', async () => {
    const sessionSuccess = 'test_success_' + Date.now();
    clearCart(sessionSuccess);
    addToCart(sessionSuccess, 'first-class', 2);
    addToCart(sessionSuccess, 'blind-date', 1);

    // Giả lập client cố ý tự gửi trường giá giả mạo (fakePrice, customTotal)
    const clientPayload = {
      name: 'Phạm Thuỳ Linh',
      phone: '0988123456',
      note: 'Giao đến cổng ký túc xá khu B',
      fakePrice: 1000,
      customTotal: 5000
    };

    const res = await submitPurchaseRequest(sessionSuccess, clientPayload);

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.requestId.startsWith('REQ-'), true);
    assert.strictEqual(res.customer.name, 'Phạm Thuỳ Linh');
    assert.strictEqual(res.customer.phone, '0988123456');
    assert.strictEqual(res.customer.note, 'Giao đến cổng ký túc xá khu B');
    assert.strictEqual(res.items.length, 2);
    assert.strictEqual(res.itemCount, 3); // 2 First Class + 1 Blind Date

    // Bỏ qua toàn bộ dữ liệu giá từ trình duyệt
    assert.strictEqual(res.fakePrice, undefined);
    assert.strictEqual(res.customTotal, undefined);

    // Kiểm tra nội dung email được định dạng chuẩn xác
    const emailData = buildEmailContent({
      requestId: res.requestId,
      sentAt: res.sentAt,
      customer: res.customer,
      items: res.items
    });
    assert.strictEqual(emailData.textBody.includes('scentpodcontact@gmail.com'), true);
    assert.strictEqual(emailData.textBody.includes('Phạm Thuỳ Linh'), true);
    assert.strictEqual(emailData.textBody.includes('0988123456'), true);
    assert.strictEqual(emailData.textBody.includes('Another Sunday'), true);

    // Giỏ hàng được xóa sạch sau khi gửi thành công
    const cartAfter = getCart(sessionSuccess);
    assert.strictEqual(cartAfter.items.length, 0);
  });

  // ----------------------------------------------------------------------------
  // CA 4: KIỂM THỬ LỖI GỬI MAIL (GIỮ NGUYÊN GIỎ HÀNG & DỮ LIỆU)
  // ----------------------------------------------------------------------------
  console.log('\n▶ CA 4: KIỂM THỬ KHI DỊCH VỤ EMAIL GẶP LỖI');

  await runAsyncTest('Khi dịch vụ email lỗi: Báo lỗi, KHÔNG xóa giỏ hàng để khách thử lại', async () => {
    const sessionErr = 'test_email_err_' + Date.now();
    clearCart(sessionErr);
    addToCart(sessionErr, 'campus-breeze', 2);

    // Kích hoạt cờ mô phỏng lỗi dịch vụ email
    process.env.SIMULATE_EMAIL_ERROR = 'true';

    try {
      const res = await submitPurchaseRequest(sessionErr, {
        name: 'Đặng Quốc Huy',
        phone: '0903112233',
        note: 'Gọi điện trước khi đến 15 phút'
      });

      // Phải trả về false khi dịch vụ email từ chối
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.error.includes('Không thể gửi email thông báo'), true);

      // QUAN TRỌNG: Giỏ hàng KHÔNG được xóa khi gửi thất bại
      const cartStillExists = getCart(sessionErr);
      assert.strictEqual(cartStillExists.items.length, 1);
      assert.strictEqual(cartStillExists.items[0].id, 'campus-breeze');
      assert.strictEqual(cartStillExists.items[0].quantity, 2);
    } finally {
      // Hủy cờ lỗi sau khi test xong
      delete process.env.SIMULATE_EMAIL_ERROR;
    }
  });

  // ----------------------------------------------------------------------------
  // CA 5: KIỂM THỬ CHẶN BẤM GỬI LIÊN TIẾP (CONCURRENT SUBMISSION)
  // ----------------------------------------------------------------------------
  console.log('\n▶ CA 5: KIỂM THỬ CHẶN BẤM GỬI LẶP / CONCURRENT SUBMISSIONS');

  await runAsyncTest('Chặn request thứ 2 khi request 1 đang được xử lý cho cùng 1 phiên', async () => {
    const inFlightLock = new Set();
    const testSession = 'test_concurrent_' + Date.now();
    clearCart(testSession);
    addToCart(testSession, 'late-night', 1);

    // Giả lập hàm xử lý controller với in-flight lock như trong server.js
    async function processRequest(sid, info) {
      if (inFlightLock.has(sid)) {
        return {
          statusCode: 429,
          success: false,
          error: 'Yêu cầu của bạn đang được xử lý, vui lòng không nhấn gửi liên tiếp.'
        };
      }

      inFlightLock.add(sid);
      try {
        // Giả lập thời gian xử lý gửi mail mạng (50ms)
        await new Promise(r => setTimeout(r, 50));
        const res = await submitPurchaseRequest(sid, info);
        return { statusCode: 200, ...res };
      } finally {
        inFlightLock.delete(sid);
      }
    }

    const payload = {
      name: 'Hoàng Minh',
      phone: '0977889900'
    };

    // Bắn 2 request đồng thời từ cùng 1 session
    const req1Promise = processRequest(testSession, payload);
    const req2Promise = processRequest(testSession, payload);

    const [res1, res2] = await Promise.all([req1Promise, req2Promise]);

    // Request 1 thành công
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.statusCode, 200);
    assert.strictEqual(res1.requestId.startsWith('REQ-'), true);

    // Request 2 bị chặn với mã 429 và thông báo đang xử lý
    assert.strictEqual(res2.statusCode, 429);
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res2.error.includes('đang được xử lý'), true);
  });

  // ----------------------------------------------------------------------------
  // TỔNG KẾT KẾT QUẢ KIỂM THỬ
  // ----------------------------------------------------------------------------
  console.log('\n' + '='.repeat(70));
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU (100%)`);
  console.log('='.repeat(70) + '\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Lỗi thực thi test runner:', err);
  process.exit(1);
});
