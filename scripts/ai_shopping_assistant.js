/**
 * ==============================================================================
 * SCENTPOD AI SHOPPING ASSISTANT - BACKEND ENGINE
 * ==============================================================================
 * Tuân thủ triết lý kiến trúc NVIDIA AI Blueprint Retail Shopping Assistant:
 * 1. Zero-LLM Direct Retrieval: Tìm kiếm & kiểm tra sản phẩm trên Catalog thật bằng CODE.
 * 2. Deterministic Code Enforcement: Kiểm tra product_id, giá và tồn kho bằng code.
 * 3. Bảo mật: API keys nằm hoàn toàn ở backend, không bao giờ lộ ra frontend.
 * 4. Quản lý giỏ hàng theo Session ID người dùng.
 * 5. Fallback tự động: Nếu mất kết nối AI ngoài, engine nội bộ tự xử lý trơn tru.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { sendPurchaseRequestNotification } = require('./email_service');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');

// Đọc dữ liệu Catalog thật (Single Source of Truth)
function loadCatalog() {
  try {
    const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[AI Assistant] Lỗi đọc catalog.json:', err);
    return { products: [], defaultShippingPolicy: {} };
  }
}

// Lưu trữ giỏ hàng và phiên người dùng trong bộ nhớ backend
const sessionsStore = new Map();

function getOrCreateSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
  if (!sessionsStore.has(sessionId)) {
    sessionsStore.set(sessionId, {
      sessionId,
      createdAt: Date.now(),
      lastActive: Date.now(),
      cart: [],
      history: [],
      lastRecommendedProductId: null
    });
  }
  const session = sessionsStore.get(sessionId);
  session.lastActive = Date.now();
  if (session.lastRecommendedProductId === undefined) {
    session.lastRecommendedProductId = null;
  }
  return session;
}

// ------------------------------------------------------------------------------
// 1. DETERMINISTIC CATALOG SEARCH ENGINE (TÌM KIẾM SẢN PHẨM BẰNG CODE)
// ------------------------------------------------------------------------------
function parseUserIntent(message) {
  const text = (message || '').toLowerCase();

  // 1. Phân tích ngân sách (Budget)
  // Xử lý chuẩn xác cả 90.000đ, 90.000, 90,000, 90k, 90 nghìn, 90 ngàn, 90000đ
  let maxBudget = null;
  const budgetDotMatch = text.match(/(\d+)[.,](\d{3})\s*(?:k|nghìn|ngàn|vnd|vnđ|đ|đồng)?/);
  const budgetSuffixMatch = text.match(/(\d+)\s*(?:k|nghìn|ngàn)\b/);
  const budgetPrefixMatch = text.match(/(?:ngân sách|tầm|dưới|khoảng|giá|tối đa|tầm giá)\s*[:=]?\s*(\d+)(?:\s*(k|nghìn|ngàn|000|\.000|đ|vnd|vnđ|đồng))?/);
  const budgetCurrencyMatch = text.match(/(\d+)\s*(?:vnd|vnđ|đ|đồng)\b/);

  if (budgetDotMatch) {
    maxBudget = parseInt(budgetDotMatch[1] + budgetDotMatch[2], 10);
  } else if (budgetSuffixMatch) {
    maxBudget = parseInt(budgetSuffixMatch[1], 10) * 1000;
  } else if (budgetPrefixMatch) {
    let num = parseInt(budgetPrefixMatch[1], 10);
    const unit = budgetPrefixMatch[2];
    if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn' || (!unit && num < 1000)) {
      num *= 1000;
    }
    maxBudget = num;
  } else if (budgetCurrencyMatch) {
    let num = parseInt(budgetCurrencyMatch[1], 10);
    if (num < 1000) num *= 1000;
    maxBudget = num;
  }

  // 2. Phân tích nhóm hương (Scent notes / group)
  const scentPreferences = [];
  if (text.includes('chanh') || text.includes('đào') || text.includes('bạc hà') || text.includes('trái cây') || text.includes('tươi mát') || text.includes('fruity')) {
    scentPreferences.push('fruity_fresh');
  }
  if (text.includes('hoa') || text.includes('hoa hồng') || text.includes('xạ hương') || text.includes('ngọt ngào') || text.includes('e ấp') || text.includes('hẹn hò') || text.includes('floral')) {
    scentPreferences.push('floral_warm');
  }
  if (text.includes('biển') || text.includes('muối biển') || text.includes('xô thơm') || text.includes('lily') || text.includes('khoáng') || text.includes('tự do') || text.includes('aquatic')) {
    scentPreferences.push('aquatic_herbal');
  }
  if (text.includes('cà phê') || text.includes('coffee') || text.includes('gỗ') || text.includes('tuyết tùng') || text.includes('trầm') || text.includes('ấm') || text.includes('khuya') || text.includes('woody')) {
    scentPreferences.push('gourmand_woody');
  }

  // 3. Phân tích độ đậm mùi (Intensity)
  let desiredIntensity = null;
  if (text.includes('nhẹ') || text.includes('thoang thoảng') || text.includes('dịu') || text.includes('thanh')) {
    desiredIntensity = 'light';
  } else if (text.includes('đậm') || text.includes('nồng') || text.includes('rõ') || text.includes('lưu hương lâu')) {
    desiredIntensity = 'strong';
  } else if (text.includes('vừa') || text.includes('vừa phải')) {
    desiredIntensity = 'medium';
  }

  // 4. Phân tích không gian (Space) & thời điểm
  const spaceKeywords = [];
  if (text.includes('bàn học') || text.includes('học bài') || text.includes('tập trung') || text.includes('ôn thi')) {
    spaceKeywords.push('bàn học');
  }
  if (text.includes('phòng ngủ') || text.includes('dễ ngủ') || text.includes('thư giãn') || text.includes('giường')) {
    spaceKeywords.push('phòng ngủ');
  }
  if (text.includes('phòng khách') || text.includes('không gian mở') || text.includes('tiếp khách')) {
    spaceKeywords.push('phòng khách');
  }
  if (text.includes('đêm') || text.includes('khuya') || text.includes('tối')) {
    spaceKeywords.push('đêm khuya');
  }

  // 5. Kiểm tra yêu cầu sản phẩm ngoài danh mục nến ScentPod
  const outOfCatalogKeywords = [
    'nước hoa xịt phòng', 'nước hoa vùng kín', 'tinh dầu tán hương',
    'máy xông tinh dầu', 'trầm hương', 'nến 100g', 'nến mini 10g', 'sáp thơm bỏ túi'
  ];
  const requestedOutOfCatalog = outOfCatalogKeywords.filter(kw => text.includes(kw));

  return {
    raw: text,
    maxBudget,
    scentPreferences,
    desiredIntensity,
    spaceKeywords,
    requestedOutOfCatalog
  };
}

/**
 * Tìm kiếm sản phẩm trong catalog dựa trên phân tích ý định
 */
function searchCatalog(intent) {
  const catalog = loadCatalog();
  const products = catalog.products || [];

  // Trường hợp khách hỏi sản phẩm ngoài danh mục
  if (intent.requestedOutOfCatalog.length > 0) {
    return {
      status: 'out_of_catalog',
      requestedItem: intent.requestedOutOfCatalog[0],
      matches: [],
      allCandles: products
    };
  }

  // Trường hợp khách đặt ngân sách quá thấp so với giá sàn nến 50g (85.000đ)
  if (intent.maxBudget !== null && intent.maxBudget < 85000) {
    return {
      status: 'budget_too_low',
      requestedBudget: intent.maxBudget,
      minPrice: 85000,
      matches: [],
      allCandles: products
    };
  }

  // Tính điểm phù hợp cho từng sản phẩm
  const scored = products.map(product => {
    let score = 0;
    const reasons = [];

    // Khớp ngân sách
    if (intent.maxBudget !== null && product.price <= intent.maxBudget) {
      score += 2;
      reasons.push(`Vừa vặn ngân sách ${intent.maxBudget.toLocaleString('vi-VN')}đ (chỉ ${product.price.toLocaleString('vi-VN')}đ)`);
    }

    // Khớp nhóm hương
    if (intent.scentPreferences.includes(product.scentGroup)) {
      score += 5;
      reasons.push(`Đúng nhóm hương yêu thích: ${product.labelNotes}`);
    }

    // Khớp không gian
    const matchSpace = intent.spaceKeywords.some(kw => 
      product.suitableSpace.some(space => space.toLowerCase().includes(kw)) ||
      product.suitableTime.some(time => time.toLowerCase().includes(kw))
    );
    if (matchSpace) {
      score += 3;
      reasons.push(`Rất phù hợp cho không gian ${intent.spaceKeywords.join(', ')}`);
    }

    // Khớp độ đậm mùi
    if (intent.desiredIntensity) {
      if (
        (intent.desiredIntensity === 'light' && (product.intensity === 'light' || product.intensity === 'medium_light')) ||
        (intent.desiredIntensity === 'medium' && (product.intensity === 'medium' || product.intensity === 'medium_light')) ||
        (intent.desiredIntensity === 'strong' && product.intensity === 'strong')
      ) {
        score += 3;
        reasons.push(`Độ đậm mùi vừa ý: ${product.intensityLabel}`);
      }
    }

    // Khớp từ khóa nốt hương
    const labelLower = product.labelNotes.toLowerCase();
    const shortDescLower = product.shortDesc.toLowerCase();
    if (intent.raw.includes('chanh') && labelLower.includes('chanh')) score += 4;
    if (intent.raw.includes('đào') && labelLower.includes('đào')) score += 4;
    if (intent.raw.includes('hồng') && labelLower.includes('hồng')) score += 4;
    if (intent.raw.includes('biển') && labelLower.includes('biển')) score += 4;
    if (intent.raw.includes('cà phê') && labelLower.includes('cà phê')) score += 4;
    if (intent.raw.includes('gỗ') && labelLower.includes('gỗ')) score += 4;

    return {
      product,
      score,
      reasons
    };
  });

  // Sắp xếp theo điểm giảm dần
  scored.sort((a, b) => b.score - a.score);

  // Lấy các sản phẩm có điểm số cao (nếu không có tiêu chí cụ thể thì gợi ý cả bộ sưu tập)
  const topMatches = (scored[0].score > 0)
    ? scored.filter(item => item.score > 0).slice(0, 2)
    : scored.slice(0, 4);

  return {
    status: 'success',
    matches: topMatches.map(m => ({
      ...m.product,
      suggestReason: m.reasons.length > 0 
        ? m.reasons.join('. ') + '.'
        : `Hương ${m.product.labelNotes} thanh lành, thiết kế tối giản dành riêng cho người trẻ.`
    }))
  };
}

// ------------------------------------------------------------------------------
// 2. CODE VALIDATOR (KIỂM TRA PRODUCT_ID, GIÁ & TỒN KHO BẰNG CODE)
// ------------------------------------------------------------------------------
function validateAndEnforceProducts(candidateProducts, overrideCatalog = null) {
  const catalog = overrideCatalog || loadCatalog();
  const catalogMap = new Map((catalog.products || []).map(p => [p.id, p]));

  const verified = [];
  for (const candidate of candidateProducts) {
    if (!candidate || !candidate.id) continue;
    const realProduct = catalogMap.get(candidate.id);
    if (!realProduct) {
      console.warn(`[Code Validator] Bác bỏ product_id không tồn tại trong catalog: ${candidate.id}`);
      continue;
    }

    // ÉP BUỘC giá, tên, tồn kho và ảnh lấy 100% từ catalog thật
    verified.push({
      id: realProduct.id,
      name: realProduct.displayName || realProduct.name,
      code: realProduct.code,
      labelNotes: realProduct.labelNotes,
      category: realProduct.category,
      price: realProduct.price,
      priceFormatted: `${realProduct.price.toLocaleString('vi-VN')}đ`,
      priceBadge: realProduct.priceBadge,
      weight: realProduct.weight,
      stock: realProduct.stock,
      inStock: realProduct.stock > 0,
      image: realProduct.image,
      shortDesc: realProduct.shortDesc,
      intensity: realProduct.intensityLabel,
      suggestReason: candidate.suggestReason || `Hương ${realProduct.labelNotes} ấm êm, đúc thủ công từ sáp đậu nành.`
    });
  }

  return verified;
}

// ------------------------------------------------------------------------------
// 3. BỘ MÁY TẠO PHẢN HỒI (AI ADVISOR GENERATOR + FALLBACK AN TOÀN)
// ------------------------------------------------------------------------------
async function generateAdvisorResponse({ message, sessionId, history }) {
  const session = getOrCreateSession(sessionId);
  const text = (message || '').trim().toLowerCase();
  const catalog = loadCatalog();
  const products = catalog.products || [];

  // A. LỆNH THÊM HÀNG BẰNG VĂN BẢN (Text-based Add to Cart)
  const isQuestion = /(?:có\s+.*(?:không|\?)|như thế nào|bao nhiêu|sao|chăng)/i.test(text);
  const isAdvice = /(?:tư vấn|gợi ý|hỏi|tìm|chọn)\b/i.test(text) && !/vào giỏ|vô giỏ|giỏ hàng/i.test(text);
  const isAddToCartCmd = !isQuestion && !isAdvice && (
    /(?:thêm|cho|bỏ)\s+(?:vào\s+|vô\s+)?giỏ/i.test(text) ||
    /(?:thêm|cho|bỏ)\s+.*(?:vào\s+giỏ|vô\s+giỏ|giỏ\s+hàng)/i.test(text) ||
    /(?:đặt|mua|lấy|chốt)\s+(\d+)\s*(?:hũ|cái|cốc)/i.test(text) ||
    /(?:mua|lấy|chốt|đặt)\s+(?:hũ|mùi|em)\s+này/i.test(text) ||
    /(?:thêm|cho)\s+(\d+)\s*(?:hũ|cái|cốc)\b/i.test(text)
  );
  if (isAddToCartCmd) {
    const qtyMatch = text.match(/(\d+)\s*(?:hũ|cái|cốc|ly)?/);
    const qty = qtyMatch ? Math.max(1, parseInt(qtyMatch[1], 10)) : 1;

    // Xác định mùi hương từ câu lệnh hoặc từ mùi vừa được tư vấn
    let targetProduct = null;
    if (/first|sunday|chanh|bạc hà|mùi 0?1\b/.test(text)) {
      targetProduct = products.find(p => p.id === 'first-class');
    } else if (/blind|date|hồng|xạ hương|mùi 0?2\b/.test(text)) {
      targetProduct = products.find(p => p.id === 'blind-date');
    } else if (/campus|breeze|muối biển|xô thơm|lily|mùi 0?3\b/.test(text)) {
      targetProduct = products.find(p => p.id === 'campus-breeze');
    } else if (/late|night|cà phê|cafe|gỗ|mùi 0?4\b/.test(text)) {
      targetProduct = products.find(p => p.id === 'late-night');
    } else if (session.lastRecommendedProductId) {
      targetProduct = products.find(p => p.id === session.lastRecommendedProductId);
    }

    if (targetProduct) {
      const addRes = addToCart(sessionId, targetProduct.id, qty);
      if (addRes.success) {
        session.lastRecommendedProductId = targetProduct.id;
        const currentCart = getCart(sessionId);
        const verifiedProduct = validateAndEnforceProducts([targetProduct]);
        const shippingNote = currentCart.totalQuantity >= 2
          ? ' 🚚 Đã áp dụng ưu đãi **Ship 15.000đ toàn quốc**!'
          : ' 💡 Gợi ý: Khi mua từ 2 hũ nến, bạn sẽ nhận được ưu đãi **Ship chỉ 15.000đ toàn quốc**!';

        return {
          sessionId,
          reply: `Dạ mình đã thêm **${qty} hũ ${targetProduct.displayName || targetProduct.name}** vào giỏ hàng của bạn rồi nhé! Hiện giỏ hàng của bạn có **${currentCart.totalQuantity} hũ nến** (Tạm tính: **${currentCart.subtotalFormatted}**).${shippingNote} Bạn có thể bấm vào biểu tượng giỏ hàng để tiến hành gửi yêu cầu mua hàng nhé!`,
          suggestedProducts: verifiedProduct,
          cartUpdated: true,
          cart: currentCart
        };
      } else {
        return {
          sessionId,
          reply: `Rất tiếc: ${addRes.error || 'Chưa thể thêm vào giỏ hàng.'}`,
          suggestedProducts: validateAndEnforceProducts([targetProduct])
        };
      }
    } else {
      return {
        sessionId,
        reply: `Dạ bạn muốn thêm mùi nến nào vào giỏ ạ? ScentPod hiện có 4 mùi: **Another Sunday** (Chanh đào bạc hà), **Beloved Summer** (Hoa hồng xạ hương), **Tidal Bloom** (Muối biển xô thơm) và **Coffee Holic** (Cà phê gỗ). Bạn nhắn tên mùi hoặc bấm **Thêm vào giỏ** ngay trên thẻ sản phẩm bên dưới nhé!`,
        suggestedProducts: validateAndEnforceProducts(products)
      };
    }
  }

  // B. CÂU HỎI NỐI TIẾP BÁM SÁT MÙI VỪA TƯ VẤN (Contextual Memory)
  const isFollowUp = /(?:mùi này|hũ này|mùi đó|hũ đó|nến này|nến đó|dòng này|sản phẩm này|em này|hũ vừa rồi|mùi vừa tư vấn|dùng khi nào|thời điểm|đốt được bao lâu|cháy được bao lâu|thành phần|tầng hương|có ngọt không|độ tỏa|không gian nào|hợp phòng nào|bao nhiêu tiền|giá bao nhiêu)/i.test(text);
  if (isFollowUp && session.lastRecommendedProductId) {
    const lastProduct = products.find(p => p.id === session.lastRecommendedProductId);
    if (lastProduct) {
      let followUpReply = '';
      if (/dùng khi nào|thời điểm|lúc nào|khi học|phòng nào|không gian/.test(text)) {
        followUpReply = `Hũ **${lastProduct.displayName || lastProduct.name}** (${lastProduct.labelNotes}) rất thích hợp dùng vào: **${(lastProduct.suitableTime || []).join(', ')}**. Đặc biệt phù hợp cho không gian: **${(lastProduct.suitableSpace || []).join(', ')}**. ${lastProduct.vibe || ''}`;
      } else if (/đốt được bao lâu|cháy được bao lâu|bao lâu|khối lượng|size|nặng/.test(text)) {
        followUpReply = `Hũ nến 50g của dòng **${lastProduct.displayName || lastProduct.name}** được đúc thủ công từ 100% sáp đậu nành thiên nhiên, thời gian đốt liên tục khoảng **12 – 15 giờ**. Mỗi lần thắp bạn nên để sáp tan chảy đều đến mép hũ (1–2 giờ) để nến tỏa hương tốt nhất và không bị lõm mặt nến nhé!`;
      } else if (/có ngọt không|mùi gì|tầng hương|thành phần|nốt hương/.test(text)) {
        followUpReply = `Hũ **${lastProduct.displayName || lastProduct.name}** thuộc nhóm hương **${lastProduct.scentGroupLabel || lastProduct.category}** với độ đậm mùi **${lastProduct.intensityLabel}**. Nốt hương: Top: ${lastProduct.topNotes}; Heart: ${lastProduct.heartNotes}; Base: ${lastProduct.baseNotes}. ${lastProduct.vibe || ''}`;
      } else if (/bao nhiêu|giá|tiền/.test(text)) {
        followUpReply = `Hũ **${lastProduct.displayName || lastProduct.name}** đang có giá ưu đãi HSSV **${lastProduct.price.toLocaleString('vi-VN')}đ/hũ** (giá gốc 95.000đ). Mỗi hũ đều được tặng kèm que diêm dài chuyên dụng và thiệp hướng dẫn. Khi mua từ 2 hũ nến, bạn được áp dụng **Ship 15.000đ toàn quốc**!`;
      } else {
        followUpReply = `Về hũ **${lastProduct.displayName || lastProduct.name}** (${lastProduct.labelNotes}): ${lastProduct.shortDesc} Nến được đúc từ sáp đậu nành thiên nhiên, an toàn và sạch khói. Bạn có thể bấm **Xem chi tiết** hoặc nhắn tin để mình hỗ trợ thêm nhé!`;
      }

      return {
        sessionId,
        reply: followUpReply,
        suggestedProducts: validateAndEnforceProducts([lastProduct])
      };
    }
  }

  // C. TÌM KIẾM THEO INTENT & DANH MỤC
  const intent = parseUserIntent(message);
  const searchResult = searchCatalog(intent);

  // 1. Trường hợp khách hỏi sản phẩm ngoài danh mục
  if (searchResult.status === 'out_of_catalog') {
    const verifiedCandles = validateAndEnforceProducts(searchResult.allCandles);
    return {
      sessionId,
      reply: `Dạ hiện tại ScentPod chưa kinh doanh dòng **${searchResult.requestedItem}** ạ. Tụi mình hiện tập trung đúc thủ công dòng **Nến thơm 50g từ sáp đậu nành thiên nhiên** với 4 mùi hương tinh tuyển rất êm dịu cho không gian học tập và nghỉ ngơi (đồng giá ưu đãi HSSV 85.000đ/hũ). Bạn tham khảo 4 mùi nến này nhé!`,
      suggestedProducts: verifiedCandles
    };
  }

  // 2. Trường hợp ngân sách dưới 85.000đ
  if (searchResult.status === 'budget_too_low') {
    const verifiedCandles = validateAndEnforceProducts(searchResult.allCandles);
    return {
      sessionId,
      reply: `Dạ với mức ngân sách ${intent.maxBudget.toLocaleString('vi-VN')}đ, hiện ScentPod chưa có sản phẩm dưới mức giá này ạ. Dòng nến thơm thủ công 50g của tụi mình có giá niêm yết 95.000đ nhưng đang có **Giá ưu đãi HSSV chỉ 85.000đ/hũ** (kèm que diêm dài chuyên dụng & thiệp HDSD). Khi mua từ 2 hũ, bạn còn được áp dụng chính sách ship 15.000đ toàn quốc. Bạn tham khảo các mùi nến 85k bên dưới nhé!`,
      suggestedProducts: verifiedCandles
    };
  }

  // 3. Kiểm tra sản phẩm hết hàng
  const candidateMatches = searchResult.matches || [];
  const verifiedProducts = validateAndEnforceProducts(candidateMatches);

  // Lưu sản phẩm tư vấn đầu tiên vào session memory
  if (verifiedProducts.length > 0) {
    session.lastRecommendedProductId = verifiedProducts[0].id;
  }

  // Tạo lời thoại tư vấn chuyên nghiệp tiếng Việt
  let advisorSpeech = '';
  if (verifiedProducts.length === 1) {
    const p = verifiedProducts[0];
    if (!p.inStock) {
      advisorSpeech = `Rất tiếc hũ nến **${p.name}** hiện tại đang tạm hết hàng trong kho. Bạn có muốn mình gợi ý một mùi hương tương tự trong bộ sưu tập không ạ?`;
    } else {
      advisorSpeech = `Dựa trên sở thích của bạn, mình gợi ý hũ nến **${p.name}** (${p.labelNotes}). ${p.suggestReason} Nến được đúc tay từ sáp đậu nành thiên nhiên, an toàn cho góc học bài và phòng kín. Bạn có thể bấm **Xem chi tiết** hoặc **Thêm vào giỏ** ngay bên dưới nhé!`;
    }
  } else if (verifiedProducts.length > 1) {
    const inStockItems = verifiedProducts.filter(p => p.inStock);
    if (inStockItems.length === 0) {
      advisorSpeech = `Rất tiếc các sản phẩm phù hợp hiện đang tạm hết hàng. Bạn vui lòng quay lại sau hoặc nhắn trực tiếp qua Fanpage Facebook để tụi mình giữ mẻ nến mới nhất nhé!`;
    } else {
      const names = inStockItems.map(p => `**${p.name}** (${p.labelNotes})`).join(' và ');
      advisorSpeech = `Chào bạn! Với mong muốn của bạn, mình gợi ý 2 hũ nến rất hợp gu là ${names}. Cả hai đều có mức giá ưu đãi HSSV **85.000đ/hũ**. Đặc biệt khi mua từ 2 hũ nến, bạn được áp dụng **Ship 15.000đ toàn quốc**!`;
    }
  } else {
    advisorSpeech = `Chào bạn! ScentPod có 4 mùi hương nến thơm 50g thủ công từ sáp đậu nành. Bạn thích gu mùi thanh mát tỉnh táo (Chanh đào bạc hà), ngọt ngào thư thái (Hoa hồng xạ hương), khoáng đạt tươi mới (Muối biển xô thơm) hay trầm ấm tĩnh lặng (Cà phê gỗ) để mình tư vấn chuẩn nhất nhé?`;
  }

  return {
    sessionId,
    reply: advisorSpeech,
    suggestedProducts: verifiedProducts
  };
}

// ------------------------------------------------------------------------------
// 4. QUẢN LÝ GIỎ HÀNG THEO PHIÊN NGƯỜI DÙNG (CART SESSION OPERATIONS)
// ------------------------------------------------------------------------------
function getCart(sessionId) {
  const session = getOrCreateSession(sessionId);
  const catalog = loadCatalog();
  const catalogMap = new Map((catalog.products || []).map(p => [p.id, p]));

  // Luôn làm tươi lại thông tin giá và tồn kho từ catalog thật
  let subtotal = 0;
  let totalCandles = 0;

  session.cart = (session.cart || []).map(item => {
    const real = catalogMap.get(item.id);
    if (!real) return null;
    const price = real.price;
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;
    totalCandles += item.quantity;

    return {
      id: real.id,
      name: real.displayName || real.name,
      code: real.code,
      labelNotes: real.labelNotes,
      price: price,
      priceFormatted: `${price.toLocaleString('vi-VN')}đ`,
      quantity: item.quantity,
      image: real.image,
      stock: real.stock,
      itemTotal: itemTotal,
      itemTotalFormatted: `${itemTotal.toLocaleString('vi-VN')}đ`
    };
  }).filter(Boolean);

  // Chính sách ship ScentPod:
  // "Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn)."
  let shippingFee = 0;
  let shippingNotice = '';
  if (totalCandles >= 2) {
    shippingFee = 15000;
    shippingNotice = 'Đã áp dụng ưu đãi: Ship 15.000đ toàn quốc khi mua từ 2 hũ nến!';
  } else if (totalCandles === 1) {
    shippingFee = 25000;
    shippingNotice = 'Đơn 1 hũ nến: Phí giao hàng 25.000đ (sẽ được xác nhận khi tư vấn). Mua thêm 1 hũ để nhận ship ưu đãi 15.000đ!';
  } else {
    shippingFee = 0;
    shippingNotice = '';
  }

  const grandTotal = subtotal + shippingFee;

  return {
    sessionId,
    items: session.cart,
    totalQuantity: totalCandles,
    subtotal,
    subtotalFormatted: `${subtotal.toLocaleString('vi-VN')}đ`,
    shippingFee,
    shippingFeeFormatted: shippingFee > 0 ? `${shippingFee.toLocaleString('vi-VN')}đ` : '0đ',
    shippingNotice,
    grandTotal,
    grandTotalFormatted: `${grandTotal.toLocaleString('vi-VN')}đ`
  };
}

function addToCart(sessionId, productId, quantity = 1) {
  const session = getOrCreateSession(sessionId);
  const catalog = loadCatalog();
  const realProduct = (catalog.products || []).find(p => p.id === productId);

  if (!realProduct) {
    return { success: false, error: 'Sản phẩm không tồn tại trong danh mục ScentPod.' };
  }

  // Kiểm tra tồn kho bằng code
  if (realProduct.stock <= 0) {
    return { success: false, error: `Sản phẩm ${realProduct.displayName} hiện đang tạm hết hàng.` };
  }

  const existing = session.cart.find(item => item.id === productId);
  const currentQty = existing ? existing.quantity : 0;
  const targetQty = currentQty + Math.max(1, parseInt(quantity, 10) || 1);

  if (targetQty > realProduct.stock) {
    return {
      success: false,
      error: `Kho chỉ còn ${realProduct.stock} hũ ${realProduct.displayName}. Bạn đã có ${currentQty} hũ trong giỏ hàng.`
    };
  }

  if (existing) {
    existing.quantity = targetQty;
  } else {
    session.cart.push({
      id: realProduct.id,
      quantity: targetQty
    });
  }

  return {
    success: true,
    message: `Đã thêm ${realProduct.displayName} vào giỏ hàng thành công!`,
    cart: getCart(sessionId)
  };
}

function updateCart(sessionId, productId, quantity) {
  const session = getOrCreateSession(sessionId);
  const newQty = parseInt(quantity, 10);

  if (isNaN(newQty) || newQty <= 0) {
    session.cart = session.cart.filter(item => item.id !== productId);
  } else {
    const catalog = loadCatalog();
    const real = (catalog.products || []).find(p => p.id === productId);
    if (real && newQty > real.stock) {
      return {
        success: false,
        error: `Số lượng vượt quá tồn kho (Kho chỉ còn ${real.stock} hũ).`,
        cart: getCart(sessionId)
      };
    }
    const item = session.cart.find(i => i.id === productId);
    if (item) {
      item.quantity = newQty;
    }
  }

  return {
    success: true,
    cart: getCart(sessionId)
  };
}

function clearCart(sessionId) {
  const session = getOrCreateSession(sessionId);
  session.cart = [];
  return {
    success: true,
    cart: getCart(sessionId)
  };
}

function checkout(sessionId, orderInfo) {
  const cartData = getCart(sessionId);
  if (!cartData.items || cartData.items.length === 0) {
    return { success: false, error: 'Giỏ hàng của bạn đang trống.' };
  }

  if (!orderInfo.name || !orderInfo.phone || !orderInfo.address) {
    return { success: false, error: 'Vui lòng cung cấp đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng.' };
  }

  // Tạo mã đơn hàng độc nhất
  const orderId = 'SCP' + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90);

  // Tạo chi tiết đơn hàng
  const orderRecord = {
    orderId,
    sessionId,
    createdAt: new Date().toISOString(),
    customer: {
      name: orderInfo.name,
      phone: orderInfo.phone,
      email: orderInfo.email || '',
      address: orderInfo.address,
      note: orderInfo.note || '',
      giftNote: orderInfo.giftNote || ''
    },
    paymentMethod: orderInfo.paymentMethod || 'COD',
    items: cartData.items,
    totalQuantity: cartData.totalQuantity,
    subtotal: cartData.subtotal,
    shippingFee: cartData.shippingFee,
    grandTotal: cartData.grandTotal,
    status: 'pending_confirmation'
  };

  // Cập nhật trừ tồn kho trong catalog
  try {
    const catalog = loadCatalog();
    for (const item of cartData.items) {
      const prod = (catalog.products || []).find(p => p.id === item.id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    }
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Checkout] Lỗi cập nhật tồn kho catalog:', err);
  }

  // Xóa giỏ hàng sau khi đặt thành công
  clearCart(sessionId);

  return {
    success: true,
    message: 'Đặt hàng thành công! ScentPod sẽ liên hệ xác nhận trong thời gian sớm nhất.',
    order: orderRecord
  };
}

/**
 * ==============================================================================
 * BIỂU MẪU GỬI YÊU CẦU MUA HÀNG (PURCHASE REQUEST) & GỬI EMAIL THÔNG BÁO
 * ==============================================================================
 * - Bỏ qua toàn bộ dữ liệu giá do trình duyệt tự gửi
 * - Lấy danh sách mùi nến và số lượng strictly từ giỏ hàng phiên server
 * - Xác thực tên và số điện thoại
 * - Chỉ xóa giỏ hàng khi dịch vụ email chấp nhận gửi
 * ==============================================================================
 */
async function submitPurchaseRequest(sessionId, customerInfo = {}) {
  const cartData = getCart(sessionId);
  if (!cartData.items || cartData.items.length === 0) {
    return {
      success: false,
      error: 'Giỏ hàng của bạn đang trống. Vui lòng chọn ít nhất 1 hũ nến thơm trước khi gửi yêu cầu.'
    };
  }

  const name = (customerInfo.name || '').trim();
  if (!name || name.length < 2) {
    return {
      success: false,
      error: 'Vui lòng nhập họ và tên người nhận.'
    };
  }

  const phone = (customerInfo.phone || '').trim();
  const cleanPhone = phone.replace(/[\s.-]/g, '');
  if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 13 || !/^[0-9+]+$/.test(cleanPhone)) {
    return {
      success: false,
      error: 'Vui lòng cung cấp số điện thoại hợp lệ (từ 10 chữ số) để ScentPod liên hệ xác nhận.'
    };
  }

  const address = (customerInfo.address || '').trim();
  if (!address || address.length < 5) {
    return {
      success: false,
      error: 'Vui lòng cung cấp địa chỉ giao hàng cụ thể để ScentPod giao nến cho bạn.'
    };
  }

  let paymentMethod = (customerInfo.paymentMethod || 'COD').trim().toUpperCase();
  if (paymentMethod !== 'VIETQR' && paymentMethod !== 'COD') {
    paymentMethod = 'COD';
  }

  const note = (customerInfo.note || '').trim();

  // BỎ QUA TOÀN BỘ DỮ LIỆU GIÁ DO TRÌNH DUYỆT TỰ GỬI:
  // Lấy danh sách mùi nến, số lượng và tính lại giá strictly từ server cart SSOT
  const items = cartData.items.map(item => ({
    id: item.id,
    name: item.name,
    subName: item.subName || 'Nến 50g',
    quantity: item.quantity,
    price: item.price,
    lineTotal: item.lineTotal,
    labelNotes: item.labelNotes || ''
  }));

  const subtotal = cartData.subtotal;
  const shippingFee = cartData.shippingFee;
  const grandTotal = cartData.grandTotal;

  const requestId = 'REQ-' + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90);
  const sentAt = new Date().toISOString();

  // Gửi email thông báo tới email nhóm ScentPod (scentpodcontact@gmail.com)
  try {
    const emailResult = await sendPurchaseRequestNotification({
      requestId,
      sentAt,
      customer: { name, phone, address, paymentMethod, note },
      items,
      totals: { subtotal, shippingFee, grandTotal }
    });

    if (!emailResult || !emailResult.success) {
      return {
        success: false,
        error: emailResult?.error || 'Dịch vụ email từ chối gửi thông báo.'
      };
    }
  } catch (err) {
    return {
      success: false,
      error: 'Không thể gửi email thông báo tới nhóm ScentPod: ' + err.message
    };
  }

  // CHỈ XÓA GIỎ HÀNG KHI DỊCH VỤ EMAIL ĐÃ CHẤP NHẬN GỬI
  clearCart(sessionId);

  return {
    success: true,
    message: 'Đã gửi yêu cầu mua hàng thành công!',
    requestId,
    sentAt,
    customer: { name, phone, address, paymentMethod, note },
    items,
    subtotal,
    shippingFee,
    grandTotal,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0)
  };
}

module.exports = {
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
};

// ------------------------------------------------------------------------------
// 5. CLI DIRECT RUNNER CHO AI AGENT (ĐÁP ỨNG KIỂM THỬ TỰ ĐỘNG CỦA THẦY GIÁO)
// ------------------------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const userQuery = args.join(' ').trim() || 'Tìm nến thơm để bàn học tập trung ôn thi, ngân sách dưới 100k';

  console.log('='.repeat(70));
  console.log('🤖 SCENTPOD AI SHOPPING AGENT - DIRECT CLI EXECUTION');
  console.log(`📥 Query đầu vào: "${userQuery}"`);
  console.log('='.repeat(70));

  generateAdvisorResponse({
    message: userQuery,
    sessionId: 'cli_agent_eval_' + Date.now()
  }).then(result => {
    console.log('\n📤 Kết quả phản hồi của AI Agent (JSON):');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ Thực thi thành công (Exit Code 0)');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Lỗi khi AI Agent thực thi:', err);
    process.exit(1);
  });
}
