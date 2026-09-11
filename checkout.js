// ==========================================
// B MARKET - CHECKOUT
// ==========================================

console.log("CHECKOUT JS CONNECTED!");

const checkoutForm = document.getElementById("checkoutForm");
const checkoutItems = document.getElementById("checkoutItems");
const checkoutTotal = document.getElementById("checkoutTotal");


// Get cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];


// Display cart
function displayCheckout() {

    checkoutItems.innerHTML = "";

    if (cart.length === 0) {

        checkoutItems.innerHTML =
            "<p>Your cart is empty.</p>";

        checkoutTotal.textContent = "0";

        return;
    }

    let total = 0;

    cart.forEach((item) => {

        const quantity = item.quantity || 1;
        const price = Number(item.price) || 0;

        const itemTotal = price * quantity;

        total += itemTotal;

        const div = document.createElement("div");

        div.className = "checkout-item";

        div.innerHTML = `
            <p>
                <strong>${item.name}</strong>
            </p>

            <p>
                ₹${price} × ${quantity}
                = ₹${itemTotal}
            </p>
        `;

        checkoutItems.appendChild(div);

    });

    checkoutTotal.textContent = total;
}


// Submit order
checkoutForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    console.log("CHECKOUT SUBMITTED!");

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;
    }


    const name =
        document.getElementById("name").value.trim();

    const mobile =
        document.getElementById("mobile").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const address =
        document.getElementById("address").value.trim();

    const city =
        document.getElementById("city").value.trim();

    const pincode =
        document.getElementById("pincode").value.trim();


    // Calculate total
    let total = 0;

    cart.forEach(item => {

        const quantity = item.quantity || 1;
        const price = Number(item.price) || 0;

        total += price * quantity;

    });


    // Convert cart into text
    const items = cart.map(item => {

        const quantity = item.quantity || 1;

        return `${item.name} × ${quantity}`;

    }).join(", ");


    const formData = new FormData();

    formData.append("name", name);
    formData.append("mobile", mobile);
    formData.append("email", email);
    formData.append("address", address);
    formData.append("city", city);
    formData.append("pincode", pincode);

    formData.append("items", items);
    formData.append("total", total);


    try {

        console.log("Sending order to PHP...");

        const response = await fetch(
            "B%20Market_files/backend/order.php",
            {
                method: "POST",
                body: formData
            }
        );


        const data = await response.json();

        console.log("PHP ORDER RESPONSE:", data);


        if (data.success) {

            alert("Order placed successfully!");


            // Clear cart
            localStorage.removeItem("cart");


            // Go back to home page
            window.location.href = "index.html";

        } else {

            alert(
                data.message || "Unable to place order."
            );

        }


    } catch (error) {

        console.error("ORDER ERROR:", error);

        alert(
            "Unable to connect to PHP backend."
        );

    }

});


// Display products when page opens
displayCheckout();