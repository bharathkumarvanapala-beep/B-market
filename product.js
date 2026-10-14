// ========================================================
// B MARKET - DYNAMIC PRODUCTS CATALOG ENGINE
// Fetches real-time products from Backend API (/api/products)
// Supports B Market Farm Fresh + Amazon & Flipkart Auxiliary Deals
// ========================================================

function getBackendUrl(path) {
    if (typeof window !== "undefined" && typeof window.getBMarketApiUrl === "function") {
        return window.getBMarketApiUrl(path);
    }
    const loc = typeof window !== "undefined" ? window.location : null;
    let host = (loc && loc.hostname) ? loc.hostname.trim() : "";
    if (!host || host === "0.0.0.0") host = "localhost";
    const protocol = (loc && loc.protocol === "https:") ? "https:" : "http:";
    const cleanPath = path ? (path.startsWith("/") ? path : "/" + path) : "";
    return `${protocol}//${host}:5000${cleanPath}`;
}

const BACKEND_API_URL = getBackendUrl("/api/products");

const CATEGORY_DISPLAY_NAMES = {
    all: "All Categories",
    fruits: "Fresh Fruits",
    vegetables: "Fresh Vegetables",
    grains: "Grains & Millets",
    spices: "Spices & Condiments",
    coffee: "Fresh Coffee & Brews",
    tamarind: "Organic Tamarind & Essentials"
};

// Global State
let allProducts = [];
let currentCategory = "all";
let currentSource = "all"; // 'all' | 'bmarket' | 'amazon' | 'flipkart'
let currentSearch = "";
let currentSort = "featured"; // 'featured' | 'price-asc' | 'price-desc' | 'rating'
let isLoading = true;

// Embedded Fallback in case Backend is temporarily starting up
const EMBEDDED_FALLBACK_PRODUCTS = [
    {
        name: "Fresh Seasonal Fruits Basket",
        category: "fruits",
        source: "bmarket",
        price: 120,
        originalPrice: 150,
        unit: "kg",
        rating: 4.8,
        reviews: 142,
        badge: "🌿 Farm Fresh",
        image: "image/fruit.jpg",
        description: "Naturally ripened, crisp and juicy handpicked farm fruits direct from local growers.",
        affiliateUrl: "product-details.html?product=fruit"
    },
    {
        name: "Fresh Green Vegetables Combo",
        category: "vegetables",
        source: "bmarket",
        price: 60,
        originalPrice: 80,
        unit: "pack",
        rating: 4.8,
        reviews: 165,
        badge: "🌿 100% Organic",
        image: "image/vfrt.webp",
        description: "Crisp and fresh leafy green vegetables plucked every morning from local farms.",
        affiliateUrl: "product-details.html?product=vegetables"
    },
    {
        name: "Premium Sona Masoori Rice",
        category: "grains",
        source: "bmarket",
        price: 70,
        originalPrice: 85,
        unit: "kg",
        rating: 4.9,
        reviews: 210,
        badge: "🌿 Best Seller",
        image: "image/image.b.webp",
        description: "Aromatic, lightweight, aged Sona Masoori raw rice of supreme cooking quality.",
        affiliateUrl: "product-details.html?product=grains"
    },
    {
        name: "Paderu Pure Black Pepper",
        category: "spices",
        source: "bmarket",
        price: 150,
        originalPrice: 180,
        unit: "100g",
        rating: 4.9,
        reviews: 188,
        badge: "🌿 GI Tag Origin",
        image: "image/image.f.webp",
        description: "Bold, intense black peppercorns grown in tribal hill forest plantations.",
        affiliateUrl: "product-details.html?product=pepper"
    },
    {
        name: "Araku Valley Fresh Filter Coffee Beans",
        category: "coffee",
        source: "bmarket",
        price: 250,
        originalPrice: 300,
        unit: "250g",
        rating: 4.9,
        reviews: 172,
        badge: "🌿 Araku Valley",
        image: "image/image.e.webp",
        description: "Shade-grown single origin Arabica coffee beans roasted fresh to aromatic perfection.",
        affiliateUrl: "product-details.html?product=coffee"
    },
    {
        name: "Hill-Grown Organic Tamarind",
        category: "tamarind",
        source: "bmarket",
        price: 100,
        originalPrice: 125,
        unit: "500g",
        rating: 4.9,
        reviews: 154,
        badge: "🌿 Chemical Free",
        image: "image/image.d.jpg",
        description: "Natural sun-dried tangy tamarind grown in Eastern Ghats tribal forest tracts.",
        affiliateUrl: "product-details.html?product=tamarind"
    }
];

// ========================================================
// FETCH PRODUCTS FROM BACKEND API
// ========================================================
async function fetchProductsFromBackend() {
    const grid = document.getElementById("allProductsGrid");
    const countBadge = document.getElementById("productCountBadge");

    if (grid) {
        grid.innerHTML = `
            <div class="loading-state-container">
                <div class="spinner"></div>
                <p>Loading fresh products from B Market backend...</p>
            </div>
        `;
    }

    try {
        const response = await fetch(BACKEND_API_URL, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Backend returned HTTP status ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            allProducts = data;
            console.log(`✅ Loaded ${allProducts.length} dynamic products from backend`);
            showBackendStatusToast(`Connected to Backend: Loaded ${allProducts.length} dynamic products from MongoDB`, "success");
        } else {
            console.warn("Backend returned empty array, using fallback");
            allProducts = EMBEDDED_FALLBACK_PRODUCTS;
            showBackendStatusToast("Backend database is empty. Using default catalog.", "warning");
        }
    } catch (err) {
        console.warn("⚠️ Could not reach backend API, using cached products catalog:", err.message);
        allProducts = EMBEDDED_FALLBACK_PRODUCTS;
        showBackendStatusToast("Backend offline: Displaying cached product catalog.", "warning");
    } finally {
        isLoading = false;
        renderProducts();
    }
}

// Toast notification for backend connection status
function showBackendStatusToast(msg, type = "info") {
    let toast = document.getElementById("backendToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "backendToast";
        toast.className = "backend-toast";
        document.body.appendChild(toast);
    }
    toast.className = `backend-toast toast-${type} show`;
    toast.innerHTML = `<span>${type === "success" ? "🟢" : "🟡"}</span> ${msg}`;
    setTimeout(() => {
        toast.classList.remove("show");
    }, 4500);
}

// ========================================================
// FILTER & SORT ENGINE
// ========================================================
function getFilteredProducts() {
    let list = allProducts.slice();

    // Category filter
    if (currentCategory !== "all") {
        list = list.filter(p => {
            const cat = (p.category || "").toLowerCase();
            return cat === currentCategory.toLowerCase();
        });
    }

    // Platform / Source filter
    if (currentSource !== "all") {
        list = list.filter(p => {
            const src = (p.source || "bmarket").toLowerCase();
            return src === currentSource.toLowerCase();
        });
    }

    // Search query filter
    if (currentSearch.trim() !== "") {
        const q = currentSearch.toLowerCase().trim();
        list = list.filter(p =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.source && p.source.toLowerCase().includes(q))
        );
    }

    // Sort order
    if (currentSort === "price-asc") {
        list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (currentSort === "price-desc") {
        list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (currentSort === "rating") {
        list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    return list;
}

// ========================================================
// CARD HTML GENERATOR
// ========================================================
function createProductCardHTML(p) {
    const source = (p.source || "bmarket").toLowerCase();
    const isBMarket = source === "bmarket";
    const isAmazon = source === "amazon";
    const isFlipkart = source === "flipkart";

    const price = Number(p.price) || 0;
    const originalPrice = Number(p.originalPrice) || 0;
    const discount = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    let sourceBadgeClass = "badge-bmarket";
    let sourceIcon = "🌿";
    let sourceTitle = "B Market Direct";
    let actionButtons = "";

    const safeName = (p.name || "Product").replace(/'/g, "\\'");
    const imgUrl = p.image || "image/fruit.jpg";
    const fallbackAttr = p.fallbackImage
        ? `onerror="this.onerror=null; this.src='${p.fallbackImage}'"`
        : `onerror="this.src='image/fruit.jpg'"`;

    if (isBMarket) {
        sourceBadgeClass = "badge-bmarket";
        sourceIcon = "🌿";
        sourceTitle = "B Market Direct";
        actionButtons = `
            <div class="prod-action-row">
                <button type="button" class="btn-add-cart" onclick="addToCart('${safeName}', ${price}, '${imgUrl}')">
                    <span>🛒 Add to Cart</span>
                </button>
                <button type="button" class="btn-quick-buy" onclick="quickBuyNow('${safeName}', ${price}, '${imgUrl}')" title="Buy Now & Proceed to UPI Payment">
                    <span>⚡ Buy Now</span>
                </button>
            </div>
        `;
    } else if (isAmazon) {
        sourceBadgeClass = "badge-amazon";
        sourceIcon = "📦";
        sourceTitle = "Amazon Auxiliary";
        const affiliate = p.affiliateUrl || `https://www.amazon.in/s?k=${encodeURIComponent(p.name)}`;
        actionButtons = `
            <div class="prod-action-row">
                <a href="${affiliate}" target="_blank" rel="noopener noreferrer" class="btn-partner-amazon">
                    <span>📦 Buy on Amazon ↗</span>
                </a>
            </div>
        `;
    } else if (isFlipkart) {
        sourceBadgeClass = "badge-flipkart";
        sourceIcon = "🛒";
        sourceTitle = "Flipkart Auxiliary";
        const affiliate = p.affiliateUrl || `https://www.flipkart.com/search?q=${encodeURIComponent(p.name)}`;
        actionButtons = `
            <div class="prod-action-row">
                <a href="${affiliate}" target="_blank" rel="noopener noreferrer" class="btn-partner-flipkart">
                    <span>⚡ Buy on Flipkart ↗</span>
                </a>
            </div>
        `;
    }

    const categoryLabel = CATEGORY_DISPLAY_NAMES[p.category] || p.category || "Produce";
    const unitText = p.unit ? `per ${p.unit}` : "per pack";
    const ratingVal = p.rating ? Number(p.rating).toFixed(1) : "4.8";
    const reviewsVal = p.reviews ? Number(p.reviews).toLocaleString() : "100+";

    return `
        <div class="product-item-card ${source}-item" data-category="${p.category || 'all'}" data-source="${source}">
            <div class="card-media-wrap">
                <img src="${imgUrl}" alt="${p.name}" ${fallbackAttr} loading="lazy" class="product-item-img">
                <span class="partner-badge ${sourceBadgeClass}">
                    ${p.badge || sourceTitle}
                </span>
                ${discount > 0 ? `<span class="discount-pill">${discount}% OFF</span>` : ""}
            </div>

            <div class="card-content-wrap">
                <div class="card-category-tag">
                    <span>${categoryLabel}</span>
                    <span class="source-subtag">${sourceIcon} ${source.toUpperCase()}</span>
                </div>

                <h3 class="card-product-title" title="${p.name}">
                    ${p.name}
                </h3>

                <p class="card-product-desc">
                    ${p.description || "Fresh and naturally cultivated authentic produce."}
                </p>

                <div class="card-meta-row">
                    <div class="rating-stars">
                        <span>★</span>
                        <strong>${ratingVal}</strong>
                        <small>(${reviewsVal})</small>
                    </div>
                    <span class="unit-label">${unitText}</span>
                </div>

                <div class="card-price-row">
                    <span class="price-current">₹${price}</span>
                    ${originalPrice > price ? `<span class="price-original">₹${originalPrice}</span>` : ""}
                </div>

                ${actionButtons}
            </div>
        </div>
    `;
}

// ========================================================
// RENDER PRODUCTS TO DOM
// ========================================================
function renderProducts() {
    const grid = document.getElementById("allProductsGrid");
    const countBadge = document.getElementById("productCountBadge");

    if (!grid) return;

    const filtered = getFilteredProducts();

    if (countBadge) {
        countBadge.innerText = `${filtered.length} products found`;
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="no-products-found">
                <span style="font-size: 48px; display: block; margin-bottom: 12px;">🔍</span>
                <h3>No products match your criteria</h3>
                <p>Try searching with another keyword or resetting the category and source filters.</p>
                <button type="button" class="btn-reset-filters" onclick="resetAllFilters()">Reset All Filters</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(createProductCardHTML).join("");
}

// ========================================================
// FILTER CONTROLLERS
// ========================================================
function setCategory(catKey) {
    currentCategory = catKey;

    document.querySelectorAll(".cat-pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-category") === catKey);
    });

    const titleEl = document.getElementById("categoryHeading");
    if (titleEl) {
        titleEl.innerText = CATEGORY_DISPLAY_NAMES[catKey] || "Our Products";
    }

    renderProducts();
}

function setSource(srcKey) {
    currentSource = srcKey;

    document.querySelectorAll(".source-pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-source") === srcKey);
    });

    renderProducts();
}

function resetAllFilters() {
    currentCategory = "all";
    currentSource = "all";
    currentSearch = "";
    currentSort = "featured";

    const searchInput = document.getElementById("productSearchInput");
    if (searchInput) searchInput.value = "";

    const sortSelect = document.getElementById("productSortSelect");
    if (sortSelect) sortSelect.value = "featured";

    document.querySelectorAll(".cat-pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-category") === "all");
    });

    document.querySelectorAll(".source-pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-source") === "all");
    });

    const titleEl = document.getElementById("categoryHeading");
    if (titleEl) titleEl.innerText = "All Products & Auxiliary Deals";

    renderProducts();
}

// ========================================================
// BUY NOW / CHECKOUT HANDLER
// ========================================================
function quickBuyNow(name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let existing = cart.find(item => item.name === name);

    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({
            name: name,
            price: Number(price),
            image: image,
            quantity: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    const pendingOrder = {
        id: "BM-" + Date.now().toString().slice(-6),
        items: cart,
        total: cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0)
    };
    localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));

    window.location.href = "payment.html";
}

// ========================================================
// DYNAMIC PRODUCT CREATION (MODAL / FORM)
// ========================================================
function openAddProductModal() {
    const modal = document.getElementById("addProductModal");
    if (modal) {
        modal.classList.add("active");
        modal.style.display = "flex";
    }
}

function closeAddProductModal() {
    const modal = document.getElementById("addProductModal");
    if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
    }
}

async function handleAddProductSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("saveProductBtn");
    if (btn) btn.disabled = true;

    const newProd = {
        name: document.getElementById("newProdName").value.trim(),
        category: document.getElementById("newProdCategory").value,
        source: document.getElementById("newProdSource").value,
        price: Number(document.getElementById("newProdPrice").value),
        originalPrice: Number(document.getElementById("newProdOrigPrice").value) || Number(document.getElementById("newProdPrice").value),
        unit: document.getElementById("newProdUnit").value.trim() || "kg",
        image: document.getElementById("newProdImage").value.trim() || "image/fruit.jpg",
        description: document.getElementById("newProdDesc").value.trim(),
        affiliateUrl: document.getElementById("newProdAffiliate").value.trim(),
        rating: 4.8,
        reviews: 1,
        active: true
    };

    try {
        const response = await fetch(BACKEND_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProd)
        });

        if (response.ok) {
            const result = await response.json();
            const added = result.product || newProd;
            allProducts.unshift(added);
            renderProducts();
            closeAddProductModal();
            document.getElementById("addProductForm").reset();
            showBackendStatusToast(`Added "${newProd.name}" dynamically to backend!`, "success");
        } else {
            // Add locally to state even if backend error
            allProducts.unshift(newProd);
            renderProducts();
            closeAddProductModal();
            showBackendStatusToast(`Product added to catalog`, "info");
        }
    } catch (err) {
        allProducts.unshift(newProd);
        renderProducts();
        closeAddProductModal();
        showBackendStatusToast(`Product added to catalog`, "info");
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ========================================================
// INITIALIZE ON DOM LOAD
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    // Check URL parameters for pre-selected category / source
    const params = new URLSearchParams(window.location.search);
    const urlCat = params.get("category");
    if (urlCat && CATEGORY_DISPLAY_NAMES[urlCat]) {
        currentCategory = urlCat;
    }

    const urlSrc = params.get("source");
    if (urlSrc && ["all", "bmarket", "amazon", "flipkart"].includes(urlSrc)) {
        currentSource = urlSrc;
    }

    // Bind Search Input
    const searchInput = document.getElementById("productSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearch = e.target.value;
            renderProducts();
        });
    }

    // Bind Sort Select
    const sortSelect = document.getElementById("productSortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    // Bind Category Pills
    document.querySelectorAll(".cat-pill-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            setCategory(this.getAttribute("data-category"));
        });
    });

    // Bind Source Pills
    document.querySelectorAll(".source-pill-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            setSource(this.getAttribute("data-source"));
        });
    });

    // Bind Add Product Form
    const addForm = document.getElementById("addProductForm");
    if (addForm) {
        addForm.addEventListener("submit", handleAddProductSubmit);
    }

    // Start fetching from backend
    fetchProductsFromBackend();
});
