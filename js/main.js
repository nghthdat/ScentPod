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
  initProductImageManager();
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

/**
 * ==========================================================================
 * TÍNH NĂNG TẢI & QUẢN LÝ ẢNH SẢN PHẨM TRỰC TIẾP TỪ MÁY TÍNH / THƯ VIỆN
 * ==========================================================================
 */

const PRODUCTS_CONFIG = {
  "sap-thom-bo-ba": {
    id: "sap-thom-bo-ba",
    name: "Bộ ba sáp thơm & Nến trải nghiệm",
    filename: "sap-thom-bo-ba.jpg",
    defaultSrc: "images/sap-thom-bo-ba.jpg",
    fallbackSrc: "images/sap-thom-bo-ba.svg",
    price: "89.000đ"
  },
  "nen-thom-mini": {
    id: "nen-thom-mini",
    name: "Nến thơm Santal & Fig (113g)",
    filename: "nen-thom-mini.jpg",
    defaultSrc: "images/nen-thom-mini.jpg",
    fallbackSrc: "images/nen-thom-mini.svg",
    price: "69.000đ"
  },
  "combo-nen-sap": {
    id: "combo-nen-sap",
    name: "Combo Góc Học Bài & Thư Giãn",
    filename: "combo-nen-sap.jpg",
    defaultSrc: "images/combo-nen-sap.jpg",
    fallbackSrc: "images/combo-nen-sap.svg",
    price: "139.000đ"
  },
  "nen-thu-gian": {
    id: "nen-thu-gian",
    name: "Nến thơm thư giãn Classic (Hũ nắp kim loại)",
    filename: "nen-thu-gian.jpg",
    defaultSrc: "images/nen-thu-gian.jpg",
    fallbackSrc: "images/nen-thu-gian.svg",
    price: "85.000đ"
  },
  "sap-treo-tu": {
    id: "sap-treo-tu",
    name: "Sáp thơm bỏ túi & Treo tủ thảo mộc",
    filename: "sap-treo-tu.jpg",
    defaultSrc: "images/sap-treo-tu.jpg",
    fallbackSrc: "images/sap-treo-tu.svg",
    price: "49.000đ"
  }
};

/**
 * Khởi chạy hệ thống quản lý và tải ảnh sản phẩm
 */
function initProductImageManager() {
  applyProductImages();
  setupFloatingManagerAndModal();
}

/**
 * Lấy ảnh tùy chỉnh từ localStorage
 */
function getCustomImage(productId) {
  try {
    return localStorage.getItem("scentpod_custom_" + productId);
  } catch (e) {
    return null;
  }
}

/**
 * Lưu ảnh tùy chỉnh vào localStorage
 */
function setCustomImage(productId, base64) {
  try {
    localStorage.setItem("scentpod_custom_" + productId, base64);
  } catch (e) {
    console.warn("Không thể lưu ảnh vào bộ nhớ trình duyệt:", e);
  }
}

/**
 * Xóa ảnh tùy chỉnh
 */
function removeCustomImage(productId) {
  try {
    localStorage.removeItem("scentpod_custom_" + productId);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Hiển thị Toast thông báo trạng thái
 */
function showToast(message) {
  let toast = document.querySelector(".scentpod-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "scentpod-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-show");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("is-show");
  }, 3200);
}

/**
 * Cập nhật ảnh của các sản phẩm trên toàn trang và tạo nút đổi ảnh nhanh
 */
function applyProductImages() {
  const wrappers = document.querySelectorAll(".product-img-wrapper[data-product-id]");
  wrappers.forEach((wrapper) => {
    const productId = wrapper.getAttribute("data-product-id");
    const info = PRODUCTS_CONFIG[productId];
    if (!info) return;

    const img = wrapper.querySelector("img");
    if (!img) return;

    const customImg = getCustomImage(productId);
    if (customImg) {
      img.src = customImg;
      let badge = wrapper.querySelector(".custom-badge-indicator");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "custom-badge-indicator";
        badge.textContent = "Ảnh từ máy";
        wrapper.appendChild(badge);
      }
    } else {
      img.src = info.defaultSrc;
      const badge = wrapper.querySelector(".custom-badge-indicator");
      if (badge) badge.remove();
    }

    // Gắn thanh nút thao tác nhanh trên ảnh
    let uploadBar = wrapper.querySelector(".product-card-upload-bar");
    if (!uploadBar) {
      uploadBar = document.createElement("div");
      uploadBar.className = "product-card-upload-bar";

      // Nút Tải ảnh từ máy
      const uploadBtn = document.createElement("button");
      uploadBtn.type = "button";
      uploadBtn.className = "btn-card-upload";
      uploadBtn.title = "Tải ảnh từ máy tính hoặc thư viện ảnh";
      uploadBtn.setAttribute("aria-label", "Tải ảnh mới từ máy");
      uploadBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <span>Đổi ảnh</span>
      `;

      // Input file ẩn
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";

      uploadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          processImageUpload(productId, e.target.files[0]);
          e.target.value = "";
        }
      });

      uploadBar.appendChild(uploadBtn);
      uploadBar.appendChild(fileInput);

      // Nút khôi phục ảnh gốc
      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "btn-card-reset";
      resetBtn.title = "Khôi phục ảnh gốc ban đầu";
      resetBtn.setAttribute("aria-label", "Khôi phục ảnh gốc");
      resetBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
      `;
      resetBtn.style.display = customImg ? "inline-flex" : "none";

      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeCustomImage(productId);
        applyProductImages();
        renderModalProductList();
        showToast(`Đã khôi phục ảnh mặc định cho "${info.name}"!`);
      });

      uploadBar.appendChild(resetBtn);
      wrapper.appendChild(uploadBar);
    } else {
      const resetBtn = uploadBar.querySelector(".btn-card-reset");
      if (resetBtn) {
        resetBtn.style.display = customImg ? "inline-flex" : "none";
      }
    }
  });
}

/**
 * Xử lý tải ảnh lên, tự động nén tối ưu và lưu trữ
 */
async function processImageUpload(productId, file) {
  const info = PRODUCTS_CONFIG[productId];
  if (!info) return;

  if (!file.type.startsWith("image/")) {
    showToast("⚠️ Vui lòng chọn đúng file hình ảnh (JPG, PNG, WebP)!");
    return;
  }

  try {
    showToast("Đang nén & tối ưu ảnh...");
    const optimizedBase64 = await resizeAndCompressImage(file, 1200, 1500, 0.88);

    // 1. Lưu vào trình duyệt (localStorage)
    setCustomImage(productId, optimizedBase64);
    applyProductImages();
    renderModalProductList();

    // 2. Nếu đang chạy local server (node scripts/server.js), tự động ghi ra thư mục images/ trên đĩa
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, imageData: optimizedBase64 })
      });
      if (res.ok) {
        showToast(`✅ Đã lưu ảnh vào thư mục images/${info.filename} và hiển thị trên web! 🎉`);
        return;
      }
    } catch (netErr) {
      // Server không bật: sử dụng lưu trữ trình duyệt hoàn toàn bình thường
    }

    showToast(`✅ Đã cập nhật ảnh sản phẩm "${info.name}" từ thiết bị của bạn! 🎉`);
  } catch (err) {
    console.error("Lỗi khi tải ảnh:", err);
    showToast("⚠️ Không thể đọc file ảnh. Vui lòng thử lại với ảnh khác.");
  }
}

/**
 * Tự động thu nhỏ ảnh bằng HTML5 Canvas để tối ưu tốc độ và dung lượng
 */
function resizeAndCompressImage(file, maxWidth = 1200, maxHeight = 1500, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Tạo nút nổi Quản lý ảnh và Modal cửa sổ trung tâm
 */
function setupFloatingManagerAndModal() {
  if (document.querySelector(".img-manager-fab")) return;

  // Nút nổi ở góc trái màn hình
  const fab = document.createElement("button");
  fab.className = "img-manager-fab";
  fab.type = "button";
  fab.title = "Quản lý ảnh sản phẩm từ máy tính / điện thoại";
  fab.setAttribute("aria-label", "Quản lý ảnh sản phẩm");
  fab.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
    <span>Quản lý ảnh</span>
  `;
  document.body.appendChild(fab);

  // Khung Modal nền mờ
  const backdrop = document.createElement("div");
  backdrop.className = "scentpod-modal-backdrop";
  backdrop.innerHTML = `
    <div class="scentpod-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <div class="modal-title-group">
          <h3 id="modal-title">Quản Lý Ảnh Sản Phẩm ScentPod</h3>
          <p>Tải ảnh trực tiếp từ máy tính hoặc thư viện ảnh trên điện thoại</p>
        </div>
        <button type="button" class="modal-close-btn" aria-label="Đóng cửa sổ">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-instruction-box">
          💡 <strong>Cách đổi ảnh:</strong> Bạn bấm <em>"Tải ảnh từ máy"</em> ở từng sản phẩm để chọn ảnh từ máy tính hoặc thư viện ảnh điện thoại. Ảnh sẽ hiển thị ngay lập tức trên web.<br>
          📦 <strong>Để lưu lâu dài lên GitHub:</strong> Bấm <em>"Tải file .jpg"</em> rồi chép vào thư mục <code>images/</code> và đẩy lên GitHub. Hoặc chạy <code>npm start</code> để tự động lưu khi tải ảnh!
        </div>
        <div class="modal-product-list"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-action-small btn-reset-all">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          Khôi phục tất cả ảnh gốc
        </button>
        <button type="button" class="btn btn-primary btn-modal-done" style="padding: 8px 18px; font-size: 0.88rem;">Hoàn tất &amp; Đóng</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const closeBtn = backdrop.querySelector(".modal-close-btn");
  const doneBtn = backdrop.querySelector(".btn-modal-done");
  const resetAllBtn = backdrop.querySelector(".btn-reset-all");

  const openModal = () => {
    renderModalProductList();
    backdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    backdrop.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  fab.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  doneBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  resetAllBtn.addEventListener("click", () => {
    if (confirm("Bạn có chắc muốn khôi phục tất cả ảnh sản phẩm về ảnh gốc ban đầu không?")) {
      Object.keys(PRODUCTS_CONFIG).forEach((id) => removeCustomImage(id));
      applyProductImages();
      renderModalProductList();
      showToast("Đã khôi phục tất cả ảnh về mặc định ban đầu!");
    }
  });
}

/**
 * Hiển thị danh sách 5 sản phẩm trong Modal
 */
function renderModalProductList() {
  const container = document.querySelector(".modal-product-list");
  if (!container) return;

  container.innerHTML = "";

  Object.keys(PRODUCTS_CONFIG).forEach((id) => {
    const p = PRODUCTS_CONFIG[id];
    const customImg = getCustomImage(id);
    const imgSrc = customImg || p.defaultSrc;

    const item = document.createElement("div");
    item.className = "modal-product-item";
    item.innerHTML = `
      <div class="modal-product-thumb">
        <img src="${imgSrc}" alt="${p.name}" onerror="this.onerror=null; this.src='${p.fallbackSrc}';">
      </div>
      <div class="modal-product-details">
        <h4 class="modal-product-name">${p.name}</h4>
        <div class="modal-product-filename">images/${p.filename} &bull; ${p.price}</div>
        <span class="modal-product-status ${customImg ? 'is-custom' : 'is-default'}">
          ${customImg ? '✓ Đang dùng ảnh từ máy của bạn' : 'Ảnh mặc định'}
        </span>
      </div>
      <div class="modal-product-actions">
        <label class="btn-upload-file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Tải ảnh từ máy
          <input type="file" accept="image/*" style="display: none;" class="modal-file-input" data-id="${id}">
        </label>
        <button type="button" class="btn-action-small btn-dl-img" data-id="${id}" title="Tải file .jpg về máy">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Tải .jpg
        </button>
        ${customImg ? `
          <button type="button" class="btn-action-small btn-reset-single" data-id="${id}" title="Khôi phục gốc" style="color: #f87171;">
            ↺ Gốc
          </button>
        ` : ''}
      </div>
    `;

    // Sự kiện input file
    const fileInput = item.querySelector(".modal-file-input");
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        processImageUpload(id, e.target.files[0]);
      }
    });

    // Sự kiện tải file .jpg về máy
    const dlBtn = item.querySelector(".btn-dl-img");
    dlBtn.addEventListener("click", () => {
      downloadProductImage(id);
    });

    // Sự kiện khôi phục riêng từng sản phẩm
    const singleResetBtn = item.querySelector(".btn-reset-single");
    if (singleResetBtn) {
      singleResetBtn.addEventListener("click", () => {
        removeCustomImage(id);
        applyProductImages();
        renderModalProductList();
        showToast(`Đã khôi phục ảnh gốc của "${p.name}"!`);
      });
    }

    container.appendChild(item);
  });
}

/**
 * Tải file ảnh về máy để người dùng dễ dàng lưu vào thư mục images/
 */
function downloadProductImage(productId) {
  const p = PRODUCTS_CONFIG[productId];
  if (!p) return;

  const customImg = getCustomImage(productId);
  const src = customImg || p.defaultSrc;

  const a = document.createElement("a");
  a.href = src;
  a.download = p.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Đã tải xuống file "${p.filename}" vào máy của bạn!`);
}

