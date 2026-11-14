/**
 * ==========================================================================
 * SCENTPOD - JAVASCRIPT CHÍNH (CHUẨN HÓA NẾN 50G & FACEBOOK CTAs)
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. CẤU HÌNH LIÊN KẾT FACEBOOK CHÍNH THỨC DÙNG CHUNG
// --------------------------------------------------------------------------
const FB_LINK = "https://www.facebook.com/profile.php?id=61594607444699";

// --------------------------------------------------------------------------
// 2. DỮ LIỆU CHUẨN 4 MÙI HƯƠNG NẾN THƠM 50G
// --------------------------------------------------------------------------
const PRODUCTS_CONFIG = {
  "first-class": {
    id: "first-class",
    code: "Mùi 01",
    name: "First Class",
    posterTitle: "Another Sunday",
    tagline: "Trà trắng non & Thảo mộc tươi",
    scentName: "White Tea & Morning Dew (Another Sunday)",
    category: "Trà xanh & Thảo mộc tươi",
    weight: "50g",
    weightLabel: "Nến thơm 50g",
    price: "85.000đ",
    priceLabel: "85.000đ/hũ",
    priceBadge: "Giá ưu đãi HSSV",
    filename: "sap-thom-bo-ba.jpg",
    defaultSrc: "images/sap-thom-bo-ba.jpg",
    fallbackSrc: "images/sap-thom-bo-ba.svg",
    shortDesc: "Thanh mát, trong lành từ trà trắng non và thảo mộc tươi, đánh thức cảm hứng học tập.",
    topNotes: "Quýt non, Chanh vàng Ý, Lá bạc hà thanh mát.",
    heartNotes: "Trà trắng non, Hoa linh lan, Hoa sen nước.",
    baseNotes: "Gỗ tuyết tùng nhạt, Xạ hương sạch.",
    vibe: "Thanh mát, trong trẻo như làn gió sớm mai, giúp không gian học tập luôn thoáng đãng và ngập tràn cảm hứng.",
    story: "Lấy cảm hứng từ những buổi sáng Chủ nhật yên ả, First Class mang hương vị trà trắng dịu mát đan xen chút thơm sảng khoái của bạc hà và hoa cỏ thiên nhiên.",
    ingredients: "Sáp đậu nành thiên nhiên, bấc cotton sạch, tinh dầu thực vật lành tính.",
    gifts: "Kèm que diêm dài chuyên dụng và thiệp hướng dẫn sử dụng nến.",
    usage: "Cắt ngắn bấc còn khoảng 0.5cm trước khi thắp. Lần đầu thắp nên để sáp tan chảy đều đến mép hũ (1–2 giờ) để ngọn lửa cháy êm và đều.",
    safety: "Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.",
    shipPolicy: "Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn)."
  },
  "blind-date": {
    id: "blind-date",
    code: "Mùi 02",
    name: "Blind Date",
    posterTitle: "Beloved Summer",
    tagline: "Hoa hồng & Trái cây ngọt dịu",
    scentName: "Sweet Peach & Vanilla Cloud (Beloved Summer)",
    category: "Trái cây ngọt dịu & Phấn hoa",
    weight: "50g",
    weightLabel: "Nến thơm 50g",
    price: "85.000đ",
    priceLabel: "85.000đ/hũ",
    priceBadge: "Giá ưu đãi HSSV",
    filename: "nen-thom-mini.jpg",
    defaultSrc: "images/nen-thom-mini.jpg",
    fallbackSrc: "images/nen-thom-mini.svg",
    shortDesc: "Ngọt ngào, e ấp từ hoa hồng và trái cây mọng nước quyện vani sữa ấm, mang lại cảm giác dễ chịu.",
    topNotes: "Quả đào chín mọng, Quả lê tươi, Hoa hồng tháng Năm.",
    heartNotes: "Hoa lan nam phi trắng, Kẹo bông nhẹ, Cánh hồng tươi thắm.",
    baseNotes: "Xạ hương bí ẩn, Vani sữa ấm, Hổ phách dịu.",
    vibe: "Ngọt ngào, ấm êm và e ấp như rung động của buổi hẹn hò đầu tiên, vỗ về cảm xúc sau ngày dài học tập.",
    story: "Blind Date tái hiện những khoảnh khắc lãng mạn nhẹ nhàng qua nốt hương hoa quả thanh ngọt và hậu vị vani kem sữa bồng bềnh.",
    ingredients: "Sáp đậu nành thiên nhiên, bấc cotton sạch, tinh dầu thực vật lành tính.",
    gifts: "Kèm que diêm dài chuyên dụng và thiệp hướng dẫn sử dụng nến.",
    usage: "Cắt ngắn bấc còn khoảng 0.5cm trước khi thắp. Lần đầu thắp nên để sáp tan chảy đều đến mép hũ (1–2 giờ) để ngọn lửa cháy êm và đều.",
    safety: "Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.",
    shipPolicy: "Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn)."
  },
  "campus-breeze": {
    id: "campus-breeze",
    code: "Mùi 03",
    name: "Campus Breeze",
    posterTitle: "Tidal Bloom",
    tagline: "Muối khoáng & Xô thơm clary sage",
    scentName: "Sea Salt & Sage (Tidal Bloom)",
    category: "Khoáng biển & Thảo mộc",
    weight: "50g",
    weightLabel: "Nến thơm 50g",
    price: "85.000đ",
    priceLabel: "85.000đ/hũ",
    priceBadge: "Giá ưu đãi HSSV",
    filename: "campus-breeze.jpg",
    defaultSrc: "images/campus-breeze.jpg",
    fallbackSrc: "images/combo-nen-sap.svg",
    shortDesc: "Phóng khoáng, tự do như làn gió biển tươi mát kết hợp muối khoáng và xô thơm clary sage.",
    topNotes: "Muối biển khoáng, Hạt bưởi hồng, Xô thơm Clary Sage.",
    heartNotes: "Hoa lily tinh khôi, Tảo biển xanh mát, Thảo mộc tươi.",
    baseNotes: "Gỗ lũa mục, Xạ hương trắng, Gió biển dịu mát.",
    vibe: "Tươi mới, phóng khoáng và tự do, tựa như làn gió biển trong lành thổi qua góc hành lang giảng đường.",
    story: "Hơi thở của gió biển mặn mòi quyện hòa cùng thảo mộc xanh mướt mang đến sự giải tỏa và cảm giác thảnh thơi tuyệt đối.",
    ingredients: "Sáp đậu nành thiên nhiên, bấc cotton sạch, tinh dầu thực vật lành tính.",
    gifts: "Kèm que diêm dài chuyên dụng và thiệp hướng dẫn sử dụng nến.",
    usage: "Cắt ngắn bấc còn khoảng 0.5cm trước khi thắp. Lần đầu thắp nên để sáp tan chảy đều đến mép hũ (1–2 giờ) để ngọn lửa cháy êm và đều.",
    safety: "Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.",
    shipPolicy: "Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn)."
  },
  "late-night": {
    id: "late-night",
    code: "Mùi 04",
    name: "Late Night",
    posterTitle: "Coffee Holic",
    tagline: "Cà phê rang & Gỗ tuyết tùng trầm",
    scentName: "Cedarwood & Warm Amber (Coffee Holic)",
    category: "Hương gỗ ấm & Thư giãn",
    weight: "50g",
    weightLabel: "Nến thơm 50g",
    price: "85.000đ",
    priceLabel: "85.000đ/hũ",
    priceBadge: "Giá ưu đãi HSSV",
    filename: "nen-thu-gian.jpg",
    defaultSrc: "images/nen-thu-gian.jpg",
    fallbackSrc: "images/nen-thu-gian.svg",
    shortDesc: "Trầm ấm, tĩnh lặng từ hạt cà phê rang và gỗ tuyết tùng, vỗ về tâm trí sau những giờ học bài khuya.",
    topNotes: "Hạt cà phê rang mộc thơm lừng, Cam Bergamot thoang thoảng.",
    heartNotes: "Hương cà phê sữa ấm, Hoa oải hương nhẹ, Nhục đậu khấu.",
    baseNotes: "Gỗ thông tuyết tùng (Cedarwood), Hổ phách vàng ấm, Nền gỗ mộc.",
    vibe: "Trầm lắng, sâu lắng và ấm cúng như góc quán quen tĩnh lặng giữa đêm, đồng hành cùng bạn bên từng trang sách.",
    story: "Mùi cà phê rang mộc nồng ấm kết hợp lớp gỗ tuyết tùng vững chãi, tạo điểm tựa bình yên cho những đêm thức khuya học bài hay đọc sách.",
    ingredients: "Sáp đậu nành thiên nhiên, bấc cotton sạch, tinh dầu thực vật lành tính.",
    gifts: "Kèm que diêm dài chuyên dụng và thiệp hướng dẫn sử dụng nến.",
    usage: "Cắt ngắn bấc còn khoảng 0.5cm trước khi thắp. Lần đầu thắp nên để sáp tan chảy đều đến mép hũ (1–2 giờ) để ngọn lửa cháy êm và đều.",
    safety: "Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.",
    shipPolicy: "Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn)."
  }
};

// --------------------------------------------------------------------------
// 3. ĐO LƯỜNG LƯỢT BẤM CTA FACEBOOK (GA4 EVENT)
// --------------------------------------------------------------------------
/**
 * Ghi nhận sự kiện GA4 facebook_cta_click an toàn
 * Tham số:
 * - placement: header, hero, product_card, product_modal, floating, footer
 * - product_name: tên mùi (nếu nút gắn với sản phẩm)
 * - product_weight: '50g' (nếu áp dụng)
 */
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

/**
 * Mở Facebook kèm ghi nhận tracking
 */
function openFacebookCta(placement = "general", productName = "") {
  trackFacebookClick({ placement, productName });
  window.open(FB_LINK, "_blank", "noopener,noreferrer");
}

// --------------------------------------------------------------------------
// 4. KHỞI CHẠY KHI TẢI XONG TRANG
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
// 5. CÁC HÀM XỬ LÝ GIAO DIỆN & TƯƠNG TÁC
// --------------------------------------------------------------------------

/**
 * Gán link Facebook và bắt sự kiện tracking cho tất cả CTA Facebook
 */
function initFacebookLinks() {
  // 1. Các thẻ có data-fb hoặc data-fb-cta
  const fbElements = document.querySelectorAll("[data-fb], [data-fb-cta], .btn-inbox-order, .btn-buy-fb, .header-fb-btn");
  
  fbElements.forEach((el) => {
    // Xác định placement và product_name
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

/**
 * Xử lý menu Mobile (Hamburger Toggle)
 * - Tự động đóng khi bấm vào link chuyển trang hoặc bấm ra ngoài
 * - Hỗ trợ phím Escape
 */
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
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Tự động đóng menu khi bấm vào link chuyển trang
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // Đóng khi click bên ngoài menu
  document.addEventListener("click", (e) => {
    if (navMenu.classList.contains("is-open") && !navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      closeMenu();
    }
  });

  // Đóng khi nhấn phím Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navMenu.classList.contains("is-open")) {
      closeMenu();
      toggleBtn.focus();
    }
  });
}

/**
 * Hiệu ứng bóng header khi cuộn trang
 */
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

/**
 * Hiệu ứng hiện dần khi cuộn trang (Intersection Observer)
 * - Tôn trọng prefers-reduced-motion
 * - Fallback hẹn giờ để nội dung chính KHÔNG BAO GIỜ bị ẩn nếu lỗi JS hoặc chưa cuộn tới
 */
function initScrollAnimations() {
  const elements = document.querySelectorAll(".reveal-on-scroll");
  if (!elements.length) return;

  // Nếu người dùng bật giảm chuyển động (prefers-reduced-motion)
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // Nếu trình duyệt hỗ trợ IntersectionObserver
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
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    elements.forEach((el) => observer.observe(el));

    // Fallback bảo vệ: Đảm bảo toàn bộ section hiển thị sau tối đa 1.5 giây
    setTimeout(() => {
      elements.forEach((el) => el.classList.add("is-visible"));
    }, 1500);
  } else {
    // Trình duyệt cũ: hiển thị ngay lập tức
    elements.forEach((el) => el.classList.add("is-visible"));
  }
}

/**
 * Câu hỏi thường gặp FAQ Accordion
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector(".faq-question");
    if (!questionBtn) return;

    questionBtn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // Đóng các câu hỏi khác để giữ giao diện gọn gàng
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove("is-open");
          const otherBtn = other.querySelector(".faq-question");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        }
      });

      // Mở hoặc đóng câu hỏi hiện tại
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

/**
 * Tối ưu nút Facebook nổi (.fb-floating-btn)
 * - Tự động thu gọn khi cuộn xuống để không che nội dung
 * - Tự ẩn hoàn toàn khi popup mở
 */
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
// 6. POPUP CHI TIẾT SẢN PHẨM (SCENT DETAIL MODAL) & SAO CHÉP THÔNG TIN
// --------------------------------------------------------------------------
let currentModalScentId = "first-class";
let lastActiveTriggerElement = null;

/**
 * Sao chép thông tin mùi nến vào Clipboard
 * Cú pháp chuẩn:
 * "Mình muốn hỏi mua nến thơm ScentPod 50g, mùi [tên mùi]. Bạn tư vấn giúp mình nhé."
 */
function copyProductInfo(scentId) {
  const p = PRODUCTS_CONFIG[scentId] || PRODUCTS_CONFIG["first-class"];
  const textToCopy = `Mình muốn hỏi mua nến thơm ScentPod 50g, mùi ${p.name}. Bạn tư vấn giúp mình nhé.`;
  const toastEl = document.getElementById("scent-modal-copy-toast");
  const fallbackBox = document.getElementById("scent-modal-manual-copy");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        if (toastEl) {
          toastEl.textContent = "✓ Đã sao chép. Bạn có thể dán nội dung khi nhắn Facebook.";
          toastEl.style.display = "block";
          setTimeout(() => {
            if (toastEl) toastEl.style.display = "none";
          }, 4500);
        }
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
  const toastEl = document.getElementById("scent-modal-copy-toast");

  if (fallbackBox && fallbackInput) {
    fallbackInput.value = text;
    fallbackBox.style.display = "block";
    fallbackInput.focus();
    fallbackInput.select();
    if (toastEl) {
      toastEl.textContent = "Nhấn Ctrl+C hoặc Cmd+C để sao chép nội dung bên dưới:";
      toastEl.style.display = "block";
    }
  }
}

/**
 * Mở Popup Chi Tiết Mùi Hương
 */
function openScentModal(scentId) {
  const p = PRODUCTS_CONFIG[scentId] || PRODUCTS_CONFIG["first-class"];
  currentModalScentId = p.id;
  lastActiveTriggerElement = document.activeElement;

  let backdrop = document.getElementById("scent-detail-modal");
  if (!backdrop) {
    initScentDetailModal();
    backdrop = document.getElementById("scent-detail-modal");
  }

  // Cập nhật thông tin vào Modal
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
  const toastEl = document.getElementById("scent-modal-copy-toast");
  const manualBox = document.getElementById("scent-modal-manual-copy");

  if (imgEl) {
    imgEl.src = p.defaultSrc;
    imgEl.alt = `Nến thơm ScentPod 50g - ${p.name}`;
  }
  if (badgeEl) badgeEl.textContent = p.code;
  if (groupEl) groupEl.textContent = p.category;
  if (titleEl) titleEl.textContent = p.name;
  if (subtitleEl) subtitleEl.textContent = p.tagline;
  if (priceEl) priceEl.innerHTML = `${p.price} <small style="font-size: 0.76rem; background: rgba(201, 162, 107, 0.22); border: 1px solid var(--accent-gold); color: #fff; padding: 2px 8px; border-radius: 12px; font-weight: 500; margin-left: 6px; font-family: var(--font-sans);">${p.priceBadge}</small>`;
  if (vibeEl) vibeEl.textContent = p.shortDesc;
  if (topNotesEl) topNotesEl.textContent = p.topNotes;
  if (heartNotesEl) heartNotesEl.textContent = p.heartNotes;
  if (baseNotesEl) baseNotesEl.textContent = p.baseNotes;
  if (toastEl) toastEl.style.display = "none";
  if (manualBox) manualBox.style.display = "none";

  // Mở modal & khóa cuộn trang
  backdrop.classList.add("is-open");
  document.body.classList.add("modal-open");

  // Đặt focus vào nút đóng
  const closeBtn = backdrop.querySelector(".scent-modal-close");
  if (closeBtn) closeBtn.focus();
}

/**
 * Đóng Popup Chi Tiết Mùi Hương
 */
function closeScentModal() {
  const backdrop = document.getElementById("scent-detail-modal");
  if (!backdrop) return;

  backdrop.classList.remove("is-open");
  document.body.classList.remove("modal-open");

  // Trả focus về nút vừa mở
  if (lastActiveTriggerElement && typeof lastActiveTriggerElement.focus === "function") {
    lastActiveTriggerElement.focus();
  }
}

/**
 * Khởi tạo khung DOM Modal nếu chưa có
 */
function initScentDetailModal() {
  let backdrop = document.getElementById("scent-detail-modal");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "scent-modal-backdrop";
    backdrop.id = "scent-detail-modal";
    backdrop.innerHTML = `
      <div class="scent-modal-container" role="dialog" aria-modal="true" aria-labelledby="scent-modal-title">
        <button type="button" class="scent-modal-close" aria-label="Đóng cửa sổ" title="Đóng">&times;</button>
        <div class="scent-modal-layout">
          <div class="scent-modal-img-col">
            <span class="scent-modal-badge" id="scent-modal-badge">Mùi 01</span>
            <img id="scent-modal-img" src="" alt="Nến thơm ScentPod 50g">
          </div>
          <div class="scent-modal-info-col">
            <span class="scent-modal-group" id="scent-modal-group">Nhóm hương</span>
            <h2 class="scent-modal-title" id="scent-modal-title">First Class</h2>
            <div class="scent-modal-subtitle" id="scent-modal-subtitle">White Tea &amp; Morning Dew</div>
            <div class="product-spec-tag">Nến thơm 50g</div>
            <div class="scent-modal-price" id="scent-modal-price">85.000đ</div>
            <p class="scent-modal-vibe" id="scent-modal-vibe"></p>

            <!-- Cấu trúc 3 tầng hương -->
            <div class="scent-pyramid-card">
              <div class="scent-pyramid-header">✨ Cấu trúc 3 tầng hương</div>
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

            <!-- Quà kèm & Chính sách -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; font-size: 0.86rem; line-height: 1.6; color: var(--text-secondary);">
              <div style="margin-bottom: 6px;">🎁 <strong>Quà kèm:</strong> Que diêm dài chuyên dụng &amp; thiệp hướng dẫn sử dụng nến.</div>
              <div style="margin-bottom: 6px;">🕯️ <strong>Hướng dẫn dùng ngắn:</strong> Cắt ngắn bấc còn khoảng 0.5cm trước khi đốt. Lần đầu thắp nên để sáp tan chảy đều tới mép hũ (khoảng 1–2 giờ).</div>
              <div style="margin-bottom: 6px; color: #f5c87a;">⚠️ <strong>Lưu ý an toàn:</strong> Đặt nến trên bề mặt chịu nhiệt, tránh vật dễ cháy và không bỏ mặc khi đang đốt.</div>
              <div style="color: var(--accent-gold);">🚚 <strong>Chính sách ship:</strong> Ship 15.000đ toàn quốc khi mua từ 2 hũ nến. (Đơn 1 hũ: Phí giao hàng được xác nhận khi tư vấn).</div>
            </div>

            <!-- Các nút hành động chính của Modal -->
            <div class="modal-actions-group">
              <button type="button" class="btn-buy-fb" id="btn-modal-fb-buy" style="flex: 1;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.455 5.503 3.734 7.142V22l3.433-1.884c.905.251 1.86.388 2.833.388 5.523 0 10-4.145 10-9.246 0-5.113-4.477-9.258-10-9.258zm1.002 12.445l-2.556-2.727-4.99 2.727 5.488-5.824 2.618 2.727 4.928-2.727-5.488 5.824z"/></svg>
                <span>Hỏi mua qua Facebook</span>
              </button>
              <button type="button" class="btn-copy-info" id="btn-modal-copy-info">
                📋 <span>Sao chép thông tin</span>
              </button>
            </div>

            <!-- Thông báo trạng thái sao chép -->
            <div id="scent-modal-copy-toast" class="copy-toast-msg" style="display: none;"></div>
            
            <!-- Fallback ô nhập liệu nếu trình duyệt chặn Clipboard API -->
            <div id="scent-modal-manual-copy" class="manual-copy-box" style="display: none;">
              <input type="text" id="scent-modal-manual-input" class="manual-copy-input" readonly>
            </div>

          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    // Bắt sự kiện đóng
    const closeBtn = backdrop.querySelector(".scent-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeScentModal);
    }

    // Đóng khi click ngoài khung modal
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeScentModal();
      }
    });

    // Bắt sự kiện nút Hỏi mua Facebook trong modal
    const modalFbBtn = document.getElementById("btn-modal-fb-buy");
    if (modalFbBtn) {
      modalFbBtn.addEventListener("click", () => {
        const p = PRODUCTS_CONFIG[currentModalScentId] || PRODUCTS_CONFIG["first-class"];
        openFacebookCta("product_modal", p.name);
      });
    }

    // Bắt sự kiện nút Sao chép thông tin trong modal
    const copyBtn = document.getElementById("btn-modal-copy-info");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        copyProductInfo(currentModalScentId);
      });
    }
  }

  // Phím Escape đóng modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("scent-detail-modal");
      if (modal && modal.classList.contains("is-open")) {
        closeScentModal();
      }
    }
  });

  // Bắt sự kiện click mở modal từ các nút trên trang [data-open-scent]
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-open-scent]");
    if (trigger) {
      e.preventDefault();
      const scentId = trigger.getAttribute("data-open-scent");
      openScentModal(scentId);
    }
  });
}

/**
 * Hỗ trợ nếu người dùng truy cập trực tiếp trang chi-tiet-san-pham.html
 */
function initProductDetailPage() {
  const isDetailPage = document.querySelector(".product-detail-page");
  if (!isDetailPage) return;

  const urlParams = new URLSearchParams(window.location.search);
  let scentId = urlParams.get("id") || "first-class";
  if (!PRODUCTS_CONFIG[scentId]) scentId = "first-class";

  const p = PRODUCTS_CONFIG[scentId];

  const headTitle = document.getElementById("page-head-title");
  if (headTitle) headTitle.textContent = `${p.name} - Nến Thơm 50g | ScentPod`;

  const bcName = document.getElementById("bc-product-name");
  if (bcName) bcName.textContent = p.name;

  const codeBadge = document.getElementById("detail-code-badge");
  if (codeBadge) codeBadge.textContent = p.code;

  const catEl = document.getElementById("detail-category");
  if (catEl) catEl.textContent = p.category;

  const headingEl = document.getElementById("product-title-heading");
  if (headingEl) headingEl.textContent = `${p.name} (${p.posterTitle || ''})`;

  const scentNameEl = document.getElementById("detail-scent-name");
  if (scentNameEl) scentNameEl.textContent = p.scentName;

  const vibeEl = document.getElementById("detail-vibe");
  if (vibeEl) vibeEl.textContent = p.shortDesc;

  const mainImg = document.getElementById("detail-main-img");
  if (mainImg) {
    mainImg.src = p.defaultSrc;
    mainImg.alt = `Nến thơm ScentPod 50g - ${p.name}`;
  }

  // Tầng hương
  const topNotes = document.getElementById("detail-tier-top");
  if (topNotes) topNotes.textContent = p.topNotes;
  const heartNotes = document.getElementById("detail-tier-heart");
  if (heartNotes) heartNotes.textContent = p.heartNotes;
  const baseNotes = document.getElementById("detail-tier-base");
  if (baseNotes) baseNotes.textContent = p.baseNotes;

  // Gán sự kiện nút hỏi mua FB
  const detailBuyFbBtn = document.getElementById("detail-buy-fb-btn");
  if (detailBuyFbBtn) {
    detailBuyFbBtn.addEventListener("click", () => {
      openFacebookCta("product_detail_page", p.name);
    });
  }

  // Gán sự kiện nút sao chép
  const detailCopyBtn = document.getElementById("detail-copy-info-btn");
  if (detailCopyBtn) {
    detailCopyBtn.addEventListener("click", () => {
      copyProductInfo(scentId);
    });
  }
}
