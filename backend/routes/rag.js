import {Router} from "express";import Product from "../models/Product.js";
const r=Router();
const faq=[
 {title:"Delivery",text:"B Market delivery availability depends on the delivery area and current order capacity."},
 {title:"Payment",text:"The demo supports Cash on Delivery and a demo online-payment option. A real payment gateway must verify payment on the server."},
 {title:"Freshness",text:"Product descriptions and availability should be maintained by the B Market catalog/admin."}
];
function score(q,text){return q.toLowerCase().split(/\s+/).filter(Boolean).reduce((n,w)=>n+(text.toLowerCase().includes(w)?1:0),0)}
r.post("/ask",async(req,res)=>{const question=String(req.body.question||"").trim();if(!question)return res.status(400).json({message:"Question required"});
 const products=await Product.find({active:true}).limit(200);const docs=[...products.map(p=>({title:p.name,text:`${p.name}. Category: ${p.category}. ${p.description||""} Price: ₹${p.price} per ${p.unit}. Stock: ${p.stock}.`})),...faq];
 const retrieved=docs.map(d=>({...d,score:score(question,d.title+" "+d.text)})).sort((a,b)=>b.score-a.score).slice(0,5);
 res.json({question,answer:"Retrieved B Market information is shown below. In production, send this retrieved context to your chosen LLM to generate a grounded natural-language answer.",sources:retrieved});
});
export default r;