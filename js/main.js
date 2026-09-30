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
  initScentDetailModal();
  initCartSystem();
  initHeaderAuth();
  initCategoryFilter();
  initFloatingChatOptimization();
});

/**
 * Tối ưu hiển thị nút chat nổi "Tư vấn ngay" (.fb-floating-btn):
 * - Tự động thu gọn thành nút tròn Messenger tinh tế (48px) khi cuộn vào khu vực bộ lọc/sản phẩm
 * - Ngăn chặn triệt để lỗi Overlap (đè lên các tag chip bộ lọc như "Kèm thiệp tay" hoặc các dropdown)
 * - Tự động mở rộng hiển thị chữ "Tư vấn ngay" khi người dùng hover vào nút hoặc ở đầu trang
 */
function initFloatingChatOptimization() {
  const fbBtn = document.querySelector(".fb-floating-btn");
  if (!fbBtn) return;

  const updateChatState = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const filterSection = document.getElementById("ai-search-filter-section");
    
    // Nếu ở đầu trang hero (scrollY < 120), mở rộng hiển thị đầy đủ
    // Khi cuộn xuống vùng nội dung / bộ lọc, tự động thu gọn để nhường không gian thao tác
    if (scrollY > 120) {
      fbBtn.classList.add("is-compact");
    } else {
      if (filterSection && scrollY > 60) {
        fbBtn.classList.add("is-compact");
      } else if (!filterSection) {
        fbBtn.classList.remove("is-compact");
      }
    }
  };

  window.addEventListener("scroll", updateChatState, { passive: true });
  updateChatState();
}

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
 * Chuẩn hóa chuỗi tiếng Việt (bỏ dấu, chuyển chữ thường) để tìm kiếm AI thông minh
 */
function normalizeVietnamese(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

/**
 * ==========================================================================
 * BỘ LỌC ĐA TIÊU CHÍ & TÌM KIẾM THÔNG MINH BẰNG TỪ KHÓA AI
 * Hỗ trợ tìm kiếm theo:
 * - Tâm trạng / Công dụng AI: "học bài", "thức khuya", "khử mùi", "ngủ ngon"...
 * - Tầng hương: "trà", "đào", "muối biển", "gỗ tuyết tùng", "hổ phách"...
 * - Mức giá: Dưới 50k, 50k - 100k, Trên 100k
 * - Ưu đãi: Đồng giá ship 15k, Quà tặng kèm, Tiết kiệm 20k+, Chốt Inbox
 * - Sắp xếp: Mặc định, Giá tăng, Giá giảm, Tiết kiệm nhiều nhất
 * ==========================================================================
 */
function initProductSearchAndFilter() {
  const searchInput = document.getElementById("ai-product-search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const suggestionsPopover = document.getElementById("ai-search-suggestions");
  const suggProductsList = document.getElementById("sugg-products-list");

  const typeSelect = document.getElementById("filter-type-select");
  const priceSelect = document.getElementById("filter-price-select");
  const purposeSelect = document.getElementById("filter-purpose-select");
  const dealSelect = document.getElementById("filter-deal-select");
  const scentSelect = document.getElementById("filter-scent-select");
  const sortSelect = document.getElementById("filter-sort-select");

  const resetBtn = document.getElementById("reset-filters-btn");
  const noResultsResetBtn = document.getElementById("no-results-reset-btn");
  const matchingCountEl = document.getElementById("matching-count");
  const activeTagsEl = document.getElementById("active-filter-tags");
  const clearAllTagsBtn = document.getElementById("clear-all-tags-btn");
  const noProductsBox = document.getElementById("no-products-found");
  const chipBtns = document.querySelectorAll(".ai-chip-btn");
  const filterBtns = document.querySelectorAll(".category-filter-btn");

  const singleGrid = document.getElementById("single-candles-grid");
  const comboGrid = document.getElementById("combo-grid");
  const comboSection = document.getElementById("combo");

  // Nếu không ở trang san-pham.html, bỏ qua an toàn
  if (!singleGrid && !comboGrid) return;

  const allCards = Array.from(document.querySelectorAll("#single-candles-grid .product-card, #combo-grid .product-card"));
  if (allCards.length === 0) return;

  // Lưu trữ thứ tự DOM ban đầu để khôi phục khi sắp xếp mặc định
  const initialSingleCards = Array.from(singleGrid ? singleGrid.querySelectorAll(".product-card") : []);
  const initialComboCards = Array.from(comboGrid ? comboGrid.querySelectorAll(".product-card") : []);

  let currentCategory = "all"; // 'all' | 'single' | 'combo'

  // Hàm chuyển đổi size pill trên thẻ nến lẻ để khớp với lựa chọn lọc
  function syncCardSizePill(card, targetSize) {
    if (!card) return;
    const btn = card.querySelector(`.size-pill-btn[data-size="${targetSize}"]`);
    if (btn && !btn.classList.contains("is-active")) {
      btn.click();
    }
  }

  function applyFiltersAndSearch() {
    const rawQuery = searchInput ? searchInput.value.trim() : "";
    const normQuery = normalizeVietnamese(rawQuery);
    const queryWords = normQuery.split(/\s+/).filter(Boolean);

    // Hiển thị / ẩn nút xóa tìm kiếm
    if (clearSearchBtn) {
      clearSearchBtn.style.display = rawQuery ? "flex" : "none";
    }

    const selectedType = typeSelect ? typeSelect.value : "all";
    const selectedPrice = priceSelect ? priceSelect.value : "all";
    const selectedPurpose = purposeSelect ? purposeSelect.value : "all";
    const selectedDeal = dealSelect ? dealSelect.value : "all";
    const selectedScent = scentSelect ? scentSelect.value : "all";
    const selectedSort = sortSelect ? sortSelect.value : "default";

    let visibleCount = 0;
    let visibleSingleCount = 0;
    let visibleComboCount = 0;

    allCards.forEach((card) => {
      const type = card.getAttribute("data-product-type") || "single";
      const subtypes = (card.getAttribute("data-subtypes") || type).split(",").map((s) => s.trim());
      const purposes = (card.getAttribute("data-purposes") || "").split(",").map((s) => s.trim());
      const family = card.getAttribute("data-family") || "";
      const perks = (card.getAttribute("data-perks") || "").split(",").map((s) => s.trim());
      const priceMin = parseInt(card.getAttribute("data-price-min") || "0", 10);
      const priceDefault = parseInt(card.getAttribute("data-price-default") || "0", 10);
      const savings = parseInt(card.getAttribute("data-savings") || "0", 10);
      const aiKeywords = card.getAttribute("data-ai-keywords") || "";
      const cardTitle = card.getAttribute("data-title") || "";
      const cardText = card.innerText || "";

      // 1. Lọc theo Phân Loại Tabs (Tất cả / Nến lẻ / Combo)
      if (currentCategory !== "all" && type !== currentCategory) {
        card.style.display = "none";
        return;
      }

      // 2. Lọc theo Định Dạng / Phân Loại Sản Phẩm (Subtypes)
      if (selectedType !== "all") {
        if (!subtypes.includes(selectedType)) {
          card.style.display = "none";
          return;
        }
        // Nếu chọn SP01 hoặc SP02 trên thẻ nến lẻ, tự động chọn size tương ứng
        if (type === "single") {
          if (selectedType === "sp01") syncCardSizePill(card, "sp01");
          else if (selectedType === "sp02") syncCardSizePill(card, "sp02");
          else if (selectedType === "mini") syncCardSizePill(card, "10g");
        }
      }

      // 3. Lọc theo Mức Giá
      if (selectedPrice === "under-50") {
        // Dưới 50k: Thẻ đơn có size 10g hoặc SP01 (<= 50k)
        if (priceMin > 50000) {
          card.style.display = "none";
          return;
        }
        if (type === "single") {
          syncCardSizePill(card, "sp01");
        }
      } else if (selectedPrice === "50-90") {
        // 50k – 90k: SP02 (85k), CB01 (89k)
        if (priceDefault < 50000 || priceDefault > 90000) {
          card.style.display = "none";
          return;
        }
        if (type === "single") {
          syncCardSizePill(card, "sp02");
        }
      } else if (selectedPrice === "above-90") {
        // Trên 90k: CB02 (119k), CB03 (129k)
        if (priceDefault <= 90000) {
          card.style.display = "none";
          return;
        }
      }

      // 4. Lọc theo Mục Đích & Tâm Trạng AI
      if (selectedPurpose !== "all") {
        if (!purposes.includes(selectedPurpose)) {
          // Kiểm tra thêm từ khóa nếu purposes chưa có
          const purposeKeywords = {
            study: "hoc bai tap trung on thi tinh tao",
            deodorize: "khu mui phong tro balo tu do",
            relax: "thu gian ngu ngon de ngu chill",
            dating: "hen ho ngot ngao lang man",
            fresh: "tuoi mat gio bien phong khoang",
            gift: "qua tang nguoi yeu ban than thiep"
          };
          const targetKey = purposeKeywords[selectedPurpose] || selectedPurpose;
          const searchNorm = normalizeVietnamese([cardTitle, aiKeywords, cardText].join(" "));
          const hasMatch = targetKey.split(/\s+/).some((k) => searchNorm.includes(k));
          if (!hasMatch) {
            card.style.display = "none";
            return;
          }
        }
      }

      // 5. Lọc theo Ưu Đãi & Quà Tặng
      if (selectedDeal === "ship15k" && !perks.includes("ship15k")) {
        card.style.display = "none";
        return;
      }
      if (selectedDeal === "gift-tealight" && !perks.includes("gift-tealight")) {
        card.style.display = "none";
        return;
      }
      if (selectedDeal === "gift-card" && !perks.includes("gift-card")) {
        card.style.display = "none";
        return;
      }
      if (selectedDeal === "savings" && savings < 20000) {
        card.style.display = "none";
        return;
      }
      if (selectedDeal === "inbox" && !perks.includes("inbox")) {
        card.style.display = "none";
        return;
      }

      // 6. Lọc theo Nhóm Hương
      if (selectedScent !== "all" && family !== selectedScent) {
        card.style.display = "none";
        return;
      }

      // 7. Tìm kiếm AI theo Từ Khóa (Tên mùi, tầng hương, tâm trạng, công dụng, mã...)
      if (queryWords.length > 0) {
        const searchableRaw = [cardTitle, cardText, aiKeywords, family, subtypes.join(" "), purposes.join(" ")].join(" ");
        const searchableNorm = normalizeVietnamese(searchableRaw);

        // Kiểm tra xem tất cả các từ trong query có xuất hiện không
        const matchesAll = queryWords.every((w) => searchableNorm.includes(w));
        if (!matchesAll) {
          card.style.display = "none";
          return;
        }
      }

      // Khớp tất cả điều kiện!
      card.style.display = "";
      visibleCount++;
      if (type === "single") visibleSingleCount++;
      if (type === "combo") visibleComboCount++;
    });

    // 8. Xử lý sắp xếp (Sorting)
    if (selectedSort !== "default") {
      const sortFn = (a, b) => {
        const priceA = parseInt(a.getAttribute("data-price-default") || "0", 10);
        const priceB = parseInt(b.getAttribute("data-price-default") || "0", 10);
        const savingsA = parseInt(a.getAttribute("data-savings") || "0", 10);
        const savingsB = parseInt(b.getAttribute("data-savings") || "0", 10);

        if (selectedSort === "price-asc") return priceA - priceB;
        if (selectedSort === "price-desc") return priceB - priceA;
        if (selectedSort === "savings-desc") return savingsB - savingsA;
        return 0;
      };

      if (singleGrid) {
        const singleList = Array.from(singleGrid.querySelectorAll(".product-card"));
        singleList.sort(sortFn).forEach((el) => singleGrid.appendChild(el));
      }
      if (comboGrid) {
        const comboList = Array.from(comboGrid.querySelectorAll(".product-card"));
        comboList.sort(sortFn).forEach((el) => comboGrid.appendChild(el));
      }
    } else {
      // Khôi phục thứ tự ban đầu
      if (singleGrid) {
        initialSingleCards.forEach((el) => singleGrid.appendChild(el));
      }
      if (comboGrid) {
        initialComboCards.forEach((el) => comboGrid.appendChild(el));
      }
    }

    // 9. Cập nhật hiển thị các khối Section mượt mà (không để lại khoảng trống thừa)
    if (singleGrid) {
      singleGrid.style.display = visibleSingleCount > 0 ? "grid" : "none";
    }
    if (comboSection) {
      comboSection.style.display = visibleComboCount > 0 ? "block" : "none";
      if (visibleSingleCount === 0 && visibleComboCount > 0) {
        comboSection.style.marginTop = "1.5rem";
        comboSection.style.paddingTop = "1rem";
        comboSection.style.borderTop = "none";
      } else {
        comboSection.style.marginTop = "5rem";
        comboSection.style.paddingTop = "2.5rem";
        comboSection.style.borderTop = "1px dashed rgba(229,169,59,0.25)";
      }
    }

    // 10. Hiển thị Trạng thái Rỗng (No products found)
    if (noProductsBox) {
      noProductsBox.style.display = visibleCount === 0 ? "block" : "none";
    }

    // 11. Cập nhật Số lượng & Thẻ lọc đang hoạt động (Active Tags)
    if (matchingCountEl) {
      matchingCountEl.textContent = visibleCount;
    }
    updateActiveFilterTags(rawQuery, selectedType, selectedPrice, selectedPurpose, selectedDeal, selectedScent, selectedSort);
  }

  function updateActiveFilterTags(query, type, price, purpose, deal, scent, sort) {
    if (!activeTagsEl) return;
    activeTagsEl.innerHTML = "";

    let tagCount = 0;

    const addTag = (icon, text, onRemove) => {
      tagCount++;
      const tag = document.createElement("span");
      tag.className = "active-tag-chip";
      tag.innerHTML = `<span><span class="tag-icon">${icon}</span>${text}</span> <span class="remove-tag" role="button" title="Gỡ bộ lọc này">&times;</span>`;
      tag.querySelector(".remove-tag").addEventListener("click", onRemove);
      activeTagsEl.appendChild(tag);
    };

    if (query) {
      addTag("🔍", `"${query}"`, () => {
        if (searchInput) searchInput.value = "";
        chipBtns.forEach((c) => c.classList.remove("is-active"));
        applyFiltersAndSearch();
      });
    }

    if (currentCategory !== "all") {
      const label = currentCategory === "single" ? "Nến & Sáp lẻ" : "Combo chiến lược";
      addTag("🏷️", label, () => {
        currentCategory = "all";
        filterBtns.forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-filter") === "all"));
        applyFiltersAndSearch();
      });
    }

    if (type !== "all") {
      const typeLabels = {
        sp01: "Sáp bỏ túi 50g (SP01)",
        sp02: "Nến 100g (SP02)",
        combo: "Combo chiến lược",
        mini: "Mini 10g"
      };
      addTag("🥫", typeLabels[type] || type, () => {
        if (typeSelect) typeSelect.value = "all";
        applyFiltersAndSearch();
      });
    }

    if (price !== "all") {
      const priceLabels = {
        "under-50": "Dưới 50k",
        "50-90": "50k – 90k",
        "above-90": "Trên 90k"
      };
      addTag("💰", priceLabels[price] || price, () => {
        if (priceSelect) priceSelect.value = "all";
        applyFiltersAndSearch();
      });
    }

    if (purpose !== "all") {
      const purposeLabels = {
        study: "Học bài & Ôn thi",
        deodorize: "Khử mùi phòng trọ",
        relax: "Thư giãn & Dễ ngủ",
        dating: "Hẹn hò ngọt ngào",
        fresh: "Gió biển tươi mát",
        gift: "Quà tặng tinh tế"
      };
      addTag("🎯", purposeLabels[purpose] || purpose, () => {
        if (purposeSelect) purposeSelect.value = "all";
        applyFiltersAndSearch();
      });
    }

    if (deal !== "all") {
      const dealLabels = {
        ship15k: "Đồng giá ship 15k",
        "gift-tealight": "Tặng tealight 0đ",
        "gift-card": "Kèm thiệp & diêm dài",
        savings: "Tiết kiệm 20k - 36k",
        inbox: "Giá chốt Inbox"
      };
      addTag("🎁", dealLabels[deal] || deal, () => {
        if (dealSelect) dealSelect.value = "all";
        applyFiltersAndSearch();
      });
    }

    if (scent !== "all") {
      const scentLabels = {
        "tea-herbal": "Trà & Thảo mộc",
        "fruity-sweet": "Trái cây & Đào",
        "ocean-fresh": "Khoáng biển & Sage",
        "woody-warm": "Gỗ tuyết tùng"
      };
      addTag("🌿", scentLabels[scent] || scent, () => {
        if (scentSelect) scentSelect.value = "all";
        applyFiltersAndSearch();
      });
    }

    if (sort !== "default") {
      const sortLabels = {
        "price-asc": "Giá: Thấp -> Cao",
        "price-desc": "Giá: Cao -> Thấp",
        "savings-desc": "Tiết kiệm nhiều nhất"
      };
      addTag("⚡", sortLabels[sort] || sort, () => {
        if (sortSelect) sortSelect.value = "default";
        applyFiltersAndSearch();
      });
    }

    // Hiển thị nút "Xóa tất cả" khi có ít nhất 1 bộ lọc
    if (clearAllTagsBtn) {
      clearAllTagsBtn.style.display = tagCount > 0 ? "inline-block" : "none";
    }
  }

  function resetAllFilters() {
    if (searchInput) searchInput.value = "";
    if (typeSelect) typeSelect.value = "all";
    if (priceSelect) priceSelect.value = "all";
    if (purposeSelect) purposeSelect.value = "all";
    if (dealSelect) dealSelect.value = "all";
    if (scentSelect) scentSelect.value = "all";
    if (sortSelect) sortSelect.value = "default";
    currentCategory = "all";

    filterBtns.forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-filter") === "all"));
    chipBtns.forEach((c) => c.classList.remove("is-active"));

    if (suggestionsPopover) suggestionsPopover.style.display = "none";

    applyFiltersAndSearch();
  }

  // Cập nhật và render live suggestions popover
  function renderLiveSuggestions(val) {
    if (!suggestionsPopover) return;
    const query = normalizeVietnamese(val.trim());

    if (!suggProductsList) return;
    suggProductsList.innerHTML = "";

    // Tìm kiếm các sản phẩm khớp với query để hiển thị xem trước
    const matched = allCards.filter((card) => {
      const title = card.getAttribute("data-title") || "";
      const aiKeywords = card.getAttribute("data-ai-keywords") || "";
      const text = card.innerText || "";
      const norm = normalizeVietnamese([title, aiKeywords, text].join(" "));
      return !query || norm.includes(query);
    }).slice(0, 3);

    if (matched.length > 0) {
      matched.forEach((card) => {
        const title = card.getAttribute("data-title") || "";
        const price = card.querySelector(".product-price") ? card.querySelector(".product-price").innerText.split(" ")[0] : "";
        const img = card.querySelector("img") ? card.querySelector("img").src : "images/sap-thom-bo-ba.jpg";
        const type = card.getAttribute("data-product-type") === "combo" ? "🎁 Combo" : "🕯️ Nến & Sáp lẻ";

        const item = document.createElement("div");
        item.className = "sugg-product-item";
        item.innerHTML = `
          <img src="${img}" alt="${title}" class="sugg-product-thumb" />
          <div class="sugg-product-info">
            <span class="sugg-product-name">${title}</span>
            <span class="sugg-product-sub">${type}</span>
          </div>
          <span class="sugg-product-price">${price}</span>
        `;
        item.addEventListener("click", () => {
          if (searchInput) searchInput.value = title;
          suggestionsPopover.style.display = "none";
          applyFiltersAndSearch();
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        suggProductsList.appendChild(item);
      });
      suggProductsList.style.display = "flex";
    } else {
      suggProductsList.style.display = "none";
    }
  }

  // Lắng nghe sự kiện gõ tìm kiếm với debounce nhẹ
  let searchDebounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        const val = searchInput.value;
        const normVal = normalizeVietnamese(val);

        chipBtns.forEach((btn) => {
          const chipVal = normalizeVietnamese(btn.getAttribute("data-chip") || "");
          btn.classList.toggle("is-active", Boolean(normVal && chipVal && normVal.includes(chipVal)));
        });

        if (suggestionsPopover) {
          renderLiveSuggestions(val);
          suggestionsPopover.style.display = "block";
        }

        applyFiltersAndSearch();
      }, 150);
    });

    searchInput.addEventListener("focus", () => {
      if (suggestionsPopover) {
        renderLiveSuggestions(searchInput.value);
        suggestionsPopover.style.display = "block";
      }
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (suggestionsPopover) suggestionsPopover.style.display = "none";
        searchInput.value = "";
        chipBtns.forEach((c) => c.classList.remove("is-active"));
        applyFiltersAndSearch();
      }
    });

    // Bấm các tag gợi ý trong Popover
    document.querySelectorAll(".sugg-tag-item").forEach((item) => {
      item.addEventListener("click", () => {
        const q = item.getAttribute("data-query") || item.textContent;
        searchInput.value = q;
        if (suggestionsPopover) suggestionsPopover.style.display = "none";
        applyFiltersAndSearch();
      });
    });

    // Ẩn popover khi click ngoài
    document.addEventListener("click", (e) => {
      if (suggestionsPopover && !e.target.closest(".search-input-wrapper")) {
        suggestionsPopover.style.display = "none";
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      if (suggestionsPopover) suggestionsPopover.style.display = "none";
      chipBtns.forEach((c) => c.classList.remove("is-active"));
      applyFiltersAndSearch();
    });
  }

  const aiSearchBadge = document.querySelector(".ai-search-badge");
  if (aiSearchBadge && searchInput) {
    aiSearchBadge.addEventListener("click", () => {
      searchInput.focus();
      applyFiltersAndSearch();
    });
  }

  // Click vào các chip từ khóa gợi ý AI
  chipBtns.forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.preventDefault();
      const chipKeyword = chip.getAttribute("data-chip") || "";
      const isActive = chip.classList.contains("is-active");

      chipBtns.forEach((c) => c.classList.remove("is-active"));

      if (isActive) {
        if (searchInput) searchInput.value = "";
      } else {
        chip.classList.add("is-active");
        if (searchInput) searchInput.value = chipKeyword;
      }
      if (suggestionsPopover) suggestionsPopover.style.display = "none";
      applyFiltersAndSearch();
    });
  });

  // Nút chuyển đổi chế độ xem tag: Cuộn ngang 1 dòng <-> Mở rộng toàn bộ
  const toggleChipsBtn = document.getElementById("btn-toggle-chips-view");
  const keywordsCloud = document.getElementById("ai-keywords-cloud");
  if (toggleChipsBtn && keywordsCloud) {
    toggleChipsBtn.addEventListener("click", () => {
      const isExpanded = keywordsCloud.classList.toggle("is-expanded");
      toggleChipsBtn.innerHTML = isExpanded
        ? `<span class="toggle-icon">−</span><span class="toggle-text">Thu gọn</span>`
        : `<span class="toggle-icon">+</span><span class="toggle-text">Xem tất cả</span>`;
    });
  }

  // Hỗ trợ cuộn chuột ngang và kéo chuột mượt mà cho các thanh cuộn tag
  const chipLists = document.querySelectorAll(".ai-chips-list");
  chipLists.forEach((list) => {
    // Chuyển cuộn dọc của con lăn chuột thành cuộn ngang
    list.addEventListener("wheel", (e) => {
      if (!keywordsCloud || !keywordsCloud.classList.contains("is-expanded")) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          list.scrollLeft += e.deltaY;
        }
      }
    }, { passive: false });

    // Drag-to-scroll tiện lợi trên máy tính
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    list.addEventListener("mousedown", (e) => {
      isDown = true;
      hasMoved = false;
      startX = e.pageX - list.offsetLeft;
      scrollLeft = list.scrollLeft;
    });

    window.addEventListener("mouseup", () => {
      isDown = false;
    });

    list.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const x = e.pageX - list.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 4) {
        hasMoved = true;
        e.preventDefault();
        list.scrollLeft = scrollLeft - walk;
      }
    });

    // Ngăn chặn vô tình kích hoạt click chip khi người dùng đang vuốt kéo
    list.querySelectorAll(".ai-chip-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (hasMoved) {
          e.stopImmediatePropagation();
          e.preventDefault();
          hasMoved = false;
        }
      }, true);
    });
  });

  // Sự kiện thay đổi bộ lọc
  [typeSelect, priceSelect, purposeSelect, dealSelect, scentSelect, sortSelect].forEach((el) => {
    if (el) el.addEventListener("change", applyFiltersAndSearch);
  });

  // Nút Đặt lại bộ lọc & Xóa tất cả tags
  if (resetBtn) resetBtn.addEventListener("click", resetAllFilters);
  if (noResultsResetBtn) noResultsResetBtn.addEventListener("click", resetAllFilters);
  if (clearAllTagsBtn) clearAllTagsBtn.addEventListener("click", resetAllFilters);

  // Bộ lọc phân loại danh mục Tabs
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const filter = btn.getAttribute("data-filter");
      if (!filter) return;
      e.preventDefault();
      currentCategory = filter;
      filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      applyFiltersAndSearch();

      if (filter === "combo" && comboSection) {
        comboSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (filter === "single" && singleGrid) {
        singleGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Hỗ trợ tìm kiếm từ URL Query Params: ?search=... hoặc ?q=...
  try {
    if (typeof window !== "undefined" && window.location && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get("search") || urlParams.get("q");
      if (initialQuery && searchInput) {
        searchInput.value = initialQuery;
      }
    }
  } catch (e) {}

  // Tự động cuộn đến #combo nếu có hash
  if (typeof window !== "undefined" && window.location && window.location.hash === "#combo" && comboSection) {
    setTimeout(() => {
      comboSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  }

  // Kích hoạt lọc lần đầu
  applyFiltersAndSearch();
}

// Bí danh tương thích ngược
const initCategoryFilter = initProductSearchAndFilter;
if (typeof window !== "undefined") {
  window.initProductSearchAndFilter = initProductSearchAndFilter;
  window.initCategoryFilter = initProductSearchAndFilter;
  window.normalizeVietnamese = normalizeVietnamese;
}

/**
 * ==========================================================================
 * TÍNH NĂNG TẢI & QUẢN LÝ ẢNH SẢN PHẨM TRỰC TIẾP TỪ MÁY TÍNH / THƯ VIỆN
 * ==========================================================================
 */

const PRODUCTS_CONFIG = {
  "first-class": {
    id: "first-class",
    code: "Mùi 01",
    name: "First Class",
    scentName: "White Tea & Morning Dew",
    category: "Trà xanh và thảo mộc tươi",
    filename: "sap-thom-bo-ba.jpg",
    defaultSrc: "images/sap-thom-bo-ba.jpg",
    fallbackSrc: "images/sap-thom-bo-ba.svg",
    price: "85.000đ",
    listPrice: "95.000đ",
    topNotes: "Quýt non, Chanh vàng Ý, Lá bạc hà thanh mát.",
    heartNotes: "Trà trắng non, Hoa linh lan, Hoa sen nước.",
    baseNotes: "Gỗ tuyết tùng nhạt, Xạ hương sạch.",
    vibe: "Thanh mát, trong lành và đánh thức sự tập trung cho một ngày mới ngập tràn cảm hứng học tập."
  },
  "blind-date": {
    id: "blind-date",
    code: "Mùi 02",
    name: "Blind Date",
    scentName: "Sweet Peach & Vanilla Cloud",
    category: "Trái cây ngọt dịu kết hợp phấn hoa",
    filename: "nen-thom-mini.jpg",
    defaultSrc: "images/nen-thom-mini.jpg",
    fallbackSrc: "images/nen-thom-mini.svg",
    price: "85.000đ",
    listPrice: "95.000đ",
    topNotes: "Quả đào chín mọng, Quả lê tươi.",
    heartNotes: "Hoa lan nam phi trắng, Kẹo bông nhẹ.",
    baseNotes: "Vani sữa ấm, Hổ phách dịu.",
    vibe: "Ngọt ngào, e ấp và lãng mạn như cảm xúc xao xuyến, ấm áp của buổi hẹn hò đầu tiên."
  },
  "campus-breeze": {
    id: "campus-breeze",
    code: "Mùi 03",
    name: "Campus Breeze",
    scentName: "Sea Salt & Sage",
    category: "Hương khoáng biển và thảo mộc",
    filename: "combo-nen-sap.jpg",
    defaultSrc: "images/combo-nen-sap.jpg",
    fallbackSrc: "images/combo-nen-sap.svg",
    price: "85.000đ",
    listPrice: "95.000đ",
    topNotes: "Muối biển, Hạt bưởi hồng.",
    heartNotes: "Cây xô thơm (Sage), Tảo biển.",
    baseNotes: "Gỗ lũa mục, Xạ hương trắng.",
    vibe: "Phóng khoáng, tự do và mát lành như làn gió biển thổi qua hành lang góc sân trường."
  },
  "late-night": {
    id: "late-night",
    code: "Mùi 04",
    name: "Late Night",
    scentName: "Cedarwood & Warm Amber",
    category: "Hương gỗ ấm và thư giãn",
    filename: "nen-thu-gian.jpg",
    defaultSrc: "images/nen-thu-gian.jpg",
    fallbackSrc: "images/nen-thu-gian.svg",
    price: "85.000đ",
    listPrice: "95.000đ",
    topNotes: "Cam Bergamot thoang thoảng.",
    heartNotes: "Hoa oải hương nhẹ, Nhục đậu khấu.",
    baseNotes: "Gỗ thông tuyết tùng, Hổ phách vàng ấm.",
    vibe: "Trầm ấm, tĩnh lặng và vỗ về tâm hồn giải tỏa căng thẳng sau những giờ học bài đêm khuya."
  }
};

/**
 * ==========================================================================
 * BẢNG I: DANH MỤC SẢN PHẨM BÁN LẺ (MỤC TIÊU AOV THÁNG 1: 50.000 – 70.000 VNĐ)
 * - SP01: Sáp thơm bỏ túi khử mùi (Hũ nhôm tiện lợi 50g)
 *   Giá niêm yết: 55.000 VNĐ | Ưu đãi HSSV: 49.000 VNĐ | Chốt Inbox: 45.000 VNĐ
 *   KPI: Tiếp cận HSSV, kéo traffic về Web/Fanpage
 *   Quà: Kèm thiệp cảm ơn viết tay + giấy thử mùi mới
 * - SP02: Nến thơm thư giãn học bài (Hũ thủy tinh cao cấp 100g)
 *   Giá niêm yết: 95.000 VNĐ | Ưu đãi HSSV: 85.000 VNĐ | Chốt Inbox: 79.000 VNĐ
 *   KPI: Tăng giá trị giỏ hàng (AOV) đơn lẻ
 *   Quà: Tặng diêm dài chuyên dụng + hướng dẫn sử dụng nến
 * ==========================================================================
 */
const PRODUCT_SIZES_CONFIG = {
  "sp01": {
    code: "SP01",
    id: "sp01",
    size: "50g",
    typeName: "Sáp thơm bỏ túi khử mùi",
    spec: "Hũ nhôm tiện lợi 50g",
    label: "SP01: Sáp bỏ túi 50g (Hũ nhôm)",
    shortLabel: "Sáp 50g (SP01)",
    listPrice: 55000,
    originalPrice: 55000,
    listPriceFormatted: "55.000đ",
    originalPriceFormatted: "55.000đ",
    price: 49000,
    priceFormatted: "49.000đ",
    inboxPrice: 45000,
    inboxPriceFormatted: "45.000đ",
    savings: 6000,
    savingsFormatted: "6.000đ",
    giftNote: "Kèm thiệp cảm ơn viết tay + giấy thử mùi mới",
    gift: "Kèm thiệp cảm ơn viết tay + giấy thử mùi mới",
    kpiTarget: "Tháng 1: Tiếp cận HSSV, kéo traffic về Web/Fanpage",
    isDefault: false
  },
  "sp02": {
    code: "SP02",
    id: "sp02",
    size: "100g",
    typeName: "Nến thơm thư giãn học bài",
    spec: "Hũ thủy tinh cao cấp 100g",
    label: "SP02: Nến thơm 100g (Hũ thủy tinh)",
    shortLabel: "Nến 100g (SP02)",
    listPrice: 95000,
    originalPrice: 95000,
    listPriceFormatted: "95.000đ",
    originalPriceFormatted: "95.000đ",
    price: 85000,
    priceFormatted: "85.000đ",
    inboxPrice: 79000,
    inboxPriceFormatted: "79.000đ",
    savings: 10000,
    savingsFormatted: "10.000đ",
    giftNote: "Tặng diêm dài chuyên dụng + hướng dẫn sử dụng nến",
    gift: "Tặng diêm dài chuyên dụng + hướng dẫn sử dụng nến",
    kpiTarget: "Tháng 1 & 2: Tăng giá trị giỏ hàng (AOV) đơn lẻ",
    isDefault: true
  }
};

// Aliases tương thích ngược để không bị lỗi bất kỳ đoạn mã hay dữ liệu cũ nào
PRODUCT_SIZES_CONFIG["50g"] = PRODUCT_SIZES_CONFIG["sp01"];
PRODUCT_SIZES_CONFIG["100g"] = PRODUCT_SIZES_CONFIG["sp02"];
PRODUCT_SIZES_CONFIG["70g"] = PRODUCT_SIZES_CONFIG["sp02"];
PRODUCT_SIZES_CONFIG["10g"] = {
  ...PRODUCT_SIZES_CONFIG["sp01"],
  code: "SP01-Mini",
  size: "10g",
  typeName: "Sáp thơm mini bỏ túi",
  spec: "Hũ mini 10g",
  label: "10g: Mini dùng thử bỏ túi",
  shortLabel: "10g Mini",
  listPrice: 45000,
  listPriceFormatted: "45.000đ",
  price: 39000,
  priceFormatted: "39.000đ"
};

/**
 * ==========================================================================
 * BẢNG II: CÁC GÓI COMBO BÁN HÀNG CHIẾN LƯỢC
 * (TỐI ƯU AOV THÁNG 2 & 3: 90.000 – 110.000+ VNĐ | TỶ LỆ COMBO ≥ 45%)
 * - CB01: Combo Hương Sinh Viên (2 Hũ sáp bỏ túi tự chọn mùi)
 *   Tổng giá gốc: 110.000 VNĐ | Giá bán: 89.000 VNĐ | Tiết kiệm: 21.000 VNĐ
 *   KPI: Tháng 1 & 2: Đạt mốc AOV 90.000 VNĐ
 *   Chính sách: Đồng giá ship 15k + tặng giấy thơm trải nghiệm
 * - CB02: Combo Trọn Vẹn Chill (1 Hũ sáp bỏ túi + 1 Hũ nến thơm)
 *   Tổng giá gốc: 150.000 VNĐ | Giá bán: 119.000 VNĐ | Tiết kiệm: 31.000 VNĐ
 *   KPI: Tháng 2 & 3: Đạt mốc AOV 110.000 VNĐ
 *   Chính sách: Đồng giá ship 15k + tặng 1 viên tealight mini 0đ
 * - CB03: Combo Trải Nghiệm Đa Tầng (3 Hũ sáp bỏ túi đủ 3 mùi)
 *   Tổng giá gốc: 165.000 VNĐ | Giá bán: 129.000 VNĐ | Tiết kiệm: 36.000 VNĐ
 *   KPI: Tháng 3: Thúc đẩy tỷ lệ chốt combo đạt >= 45%
 *   Chính sách: Đồng giá ship 15k + tặng 1 viên tealight mini + thiệp viết tay
 * ==========================================================================
 */
const COMBOS_CONFIG = {
  "cb01": {
    id: "cb01",
    code: "CB01",
    name: "Combo Hương Sinh Viên",
    components: "2 Hũ sáp bỏ túi tự chọn mùi",
    scentName: "2 Hũ sáp bỏ túi khử mùi 50g tự chọn mùi",
    category: "Combo Bán Hàng Chiến Lược",
    originalPrice: 110000,
    originalPriceFormatted: "110.000đ",
    price: "89.000đ",
    priceNumber: 89000,
    salePrice: 89000,
    savings: 21000,
    savingsFormatted: "21.000đ",
    discountPercent: "19%",
    shippingPolicy: "Đồng giá ship 15k + tặng giấy thơm trải nghiệm",
    shippingPerk: "Đồng giá ship 15k",
    shippingFee: 15000,
    gift: "Đồng giá ship 15k + tặng giấy thơm trải nghiệm",
    gifts: "Tặng giấy thơm trải nghiệm + Đồng giá ship 15k",
    kpiTarget: "Tháng 1 & 2: Đạt mốc AOV 90.000 VNĐ",
    filename: "combo-cb01-huong-sinh-vien.jpg",
    defaultSrc: "images/combo-cb01-huong-sinh-vien.jpg",
    fallbackSrc: "images/sap-thom-bo-ba.svg",
    vibe: "Tối ưu ngân sách sinh viên: Tự do chọn 2 mùi sáp thơm bỏ túi 50g khử mùi tủ đồ, balo. Tiết kiệm ngay 21.000đ so với giá gốc."
  },
  "cb02": {
    id: "cb02",
    code: "CB02",
    name: "Combo Trọn Vẹn Chill",
    components: "1 Hũ sáp bỏ túi + 1 Hũ nến thơm",
    scentName: "1 Sáp bỏ túi 50g + 1 Nến thơm thư giãn 100g",
    category: "Combo Tối Ưu AOV",
    originalPrice: 150000,
    originalPriceFormatted: "150.000đ",
    price: "119.000đ",
    priceNumber: 119000,
    salePrice: 119000,
    savings: 31000,
    savingsFormatted: "31.000đ",
    discountPercent: "21%",
    shippingPolicy: "Đồng giá ship 15k + tặng 1 viên tealight mini 0đ",
    shippingPerk: "Đồng giá ship 15k",
    shippingFee: 15000,
    gift: "Đồng giá ship 15k + tặng 1 viên tealight mini 0đ",
    gifts: "Tặng 1 viên tealight mini 0đ + Đồng giá ship 15k",
    kpiTarget: "Tháng 2 & 3: Đạt mốc AOV 110.000 VNĐ",
    filename: "combo-cb02-tron-ven-chill.jpg",
    defaultSrc: "images/combo-cb02-tron-ven-chill.jpg",
    fallbackSrc: "images/combo-nen-sap.svg",
    vibe: "Combo trọn vẹn nhất: Vừa thắp nến 100g học bài tập trung, vừa mang sáp 50g khử mùi bên mình. Tiết kiệm 31.000đ."
  },
  "cb03": {
    id: "cb03",
    code: "CB03",
    name: "Combo Trải Nghiệm Đa Tầng",
    components: "3 Hũ sáp bỏ túi đủ 3 mùi",
    scentName: "3 Hũ sáp bỏ túi khử mùi 50g đủ 3 nốt hương",
    category: "Combo Đầy Đủ Hương Sắc",
    originalPrice: 165000,
    originalPriceFormatted: "165.000đ",
    price: "129.000đ",
    priceNumber: 129000,
    salePrice: 129000,
    savings: 36000,
    savingsFormatted: "36.000đ",
    discountPercent: "22%",
    shippingPolicy: "Đồng giá ship 15k + tặng 1 viên tealight mini + thiệp viết tay",
    shippingPerk: "Đồng giá ship 15k",
    shippingFee: 15000,
    gift: "Đồng giá ship 15k + tặng 1 viên tealight mini + thiệp viết tay",
    gifts: "Tặng 1 viên tealight mini + thiệp viết tay + Đồng giá ship 15k",
    kpiTarget: "Tháng 3: Thúc đẩy tỷ lệ chốt combo đạt >= 45%",
    filename: "combo-cb03-trai-nghiem-da-tang.jpg",
    defaultSrc: "images/combo-cb03-trai-nghiem-da-tang.jpg",
    fallbackSrc: "images/nen-thu-gian.svg",
    vibe: "Trọn bộ 3 mùi hương đổi mới tâm trạng mỗi ngày. Mức tiết kiệm sâu nhất 36.000đ cùng quà tặng kép tealight & thiệp viết tay."
  }
};

// Aliases tương thích ngược
COMBOS_CONFIG["combo-4-scents"] = COMBOS_CONFIG["cb01"];
COMBOS_CONFIG["combo-gift-box"] = COMBOS_CONFIG["cb02"];
COMBOS_CONFIG["combo-duo"] = COMBOS_CONFIG["cb03"];

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
        body: JSON.stringify({ productId, imageData: optimizedBase64, filename: info.filename })
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

/**
 * ==========================================================================
 * MODAL CHI TIẾT 3 TẦNG HƯƠNG (SCENT DETAIL MODAL)
 * ==========================================================================
 * Khi người dùng bấm vào từng sản phẩm hoặc nút "Tầng hương",
 * mở modal sang trọng hiển thị đầy đủ thông tin:
 * - Tên thương mại & tên mùi
 * - Nhóm hương
 * - Cấu trúc 3 tầng hương chi tiết (Top - Heart - Base)
 * - Nút chọn số lượng & Thêm vào giỏ hàng
 * - Vibe cảm xúc & tư vấn Messenger
 */
let currentModalScentId = null;
let currentModalQty = 1;

function initScentDetailModal() {
  // Tạo khung Modal nếu chưa có trong DOM
  let backdrop = document.querySelector(".scent-modal-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "scent-modal-backdrop";
    backdrop.id = "scent-detail-modal";
    backdrop.innerHTML = `
      <div class="scent-modal-container" role="dialog" aria-modal="true" aria-labelledby="scent-modal-title">
        <button type="button" class="scent-modal-close" aria-label="Đóng cửa sổ">&times;</button>
        <div class="scent-modal-layout">
          <div class="scent-modal-img-col">
            <span class="scent-modal-badge" id="scent-modal-badge">Mùi 01</span>
            <img id="scent-modal-img" src="" alt="ScentPod Fragrance">
          </div>
          <div class="scent-modal-info-col">
            <span class="scent-modal-group" id="scent-modal-group">Nhóm hương</span>
            <h2 class="scent-modal-title" id="scent-modal-title">First Class</h2>
            <div class="scent-modal-subtitle" id="scent-modal-subtitle">White Tea &amp; Morning Dew</div>
            <div class="scent-modal-price" id="scent-modal-price">89.000đ</div>
            <p class="scent-modal-vibe" id="scent-modal-vibe"></p>

            <div class="scent-pyramid-card">
              <div class="scent-pyramid-header">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 2 22 22 22 12 2"/>
                </svg>
                Cấu trúc 3 tầng hương chi tiết
              </div>

              <div class="scent-tier">
                <span class="tier-dot"></span>
                <span class="tier-label">Hương đầu (Top Notes)</span>
                <div class="tier-notes" id="scent-tier-top"></div>
              </div>

              <div class="scent-tier">
                <span class="tier-dot"></span>
                <span class="tier-label">Hương giữa (Heart Notes)</span>
                <div class="tier-notes" id="scent-tier-heart"></div>
              </div>

              <div class="scent-tier">
                <span class="tier-dot"></span>
                <span class="tier-label">Hương cuối (Base Notes)</span>
                <div class="tier-notes" id="scent-tier-base"></div>
              </div>
            </div>

            <div class="scent-specs">
              <span><span class="tag-icon">🌿</span>Sáp thực vật tự nhiên</span>
              <span><span class="tag-icon">🔥</span>Bấc cotton sạch không khói</span>
              <span><span class="tag-icon">📦</span>Size mini bỏ túi</span>
            </div>

            <!-- Nút Thêm vào giỏ hàng & Bộ chọn số lượng -->
            <div class="modal-cart-actions">
              <div class="qty-stepper">
                <button type="button" class="btn-modal-minus" aria-label="Giảm số lượng">&minus;</button>
                <span class="modal-qty-val" id="scent-modal-qty">1</span>
                <button type="button" class="btn-modal-plus" aria-label="Tăng số lượng">+</button>
              </div>
              <button type="button" class="btn btn-primary btn-modal-add-cart" id="btn-modal-add-cart" style="flex: 1; padding: 11px 16px; font-weight: 700; font-size: 0.92rem;">
                🛒 Thêm vào giỏ hàng
              </button>
            </div>

            <a href="${FB_LINK}" target="_blank" rel="noopener noreferrer" class="btn btn-outline scent-order-btn" style="border-color: rgba(255,255,255,0.18); font-size: 0.85rem; padding: 8px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.908 1.455 5.503 3.734 7.142V22l3.433-1.884c.905.251 1.86.388 2.833.388 5.523 0 10-4.145 10-9.246 0-5.113-4.477-9.258-10-9.258zm1.002 12.445l-2.556-2.727-4.99 2.727 5.488-5.824 2.618 2.727 4.928-2.727-5.488 5.824z"/>
              </svg>
              Nhắn tin tư vấn Messenger
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
  }

  const closeBtn = backdrop.querySelector(".scent-modal-close");
  const modalImg = backdrop.querySelector("#scent-modal-img");
  const modalBadge = backdrop.querySelector("#scent-modal-badge");
  const modalGroup = backdrop.querySelector("#scent-modal-group");
  const modalTitle = backdrop.querySelector("#scent-modal-title");
  const modalSubtitle = backdrop.querySelector("#scent-modal-subtitle");
  const modalPrice = backdrop.querySelector("#scent-modal-price");
  const modalVibe = backdrop.querySelector("#scent-modal-vibe");
  const tierTop = backdrop.querySelector("#scent-tier-top");
  const tierHeart = backdrop.querySelector("#scent-tier-heart");
  const tierBase = backdrop.querySelector("#scent-tier-base");
  const qtyVal = backdrop.querySelector("#scent-modal-qty");
  const minusBtn = backdrop.querySelector(".btn-modal-minus");
  const plusBtn = backdrop.querySelector(".btn-modal-plus");
  const addCartBtn = backdrop.querySelector("#btn-modal-add-cart");

  minusBtn.addEventListener("click", () => {
    if (currentModalQty > 1) {
      currentModalQty--;
      qtyVal.textContent = currentModalQty;
    }
  });

  plusBtn.addEventListener("click", () => {
    if (currentModalQty < 20) {
      currentModalQty++;
      qtyVal.textContent = currentModalQty;
    }
  });

  addCartBtn.addEventListener("click", () => {
    if (currentModalScentId) {
      addToCart(currentModalScentId, currentModalQty, true);
      closeScentModal();
    }
  });

  function openScentModal(scentId) {
    const p = PRODUCTS_CONFIG[scentId];
    if (!p) return;

    currentModalScentId = scentId;
    currentModalQty = 1;
    qtyVal.textContent = "1";

    modalBadge.textContent = p.code;
    modalGroup.textContent = "Nhóm hương: " + p.category;
    modalTitle.textContent = p.name;
    modalSubtitle.textContent = p.scentName;
    modalPrice.textContent = p.price;
    modalVibe.textContent = p.vibe;

    tierTop.textContent = p.topNotes;
    tierHeart.textContent = p.heartNotes;
    tierBase.textContent = p.baseNotes;

    const customImg = getCustomImage(scentId);
    modalImg.src = customImg || p.defaultSrc;
    modalImg.alt = `${p.name} - ${p.scentName}`;
    modalImg.onerror = function() {
      this.onerror = null;
      this.src = p.fallbackSrc;
    };

    backdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeScentModal() {
    backdrop.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  closeBtn.addEventListener("click", closeScentModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeScentModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop.classList.contains("is-open")) {
      closeScentModal();
    }
  });

  // Bắt sự kiện click trên card hoặc nút "Tầng hương"
  document.addEventListener("click", (e) => {
    // Bỏ qua nếu click trong thanh upload ảnh, giỏ hàng hoặc modal quản lý ảnh
    if (
      e.target.closest(".product-card-upload-bar") ||
      e.target.closest(".img-manager-fab") ||
      e.target.closest(".scentpod-modal-backdrop") ||
      e.target.closest(".scent-modal-container") ||
      e.target.closest(".cart-drawer") ||
      e.target.closest(".btn-add-cart")
    ) {
      return;
    }

    // 1. Click vào nút "Tầng hương"
    const btn = e.target.closest("[data-open-scent]");
    if (btn) {
      e.preventDefault();
      const scentId = btn.getAttribute("data-open-scent");
      openScentModal(scentId);
      return;
    }

    // 2. Click vào thẻ sản phẩm
    const card = e.target.closest(".product-card[data-scent-id]");
    if (card) {
      // Nếu click vào thẻ <a> hoặc nút đặc biệt khác, bỏ qua
      if (e.target.closest("a") || e.target.closest("button:not(.btn-scent-detail)")) {
        return;
      }
      const scentId = card.getAttribute("data-scent-id");
      openScentModal(scentId);
    }
  });
}

/**
 * ==========================================================================
 * HỆ THỐNG GIỎ HÀNG (SHOPPING CART & SLIDE-OVER DRAWER)
 * ==========================================================================
 */
const CART_STORAGE_KEY = "scentpod_cart";
const COUPON_STORAGE_KEY = "scentpod_coupon";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error(e);
  }
  updateCartUI();
}

function addToCart(productId, quantity = 1, showDrawer = true, selectedSize = "sp02") {
  // Nếu tham số thứ 3 được truyền là chuỗi kích thước (vd: "sp01", "50g")
  if (typeof showDrawer === "string") {
    selectedSize = showDrawer;
    showDrawer = true;
  }

  // 1. Kiểm tra nếu là sản phẩm combo (CB01, CB02, CB03 hoặc aliases)
  const combo = COMBOS_CONFIG[productId];
  if (combo) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === combo.id || item.id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: combo.id,
        code: combo.code,
        name: `[${combo.code}] ${combo.name}`,
        scentName: combo.scentName,
        components: combo.components,
        category: combo.category,
        size: "Combo",
        originalPrice: combo.originalPrice,
        price: combo.priceNumber,
        priceFormatted: combo.price,
        savings: combo.savings,
        shippingPolicy: combo.shippingPolicy,
        gifts: combo.gifts,
        image: combo.defaultSrc,
        fallbackSrc: combo.fallbackSrc,
        quantity: quantity
      });
    }
    saveCart(cart);
    triggerCartBump();
    showToast(`🎁 Đã thêm ${quantity}x [${combo.code}] "${combo.name}" vào giỏ hàng!`);
    if (showDrawer) openCartDrawer();
    return;
  }

  // 2. Sản phẩm lẻ theo mùi (Hỗ trợ SP01 Sáp 50g & SP02 Nến 100g)
  const p = PRODUCTS_CONFIG[productId];
  if (!p) return;

  const sizeInfo = PRODUCT_SIZES_CONFIG[selectedSize] || PRODUCT_SIZES_CONFIG["sp02"];
  const cartItemId = `${productId}-${sizeInfo.size}`;
  const codeBadge = sizeInfo.code ? `[${sizeInfo.code}] ` : "";
  const typeDisplay = sizeInfo.typeName || (sizeInfo.size === "50g" ? "Sáp thơm bỏ túi 50g" : "Nến thơm thư giãn 100g");
  const cartItemName = `${codeBadge}${p.name} - ${typeDisplay}`;
  const itemPrice = sizeInfo.price;
  const customImg = getCustomImage(productId);
  const imgSrc = customImg || p.defaultSrc;

  const cart = getCart();
  const existing = cart.find((item) => item.id === cartItemId || (item.id === productId && (!item.size || item.size === sizeInfo.size)));

  if (existing) {
    existing.quantity += quantity;
    existing.id = cartItemId;
    existing.size = sizeInfo.size;
  } else {
    cart.push({
      id: cartItemId,
      productId: productId,
      code: sizeInfo.code || "SP",
      name: cartItemName,
      baseName: p.name,
      scentName: p.scentName,
      category: p.category,
      size: sizeInfo.size,
      spec: sizeInfo.spec || sizeInfo.size,
      originalPrice: sizeInfo.listPrice,
      price: itemPrice,
      priceFormatted: sizeInfo.priceFormatted,
      giftNote: sizeInfo.giftNote,
      image: imgSrc,
      fallbackSrc: p.fallbackSrc,
      quantity: quantity
    });
  }

  saveCart(cart);
  triggerCartBump();
  showToast(`✅ Đã thêm ${quantity}x "${cartItemName}" vào giỏ hàng!`);

  if (showDrawer) {
    openCartDrawer();
  }
}

function triggerCartBump() {
  const badge = document.getElementById("header-cart-badge");
  if (badge) {
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
  }
}

function updateCartQuantity(productId, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter((i) => i.id !== productId);
  saveCart(cart);
  showToast("Đã xóa sản phẩm khỏi giỏ hàng.");
}

function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(COUPON_STORAGE_KEY);
  updateCartUI();
}

function getActiveCoupon() {
  try {
    return JSON.parse(localStorage.getItem(COUPON_STORAGE_KEY)) || null;
  } catch (e) {
    return null;
  }
}

function applyCoupon(code) {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) return false;

  if (cleanCode === "SINHVIEN") {
    const coupon = { code: "SINHVIEN", discount: 15000, label: "Ưu đãi sinh viên (-15.000đ)" };
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    showToast("🎉 Đã áp dụng mã SINHVIEN: Giảm ngay 15.000đ!");
    updateCartUI();
    return true;
  }
  if (cleanCode === "SCENTPOD10") {
    const coupon = { code: "SCENTPOD10", discount: 10000, label: "Mã tri ân (-10.000đ)" };
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    showToast("🎉 Đã áp dụng mã SCENTPOD10: Giảm 10.000đ!");
    updateCartUI();
    return true;
  }
  if (cleanCode === "FREESHIP") {
    const coupon = { code: "FREESHIP", discount: 25000, label: "Miễn phí vận chuyển (-25.000đ)" };
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    showToast("🎉 Đã áp dụng mã FREESHIP!");
    updateCartUI();
    return true;
  }

  showToast("⚠️ Mã không hợp lệ. Gợi ý: SINHVIEN hoặc SCENTPOD10");
  return false;
}

function getCartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Kiểm tra giỏ hàng có chứa sản phẩm combo nào không (để áp dụng chính sách: Đồng giá ship 15k)
  const hasCombo = cart.some(item => 
    (item.id && (item.id.startsWith("cb") || item.id.startsWith("combo"))) ||
    item.size === "Combo" ||
    COMBOS_CONFIG[item.id] ||
    (item.productId && COMBOS_CONFIG[item.productId])
  );

  // Đạt freeship khi:
  // 1. Tổng tiền hàng >= 150.000đ (cho mọi đơn hàng kể cả combo)
  // 2. Hoặc đối với đơn lẻ không combo: mua từ 2 sản phẩm trở lên
  const isFreeShip = subtotal >= 150000 || (!hasCombo && totalQty >= 2);
  
  // Phí ship: Nếu đơn có Combo: Đồng giá ship 15.000đ; Đơn lẻ bình thường: 25.000đ; Đạt freeship: 0đ
  const baseShippingRate = hasCombo ? 15000 : 25000;
  let shipping = cart.length === 0 ? 0 : (isFreeShip ? 0 : baseShippingRate);

  const coupon = getActiveCoupon();
  let discount = 0;
  if (coupon && cart.length > 0) {
    if (coupon.code === "FREESHIP") {
      discount = shipping;
      shipping = 0;
    } else {
      discount = Math.min(coupon.discount, subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal + shipping - discount);

  return {
    subtotal,
    totalQty,
    shipping,
    discount,
    coupon,
    finalTotal,
    hasCombo,
    isFreeShip,
    isFreeShipByQty: isFreeShip
  };
}

function formatVND(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

/**
 * Khởi tạo giao diện Giỏ hàng (Drawer & Events)
 */
function initCartSystem() {
  ensureCartDrawerInDOM();
  updateCartUI();

  // Bắt sự kiện click [data-add-to-cart]
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-to-cart]");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const pid = btn.getAttribute("data-add-to-cart");
      const card = btn.closest(".product-card, .product-item, [data-scent-id]");
      let selectedSize = "sp02";
      if (card) {
        selectedSize = card.getAttribute("data-selected-size") || "sp02";
      }
      addToCart(pid, 1, true, selectedSize);
    }

    // Bắt sự kiện chọn kích thước size-pill-btn
    const sizeBtn = e.target.closest(".size-pill-btn");
    if (sizeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const card = sizeBtn.closest(".product-card, .product-item, [data-scent-id]");
      if (card) {
        const size = sizeBtn.getAttribute("data-size");
        const priceText = sizeBtn.getAttribute("data-price-text");
        const originalPriceText = sizeBtn.getAttribute("data-original-price-text");
        const inboxText = sizeBtn.getAttribute("data-inbox-text");
        const giftText = sizeBtn.getAttribute("data-gift-text");
        
        card.setAttribute("data-selected-size", size);

        card.querySelectorAll(".size-pill-btn").forEach((b) => b.classList.remove("is-active"));
        sizeBtn.classList.add("is-active");

        const priceEl = card.querySelector(".product-price");
        if (priceEl && priceText) {
          if (originalPriceText) {
            priceEl.innerHTML = `${priceText} <small class="price-original-striked">${originalPriceText}</small>`;
          } else {
            priceEl.textContent = priceText;
          }
        }

        const inboxEl = card.querySelector(".product-inbox-hint");
        if (inboxEl && inboxText) {
          inboxEl.innerHTML = `💬 Giá chốt Inbox: <strong>${inboxText}</strong> (nhắn Fanpage)`;
        }

        const giftEl = card.querySelector(".product-gift-banner");
        if (giftEl && giftText) {
          giftEl.innerHTML = `<span class="tag-icon">🎁</span>${giftText}`;
        }
      }
    }
  });
}

function ensureCartDrawerInDOM() {
  if (document.getElementById("scent-cart-drawer-backdrop")) return;

  const drawerBackdrop = document.createElement("div");
  drawerBackdrop.className = "cart-drawer-backdrop";
  drawerBackdrop.id = "scent-cart-drawer-backdrop";
  drawerBackdrop.innerHTML = `
    <aside class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <div class="cart-header">
        <h3 class="cart-title" id="cart-drawer-title">
          <span>🕯️ Giỏ Hàng</span>
          <span class="cart-count-badge" id="drawer-items-count" style="font-size: 0.82rem; color: var(--accent-gold); font-weight: 600;">(0 món)</span>
        </h3>
        <button type="button" class="cart-close-btn" id="btn-close-cart" aria-label="Đóng giỏ hàng">&times;</button>
      </div>

      <!-- Thanh tiến trình Freeship -->
      <div class="cart-free-shipping-bar" id="cart-freeship-bar">
        <div class="free-shipping-text">
          <span id="freeship-text-label">Mua từ 2 hũ: FREESHIP toàn quốc 🚚</span>
          <span id="freeship-percent-label">0%</span>
        </div>
        <div class="free-shipping-progress">
          <div class="free-shipping-fill" id="freeship-fill" style="width: 0%;"></div>
        </div>
      </div>

      <!-- Danh sách sản phẩm -->
      <div class="cart-body">
        <div class="cart-items-list" id="cart-items-container"></div>
        <div class="cart-empty-state" id="cart-empty-state" style="display: none;">
          <span class="cart-empty-icon">🕯️</span>
          <h3>Giỏ hàng của bạn đang trống</h3>
          <p>Hãy chọn những nốt hương thư thái đồng hành cùng bạn hôm nay!</p>
          <a href="san-pham.html" class="btn btn-outline" style="padding: 8px 18px; font-size: 0.88rem;">Khám phá sản phẩm</a>
        </div>

        <!-- Ô mã giảm giá -->
        <div class="cart-coupon-box" id="cart-coupon-section" style="display: none;">
          <input type="text" class="cart-coupon-input" id="cart-coupon-input" placeholder="MÃ GIẢM GIÁ (VD: SINHVIEN)">
          <button type="button" class="cart-coupon-btn" id="btn-apply-coupon">Áp dụng</button>
        </div>
      </div>

      <!-- Tóm tắt & Nút thanh toán -->
      <div class="cart-footer" id="cart-footer">
        <div class="cart-summary-line">
          <span>Tạm tính</span>
          <span id="cart-subtotal-val">0đ</span>
        </div>
        <div class="cart-summary-line" id="cart-discount-row" style="display: none; color: #4ade80;">
          <span id="cart-discount-label">Giảm giá voucher</span>
          <span id="cart-discount-val">-0đ</span>
        </div>
        <div class="cart-summary-line">
          <span>Phí vận chuyển</span>
          <span id="cart-shipping-val">Miễn phí</span>
        </div>
        <div class="cart-total-line">
          <span>Tổng thanh toán</span>
          <span id="cart-total-val" style="color: var(--accent-gold);">0đ</span>
        </div>
        <a href="thanh-toan.html" class="btn btn-primary cart-checkout-btn" id="btn-go-checkout">
          <span>Tiến Hành Thanh Toán</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </aside>
  `;
  document.body.appendChild(drawerBackdrop);

  // Sự kiện đóng
  drawerBackdrop.querySelector("#btn-close-cart").addEventListener("click", closeCartDrawer);
  drawerBackdrop.addEventListener("click", (e) => {
    if (e.target === drawerBackdrop) closeCartDrawer();
  });

  // Sự kiện áp dụng coupon
  drawerBackdrop.querySelector("#btn-apply-coupon").addEventListener("click", () => {
    const input = drawerBackdrop.querySelector("#cart-coupon-input");
    applyCoupon(input.value);
  });
}

function openCartDrawer() {
  ensureCartDrawerInDOM();
  updateCartUI();
  const drawer = document.getElementById("scent-cart-drawer-backdrop");
  if (drawer) {
    drawer.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById("scent-cart-drawer-backdrop");
  if (drawer) {
    drawer.classList.remove("is-open");
    document.body.style.overflow = "";
  }
}

function updateCartUI() {
  const cart = getCart();
  const totals = getCartTotals();

  // 1. Cập nhật Badge trên Header
  const badges = document.querySelectorAll(".cart-badge, #header-cart-badge");
  badges.forEach((b) => {
    b.textContent = totals.totalQty;
    b.style.display = totals.totalQty > 0 ? "flex" : "none";
  });

  // 2. Cập nhật trong Drawer
  const itemsContainer = document.getElementById("cart-items-container");
  const emptyState = document.getElementById("cart-empty-state");
  const couponSection = document.getElementById("cart-coupon-section");
  const cartFooter = document.getElementById("cart-footer");
  const countBadge = document.getElementById("drawer-items-count");
  const fillBar = document.getElementById("freeship-fill");
  const freeshipLabel = document.getElementById("freeship-text-label");
  const freeshipPercent = document.getElementById("freeship-percent-label");

  if (!itemsContainer) return;

  if (countBadge) countBadge.textContent = `(${totals.totalQty} món)`;

  // Thanh tiến trình freeship
  if (fillBar && freeshipLabel && freeshipPercent) {
    if (totals.shipping === 0 && totals.totalQty > 0) {
      fillBar.style.width = "100%";
      freeshipPercent.textContent = "100%";
      freeshipLabel.textContent = "🎉 Bạn đã được MIỄN PHÍ VẬN CHUYỂN toàn quốc!";
    } else if (totals.hasCombo) {
      fillBar.style.width = "75%";
      freeshipPercent.textContent = "75%";
      freeshipLabel.textContent = "⚡ Ưu đãi Combo: Đồng giá ship 15k! (Đơn từ 150k Freeship) 🚚";
    } else if (totals.totalQty === 1) {
      fillBar.style.width = "50%";
      freeshipPercent.textContent = "50%";
      freeshipLabel.textContent = "Thêm 1 sản phẩm nữa để được FREESHIP toàn quốc 🚚";
    } else {
      fillBar.style.width = "0%";
      freeshipPercent.textContent = "0%";
      freeshipLabel.textContent = "Mua từ 2 hũ hoặc Combo: Hỗ trợ phí ship 🚚";
    }
  }

  if (cart.length === 0) {
    itemsContainer.innerHTML = "";
    emptyState.style.display = "block";
    if (couponSection) couponSection.style.display = "none";
    if (cartFooter) cartFooter.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  if (couponSection) couponSection.style.display = "flex";
  if (cartFooter) cartFooter.style.display = "block";

  itemsContainer.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item" data-cart-item-id="${item.id}">
      <div class="cart-item-thumb">
        <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.src='${item.fallbackSrc}';">
      </div>
      <div class="cart-item-info">
        <h4 class="cart-item-name">${item.name}</h4>
        <div class="cart-item-scent">${item.scentName}</div>
        ${item.gifts ? `<div class="cart-item-perk">🎁 ${item.gifts}</div>` : (item.giftNote ? `<div class="cart-item-perk">🎁 ${item.giftNote}</div>` : '')}
        <div class="cart-item-price">${formatVND(item.price)}</div>
        <div class="cart-item-ctrl">
          <button type="button" class="cart-qty-btn btn-cart-dec" data-id="${item.id}" aria-label="Giảm">&minus;</button>
          <span class="cart-qty-num">${item.quantity}</span>
          <button type="button" class="cart-qty-btn btn-cart-inc" data-id="${item.id}" aria-label="Tăng">+</button>
          <button type="button" class="cart-item-remove btn-cart-del" data-id="${item.id}">Xóa</button>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // Bắt sự kiện trên các nút giỏ hàng
  itemsContainer.querySelectorAll(".btn-cart-dec").forEach((b) => {
    b.addEventListener("click", () => updateCartQuantity(b.getAttribute("data-id"), -1));
  });
  itemsContainer.querySelectorAll(".btn-cart-inc").forEach((b) => {
    b.addEventListener("click", () => updateCartQuantity(b.getAttribute("data-id"), 1));
  });
  itemsContainer.querySelectorAll(".btn-cart-del").forEach((b) => {
    b.addEventListener("click", () => removeFromCart(b.getAttribute("data-id")));
  });

  // Tóm tắt tài chính
  document.getElementById("cart-subtotal-val").textContent = formatVND(totals.subtotal);
  const shipText = totals.shipping === 0 
    ? "Miễn phí (Freeship)" 
    : (totals.hasCombo ? `${formatVND(totals.shipping)} (Đồng giá Combo)` : formatVND(totals.shipping));
  document.getElementById("cart-shipping-val").textContent = shipText;

  const discountRow = document.getElementById("cart-discount-row");
  if (totals.discount > 0) {
    discountRow.style.display = "flex";
    document.getElementById("cart-discount-val").textContent = "-" + formatVND(totals.discount);
    if (totals.coupon) {
      document.getElementById("cart-discount-label").textContent = `Voucher (${totals.coupon.code})`;
    }
  } else {
    discountRow.style.display = "none";
  }

  document.getElementById("cart-total-val").textContent = formatVND(totals.finalTotal);
}

/**
 * ==========================================================================
 * HỆ THỐNG XÁC THỰC & PHÂN QUYỀN (AUTH & USER/ADMIN ROLES)
 * ==========================================================================
 */
const USER_STORAGE_KEY = "scentpod_user";
const ORDERS_STORAGE_KEY = "scentpod_orders";
const INVENTORY_STORAGE_KEY = "scentpod_inventory";

/**
 * DANH SÁCH 4 GMAIL QUẢN TRỊ VIÊN ĐƯỢC ỦY QUYỀN DUY NHẤT:
 * 1. hoaip3061@gmail.com
 * 2. khonghieu924@gmail.com
 * 3. tranlam6a@gmail.com
 * 4. datnhatquang@gmail.com
 */
const ADMIN_EMAILS_CONFIG = {
  "datnhatquang@gmail.com": {
    email: "datnhatquang@gmail.com",
    name: "Nghiêm Thành Đạt",
    roleTitle: "Trưởng Nhóm & Admin",
    phone: "0912 998 888",
    avatar: "👑"
  },
  "khonghieu924@gmail.com": {
    email: "khonghieu924@gmail.com",
    name: "Khổng Đức Hiếu",
    roleTitle: "R&D Pha Chế Mùi & Admin",
    phone: "0987 654 321",
    avatar: "🌿"
  },
  "tranlam6a@gmail.com": {
    email: "tranlam6a@gmail.com",
    name: "Trần Thanh Lâm",
    roleTitle: "Quản Lý Vận Hành & Admin",
    phone: "0934 567 890",
    avatar: "📦"
  },
  "hoaip3061@gmail.com": {
    email: "hoaip3061@gmail.com",
    name: "Trương Quỳnh Anh",
    roleTitle: "Truyền Thông & Admin",
    phone: "0978 112 233",
    avatar: "✨"
  }
};

const AUTHORIZED_ADMIN_EMAILS = Object.keys(ADMIN_EMAILS_CONFIG);

function isAdminEmail(email) {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || null;
  } catch (e) {
    return null;
  }
}

function loginUser(email, password, roleHint = "customer") {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();

  // 1. Nếu là 1 trong 4 Gmail của Admin: Luôn tự động chuyển thành tài khoản Quản trị viên
  if (isAdminEmail(cleanEmail)) {
    const adminInfo = ADMIN_EMAILS_CONFIG[cleanEmail];
    const adminUser = {
      role: "admin",
      name: adminInfo.name,
      email: cleanEmail,
      title: adminInfo.roleTitle,
      phone: adminInfo.phone,
      avatar: adminInfo.avatar
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
    updateHeaderAuthSlot();
    showToast(`👑 Đăng nhập Quản Trị Viên thành công: ${adminUser.name}!`);
    return { success: true, user: adminUser };
  }

  // 2. Nếu đăng nhập ở cổng Quản Trị Viên mà KHÔNG PHẢI 1 trong 4 email trên
  if (roleHint === "admin") {
    showToast("⚠️ Tài khoản quản trị viên chỉ được tạo và đăng nhập bằng 4 Gmail được ủy quyền!", 4000);
    return { success: false, error: "unauthorized_admin" };
  }

  // 3. Khách hàng thông thường
  const isDemoCustomer = cleanEmail === "khachhang@scentpod.vn" || !cleanEmail;
  const customerUser = {
    role: "customer",
    name: isDemoCustomer ? "Nguyễn Minh Thư" : (cleanEmail.split("@")[0] || "Khách Hàng"),
    email: cleanEmail || "khachhang@scentpod.vn",
    phone: "0912 345 678",
    avatar: "👤",
    tier: "Hạng Bạc (Sinh Viên)",
    points: 250
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(customerUser));
  updateHeaderAuthSlot();
  showToast(`✨ Chào mừng bạn, ${customerUser.name}!`);
  return { success: true, user: customerUser };
}

function registerUser(name, email, phone, password) {
  const cleanEmail = (email || "").trim().toLowerCase();

  // Nếu đăng ký bằng 1 trong 4 Gmail của Admin: Tự động chuyển thành tài khoản Quản trị viên
  if (isAdminEmail(cleanEmail)) {
    const adminInfo = ADMIN_EMAILS_CONFIG[cleanEmail];
    const adminUser = {
      role: "admin",
      name: (name || "").trim() || adminInfo.name,
      email: cleanEmail,
      title: adminInfo.roleTitle,
      phone: (phone || "").trim() || adminInfo.phone,
      avatar: adminInfo.avatar
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
    updateHeaderAuthSlot();
    showToast(`👑 Đăng ký thành công! Gmail này đã được tự động kích hoạt quyền Quản Trị Viên.`);
    return { success: true, user: adminUser };
  }

  // Khách hàng thông thường
  const newUser = {
    role: "customer",
    name: (name || "").trim() || "Khách Hàng Mới",
    email: cleanEmail,
    phone: (phone || "").trim(),
    avatar: "👤",
    tier: "Thành Viên Mới",
    points: 100
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
  updateHeaderAuthSlot();
  showToast(`🎉 Đăng ký tài khoản thành công! Tặng bạn 100 điểm ScentClub.`);
  return { success: true, user: newUser };
}

function logoutUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
  updateHeaderAuthSlot();
  showToast("Đã đăng xuất tài khoản.");
  if (window.location.pathname.includes("dang-nhap.html")) {
    window.location.reload();
  }
}

/**
 * ==========================================================================
 * HỆ THỐNG QUẢN LÝ KHO & TỒN KHO (INVENTORY & STOCK MANAGEMENT)
 * ==========================================================================
 */
const DEFAULT_INVENTORY = {
  "first-class": {
    id: "first-class",
    code: "Mùi 01",
    name: "First Class",
    scentName: "White Tea & Morning Dew",
    stock: 45,
    minThreshold: 10,
    price: 85000,
    location: "Kệ A1 - Khu nến trà"
  },
  "blind-date": {
    id: "blind-date",
    code: "Mùi 02",
    name: "Blind Date",
    scentName: "Sweet Peach & Vanilla Cloud",
    stock: 38,
    minThreshold: 10,
    price: 85000,
    location: "Kệ A2 - Khu nến hoa quả"
  },
  "campus-breeze": {
    id: "campus-breeze",
    code: "Mùi 03",
    name: "Campus Breeze",
    scentName: "Sea Salt & Sage",
    stock: 52,
    minThreshold: 10,
    price: 85000,
    location: "Kệ B1 - Khu hương biển"
  },
  "late-night": {
    id: "late-night",
    code: "Mùi 04",
    name: "Late Night",
    scentName: "Cedarwood & Warm Amber",
    stock: 26,
    minThreshold: 10,
    price: 85000,
    location: "Kệ B2 - Khu hương gỗ ấm"
  }
};

function getInventory() {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
        return Object.assign({}, DEFAULT_INVENTORY, parsed);
      }
    }
  } catch (e) {}
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(DEFAULT_INVENTORY));
  return Object.assign({}, DEFAULT_INVENTORY);
}

function saveInventory(inv) {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inv));
  } catch (e) {
    console.error(e);
  }
}

function updateProductStock(productId, newStock) {
  const inv = getInventory();
  if (inv[productId]) {
    const qty = Math.max(0, parseInt(newStock, 10) || 0);
    inv[productId].stock = qty;
    saveInventory(inv);
    showToast(`📦 Đã cập nhật kho [${inv[productId].name}]: ${qty} hũ.`);
    return true;
  }
  return false;
}

function adjustProductStock(productId, delta) {
  const inv = getInventory();
  if (inv[productId]) {
    const current = inv[productId].stock || 0;
    const updated = Math.max(0, current + delta);
    inv[productId].stock = updated;
    saveInventory(inv);
    showToast(`📦 [${inv[productId].name}] ${delta >= 0 ? '+' + delta : delta} hũ (Còn: ${updated} hũ).`);
    return true;
  }
  return false;
}

/**
 * ==========================================================================
 * BÁO CÁO & THEO DÕI SỐ LƯỢNG ĐƠN TỪNG SẢN PHẨM (PRODUCT ORDER ANALYTICS)
 * ==========================================================================
 */
function getProductOrderStats() {
  const orders = getOrders();
  const inv = getInventory();

  const statsMap = {
    "first-class": {
      id: "first-class",
      code: "Mùi 01",
      name: "First Class",
      scentName: "White Tea & Morning Dew",
      price: 85000,
      orderCount: 0,
      totalQtySold: 0,
      revenue: 0,
      stock: inv["first-class"]?.stock || 0,
      location: inv["first-class"]?.location || "Kệ A1"
    },
    "blind-date": {
      id: "blind-date",
      code: "Mùi 02",
      name: "Blind Date",
      scentName: "Sweet Peach & Vanilla Cloud",
      price: 85000,
      orderCount: 0,
      totalQtySold: 0,
      revenue: 0,
      stock: inv["blind-date"]?.stock || 0,
      location: inv["blind-date"]?.location || "Kệ A2"
    },
    "campus-breeze": {
      id: "campus-breeze",
      code: "Mùi 03",
      name: "Campus Breeze",
      scentName: "Sea Salt & Sage",
      price: 85000,
      orderCount: 0,
      totalQtySold: 0,
      revenue: 0,
      stock: inv["campus-breeze"]?.stock || 0,
      location: inv["campus-breeze"]?.location || "Kệ B1"
    },
    "late-night": {
      id: "late-night",
      code: "Mùi 04",
      name: "Late Night",
      scentName: "Cedarwood & Warm Amber",
      price: 85000,
      orderCount: 0,
      totalQtySold: 0,
      revenue: 0,
      stock: inv["late-night"]?.stock || 0,
      location: inv["late-night"]?.location || "Kệ B2"
    }
  };

  orders.forEach(order => {
    if (order.status === "Đã hủy") return; // Bỏ qua đơn đã hủy
    const productsInThisOrder = new Set();

    (order.items || []).forEach(item => {
      const pId = item.productId || (item.id ? item.id.split('-')[0] : '');
      const key = statsMap[item.id] ? item.id : (statsMap[pId] ? pId : null);
      if (key) {
        const qty = item.quantity || 1;
        const price = item.price || 85000;
        statsMap[key].totalQtySold += qty;
        statsMap[key].revenue += (qty * price);
        productsInThisOrder.add(key);
      }
    });

    productsInThisOrder.forEach(key => {
      statsMap[key].orderCount += 1;
    });
  });

  const list = Object.values(statsMap);
  list.sort((a, b) => b.totalQtySold - a.totalQtySold);
  return list;
}

/**
 * Quản lý Đơn Hàng (Orders Storage)
 */
function getOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY));
    if (orders && Array.isArray(orders) && orders.length > 0) return orders;
  } catch (e) {}

  // Đơn hàng mẫu ban đầu để giao diện Admin & User trực quan ngay từ đầu
  const initialOrders = [
    {
      id: "SCP-9042",
      date: "29/09/2026 16:30",
      customer: {
        name: "Nguyễn Minh Thư",
        phone: "0912 345 678",
        email: "khachhang@scentpod.vn",
        address: "Ký túc xá Khu B, ĐHQG TP.HCM",
        note: "Giao vào buổi chiều giúp mình nhé",
        giftCard: "Chúc bạn học bài thật tốt và luôn thư thái cùng ScentPod!"
      },
      items: [
        { id: "late-night", name: "Late Night", quantity: 1, price: 89000 },
        { id: "first-class", name: "First Class", quantity: 1, price: 89000 }
      ],
      paymentMethod: "VietQR (Đã chuyển khoản)",
      subtotal: 178000,
      shipping: 0,
      discount: 15000,
      total: 163000,
      status: "Đang giao hàng"
    },
    {
      id: "SCP-8921",
      date: "28/09/2026 10:15",
      customer: {
        name: "Trần Hoàng Nam",
        phone: "0908 123 456",
        email: "nam.tran@gmail.com",
        address: "227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM",
        note: "Gói quà cẩn thận giúp mình nhé",
        giftCard: "Món quà nhỏ tặng sinh nhật người thương."
      },
      items: [
        { id: "blind-date", name: "Blind Date", quantity: 2, price: 89000 }
      ],
      paymentMethod: "COD (Thanh toán khi nhận)",
      subtotal: 178000,
      shipping: 0,
      discount: 0,
      total: 178000,
      status: "Hoàn thành"
    },
    {
      id: "SCP-8756",
      date: "27/09/2026 14:20",
      customer: {
        name: "Lê Thu Uyên",
        phone: "0982 771 882",
        email: "uyen.le@gmail.com",
        address: "Tòa A3 KTX Mễ Trì, Thanh Xuân, Hà Nội",
        note: "Gọi trước khi ship",
        giftCard: ""
      },
      items: [
        { id: "campus-breeze", name: "Campus Breeze", quantity: 2, price: 89000 },
        { id: "first-class", name: "First Class", quantity: 1, price: 89000 }
      ],
      paymentMethod: "VietQR (Đã chuyển khoản)",
      subtotal: 267000,
      shipping: 0,
      discount: 15000,
      total: 252000,
      status: "Đang đóng gói"
    }
  ];
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initialOrders));
  return initialOrders;
}

function saveOrders(orders) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error(e);
  }
}

function addOrder(orderData) {
  const orders = getOrders();
  orders.unshift(orderData);
  saveOrders(orders);

  // Tự động trừ tồn kho theo từng sản phẩm
  const inv = getInventory();
  if (orderData.items && Array.isArray(orderData.items)) {
    orderData.items.forEach(item => {
      const pId = item.id;
      if (inv[pId]) {
        inv[pId].stock = Math.max(0, (inv[pId].stock || 0) - (item.quantity || 1));
      }
    });
    saveInventory(inv);
  }

  return orderData;
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const target = orders.find((o) => o.id === orderId);
  if (target) {
    target.status = newStatus;
    saveOrders(orders);
    showToast(`✅ Đơn hàng ${orderId} đã đổi trạng thái thành: "${newStatus}"!`);
    return true;
  }
  return false;
}

/**
 * Khởi tạo và đồng bộ thanh điều hướng Header theo thứ tự chuẩn:
 * 1. Tên Thương hiệu - 2. Trang chủ - 3. Sản phẩm - 4. Combo - 5. Về chúng tôi - 6. Giỏ hàng - 7. Tài khoản
 */
function initHeaderAuth() {
  const headerContainer = document.querySelector(".header-container, .nav-container");
  if (headerContainer) {
    // 1. Xóa bỏ thẻ auth ở góc trái cũ (nếu có) để Tên Thương hiệu luôn đứng đầu tiên
    const oldLeftSlot = headerContainer.querySelector(".header-auth-left, #header-auth-left-slot");
    if (oldLeftSlot) {
      oldLeftSlot.remove();
    }

    // 2. Đảm bảo khu vực nav-actions ở bên phải header
    let navActions = headerContainer.querySelector(".nav-actions");
    if (!navActions) {
      navActions = document.createElement("div");
      navActions.className = "nav-actions";
      const toggleBtn = headerContainer.querySelector(".menu-toggle");
      if (toggleBtn) {
        headerContainer.insertBefore(navActions, toggleBtn);
      } else {
        headerContainer.appendChild(navActions);
      }
    }

    // 3. Đảm bảo nút 6: Giỏ hàng đứng trước trong nav-actions
    let cartBtn = navActions.querySelector("#open-cart-btn, .nav-cart-btn");
    if (!cartBtn) {
      cartBtn = document.createElement("button");
      cartBtn.type = "button";
      cartBtn.className = "nav-cart-btn";
      cartBtn.id = "open-cart-btn";
      cartBtn.setAttribute("aria-label", "Xem giỏ hàng");
      cartBtn.setAttribute("title", "Giỏ hàng");
      cartBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span class="nav-cart-label">Giỏ hàng</span>
        <span class="cart-badge" id="header-cart-badge">0</span>
      `;
      navActions.insertBefore(cartBtn, navActions.firstChild);
    }
    cartBtn.onclick = openCartDrawer;

    // 4. Đảm bảo nút 7: Tài khoản đứng sau nút Giỏ hàng
    let authSlot = navActions.querySelector("#header-auth-slot, .header-auth-slot");
    if (!authSlot) {
      authSlot = document.createElement("div");
      authSlot.className = "header-auth-slot";
      authSlot.id = "header-auth-slot";
      navActions.appendChild(authSlot);
    } else {
      navActions.appendChild(authSlot); // Di chuyển ra sau cùng của nav-actions
    }
  }

  // 5. Đồng bộ danh sách menu: Trang chủ -> Sản phẩm -> Combo -> Về chúng tôi
  const navMenu = document.querySelector(".nav-menu");
  if (navMenu) {
    // Xóa thẻ tài khoản cũ trong menu nếu có
    const authItem = navMenu.querySelector(".nav-auth-item");
    if (authItem) authItem.remove();

    // Đảm bảo thẻ Combo có mặt sau Sản phẩm và trước Về chúng tôi
    const links = Array.from(navMenu.querySelectorAll("a"));
    const hasCombo = links.some(a => a.textContent.trim().toLowerCase() === "combo");
    if (!hasCombo) {
      const comboLi = document.createElement("li");
      comboLi.innerHTML = `<a href="san-pham.html#combo" class="nav-link">Combo</a>`;
      const spLink = links.find(a => a.getAttribute("href")?.includes("san-pham"));
      if (spLink && spLink.parentElement) {
        navMenu.insertBefore(comboLi, spLink.parentElement.nextSibling);
      } else {
        navMenu.appendChild(comboLi);
      }
    }
  }

  updateHeaderAuthSlot();
}

function updateHeaderAuthSlot() {
  const authSlot = document.getElementById("header-auth-slot") || document.querySelector(".header-auth-slot");
  if (!authSlot) return;

  const user = getCurrentUser();
  if (user) {
    if (user.role === "admin") {
      authSlot.innerHTML = `
        <a href="dang-nhap.html" class="header-auth-btn is-admin" id="header-auth-btn" title="Vào Bảng Quản Trị Hệ Thống">
          <span class="auth-btn-icon">👑</span>
          <span class="auth-btn-text">Tài khoản</span>
        </a>
      `;
    } else {
      authSlot.innerHTML = `
        <a href="dang-nhap.html" class="header-auth-btn is-logged-in" id="header-auth-btn" title="Vào Trang Quản Lý Tài Khoản">
          <span class="auth-btn-icon">👤</span>
          <span class="auth-btn-text">Tài khoản</span>
        </a>
      `;
    }
  } else {
    authSlot.innerHTML = `
      <a href="dang-nhap.html" class="header-auth-btn is-logged-out" id="header-auth-btn" title="Đăng nhập / Quản lý tài khoản">
        <span class="auth-btn-icon">👤</span>
        <span class="auth-btn-text">Tài khoản</span>
      </a>
    `;
  }
}

// Xuất các hàm ra phạm vi toàn cục để trang checkout và trang login sử dụng
window.ScentPod = {
  getCart,
  saveCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  getCartTotals,
  openCartDrawer,
  closeCartDrawer,
  applyCoupon,
  formatVND,
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  getOrders,
  addOrder,
  updateOrderStatus,
  getInventory,
  saveInventory,
  updateProductStock,
  adjustProductStock,
  getProductOrderStats,
  isAdminEmail,
  ADMIN_EMAILS_CONFIG,
  AUTHORIZED_ADMIN_EMAILS,
  PRODUCT_SIZES_CONFIG,
  COMBOS_CONFIG
};



