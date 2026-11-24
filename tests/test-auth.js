import https from "https";

function postJson(url, payload) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const data = JSON.stringify(payload);
        const req = https.request({
            hostname: parsed.hostname,
            port: 443,
            path: parsed.pathname,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
                "Accept": "application/json"
            }
        }, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log("Testing POST /.netlify/functions/auth/login with validation check...");
    const res = await postJson("https://bmrket.netlify.app/.netlify/functions/auth/login", {
        email: "test@example.com",
        password: "wrongpassword123"
    });
    console.log("Login Endpoint Response Status:", res.status);
    console.log("Login Endpoint Body:", JSON.stringify(res.body, null, 2));
}

run();
