// ========================================================
// B MARKET - CENTRALIZED FRONTEND API CONFIGURATION
// Supports Online Hosting (Netlify, Render, Railway) & Localhost
// ========================================================

(function (global) {
    "use strict";

    // Default public backend URL if no environment variable or meta tag is set.
    // When your backend is deployed online (e.g., Render, Railway, Fly.io),
    // you can configure your public URL in any of these ways:
    //   1. In Netlify / Window: window.BMARKET_BACKEND_URL = "https://your-backend.onrender.com"
    //   2. In HTML <head>: <meta name="bmarket-backend-url" content="https://your-backend.onrender.com">
    //   3. In Browser console: setBMarketBackendUrl("https://your-backend.onrender.com")
    //   4. Via Netlify proxy (_redirects / netlify.toml) forwarding /api/* to your backend
    const DEFAULT_PUBLIC_BACKEND_URL = "";

    function getMetaBackendUrl() {
        if (typeof document === "undefined") return "";
        const meta =
            document.querySelector('meta[name="bmarket-backend-url"]') ||
            document.querySelector('meta[name="backend-url"]');
        return meta && meta.content ? meta.content.trim() : "";
    }

    function getStorageBackendUrl() {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                return (
                    window.localStorage.getItem("BMARKET_BACKEND_URL") ||
                    window.localStorage.getItem("BACKEND_URL") ||
                    ""
                ).trim();
            }
        } catch (e) {
            // localStorage may be inaccessible in certain sandboxed frames
        }
        return "";
    }

    function getRuntimeEnvBackendUrl() {
        if (typeof window !== "undefined") {
            if (window.BMARKET_BACKEND_URL && typeof window.BMARKET_BACKEND_URL === "string") {
                return window.BMARKET_BACKEND_URL.trim();
            }
            if (window.__ENV__ && window.__ENV__.BACKEND_URL) {
                return window.__ENV__.BACKEND_URL.trim();
            }
            if (window.ENV && window.ENV.BACKEND_URL) {
                return window.ENV.BACKEND_URL.trim();
            }
        }
        if (typeof process !== "undefined" && process.env) {
            const envUrl =
                process.env.BACKEND_URL ||
                process.env.VITE_BACKEND_URL ||
                process.env.REACT_APP_BACKEND_URL ||
                process.env.NETLIFY_PUBLIC_BACKEND_URL;
            if (envUrl) return String(envUrl).trim();
        }
        return "";
    }

    function isLocalHost(hostname) {
        if (!hostname) return true;
        const h = hostname.toLowerCase();
        return (
            h === "localhost" ||
            h === "127.0.0.1" ||
            h === "0.0.0.0" ||
            h === "[::1]" ||
            h.endsWith(".local") ||
            h.startsWith("192.168.") ||
            h.startsWith("10.") ||
            /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
        );
    }

    function resolveBackendBaseUrl() {
        const loc = typeof window !== "undefined" ? window.location : null;
        const hostname = loc && loc.hostname ? loc.hostname.trim() : "";
        const protocol = loc && loc.protocol === "https:" ? "https:" : "http:";

        // Priority 1: Window / process.env runtime environment variable
        const envUrl = getRuntimeEnvBackendUrl();
        if (envUrl) return envUrl.replace(/\/+$/, "");

        // Priority 2: Meta tag in HTML head (<meta name="bmarket-backend-url" content="...">)
        const metaUrl = getMetaBackendUrl();
        if (metaUrl) return metaUrl.replace(/\/+$/, "");

        // Priority 3: LocalStorage override (instant testing without redeploying)
        const storageUrl = getStorageBackendUrl();
        if (storageUrl) return storageUrl.replace(/\/+$/, "");

        // Priority 4: Default public URL constant if specified
        if (DEFAULT_PUBLIC_BACKEND_URL) {
            return DEFAULT_PUBLIC_BACKEND_URL.replace(/\/+$/, "");
        }

        // Priority 5: Running directly on backend server port 5000
        if (loc && loc.port === "5000") {
            return "";
        }

        // Priority 6: Local development environment (Live Server, file://, etc.)
        if (isLocalHost(hostname)) {
            // Local machine or mobile device testing on local LAN
            if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "0.0.0.0") {
                return `${protocol}//${hostname}:5000`;
            }
            return "http://localhost:5000";
        }

        // Priority 7: Hosted on Netlify or custom domain
        // When hosted on Netlify, return empty string "" so that requests
        // route relatively (/api/...) and are proxied by Netlify's _redirects/netlify.toml
        // directly to the online backend without CORS or mixed-content issues!
        return "";
    }

    function resolveUrl(path) {
        const base = resolveBackendBaseUrl();
        const cleanPath = path ? (path.startsWith("/") ? path : "/" + path) : "";
        if (!base) {
            return cleanPath;
        }
        return `${base}${cleanPath}`;
    }

    if (typeof window !== "undefined") {
        window.getBMarketApiUrl = resolveUrl;
        window.getBMarketApiBase = resolveBackendBaseUrl;
        window.B_MARKET_API_BASE = resolveBackendBaseUrl();

        // Helper to configure public backend URL from browser console
        window.setBMarketBackendUrl = function (url) {
            try {
                if (url && typeof url === "string") {
                    window.localStorage.setItem("BMARKET_BACKEND_URL", url.trim());
                    console.log("✅ B Market backend URL set to:", url.trim());
                } else {
                    window.localStorage.removeItem("BMARKET_BACKEND_URL");
                    console.log("🔄 Reset B Market backend URL to default resolution.");
                }
                window.B_MARKET_API_BASE = resolveBackendBaseUrl();
            } catch (e) {
                console.error("Failed to update backend URL in localStorage:", e);
            }
            return resolveBackendBaseUrl();
        };
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            resolveBackendBaseUrl,
            resolveUrl
        };
    }
})(typeof window !== "undefined" ? window : globalThis);
