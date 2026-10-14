// ========================================================
// B MARKET - CENTRALIZED BACKEND CONFIGURATION
// Supports dynamic host resolution for Laptop, Mobile, and LAN
// ========================================================

(function (global) {
    function resolveBackendBaseUrl() {
        const loc = typeof window !== "undefined" ? window.location : null;
        let host = loc && loc.hostname ? loc.hostname.trim() : "";

        // If accessed through browser (localhost, 127.0.0.1, or local LAN IP like 192.168.x.x)
        if (host && host !== "" && host !== "0.0.0.0") {
            const protocol = loc.protocol === "https:" ? "https:" : "http:";
            return `${protocol}//${host}:5000`;
        }

        // Fallback for file:/// protocol or environments where hostname is empty
        return "http://localhost:5000";
    }

    function resolveUrl(path) {
        const cleanPath = path ? (path.startsWith("/") ? path : "/" + path) : "";
        return `${resolveBackendBaseUrl()}${cleanPath}`;
    }

    if (typeof window !== "undefined") {
        window.getBMarketApiUrl = resolveUrl;
        window.B_MARKET_API_BASE = resolveBackendBaseUrl();
    }
})(typeof window !== "undefined" ? window : globalThis);
