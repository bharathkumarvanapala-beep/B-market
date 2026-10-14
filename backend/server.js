import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import ragRoutes from "./routes/rag.js";

dotenv.config();
const app=express();
app.use(cors());
app.use(express.json());
app.get("/api/health",(req,res)=>res.json({ok:true,service:"B Market API"}));
app.use("/api/auth",authRoutes);
app.use("/api/products",productRoutes);
app.use("/api/orders",orderRoutes);
app.use("/api/rag",ragRoutes);

const port=process.env.PORT||5000;
mongoose.connect(process.env.MONGODB_URI).then(()=>{
 app.listen(port,()=>console.log(`B Market API: http://localhost:${port}`));
}).catch(err=>{console.error("MongoDB connection failed:",err.message);process.exit(1)});
