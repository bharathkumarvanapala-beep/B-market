// B MARKET - DYNAMIC ORDER HISTORY ENGINE
// Fetches from MongoDB Backend (/api/orders) + localStorage fallback

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

const ordersList = document.getElementById("ordersList");
const noOrders = document.getElementById("noOrders");

async function loadOrderHistory() {
    let allOrders = JSON.parse(localStorage.getItem("orders")) || [];

    try {
        const res = await fetch(getBackendUrl("/api/orders"));
        if (res.ok) {
            const data = await res.json();
            if (data && data.orders && Array.isArray(data.orders)) {
                // Merge database orders with local orders without duplicates
                const dbOrders = data.orders.map(o => ({
                    id: o.orderId || o.id,
                    date: o.date ? new Date(o.date).toLocaleString() : new Date().toLocaleString(),
                    status: o.status || "Order Confirmed",
                    total: o.total,
                    items: o.items || o.products || [],
                    paymentMethod: o.paymentMethod || "Online",
                    paymentStatus: o.paymentStatus || "Paid"
                }));

                const orderIds = new Set(allOrders.map(o => o.id));
                dbOrders.forEach(o => {
                    if (!orderIds.has(o.id)) {
                        allOrders.push(o);
                        orderIds.add(o.id);
                    }
                });
            }
        }
    } catch (e) {
        console.log("Loading orders from local cache:", e.message);
    }

    if (!allOrders || allOrders.length === 0) {
        if (noOrders) noOrders.style.display = "block";
        if (ordersList) ordersList.innerHTML = "";
    } else {
        if (noOrders) noOrders.style.display = "none";
        displayOrders(allOrders);
    }
}

function displayOrders(orders) {
    if (!ordersList) return;
    ordersList.innerHTML = "";

    orders.forEach(order => {
        let productsHTML = "";
        const items = order.items || order.products || [];

        items.forEach(item => {
            const img = item.image || "image/fruit.jpg";
            const qty = item.quantity || 1;
            productsHTML += `
                <div class="order-product">
                    <img src="${img}" alt="${item.name}" onerror="this.src='image/fruit.jpg'">
                    <div class="product-info">
                        <h4>${item.name}</h4>
                        <p>Quantity: ${qty}</p>
                        <p>Price: ₹${item.price} each</p>
                    </div>
                </div>
            `;
        });

        ordersList.innerHTML += `
            <div class="order" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                <div class="order-header" style="background: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; border-radius: 12px 12px 0 0;">
                    <div>
                        <h3 style="margin: 0; color: #1e293b;">Order #${order.id}</h3>
                        <p class="order-date" style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Placed on: ${order.date}</p>
                    </div>
                    <span class="status" style="background: #e8f5e9; color: #2e7d32; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; border: 1px solid #c8e6c9;">
                        ✅ ${order.status || "Order Confirmed"}
                    </span>
                </div>

                <div style="padding: 18px 20px;">
                    ${productsHTML}
                </div>

                <div class="order-total" style="background: #fdfdfd; padding: 14px 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; border-radius: 0 0 12px 12px;">
                    <span style="font-size: 13px; color: #64748b;">Payment Method: <strong>${order.paymentMethod || "Online (Paid)"}</strong></span>
                    <span style="font-size: 18px; font-weight: 800; color: #2e7d32;">Total: ₹${order.total}</span>
                </div>
            </div>
        `;
    });
}

document.addEventListener("DOMContentLoaded", loadOrderHistory);