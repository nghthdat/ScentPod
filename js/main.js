/**
 * ==========================================================================
 * SCENTPOD - JAVASCRIPT CHÍNH (DÙNG CHUNG CHO CẢ 3 TRANG)
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. CẤU HÌNH LINK FACEBOOK DUY NHẤT (BẠN CHỈ CẦN THAY LINK TẠI ĐÂY)
// --------------------------------------------------------------------------
// Thay bằng link Fanpage hoặc link tin nhắn Messenger của ScentPod
const FB_LINK = "https://m.me/scentpod.candle"; 
// Ví dụ khác: "https://www.facebook.com/scentpod.official"

// --------------------------------------------------------------------------
// 2. KHỞI CHẠY KHI TẢI XONG TRANG
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initFacebookLinks();
  initMobileMenu();
  initHeaderScroll();
  initScrollAnimations();
});

/**
 * Tự động gán link Facebook vào tất cả phần tử có thuộc tính [data-fb]
 * Đồng thời tự động thêm target="_blank" và rel="noopener noreferrer" để mở tab mới an toàn
 */
function initFacebookLinks() {
  const fbElements = document.querySelectorAll("[data-fb]");
  fbElements.forEach((el) => {
    // Nếu là thẻ <a>, gán href
    if (el.tagName.toLowerCase() === "a") {
      el.setAttribute("href", FB_LINK);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    } else {
      // Nếu là nút hoặc thẻ khác, thêm sự kiện click mở tab mới
      el.addEventListener("click", (e) => {
        e.preventDefault();
        window.open(FB_LINK, "_blank", "noopener,noreferrer");
      });
      el.style.cursor = "pointer";
    }
  });
}

/**
 * Xử lý menu Mobile (Hamburger Toggle)
 */
function initMobileMenu() {
  const toggleBtn = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  if (!toggleBtn || !navMenu) return;

  // Click nút toggle
  toggleBtn.addEventListener("click", () => {
    const isActive = toggleBtn.classList.toggle("is-active");
    navMenu.classList.toggle("is-open", isActive);
    toggleBtn.setAttribute("aria-expanded", isActive ? "true" : "false");
  });

  // Tự động đóng menu khi bấm vào link chuyển trang
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      toggleBtn.classList.remove("is-active");
      navMenu.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  });

  // Đóng khi click bên ngoài menu
  document.addEventListener("click", (e) => {
    if (
      navMenu.classList.contains("is-open") &&
      !navMenu.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      toggleBtn.classList.remove("is-active");
      navMenu.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
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
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll(); // Chạy kiểm tra ngay lúc mở trang
}

/**
 * Hiệu ứng hiện dần khi cuộn trang (Intersection Observer)
 */
function initScrollAnimations() {
  const elements = document.querySelectorAll(".reveal-on-scroll");
  if (!elements.length) return;

  // Nếu trình duyệt hỗ trợ IntersectionObserver
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Sau khi đã hiện thì không cần theo dõi nữa để tối ưu hiệu năng
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    elements.forEach((el) => observer.observe(el));
  } else {
    // Fallback nếu trình duyệt cũ không hỗ trợ IntersectionObserver
    elements.forEach((el) => el.classList.add("is-visible"));
  }
}
