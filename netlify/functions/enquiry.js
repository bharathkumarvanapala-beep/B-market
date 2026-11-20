import nodemailer from "nodemailer";
import { connectToDatabase, isDbConnected } from "./utils/db.js";
import Enquiry from "./models/Enquiry.js";

const CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function sanitizeText(str) {
    if (!str || typeof str !== "string") return "";
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<[^>]+>/g, "")
        .trim();
}

export async function handler(event, context) {
    // Enable connection re-use in serverless runtime
    if (context) {
        context.callbackWaitsForEmptyEventLoop = false;
    }

    // 1. Handle CORS Preflight
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204,
            headers: CORS_HEADERS,
            body: ""
        };
    }

    const path = (event.path || "").toLowerCase();

    // 2. GET /status route
    if (event.httpMethod === "GET" && path.endsWith("/status")) {
        const emailUser = (process.env.EMAIL_USER || "bharathkumarvanapala@gmail.com").trim();
        const rawPass = process.env.EMAIL_PASS || "";
        const cleanPass = rawPass.replace(/\s+/g, "").trim();
        const isEmailReady = Boolean(
            cleanPass &&
            cleanPass !== "your_16_character_app_password_here" &&
            cleanPass.length >= 8
        );

        let dbStatus = "disconnected";
        try {
            await connectToDatabase();
            dbStatus = isDbConnected() ? "connected" : "disconnected";
        } catch (e) {
            dbStatus = "error: " + e.message;
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                service: "B Market Serverless Enquiry Function",
                database: dbStatus,
                emailConfigured: isEmailReady,
                recipient: emailUser,
                timestamp: new Date().toISOString()
            })
        };
    }

    // 3. GET / (List latest enquiries for admin/farmer)
    if (event.httpMethod === "GET") {
        try {
            await connectToDatabase();
            if (!isDbConnected()) {
                return {
                    statusCode: 503,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: false,
                        message: "Database service is currently disconnected."
                    })
                };
            }

            const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(100);
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    count: enquiries.length,
                    enquiries
                })
            };
        } catch (err) {
            console.error("Enquiry fetch error:", err);
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    message: "Failed to retrieve enquiries: " + err.message
                })
            };
        }
    }

    // 4. POST / (Submit and save new enquiry)
    if (event.httpMethod === "POST") {
        try {
            let body = {};
            try {
                body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || {});
            } catch (pErr) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: false,
                        message: "Invalid JSON request payload."
                    })
                };
            }

            const name = sanitizeText(body.name);
            const email = (body.email || "").toString().toLowerCase().trim();
            const phone = sanitizeText(body.phone);
            const message = sanitizeText(body.message);

            // Validation
            if (!name || name.length < 2) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: false,
                        message: "Please enter your full name (at least 2 characters)."
                    })
                };
            }

            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!email || !emailRegex.test(email)) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: false,
                        message: "Please enter a valid email address."
                    })
                };
            }

            if (!message || message.length < 3) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: false,
                        message: "Please write your enquiry message (at least 3 characters)."
                    })
                };
            }

            // Extract client metadata
            const headers = event.headers || {};
            const ipAddress = headers["x-forwarded-for"] || headers["client-ip"] || "";
            const userAgent = headers["user-agent"] || "";

            // Connect to MongoDB
            try {
                await connectToDatabase();
            } catch (dbErr) {
                console.error("MongoDB connection failed:", dbErr.message);
                return {
                    statusCode: 503,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: false,
                        message: "Database service is temporarily unavailable. Your enquiry could not be saved. Please try again shortly."
                    })
                };
            }

            // Save directly to MongoDB
            const savedEnquiry = await Enquiry.create({
                name,
                email,
                phone,
                message,
                ipAddress: typeof ipAddress === "string" ? ipAddress.split(",")[0].trim() : "",
                userAgent: typeof userAgent === "string" ? userAgent.slice(0, 200) : "",
                status: "NEW"
            });

            console.log(`[Netlify Function] Stored enquiry #${savedEnquiry._id} in MongoDB from ${name} (${email})`);

            // Email Notification via Nodemailer (asynchronous / best-effort)
            const emailUser = (process.env.EMAIL_USER || "bharathkumarvanapala@gmail.com").trim();
            const rawPass = process.env.EMAIL_PASS || "";
            const emailPass = rawPass.replace(/\s+/g, "").trim();
            let emailSent = false;

            if (emailPass && emailPass !== "your_16_character_app_password_here" && emailPass.length >= 8) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: emailUser,
                            pass: emailPass
                        }
                    });

                    const submissionDate = new Date().toLocaleString();

                    await transporter.sendMail({
                        from: `"B Market" <${emailUser}>`,
                        to: emailUser,
                        replyTo: email,
                        subject: `New B Market Enquiry from ${name} [${savedEnquiry._id.toString().slice(-6)}]`,
                        text: `
New B Market Customer Enquiry (Saved in MongoDB)

Enquiry ID: ${savedEnquiry._id}
Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Message:
${message}

---
Submitted at: ${submissionDate}
Reply directly to this email to contact ${name} (${email}).
                        `,
                        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #2e7d32; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px;">B Market — Direct Farmer Enquiry</h2>
        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Fresh Farm Products Directly from Tribal & Local Growers</p>
    </div>
    <div style="padding: 24px; background-color: #ffffff;">
        <div style="background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px;">
            <p style="margin: 0; font-size: 13px; color: #2e7d32; font-weight: bold;">
                💾 Stored in MongoDB: #${savedEnquiry._id}
            </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #555;">Customer Name:</td>
                <td style="padding: 8px 0; color: #111;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px 0; color: #111;"><a href="mailto:${email}" style="color: #2e7d32;">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td>
                <td style="padding: 8px 0; color: #111;">${phone || "Not provided"}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold; vertical-align: top; color: #555;">Message:</td>
                <td style="padding: 8px 0; color: #222; line-height: 1.5; white-space: pre-wrap;">${message}</td>
            </tr>
        </table>
        <p style="font-size: 12px; color: #777; margin: 0; text-align: center;">Submitted on ${submissionDate}</p>
    </div>
</div>
                        `
                    });

                    emailSent = true;
                    await Enquiry.findByIdAndUpdate(savedEnquiry._id, { emailDelivered: true });
                } catch (emailErr) {
                    console.warn("[Netlify Function] Email notification notice:", emailErr.message);
                }
            }

            return {
                statusCode: 201,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    message: "Enquiry submitted and saved successfully! Our farm team will contact you soon.",
                    enquiryId: savedEnquiry._id,
                    emailDispatched: emailSent
                })
            };
        } catch (err) {
            console.error("Enquiry submission handler error:", err);
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error: " + err.message
                })
            };
        }
    }

    return {
        statusCode: 405,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: "Method Not Allowed" })
    };
}

