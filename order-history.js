// Get order container

const ordersList =
    document.getElementById("ordersList");

const noOrders =
    document.getElementById("noOrders");


// Get orders from localStorage

const orders =
    JSON.parse(
        localStorage.getItem("orders")
    ) || [];


// Check orders

if (orders.length === 0) {

    noOrders.style.display = "block";

} else {

    noOrders.style.display = "none";

    displayOrders();

}


// Display orders

function displayOrders() {

    ordersList.innerHTML = "";


    orders.forEach(function(order) {

        let productsHTML = "";


        order.items.forEach(function(item) {

            productsHTML += `

                <div class="order-product">

                    <img
                        src="${item.image}"
                        alt="${item.name}"
                    >

                    <div class="product-info">

                        <h4>
                            ${item.name}
                        </h4>

                        <p>
                            Quantity: ${item.quantity}
                        </p>

                        <p>
                            ₹${item.price}
                        </p>

                    </div>

                </div>

            `;

        });


        ordersList.innerHTML += `

            <div class="order">

                <div class="order-header">

                    <div>

                        <h3>
                            Order #${order.id}
                        </h3>

                        <p class="order-date">
                            ${order.date}
                        </p>

                    </div>


                    <span class="status">
                        ${order.status}
                    </span>

                </div>


                ${productsHTML}


                <div class="order-total">

                    Total:
                    ₹${order.total}

                </div>

            </div>

        `;

    });

}