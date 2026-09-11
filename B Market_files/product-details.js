const products = {

    fruit: {
        name: "Fresh Fruits",
        description: "Seasonal fresh fruits",
        price: "₹120",
        image: "../image/fruit.jpg"
    },

    vegetables: {
        name: "Fresh Vegetables",
        description: "Healthy green vegetables",
        price: "₹60",
        image: "../image/vfrt.webp"
    },

    grains: {
        name: "Quality Grains",
        description: "Rice, wheat and other grains",
        price: "₹60",
        image: "../image/image.b.webp"
    },

    pepper: {
        name: "Black Pepper",
        description: "Natural and aromatic pepper",
        price: "₹120",
        image: "../image/image.f.webp"
    },

    coffee: {
        name: "Fresh Coffee",
        description: "Fresh coffee beans",
        price: "₹60",
        image: "../image/image.e.webp"
    },

    tamarind: {
        name: "Organic Tamarind",
        description: "Natural and tasty tamarind",
        price: "₹80",
        image: "../image/image.d.jpg"
    }

};


// Get product from URL

const params = new URLSearchParams(window.location.search);

const productId = params.get("product");

const product = products[productId];


// Display product

if (product) {

    document.getElementById("productName").textContent =
        product.name;

    document.getElementById("productDescription").textContent =
        product.description;

    document.getElementById("productPrice").textContent =
        product.price;

    document.getElementById("productImage").src =
        product.image;

}