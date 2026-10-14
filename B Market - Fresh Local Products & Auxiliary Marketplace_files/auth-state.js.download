// ========================================================
// B MARKET - CUSTOMER AUTH STATE & PROFILE HELPER
// Manages customer login session, header display, and checkout autofill
// ========================================================

function getLoggedInCustomer() {
    try {
        const u = localStorage.getItem("bmarket_user");
        return u ? JSON.parse(u) : null;
    } catch (e) {
        return null;
    }
}

function setLoggedInCustomer(user) {
    if (user) {
        localStorage.setItem("bmarket_user", JSON.stringify(user));
    } else {
        localStorage.removeItem("bmarket_user");
    }
    updateHeaderCustomerUI();
}

function customerLogout() {
    localStorage.removeItem("bmarket_user");
    updateHeaderCustomerUI();
    window.location.reload();
}

function updateHeaderCustomerUI() {
    const customer = getLoggedInCustomer();
    const userAreas = document.querySelectorAll(".header-user-area, .login-area, #headerUserSlot");

    userAreas.forEach(area => {
        if (!area) return;

        if (customer && customer.name) {
            const firstName = customer.name.split(" ")[0];
            area.innerHTML = `
                <div class="user-profile-menu">
                    <button type="button" class="btn-customer-profile" onclick="toggleUserDropdown(event)">
                        <span class="user-avatar-circle">${firstName.charAt(0).toUpperCase()}</span>
                        <span class="user-greeting">Hi, <strong>${firstName}</strong></span>
                        <span class="dropdown-chevron">▼</span>
                    </button>
                    <div id="customerDropdown" class="customer-dropdown-menu">
                        <div class="dropdown-user-header">
                            <p class="dropdown-user-name">${customer.name}</p>
                            <p class="dropdown-user-email">${customer.email || customer.mobile}</p>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="order-history.html" class="dropdown-item">
                            <span>📦 My Orders</span>
                        </a>
                        <a href="cart.html" class="dropdown-item">
                            <span>🛒 My Cart</span>
                        </a>
                        <div class="dropdown-saved-addr">
                            <span class="addr-label">📍 Delivery Address:</span>
                            <p class="addr-val">${customer.address || "No address saved"}${customer.city ? ", " + customer.city : ""}${customer.pincode ? " - " + customer.pincode : ""}</p>
                        </div>
                        <div class="dropdown-divider"></div>
                        <button type="button" class="dropdown-item btn-logout" onclick="customerLogout()">
                            <span>🚪 Logout</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            area.innerHTML = `
                <a href="login.html" class="btn-flipkart-login">
                    <span>Login</span>
                </a>
            `;
        }
    });

    // Update Cart Badge count across all pages
    updateHeaderCartBadge();
}

function toggleUserDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById("customerDropdown");
    if (menu) {
        menu.classList.toggle("show");
    }
}

// Close dropdown on outside click
document.addEventListener("click", () => {
    const menu = document.getElementById("customerDropdown");
    if (menu && menu.classList.contains("show")) {
        menu.classList.remove("show");
    }
});

function updateHeaderCartBadge() {
    try {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        document.querySelectorAll(".cart-count-badge, #headerCartCount").forEach(badge => {
            badge.innerText = totalItems;
            badge.style.display = totalItems > 0 ? "inline-flex" : "none";
        });
    } catch (e) {}
}

// Auto-fill checkout fields if customer is logged in
function autoFillCustomerCheckout() {
    const customer = getLoggedInCustomer();
    if (!customer) return;

    const fields = {
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        pincode: customer.pincode
    };

    for (const [key, val] of Object.entries(fields)) {
        if (!val) continue;
        const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
        if (el && !el.value) {
            el.value = val;
        }
    }
}

// Run automatically on page load
document.addEventListener("DOMContentLoaded", () => {
    updateHeaderCustomerUI();
    autoFillCustomerCheckout();
});
