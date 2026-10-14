# B Market - Full Stack E-commerce Starter

This version uses ONE active backend stack: Node.js + Express + MongoDB.
Do not run PHP/Laravel and Node/Express as competing backends for the same API.

## Features
- Home, categories and products
- Product search/filter
- Product details
- Cart with quantity controls
- Registration/login using JWT
- Password hashing with bcrypt
- Customer profile endpoint
- Checkout/order creation
- Order history
- Admin-ready product/order API structure
- RAG-style product/FAQ knowledge retrieval endpoint
- Responsive frontend
- Payment-ready checkout flow (demo payment endpoint)

## Folder structure
frontend/
  index.html
  product.html
  login.html
  register.html
  cart.html
  checkout.html
  orders.html
  product-details.html
  gallery.html
  styles.css
  app.js
  auth.js
  cart.js
  checkout.js
  product-details.js
  products.js
  register.js
  orders.js
  config.js

backend/
  server.js
  package.json
  .env.example
  models/
  routes/
  middleware/
  services/
  data/

my-market/
  index.html
  style.css

## 1. Database
Install MongoDB locally or use MongoDB Atlas.
Copy backend/.env.example to backend/.env and set MONGODB_URI and JWT_SECRET.

## 2. Backend
cd backend
npm install
npm run dev

The API runs on http://localhost:5000

## 3. Frontend
Use VS Code Live Server or any static server.
Open frontend/index.html.

The frontend API base URL is http://localhost:5000/api.

## 4. Demo account
Register a new account from register.html. Never put real passwords in source code.

## Payment
The included payment route is deliberately a demo. For real UPI/card payments, connect a compliant payment gateway from the server and verify the gateway webhook/signature on the server before marking an order paid.

## RAG
/api/rag/ask retrieves relevant product/FAQ documents from the local knowledge base and returns grounded context. For a production AI answer, connect the retrieved context to your chosen LLM and keep product price/stock/order status sourced from the database rather than from the model's memory.

## PHP/Laravel
Laravel is an alternative backend, not something that should be mixed with Express for the same endpoints. A Laravel migration can use the same frontend API contract and MongoDB/MySQL models.
