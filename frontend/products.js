let allProducts=[];
async function loadProducts(){
 const grid=document.getElementById("productGrid"); const params=new URLSearchParams(location.search); const cat=params.get("category")||"";
 if(cat)document.getElementById("category").value=cat;
 try{allProducts=await api("/products");renderProducts()}catch(e){grid.innerHTML=`<p>${e.message}</p>`}
}
function renderProducts(){
 const q=document.getElementById("search").value.toLowerCase();const c=document.getElementById("category").value;
 const list=allProducts.filter(p=>(!q||`${p.name} ${p.description}`.toLowerCase().includes(q))&&(!c||p.category===c));
 document.getElementById("productGrid").innerHTML=list.map(p=>`<article class="product-card"><img src="${p.image}" alt="${p.name}"><h3>${p.name}</h3><p>${p.description}</p><p><strong>₹${p.price}</strong> / ${p.unit}</p><a class="btn" href="product-details.html?id=${p._id}">View Product</a><button class="btn" onclick="addProduct('${p._id}')">Add to Cart</button></article>`).join("")||"<p>No products found.</p>";
}
async function addProduct(id){const p=allProducts.find(x=>x._id===id);const c=cart();const item=c.find(x=>x.productId===id);if(item)item.quantity++;else c.push({productId:id,name:p.name,price:p.price,image:p.image,quantity:1});saveCart(c);alert("Added to cart");}
document.addEventListener("DOMContentLoaded",()=>{loadProducts();document.getElementById("search").oninput=renderProducts;document.getElementById("category").onchange=renderProducts});