// =====================================================
// B MARKET - COMPLETE SCRIPT.JS
// CART SYSTEM
// =====================================================


// =====================================================
// ADD PRODUCT TO CART
// =====================================================

function addToCart(name, price, image) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    // Check if product already exists

    let existingProduct =
        cart.find(product => product.name === name);


    if (existingProduct) {

        existingProduct.quantity++;

    } else {

        cart.push({

            name: name,
            price: Number(price),
            image: image,
            quantity: 1

        });

    }


    // Save cart

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    alert(name + " added to cart 🛒");
}



// =====================================================
// DISPLAY CART
// =====================================================

function displayCart() {

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");


    // If this page doesn't have cart elements,
    // stop here.

    if (!cartItems) {
        return;
    }


    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    cartItems.innerHTML = "";


    let total = 0;



    // =================================================
    // EMPTY CART
    // =================================================

    if (cart.length === 0) {

        cartItems.innerHTML =
            "<h3>Your cart is empty.</h3>";


        if (cartTotal) {
            cartTotal.innerText = "0";
        }

        return;
    }



    // =================================================
    // DISPLAY EACH PRODUCT
    // =================================================

    cart.forEach((product, index) => {

        let productTotal =
            Number(product.price) * Number(product.quantity);


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



    // =================================================
    // DISPLAY TOTAL
    // =================================================

    if (cartTotal) {

        cartTotal.innerText = total;

    }

}



// =====================================================
// INCREASE QUANTITY
// =====================================================

function increaseQuantity(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    if (!cart[index]) {
        return;
    }


    cart[index].quantity++;


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    displayCart();

}



// =====================================================
// DECREASE QUANTITY
// =====================================================

function decreaseQuantity(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    if (!cart[index]) {
        return;
    }


    if (cart[index].quantity > 1) {

        cart[index].quantity--;

    }


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    displayCart();

}



// =====================================================
// REMOVE PRODUCT FROM CART
// =====================================================

function removeFromCart(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    if (!cart[index]) {
        return;
    }


    cart.splice(index, 1);


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    displayCart();

}



// =====================================================
// GO TO CHECKOUT
// =====================================================

function goToCheckout() {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    // Don't allow checkout with empty cart

    if (cart.length === 0) {

        alert("Your cart is empty!");

        return;
    }


    window.location.href =
        "checkout.html";

}



// =====================================================
// LOAD CART WHEN PAGE OPENS
// =====================================================

displayCart();