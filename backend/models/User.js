import mongoose from "mongoose";
const schema=new mongoose.Schema({name:{type:String,required:true},email:{type:String,required:true,unique:true,lowercase:true},mobile:String,password:{type:String,required:true},address:String,role:{type:String,enum:["customer","admin"],default:"customer"}},{timestamps:true});
export default mongoose.model("User",schema);