// ==========================================
// B MARKET - PRODUCTS FROM PHP
// ==========================================

console.log("PRODUCT JS CONNECTED!");

const productContainer = document.querySelector(".product-cards");

if (!productContainer) {

    console.error("Product container not found!");

} else {

    fetch("B%20Market_files/backend/product.php")

        .then(response => {

            if (!response.ok) {
                throw new Error("PHP error: " + response.status);
            }

            return response.json();

        })

        .then(products => {

            console.log("PRODUCTS FROM PHP:", products);

            productContainer.innerHTML = "";

            products.forEach(product => {

                const card = document.createElement("div");

                card.className = "product-card";

                card.innerHTML = `
                    
                    <img src="${product.image}" 
                         alt="${product.name}">

                    <h3>${product.name}</h3>

                    <p>${product.description}</p>

                    <h4>₹${product.price}</h4>

                    <button class="view-btn">
                        View Product
                    </button>

                    <button class="cart-btn"
                        onclick="addToCart(
                            '${product.name}',
                            ${product.price},
                            '${product.image}'
                        )">
                        Add to Cart
                    </button>

                `;

                productContainer.appendChild(card);

            });

        })

        .catch(error => {

            console.error("PRODUCT ERROR:", error);

            productContainer.innerHTML =
                "<p>Unable to load products from PHP.</p>";

        });

}