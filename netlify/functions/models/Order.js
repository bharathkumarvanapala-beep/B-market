import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true },
        orderNumber: { type: String },
        transactionId: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
        customer: {
            name: { type: String, default: "Customer" },
            mobile: { type: String, default: "" },
            email: { type: String, default: "" },
            address: { type: String, default: "" },
            city: { type: String, default: "" },
            pincode: { type: String, default: "" }
        },
        items: [
            {
                productId: { type: mongoose.Schema.Types.Mixed },
                name: String,
                price: Number,
                quantity: { type: Number, default: 1 },
                image: String
            }
        ],
        total: { type: Number, required: true },
        paymentMethod: { type: String, default: "Online" },
        paymentStatus: { type: String, default: "Paid" },
        status: { type: String, default: "Order Confirmed" },
        date: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
