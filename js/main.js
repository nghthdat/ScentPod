/**
 * ==========================================================================
 * SCENTPOD - JAVASCRIPT CHÍNH (ĐỒNG BỘ 100% TÊN ẢNH, MÙI HƯƠNG & FACEBOOK CTAs)
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. CẤU HÌNH LIÊN KẾT FACEBOOK CHÍNH THỨC DÙNG CHUNG
// --------------------------------------------------------------------------
const FB_LINK = "https://www.facebook.com/profile.php?id=61594607444699";

// --------------------------------------------------------------------------
// 2. DỮ LIỆU ĐỒNG BỘ CHUẨN XÁC GIỮA ẢNH - TÊN - MÙI HƯƠNG - CÔNG THỨC NẾN 50G
// --------------------------------------------------------------------------
const PRODUCTS_CONFIG = {
  "first-class": {
    id: "first-class",
    code: "Mùi 01",
    name: "Another Sunday",
    collection: "First Class",
    displayName: "Another Sunday (First Class)",
    labelNotes: "Chanh, đào & bạc hà",
    category: "Trái cây tươi mát & Thảo mộc",
    weight: "50g",
    weightLabel: "Nến thơm 50g",
    price: "85.000đ",
    priceLabel: "85.000đ/hũ",
    priceBadge: "Giá ưu đãi HSSV",
    filename: "sap-thom-bo-ba.jpg",
    defaultSrc: "images/sap-thom-bo-ba.jpg",
    fallbackSrc: "images/sap-thom-bo-ba.svg",
    shortDesc: "Hương chanh vàng thanh chua tươi mát, đào chín ngọt dịu và lá bạc hà mát lạnh, khơi dậy năng lượng và sự tập trung cho góc học tập.",
    topNotes: "Chanh vàng Ý, Cam Bergamot, Lá bạc hà mát lạnh.",
    heartNotes: "Đào chín mọng, Hoa cam trắng, Trà xanh non.",
    baseNotes: "Xạ hương sạch, Gỗ tuyết tùng nhạt.",
    vibe: "Thanh mát, sảng khoái và tràn đầy năng lượng tươi mới, như làn gió mát lành sáng Chủ nhật bên bàn học.",
    story: "Chanh, đào & bạc hà — bộ ba sống động tràn đầy cảm hứng, vị chanh thanh tươi bật lên rộn ràng, đào chín ngọt mọng tiếp nối, rồi bạc hà mát lạnh khép lại thật sảng khoái.",
    ingredients: "Sáp đậu nành thiên nhiên, bấc cotton sạch, tinh dầu thực vật lành tính.",
    gifts: "Kèm que diêm dài chuyên dụng và thiệp hướng dẫn sử dụng nến.",
    usage: "Cắt ngắn bấc còn khoảng 0.5cm trước khi thắp. Lần đầu thắp nên để sáp tan chảy đều đến mép hũ (1–2 giờ) để ngọn lửa cháy êm và đều.",
    safety: "Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.",
    shipPolicy: "Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn)."
  },
  "blind-date": {
    id: "blind-date",
    code: "Mùi 02",
    name: "Beloved Summer",
    collection: "Blind Date",
    displayName: "Beloved Summer (Blind Date)",
    labelNotes: "Xạ hương & hoa hồng",
    category: "Hoa hồng phấn & Xạ hương ấm",
    weight: "50g",
    weightLabel: "Nến thơm 50g",
    price: "85.000đ",
    priceLabel: "85.000đ/hũ",
    priceBadge: "Giá ưu đãi HSSV",
    filename: "nen-thom-mini.jpg",
    defaultSrc: "images/nen-thom-mini.jpg",
    fallbackSrc: "images/nen-thom-mini.svg",
    shortDesc: "Hương hoa hồng tháng Năm ngọt ngào, e ấp hòa cùng nét ấm nồng bí ẩn của xạ hương và vani sữa bồng bềnh.",
    topNotes: "Cánh hoa hồng tươi, Quả đào chín mọng, Quả lê tươi.",
    heartNotes: "Hoa hồng Grasse, Hoa lan nam phi trắng, Kẹo bông nhẹ.",
    baseNotes: "Xạ hương ấm, Vani kem béo, Hổ phách dịu.",
    vibe: "Ngọt ngào, e ấp và lãng mạn như cảm xúc xao xuyến của buổi hẹn đầu, vỗ về cảm xúc sau ngày dài học tập.",
    story: "Hương xạ hương hoa hồng — cánh hồng tươi thắm hòa cùng nét ấm nồng bí ẩn của xạ hương và vani sữa, gợi lên sự lãng mạn sâu lắng và đầy mê hoặc.",
    ingredients: "Sáp đậu nành thiên nhiên, bấc cotton sạch, tinh dầu thực vật lành tính.",
    gifts: "Kèm que diêm dài chuyên dụng và thiệp hướng dẫn sử dụng nến.",
    usage: "Cắt ngắn bấc còn khoảng 0.5cm trước khi thắp. Lần đầu thắp nên để sáp tan chảy đều đến mép hũ (1–2 giờ) để ngọn lửa cháy êm và đều.",
    safety: "Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.",
    shipPolicy: "Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn)."
  },
  "campus-breeze": {
    id: "campus-breeze",
    code: "Mùi 03",
    name: "Tidal Bloom",
    collection: "Campus Breeze",
    displayName: "Tidal Bloom (Campus Breeze)",
    labelNotes: "Xô thơm, muối biển & lily",
    category: "Khoáng biển & Thảo mộc hoa",
    weight: "50g",
    weightLabel: "Nến thơm 50g",
    price: "85.000đ",
    priceLabel: "85.000đ/hũ",
    priceBadge: "Giá ưu đãi HSSV",
    filename: "campus-breeze.jpg",
    defaultSrc: "images/campus-breeze.jpg",
    fallbackSrc: "images/combo-nen-sap.svg",
    shortDesc: "Làn gió biển mặn mòi, khoáng đạt cộng hưởng cùng thảo mộc xô thơm và hoa lily tinh khôi, mang lại cảm giác tự do, thảnh thơi.",
    topNotes: "Muối khoáng biển, Vỏ bưởi hồng, Xô thơm Clary Sage.",
    heartNotes: "Hoa lily trắng, Tảo biển xanh mát, Thảo mộc tươi.",
    baseNotes: "Gỗ lũa mục, Xạ hương trắng, Gió biển dịu mát.",
    vibe: "Phóng khoáng, tự do và thoáng đãng như làn gió biển tươi mát thổi qua hành lang góc sân trường.",
    story: "Xô thơm, muối biển & lily — ba thanh âm tươi mát cộng hưởng thành một bản nhạc thiên nhiên khoáng đạt, nơi thảo mộc xanh gặp gió biển mặn mòi, bừng sáng bởi lily tinh khôi.",
    ingredients: "Sáp đậu nành thiên nhiên, bấc cotton sạch, tinh dầu thực vật lành tính.",
    gifts: "Kèm que diêm dài chuyên dụng và thiệp hướng dẫn sử dụng nến.",
    usage: "Cắt ngắn bấc còn khoảng 0.5cm trước khi thắp. Lần đầu thắp nên để sáp tan chảy đều đến mép hũ (1–2 giờ) để ngọn lửa cháy êm và đều.",
    safety: "Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.",
    shipPolicy: "Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn)."
  },
  "late-night": {
    id: "late-night",
    code: "Mùi 04",
    name: "Coffee Holic",
    collection: "Late Night",
    displayName: "Coffee Holic (Late Night)",
    labelNotes: "Cà phê & gỗ",
    category: "Hương cà phê rang mộc & Gỗ ấm",
    weight: "50g",
    weightLabel: "Nến thơm 50g",
    price: "85.000đ",
    priceLabel: "85.000đ/hũ",
    priceBadge: "Giá ưu đãi HSSV",
    filename: "nen-thu-gian.jpg",
    defaultSrc: "images/nen-thu-gian.jpg",
    fallbackSrc: "images/nen-thu-gian.svg",
    shortDesc: "Hương cà phê rang mộc nồng ấm quyện vào lớp gỗ tuyết tùng trầm lắng, vỗ về tâm trí và đồng hành cùng bạn trong những đêm học bài muộn.",
    topNotes: "Hạt cà phê rang mộc thơm lừng, Cam Bergamot thoang thoảng.",
    heartNotes: "Cà phê sữa ấm, Hoa oải hương nhẹ, Nhục đậu khấu.",
    baseNotes: "Gỗ thông tuyết tùng (Cedarwood), Hổ phách vàng ấm.",
    vibe: "Trầm ấm, tĩnh lặng và sâu lắng như góc quán quen tĩnh lặng giữa đêm, đồng hành cùng bạn bên từng trang sách.",
    story: "Cà phê và gỗ — trầm ấm như góc quán quen thuở cũ, mùi cà phê rang đậm đà quyện vào nền gỗ ấm áp, kéo tâm trí chìm vào khoảnh khắc chậm rãi, thư thái và bình yên.",
    ingredients: "Sáp đậu nành thiên nhiên, bấc cotton sạch, tinh dầu thực vật lành tính.",
    gifts: "Kèm que diêm dài chuyên dụng và thiệp hướng dẫn sử dụng nến.",
    usage: "Cắt ngắn bấc còn khoảng 0.5cm trước khi thắp. Lần đầu thắp nên để sáp tan chảy đều đến mép hũ (1–2 giờ) để ngọn lửa cháy êm và đều.",
    safety: "Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.",
    shipPolicy: "Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn)."
  }
};

// --------------------------------------------------------------------------
// 3. ĐO LƯỜNG SỰ KIỆN GA4: facebook_cta_click
// --------------------------------------------------------------------------
function trackFacebookClick({ placement = "general", productName = "" }) {
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", "facebook_cta_click", {
        placement: placement || "general",
        product_name: productName || undefined,
        product_weight: productName ? "50g" : undefined
      });
    }
  } catch (err) {
    console.warn("Analytics notice:", err);
  }
}

function openFacebookCta(placement = "general", productName = "") {
  trackFacebookClick({ placement, productName });
  window.open(FB_LINK, "_blank", "noopener,noreferrer");
}

// --------------------------------------------------------------------------
// 4. KHỞI CHẠY KHI TẢI TRANG
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initFacebookLinks();
  initMobileMenu();
  initHeaderScroll();
  initScrollAnimations();
  initScentDetailModal();
  initFaqAccordion();
  initFloatingChatOptimization();
  initProductDetailPage();
});

// --------------------------------------------------------------------------
// 5. CÁC HÀM XỬ LÝ GIAO DIỆN
// --------------------------------------------------------------------------

function initFacebookLinks() {
  const fbElements = document.querySelectorAll("[data-fb], [data-fb-cta], .btn-inbox-order, .btn-buy-fb, .header-fb-btn");

  fbElements.forEach((el) => {
    const placement = el.getAttribute("data-fb-cta") || el.getAttribute("data-placement") || (el.classList.contains("header-fb-btn") ? "header" : "general");
    const productName = el.getAttribute("data-product") || el.getAttribute("data-product-name") || "";

    if (el.tagName.toLowerCase() === "a") {
      el.setAttribute("href", FB_LINK);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
      el.addEventListener("click", () => {
        trackFacebookClick({ placement, productName });
      });
    } else {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openFacebookCta(placement, productName);
      });
      el.style.cursor = "pointer";
    }
  });
}

function initMobileMenu() {
  const toggleBtn = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  if (!toggleBtn || !navMenu) return;

  const closeMenu = () => {
    toggleBtn.classList.remove("is-active");
    navMenu.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    toggleBtn.classList.add("is-active");
    navMenu.classList.add("is-open");
    toggleBtn.setAttribute("aria-expanded", "true");
  };

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navMenu.classList.contains("is-open");
    if (isOpen) closeMenu();
    else openMenu();
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("click", (e) => {
    if (navMenu.classList.contains("is-open") && !navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navMenu.classList.contains("is-open")) {
      closeMenu();
      toggleBtn.focus();
    }
  });
}

function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
}

function initScrollAnimations() {
  const elements = document.querySelectorAll(".reveal-on-scroll");
  if (!elements.length) return;

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );

    elements.forEach((el) => observer.observe(el));

    // Fallback đảm bảo không section nào bị trống
    setTimeout(() => {
      elements.forEach((el) => el.classList.add("is-visible"));
  }, 1200);
} else {
  elements.forEach((el) => el.classList.add("is-visible"));
}
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector(".faq-question");
    if (!questionBtn) return;

    questionBtn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove("is-open");
          const otherBtn = other.querySelector(".faq-question");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        }
      });

      if (isOpen) {
        item.classList.remove("is-open");
        questionBtn.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("is-open");
        questionBtn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function initFloatingChatOptimization() {
  const fbBtn = document.querySelector(".fb-floating-btn");
  if (!fbBtn) return;

  const updateChatState = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 150) {
      fbBtn.classList.add("is-compact");
    } else {
      fbBtn.classList.remove("is-compact");
    }
  };

  window.addEventListener("scroll", updateChatState, { passive: true });
  updateChatState();
}

// --------------------------------------------------------------------------
// 6. POPUP CHI TIẾT SẢN PHẨM & SAO CHÉP THÔNG TIN CHUẨN
// --------------------------------------------------------------------------
let currentModalScentId = "first-class";
let lastActiveTriggerElement = null;

function copyProductInfo(scentId) {
  const p = PRODUCTS_CONFIG[scentId] || PRODUCTS_CONFIG["first-class"];
  const textToCopy = `Mình muốn hỏi mua nến thơm ScentPod 50g, mùi ${p.name} (${p.labelNotes}). Bạn tư vấn giúp mình nhé.`;
  const toastEls = document.querySelectorAll(".scent-modal-copy-toast");
  const fallbackBox = document.getElementById("scent-modal-manual-copy");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toastEls.forEach(el => {
          el.textContent = "✓ Đã sao chép. Bạn có thể dán nội dung khi nhắn Facebook.";
          el.style.display = "block";
        });
        setTimeout(() => {
          toastEls.forEach(el => el.style.display = "none");
        }, 4500);
        if (fallbackBox) fallbackBox.style.display = "none";
      })
      .catch(() => {
        showManualCopyFallback(textToCopy);
      });
  } else {
    showManualCopyFallback(textToCopy);
  }
}

function showManualCopyFallback(text) {
  const fallbackBox = document.getElementById("scent-modal-manual-copy");
  const fallbackInput = document.getElementById("scent-modal-manual-input");
  const toastEls = document.querySelectorAll(".scent-modal-copy-toast");

  if (fallbackBox && fallbackInput) {
    fallbackInput.value = text;
    fallbackBox.style.display = "block";
    fallbackInput.focus();
    fallbackInput.select();
    toastEls.forEach(el => {
      el.textContent = "Nhấn Ctrl+C hoặc Cmd+C để sao chép nội dung bên dưới:";
      el.style.display = "block";
    });
  }
}

function openScentModal(scentId) {
  const p = PRODUCTS_CONFIG[scentId] || PRODUCTS_CONFIG["first-class"];
  currentModalScentId = p.id;
  lastActiveTriggerElement = document.activeElement;

  let backdrop = document.getElementById("scent-detail-modal");
  if (!backdrop) {
    initScentDetailModal();
    backdrop = document.getElementById("scent-detail-modal");
  }

  const imgEl = document.getElementById("scent-modal-img");
  const badgeEl = document.getElementById("scent-modal-badge");
  const groupEl = document.getElementById("scent-modal-group");
  const titleEl = document.getElementById("scent-modal-title");
  const subtitleEl = document.getElementById("scent-modal-subtitle");
  const priceEl = document.getElementById("scent-modal-price");
  const vibeEl = document.getElementById("scent-modal-vibe");
  const topNotesEl = document.getElementById("scent-tier-top");
  const heartNotesEl = document.getElementById("scent-tier-heart");
  const baseNotesEl = document.getElementById("scent-tier-base");
  const toastEls = document.querySelectorAll(".scent-modal-copy-toast");
  const manualBox = document.getElementById("scent-modal-manual-copy");

  if (imgEl) {
    imgEl.src = p.defaultSrc;
    imgEl.alt = `Nến thơm ScentPod 50g - ${p.name}`;
  }
  if (badgeEl) badgeEl.textContent = p.code;
  if (groupEl) groupEl.textContent = p.category;
  if (titleEl) titleEl.textContent = `${p.name} (${p.collection})`;
  if (subtitleEl) subtitleEl.textContent = `Nốt hương trên nhãn: ${p.labelNotes}`;
  if (priceEl) priceEl.innerHTML = `${p.price} <small style="font-size: 0.76rem; background: rgba(201, 162, 107, 0.22); border: 1px solid var(--accent-gold); color: #fff; padding: 2px 8px; border-radius: 12px; font-weight: 500; margin-left: 6px; font-family: var(--font-sans);">${p.priceBadge}</small>`;
  if (vibeEl) vibeEl.textContent = p.shortDesc;
  if (topNotesEl) topNotesEl.textContent = p.topNotes;
  if (heartNotesEl) heartNotesEl.textContent = p.heartNotes;
  if (baseNotesEl) baseNotesEl.textContent = p.baseNotes;
  toastEls.forEach(el => el.style.display = "none");
  if (manualBox) manualBox.style.display = "none";

  backdrop.classList.add("is-open");
  document.body.classList.add("modal-open");

  const closeBtn = backdrop.querySelector(".scent-modal-close");
  if (closeBtn) closeBtn.focus();
}

function closeScentModal() {
  const backdrop = document.getElementById("scent-detail-modal");
  if (!backdrop) return;

  backdrop.classList.remove("is-open");
  document.body.classList.remove("modal-open");

  if (lastActiveTriggerElement && typeof lastActiveTriggerElement.focus === "function") {
    lastActiveTriggerElement.focus();
  }
}

function initScentDetailModal() {
  let backdrop = document.getElementById("scent-detail-modal");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "scent-modal-backdrop";
    backdrop.id = "scent-detail-modal";
    backdrop.innerHTML = `
      <div class="scent-modal-container" role="dialog" aria-modal="true" aria-labelledby="scent-modal-title">
        <!-- Nút đóng ghim cố định ở góc trên phải -->
        <button type="button" class="scent-modal-close" aria-label="Đóng cửa sổ" title="Đóng">&times;</button>
        
        <div class="scent-modal-layout" style="overflow-y: auto;">
          <div class="scent-modal-img-col">
            <span class="scent-modal-badge" id="scent-modal-badge">Mùi 01</span>
            <img id="scent-modal-img" src="" alt="Nến thơm ScentPod 50g">
          </div>
          <div class="scent-modal-info-col">
            <span class="scent-modal-group" id="scent-modal-group">Nhóm hương</span>
            <h2 class="scent-modal-title" id="scent-modal-title">Another Sunday</h2>
            <div class="scent-modal-subtitle" id="scent-modal-subtitle">Chanh, đào &amp; bạc hà</div>
            <div class="product-spec-tag">Nến thơm 50g</div>
            <div class="scent-modal-price" id="scent-modal-price">85.000đ</div>
            <p class="scent-modal-vibe" id="scent-modal-vibe"></p>

            <!-- CỤM CTA NGAY DƯỚI GIÁ: Khách thấy ngay không cần cuộn -->
            <div class="modal-cta-immediate">
              <button type="button" class="btn-buy-fb btn-modal-fb-trigger">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.455 5.503 3.734 7.142V22l3.433-1.884c.905.251 1.86.388 2.833.388 5.523 0 10-4.145 10-9.246 0-5.113-4.477-9.258-10-9.258zm1.002 12.445l-2.556-2.727-4.99 2.727 5.488-5.824 2.618 2.727 4.928-2.727-5.488 5.824z"/></svg>
                <span>Hỏi mua qua Facebook</span>
              </button>
              <button type="button" class="btn-copy-info btn-modal-copy-trigger" style="width: 100%;">
                📋 <span>Sao chép thông tin mùi nến</span>
              </button>
              <div class="scent-modal-copy-toast copy-toast-msg" style="display: none;"></div>
            </div>

            <!-- Cấu trúc 3 tầng hương đối chiếu chuẩn công thức -->
            <div class="scent-pyramid-card">
              <div class="scent-pyramid-header">✨ Cấu trúc 3 tầng hương đối chiếu</div>
              <div class="scent-tier">
                <span class="tier-dot"></span>
                <span class="tier-label">Hương đầu:</span>
                <div class="tier-notes" id="scent-tier-top"></div>
              </div>
              <div class="scent-tier">
                <span class="tier-dot"></span>
                <span class="tier-label">Hương giữa:</span>
                <div class="tier-notes" id="scent-tier-heart"></div>
              </div>
              <div class="scent-tier">
                <span class="tier-dot"></span>
                <span class="tier-label">Hương cuối:</span>
                <div class="tier-notes" id="scent-tier-base"></div>
              </div>
            </div>

            <!-- Quà kèm & Chính sách rõ ràng -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; font-size: 0.86rem; line-height: 1.6; color: var(--text-secondary);">
              <div style="margin-bottom: 6px;">🎁 <strong>Quà kèm:</strong> Que diêm dài chuyên dụng &amp; thiệp hướng dẫn sử dụng nến.</div>
              <div style="margin-bottom: 6px;">🕯️ <strong>Hướng dẫn dùng nến ngắn:</strong> Cắt ngắn bấc còn khoảng 0.5cm trước khi đốt. Lần đầu thắp nên để sáp tan chảy đều tới mép hũ (khoảng 1–2 giờ).</div>
              <div style="margin-bottom: 6px; color: #f5c87a;">⚠️ <strong>Lưu ý an toàn:</strong> Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.</div>
              <div style="color: var(--accent-gold);">🚚 <strong>Chính sách ship:</strong> Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn).</div>
            </div>

            <div id="scent-modal-manual-copy" class="manual-copy-box" style="display: none;">
              <input type="text" id="scent-modal-manual-input" class="manual-copy-input" readonly>
            </div>

          </div>
        </div>

        <!-- THANH HÀNH ĐỘNG GHIM CỐ ĐỊNH Ở ĐÁY POPUP (STICKY BOTTOM BAR) -->
        <div class="modal-sticky-bar">
          <div style="flex: 1; font-size: 0.95rem; font-weight: 700; color: var(--accent-gold);">
            85.000đ/hũ <small style="font-size: 0.75rem; color: #fff; font-weight: 500; margin-left: 4px;">(Giá ưu đãi HSSV)</small>
          </div>
          <button type="button" class="btn-copy-info btn-modal-copy-trigger" style="padding: 8px 14px; font-size: 0.82rem;">
            📋 <span>Sao chép</span>
          </button>
          <button type="button" class="btn-buy-fb btn-modal-fb-trigger" style="width: auto !important; padding: 8px 18px; font-size: 0.84rem;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.455 5.503 3.734 7.142V22l3.433-1.884c.905.251 1.86.388 2.833.388 5.523 0 10-4.145 10-9.246 0-5.113-4.477-9.258-10-9.258zm1.002 12.445l-2.556-2.727-4.99 2.727 5.488-5.824 2.618 2.727 4.928-2.727-5.488 5.824z"/></svg>
            <span>Hỏi mua qua Facebook</span>
          </button>
        </div>

      </div>
    `;
    document.body.appendChild(backdrop);

    const closeBtn = backdrop.querySelector(".scent-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeScentModal);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeScentModal();
    });

        backdrop.querySelectorAll(".btn-modal-fb-trigger").forEach(btn => {
          btn.addEventListener("click", () => {
            const p = PRODUCTS_CONFIG[currentModalScentId] || PRODUCTS_CONFIG["first-class"];
            openFacebookCta("product_modal", p.name);
          });
    });

          backdrop.querySelectorAll(".btn-modal-copy-trigger").forEach(btn => {
            btn.addEventListener("click", () => {
              copyProductInfo(currentModalScentId);
            });
    });
      }

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const modal = document.getElementById("scent-detail-modal");
          if (modal && modal.classList.contains("is-open")) closeScentModal();
        }
      });

      document.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-open-scent]");
        if (trigger) {
          e.preventDefault();
          const scentId = trigger.getAttribute("data-open-scent");
          openScentModal(scentId);
        }
      });
    }

    function initProductDetailPage() {
      const isDetailPage = document.querySelector(".product-detail-page");
      if (!isDetailPage) return;

      const urlParams = new URLSearchParams(window.location.search);
      let scentId = urlParams.get("id") || "first-class";
      if (!PRODUCTS_CONFIG[scentId]) scentId = "first-class";

      const p = PRODUCTS_CONFIG[scentId];

      const headTitle = document.getElementById("page-head-title");
      if (headTitle) headTitle.textContent = `${p.name} (${p.collection}) - Nến Thơm 50g | ScentPod`;

      const bcName = document.getElementById("bc-product-name");
      if (bcName) bcName.textContent = `${p.name} (${p.collection})`;

      const codeBadge = document.getElementById("detail-code-badge");
      if (codeBadge) codeBadge.textContent = p.code;

      const catEl = document.getElementById("detail-category");
      if (catEl) catEl.textContent = p.category;

      const headingEl = document.getElementById("product-title-heading");
      if (headingEl) headingEl.textContent = `${p.name} (${p.collection})`;

      const scentNameEl = document.getElementById("detail-scent-name");
      if (scentNameEl) scentNameEl.textContent = `Nốt hương trên nhãn: ${p.labelNotes}`;

      const vibeEl = document.getElementById("detail-vibe");
      if (vibeEl) vibeEl.textContent = p.shortDesc;

      const mainImg = document.getElementById("detail-main-img");
      if (mainImg) {
        mainImg.src = p.defaultSrc;
        mainImg.alt = `Nến thơm ScentPod 50g - ${p.name}`;
      }

      const topNotes = document.getElementById("detail-tier-top");
      if (topNotes) topNotes.textContent = p.topNotes;
      const heartNotes = document.getElementById("detail-tier-heart");
      if (heartNotes) heartNotes.textContent = p.heartNotes;
      const baseNotes = document.getElementById("detail-tier-base");
      if (baseNotes) baseNotes.textContent = p.baseNotes;

      const detailBuyFbBtn = document.getElementById("detail-buy-fb-btn");
      if (detailBuyFbBtn) {
        detailBuyFbBtn.addEventListener("click", () => {
          openFacebookCta("product_detail_page", p.name);
        });
      }

      const detailCopyBtn = document.getElementById("detail-copy-info-btn");
      if (detailCopyBtn) {
        detailCopyBtn.addEventListener("click", () => {
          copyProductInfo(scentId);
        });
      }
    }
