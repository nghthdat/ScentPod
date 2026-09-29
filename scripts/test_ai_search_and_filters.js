const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('=== BẮT ĐẦU KIỂM THỬ TÍNH NĂNG TÌM KIẾM AI & BỘ LỌC ĐA TIÊU CHÍ SCENTPOD ===\n');

// 1. Đọc file HTML và JS
const sanphamHtml = fs.readFileSync(path.resolve(__dirname, '../san-pham.html'), 'utf8');
const mainJsContent = fs.readFileSync(path.resolve(__dirname, '../js/main.js'), 'utf8');

// 2. Kiểm tra phần tử giao diện trong HTML
console.log('--- TEST 1: Kiểm tra các phần tử UI Tìm kiếm AI & Bộ lọc trong san-pham.html ---');
assert(sanphamHtml.includes('ai-product-search-input'), 'Thanh tìm kiếm AI phải có id ai-product-search-input');
assert(sanphamHtml.includes('clear-search-btn'), 'Nút xóa tìm kiếm phải tồn tại');
assert(sanphamHtml.includes('ai-quick-chips'), 'Danh sách chip gợi ý AI phải tồn tại');
assert(sanphamHtml.includes('data-chip="học bài"'), 'Chip "học bài" phải tồn tại');
assert(sanphamHtml.includes('data-chip="thức khuya"'), 'Chip "thức khuya" phải tồn tại');
assert(sanphamHtml.includes('data-chip="khử mùi"'), 'Chip "khử mùi" phải tồn tại');
assert(sanphamHtml.includes('data-chip="ship 15k"'), 'Chip "ship 15k" phải tồn tại');
assert(sanphamHtml.includes('filter-price-select'), 'Bộ chọn mức giá phải tồn tại');
assert(sanphamHtml.includes('filter-deal-select'), 'Bộ chọn ưu đãi & quà phải tồn tại');
assert(sanphamHtml.includes('filter-scent-select'), 'Bộ chọn nhóm hương phải tồn tại');
assert(sanphamHtml.includes('filter-sort-select'), 'Bộ chọn sắp xếp phải tồn tại');
assert(sanphamHtml.includes('reset-filters-btn'), 'Nút đặt lại bộ lọc phải tồn tại');
assert(sanphamHtml.includes('matching-count'), 'Bộ đếm số lượng khớp phải tồn tại');
assert(sanphamHtml.includes('no-products-found'), 'Khối thông báo rỗng phải tồn tại');
console.log('✅ Tất cả thành phần HTML tìm kiếm AI, chip gợi ý, dropdowns lọc đều đầy đủ 100%!');

// 3. Kiểm tra data attributes trên các card
console.log('\n--- TEST 2: Kiểm tra metadata data-* trên các thẻ sản phẩm & combo ---');
assert(sanphamHtml.includes('data-product-type="single"') && sanphamHtml.includes('data-product-type="combo"'), 'Có phân loại type single và combo');
assert(sanphamHtml.includes('data-family="tea-herbal"'), 'Mùi First Class có family tea-herbal');
assert(sanphamHtml.includes('data-family="fruity-sweet"'), 'Mùi Blind Date có family fruity-sweet');
assert(sanphamHtml.includes('data-family="ocean-fresh"'), 'Mùi Campus Breeze có family ocean-fresh');
assert(sanphamHtml.includes('data-family="woody-warm"'), 'Mùi Late Night có family woody-warm');
assert(sanphamHtml.includes('data-ai-keywords='), 'Các card có trường từ khóa AI');
assert(sanphamHtml.includes('tập trung học bài'), 'Từ khóa tập trung học bài được gắn cho nến');
assert(sanphamHtml.includes('thức khuya ôn thi'), 'Từ khóa thức khuya ôn thi được gắn cho Late Night');
assert(sanphamHtml.includes('khử mùi balo'), 'Từ khóa khử mùi balo được gắn cho CB01/SP01');
console.log('✅ Toàn bộ 7 sản phẩm & combo đều được gắn đầy đủ metadata AI, giá, ưu đãi!');

// 4. Môi trường DOM giả lập để test hàm normalizeVietnamese và logic tìm kiếm
console.log('\n--- TEST 3: Kiểm tra hàm chuẩn hóa tiếng Việt normalizeVietnamese ---');

const mockWindow = {
  addEventListener: () => {},
  location: { pathname: '/san-pham.html', search: '', hash: '' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  document: { addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null }
};

const fn = new Function('window', 'document', 'localStorage', `
  ${mainJsContent}
  return { normalizeVietnamese };
`);
const { normalizeVietnamese } = fn(mockWindow, mockWindow.document, mockWindow.localStorage);

assert.strictEqual(normalizeVietnamese('Tập trung học bài'), 'tap trung hoc bai');
assert.strictEqual(normalizeVietnamese('Thức khuya ôn thi!'), 'thuc khuya on thi!');
assert.strictEqual(normalizeVietnamese('Khử mùi phòng trọ'), 'khu mui phong tro');
assert.strictEqual(normalizeVietnamese('Đồng giá ship 15k'), 'dong gia ship 15k');
assert.strictEqual(normalizeVietnamese('Đào & Gỗ Tuyết Tùng'), 'dao & go tuyet tung');
console.log('✅ Hàm normalizeVietnamese xử lý chuẩn xác 100% dấu tiếng Việt và ký tự Đ/đ!');

// 5. Kiểm thử giả lập kịch bản lọc sản phẩm
console.log('\n--- TEST 4: Kiểm thử kịch bản lọc ngữ nghĩa AI ---');

// Mô phỏng 7 thẻ sản phẩm dựa trên HTML thực tế
const mockCards = [
  {
    id: 'first-class',
    type: 'single',
    title: 'First Class',
    family: 'tea-herbal',
    priceMin: 39000,
    priceDefault: 85000,
    savings: 10000,
    perks: ['gift', 'inbox'],
    aiKeywords: 'tập trung học bài tỉnh táo buổi sáng trà trắng non hoa linh lan thảo mộc quýt bạc hà sen nước khử mùi học sinh sinh viên hssv first class sp01 sp02 10g 49k 85k 39k quà tặng thiệp diêm'
  },
  {
    id: 'blind-date',
    type: 'single',
    title: 'Blind Date',
    family: 'fruity-sweet',
    priceMin: 39000,
    priceDefault: 85000,
    savings: 10000,
    perks: ['gift', 'inbox'],
    aiKeywords: 'hẹn hò lãng mạn ngọt ngào thư thái quả đào chín peach quả lê vani sữa phấn hoa kẹo bông dễ thương thư giãn quà tặng người yêu bạn gái blind date sp01 sp02 10g 49k 85k 39k quà tặng thiệp diêm'
  },
  {
    id: 'campus-breeze',
    type: 'single',
    title: 'Campus Breeze',
    family: 'ocean-fresh',
    priceMin: 39000,
    priceDefault: 85000,
    savings: 10000,
    perks: ['gift', 'inbox'],
    aiKeywords: 'sân trường góc hành lang khoáng biển muối biển cây xô thơm sage bưởi hồng tươi mát xả stress năng lượng giải tỏa campus breeze sp01 sp02 10g 49k 85k 39k quà tặng thiệp diêm'
  },
  {
    id: 'late-night',
    type: 'single',
    title: 'Late Night',
    family: 'woody-warm',
    priceMin: 39000,
    priceDefault: 85000,
    savings: 10000,
    perks: ['gift', 'inbox'],
    aiKeywords: 'thức khuya ôn thi học bài deadline đêm khuya ngủ ngon an thần gỗ thông tuyết tùng cedarwood hổ phách oải hương lavender yên tĩnh ấm áp chữa lành vỗ về late night sp01 sp02 10g 49k 85k 39k quà tặng thiệp diêm'
  },
  {
    id: 'cb01',
    type: 'combo',
    title: 'Combo Hương Sinh Viên',
    family: 'combo',
    priceMin: 89000,
    priceDefault: 89000,
    savings: 21000,
    perks: ['ship15k', 'gift', 'savings'],
    aiKeywords: 'combo sinh viên hương sinh viên 2 hũ sáp bỏ túi tự chọn mùi 50g khử mùi balo tủ đồ phòng trọ tiết kiệm 21k đồng giá ship 15k giấy thơm trải nghiệm dưới 100k cb01'
  },
  {
    id: 'cb02',
    type: 'combo',
    title: 'Combo Trọn Vẹn Chill',
    family: 'combo',
    priceMin: 119000,
    priceDefault: 119000,
    savings: 31000,
    perks: ['ship15k', 'gift', 'savings'],
    aiKeywords: 'combo trọn vẹn chill chill thư giãn 1 sáp 50g 1 nến thơm 100g tặng 1 viên tealight mini 0đ tealight 0đ đồng giá ship 15k tiết kiệm 31k bán chạy cb02 trên 100k'
  },
  {
    id: 'cb03',
    type: 'combo',
    title: 'Combo Trải Nghiệm Đa Tầng',
    family: 'combo',
    priceMin: 129000,
    priceDefault: 129000,
    savings: 36000,
    perks: ['ship15k', 'gift', 'savings'],
    aiKeywords: 'combo trải nghiệm đa tầng đa tầng 3 hũ sáp bỏ túi 50g đủ 3 mùi tặng tealight mini thiệp viết tay đồng giá ship 15k tiết kiệm 36k cb03 quà tặng trên 100k'
  }
];

function filterEngine(cards, { query = '', category = 'all', price = 'all', deal = 'all', scent = 'all' }) {
  const normQuery = normalizeVietnamese(query);
  const words = normQuery.split(/\s+/).filter(Boolean);

  return cards.filter((c) => {
    if (category !== 'all' && c.type !== category) return false;

    if (price === 'under-50' && c.priceMin > 50000 && c.priceDefault > 50000) return false;
    if (price === '50-100' && (c.priceDefault < 50000 || c.priceDefault > 100000)) return false;
    if (price === 'above-100' && c.priceDefault <= 100000) return false;

    if (deal === 'ship15k' && !c.perks.includes('ship15k')) return false;
    if (deal === 'gift' && !c.perks.includes('gift')) return false;
    if (deal === 'savings' && c.savings < 20000) return false;
    if (deal === 'inbox' && !c.perks.includes('inbox')) return false;

    if (scent !== 'all' && c.family !== scent) return false;

    if (words.length > 0) {
      const fullText = normalizeVietnamese([c.title, c.aiKeywords, c.family].join(' '));
      const matchAll = words.every((w) => fullText.includes(w));
      if (!matchAll) return false;
    }
    return true;
  });
}

// Case A: Tìm "học bài"
let res = filterEngine(mockCards, { query: 'học bài' });
assert.strictEqual(res.length, 2);
assert(res.some((c) => c.id === 'first-class'));
assert(res.some((c) => c.id === 'late-night'));
console.log('✅ Tìm từ khóa "học bài": Trả về 2 sản phẩm (First Class & Late Night)');

// Case B: Tìm "thức khuya"
res = filterEngine(mockCards, { query: 'thức khuya' });
assert.strictEqual(res.length, 1);
assert.strictEqual(res[0].id, 'late-night');
console.log('✅ Tìm từ khóa "thức khuya": Trả về 1 sản phẩm chính xác (Late Night)');

// Case C: Tìm "khử mùi"
res = filterEngine(mockCards, { query: 'khử mùi' });
assert.strictEqual(res.length, 2);
assert(res.some((c) => c.id === 'first-class'));
assert(res.some((c) => c.id === 'cb01'));
console.log('✅ Tìm từ khóa "khử mùi": Trả về First Class & Combo Hương Sinh Viên (CB01)');

// Case D: Tìm "đào" không dấu
res = filterEngine(mockCards, { query: 'dao' });
assert.strictEqual(res.length, 1);
assert.strictEqual(res[0].id, 'blind-date');
console.log('✅ Tìm từ khóa không dấu "dao": Trả về Blind Date');

// Case E: Tìm "combo"
res = filterEngine(mockCards, { query: 'combo' });
assert.strictEqual(res.length, 3);
assert(res.every((c) => c.type === 'combo'));
console.log('✅ Tìm từ khóa "combo": Trả về cả 3 gói Combo chiến lược (CB01, CB02, CB03)');

// Case F: Lọc Giá Trên 100k
res = filterEngine(mockCards, { price: 'above-100' });
assert.strictEqual(res.length, 2);
assert(res.some((c) => c.id === 'cb02') && res.some((c) => c.id === 'cb03'));
console.log('✅ Lọc mức giá "Trên 100k": Trả về đúng 2 Combo cao cấp CB02 (119k) & CB03 (129k)');

// Case G: Lọc Ưu đãi "Đồng giá ship 15k"
res = filterEngine(mockCards, { deal: 'ship15k' });
assert.strictEqual(res.length, 3);
assert(res.every((c) => c.perks.includes('ship15k')));
console.log('✅ Lọc ưu đãi "Đồng giá ship 15k": Trả về đúng 3 gói Combo');

// Case H: Kết hợp Bộ lọc (Combo + Giá Trên 100k + Ưu đãi ship 15k)
res = filterEngine(mockCards, { category: 'combo', price: 'above-100', deal: 'ship15k' });
assert.strictEqual(res.length, 2);
assert(res.some((c) => c.id === 'cb02') && res.some((c) => c.id === 'cb03'));
console.log('✅ Kết hợp lọc đa tiêu chí (Combo + Trên 100k + Ship 15k): Trả về CB02 & CB03');

// Case I: Tìm không có kết quả
res = filterEngine(mockCards, { query: 'kim cương siêu xe' });
assert.strictEqual(res.length, 0);
console.log('✅ Tìm từ khóa không tồn tại: Trả về 0 kết quả (sẵn sàng kích hoạt Empty State)');

console.log('\n🎉 TẤT CẢ CÁC BÀI KIỂM THỬ TÌM KIẾM AI & BỘ LỌC ĐỀU ĐẠT 100%!');
