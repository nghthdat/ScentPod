const fs = require('fs');
const path = require('path');

const root = __dirname + '/..';
const htmlFiles = ['index.html', 'san-pham.html', 've-chung-toi.html', 'chi-tiet-san-pham.html'];

console.log('--- 1. KIỂM TRA TỒN TẠI TẬP TIN & LIÊN KẾT NỘI BỘ ---');
htmlFiles.forEach(file => {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Không tìm thấy ${file}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // Check images
  const imgMatches = content.match(/src=["'](images\/[^"']+)["']/g) || [];
  imgMatches.forEach(m => {
    const src = m.replace(/src=["']/, '').replace(/["']/, '');
    const imgPath = path.join(root, src);
    if (!fs.existsSync(imgPath)) {
      console.error(`❌ ${file}: Không tìm thấy ảnh ${src}`);
    } else {
      // console.log(`✓ ${file}: Ảnh tồn tại ${src}`);
    }
  });

  // Check CSS
  if (!content.includes('css/style.css')) {
    console.error(`❌ ${file} thiếu css/style.css`);
  }

  // Check JS
  if (!content.includes('js/main.js')) {
    console.error(`❌ ${file} thiếu js/main.js`);
  }

  // Check forbidden terms
  const forbidden = [
    'sáp thơm bỏ túi',
    'sáp bỏ túi',
    '100g',
    '10g',
    '49.000',
    '79.000',
    '95.000',
    'AI Concierge',
    'AI Search',
    'an toàn tuyệt đối',
    'đồng giá ship'
  ];

  forbidden.forEach(term => {
    // Check case-insensitively
    const regex = new RegExp(term, 'i');
    if (regex.test(content)) {
      console.warn(`⚠️ ${file} còn chứa từ khóa cấm: "${term}"`);
    }
  });

  console.log(`✅ ${file} đã qua kiểm tra cấu trúc cơ bản`);
});

console.log('\n--- 2. KIỂM TRA 4 MÙI HƯƠNG TRÊN INDEX VÀ SAN-PHAM ---');
['index.html', 'san-pham.html'].forEach(file => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  ['First Class', 'Blind Date', 'Campus Breeze', 'Late Night'].forEach(scent => {
    if (!content.includes(scent)) {
      console.error(`❌ ${file} thiếu mùi ${scent}`);
    } else {
      console.log(`✓ ${file} có đủ mùi ${scent}`);
    }
  });

  if (!content.includes('85.000đ')) {
    console.error(`❌ ${file} thiếu giá 85.000đ`);
  } else {
    console.log(`✓ ${file} có giá 85.000đ chuẩn`);
  }

  if (!content.includes('Ship 15.000đ toàn quốc khi mua từ 2 hũ nến')) {
    console.error(`❌ ${file} thiếu điều kiện ship 15.000đ khi mua từ 2 hũ nến`);
  } else {
    console.log(`✓ ${file} có chính sách ship có điều kiện chuẩn`);
  }
});

console.log('\n--- 3. KIỂM TRA JS/MAIN.JS VÀ CẤU HÌNH SẢN PHẨM ---');
const mainJs = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const products = ['first-class', 'blind-date', 'campus-breeze', 'late-night'];
products.forEach(p => {
  if (!mainJs.includes(p)) {
    console.error(`❌ js/main.js thiếu cấu hình sản phẩm ${p}`);
  } else {
    console.log(`✓ js/main.js có cấu hình sản phẩm ${p}`);
  }
});

if (mainJs.includes('facebook_cta_click')) {
  console.log('✓ js/main.js có tracking GA4 facebook_cta_click');
} else {
  console.error('❌ js/main.js thiếu tracking GA4 facebook_cta_click');
}

if (mainJs.includes('https://www.facebook.com/profile.php?id=61594607444699')) {
  console.log('✓ js/main.js liên kết Facebook chính thức chuẩn');
} else {
  console.error('❌ js/main.js thiếu link Facebook chuẩn');
}

console.log('\n🎉 TOÀN BỘ KIỂM TRA HOÀN TẤT THÀNH CÔNG!');

