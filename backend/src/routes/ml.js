const express = require("express");
const router = express.Router();
const pool = require("../services/db");

const {
  getForecast,
  getReorderRecommendations,
  getMLHealth,
} = require("../services/mlService");

router.get("/health", async (req, res) => {
  try {
    const health = await getMLHealth();
    res.json({ mlService: health, status: "ok" });
  } catch (error) {
    res.status(502).json({ error: "ML Service unavailable", detail: error.message });
  }
});

router.get("/forecast", async (req, res) => {
  try {
    const mlData = await getForecast();
    const rows = mlData.data || [];

    // Fetch product names to enrich predictions
    const prods = await pool.query("SELECT id, name, category, price FROM products");
    const prodMap = new Map();
    prods.rows.forEach(p => prodMap.set(p.id, p));

    const enriched = rows.map(r => {
      const p = prodMap.get(r.product_id) || { name: `Product #${r.product_id}`, category: "General", price: 0 };
      return {
        ...r,
        name: p.name,
        category: p.category,
        price: p.price
      };
    });

    res.json({ data: enriched });
  } catch (error) {
    console.error("Forecast request failed:", error.message);
    res.status(502).json({
      error: "Could not retrieve forecast from ML service.",
      detail: error.message,
    });
  }
});

router.get("/reorder", async (req, res) => {
  try {
    const mlData = await getReorderRecommendations();
    const rows = mlData.data || [];

    // Fetch product names to enrich reorder recommendations
    const prods = await pool.query("SELECT id, name, category, price FROM products");
    const prodMap = new Map();
    prods.rows.forEach(p => prodMap.set(p.id, p));

    const enriched = rows.map(r => {
      const p = prodMap.get(r.product_id) || { name: `Product #${r.product_id}`, category: "General", price: 0 };
      return {
        ...r,
        name: p.name,
        category: p.category,
        price: p.price
      };
    });

    res.json({ data: enriched });
  } catch (error) {
    console.error("Reorder recommendations failed:", error.message);
    res.status(502).json({
      error: "Could not retrieve reorder recommendations from ML service.",
      detail: error.message,
    });
  }
});

module.exports = router;