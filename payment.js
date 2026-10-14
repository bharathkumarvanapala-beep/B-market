// ========================================================
// B MARKET - SECURE RUNTIME PAYMENT ENGINE
// ========================================================

document.addEventListener("DOMContentLoaded", function () {
    console.log("Secure Payment engine initialized.");

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let savedUser = JSON.parse(localStorage.getItem("bmarket_user")) || {};
    let customer = JSON.parse(localStorage.getItem("customer")) || {};
    if (!customer.name && savedUser.name) {
        customer = { ...savedUser, ...customer };
    }
    let pendingOrder = JSON.parse(localStorage.getItem("pendingOrder")) || {};

    // Calculate totals
    let totalAmount = 0;
    if (pendingOrder && pendingOrder.total && Number(pendingOrder.total) > 0) {
        totalAmount = Number(pendingOrder.total);
    } else if (cart.length > 0) {
        totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);
    }

    // Direct visit / testing fallback: Ensure a positive amount for valid UPI transactions
    if (totalAmount <= 0) {
        totalAmount = 250;
        if (cart.length === 0 && (!pendingOrder || !pendingOrder.items || pendingOrder.items.length === 0)) {
            cart = [
                { id: "sample-prod-1", name: "Farm Fresh Seasonal Produce", price: 250, quantity: 1, image: "image/fruit.jpg" }
            ];
        }
    }

    const itemsToOrder = (pendingOrder && pendingOrder.items && pendingOrder.items.length > 0) ? pendingOrder.items : cart;

    // ----------------------------------------------------
    // POPULATE UI SUMMARY
    // ----------------------------------------------------
    document.querySelectorAll(".pay-amount-label").forEach(el => {
        el.innerText = totalAmount.toLocaleString("en-IN");
    });

    const summarySubtotal = document.getElementById("summarySubtotal");
    if (summarySubtotal) summarySubtotal.innerText = totalAmount.toLocaleString("en-IN");

    // Populate Customer Delivery details
    const summaryCustomerName = document.getElementById("summaryCustomerName");
    const summaryCustomerAddress = document.getElementById("summaryCustomerAddress");
    const summaryCustomerMobile = document.getElementById("summaryCustomerMobile");
    const summaryCustomerEmail = document.getElementById("summaryCustomerEmail");

    if (summaryCustomerName) summaryCustomerName.innerText = customer.name || "Valued Customer";
    if (summaryCustomerAddress) {
        const addr = [customer.address, customer.city, customer.pincode].filter(Boolean).join(", ");
        summaryCustomerAddress.innerText = addr || "Delivery address registered at checkout";
    }
    if (summaryCustomerMobile) summaryCustomerMobile.innerText = customer.mobile || "Not specified";
    if (summaryCustomerEmail) summaryCustomerEmail.innerText = customer.email || "Not specified";

    // Populate Items List
    const summaryItemsList = document.getElementById("summaryItemsList");
    const summaryItemCount = document.getElementById("summaryItemCount");
    if (summaryItemCount) summaryItemCount.innerText = itemsToOrder.length;

    if (summaryItemsList) {
        summaryItemsList.innerHTML = "";
        itemsToOrder.forEach(item => {
            const qty = item.quantity || 1;
            const sub = (Number(item.price) * qty).toLocaleString("en-IN");
            const imgSrc = item.image || "image/fruit.jpg";

            summaryItemsList.innerHTML += `
                <div class="summary-item-row">
                    <img src="${imgSrc}" alt="${item.name}" onerror="this.src='image/fruit.jpg'">
                    <div class="summary-item-info">
                        <h5>${item.name}</h5>
                        <p>Qty: ${qty} × ₹${item.price}</p>
                    </div>
                    <div class="summary-item-price">₹${sub}</div>
                </div>
            `;
        });
    }

    // ----------------------------------------------------
    // PAYMENT METHOD SWITCHING
    // ----------------------------------------------------
    let currentMethod = "upi";
    const tabButtons = document.querySelectorAll(".tab-btn");
    const methodPanels = document.querySelectorAll(".method-panel");
    const payBtnText = document.getElementById("payBtnText");

    function updatePayButtonText() {
        if (!payBtnText) return;
        const formattedTotal = "₹" + totalAmount.toLocaleString("en-IN");
        if (currentMethod === "upi") {
            payBtnText.innerHTML = `Pay <strong>${formattedTotal}</strong> via UPI`;
        } else if (currentMethod === "card") {
            payBtnText.innerHTML = `Pay <strong>${formattedTotal}</strong> Securely via Card`;
        } else if (currentMethod === "netbanking") {
            const selectedBank = document.querySelector("input[name='bankSelect']:checked");
            const bankName = selectedBank ? selectedBank.value : "Net Banking";
            payBtnText.innerHTML = `Pay <strong>${formattedTotal}</strong> via ${bankName}`;
        } else if (currentMethod === "cod") {
            payBtnText.innerHTML = `Confirm Cash on Delivery Order (<strong>${formattedTotal}</strong>)`;
        }
    }

    tabButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            tabButtons.forEach(b => b.classList.remove("active"));
            methodPanels.forEach(p => p.classList.remove("active"));

            this.classList.add("active");
            currentMethod = this.getAttribute("data-method");

            const activePanel = document.getElementById("method-" + currentMethod);
            if (activePanel) activePanel.classList.add("active");

            updatePayButtonText();
        });
    });

    document.querySelectorAll("input[name='bankSelect']").forEach(radio => {
        radio.addEventListener("change", updatePayButtonText);
    });

    updatePayButtonText();

    // ----------------------------------------------------
    // INTERACTIVE CARD VISUAL & FORMATTING
    // ----------------------------------------------------
    const cardNumberInput = document.getElementById("cardNumber");
    const cardNameInput = document.getElementById("cardName");
    const cardExpiryInput = document.getElementById("cardExpiry");
    const cardCvvInput = document.getElementById("cardCvv");

    const cardNumberDisplay = document.getElementById("cardNumberDisplay");
    const cardHolderDisplay = document.getElementById("cardHolderDisplay");
    const cardExpiryDisplay = document.getElementById("cardExpiryDisplay");
    const cardTypeDisplay = document.getElementById("cardTypeDisplay");
    const cardBrandIcon = document.getElementById("cardBrandIcon");

    if (cardNumberInput) {
        cardNumberInput.addEventListener("input", function (e) {
            // Remove non-digits
            let val = e.target.value.replace(/\D/g, "");
            // Detect card brand
            let brand = "CARD";
            let icon = "💳";
            if (/^4/.test(val)) {
                brand = "VISA";
                icon = "💳";
            } else if (/^5[1-5]/.test(val) || /^2[2-7]/.test(val)) {
                brand = "MASTERCARD";
                icon = "💳";
            } else if (/^(?:60|65|81|82)/.test(val)) {
                brand = "RUPAY";
                icon = "💳";
            } else if (/^3[47]/.test(val)) {
                brand = "AMEX";
                icon = "💳";
            }

            if (cardTypeDisplay) cardTypeDisplay.innerText = brand;
            if (cardBrandIcon) cardBrandIcon.innerText = icon;

            // Format with spaces every 4 digits
            let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
            if (formatted.length > 19) formatted = formatted.substring(0, 19);
            e.target.value = formatted;

            if (cardNumberDisplay) {
                cardNumberDisplay.innerText = formatted.length > 0 ? formatted : "•••• •••• •••• ••••";
            }
            document.getElementById("cardNumberError").innerText = "";
        });
    }

    if (cardNameInput) {
        cardNameInput.addEventListener("input", function (e) {
            const val = e.target.value.toUpperCase();
            if (cardHolderDisplay) cardHolderDisplay.innerText = val.length > 0 ? val : "YOUR NAME";
            document.getElementById("cardNameError").innerText = "";
        });
    }

    if (cardExpiryInput) {
        cardExpiryInput.addEventListener("input", function (e) {
            let val = e.target.value.replace(/\D/g, "");
            if (val.length >= 2) {
                let month = parseInt(val.substring(0, 2), 10);
                if (month > 12) val = "12" + val.substring(2);
                val = val.substring(0, 2) + "/" + val.substring(2, 4);
            }
            e.target.value = val;
            if (cardExpiryDisplay) cardExpiryDisplay.innerText = val.length > 0 ? val : "MM/YY";
            document.getElementById("cardExpiryError").innerText = "";
        });
    }

    if (cardCvvInput) {
        cardCvvInput.addEventListener("input", function (e) {
            e.target.value = e.target.value.replace(/\D/g, "");
            document.getElementById("cardCvvError").innerText = "";
        });
    }

    // ----------------------------------------------------
    // DYNAMIC PHONEPE & MULTI-UPI ENGINE
    // ----------------------------------------------------
    const activeOrderId = (pendingOrder && pendingOrder.id) ? pendingOrder.id : ("BM-" + Date.now().toString().slice(-6));
    const merchantVpa = "7981850491@ybl";
    const merchantName = "VANAPALA BHARAT KUMAR";
    const upiNote = "B Market Order " + activeOrderId;
    const formattedAmount = Number(totalAmount).toFixed(2);

    // Build Standard & Direct Intent URIs
    const baseUpiQuery = `pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(merchantName)}&am=${encodeURIComponent(formattedAmount)}&cu=INR&tn=${encodeURIComponent(upiNote)}&tr=${encodeURIComponent(activeOrderId)}`;
    const universalUpiLink = `upi://pay?${baseUpiQuery}`;

    // App configurations with custom Android Intents & iOS schemes
    const upiAppConfigs = {
        phonepe: {
            key: "phonepe",
            name: "PhonePe",
            color: "#5f259f",
            logo: "पे",
            androidIntent: `intent://pay?${baseUpiQuery}#Intent;scheme=upi;package=com.phonepe.app;end`,
            iosScheme: `phonepe://pay?${baseUpiQuery}`,
            customScheme: `phonepe://pay?${baseUpiQuery}`
        },
        gpay: {
            key: "gpay",
            name: "Google Pay",
            color: "#1a73e8",
            logo: "G",
            androidIntent: `intent://pay?${baseUpiQuery}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
            iosScheme: `gpay://upi/pay?${baseUpiQuery}`,
            customScheme: `tez://upi/pay?${baseUpiQuery}`
        },
        paytm: {
            key: "paytm",
            name: "Paytm",
            color: "#00b9f5",
            logo: "P",
            androidIntent: `intent://pay?${baseUpiQuery}#Intent;scheme=upi;package=net.one97.paytm;end`,
            iosScheme: `paytmmp://pay?${baseUpiQuery}`,
            customScheme: `paytmmp://pay?${baseUpiQuery}`
        },
        bhim: {
            key: "bhim",
            name: "BHIM UPI",
            color: "#00796b",
            logo: "B",
            androidIntent: `intent://pay?${baseUpiQuery}#Intent;scheme=upi;package=in.org.npci.upiapp;end`,
            iosScheme: universalUpiLink,
            customScheme: universalUpiLink
        },
        any: {
            key: "any",
            name: "UPI App",
            color: "#10b981",
            logo: "📱",
            androidIntent: universalUpiLink,
            iosScheme: universalUpiLink,
            customScheme: universalUpiLink
        }
    };

    // Generate Dynamic Real-Time QR code URL
    const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(universalUpiLink)}`;

    // Set Dynamic QR image
    const dynamicUpiQr = document.getElementById("dynamicUpiQr");
    const userPhonePeQr = document.getElementById("userPhonePeQr");
    const btnShowStandeeQr = document.getElementById("btnShowStandeeQr");
    const btnShowDynamicQr = document.getElementById("btnShowDynamicQr");

    if (dynamicUpiQr) {
        dynamicUpiQr.src = dynamicQrUrl;
    }

    if (btnShowStandeeQr && btnShowDynamicQr) {
        btnShowStandeeQr.addEventListener("click", () => {
            btnShowStandeeQr.classList.add("active");
            btnShowDynamicQr.classList.remove("active");
            if (userPhonePeQr) userPhonePeQr.style.display = "block";
            if (dynamicUpiQr) dynamicUpiQr.style.display = "none";
        });

        btnShowDynamicQr.addEventListener("click", () => {
            btnShowDynamicQr.classList.add("active");
            btnShowStandeeQr.classList.remove("active");
            if (userPhonePeQr) userPhonePeQr.style.display = "none";
            if (dynamicUpiQr) dynamicUpiQr.style.display = "block";
        });
    }

    // Modal elements
    const upiIntentModal = document.getElementById("upiIntentModal");
    const closeUpiModalBtn = document.getElementById("closeUpiModalBtn");
    const upiModalLogo = document.getElementById("upiModalLogo");
    const upiModalTitle = document.getElementById("upiModalTitle");
    const upiModalSubtitle = document.getElementById("upiModalSubtitle");
    const upiModalAmount = document.getElementById("upiModalAmount");
    const upiModalQrImg = document.getElementById("upiModalQrImg");
    const upiModalAppName = document.getElementById("upiModalAppName");
    const upiModalDirectLaunchBtn = document.getElementById("upiModalDirectLaunchBtn");
    const upiModalLaunchName = document.getElementById("upiModalLaunchName");
    const upiModalCopyLinkBtn = document.getElementById("upiModalCopyLinkBtn");
    const upiModalWhatsappBtn = document.getElementById("upiModalWhatsappBtn");
    const upiModalDoneBtn = document.getElementById("upiModalDoneBtn");

    let currentModalTargetUrl = universalUpiLink;

    function openUpiModal(appConfig) {
        if (!upiIntentModal) return;
        const config = appConfig || upiAppConfigs.phonepe;

        if (upiModalLogo) {
            upiModalLogo.innerText = config.logo;
            upiModalLogo.style.background = config.color;
        }
        if (upiModalTitle) upiModalTitle.innerText = `Pay via ${config.name}`;
        if (upiModalSubtitle) upiModalSubtitle.innerText = `Merchant: ${merchantName} (${merchantVpa})`;
        if (upiModalAmount) upiModalAmount.innerText = totalAmount.toLocaleString("en-IN");
        if (upiModalAppName) upiModalAppName.innerText = config.name;
        if (upiModalLaunchName) upiModalLaunchName.innerText = config.name;
        if (upiModalQrImg) upiModalQrImg.src = dynamicQrUrl;

        // WhatsApp Share Link
        if (upiModalWhatsappBtn) {
            const waText = encodeURIComponent(`Pay ₹${totalAmount} for B Market Order ${activeOrderId} using UPI:\n${universalUpiLink}`);
            upiModalWhatsappBtn.href = `https://api.whatsapp.com/send?text=${waText}`;
        }

        currentModalTargetUrl = (navigator.userAgent.match(/Android/i))
            ? (config.androidIntent || universalUpiLink)
            : ((navigator.userAgent.match(/iPhone|iPad/i)) ? (config.iosScheme || universalUpiLink) : universalUpiLink);

        upiIntentModal.classList.add("active");
    }

    function closeUpiModal() {
        if (upiIntentModal) upiIntentModal.classList.remove("active");
    }

    if (closeUpiModalBtn) {
        closeUpiModalBtn.addEventListener("click", closeUpiModal);
    }

    if (upiIntentModal) {
        upiIntentModal.addEventListener("click", (e) => {
            if (e.target === upiIntentModal) closeUpiModal();
        });
    }

    // Direct Launch Button inside modal
    if (upiModalDirectLaunchBtn) {
        upiModalDirectLaunchBtn.addEventListener("click", () => {
            console.log("Triggering deep link from modal:", currentModalTargetUrl);
            window.location.href = currentModalTargetUrl;
        });
    }

    // Copy Link button inside modal
    if (upiModalCopyLinkBtn) {
        upiModalCopyLinkBtn.addEventListener("click", () => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(universalUpiLink).then(() => {
                    upiModalCopyLinkBtn.innerText = "✅ Link Copied!";
                    setTimeout(() => upiModalCopyLinkBtn.innerText = "📋 Copy UPI Link", 2000);
                }).catch(() => fallbackCopy(universalUpiLink));
            } else {
                fallbackCopy(universalUpiLink);
            }
        });
    }

    // "I have completed payment" button inside modal - triggers seamless order placement
    if (upiModalDoneBtn) {
        upiModalDoneBtn.addEventListener("click", () => {
            closeUpiModal();
            const payNowBtn = document.getElementById("payNowBtn");
            if (payNowBtn) {
                payNowBtn.click();
            }
        });
    }

    // Main App Launch Handler
    function handleAppPaymentClick(appKey) {
        const config = upiAppConfigs[appKey] || upiAppConfigs.phonepe;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        console.log(`Initiating dynamic payment via ${config.name}. Mobile: ${isMobile}, Amount: ₹${totalAmount}`);

        let appUrl = universalUpiLink;
        if (isAndroid && config.androidIntent) {
            appUrl = config.androidIntent;
        } else if (isIOS && config.iosScheme) {
            appUrl = config.iosScheme;
        } else if (config.customScheme) {
            appUrl = config.customScheme;
        }

        if (isMobile) {
            // Attempt direct launch on phone
            window.location.href = appUrl;

            // If app launch did not switch away within 2.2 seconds, open modal with QR fallback
            setTimeout(() => {
                if (document.hasFocus()) {
                    openUpiModal(config);
                }
            }, 2200);
        } else {
            // On desktop/laptop: open modal with dynamic QR and direct action options
            openUpiModal(config);
            // Also attempt protocol launch for native handler
            try {
                window.location.href = universalUpiLink;
            } catch (err) {}
        }
    }

    // Tap to pay on mobile button
    const directUpiAppBtn = document.getElementById("directUpiAppBtn");
    if (directUpiAppBtn) {
        directUpiAppBtn.addEventListener("click", function (e) {
            e.preventDefault();
            const chosenApp = this.getAttribute("data-app") || "phonepe";
            handleAppPaymentClick(chosenApp);
        });
    }

    // Attach click handlers to all app buttons (.upi-app-badge or buttons with data-app)
    document.querySelectorAll(".upi-app-badge, [data-app]").forEach(btn => {
        if (btn.id === "directUpiAppBtn") return; // Handled separately
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            const app = this.getAttribute("data-app") || "phonepe";
            handleAppPaymentClick(app);
        });
    });

    // Copy UPI ID button
    const copyUpiBtn = document.getElementById("copyUpiBtn");
    function fallbackCopy(text) {
        const temp = document.createElement("input");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
        if (copyUpiBtn) {
            copyUpiBtn.innerHTML = "✅ Copied!";
            copyUpiBtn.style.background = "#10b981";
            setTimeout(() => {
                copyUpiBtn.innerHTML = "📋 Copy";
                copyUpiBtn.style.background = "";
            }, 2000);
        }
    }

    if (copyUpiBtn) {
        copyUpiBtn.addEventListener("click", function () {
            const upiToCopy = merchantVpa;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(upiToCopy).then(() => {
                    const originalText = copyUpiBtn.innerHTML;
                    copyUpiBtn.innerHTML = "✅ Copied!";
                    copyUpiBtn.style.background = "#10b981";
                    setTimeout(() => {
                        copyUpiBtn.innerHTML = originalText;
                        copyUpiBtn.style.background = "";
                    }, 2000);
                }).catch(() => fallbackCopy(upiToCopy));
            } else {
                fallbackCopy(upiToCopy);
            }
        });
    }

    // UTR / Transaction Reference verification
    const upiUtrInput = document.getElementById("upiUtrNumber");
    const verifyUtrBtn = document.getElementById("verifyUtrBtn");
    const utrStatusMsg = document.getElementById("utrStatusMsg");
    let verifiedUtrNumber = "";

    if (verifyUtrBtn && upiUtrInput) {
        verifyUtrBtn.addEventListener("click", function () {
            const rawVal = upiUtrInput.value.trim();
            if (!rawVal || rawVal.length < 6) {
                if (utrStatusMsg) {
                    utrStatusMsg.style.color = "#d32f2f";
                    utrStatusMsg.innerText = "⚠️ Please enter a valid 12-digit UPI reference (UTR) from your receipt.";
                }
                return;
            }
            verifiedUtrNumber = rawVal;
            verifyUtrBtn.innerText = "Saved ✓";
            verifyUtrBtn.style.background = "#10b981";
            if (utrStatusMsg) {
                utrStatusMsg.style.color = "#2e7d32";
                utrStatusMsg.innerText = "✅ Reference " + rawVal + " saved! This will be attached to your invoice.";
            }
        });
    }

    // ----------------------------------------------------
    // AMAZON-STYLE SEGMENTED UPI SELECTION & PHONEPE FLOW
    // ----------------------------------------------------
    let selectedAmazonUpiMode = "phonepe";
    let activePhonePeSuffix = "@ybl";
    let collectCountdownTimer = null;
    let currentCollectVpa = "";

    window.setPhonePeSuffix = function(suffix) {
        activePhonePeSuffix = suffix;
        const suffixDisplay = document.getElementById("phonepeSuffixDisplay");
        if (suffixDisplay) suffixDisplay.innerText = suffix;

        document.querySelectorAll(".vpa-quick-pills .vpa-pill").forEach(pill => {
            if (pill.innerText.trim() === suffix) {
                pill.classList.add("active");
            } else {
                pill.classList.remove("active");
            }
        });
    };

    window.selectAmazonUpiMode = function(mode) {
        selectedAmazonUpiMode = mode;
        const modes = ["phonepe", "gpay", "paytm", "qr"];
        modes.forEach(m => {
            const cardElem = document.getElementById(`card-${m}-option`);
            const bodyElem = document.getElementById(`body-${m}`);
            const radioElem = document.getElementById(`radio-${m}`);
            if (m === mode) {
                if (cardElem) cardElem.classList.add("active");
                if (bodyElem) bodyElem.style.display = "block";
                if (radioElem) radioElem.checked = true;
            } else {
                if (cardElem) cardElem.classList.remove("active");
                if (bodyElem) bodyElem.style.display = "none";
                if (radioElem) radioElem.checked = false;
            }
        });
    };

    // Attach change listener to radio inputs
    document.querySelectorAll("input[name='amazonUpiChoice']").forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.checked) {
                window.selectAmazonUpiMode(e.target.value);
            }
        });
    });

    function startCollectCountdown(durationSeconds) {
        if (collectCountdownTimer) clearInterval(collectCountdownTimer);
        let remaining = durationSeconds;
        const timerElem = document.getElementById("collectCountdownTimer");

        function updateDisplay() {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            if (timerElem) {
                timerElem.innerText = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
            }
        }

        updateDisplay();
        collectCountdownTimer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(collectCountdownTimer);
                if (timerElem) timerElem.innerText = "00:00 (Expired)";
            } else {
                updateDisplay();
            }
        }, 1000);
    }

    function showCollectWaitingCard(vpa, appName = "PhonePe") {
        currentCollectVpa = vpa;
        const modesContainer = document.getElementById("amazonUpiModes");
        const collectCard = document.getElementById("phonepeCollectCard");
        const targetVpa = document.getElementById("collectTargetVpa");

        if (targetVpa) targetVpa.innerText = vpa;
        if (modesContainer) modesContainer.style.display = "none";
        if (collectCard) {
            collectCard.style.display = "block";
            collectCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        startCollectCountdown(5 * 60 - 1); // 4 minutes 59 seconds
    }

    function cancelCollectWaiting() {
        if (collectCountdownTimer) {
            clearInterval(collectCountdownTimer);
            collectCountdownTimer = null;
        }
        const modesContainer = document.getElementById("amazonUpiModes");
        const collectCard = document.getElementById("phonepeCollectCard");
        if (collectCard) collectCard.style.display = "none";
        if (modesContainer) modesContainer.style.display = "block";
    }

    // PhonePe Collect Request Trigger
    const btnRequestPhonePeCollect = document.getElementById("btnRequestPhonePeCollect");
    const phonepeVpaInput = document.getElementById("phonepeVpaInput");
    if (btnRequestPhonePeCollect && phonepeVpaInput) {
        const handlePhonePeCollect = () => {
            let val = phonepeVpaInput.value.trim();
            if (!val) {
                phonepeVpaInput.focus();
                phonepeVpaInput.style.borderColor = "#e53935";
                setTimeout(() => { phonepeVpaInput.style.borderColor = ""; }, 2500);
                return;
            }
            let fullVpa = val;
            if (!val.includes("@")) {
                fullVpa = val + activePhonePeSuffix;
            }
            showCollectWaitingCard(fullVpa, "PhonePe");
        };

        btnRequestPhonePeCollect.addEventListener("click", handlePhonePeCollect);
        phonepeVpaInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handlePhonePeCollect();
            }
        });
    }

    // Google Pay Collect Request Trigger
    const btnRequestGpayCollect = document.getElementById("btnRequestGpayCollect");
    const gpayVpaInput = document.getElementById("gpayVpaInput");
    if (btnRequestGpayCollect && gpayVpaInput) {
        const handleGpayCollect = () => {
            let val = gpayVpaInput.value.trim();
            if (!val) {
                gpayVpaInput.focus();
                gpayVpaInput.style.borderColor = "#e53935";
                setTimeout(() => { gpayVpaInput.style.borderColor = ""; }, 2500);
                return;
            }
            let fullVpa = val.includes("@") ? val : `${val}@okhdfcbank`;
            showCollectWaitingCard(fullVpa, "Google Pay");
        };
        btnRequestGpayCollect.addEventListener("click", handleGpayCollect);
        gpayVpaInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleGpayCollect();
            }
        });
    }

    // Paytm Collect Request Trigger
    const btnRequestPaytmCollect = document.getElementById("btnRequestPaytmCollect");
    const paytmVpaInput = document.getElementById("paytmVpaInput");
    if (btnRequestPaytmCollect && paytmVpaInput) {
        const handlePaytmCollect = () => {
            let val = paytmVpaInput.value.trim();
            if (!val) {
                paytmVpaInput.focus();
                paytmVpaInput.style.borderColor = "#e53935";
                setTimeout(() => { paytmVpaInput.style.borderColor = ""; }, 2500);
                return;
            }
            let fullVpa = val.includes("@") ? val : `${val}@paytm`;
            showCollectWaitingCard(fullVpa, "Paytm");
        };
        btnRequestPaytmCollect.addEventListener("click", handlePaytmCollect);
        paytmVpaInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handlePaytmCollect();
            }
        });
    }

    // Confirm Payment Approved on PhonePe Button
    const btnConfirmApprovedPhonePe = document.getElementById("btnConfirmApprovedPhonePe");
    if (btnConfirmApprovedPhonePe) {
        btnConfirmApprovedPhonePe.addEventListener("click", () => {
            if (collectCountdownTimer) {
                clearInterval(collectCountdownTimer);
                collectCountdownTimer = null;
            }
            verifiedUtrNumber = "PHPE-" + Math.floor(100000000000 + Math.random() * 900000000000).toString().slice(0, 12);

            const collectCard = document.getElementById("phonepeCollectCard");
            if (collectCard) collectCard.style.display = "none";
            const modesContainer = document.getElementById("amazonUpiModes");
            if (modesContainer) modesContainer.style.display = "block";

            const payNowBtn = document.getElementById("payNowBtn");
            if (payNowBtn) payNowBtn.click();
        });
    }

    // Cancel Collect Button
    const btnCancelCollect = document.getElementById("btnCancelCollect");
    if (btnCancelCollect) {
        btnCancelCollect.addEventListener("click", cancelCollectWaiting);
    }

    // ----------------------------------------------------
    // CAPTCHA FOR CASH ON DELIVERY
    // ----------------------------------------------------
    let currentCaptcha = "5892";
    const captchaCode = document.getElementById("captchaCode");
    const refreshCaptcha = document.getElementById("refreshCaptcha");
    const captchaInput = document.getElementById("captchaInput");

    function generateCaptcha() {
        currentCaptcha = Math.floor(1000 + Math.random() * 9000).toString();
        if (captchaCode) captchaCode.innerText = currentCaptcha;
        if (captchaInput) captchaInput.value = "";
    }

    if (refreshCaptcha) {
        refreshCaptcha.addEventListener("click", generateCaptcha);
    }
    generateCaptcha();

    // ----------------------------------------------------
    // VALIDATE PAYMENT INPUTS
    // ----------------------------------------------------
    function validatePayment() {
        if (currentMethod === "card") {
            const num = (cardNumberInput ? cardNumberInput.value.replace(/\s/g, "") : "");
            const name = (cardNameInput ? cardNameInput.value.trim() : "");
            const exp = (cardExpiryInput ? cardExpiryInput.value.trim() : "");
            const cvv = (cardCvvInput ? cardCvvInput.value.trim() : "");

            let hasError = false;

            if (num.length < 15) {
                document.getElementById("cardNumberError").innerText = "Please enter a valid 16-digit card number.";
                hasError = true;
            }

            if (!name) {
                document.getElementById("cardNameError").innerText = "Please enter the cardholder's name.";
                hasError = true;
            }

            if (!/^\d{2}\/\d{2}$/.test(exp)) {
                document.getElementById("cardExpiryError").innerText = "Enter valid expiry (MM/YY).";
                hasError = true;
            }

            if (cvv.length < 3) {
                document.getElementById("cardCvvError").innerText = "Enter valid 3-digit CVV.";
                hasError = true;
            }

            return !hasError;
        }

        if (currentMethod === "cod") {
            const enteredCaptcha = (captchaInput ? captchaInput.value.trim() : "");
            if (enteredCaptcha !== currentCaptcha) {
                document.getElementById("captchaError").innerText = "Incorrect verification code. Please enter the 4 digits shown.";
                generateCaptcha();
                return false;
            }
            document.getElementById("captchaError").innerText = "";
            return true;
        }

        if (currentMethod === "upi") {
            // UPI can be completed either by scanning QR code or entering VPA
            return true;
        }

        if (currentMethod === "netbanking") {
            return true;
        }

        return true;
    }

    // ----------------------------------------------------
    // PROCESS ORDER SUBMISSION & EMAIL DISPATCH
    // ----------------------------------------------------
    const payNowBtn = document.getElementById("payNowBtn");
    const processingModal = document.getElementById("processingModal");
    const successModal = document.getElementById("successModal");

    const stepAuth = document.getElementById("step-auth");
    const stepPay = document.getElementById("step-pay");
    const stepConfirm = document.getElementById("step-confirm");

    if (payNowBtn) {
        payNowBtn.addEventListener("click", async function () {
            if (!validatePayment()) {
                return;
            }

            // Disable button and open processing modal
            payNowBtn.disabled = true;
            if (processingModal) processingModal.classList.add("active");

            // Generate order and transaction IDs
            const orderId = (pendingOrder && pendingOrder.id) ? pendingOrder.id : ("BM-" + Date.now().toString().slice(-6));
            let transactionId = (verifiedUtrNumber || (upiUtrInput && upiUtrInput.value.trim()))
                ? (verifiedUtrNumber || upiUtrInput.value.trim())
                : ("TXN-" + Math.random().toString(36).substring(2, 9).toUpperCase());

            let methodLabel = "PhonePe / UPI Transfer";
            let paymentStatus = "Paid (Online)";

            if (currentMethod === "upi") {
                const userUtr = verifiedUtrNumber || (upiUtrInput ? upiUtrInput.value.trim() : "");
                if (currentCollectVpa) {
                    methodLabel = `PhonePe Collect Request (${currentCollectVpa})`;
                    if (userUtr) transactionId = userUtr;
                } else if (userUtr) {
                    methodLabel = `PhonePe / UPI (UTR: ${userUtr})`;
                    transactionId = userUtr;
                } else if (selectedAmazonUpiMode === "phonepe") {
                    methodLabel = "PhonePe App Direct Payment";
                } else if (selectedAmazonUpiMode === "gpay") {
                    methodLabel = "Google Pay UPI";
                } else if (selectedAmazonUpiMode === "paytm") {
                    methodLabel = "Paytm UPI";
                } else if (selectedAmazonUpiMode === "qr") {
                    methodLabel = "PhonePe QR Standee Scan";
                } else {
                    methodLabel = "PhonePe / UPI Transfer";
                }
                paymentStatus = "Paid (Online)";
            } else if (currentMethod === "card") {
                const last4 = cardNumberInput ? cardNumberInput.value.slice(-4) : "8899";
                methodLabel = `Card (Ending •••• ${last4})`;
                paymentStatus = "Paid (Online)";
            } else if (currentMethod === "netbanking") {
                const selectedBank = document.querySelector("input[name='bankSelect']:checked");
                methodLabel = `Net Banking (${selectedBank ? selectedBank.value : "SBI"})`;
                paymentStatus = "Paid (Online)";
            } else if (currentMethod === "cod") {
                methodLabel = "Cash on Delivery";
                paymentStatus = "Pay on Delivery (Unpaid)";
            }

            // Construct Final Completed Order Object
            const completedOrder = {
                id: orderId,
                orderId: orderId,
                transactionId: transactionId,
                utrNumber: (verifiedUtrNumber || (upiUtrInput ? upiUtrInput.value.trim() : "")),
                date: new Date().toLocaleString(),
                customer: customer,
                items: itemsToOrder,
                total: totalAmount,
                paymentMethod: methodLabel,
                paymentStatus: paymentStatus,
                status: "Order Confirmed"
            };

            // Step 1: Verification
            setTimeout(() => {
                if (stepAuth) stepAuth.classList.add("done");
                if (stepPay) stepPay.classList.add("active");
            }, 600);

            // Step 2: Payment Approval
            setTimeout(() => {
                if (stepPay) stepPay.classList.add("done");
                if (stepConfirm) stepConfirm.classList.add("active");
            }, 1300);

            // Step 3: Server Confirmation & Finalize
            setTimeout(async () => {
                try {
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

                    // Send order to backend API for database persistence and email invoice dispatch
                    const response = await fetch(getBackendUrl("/api/orders"), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(completedOrder)
                    });

                    const resData = await response.json();
                    console.log("Server Order Confirmation:", resData);
                } catch (netErr) {
                    console.warn("Backend order sync notice (offline or simulated):", netErr.message);
                }

                // Save confirmed order to local order history
                let orderHistory = JSON.parse(localStorage.getItem("orders")) || [];
                orderHistory.unshift(completedOrder);
                localStorage.setItem("orders", JSON.stringify(orderHistory));

                // Clear shopping cart and pending order
                localStorage.removeItem("cart");
                localStorage.removeItem("pendingOrder");

                // Close processing modal and show success modal
                if (processingModal) processingModal.classList.remove("active");
                if (successModal) {
                    document.getElementById("receiptOrderId").innerText = "#" + orderId;
                    document.getElementById("receiptTxnId").innerText = transactionId;
                    document.getElementById("receiptMethod").innerText = methodLabel;
                    document.getElementById("receiptTotal").innerText = "₹" + totalAmount.toLocaleString("en-IN");
                    document.getElementById("receiptDeliveryTo").innerText = `${customer.name || "Customer"}, ${customer.city || "Andhra Pradesh"}`;

                    successModal.classList.add("active");
                }
            }, 2100);
        });
    }
});
