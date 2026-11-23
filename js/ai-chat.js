/**
 * ==============================================================================
 * SCENTPOD AI SHOPPING ASSISTANT - CLIENT LOGIC & CHAT WIDGET
 * ==============================================================================
 */

(function () {
  const SESSION_KEY = 'scentpod_session_id';

  // 1. Quản lý phiên người dùng
  function getSessionId() {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  const sessionId = getSessionId();
  let chatHistory = [];
  let isSending = false;
  let clientLastRecommendedId = null;

  // 2. Khởi tạo giao diện DOM cho Khung chat
  function initChatWidget() {
    if (document.getElementById('scent-ai-chat-root')) return;

    const root = document.createElement('div');
    root.id = 'scent-ai-chat-root';
    root.innerHTML = `
      <!-- Nút mở khung chat nổi góc phải -->
      <button type="button" class="scent-ai-launcher" id="scent-ai-launcher-btn" aria-label="Mở Trợ lý mua hàng AI" title="Trợ lý mua hàng AI ScentPod">
        <span class="scent-ai-launcher-icon">✨</span>
        <span>Trợ Lý Mua Hàng</span>
        <span class="scent-ai-launcher-badge">AI</span>
      </button>

      <!-- Cửa sổ Chat Widget -->
      <div class="scent-ai-chat-window" id="scent-ai-chat-window" role="dialog" aria-modal="true" aria-labelledby="scent-ai-title">
        <!-- Header -->
        <div class="scent-ai-chat-header">
          <div class="scent-ai-header-left">
            <div class="scent-ai-avatar">🕯️</div>
            <div class="scent-ai-header-info">
              <h4 id="scent-ai-title">ScentPod AI Advisor</h4>
              <div class="scent-ai-status">
                <span class="scent-ai-status-dot"></span>
                <span>Tư vấn mùi hương trực tuyến</span>
              </div>
            </div>
          </div>
          <div class="scent-ai-header-actions">
            <button type="button" id="scent-ai-close-btn" aria-label="Đóng cửa sổ chat" title="Thu nhỏ">&times;</button>
          </div>
        </div>

        <!-- Thân danh sách tin nhắn -->
        <div class="scent-ai-messages-body" id="scent-ai-messages-body">
          <!-- Tin nhắn chào mừng mặc định -->
          <div class="scent-ai-msg scent-ai-msg-bot">
            <div class="scent-ai-bubble">
              Xin chào! Mình là <strong>Trợ lý mua hàng AI của ScentPod</strong> 🌿
              <br><br>
              Bạn đang tìm nến thơm theo <em>ngân sách</em>, <em>nhóm hương</em>, <em>độ đậm</em> hay <em>không gian</em> nào? Hãy nhắn cho mình nhé!
            </div>
          </div>
        </div>

        <!-- Thanh gợi ý nhanh (Quick Chips) -->
        <div class="scent-ai-chips-strip" id="scent-ai-chips-strip">
          <button type="button" class="scent-ai-chip" data-query="Tìm nến thơm để bàn học tập trung ôn thi">📚 Bàn học tập trung</button>
          <button type="button" class="scent-ai-chip" data-query="Nến thơm phòng ngủ dễ ngủ ngọt dịu">🌙 Phòng ngủ dễ chịu</button>
          <button type="button" class="scent-ai-chip" data-query="Ngân sách dưới 100k cho học sinh sinh viên">💰 Ngân sách dưới 100k</button>
          <button type="button" class="scent-ai-chip" data-query="Mùi cà phê gỗ ấm đêm khuya">☕ Cà phê & gỗ ấm</button>
        </div>

        <!-- Input Form -->
        <form class="scent-ai-input-form" id="scent-ai-form">
          <input type="text" class="scent-ai-input" id="scent-ai-input-field" placeholder="Hỏi gu mùi, ngân sách, không gian..." maxlength="500" autocomplete="off" required>
          <button type="submit" class="scent-ai-send-btn" id="scent-ai-send-btn" aria-label="Gửi tin nhắn" title="Gửi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(root);
    setupChatEvents();
  }

  // 3. Đăng ký sự kiện
  function setupChatEvents() {
    const launcher = document.getElementById('scent-ai-launcher-btn');
    const windowEl = document.getElementById('scent-ai-chat-window');
    const closeBtn = document.getElementById('scent-ai-close-btn');
    const form = document.getElementById('scent-ai-form');
    const input = document.getElementById('scent-ai-input-field');
    const chipsStrip = document.getElementById('scent-ai-chips-strip');

    function toggleChat() {
      const isOpen = windowEl.classList.contains('is-open');
      if (isOpen) {
        windowEl.classList.remove('is-open');
      } else {
        windowEl.classList.add('is-open');
        input.focus();
        // GA4 tracking: chat_open
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'chat_open', {
            event_category: 'engagement',
            session_id: sessionId
          });
        }
      }
    }

    launcher.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', () => windowEl.classList.remove('is-open'));

    // Gợi ý nhanh
    chipsStrip.addEventListener('click', (e) => {
      const chip = e.target.closest('.scent-ai-chip');
      if (chip) {
        const query = chip.getAttribute('data-query');
        input.value = query;
        handleSendMessage(query);
      }
    });

    // Submit form
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || isSending) return;
      handleSendMessage(text);
    });
  }

  // 4. Xử lý gửi tin nhắn
  async function handleSendMessage(text) {
    const messagesBody = document.getElementById('scent-ai-messages-body');
    const input = document.getElementById('scent-ai-input-field');
    const sendBtn = document.getElementById('scent-ai-send-btn');

    // Thêm tin nhắn của User
    appendMessage('user', text);
    input.value = '';
    isSending = true;
    sendBtn.disabled = true;

    // GA4 tracking: chat_message
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'chat_message', {
        event_category: 'ai_assistant',
        message_length: text.length
      });
    }

    // Hiển thị typing indicator
    const typingId = 'typing_' + Date.now();
    const typingEl = document.createElement('div');
    typingEl.className = 'scent-ai-msg scent-ai-msg-bot';
    typingEl.id = typingId;
    typingEl.innerHTML = `
      <div class="scent-ai-bubble scent-ai-typing">
        <span class="scent-ai-typing-dot"></span>
        <span class="scent-ai-typing-dot"></span>
        <span class="scent-ai-typing-dot"></span>
      </div>
    `;
    messagesBody.appendChild(typingEl);
    messagesBody.scrollTop = messagesBody.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({
          sessionId,
          message: text,
          history: chatHistory.slice(-6)
        })
      });

      const data = await res.json();
      const typingNode = document.getElementById(typingId);
      if (typingNode) typingNode.remove();

      if (data && data.reply) {
        appendMessage('bot', data.reply, data.suggestedProducts);
        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: data.reply });

        // Lưu sản phẩm tư vấn gần nhất ở client để dự phòng
        if (data.suggestedProducts && data.suggestedProducts.length > 0) {
          clientLastRecommendedId = data.suggestedProducts[0].id;
        }

        // Tự động làm mới & mở giỏ hàng nếu câu lệnh văn bản đã cập nhật giỏ
        if (data.cartUpdated) {
          if (window.ScentPodCart && typeof window.ScentPodCart.refresh === 'function') {
            window.ScentPodCart.refresh();
            window.ScentPodCart.openDrawer();
          }
        }
      } else {
        appendMessage('bot', 'Dạ tụi mình đã ghi nhận thông tin. Bạn có thể tham khảo 4 mùi nến 50g thủ công của ScentPod nhé!', getClientFallbackProducts(text));
      }
    } catch (err) {
      console.warn('[AI Chat] Lỗi kết nối /api/chat, chuyển sang Local Client Engine:', err);
      const typingNode = document.getElementById(typingId);
      if (typingNode) typingNode.remove();

      // Graceful Local Fallback với đầy đủ 4 sản phẩm
      const fallbackResult = generateClientLocalResponse(text);
      appendMessage('bot', fallbackResult.reply, fallbackResult.products);
      chatHistory.push({ role: 'user', content: text });
      chatHistory.push({ role: 'assistant', content: fallbackResult.reply });
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // 5. Thêm tin nhắn vào khung
  function appendMessage(sender, text, products = []) {
    const messagesBody = document.getElementById('scent-ai-messages-body');
    const msgEl = document.createElement('div');
    msgEl.className = `scent-ai-msg scent-ai-msg-${sender}`;

    // Format markdown bold/italic nhẹ
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    let html = `<div class="scent-ai-bubble">${formattedText}</div>`;

    // Render thẻ sản phẩm tương tác nếu có
    if (products && products.length > 0) {
      products.forEach(p => {
        const inStock = p.inStock !== false && (p.stock === undefined || p.stock > 0);
        const stockLabel = inStock ? `Còn ${p.stock || 20} hũ` : 'Tạm hết hàng';
        const stockClass = inStock ? '' : 'is-out';
        const addBtnDisabled = inStock ? '' : 'disabled';
        const addBtnText = inStock ? '🛒 Thêm vào giỏ' : 'Hết hàng';

        html += `
          <div class="scent-ai-product-card" data-product-id="${p.id}">
            <div class="scent-ai-card-img-wrap">
              <span class="scent-ai-card-badge">${p.code || 'Nến 50g'}</span>
              <span class="scent-ai-stock-badge ${stockClass}">${stockLabel}</span>
              <img src="${p.image || 'images/sap-thom-bo-ba.jpg'}" alt="${p.name}" loading="lazy" onerror="this.src='images/sap-thom-bo-ba.jpg';">
            </div>
            <div class="scent-ai-card-content">
              <h5 class="scent-ai-card-title">${p.name}</h5>
              <div class="scent-ai-card-notes">Nốt hương: ${p.labelNotes || ''}</div>
              <div class="scent-ai-card-price-row">
                <span class="scent-ai-card-price">${p.priceFormatted || '85.000đ'}</span>
                <span class="scent-ai-card-hssv-tag">${p.priceBadge || 'Giá ưu đãi HSSV'}</span>
              </div>
              ${p.suggestReason ? `<div class="scent-ai-card-reason">💡 <em>${p.suggestReason}</em></div>` : ''}
              <div class="scent-ai-card-actions">
                <button type="button" class="scent-ai-btn-detail" data-action-detail="${p.id}">🔍 Xem chi tiết</button>
                <button type="button" class="scent-ai-btn-add-cart" data-action-add="${p.id}" ${addBtnDisabled}>${addBtnText}</button>
              </div>
            </div>
          </div>
        `;
      });
    }

    msgEl.innerHTML = html;
    messagesBody.appendChild(msgEl);
    messagesBody.scrollTop = messagesBody.scrollHeight;

    // Gán sự kiện cho các nút hành động trong thẻ sản phẩm
    attachCardActionEvents(msgEl);
  }

  // 6. Gán sự kiện click Thêm giỏ & Xem chi tiết trên thẻ sản phẩm
  function attachCardActionEvents(container) {
    // Xem chi tiết
    container.querySelectorAll('[data-action-detail]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = e.currentTarget.getAttribute('data-action-detail');
        if (typeof window.openScentModal === 'function') {
          window.openScentModal(pid);
        } else {
          window.location.href = `chi-tiet-san-pham.html?id=${encodeURIComponent(pid)}`;
        }
      });
    });

    // Thêm vào giỏ
    container.querySelectorAll('[data-action-add]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const button = e.currentTarget;
        const pid = button.getAttribute('data-action-add');
        if (button.disabled) return;

        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '⏳ Đang thêm...';

        try {
          const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Id': sessionId
            },
            body: JSON.stringify({
              sessionId,
              productId: pid,
              quantity: 1
            })
          });

          const data = await res.json();
          if (data.success) {
            button.innerHTML = '✓ Đã thêm vào giỏ!';
            button.style.background = '#4ade80';
            button.style.color = '#120e0a';

            // Làm mới giỏ hàng
            if (window.ScentPodCart && typeof window.ScentPodCart.refresh === 'function') {
              window.ScentPodCart.refresh();
              window.ScentPodCart.openDrawer();
            }

            // GA4 tracking: add_to_cart
            if (typeof window.gtag === 'function') {
              window.gtag('event', 'add_to_cart', {
                event_category: 'ecommerce',
                currency: 'VND',
                value: 85000,
                items: [{
                  item_id: pid,
                  item_name: pid,
                  price: 85000,
                  quantity: 1
                }]
              });
            }

            setTimeout(() => {
              button.innerHTML = originalText;
              button.style.background = '';
              button.style.color = '';
              button.disabled = false;
            }, 2500);
          } else {
            alert(data.error || 'Không thể thêm vào giỏ hàng.');
            button.innerHTML = originalText;
            button.disabled = false;
          }
        } catch (err) {
          console.error('[Add to Cart] Lỗi:', err);
          alert('Có lỗi khi thêm vào giỏ hàng. Vui lòng thử lại!');
          button.innerHTML = originalText;
          button.disabled = false;
        }
      });
    });
  }

  // 7. Client-side Local Advisor Engine (Dự phòng thông minh khi offline hoặc serverless timeout)
  const CLIENT_CATALOG = [
    {
      id: "first-class",
      name: "Another Sunday (First Class)",
      code: "Mùi 01",
      labelNotes: "Chanh, đào & bạc hà",
      category: "Trái cây tươi mát & Thảo mộc",
      price: 85000,
      priceFormatted: "85.000đ",
      priceBadge: "Giá ưu đãi HSSV",
      weight: "50g",
      stock: 25,
      inStock: true,
      image: "images/sap-thom-bo-ba.jpg",
      shortDesc: "Hương chanh vàng thanh chua tươi mát, đào chín ngọt dịu và lá bạc hà mát lạnh, khơi dậy năng lượng và sự tập trung.",
      intensity: "Thanh mát, nhẹ dịu",
      suggestReason: "Rất hợp góc bàn học, khơi dậy năng lượng tập trung ôn thi."
    },
    {
      id: "blind-date",
      name: "Beloved Summer (Blind Date)",
      code: "Mùi 02",
      labelNotes: "Xạ hương & hoa hồng",
      category: "Hoa hồng phấn & Xạ hương ấm",
      price: 85000,
      priceFormatted: "85.000đ",
      priceBadge: "Giá ưu đãi HSSV",
      weight: "50g",
      stock: 4,
      inStock: true,
      image: "images/nen-thom-mini.jpg",
      shortDesc: "Hương hoa hồng ngọt ngào, e ấp hòa cùng nét ấm nồng bí ẩn của xạ hương và vani sữa.",
      intensity: "Ngọt ngào, dịu ấm",
      suggestReason: "Dịu ngọt lãng mạn, vỗ về cảm xúc thư giãn trong phòng ngủ."
    },
    {
      id: "campus-breeze",
      name: "Tidal Bloom (Campus Breeze)",
      code: "Mùi 03",
      labelNotes: "Xô thơm, muối biển & lily",
      category: "Khoáng biển & Thảo mộc hoa",
      price: 85000,
      priceFormatted: "85.000đ",
      priceBadge: "Giá ưu đãi HSSV",
      weight: "50g",
      stock: 20,
      inStock: true,
      image: "images/campus-breeze.jpg",
      shortDesc: "Làn gió biển mặn mòi, khoáng đạt cộng hưởng cùng thảo mộc xô thơm và hoa lily tinh khôi.",
      intensity: "Thoang thoảng, khoáng đạt",
      suggestReason: "Cảm giác gió biển tự do, thanh lọc không gian học tập và làm việc."
    },
    {
      id: "late-night",
      name: "Coffee Holic (Late Night)",
      code: "Mùi 04",
      labelNotes: "Cà phê & gỗ",
      category: "Hương cà phê rang mộc & Gỗ ấm",
      price: 85000,
      priceFormatted: "85.000đ",
      priceBadge: "Giá ưu đãi HSSV",
      weight: "50g",
      stock: 15,
      inStock: true,
      image: "images/nen-thu-gian.jpg",
      shortDesc: "Hương cà phê rang mộc nồng ấm quyện vào lớp gỗ tuyết tùng trầm lắng, đồng hành cùng bạn đêm khuya.",
      intensity: "Trầm ấm, thư giãn",
      suggestReason: "Trầm ấm sâu lắng, người bạn đồng hành cho những đêm ôn thi muộn."
    }
  ];

  function getClientFallbackProducts() {
    return CLIENT_CATALOG.slice(0, 2);
  }

  function generateClientLocalResponse(query = '') {
    const q = query.toLowerCase();
    let reply = '';
    let products = [];

    // 1. Phân tích ngân sách (Budget Parsing)
    let parsedBudget = null;
    const dotMatch = q.match(/(\d+)[.,](\d{3})\s*(?:k|nghìn|ngàn|vnd|vnđ|đ|đồng)?/);
    const suffixMatch = q.match(/(\d+)\s*(?:k|nghìn|ngàn)\b/);
    const prefixMatch = q.match(/(?:ngân sách|tầm|dưới|khoảng|giá|tối đa|tầm giá)\s*[:=]?\s*(\d+)(?:\s*(k|nghìn|ngàn|000|\.000|đ|vnd|vnđ|đồng))?/);

    if (dotMatch) {
      parsedBudget = parseInt(dotMatch[1] + dotMatch[2], 10);
    } else if (suffixMatch) {
      parsedBudget = parseInt(suffixMatch[1], 10) * 1000;
    } else if (prefixMatch) {
      let num = parseInt(prefixMatch[1], 10);
      const unit = prefixMatch[2];
      if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn' || (!unit && num < 1000)) num *= 1000;
      parsedBudget = num;
    }

    // 2. Lệnh thêm giỏ bằng văn bản (Text-based Add to Cart)
    const isQuestion = /(?:có\s+.*(?:không|\?)|như thế nào|bao nhiêu|sao|chăng)/i.test(q);
    const isAdvice = /(?:tư vấn|gợi ý|hỏi|tìm|chọn)\b/i.test(q) && !/vào giỏ|vô giỏ|giỏ hàng/i.test(q);
    const isAddCmd = !isQuestion && !isAdvice && (
      /(?:thêm|cho|bỏ)\s+(?:vào\s+|vô\s+)?giỏ/i.test(q) ||
      /(?:thêm|cho|bỏ)\s+.*(?:vào\s+giỏ|vô\s+giỏ|giỏ\s+hàng)/i.test(q) ||
      /(?:đặt|mua|lấy|chốt)\s+(\d+)\s*(?:hũ|cái|cốc)/i.test(q) ||
      /(?:mua|lấy|chốt|đặt)\s+(?:hũ|mùi|em)\s+này/i.test(q) ||
      /(?:thêm|cho)\s+(\d+)\s*(?:hũ|cái|cốc)\b/i.test(q)
    );
    if (isAddCmd) {
      let target = null;
      if (/first|sunday|chanh|bạc hà|mùi 0?1\b/.test(q)) target = CLIENT_CATALOG[0];
      else if (/blind|date|hồng|xạ hương|mùi 0?2\b/.test(q)) target = CLIENT_CATALOG[1];
      else if (/campus|breeze|muối biển|xô thơm|lily|mùi 0?3\b/.test(q)) target = CLIENT_CATALOG[2];
      else if (/late|night|cà phê|cafe|gỗ|mùi 0?4\b/.test(q)) target = CLIENT_CATALOG[3];
      else if (clientLastRecommendedId) target = CLIENT_CATALOG.find(p => p.id === clientLastRecommendedId);

      if (target) {
        clientLastRecommendedId = target.id;
        // Gửi request API add to cart ngầm
        fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
          body: JSON.stringify({ sessionId, productId: target.id, quantity: 1 })
        }).then(() => {
          if (window.ScentPodCart && typeof window.ScentPodCart.refresh === 'function') {
            window.ScentPodCart.refresh();
            window.ScentPodCart.openDrawer();
          }
        }).catch(e => console.warn('Local cart sync error:', e));

        return {
          reply: `Dạ mình đã thêm 1 hũ **${target.name}** vào giỏ hàng của bạn rồi nhé! Giỏ hàng sẽ được mở ra ngay bây giờ để bạn dễ dàng kiểm tra. Bạn mua từ 2 hũ nến sẽ nhận được ưu đãi **Ship 15.000đ toàn quốc** nha!`,
          products: [target]
        };
      }
    }

    // 3. Câu hỏi nối tiếp bám sát sản phẩm vừa tư vấn (Contextual Memory)
    const isFollowUp = /(?:mùi này|hũ này|mùi đó|hũ đó|nến này|nến đó|dòng này|sản phẩm này|em này|hũ vừa rồi|mùi vừa tư vấn|dùng khi nào|thời điểm|đốt được bao lâu|cháy được bao lâu|thành phần|tầng hương|có ngọt không|độ tỏa|không gian nào|hợp phòng nào|bao nhiêu tiền|giá bao nhiêu)/i.test(q);
    if (isFollowUp && clientLastRecommendedId) {
      const p = CLIENT_CATALOG.find(item => item.id === clientLastRecommendedId);
      if (p) {
        let fReply = '';
        if (/dùng khi nào|thời điểm|lúc nào|khi học|phòng nào|không gian/.test(q)) {
          fReply = `Hũ **${p.name}** (${p.labelNotes}) ${p.suggestReason} Rất thích hợp thắp vào buổi sáng hoặc khi cần tập trung học bài và thư giãn buổi tối.`;
        } else if (/đốt được bao lâu|cháy được bao lâu|bao lâu|khối lượng|size|nặng/.test(q)) {
          fReply = `Hũ nến 50g của dòng **${p.name}** đúc từ 100% sáp đậu nành thiên nhiên, thời gian đốt liên tục khoảng **12 – 15 giờ**. Mỗi lần thắp bạn nên để sáp tan đều từ 1–2 giờ nhé!`;
        } else if (/có ngọt không|mùi gì|tầng hương|thành phần|nốt hương/.test(q)) {
          fReply = `Hũ **${p.name}** mang nốt hương **${p.labelNotes}** với độ đậm mùi **${p.intensity}**. ${p.shortDesc}`;
        } else {
          fReply = `Về hũ **${p.name}**: ${p.shortDesc} Đang có giá ưu đãi HSSV **${p.priceFormatted}** (tặng kèm que diêm dài & thiệp HDSD). Mua từ 2 hũ nến được áp dụng **Ship 15.000đ toàn quốc**!`;
        }
        return { reply: fReply, products: [p] };
      }
    }

    // 4. Tư vấn theo ngân sách (nếu có)
    if (parsedBudget !== null) {
      if (parsedBudget < 85000) {
        reply = `Dạ với mức ngân sách ${parsedBudget.toLocaleString('vi-VN')}đ, hiện ScentPod chưa có sản phẩm dưới mức này ạ. Dòng nến thơm thủ công 50g của tụi mình đang có **Giá ưu đãi HSSV chỉ 85.000đ/hũ** (kèm diêm dài chuyên dụng & thiệp HDSD). Khi mua từ 2 hũ nến, bạn được áp dụng **Ship 15.000đ toàn quốc**!`;
        products = CLIENT_CATALOG;
      } else {
        reply = `Với ngân sách ${parsedBudget.toLocaleString('vi-VN')}đ, bạn hoàn toàn thoải mái chọn nến thơm ScentPod (đồng giá ưu đãi HSSV **85.000đ/hũ**). Đặc biệt mua từ 2 hũ được áp dụng **Ship chỉ 15.000đ toàn quốc**! Dưới đây là các mùi nến tinh tuyển bạn tham khảo nhé:`;
        products = CLIENT_CATALOG;
      }
    } else if (/bàn học|học bài|tập trung|ôn thi|tỉnh táo|chanh|bạc hà/.test(q)) {
      products = [CLIENT_CATALOG[0], CLIENT_CATALOG[2]];
      reply = 'Góc bàn học ôn thi cần sự tỉnh táo và thông thoáng, mình gợi ý bạn hũ **Another Sunday (First Class)** và **Tidal Bloom (Campus Breeze)**. Hương chanh bạc hà và khoáng biển giúp bạn duy trì năng lượng suốt buổi học!';
    } else if (/phòng ngủ|ngủ|thư giãn|hoa hồng|ngọt|lãng mạn/.test(q)) {
      products = [CLIENT_CATALOG[1]];
      reply = 'Cho không gian phòng ngủ cần sự êm dịu, **Beloved Summer (Blind Date)** với nốt hoa hồng phấn Grasse và xạ hương ấm chính là lựa chọn tuyệt vời để vỗ về giấc ngủ!';
    } else if (/cà phê|cafe|gỗ|đêm|khuya|late|ấm/.test(q)) {
      products = [CLIENT_CATALOG[3]];
      reply = 'Nếu bạn thích nốt hương trầm ấm cho những đêm học khuya, **Coffee Holic (Late Night)** hương cà phê mộc và gỗ tuyết tùng sẽ mang lại không gian quán quen yên tĩnh ngay bên bàn làm việc!';
    } else if (/giá|ngân sách|bao nhiêu|tiền|hssv|100k|rẻ/.test(q)) {
      products = CLIENT_CATALOG;
      reply = 'Tất cả 4 mùi nến thơm 50g của ScentPod đều có mức giá ưu đãi HSSV **85.000đ/hũ**. Đặc biệt khi mua từ 2 hũ nến, bạn được áp dụng **Ship chỉ 15.000đ toàn quốc**!';
    } else {
      products = CLIENT_CATALOG;
      reply = 'Chào bạn! Mình gợi ý bạn 4 mùi nến thơm mini 50g sáp đậu nành thủ công của ScentPod (đồng giá **85.000đ/hũ**). Mua từ 2 hũ được áp dụng **Ship 15.000đ toàn quốc** nhé!';
    }

    if (products.length > 0) {
      clientLastRecommendedId = products[0].id;
    }

    return { reply, products };
  }

  // Khởi chạy khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatWidget);
  } else {
    initChatWidget();
  }

  window.ScentPodChat = {
    open: () => {
      const win = document.getElementById('scent-ai-chat-window');
      if (win) win.classList.add('is-open');
    },
    close: () => {
      const win = document.getElementById('scent-ai-chat-window');
      if (win) win.classList.remove('is-open');
    },
    getSessionId
  };
})();

