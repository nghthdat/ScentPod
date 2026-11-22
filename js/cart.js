/**
 * ==============================================================================
 * SCENTPOD CART - QUẢN LÝ GIỎ HÀNG ĐỒNG BỘ PHIÊN & CART DRAWER
 * ==============================================================================
 */

(function () {
  const SESSION_KEY = 'scentpod_session_id';

  function getSessionId() {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  const sessionId = getSessionId();

  // 1. Tạo và chèn Slide-over Cart Drawer vào DOM
  function initCartDrawer() {
    if (document.getElementById('scent-cart-drawer-backdrop')) return;

    const drawerEl = document.createElement('div');
    drawerEl.className = 'cart-drawer-backdrop';
    drawerEl.id = 'scent-cart-drawer-backdrop';
    drawerEl.innerHTML = `
      <div class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-cart-title">
        
        <!-- Header Giỏ Hàng -->
        <div class="cart-header">
          <h3 class="cart-title" id="drawer-cart-title">
            <span>🛒 Giỏ Hàng Của Bạn</span>
            <span class="cart-badge" id="drawer-items-count">0</span>
          </h3>
          <button type="button" class="cart-close-btn" id="cart-drawer-close" aria-label="Đóng giỏ hàng">&times;</button>
        </div>

        <!-- Thanh thông báo ưu đãi phí ship -->
        <div class="cart-free-shipping-bar">
          <div class="free-shipping-text" id="freeship-text-label">
            <span>🚚 Ưu đãi ship HSSV</span>
            <span id="freeship-text-val">Mua từ 2 hũ ship 15k</span>
          </div>
          <div class="free-shipping-progress">
            <div class="free-shipping-fill" id="freeship-progress-fill" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Danh sách sản phẩm trong giỏ -->
        <div class="cart-body">
          <div class="cart-items-list" id="cart-items-container">
            <!-- Render động bằng JS -->
          </div>
        </div>

        <!-- Footer thanh toán -->
        <div class="cart-footer" style="padding: 18px 24px; border-top: 1px solid var(--border-subtle); background: #120e0c;">
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; color: var(--text-secondary);">
            <span>Tiền hàng:</span>
            <span id="cart-subtotal-val" style="font-weight: 600; color: #fff;">0đ</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 10px; color: var(--text-secondary);">
            <span>Phí vận chuyển:</span>
            <span id="cart-shipping-val" style="font-weight: 600; color: var(--accent-gold);">0đ</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 14px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1);">
            <span>Tổng thanh toán:</span>
            <span id="cart-total-val">0đ</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a href="thanh-toan.html" class="btn btn-primary" id="btn-cart-checkout" style="width: 100%; text-align: center; text-decoration: none; padding: 12px; font-weight: 700; border-radius: 8px;">
              Gửi Yêu Cầu Mua Hàng &rarr;
            </a>
            <a href="https://www.facebook.com/profile.php?id=61594607444699" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="width: 100%; text-align: center; text-decoration: none; padding: 10px; font-size: 0.85rem; border-radius: 8px;">
              💬 Tư vấn chốt đơn qua Facebook
            </a>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(drawerEl);

    // Bắt sự kiện đóng
    const closeBtn = document.getElementById('cart-drawer-close');
    closeBtn.addEventListener('click', closeCartDrawer);

    drawerEl.addEventListener('click', (e) => {
      if (e.target === drawerEl) closeCartDrawer();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerEl.classList.contains('is-open')) {
        closeCartDrawer();
      }
    });

    // Thêm nút mở giỏ hàng trên thanh header nếu chưa có
    injectHeaderCartButton();
  }

  // 2. Chèn nút Giỏ hàng vào thanh Header
  function injectHeaderCartButton() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    if (!document.getElementById('open-cart-btn')) {
      const cartBtn = document.createElement('button');
      cartBtn.type = 'button';
      cartBtn.className = 'header-cart-btn';
      cartBtn.id = 'open-cart-btn';
      cartBtn.setAttribute('aria-label', 'Xem giỏ hàng');
      cartBtn.setAttribute('title', 'Xem giỏ hàng ScentPod');
      cartBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span>Giỏ</span>
        <span class="cart-badge" id="header-cart-badge">0</span>
      `;

      cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
      });

      // Chèn trước nút Facebook trên header
      const fbBtn = navActions.querySelector('.header-fb-btn');
      if (fbBtn) {
        navActions.insertBefore(cartBtn, fbBtn);
      } else {
        navActions.appendChild(cartBtn);
      }
    }
  }

  function openCartDrawer() {
    const drawer = document.getElementById('scent-cart-drawer-backdrop');
    if (drawer) {
      drawer.classList.add('is-open');
      document.body.classList.add('drawer-open');
      refreshCart();
    }
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('scent-cart-drawer-backdrop');
    if (drawer) {
      drawer.classList.remove('is-open');
      document.body.classList.remove('drawer-open');
    }
  }

  // 3. Tải và làm mới dữ liệu giỏ hàng từ Backend
  async function refreshCart() {
    try {
      const res = await fetch(`/api/cart?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      if (data.success) {
        updateCartUI(data);
      }
    } catch (err) {
      console.warn('[Cart] Không thể tải giỏ hàng:', err);
    }
  }

  // 4. Render giao diện giỏ hàng
  function updateCartUI(cartData) {
    const items = cartData.items || [];
    const totalQty = cartData.totalQuantity || 0;

    // Cập nhật badges
    const headerBadge = document.getElementById('header-cart-badge');
    if (headerBadge) headerBadge.textContent = totalQty;

    const drawerCount = document.getElementById('drawer-items-count');
    if (drawerCount) drawerCount.textContent = totalQty;

    // Thanh freeship / ship ưu đãi
    const fill = document.getElementById('freeship-progress-fill');
    const label = document.getElementById('freeship-text-val');
    if (totalQty >= 2) {
      if (fill) fill.style.width = '100%';
      if (label) label.textContent = '✓ Đã đạt: Ship 15k toàn quốc!';
    } else if (totalQty === 1) {
      if (fill) fill.style.width = '50%';
      if (label) label.textContent = 'Thêm 1 hũ nến để ship chỉ 15k!';
    } else {
      if (fill) fill.style.width = '0%';
      if (label) label.textContent = 'Ship 15.000đ khi mua từ 2 hũ';
    }

    // Giá tiền
    const subtotalEl = document.getElementById('cart-subtotal-val');
    const shipEl = document.getElementById('cart-shipping-val');
    const totalEl = document.getElementById('cart-total-val');
    if (subtotalEl) subtotalEl.textContent = cartData.subtotalFormatted || '0đ';
    if (shipEl) shipEl.textContent = cartData.shippingFeeFormatted || '0đ';
    if (totalEl) totalEl.textContent = cartData.grandTotalFormatted || '0đ';

    // Container món hàng
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <span class="cart-empty-icon">🕯️</span>
          <h3>Giỏ hàng đang trống</h3>
          <p>Hãy khám phá 4 mùi nến thơm 50g hoặc nhắn tin để Trợ lý AI tư vấn giúp bạn nhé!</p>
          <a href="san-pham.html" class="btn btn-outline" style="border-radius: 20px;">Xem mùi nến ngay</a>
        </div>
      `;
      const checkoutBtn = document.getElementById('btn-cart-checkout');
      if (checkoutBtn) checkoutBtn.style.display = 'none';
      return;
    }

    const checkoutBtn = document.getElementById('btn-cart-checkout');
    if (checkoutBtn) checkoutBtn.style.display = 'block';

    let html = '';
    items.forEach(item => {
      html += `
        <div class="cart-item" data-cart-id="${item.id}">
          <div class="cart-item-thumb">
            <img src="${item.image || 'images/sap-thom-bo-ba.jpg'}" alt="${item.name}">
          </div>
          <div class="cart-item-info">
            <h4 class="cart-item-name">${item.name}</h4>
            <div class="cart-item-scent">Nốt hương: ${item.labelNotes || ''}</div>
            <div class="cart-item-price">${item.priceFormatted}</div>
            <div class="cart-item-ctrl">
              <button type="button" class="cart-qty-btn btn-qty-minus" data-id="${item.id}" data-qty="${item.quantity - 1}">-</button>
              <span class="cart-qty-num">${item.quantity}</span>
              <button type="button" class="cart-qty-btn btn-qty-plus" data-id="${item.id}" data-qty="${item.quantity + 1}">+</button>
              <button type="button" class="cart-item-remove btn-item-del" data-id="${item.id}">Xóa</button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Gán sự kiện nút +, -, xóa
    container.querySelectorAll('.btn-qty-minus, .btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pid = e.currentTarget.getAttribute('data-id');
        const qty = parseInt(e.currentTarget.getAttribute('data-qty'), 10);
        await updateCartItem(pid, qty);
      });
    });

    container.querySelectorAll('.btn-item-del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pid = e.currentTarget.getAttribute('data-id');
        await updateCartItem(pid, 0);
      });
    });
  }

  async function updateCartItem(productId, quantity) {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
        body: JSON.stringify({ sessionId, productId, quantity })
      });
      const data = await res.json();
      if (data.success && data.cart) {
        updateCartUI(data.cart);
      }
    } catch (err) {
      console.warn('[Cart Update Error]:', err);
    }
  }

  // Khởi chạy
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCartDrawer();
      refreshCart();
    });
  } else {
    initCartDrawer();
    refreshCart();
  }

  window.ScentPodCart = {
    openDrawer: openCartDrawer,
    closeDrawer: closeCartDrawer,
    refresh: refreshCart,
    getSessionId
  };
})();

