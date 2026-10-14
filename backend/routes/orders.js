import {Router} from "express";import mongoose from "mongoose";import Order from "../models/Order.js";import Product from "../models/Product.js";import {protect} from "../middleware/auth.js";
const r=Router();
r.post("/",protect,async(req,res)=>{try{
 const {items,address,paymentMethod="COD"}=req.body;if(!address||!Array.isArray(items)||!items.length)return res.status(400).json({message:"Address and cart items are required"});
 const ids=items.map(x=>x.productId);if(ids.some(x=>!mongoose.isValidObjectId(x)))return res.status(400).json({message:"Invalid product"});
 const products=await Product.find({_id:{$in:ids},active:true});const map=new Map(products.map(p=>[p._id.toString(),p]));const orderItems=[];let total=0;
 for(const item of items){const p=map.get(item.productId);const qty=Number(item.quantity);if(!p||!Number.isInteger(qty)||qty<1)return res.status(400).json({message:"Invalid cart item"});if(p.stock<qty)return res.status(400).json({message:`Not enough stock for ${p.name}`});orderItems.push({productId:p._id,name:p.name,price:p.price,quantity:qty});total+=p.price*qty}
 for(const i of orderItems)await Product.updateOne({_id:i.productId},{$inc:{stock:-i.quantity}});
 const order=await Order.create({orderNumber:"BM"+Date.now(),userId:req.user._id,items:orderItems,address,total,paymentMethod,paymentStatus:paymentMethod==="COD"?"PENDING":"PENDING"});
 res.status(201).json(order);
}catch(e){res.status(500).json({message:e.message})}});
r.get("/my",protect,async(req,res)=>res.json(await Order.find({userId:req.user._id}).sort({createdAt:-1})));
export default r;