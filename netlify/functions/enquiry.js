import nodemailer from "nodemailer";
import { connectToDatabase, isDbConnected, getSanitizedDbInfo } from "./utils/db.js";
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
        const rawPass = process.env.EMAIL_PASS || "oiufzihvumlfcsen";
        const cleanPass = rawPass.replace(/\s+/g, "").trim();
        const isEmailReady = Boolean(
            cleanPass &&
            cleanPass !== "your_16_character_app_password_here" &&
            cleanPass.length >= 8
        );

        let dbStatus = "disconnected";
        let dbError = null;
        try {
            await connectToDatabase();
            dbStatus = isDbConnected() ? "connected" : "disconnected";
        } catch (e) {
            dbStatus = "error";
            dbError = e.message;
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                service: "B Market Serverless Enquiry Function",
                database: dbStatus,
                databaseDiagnostics: getSanitizedDbInfo(),
                databaseError: dbError,
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

    // 4. POST / (Submit and send enquiry)
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
            const submissionDate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
            const tempEnquiryId = "ENQ-" + Date.now().toString().slice(-6);

            // 1. Send Email Notification to Owner's Mobile Gmail Immediately!
            const emailUser = (process.env.EMAIL_USER || "bharathkumarvanapala@gmail.com").trim();
            const rawPass = process.env.EMAIL_PASS || "oiufzihvumlfcsen";
            const emailPass = rawPass.replace(/\s+/g, "").trim();
            let emailSent = false;
            let emailErrorMsg = null;

            if (emailPass && emailPass.length >= 8) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: emailUser,
                            pass: emailPass
                        }
                    });

                    await transporter.sendMail({
                        from: `"B Market Farmer Enquiry" <${emailUser}>`,
                        to: emailUser,
                        replyTo: email,
                        subject: `🌾 New B Market Enquiry from ${name} [${tempEnquiryId}]`,
                        text: `
New B Market Customer Enquiry

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
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <div style="background-color: #2e7d32; color: #ffffff; padding: 22px; text-align: center;">
        <h2 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">B Market — Direct Farmer Enquiry</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Fresh Farm Products Directly from Growers</p>
    </div>
    <div style="padding: 26px; background-color: #ffffff;">
        <div style="background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #2e7d32; font-weight: bold;">
                📬 Direct Enquiry: ${tempEnquiryId}
            </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px 0; font-weight: bold; width: 130px; color: #555555;">Customer Name:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 15px;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px 0; font-weight: bold; color: #555555;">Email:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 15px;">
                    <a href="mailto:${email}" style="color: #2e7d32; text-decoration: none; font-weight: 500;">${email}</a>
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 10px 0; font-weight: bold; color: #555555;">Phone:</td>
                <td style="padding: 10px 0; color: #111111; font-size: 15px;">
                    ${phone ? `<a href="tel:${phone}" style="color: #2e7d32;">${phone}</a>` : "Not provided"}
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 0; font-weight: bold; vertical-align: top; color: #555555;">Message:</td>
                <td style="padding: 10px 0; color: #222222; line-height: 1.6; font-size: 15px; white-space: pre-wrap;">${message}</td>
            </tr>
        </table>
        <p style="font-size: 12px; color: #777; margin: 0; text-align: center;">Submitted on ${submissionDate}</p>
        <p style="margin: 18px 0 0 0; font-size: 13px; color: #666666; background: #e8f5e9; padding: 10px 14px; border-radius: 6px;">
            💡 <strong>Quick Reply:</strong> Click "Reply" in your email client to email <strong>${name}</strong> directly at <a href="mailto:${email}" style="color: #2e7d32;">${email}</a>.
        </p>
    </div>
</div>
                        `
                    });

                    emailSent = true;
                    console.log(`[Netlify Function] Sent Gmail notification for enquiry from ${name} (${email})`);
                } catch (emailErr) {
                    emailErrorMsg = emailErr.message;
                    console.warn("[Netlify Function] Email notification notice:", emailErr.message);
                }
            }

            // 2. Best-Effort Database Persistence in MongoDB
            let savedEnquiry = null;
            let dbNotice = null;
            try {
                await connectToDatabase();
                if (isDbConnected()) {
                    savedEnquiry = await Enquiry.create({
                        name,
                        email,
                        phone,
                        message,
                        ipAddress: typeof ipAddress === "string" ? ipAddress.split(",")[0].trim() : "",
                        userAgent: typeof userAgent === "string" ? userAgent.slice(0, 200) : "",
                        status: "NEW",
                        emailDelivered: emailSent
                    });
                    console.log(`[Netlify Function] Stored enquiry #${savedEnquiry._id} in MongoDB from ${name}`);
                }
            } catch (dbErr) {
                console.warn("[Netlify Function] Database storage notice:", dbErr.message);
                dbNotice = dbErr.message;
            }

            // If email was sent OR database saved it, return SUCCESS!
            if (emailSent || savedEnquiry) {
                return {
                    statusCode: 201,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: true,
                        message: "Enquiry submitted successfully! A notification has been sent directly to our team's Gmail.",
                        enquiryId: savedEnquiry ? savedEnquiry._id : tempEnquiryId,
                        emailDispatched: emailSent,
                        databaseSaved: Boolean(savedEnquiry),
                        databaseNotice: dbNotice
                    })
                };
            }

            // Only if both email and DB failed:
            return {
                statusCode: 503,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    message: "Unable to process enquiry at this moment. Please contact us directly via WhatsApp at +91 7981850491.",
                    databaseNotice: dbNotice,
                    emailError: emailErrorMsg
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

