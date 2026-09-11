let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");

let total = 0;

cart.forEach((product, index) => {

    const item = document.createElement("div");

    item.innerHTML = `
        <h3>${product.name}</h3>
        <p>Price: ₹${product.price}</p>
        <button onclick="removeItem(${index})">
            Remove
        </button>
        <hr>
    `;

    cartItems.appendChild(item);

    total = total + product.price;
});

cartTotal.innerHTML = `Total: ₹${total}`;


function removeItem(index) {

    cart.splice(index, 1);

    localStorage.setItem("cart", JSON.stringify(cart));

    location.reload();
}


function clearCart() {

    localStorage.removeItem("cart");

    location.reload();
}