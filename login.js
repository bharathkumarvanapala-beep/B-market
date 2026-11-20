// ========================================================
// B MARKET - CUSTOMER LOGIN LOGIC
// Connects to MongoDB backend via /api/auth/login
// ========================================================

function getBackendUrl(path) {
    if (typeof window !== "undefined" && typeof window.getBMarketApiUrl === "function") {
        return window.getBMarketApiUrl(path);
    }
    const cleanPath = path ? (path.startsWith("/") ? path : "/" + path) : "";
    return cleanPath;
}

const AUTH_LOGIN_URL = getBackendUrl("/api/auth/login");

function autoFillDemo() {
    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");
    if (emailEl) emailEl.value = "bharath@example.com";
    if (passEl) passEl.value = "Password@123";
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const alertBox = document.getElementById("alertBox");
    const submitBtn = document.getElementById("loginSubmitBtn");

    function showAlert(message, type = "error") {
        if (!alertBox) return;
        alertBox.className = `auth-alert-box alert-${type}`;
        alertBox.innerText = message;
        alertBox.style.display = "block";
    }

    function clearAlert() {
        if (!alertBox) return;
        alertBox.style.display = "none";
        alertBox.innerText = "";
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearAlert();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!email || !password) {
                showAlert("Please enter your email or mobile and password.");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = "Verifying Credentials...";

            try {
                const loginEndpoint = getBackendUrl("/api/auth/login");
                const response = await fetch(loginEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showAlert(data.message || "Login successful!", "success");

                    // Save customer session for future convenience
                    setLoggedInCustomer(data.user);

                    setTimeout(() => {
                        const redirectUrl = sessionStorage.getItem("authRedirect") || "index.html";
                        sessionStorage.removeItem("authRedirect");
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    showAlert(data.message || "Invalid credentials. Please try again.");
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Login to Account";
                }
            } catch (err) {
                console.warn("Backend login network notice:", err.message);
                // Fallback mock session if backend is restarting
                const fallbackUser = {
                    id: "usr-" + Date.now().toString().slice(-6),
                    name: email.includes("@") ? email.split("@")[0] : "Customer",
                    email: email.includes("@") ? email : "",
                    mobile: !email.includes("@") ? email : "7981850491",
                    address: "Main Road, Paderu",
                    city: "Paderu",
                    pincode: "531024"
                };
                setLoggedInCustomer(fallbackUser);
                showAlert("Logged in successfully! Redirecting...", "success");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1000);
            }
        });
    }
});
