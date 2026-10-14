// Dynamic product details resolver

const defaultProducts = {
    fruit: {
        name: "Fresh Seasonal Fruits Basket",
        description: "Naturally ripened, crisp and juicy handpicked farm fruits direct from local growers.",
        price: "₹120",
        numPrice: 120,
        image: "image/fruit.jpg"
    },
    vegetables: {
        name: "Fresh Green Vegetables Combo",
        description: "Crisp and fresh leafy green vegetables plucked every morning from local farms.",
        price: "₹60",
        numPrice: 60,
        image: "image/vfrt.webp"
    },
    grains: {
        name: "Premium Sona Masoori Rice",
        description: "Aromatic, lightweight, aged Sona Masoori raw rice of supreme cooking quality.",
        price: "₹70",
        numPrice: 70,
        image: "image/image.b.webp"
    },
    pepper: {
        name: "Paderu Pure Black Pepper",
        description: "Bold, intense black peppercorns grown in Eastern Ghats tribal hill forest plantations.",
        price: "₹150",
        numPrice: 150,
        image: "image/image.f.webp"
    },
    coffee: {
        name: "Araku Valley Fresh Filter Coffee Beans",
        description: "Shade-grown single origin Arabica coffee beans roasted fresh to aromatic perfection.",
        price: "₹250",
        numPrice: 250,
        image: "image/image.e.webp"
    },
    tamarind: {
        name: "Hill-Grown Organic Tamarind",
        description: "Natural sun-dried tangy tamarind grown in Eastern Ghats tribal forest tracts.",
        price: "₹100",
        numPrice: 100,
        image: "image/image.d.jpg"
    }
};

const params = new URLSearchParams(window.location.search);
const productId = (params.get("product") || "fruit").toLowerCase();

let currentProduct = defaultProducts[productId] || defaultProducts.fruit;

function updateUI(prod) {
    if (!prod) return;
    const nameEl = document.getElementById("productName");
    const descEl = document.getElementById("productDescription");
    const priceEl = document.getElementById("productPrice");
    const imgEl = document.getElementById("productImage");
    const addBtn = document.getElementById("addCart");

    if (nameEl) nameEl.textContent = prod.name;
    if (descEl) descEl.textContent = prod.description;
    if (priceEl) priceEl.textContent = typeof prod.price === "number" ? `₹${prod.price}` : prod.price;
    if (imgEl) {
        imgEl.src = prod.image;
        imgEl.alt = prod.name;
        imgEl.onerror = () => { imgEl.src = "image/fruit.jpg"; };
    }

    if (addBtn) {
        addBtn.onclick = () => {
            const numPrice = Number(prod.price.toString().replace(/[^0-9]/g, "")) || prod.numPrice || 100;
            if (typeof addToCart === "function") {
                addToCart(prod.name, numPrice, prod.image);
            } else {
                let cart = JSON.parse(localStorage.getItem("cart")) || [];
                let existing = cart.find(i => i.name === prod.name);
                if (existing) {
                    existing.quantity++;
                } else {
                    cart.push({ name: prod.name, price: numPrice, image: prod.image, quantity: 1 });
                }
                localStorage.setItem("cart", JSON.stringify(cart));
                alert(`${prod.name} added to cart 🛒`);
            }
        };
    }
}

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

// Initial render from local map
updateUI(currentProduct);

// Try resolving dynamically from backend API
fetch(getBackendUrl(`/api/products/${productId}`))
    .then(r => r.json())
    .then(data => {
        if (data && data.name) {
            updateUI(data);
        }
    })
    .catch(() => {
        // Fallback to searching all products
        fetch(getBackendUrl("/api/products"))
            .then(r => r.json())
            .then(all => {
                if (Array.isArray(all)) {
                    const match = all.find(p =>
                        p.name.toLowerCase().includes(productId) ||
                        p.category.toLowerCase() === productId
                    );
                    if (match) updateUI(match);
                }
            })
            .catch(() => {});
    });
