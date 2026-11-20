// ===============================
// GET CART
// ===============================


function getBackendUrl(path) {
    if (typeof window !== "undefined" && typeof window.getBMarketApiUrl === "function") {
        return window.getBMarketApiUrl(path);
    }
    const cleanPath = path ? (path.startsWith("/") ? path : "/" + path) : "";
    return cleanPath;
}

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function placeOrder() {

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const order = {
        products: cart,
        date: new Date().toISOString()
    };

    fetch(getBackendUrl("/api/orders"), {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(order)

    })
    .then(response => response.json())
    .then(data => {

        console.log(data);

        alert("Order placed successfully!");

        localStorage.removeItem("cart");

    })
    .catch(error => {

        console.log("Order Error:", error);

    });
}

// ===============================
// SHOW ORDER
// ===============================

function showCheckout() {

    const checkoutItems =
        document.getElementById("checkoutItems");

    const checkoutTotal =
        document.getElementById("checkoutTotal");


    if (cart.length === 0) {

        checkoutItems.innerHTML =
            "<p>Your cart is empty.</p>";

        checkoutTotal.innerText = "0";

        return;

    }


    let total = 0;


    checkoutItems.innerHTML = "";


    cart.forEach(function(product) {

        let subtotal =
            product.price * product.quantity;

        total += subtotal;


        checkoutItems.innerHTML += `

            <div class="checkout-item">

                <img
                    src="${product.image}"
                    alt="${product.name}"
                >

                <div>

                    <h4>
                        ${product.name}
                    </h4>

                    <p>
                        Price: ₹${product.price}
                    </p>

                    <p>
                        Quantity: ${product.quantity}
                    </p>

                    <p>
                        Subtotal: ₹${subtotal}
                    </p>

                </div>

            </div>

        `;

    });


    checkoutTotal.innerText = total;

}


// ===============================
// CHECKOUT FORM
// ===============================

document
.getElementById("checkoutForm")
.addEventListener("submit", function(event) {

    event.preventDefault();


    if (cart.length === 0) {

        alert("Your cart is empty.");

        window.location.href = "product.html";

        return;

    }


    // CUSTOMER DETAILS

    const customer = {

        name:
            document.getElementById("name").value,

        mobile:
            document.getElementById("mobile").value,

        email:
            document.getElementById("email").value,

        address:
            document.getElementById("address").value,

        city:
            document.getElementById("city").value,

        pincode:
            document.getElementById("pincode").value

    };


    // SAVE CUSTOMER DETAILS FOR FUTURE CONVENIENCE
    localStorage.setItem("customer", JSON.stringify(customer));
    const existingUser = JSON.parse(localStorage.getItem("bmarket_user") || "{}");
    localStorage.setItem("bmarket_user", JSON.stringify({ ...existingUser, ...customer }));

    // PENDING ORDER DETAILS FOR PAYMENT
    const pendingOrder = {
        id: "BM-" + Date.now().toString().slice(-6),
        date: new Date().toLocaleString(),
        items: cart,
        customer: customer,
        total: cart.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        ),
        status: "Payment Pending"
    };

    localStorage.setItem(
        "pendingOrder",
        JSON.stringify(pendingOrder)
    );

    // GO TO PAYMENT
    window.location.href = "payment.html";

});

// Auto-fill saved customer info if available
function populateSavedCustomer() {
    const saved = JSON.parse(localStorage.getItem("bmarket_user") || localStorage.getItem("customer") || "null");
    if (!saved) return;

    if (saved.name && document.getElementById("name")) document.getElementById("name").value = saved.name;
    if (saved.mobile && document.getElementById("mobile")) document.getElementById("mobile").value = saved.mobile;
    if (saved.email && document.getElementById("email")) document.getElementById("email").value = saved.email;
    if (saved.address && document.getElementById("address")) document.getElementById("address").value = saved.address;
    if (saved.city && document.getElementById("city")) document.getElementById("city").value = saved.city;
    if (saved.pincode && document.getElementById("pincode")) document.getElementById("pincode").value = saved.pincode;
}

// ===============================
// LOAD CHECKOUT
// ===============================

showCheckout();
populateSavedCustomer();








