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
      } else {
        appendMessage('bot', 'Dạ tụi mình đã ghi nhận thông tin. Bạn có thể tham khảo 4 mùi nến 50g thủ công của ScentPod nhé!');
      }
    } catch (err) {
      console.warn('[AI Chat] Lỗi kết nối /api/chat:', err);
      const typingNode = document.getElementById(typingId);
      if (typingNode) typingNode.remove();

      // Graceful fallback
      appendMessage('bot', 'Chào bạn! Kết nối mạng hơi gián đoạn một chút. Nhưng ScentPod luôn sẵn sàng 4 hũ nến 50g sáp đậu nành (giá ưu đãi HSSV 85.000đ/hũ) đồng hành cùng bạn!');
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

