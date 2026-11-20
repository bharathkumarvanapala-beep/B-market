import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"]
        },
        email: {
            type: String,
            required: [true, "Customer email is required"],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
        },
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        message: {
            type: String,
            required: [true, "Enquiry message is required"],
            trim: true,
            maxlength: [2000, "Message cannot exceed 2000 characters"]
        },
        status: {
            type: String,
            enum: ["NEW", "IN_REVIEW", "CONTACTED", "RESOLVED"],
            default: "NEW"
        },
        ipAddress: {
            type: String,
            default: ""
        },
        userAgent: {
            type: String,
            default: ""
        },
        emailDelivered: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export default mongoose.models.Enquiry || mongoose.model("Enquiry", enquirySchema);

