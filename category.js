// ========================================================
// B MARKET - DYNAMIC CATEGORY & AUXILIARY PRODUCTS ENGINE
// Showcase B Market Local Farm Fresh + Amazon & Flipkart Partners
// ========================================================

const CATEGORY_NAMES = {
    all: "All Categories",
    fruits: "Fresh Fruits",
    vegetables: "Fresh Vegetables",
    grains: "Grains & Millets",
    spices: "Spices & Condiments",
    coffee: "Fresh Coffee & Brews",
    tamarind: "Organic Tamarind"
};

// Legacy alias for backwards compatibility
const categoryNames = CATEGORY_NAMES;

// ========================================================
// MASTER PRODUCT CATALOG (Dynamic Backend + Local Fallback)
// ========================================================
let MASTER_PRODUCTS = [
    // ----------------------------------------------------
    // FRUITS
    // ----------------------------------------------------
    {
        id: "fr-bm-1",
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
        description: "Naturally ripened, crisp and juicy handpicked farm fruits.",
        affiliateUrl: "product-details.html?product=fruit"
    },
    {
        id: "fr-bm-2",
        name: "Organic Sweet Mangoes (Banganapalli)",
        category: "fruits",
        source: "bmarket",
        price: 160,
        originalPrice: 200,
        unit: "kg",
        rating: 4.9,
        reviews: 98,
        badge: "🌿 Local Harvest",
        image: "image/mango.jpeg",
        description: "Sweet, aromatic organic mangoes harvested from local orchards.",
        affiliateUrl: "product-details.html?product=mango"
    },
    {
        id: "fr-bm-3",
        name: "Hill-Grown Paderu Bananas",
        category: "fruits",
        source: "bmarket",
        price: 50,
        originalPrice: 65,
        unit: "dozen",
        rating: 4.7,
        reviews: 76,
        badge: "🌿 Farm Direct",
        image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80",
        fallbackImage: "image/fruit.jpg",
        description: "Pesticide-free mountain bananas rich in potassium and nutrients.",
        affiliateUrl: "product-details.html?product=bananas"
    },
    {
        id: "fr-amz-1",
        name: "Happilo 100% Natural California Almonds",
        category: "fruits",
        source: "amazon",
        price: 389,
        originalPrice: 499,
        unit: "500g",
        rating: 4.6,
        reviews: 15320,
        badge: "📦 Amazon's Choice",
        image: "https://images.unsplash.com/photo-1508061252445-5350f3ab0a55?w=500&q=80",
        fallbackImage: "image/fruit.jpg",
        description: "Premium California almonds with high protein, zero cholesterol.",
        affiliateUrl: "https://www.amazon.in/s?k=Happilo+Natural+California+Almonds+500g"
    },
    {
        id: "fr-amz-2",
        name: "Solimo Premium Seedless Raisins (Kismis)",
        category: "fruits",
        source: "amazon",
        price: 199,
        originalPrice: 260,
        unit: "500g",
        rating: 4.5,
        reviews: 8410,
        badge: "📦 Amazon Prime",
        image: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80",
        fallbackImage: "image/fruit.jpg",
        description: "Sweet, juicy dried seedless green raisins, 100% natural.",
        affiliateUrl: "https://www.amazon.in/s?k=Solimo+Seedless+Raisins+500g"
    },
    {
        id: "fr-fk-1",
        name: "Farmley Select Whole Roasted Cashews",
        category: "fruits",
        source: "flipkart",
        price: 429,
        originalPrice: 550,
        unit: "500g",
        rating: 4.6,
        reviews: 7920,
        badge: "⚡ Flipkart Assured",
        image: "https://images.unsplash.com/photo-1543208543-6052014786af?w=500&q=80",
        fallbackImage: "image/fruit.jpg",
        description: "Freshly roasted crunchy whole cashew nuts, hygienically packed.",
        affiliateUrl: "https://www.flipkart.com/search?q=Farmley+Roasted+Cashews+500g"
    },

    // ----------------------------------------------------
    // VEGETABLES
    // ----------------------------------------------------
    {
        id: "vg-bm-1",
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
        description: "Crisp and fresh leafy green vegetables plucked every morning.",
        affiliateUrl: "product-details.html?product=vegetables"
    },
    {
        id: "vg-bm-2",
        name: "Fresh Country Ginger (Desi Adrak)",
        category: "vegetables",
        source: "bmarket",
        price: 80,
        originalPrice: 100,
        unit: "500g",
        rating: 4.9,
        reviews: 84,
        badge: "🌿 Hill Grown",
        image: "image/ginger.jpg",
        description: "Strong, spicy, aromatic native hill ginger free of chemical polish.",
        affiliateUrl: "product-details.html?product=ginger"
    },
    {
        id: "vg-bm-3",
        name: "Country Fresh Red Tomatoes",
        category: "vegetables",
        source: "bmarket",
        price: 40,
        originalPrice: 55,
        unit: "kg",
        rating: 4.7,
        reviews: 112,
        badge: "🌿 Farm Direct",
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80",
        fallbackImage: "image/vfrt.webp",
        description: "Plump, sun-ripened red country tomatoes with rich tangy flavor.",
        affiliateUrl: "product-details.html?product=tomatoes"
    },
    {
        id: "vg-amz-1",
        name: "Ugaoo Vegetable Seeds Starter Kit (Pack of 12)",
        category: "vegetables",
        source: "amazon",
        price: 299,
        originalPrice: 399,
        unit: "kit",
        rating: 4.5,
        reviews: 4320,
        badge: "📦 Amazon's Choice",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=80",
        fallbackImage: "image/vfrt.webp",
        description: "Non-GMO heirloom vegetable seeds kit for home garden and kitchen.",
        affiliateUrl: "https://www.amazon.in/s?k=Ugaoo+Vegetable+Seeds+Starter+Kit"
    },
    {
        id: "vg-fk-1",
        name: "Kraft Seeds All-in-One Kitchen Garden Seed Pack",
        category: "vegetables",
        source: "flipkart",
        price: 189,
        originalPrice: 250,
        unit: "pack",
        rating: 4.4,
        reviews: 2890,
        badge: "⚡ Flipkart Assured",
        image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&q=80",
        fallbackImage: "image/vfrt.webp",
        description: "Certified germination vegetable seeds for spinach, tomato, coriander.",
        affiliateUrl: "https://www.flipkart.com/search?q=Kraft+Seeds+Kitchen+Garden+Pack"
    },

    // ----------------------------------------------------
    // GRAINS & MILLETS
    // ----------------------------------------------------
    {
        id: "gr-bm-1",
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
        description: "Aromatic, lightweight, aged Sona Masoori raw rice of supreme quality.",
        affiliateUrl: "product-details.html?product=grains"
    },
    {
        id: "gr-bm-2",
        name: "Organic Mountain Millets (Ragi)",
        category: "grains",
        source: "bmarket",
        price: 80,
        originalPrice: 95,
        unit: "kg",
        rating: 4.8,
        reviews: 95,
        badge: "🌿 Superfood",
        image: "image/millets.jpg",
        description: "Nutritious calcium-rich finger millets cultivated organically on hilltops.",
        affiliateUrl: "product-details.html?product=millets"
    },
    {
        id: "gr-bm-3",
        name: "Desi Brown Rice (Unpolished)",
        category: "grains",
        source: "bmarket",
        price: 90,
        originalPrice: 110,
        unit: "kg",
        rating: 4.7,
        reviews: 64,
        badge: "🌿 Fiber Rich",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80",
        fallbackImage: "image/image.b.webp",
        description: "100% whole grain unpolished brown rice ideal for healthy diabetic diets.",
        affiliateUrl: "product-details.html?product=brown-rice"
    },
    {
        id: "gr-amz-1",
        name: "India Gate Basmati Rice Classic",
        category: "grains",
        source: "amazon",
        price: 195,
        originalPrice: 240,
        unit: "kg",
        rating: 4.7,
        reviews: 18450,
        badge: "📦 Amazon's Choice",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80",
        fallbackImage: "image/image.b.webp",
        description: "Extra long slender grains with exotic aroma, aged for 2 years.",
        affiliateUrl: "https://www.amazon.in/s?k=India+Gate+Basmati+Rice+Classic"
    },
    {
        id: "gr-amz-2",
        name: "24 Mantra Organic Sprouted Ragi Flour",
        category: "grains",
        source: "amazon",
        price: 99,
        originalPrice: 120,
        unit: "500g",
        rating: 4.6,
        reviews: 6210,
        badge: "📦 Amazon Prime",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
        fallbackImage: "image/millets.jpg",
        description: "Certified organic sprouted finger millet flour, easily digestible.",
        affiliateUrl: "https://www.amazon.in/s?k=24+Mantra+Organic+Sprouted+Ragi+Flour"
    },
    {
        id: "gr-fk-1",
        name: "Fortune Special Biryani Basmati Rice",
        category: "grains",
        source: "flipkart",
        price: 165,
        originalPrice: 210,
        unit: "kg",
        rating: 4.5,
        reviews: 9340,
        badge: "⚡ Flipkart Assured",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80",
        fallbackImage: "image/image.b.webp",
        description: "Perfect non-sticky long grain rice specially aged for royal biryanis.",
        affiliateUrl: "https://www.flipkart.com/search?q=Fortune+Special+Biryani+Basmati+Rice"
    },

    // ----------------------------------------------------
    // SPICES & CONDIMENTS
    // ----------------------------------------------------
    {
        id: "sp-bm-1",
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
        id: "sp-bm-2",
        name: "Pure Natural Turmeric (Haldi)",
        category: "spices",
        source: "bmarket",
        price: 100,
        originalPrice: 130,
        unit: "250g",
        rating: 4.8,
        reviews: 145,
        badge: "🌿 High Curcumin",
        image: "image/termer.jpg",
        description: "Golden aromatic organic turmeric powder with natural therapeutic oils.",
        affiliateUrl: "product-details.html?product=turmeric"
    },
    {
        id: "sp-bm-3",
        name: "Organic Wild Forest Honey",
        category: "spices",
        source: "bmarket",
        price: 240,
        originalPrice: 290,
        unit: "500g",
        rating: 5.0,
        reviews: 92,
        badge: "🌿 Raw & Pure",
        image: "image/honey.jpg",
        description: "Unfiltered natural forest honey collected by local tribal beekeepers.",
        affiliateUrl: "product-details.html?product=honey"
    },
    {
        id: "sp-amz-1",
        name: "Catch Super Garam Masala Powder",
        category: "spices",
        source: "amazon",
        price: 88,
        originalPrice: 110,
        unit: "100g",
        rating: 4.6,
        reviews: 11200,
        badge: "📦 Amazon's Choice",
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80",
        fallbackImage: "image/image.f.webp",
        description: "Authentic North Indian blend of roasted exotic whole spices.",
        affiliateUrl: "https://www.amazon.in/s?k=Catch+Super+Garam+Masala+100g"
    },
    {
        id: "sp-amz-2",
        name: "Everest Pure Kashmiri Chilli Powder",
        category: "spices",
        source: "amazon",
        price: 125,
        originalPrice: 145,
        unit: "100g",
        rating: 4.7,
        reviews: 14800,
        badge: "📦 Amazon Prime",
        image: "https://images.unsplash.com/photo-1627735483796-015848259db8?w=500&q=80",
        fallbackImage: "image/termer.jpg",
        description: "Mild pungency with vibrant rich natural red color for curries.",
        affiliateUrl: "https://www.amazon.in/s?k=Everest+Kashmiri+Lal+Chilli+Powder"
    },
    {
        id: "sp-fk-1",
        name: "MDH Chunky Chat Masala",
        category: "spices",
        source: "flipkart",
        price: 75,
        originalPrice: 90,
        unit: "100g",
        rating: 4.6,
        reviews: 8640,
        badge: "⚡ Flipkart Assured",
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80",
        fallbackImage: "image/image.f.webp",
        description: "Tangy spices blend for salads, fruit platters, snacks and chaat.",
        affiliateUrl: "https://www.flipkart.com/search?q=MDH+Chunky+Chat+Masala"
    },

    // ----------------------------------------------------
    // COFFEE & BREWS
    // ----------------------------------------------------
    {
        id: "cf-bm-1",
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
        description: "Shade-grown single origin Arabica coffee beans roasted to perfection.",
        affiliateUrl: "product-details.html?product=coffee"
    },
    {
        id: "cf-bm-2",
        name: "Traditional South Indian Filter Blend",
        category: "coffee",
        source: "bmarket",
        price: 180,
        originalPrice: 220,
        unit: "200g",
        rating: 4.8,
        reviews: 110,
        badge: "🌿 80:20 Roast",
        image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80",
        fallbackImage: "image/image.e.webp",
        description: "Aromatic blend of roasted Arabica with chicory for thick crema.",
        affiliateUrl: "product-details.html?product=filter-blend"
    },
    {
        id: "cf-amz-1",
        name: "Nescafé Classic Instant Coffee Glass Jar",
        category: "coffee",
        source: "amazon",
        price: 360,
        originalPrice: 420,
        unit: "200g",
        rating: 4.7,
        reviews: 32400,
        badge: "📦 Amazon's Choice",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80",
        fallbackImage: "image/image.e.webp",
        description: "100% pure Robusta coffee beans, rich distinctive flavor and aroma.",
        affiliateUrl: "https://www.amazon.in/s?k=Nescafe+Classic+Instant+Coffee+200g"
    },
    {
        id: "cf-amz-2",
        name: "Blue Tokai Vienna Roast Arabica Coffee",
        category: "coffee",
        source: "amazon",
        price: 480,
        originalPrice: 550,
        unit: "250g",
        rating: 4.8,
        reviews: 6720,
        badge: "📦 Amazon Prime",
        image: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=500&q=80",
        fallbackImage: "image/image.e.webp",
        description: "Specialty dark roast artisan coffee with oaky and cocoa notes.",
        affiliateUrl: "https://www.amazon.in/s?k=Blue+Tokai+Vienna+Roast+Coffee"
    },
    {
        id: "cf-fk-1",
        name: "Continental Xtra Instant Coffee Powder",
        category: "coffee",
        source: "flipkart",
        price: 245,
        originalPrice: 295,
        unit: "200g",
        rating: 4.5,
        reviews: 14200,
        badge: "⚡ Flipkart Assured",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80",
        fallbackImage: "image/image.e.webp",
        description: "70% coffee 30% chicory blend offering strong flavor and kick.",
        affiliateUrl: "https://www.flipkart.com/search?q=Continental+Xtra+Instant+Coffee"
    },

    // ----------------------------------------------------
    // TAMARIND
    // ----------------------------------------------------
    {
        id: "tm-bm-1",
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
        description: "Natural sun-dried tangy tamarind grown in tribal forest tracts.",
        affiliateUrl: "product-details.html?product=tamarind"
    },
    {
        id: "tm-bm-2",
        name: "Deseeded Pure Tamarind Slab",
        category: "tamarind",
        source: "bmarket",
        price: 140,
        originalPrice: 175,
        unit: "500g",
        rating: 4.8,
        reviews: 88,
        badge: "🌿 Seedless",
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80",
        fallbackImage: "image/image.d.jpg",
        description: "Clean deseeded tamarind ready for instant rasam and sambar cooking.",
        affiliateUrl: "product-details.html?product=seedless-tamarind"
    },
    {
        id: "tm-amz-1",
        name: "24 Mantra Organic Tamarind",
        category: "tamarind",
        source: "amazon",
        price: 115,
        originalPrice: 140,
        unit: "500g",
        rating: 4.6,
        reviews: 4890,
        badge: "📦 Amazon's Choice",
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80",
        fallbackImage: "image/image.d.jpg",
        description: "Organically grown certified chemical-free sour culinary tamarind.",
        affiliateUrl: "https://www.amazon.in/s?k=24+Mantra+Organic+Tamarind+500g"
    },
    {
        id: "tm-amz-2",
        name: "Dabur Hommade Tamarind Paste",
        category: "tamarind",
        source: "amazon",
        price: 75,
        originalPrice: 90,
        unit: "200g",
        rating: 4.5,
        reviews: 7320,
        badge: "📦 Amazon Prime",
        image: "https://images.unsplash.com/photo-1589135233689-d6529fa21946?w=500&q=80",
        fallbackImage: "image/image.d.jpg",
        description: "Thick concentrated ready-to-use tamarind pulp for instant curries.",
        affiliateUrl: "https://www.amazon.in/s?k=Dabur+Hommade+Tamarind+Paste"
    },
    {
        id: "tm-fk-1",
        name: "Priya Concentrated Tamarind Paste",
        category: "tamarind",
        source: "flipkart",
        price: 65,
        originalPrice: 80,
        unit: "300g",
        rating: 4.6,
        reviews: 5120,
        badge: "⚡ Flipkart Assured",
        image: "https://images.unsplash.com/photo-1589135233689-d6529fa21946?w=500&q=80",
        fallbackImage: "image/image.d.jpg",
        description: "Traditional Andhra recipe concentrated tamarind paste, zero seeds.",
        affiliateUrl: "https://www.flipkart.com/search?q=Priya+Tamarind+Paste"
    }
];

// Grouped products object for legacy backwards-compatibility
const products = {
    fruits: MASTER_PRODUCTS.filter(p => p.category === "fruits"),
    vegetables: MASTER_PRODUCTS.filter(p => p.category === "vegetables"),
    grains: MASTER_PRODUCTS.filter(p => p.category === "grains"),
    spices: MASTER_PRODUCTS.filter(p => p.category === "spices"),
    coffee: MASTER_PRODUCTS.filter(p => p.category === "coffee"),
    tamarind: MASTER_PRODUCTS.filter(p => p.category === "tamarind")
};

// ========================================================
// CONTROLLER STATE
// ========================================================
let activeCategory = "all";
let activeSource = "all"; // 'all' | 'bmarket' | 'amazon' | 'flipkart'
let searchQuery = "";
let activeSort = "featured"; // 'featured' | 'price-asc' | 'price-desc' | 'rating'

// ========================================================
// CARD TEMPLATE GENERATOR
// ========================================================
function createProductCardHTML(p) {
    const isBMarket = p.source === "bmarket";
    const isAmazon = p.source === "amazon";
    const isFlipkart = p.source === "flipkart";

    const discount = p.originalPrice > p.price
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : 0;

    let sourceBadgeClass = "badge-bmarket";
    let sourceIcon = "🌿";
    let sourceTitle = "B Market Farm Fresh";
    let actionButtons = "";

    if (isBMarket) {
        sourceBadgeClass = "badge-bmarket";
        sourceIcon = "🌿";
        sourceTitle = "B Market Direct";
        actionButtons = `
            <div class="prod-action-row">
                <button type="button" class="btn-add-cart" onclick="addToCart('${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">
                    <span>🛒 Add to Cart</span>
                </button>
                <button type="button" class="btn-quick-buy" onclick="quickBuyNow('${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')" title="Buy Now & Proceed to UPI Payment">
                    <span>⚡ Buy Now</span>
                </button>
            </div>
        `;
    } else if (isAmazon) {
        sourceBadgeClass = "badge-amazon";
        sourceIcon = "📦";
        sourceTitle = "Amazon Auxiliary";
        actionButtons = `
            <div class="prod-action-row">
                <a href="${p.affiliateUrl}" target="_blank" rel="noopener noreferrer" class="btn-partner-amazon">
                    <span>📦 Buy on Amazon ↗</span>
                </a>
            </div>
        `;
    } else if (isFlipkart) {
        sourceBadgeClass = "badge-flipkart";
        sourceIcon = "🛒";
        sourceTitle = "Flipkart Auxiliary";
        actionButtons = `
            <div class="prod-action-row">
                <a href="${p.affiliateUrl}" target="_blank" rel="noopener noreferrer" class="btn-partner-flipkart">
                    <span>⚡ Buy on Flipkart ↗</span>
                </a>
            </div>
        `;
    }

    const fallbackAttr = p.fallbackImage ? `onerror="this.onerror=null; this.src='${p.fallbackImage}'"` : `onerror="this.src='image/fruit.jpg'"`;

    return `
        <div class="product-item-card ${p.source}-item" data-category="${p.category}" data-source="${p.source}">
            <div class="card-media-wrap">
                <img src="${p.image}" alt="${p.name}" ${fallbackAttr} loading="lazy" class="product-item-img">
                <span class="partner-badge ${sourceBadgeClass}">
                    ${p.badge || sourceTitle}
                </span>
                ${discount > 0 ? `<span class="discount-pill">${discount}% OFF</span>` : ""}
            </div>

            <div class="card-content-wrap">
                <div class="card-category-tag">
                    <span>${CATEGORY_NAMES[p.category] || p.category}</span>
                    <span class="source-subtag">${sourceIcon} ${p.source.toUpperCase()}</span>
                </div>

                <h3 class="card-product-title" title="${p.name}">
                    ${p.name}
                </h3>

                <p class="card-product-desc">
                    ${p.description}
                </p>

                <div class="card-meta-row">
                    <div class="rating-stars">
                        <span>★</span>
                        <strong>${p.rating}</strong>
                        <small>(${p.reviews.toLocaleString()})</small>
                    </div>
                    <span class="unit-label">${p.unit}</span>
                </div>

                <div class="card-price-row">
                    <span class="price-current">₹${p.price}</span>
                    ${p.originalPrice > p.price ? `<span class="price-original">₹${p.originalPrice}</span>` : ""}
                </div>

                ${actionButtons}
            </div>
        </div>
    `;
}

// ========================================================
// FILTER & RENDER ENGINE
// ========================================================
function filterProducts() {
    let list = MASTER_PRODUCTS.slice();

    // Filter by Category
    if (activeCategory !== "all") {
        list = list.filter(p => p.category === activeCategory);
    }

    // Filter by Source
    if (activeSource !== "all") {
        list = list.filter(p => p.source === activeSource);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.source.toLowerCase().includes(q)
        );
    }

    // Sort products
    if (activeSort === "price-asc") {
        list.sort((a, b) => a.price - b.price);
    } else if (activeSort === "price-desc") {
        list.sort((a, b) => b.price - a.price);
    } else if (activeSort === "rating") {
        list.sort((a, b) => b.rating - a.rating);
    }

    return list;
}

function renderProductsToContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const filtered = filterProducts();
    const countLabel = document.getElementById("catalogProductCount");
    if (countLabel) {
        countLabel.innerText = `${filtered.length} products available`;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-products-found">
                <span style="font-size: 40px; display: block; margin-bottom: 10px;">🔍</span>
                <h4>No products found matching your filters</h4>
                <p>Try clearing your search or switching to "All Categories" and "All Sources".</p>
                <button type="button" class="btn-reset-filters" onclick="resetAllCatalogFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(createProductCardHTML).join("");
}

// Re-render all active product grids on current page
function refreshActiveGrids() {
    renderProductsToContainer("homeProductsGrid");
    renderProductsToContainer("categoryProducts");
    renderProductsToContainer("allProductsGrid");
}

// ========================================================
// CONTROLLER ACTIONS
// ========================================================
function selectCategoryTab(categoryKey) {
    activeCategory = categoryKey;

    // Update active state in category pills
    document.querySelectorAll(".cat-pill-btn").forEach(btn => {
        if (btn.getAttribute("data-category") === categoryKey) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Update Category title if element exists
    const categoryTitleEl = document.getElementById("categoryTitle");
    if (categoryTitleEl) {
        categoryTitleEl.innerText = CATEGORY_NAMES[categoryKey] || "Our Products";
    }

    refreshActiveGrids();
}

function selectSourceTab(sourceKey) {
    activeSource = sourceKey;

    document.querySelectorAll(".source-pill-btn").forEach(btn => {
        if (btn.getAttribute("data-source") === sourceKey) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    refreshActiveGrids();
}

function resetAllCatalogFilters() {
    activeCategory = "all";
    activeSource = "all";
    searchQuery = "";
    activeSort = "featured";

    const searchInput = document.getElementById("catalogSearchInput");
    if (searchInput) searchInput.value = "";

    const sortSelect = document.getElementById("catalogSortSelect");
    if (sortSelect) sortSelect.value = "featured";

    document.querySelectorAll(".cat-pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-category") === "all");
    });

    document.querySelectorAll(".source-pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-source") === "all");
    });

    refreshActiveGrids();
}

// ========================================================
// CATEGORY CARD CLICK HANDLER (INTEGRATED ON INDEX.HTML)
// ========================================================
function openCategory(category) {
    // If we are on index.html and dynamic explorer exists, activate category and scroll down
    const explorer = document.getElementById("dynamicCategoryExplorer");
    if (explorer) {
        selectCategoryTab(category);
        explorer.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
        // Otherwise, navigate to dedicated category page
        window.location.href = "category.html?category=" + encodeURIComponent(category);
    }
}

// ========================================================
// INSTANT BUY NOW / CHECKOUT REDIRECT
// ========================================================
function quickBuyNow(name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let existingProduct = cart.find(item => item.name === name);

    if (existingProduct) {
        existingProduct.quantity = (existingProduct.quantity || 1) + 1;
    } else {
        cart.push({
            name: name,
            price: Number(price),
            image: image,
            quantity: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    // Also store pending order for direct checkout
    const pendingOrder = {
        id: "BM-" + Date.now().toString().slice(-6),
        items: cart,
        total: cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0)
    };
    localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));

    // Redirect straight to checkout/payment
    window.location.href = "payment.html";
}

// ========================================================
// PAGE INITIALIZATION
// ========================================================
document.addEventListener("DOMContentLoaded", function () {
    // Check URL parameters for pre-selected category
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get("category");
    if (urlCategory && CATEGORY_NAMES[urlCategory]) {
        activeCategory = urlCategory;
    }

    const urlSource = params.get("source");
    if (urlSource && ["all", "bmarket", "amazon", "flipkart"].includes(urlSource)) {
        activeSource = urlSource;
    }

    // Bind Search Input
    const searchInput = document.getElementById("catalogSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            searchQuery = e.target.value;
            refreshActiveGrids();
        });
    }

    // Bind Sort Select
    const sortSelect = document.getElementById("catalogSortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", function (e) {
            activeSort = e.target.value;
            refreshActiveGrids();
        });
    }

    // Bind Category Buttons
    document.querySelectorAll(".cat-pill-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            selectCategoryTab(this.getAttribute("data-category"));
        });
    });

    // Bind Source Filter Tabs
    document.querySelectorAll(".source-pill-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            selectSourceTab(this.getAttribute("data-source"));
        });
    });

    // Update Title if on category.html
    const titleEl = document.getElementById("categoryTitle");
    if (titleEl && activeCategory !== "all") {
        titleEl.innerText = CATEGORY_NAMES[activeCategory];
    }

    function getBackendUrl(path) {
        if (typeof window !== "undefined" && typeof window.getBMarketApiUrl === "function") {
            return window.getBMarketApiUrl(path);
        }
        const cleanPath = path ? (path.startsWith("/") ? path : "/" + path) : "";
        return cleanPath;
    }

    // Initial render with cached/default catalog
    refreshActiveGrids();

    // Dynamically sync latest products from backend API
    fetch(getBackendUrl("/api/products"))
        .then(res => {
            if (!res.ok) throw new Error("HTTP error " + res.status);
            return res.json();
        })
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                MASTER_PRODUCTS = data;
                console.log("✅ Synced " + data.length + " dynamic products from backend into category engine");
                refreshActiveGrids();
            }
        })
        .catch(err => {
            console.log("Note: Backend sync notice (using local catalog):", err.message);
        });
});