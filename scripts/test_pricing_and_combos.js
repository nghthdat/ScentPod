const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('=== BẮT ĐẦU KIỂM THỬ BẢNG GIÁ CHIẾN LƯỢC VÀ COMBO SCENTPOD ===\n');

// 1. Kiểm tra file cấu hình js/main.js
const mainJsContent = fs.readFileSync(path.resolve(__dirname, '../js/main.js'), 'utf8');

// Tạo môi trường giả lập window & localStorage
const mockWindow = {
  addEventListener: () => {},
  location: { pathname: '/san-pham.html', search: '' },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
    clear() { this.store = {}; }
  },
  document: {
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    createElement: () => {
      const el = {
        setAttribute: () => {},
        appendChild: () => {},
        addEventListener: () => {},
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        querySelector: () => ({
          addEventListener: () => {},
          classList: { add: () => {}, remove: () => {} },
          style: {}
        }),
        querySelectorAll: () => []
      };
      return el;
    },
    body: {
      appendChild: () => {}
    }
  }
};

const contextFunc = new Function('window', 'document', 'localStorage', `
  ${mainJsContent}
  return {
    ScentPod: window.ScentPod,
    PRODUCT_SIZES_CONFIG,
    COMBOS_CONFIG
  };
`);

const { ScentPod, PRODUCT_SIZES_CONFIG, COMBOS_CONFIG } = contextFunc(
  mockWindow,
  mockWindow.document,
  mockWindow.localStorage
);

// TEST 1: Kiểm tra cấu hình SP01 & SP02
console.log('--- TEST 1: Kiểm tra Danh mục bán lẻ SP01 & SP02 ---');
const sp01 = PRODUCT_SIZES_CONFIG['sp01'];
assert(sp01, 'SP01 phải tồn tại trong cấu hình');
assert.strictEqual(sp01.code, 'SP01');
assert.strictEqual(sp01.price, 49000, 'Giá HSSV SP01 phải là 49.000đ');
assert.strictEqual(sp01.originalPrice, 55000, 'Giá niêm yết SP01 phải là 55.000đ');
assert.strictEqual(sp01.inboxPrice, 45000, 'Giá chốt inbox SP01 phải là 45.000đ');
assert(sp01.gift.includes('thiệp cảm ơn') && sp01.gift.includes('giấy thử mùi mới'), 'Quà SP01 chuẩn xác');
console.log('✅ SP01: Niêm yết 55k | HSSV 49k | Inbox 45k | Quà tặng đầy đủ');

const sp02 = PRODUCT_SIZES_CONFIG['sp02'];
assert(sp02, 'SP02 phải tồn tại trong cấu hình');
assert.strictEqual(sp02.code, 'SP02');
assert.strictEqual(sp02.price, 85000, 'Giá HSSV SP02 phải là 85.000đ');
assert.strictEqual(sp02.originalPrice, 95000, 'Giá niêm yết SP02 phải là 95.000đ');
assert.strictEqual(sp02.inboxPrice, 79000, 'Giá chốt inbox SP02 phải là 79.000đ');
assert(sp02.gift.includes('diêm dài chuyên dụng'), 'Quà SP02 chuẩn xác');
console.log('✅ SP02: Niêm yết 95k | HSSV 85k | Inbox 79k | Quà tặng đầy đủ');

// TEST 2: Kiểm tra cấu hình Combo CB01, CB02, CB03
console.log('\n--- TEST 2: Kiểm tra Các gói Combo chiến lược CB01, CB02, CB03 ---');
const cb01 = COMBOS_CONFIG['cb01'];
assert(cb01, 'CB01 phải tồn tại trong cấu hình');
assert.strictEqual(cb01.code, 'CB01');
assert.strictEqual(cb01.originalPrice, 110000, 'Giá gốc CB01 phải là 110.000đ');
assert.strictEqual(cb01.salePrice, 89000, 'Giá bán CB01 phải là 89.000đ');
assert.strictEqual(cb01.savings, 21000, 'Mức tiết kiệm CB01 phải là 21.000đ');
assert.strictEqual(cb01.shippingPerk, 'Đồng giá ship 15k');
console.log('✅ CB01: Gốc 110k -> Bán 89k | Tiết kiệm 21k | Đồng giá ship 15k');

const cb02 = COMBOS_CONFIG['cb02'];
assert(cb02, 'CB02 phải tồn tại trong cấu hình');
assert.strictEqual(cb02.code, 'CB02');
assert.strictEqual(cb02.originalPrice, 150000, 'Giá gốc CB02 phải là 150.000đ');
assert.strictEqual(cb02.salePrice, 119000, 'Giá bán CB02 phải là 119.000đ');
assert.strictEqual(cb02.savings, 31000, 'Mức tiết kiệm CB02 phải là 31.000đ');
assert(cb02.gift.includes('tealight mini 0đ'), 'Quà CB02 chuẩn xác');
console.log('✅ CB02: Gốc 150k -> Bán 119k | Tiết kiệm 31k | Tặng tealight mini');

const cb03 = COMBOS_CONFIG['cb03'];
assert(cb03, 'CB03 phải tồn tại trong cấu hình');
assert.strictEqual(cb03.code, 'CB03');
assert.strictEqual(cb03.originalPrice, 165000, 'Giá gốc CB03 phải là 165.000đ');
assert.strictEqual(cb03.salePrice, 129000, 'Giá bán CB03 phải là 129.000đ');
assert.strictEqual(cb03.savings, 36000, 'Mức tiết kiệm CB03 phải là 36.000đ');
assert(cb03.gift.includes('tealight') && cb03.gift.includes('thiệp viết tay'), 'Quà CB03 chuẩn xác');
console.log('✅ CB03: Gốc 165k -> Bán 129k | Tiết kiệm 36k | Tặng tealight + thiệp');

// TEST 3: Giỏ hàng và tính phí vận chuyển theo combo
console.log('\n--- TEST 3: Kiểm tra Logic Giỏ Hàng & Vận Chuyển Đồng Giá Combo ---');
mockWindow.localStorage.clear();

// A. Thêm nến đơn SP01 (49.000đ)
ScentPod.addToCart('first-class', 1, 'sp01');
let cart = ScentPod.getCart();
assert.strictEqual(cart.length, 1);
assert.strictEqual(cart[0].price, 49000);
assert.strictEqual(cart[0].code, 'SP01');

let totals = ScentPod.getCartTotals();
assert.strictEqual(totals.subtotal, 49000);
assert.strictEqual(totals.shipping, 25000, 'Đơn lẻ dưới 150k có ship thường 25k');
assert.strictEqual(totals.hasCombo, false);
console.log('✅ Đơn lẻ SP01 (49k): Ship = 25k');

// B. Thêm combo CB01 (89.000đ)
ScentPod.addToCart('cb01', 1);
cart = ScentPod.getCart();
assert.strictEqual(cart.length, 2);
totals = ScentPod.getCartTotals();
assert.strictEqual(totals.subtotal, 49000 + 89000); // 138.000đ
assert.strictEqual(totals.hasCombo, true, 'Giỏ hàng có combo');
assert.strictEqual(totals.shipping, 15000, 'Có combo áp dụng chính sách đồng giá ship 15k');
assert.strictEqual(totals.finalTotal, 138000 + 15000);
console.log('✅ Có Combo CB01 (Tạm tính 138k < 150k): Đồng giá ship 15k thành công!');

// C. Tăng số lượng để tổng đơn >= 150k -> Nhận Freeship
ScentPod.addToCart('blind-date', 1, 'sp01');
totals = ScentPod.getCartTotals();
assert.strictEqual(totals.subtotal, 49000 * 2 + 89000); // 187.000đ >= 150k
assert.strictEqual(totals.shipping, 0, 'Đơn từ 150k trở lên được Freeship 0đ');
assert.strictEqual(totals.finalTotal, 187000);
console.log('✅ Giỏ hàng >= 150k (187k): Miễn phí vận chuyển 0đ thành công!');

// TEST 4: Kiểm tra HTML san-pham.html (Bảng 1 bán lẻ đã bỏ, Combo trình bày dạng card với ảnh chụp thật)
console.log('\n--- TEST 4: Kiểm tra giao diện san-pham.html ---');
const sanphamHtml = fs.readFileSync(path.resolve(__dirname, '../san-pham.html'), 'utf8');
assert(!sanphamHtml.includes('DANH MỤC SẢN PHẨM BÁN LẺ'), 'Bảng 1 sản phẩm bán lẻ đã được gỡ bỏ theo yêu cầu');
assert(!sanphamHtml.includes('id="bang-gia"'), 'Section bảng giá cũ đã được loại bỏ');

// Kiểm tra 3 card Combo chiến lược theo đúng thiết kế
assert(sanphamHtml.includes('combo-cb01-huong-sinh-vien.jpg'), 'Ảnh combo CB01 phải hiển thị ảnh combo thật');
assert(sanphamHtml.includes('combo-cb02-tron-ven-chill.jpg'), 'Ảnh combo CB02 phải hiển thị ảnh combo thật');
assert(sanphamHtml.includes('combo-cb03-trai-nghiem-da-tang.jpg'), 'Ảnh combo CB03 phải hiển thị ảnh combo thật');

assert(sanphamHtml.includes('Combo Hương Sinh Viên') && sanphamHtml.includes('cb01'), 'Card CB01 đầy đủ tên và mã');
assert(sanphamHtml.includes('Combo Trọn Vẹn Chill') && sanphamHtml.includes('cb02'), 'Card CB02 đầy đủ tên và mã');
assert(sanphamHtml.includes('Combo Trải Nghiệm Đa Tầng') && sanphamHtml.includes('cb03'), 'Card CB03 đầy đủ tên và mã');
assert(!sanphamHtml.includes('tag-strategy'), 'Đã gỡ bỏ dòng tag COMBO BÁN HÀNG CHIẾN LƯỢC theo yêu cầu người dùng');
assert(!sanphamHtml.includes('tag-aov'), 'Đã gỡ bỏ dòng tag COMBO TỐI ƯU AOV theo yêu cầu người dùng');
assert(!sanphamHtml.includes('tag-full'), 'Đã gỡ bỏ dòng tag COMBO ĐẦY ĐỦ HƯƠNG SẮC theo yêu cầu người dùng');
assert(!sanphamHtml.includes('product-inbox-hint'), 'Đã gỡ bỏ dòng Giá chốt Inbox trên thẻ sản phẩm theo yêu cầu');

assert(sanphamHtml.includes('2 Hũ Sáp Bỏ Túi 50g'), 'Quy cách CB01 chuẩn');
assert(sanphamHtml.includes('1 Sáp 50g + 1 Nến 100g'), 'Quy cách CB02 chuẩn');
assert(sanphamHtml.includes('3 Hũ Sáp Bỏ Túi 50g'), 'Quy cách CB03 chuẩn');

assert(sanphamHtml.includes('89.000đ'), 'Giá bán CB01 89.000đ');
assert(sanphamHtml.includes('119.000đ'), 'Giá bán CB02 119.000đ');
assert(sanphamHtml.includes('129.000đ'), 'Giá bán CB03 129.000đ');
console.log('✅ Bảng 1 bán lẻ đã được bỏ, 3 combo chiến lược hiển thị dạng card cực đẹp với ảnh combo mới!');

// TEST 5: Kiểm tra HTML index.html
console.log('\n--- TEST 5: Kiểm tra giao diện index.html ---');
const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
assert(indexHtml.includes('CB02') && indexHtml.includes('119.000đ'), 'Card Combo nổi bật CB02 trên trang chủ');
assert(indexHtml.includes('data-size="sp01"') && indexHtml.includes('data-size="sp02"'), 'Nút chọn SP01/SP02 trên trang chủ');
console.log('✅ Trang index.html hiển thị đúng SP01, SP02 và Combo CB02 nổi bật!');

// TEST 6: Kiểm tra thanh-toan.html
console.log('\n--- TEST 6: Kiểm tra thanh-toan.html ---');
const checkoutHtml = fs.readFileSync(path.resolve(__dirname, '../thanh-toan.html'), 'utf8');
assert(checkoutHtml.includes('Đồng giá ship Combo') || checkoutHtml.includes('Đồng giá Combo'), 'Chính sách ship combo được hiển thị');
assert(checkoutHtml.includes('item.gift'), 'Quà tặng được hiển thị trên tóm tắt checkout');
console.log('✅ Trang thanh-toan.html hiển thị quà tặng và ưu đãi ship combo!');

console.log('\n🎉 TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100%! HỆ THỐNG ĐÃ SẴN SÀNG.');
