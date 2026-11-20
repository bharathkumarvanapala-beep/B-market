import { Router } from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Enquiry from "../models/Enquiry.js";

const router = Router();

function isDbConnected() {
    return mongoose.connection.readyState === 1;
}

// Simple sanitize helper to prevent stored XSS
function sanitizeText(str) {
    if (!str || typeof str !== "string") return "";
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<[^>]+>/g, "")
        .trim();
}

// GET /api/enquiry/status - Safe status check
router.get("/status", (req, res) => {
    const emailUser = (process.env.EMAIL_USER || "bharathkumarvanapala@gmail.com").trim();
    const rawPass = process.env.EMAIL_PASS || "";
    const cleanPass = rawPass.replace(/\s+/g, "").trim();
    const isConfigured = Boolean(
        cleanPass &&
        cleanPass !== "your_16_character_app_password_here" &&
        cleanPass.length >= 8
    );

    res.json({
        success: true,
        database: isDbConnected() ? "connected" : "disconnected",
        emailConfigured: isConfigured,
        recipient: emailUser
    });
});

// GET /api/enquiry - List latest enquiries (Admin/farmer view)
router.get("/", async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(503).json({
                success: false,
                message: "Database is currently disconnected. Cannot retrieve enquiries."
            });
        }
        const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(100);
        res.json({
            success: true,
            count: enquiries.length,
            enquiries
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/enquiry - Submit and store enquiry in MongoDB + trigger email
router.post("/", async (req, res) => {
    try {
        const rawName = req.body.name;
        const rawEmail = req.body.email;
        const rawPhone = req.body.phone;
        const rawMessage = req.body.message;

        const name = sanitizeText(rawName);
        const email = (rawEmail || "").toString().toLowerCase().trim();
        const phone = sanitizeText(rawPhone);
        const message = sanitizeText(rawMessage);

        // 1. Validation
        if (!name || name.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please provide your full name (at least 2 characters)."
            });
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (!message || message.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Please write your enquiry message (at least 3 characters)."
            });
        }

        const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
        const userAgent = req.headers["user-agent"] || "";

        // 2. Persist to MongoDB
        if (!isDbConnected()) {
            console.error("❌ MongoDB is disconnected. Refusing to claim success without database storage.");
            return res.status(503).json({
                success: false,
                message: "Database service is temporarily unavailable. Your enquiry could not be saved. Please try again shortly or contact us directly via WhatsApp/Phone."
            });
        }

        const savedEnquiry = await Enquiry.create({
            name,
            email,
            phone,
            message,
            ipAddress: typeof ipAddress === "string" ? ipAddress.split(",")[0].trim() : "",
            userAgent: typeof userAgent === "string" ? userAgent.slice(0, 200) : "",
            status: "NEW"
        });

        console.log(`📝 Enquiry successfully saved in MongoDB! ID: ${savedEnquiry._id} from ${name} (${email})`);

        // 3. Asynchronous Email Notification via Nodemailer
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

                const mailOptions = {
                    from: `"B Market" <${emailUser}>`,
                    to: emailUser,
                    replyTo: email,
                    subject: `New B Market Enquiry from ${name} [${savedEnquiry._id.toString().slice(-6)}]`,
                    text: `
New B Market Customer Enquiry (Stored in MongoDB)

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
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <div style="background-color: #2e7d32; color: #ffffff; padding: 22px; text-align: center;">
        <h2 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">B Market — New Customer Enquiry</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Fresh Farm Products Directly from Farmers</p>
    </div>
    <div style="padding: 26px; background-color: #ffffff;">
        <div style="background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #2e7d32; font-weight: bold;">
                💾 Stored in MongoDB: #${savedEnquiry._id}
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
                <td style="padding: 10px 0; color: #111111; font-size: 15px;">${phone || "Not provided"}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #555555;">Time:</td>
                <td style="padding: 10px 0; color: #777777; font-size: 13px;">${submissionDate}</td>
            </tr>
        </table>
        <div style="padding: 16px 20px; background-color: #f7faf7; border-left: 4px solid #2e7d32; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #2e7d32; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Message:</p>
            <p style="margin: 0; color: #333333; line-height: 1.6; font-size: 15px; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="margin: 20px 0 0 0; font-size: 13px; color: #666666; background: #e8f5e9; padding: 10px 14px; border-radius: 6px;">
            💡 <strong>Quick Reply:</strong> Click "Reply" in your email client to email <strong>${name}</strong> directly at <a href="mailto:${email}" style="color: #2e7d32;">${email}</a>.
        </p>
    </div>
    <div style="background-color: #f5f5f5; padding: 14px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee;">
        © 2026 B Market. All Rights Reserved.
    </div>
</div>
                    `
                };

                await transporter.sendMail(mailOptions);
                emailSent = true;
                await Enquiry.updateOne({ _id: savedEnquiry._id }, { emailDelivered: true });
                console.log(`✅ Enquiry email notification delivered to ${emailUser}`);
            } catch (mailErr) {
                console.error("⚠️ Enquiry email notification failed (saved in DB):", mailErr.message);
            }
        }

        // 4. Return success response with MongoDB enquiry ID
        res.status(201).json({
            success: true,
            message: "Enquiry submitted and saved successfully! Our farm team will contact you soon.",
            enquiryId: savedEnquiry._id,
            emailDispatched: emailSent
        });

    } catch (error) {
        console.error("❌ Error handling enquiry:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save enquiry: " + (error.message || "Internal server error")
        });
    }
});

export default router;
