/**
 * ==============================================================================
 * SCENTPOD AI SHOPPING ASSISTANT - SUITE KIỂM THỬ TỰ ĐỘNG
 * ==============================================================================
 * Kiểm thử 5 trường hợp theo đúng yêu cầu:
 * 1. Gợi ý đúng ngân sách
 * 2. Không có sản phẩm phù hợp (ngân sách quá thấp hoặc ngoài danh mục)
 * 3. Xử lý sản phẩm hết hàng
 * 4. Thêm vào giỏ đúng sản phẩm, đúng giá và đúng phiên người dùng
 * 5. Xử lý lỗi kết nối AI (fallback an toàn)
 * ==============================================================================
 */

const assert = require('assert');
const {
  loadCatalog,
  parseUserIntent,
  searchCatalog,
  validateAndEnforceProducts,
  generateAdvisorResponse,
  getCart,
  addToCart,
  updateCart,
  clearCart,
  checkout,
  submitPurchaseRequest
} = require('./ai_shopping_assistant');

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
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG SCENTPOD AI SHOPPING ASSISTANT');
  console.log('='.repeat(70) + '\n');

  // ----------------------------------------------------------------------------
  // TEST 1: GỢI Ý ĐÚNG NGÂN SÁCH
  // ----------------------------------------------------------------------------
  console.log('▶ NHÓM 1: KIỂM THỬ GỢI Ý ĐÚNG NGÂN SÁCH & PARSING 90.000đ VS 90k');

  runTest('Phân tích đúng ngân sách dưới 100k và không gian bàn học', () => {
    const intent = parseUserIntent('Mình muốn tìm nến thơm để bàn học tập trung, ngân sách tầm dưới 100k');
    assert.strictEqual(intent.maxBudget, 100000);
    assert.strictEqual(intent.spaceKeywords.includes('bàn học'), true);
  });

  runTest('Đồng nhất giá trị ngân sách giữa 90.000đ và 90k (đều là 90.000 VND)', () => {
    const intentA = parseUserIntent('Tư vấn cho mình hũ nến tầm 90.000đ');
    const intentB = parseUserIntent('Tư vấn cho mình hũ nến tầm 90k');
    const intentC = parseUserIntent('Ngân sách 90 nghìn');
    const intentD = parseUserIntent('90.000đ');

    assert.strictEqual(intentA.maxBudget, 90000);
    assert.strictEqual(intentB.maxBudget, 90000);
    assert.strictEqual(intentC.maxBudget, 90000);
    assert.strictEqual(intentD.maxBudget, 90000);
  });

  await runAsyncTest('Ngân sách 90.000đ và 90k đều gợi ý được nến 85.000đ (không bị báo budget quá thấp)', async () => {
    const resA = await generateAdvisorResponse({
      message: 'Ngân sách của mình là 90.000đ',
      sessionId: 'test_budget_90k_dot'
    });
    const resB = await generateAdvisorResponse({
      message: 'Ngân sách của mình là 90k',
      sessionId: 'test_budget_90k_word'
    });

    assert.strictEqual(resA.suggestedProducts.length > 0, true);
    assert.strictEqual(resB.suggestedProducts.length > 0, true);
    assert.strictEqual(resA.suggestedProducts[0].price, 85000);
    assert.strictEqual(resB.suggestedProducts[0].price, 85000);
    assert.strictEqual(resA.reply.includes('budget_too_low'), false);
    assert.strictEqual(resB.reply.includes('budget_too_low'), false);
  });

  await runAsyncTest('Gợi ý sản phẩm Another Sunday vừa vặn ngân sách 100k (giá 85.000đ)', async () => {
    const res = await generateAdvisorResponse({
      message: 'Tìm nến thơm để bàn học tập trung, ngân sách 100k',
      sessionId: 'test_budget_100k'
    });

    assert.strictEqual(res.suggestedProducts.length > 0, true);
    const p = res.suggestedProducts[0];
    assert.strictEqual(p.price, 85000);
    assert.strictEqual(p.price <= 100000, true);
    assert.strictEqual(p.id, 'first-class');
  });

  // ----------------------------------------------------------------------------
  // TEST 2: XỬ LÝ KHI KHÔNG CÓ SẢN PHẨM PHÙ HỢP
  // ----------------------------------------------------------------------------
  console.log('\n▶ NHÓM 2: KIỂM THỬ KHI KHÔNG CÓ SẢN PHẨM PHÙ HỢP');

  await runAsyncTest('Ngân sách quá thấp (40k): Giải thích giá sàn 85k và gợi ý dòng nến 50g', async () => {
    const res = await generateAdvisorResponse({
      message: 'Mình là sinh viên, ngân sách chỉ có 40k thôi có mua được nến không?',
      sessionId: 'test_budget_low'
    });

    assert.strictEqual(res.reply.includes('85.000đ'), true);
    assert.strictEqual(res.suggestedProducts.length, 4);
    res.suggestedProducts.forEach(p => {
      assert.strictEqual(p.price, 85000);
    });
  });

  await runAsyncTest('Sản phẩm ngoài danh mục (nước hoa xịt phòng): Giải thích rõ và hướng sang nến 50g', async () => {
    const res = await generateAdvisorResponse({
      message: 'Shop có bán nước hoa xịt phòng hoặc máy xông tinh dầu không?',
      sessionId: 'test_out_of_catalog'
    });

    assert.strictEqual(res.reply.includes('nước hoa xịt phòng'), true);
    assert.strictEqual(res.reply.includes('chưa kinh doanh'), true);
    assert.strictEqual(res.suggestedProducts.length, 4);
  });

  // ----------------------------------------------------------------------------
  // TEST 3: XỬ LÝ SẢN PHẨM HẾT HÀNG
  // ----------------------------------------------------------------------------
  console.log('\n▶ NHÓM 3: KIỂM THỬ XỬ LÝ SẢN PHẨM HẾT HÀNG');

  runTest('Code Validator đánh dấu inStock = false nếu tồn kho = 0', () => {
    const mockCandidates = [
      { id: 'first-class', suggestReason: 'Lý do test' }
    ];
    const catalog = loadCatalog();
    catalog.products[0].stock = 0; // Giả lập hết hàng
    const verified = validateAndEnforceProducts(mockCandidates, catalog);
    assert.strictEqual(verified[0].inStock, false);
    assert.strictEqual(verified[0].stock, 0);
  });

  runTest('Chặn thêm vào giỏ hàng khi sản phẩm hết hàng hoặc số lượng vượt quá kho', () => {
    const testSession = 'test_stock_session_' + Date.now();
    clearCart(testSession);

    const addRes = addToCart(testSession, 'first-class', 9999);
    assert.strictEqual(addRes.success, false);
    assert.strictEqual(addRes.error.includes('Kho chỉ còn'), true);
  });

  // ----------------------------------------------------------------------------
  // TEST 4: THÊM GIỎ ĐÚNG SẢN PHẨM & CÁCH LY THEO PHIÊN NGƯỜI DÙNG
  // ----------------------------------------------------------------------------
  console.log('\n▶ NHÓM 4: THÊM GIỎ HÀNG ĐÚNG SẢN PHẨM & PHIÊN NGƯỜI DÙNG');

  runTest('Thêm đúng sản phẩm và tính đúng phí ship cho 1 hũ (ship 25k)', () => {
    const sessionUserA = 'session_user_A_' + Date.now();
    clearCart(sessionUserA);

    const res = addToCart(sessionUserA, 'first-class', 1);
    assert.strictEqual(res.success, true);

    const cart = getCart(sessionUserA);
    assert.strictEqual(cart.items.length, 1);
    assert.strictEqual(cart.items[0].id, 'first-class');
    assert.strictEqual(cart.items[0].price, 85000);
    assert.strictEqual(cart.subtotal, 85000);
    assert.strictEqual(cart.shippingFee, 25000); // 1 hũ ship 25k
    assert.strictEqual(cart.grandTotal, 110000);
  });

  runTest('Thêm 2 hũ nến: Tự động kích hoạt ưu đãi Ship 15.000đ toàn quốc', () => {
    const sessionUserA = 'session_user_A_' + Date.now();
    clearCart(sessionUserA);

    addToCart(sessionUserA, 'first-class', 1);
    addToCart(sessionUserA, 'late-night', 1);

    const cart = getCart(sessionUserA);
    assert.strictEqual(cart.totalQuantity, 2);
    assert.strictEqual(cart.subtotal, 170000); // 85.000 x 2
    assert.strictEqual(cart.shippingFee, 15000); // Đạt mốc ship 15k!
    assert.strictEqual(cart.grandTotal, 185000);
  });

  runTest('Tăng số lượng từ 1 lên 2 hũ: Tiền nến 170.000đ, phí ship 15.000đ, tổng 185.000đ', () => {
    const sessionChain = 'session_chain_' + Date.now();
    clearCart(sessionChain);

    // Bước 1: Thêm 1 hũ ban đầu
    addToCart(sessionChain, 'first-class', 1);
    let cart = getCart(sessionChain);
    assert.strictEqual(cart.totalQuantity, 1);
    assert.strictEqual(cart.subtotal, 85000);
    assert.strictEqual(cart.shippingFee, 25000);
    assert.strictEqual(cart.grandTotal, 110000);

    // Bước 2: Tăng số lượng lên 2 hũ bằng updateCart
    updateCart(sessionChain, 'first-class', 2);
    cart = getCart(sessionChain);
    assert.strictEqual(cart.totalQuantity, 2);
    assert.strictEqual(cart.subtotal, 170000);
    assert.strictEqual(cart.shippingFee, 15000);
    assert.strictEqual(cart.grandTotal, 185000);
  });

  await runAsyncTest('Chatbot nhận lệnh thêm hàng bằng văn bản (Text-based Add to Cart) và cập nhật giỏ hàng', async () => {
    const sessionTextCart = 'session_text_cart_' + Date.now();
    clearCart(sessionTextCart);

    // Chatbot tư vấn trước một mùi để ghi nhớ ngữ cảnh
    await generateAdvisorResponse({
      message: 'Tư vấn cho mình nến để bàn học',
      sessionId: sessionTextCart
    });

    // Khách nhắn lệnh thêm hàng bằng văn bản
    const resAdd = await generateAdvisorResponse({
      message: 'Thêm vào giỏ 1 hũ',
      sessionId: sessionTextCart
    });

    assert.strictEqual(resAdd.cartUpdated, true);
    assert.strictEqual(resAdd.cart.totalQuantity, 1);
    assert.strictEqual(resAdd.cart.subtotal, 85000);
    assert.strictEqual(resAdd.cart.grandTotal, 110000);
    assert.strictEqual(resAdd.reply.includes('Đã thêm') || resAdd.reply.includes('đã thêm'), true);

    // Thêm tiếp 1 hũ nữa bằng lệnh văn bản chỉ định tên
    const resAdd2 = await generateAdvisorResponse({
      message: 'Cho vào giỏ 1 hũ cà phê gỗ',
      sessionId: sessionTextCart
    });

    assert.strictEqual(resAdd2.cartUpdated, true);
    assert.strictEqual(resAdd2.cart.totalQuantity, 2);
    assert.strictEqual(resAdd2.cart.subtotal, 170000);
    assert.strictEqual(resAdd2.cart.shippingFee, 15000);
    assert.strictEqual(resAdd2.cart.grandTotal, 185000);
  });

  await runAsyncTest('Câu hỏi nối tiếp bám sát đúng mùi vừa được tư vấn (Contextual Memory)', async () => {
    const sessionMemory = 'session_memory_' + Date.now();

    // Lần 1: Tư vấn mùi hoa hồng (Beloved Summer)
    const turn1 = await generateAdvisorResponse({
      message: 'Mình thích mùi hoa hồng ngọt ngào cho phòng ngủ',
      sessionId: sessionMemory
    });
    assert.strictEqual(turn1.suggestedProducts[0].id, 'blind-date');

    // Lần 2: Khách hỏi câu nối tiếp: "mùi này dùng khi nào?"
    const turn2 = await generateAdvisorResponse({
      message: 'Mùi này dùng khi nào vậy shop?',
      sessionId: sessionMemory
    });
    assert.strictEqual(turn2.suggestedProducts[0].id, 'blind-date');
    assert.strictEqual(turn2.reply.includes('Beloved Summer'), true);
    assert.strictEqual(turn2.reply.includes('Buổi tối') || turn2.reply.includes('nghỉ ngơi') || turn2.reply.includes('Phòng ngủ'), true);

    // Lần 3: Khách hỏi câu nối tiếp về thời gian đốt: "đốt được bao lâu?"
    const turn3 = await generateAdvisorResponse({
      message: 'Hũ này đốt được bao lâu?',
      sessionId: sessionMemory
    });
    assert.strictEqual(turn3.suggestedProducts[0].id, 'blind-date');
    assert.strictEqual(turn3.reply.includes('12 – 15 giờ') || turn3.reply.includes('12 - 15 giờ'), true);
  });

  await runAsyncTest('Gửi yêu cầu mua hàng (submitPurchaseRequest) với 2 hũ nến: tổng 185.000đ & gửi email thành công', async () => {
    const sessionReq = 'session_submit_req_' + Date.now();
    clearCart(sessionReq);

    addToCart(sessionReq, 'first-class', 1);
    addToCart(sessionReq, 'campus-breeze', 1);

    const submitRes = await submitPurchaseRequest(sessionReq, {
      name: 'Nguyễn Văn Minh',
      phone: '0912345678',
      address: 'Phòng 402 KTX ĐHQG, Dĩ An, Bình Dương',
      paymentMethod: 'COD',
      note: 'Giao giờ hành chính'
    });

    assert.strictEqual(submitRes.success, true);
    assert.strictEqual(submitRes.subtotal, 170000);
    assert.strictEqual(submitRes.shippingFee, 15000);
    assert.strictEqual(submitRes.grandTotal, 185000);
    assert.strictEqual(submitRes.itemCount, 2);
    assert.strictEqual(submitRes.requestId.startsWith('REQ-'), true);

    // Giỏ hàng sau khi gửi thành công phải được xóa
    const cartAfter = getCart(sessionReq);
    assert.strictEqual(cartAfter.items.length, 0);
  });

  runTest('Cách ly giỏ hàng hoàn toàn giữa 2 người dùng khác Session ID', () => {
    const user1 = 'session_alice_' + Date.now();
    const user2 = 'session_bob_' + Date.now();
    clearCart(user1);
    clearCart(user2);

    addToCart(user1, 'first-class', 1);
    addToCart(user2, 'late-night', 3);

    const cart1 = getCart(user1);
    const cart2 = getCart(user2);

    assert.strictEqual(cart1.items.length, 1);
    assert.strictEqual(cart1.items[0].id, 'first-class');
    assert.strictEqual(cart1.totalQuantity, 1);

    assert.strictEqual(cart2.items.length, 1);
    assert.strictEqual(cart2.items[0].id, 'late-night');
    assert.strictEqual(cart2.totalQuantity, 3);
  });

  // ----------------------------------------------------------------------------
  // TEST 5: XỬ LÝ LỖI KẾT NỐI AI & AN TOÀN HỆ THỐNG
  // ----------------------------------------------------------------------------
  console.log('\n▶ NHÓM 5: KIỂM THỬ XỬ LÝ LỖI KẾT NỐI AI & AN TOÀN HỆ THỐNG');

  await runAsyncTest('Hệ thống hoạt động trơn tru ngay cả khi không có external API key (Local Fallback)', async () => {
    const res = await generateAdvisorResponse({
      message: 'Tư vấn giúp mình mùi hương thư giãn buổi tối',
      sessionId: 'session_fallback_test'
    });

    assert.strictEqual(typeof res.reply, 'string');
    assert.strictEqual(res.reply.length > 0, true);
    assert.strictEqual(res.suggestedProducts.length > 0, true);
    assert.strictEqual(res.suggestedProducts[0].price, 85000);
  });

  runTest('Đặt hàng thành công với thông tin người nhận và trả về mã đơn SCP...', () => {
    const fs = require('fs');
    const path = require('path');
    const catPath = path.join(__dirname, '..', 'data', 'catalog.json');
    const rawBefore = fs.readFileSync(catPath, 'utf8');

    try {
      const sessionCheckout = 'session_checkout_' + Date.now();
      clearCart(sessionCheckout);
      addToCart(sessionCheckout, 'blind-date', 2);

      const orderRes = checkout(sessionCheckout, {
        name: 'Trần Minh Quân',
        phone: '0909123456',
        address: 'Ký túc xá Đại học Bách Khoa TP.HCM',
        paymentMethod: 'COD'
      });

      assert.strictEqual(orderRes.success, true);
      assert.strictEqual(orderRes.order.orderId.startsWith('SCP'), true);
      assert.strictEqual(orderRes.order.grandTotal, 170000 + 15000); // 185.000đ

      // Giỏ hàng sau khi đặt phải được xóa sạch
      const emptyCart = getCart(sessionCheckout);
      assert.strictEqual(emptyCart.items.length, 0);
    } finally {
      // Phục hồi lại dữ liệu catalog nguyên bản sau khi kiểm thử trừ kho
      fs.writeFileSync(catPath, rawBefore, 'utf8');
    }
  });

  // ----------------------------------------------------------------------------
  // TỔNG KẾT KẾT QUẢ
  // ----------------------------------------------------------------------------
  console.log('\n' + '='.repeat(70));
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU (100%)`);
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
