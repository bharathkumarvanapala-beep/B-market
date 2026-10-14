function addToCart(name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let existingProduct = cart.find(product => product.name === name);

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

    if (typeof updateHeaderCartBadge === "function") {
        updateHeaderCartBadge();
    }

    // Interactive feedback
    showAddToCartToast(name);
}

function showAddToCartToast(productName) {
    let toast = document.getElementById("cartToastNotice");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "cartToastNotice";
        toast.style.position = "fixed";
        toast.style.bottom = "24px";
        toast.style.right = "24px";
        toast.style.background = "#064e3b";
        toast.style.color = "#ffffff";
        toast.style.padding = "14px 22px";
        toast.style.borderRadius = "10px";
        toast.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)";
        toast.style.zIndex = "999999";
        toast.style.fontWeight = "700";
        toast.style.fontSize = "14px";
        toast.style.display = "flex";
        toast.style.alignItems = "center";
        toast.style.gap = "10px";
        toast.style.transition = "all 0.3s ease";
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>🛒</span> <span>Added <strong>${productName}</strong> to Cart!</span>`;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
    }, 2500);
}


// DISPLAY CART

function displayCart() {

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");

    if (!cartItems) return;

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    cartItems.innerHTML = "";

    let total = 0;


    if (cart.length === 0) {

        cartItems.innerHTML =
            "<h3>Your cart is empty.</h3>";

        cartTotal.innerText = "0";

        return;
    }


    cart.forEach((product, index) => {

        let productTotal =
            product.price * product.quantity;

        total += productTotal;


        cartItems.innerHTML += `

            <div class="cart-item">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

                <div class="cart-info">

                    <h3>
                        ${product.name}
                    </h3>

                    <p>
                        Price: ₹${product.price}
                    </p>

                    <p>
                        Quantity:
                        ${product.quantity}
                    </p>

                    <p>
                        Subtotal:
                        ₹${productTotal}
                    </p>

                </div>


                <div class="cart-buttons">

                    <button
                        onclick="increaseQuantity(${index})">

                        +

                    </button>


                    <button
                        onclick="decreaseQuantity(${index})">

                        -

                    </button>


                    <button
                        onclick="removeFromCart(${index})">

                        Remove

                    </button>

                </div>

            </div>

        `;

    });


    cartTotal.innerText = total;

}


// INCREASE QUANTITY

function increaseQuantity(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    cart[index].quantity++;

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    displayCart();
}


// DECREASE QUANTITY

function decreaseQuantity(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    if (cart[index].quantity > 1) {

        cart[index].quantity--;

    }

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    displayCart();
}


// REMOVE PRODUCT

function removeFromCart(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    cart.splice(index, 1);

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    displayCart();
}


// CHECKOUT

function goToCheckout() {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {

        alert("Your cart is empty!");

        return;
    }

    window.location.href =
        "checkout.html";
}


// LOAD CART WHEN PAGE OPENS

displayCart();