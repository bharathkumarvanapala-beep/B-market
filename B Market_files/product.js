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

fetch(getBackendUrl("/api/products"))
    .then(response => response.json())
    .then(products => {
        const productCards = document.querySelector(".product-cards");
        if (!productCards) return;

        products.forEach(product => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                <h3>${product.name}</h3>
                <p>Price: ₹${product.price}</p>
                <button>Add to Cart</button>
            `;
            productCards.appendChild(card);
        });
    })
    .catch(error => {
        console.log("Error:", error);
    });