import mongoose from "mongoose";import dotenv from "dotenv";import Product from "../models/Product.js";
dotenv.config();
const products=[
{name:"Fresh Fruits",category:"Fruits",description:"Seasonal fresh fruits.",price:120,unit:"kg",stock:100,image:"../image/fruit.jpg"},
{name:"Fresh Vegetables",category:"Vegetables",description:"Healthy green vegetables.",price:60,unit:"kg",stock:150,image:"../image/vfrt.webp"},
{name:"Quality Rice",category:"Grains",description:"Premium quality rice.",price:70,unit:"kg",stock:200,image:"../image/image.b.webp"},
{name:"Black Pepper",category:"Spices",description:"Natural aromatic black pepper.",price:500,unit:"kg",stock:50,image:"../image/image.f.webp"},
{name:"Coffee Beans",category:"Coffee",description:"Fresh coffee beans.",price:450,unit:"kg",stock:70,image:"../image/image.e.webp"},
{name:"Tamarind",category:"Natural",description:"Natural and tasty tamarind.",price:180,unit:"kg",stock:80,image:"../image/image.d.jpg"},
{name:"Turmeric",category:"Spices",description:"Pure turmeric.",price:160,unit:"kg",stock:90,image:"../image/termer.jpg"},
{name:"Ginger",category:"Spices",description:"Fresh ginger roots.",price:120,unit:"kg",stock:100,image:"../image/ginger.jpg"},
{name:"Natural Honey",category:"Natural",description:"Forest honey.",price:350,unit:"kg",stock:40,image:"../image/honey.jpg"},
{name:"Millets",category:"Grains",description:"Healthy organic millets.",price:90,unit:"kg",stock:120,image:"../image/millets.jpg"}];
await mongoose.connect(process.env.MONGODB_URI);await Product.deleteMany({});await Product.insertMany(products);console.log("Products seeded");await mongoose.disconnect();