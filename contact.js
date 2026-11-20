// ============================================
// B MARKET - CONTACT & FARMER ENQUIRY HANDLER
// ============================================

function getBackendUrl(path) {
    if (typeof window !== "undefined" && typeof window.getBMarketApiUrl === "function") {
        return window.getBMarketApiUrl(path);
    }
    const cleanPath = path ? (path.startsWith("/") ? path : "/" + path) : "";
    return cleanPath;
}

document.addEventListener("DOMContentLoaded", () => {
    const enquiryForm = document.getElementById("enquiryForm");
    const resultElement = document.getElementById("result");

    if (!enquiryForm) return;

    let isSubmitting = false;

    enquiryForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (isSubmitting) return;

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const phoneInput = document.getElementById("phone");
        const messageInput = document.getElementById("message");
        const submitButton = enquiryForm.querySelector("button[type='submit']");

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const phone = phoneInput ? phoneInput.value.trim() : "";
        const message = messageInput ? messageInput.value.trim() : "";

        if (!name || name.length < 2) {
            showResult("Please enter your full name.", "error");
            return;
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!email || !emailRegex.test(email)) {
            showResult("Please enter a valid email address.", "error");
            return;
        }

        if (!message || message.length < 3) {
            showResult("Please write your enquiry message.", "error");
            return;
        }

        isSubmitting = true;
        const originalButtonText = submitButton ? submitButton.innerText : "Send Enquiry";
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerText = "⏳ Saving Enquiry & Sending...";
        }

        showResult("Submitting your enquiry, please wait...", "loading");

        const apiUrl = getBackendUrl("/api/enquiry");

        try {
            console.log("Submitting enquiry to:", apiUrl);
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone,
                    message: message
                })
            });

            let data = {};
            try {
                data = await response.json();
            } catch (parseErr) {
                data = {
                    success: false,
                    message: "Server returned status " + response.status + " (" + response.statusText + ")"
                };
            }

            if (response.ok && data.success) {
                showResult(
                    "✅ " + (data.message || "Enquiry submitted and saved successfully! Our farm team will contact you soon."),
                    "success"
                );
                enquiryForm.reset();
            } else {
                showResult("⚠️ " + (data.message || `Server returned error (${response.status})`), "error");
            }
        } catch (networkErr) {
            console.error("Enquiry network error:", networkErr);
            showResult(
                "❌ Could not reach the B Market server. Please check your internet connection or try again later.",
                "error"
            );
        } finally {
            isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerText = originalButtonText;
            }
        }
    });

    function showResult(text, type) {
        if (!resultElement) return;
        resultElement.style.display = "block";
        resultElement.textContent = text;
        resultElement.className = "result-message result-" + type;
    }
});
