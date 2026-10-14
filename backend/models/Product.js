import mongoose from "mongoose";
const schema=new mongoose.Schema({name:{type:String,required:true},category:{type:String,required:true},description:String,price:{type:Number,required:true,min:0},unit:{type:String,default:"kg"},stock:{type:Number,default:0,min:0},image:String,active:{type:Boolean,default:true}},{timestamps:true});
export default mongoose.model("Product",schema);