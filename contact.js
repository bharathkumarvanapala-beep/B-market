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
                const whatsappUrl = `https://wa.me/917981850491?text=${encodeURIComponent(
                    `Hi Bharath, I submitted an enquiry on B-Market:\n\n` +
                    `👤 Name: ${name}\n` +
                    `📞 Phone: ${phone || 'Not provided'}\n` +
                    `📧 Email: ${email}\n` +
                    `📝 Message: ${message}`
                )}`;

                showSuccessCard({
                    name,
                    email,
                    phone,
                    message,
                    enquiryId: data.enquiryId || 'SAVED',
                    whatsappUrl
                });

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

    function showSuccessCard(data) {
        if (!resultElement) return;
        resultElement.style.display = "block";
        resultElement.className = "result-message result-success";
        resultElement.innerHTML = `
            <div style="text-align: left; padding: 10px 4px;">
                <h4 style="color: #2e7d32; margin: 0 0 8px 0; font-size: 17px;">
                    ✅ Enquiry Received & Saved in Database!
                </h4>
                <p style="margin: 0 0 12px 0; color: #333; font-size: 14px; line-height: 1.4;">
                    Thank you <strong>${data.name}</strong>. Farmer <strong>Bharath Kumar Vanapala</strong> has been notified via email & dashboard.
                </p>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                    <a href="${data.whatsappUrl}" target="_blank" rel="noopener noreferrer"
                       style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background-color: #25D366; color: #fff; padding: 11px 16px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 2px 6px rgba(37,211,102,0.3);">
                        💬 Chat Directly on WhatsApp (+91 7981850491)
                    </a>
                    <a href="tel:+917981850491"
                       style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background-color: #1b5e20; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">
                        📞 Direct Call to Farmer (+91 7981850491)
                    </a>
                </div>
                <p style="font-size: 11px; color: #666; margin: 10px 0 0 0; text-align: center;">
                    Enquiry ID: #${data.enquiryId} &bull; Confirmation email dispatched
                </p>
            </div>
        `;
    }
});
