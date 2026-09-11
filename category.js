// =====================================
// CATEGORY PRODUCTS
// =====================================

const products = {

    fruits: [

        {
            name: "Fresh Fruits",
            price: 120,
            image: "image/fruit.jpg",
            description: "Fresh seasonal fruits."
        }

    ],


    vegetables: [

        {
            name: "Fresh Vegetables",
            price: 60,
            image: "image/vfrt.webp",
            description: "Healthy green vegetables."
        }

    ],


    grains: [

        {
            name: "Quality Rice",
            price: 70,
            image: "image/image.b.webp",
            description: "Premium quality rice."
        },

        {
            name: "Organic Millets",
            price: 80,
            image: "image/millets.jpg",
            description: "Healthy organic millets."
        }

    ],


    spices: [

        {
            name: "Black Pepper",
            price: 150,
            image: "image/image.f.webp",
            description: "Natural black pepper."
        },

        {
            name: "Turmeric",
            price: 100,
            image: "image/termer.jpg",
            description: "Pure turmeric."
        }

    ],


    coffee: [

        {
            name: "Coffee Beans",
            price: 250,
            image: "image/image.e.webp",
            description: "Fresh coffee beans."
        }

    ],


    tamarind: [

        {
            name: "Organic Tamarind",
            price: 100,
            image: "image/image.d.jpg",
            description: "Natural and tasty tamarind."
        }

    ]

};


// =====================================
// CATEGORY NAMES
// =====================================

const categoryNames = {

    fruits: "Fresh Fruits",

    vegetables: "Fresh Vegetables",

    grains: "Grains & Millets",

    spices: "Spices",

    coffee: "Fresh Coffee",

    tamarind: "Organic Tamarind"

};


// =====================================
// OPEN CATEGORY
// =====================================

function openCategory(category) {

    window.location.href =
        "category.html?category=" + category;

}


// =====================================
// DISPLAY CATEGORY
// =====================================

function displayCategory() {

    const params =
        new URLSearchParams(window.location.search);

    const category =
        params.get("category");


    const title =
        document.getElementById("categoryTitle");

    const container =
        document.getElementById("categoryProducts");


    // If category does not exist

    if (!category || !products[category]) {

        title.innerText = "Category Not Found";

        container.innerHTML =
            "<p>Sorry, this category does not exist.</p>";

        return;

    }


    // Category title

    title.innerText =
        categoryNames[category];


    // Clear old products

    container.innerHTML = "";


    // Display products

    products[category].forEach(function(product) {

        container.innerHTML += `

            <div class="category-product">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

                <h3>
                    ${product.name}
                </h3>

                <p>
                    ${product.description}
                </p>

                <h4>
                    ₹${product.price}
                </h4>

                <button
                    onclick="addToCart(
                        '${product.name}',
                        ${product.price},
                        '${product.image}'
                    )">

                    Add to Cart 🛒

                </button>

            </div>

        `;

    });

}


// =====================================
// RUN ONLY ON CATEGORY PAGE
// =====================================

if (
    document.getElementById("categoryProducts")
) {

    displayCategory();

}