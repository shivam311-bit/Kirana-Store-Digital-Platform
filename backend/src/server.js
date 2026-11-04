require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const udhaarRoutes = require("./routes/udhaar");
const ivrRoutes = require("./routes/ivr");
const supplierRoutes = require("./routes/suppliers");
const mlRoutes = require("./routes/ml");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/orders", salesRoutes);
app.use("/api/udhaar", udhaarRoutes);
app.use("/api/ivr", ivrRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/ml", mlRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Kirana Digital Platform Node.js Backend",
    endpoints: [
      "/api/auth",
      "/api/products",
      "/api/sales",
      "/api/orders",
      "/api/udhaar",
      "/api/ivr",
      "/api/suppliers",
      "/api/ml"
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Kirana backend running at http://localhost:${PORT}`);
});