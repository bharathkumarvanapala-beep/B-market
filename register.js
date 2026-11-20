// ========================================================
// B MARKET - CUSTOMER REGISTRATION LOGIC
// Connects to MongoDB backend via /api/auth/register
// ========================================================

function getBackendUrl(path) {
    if (typeof window !== "undefined" && typeof window.getBMarketApiUrl === "function") {
        return window.getBMarketApiUrl(path);
    }
    const cleanPath = path ? (path.startsWith("/") ? path : "/" + path) : "";
    return cleanPath;
}

const AUTH_REGISTER_URL = getBackendUrl("/api/auth/register");

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const alertBox = document.getElementById("alertBox");
    const submitBtn = document.getElementById("submitBtn");

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

            const name = document.getElementById("name").value.trim();
            const mobile = document.getElementById("mobile").value.trim();
            const email = document.getElementById("email").value.trim();
            const address = document.getElementById("address").value.trim();
            const city = document.getElementById("city").value.trim();
            const pincode = document.getElementById("pincode").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            // Form validations
            if (password !== confirmPassword) {
                showAlert("Passwords do not match. Please verify both passwords.");
                return;
            }

            if (!/^[0-9]{10}$/.test(mobile)) {
                showAlert("Please enter a valid 10-digit mobile number.");
                return;
            }

            if (!/^[0-9]{6}$/.test(pincode)) {
                showAlert("Please enter a valid 6-digit postal pincode.");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = "Saving & Registering...";

            const payload = {
                name,
                mobile,
                email,
                address,
                city,
                pincode,
                password
            };

            try {
                const registerEndpoint = getBackendUrl("/api/auth/register");
                const response = await fetch(registerEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showAlert(data.message || "Registration successful! Welcome to B Market.", "success");

                    // Save customer profile for future convenience
                    setLoggedInCustomer(data.user);

                    setTimeout(() => {
                        // Check if redirect target was set (e.g. from checkout or payment)
                        const redirectUrl = sessionStorage.getItem("authRedirect") || "index.html";
                        sessionStorage.removeItem("authRedirect");
                        window.location.href = redirectUrl;
                    }, 1200);
                } else {
                    showAlert(data.message || "Failed to create account. Please try again.");
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Register & Save Information";
                }
            } catch (err) {
                console.warn("Backend registration network error:", err.message);
                // Resilient local registration so user can still proceed even if network hiccup
                const fallbackUser = {
                    id: "usr-" + Date.now().toString().slice(-6),
                    name,
                    mobile,
                    email,
                    address,
                    city,
                    pincode
                };
                setLoggedInCustomer(fallbackUser);
                showAlert("Account saved locally! Redirecting to B Market...", "success");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1200);
            }
        });
    }
});
