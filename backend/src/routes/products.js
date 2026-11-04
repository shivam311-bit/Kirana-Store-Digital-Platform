const express = require("express");
const router = express.Router();
const pool = require("../services/db");

// GET /api/products - list all products with stock info
router.get("/", async (req, res) => {
  try {
    const { category, search, filter } = req.query;
    let query = `
      SELECT
        p.id,
        p.name,
        p.category,
        p.price,
        p.purchase_price,
        p.minimum_stock,
        p.barcode,
        COALESCE(i.current_stock, 0) AS current_stock,
        COALESCE(i.reorder_level, p.minimum_stock, 10) AS reorder_level
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (LOWER(p.name) LIKE LOWER($${params.length}) OR LOWER(COALESCE(p.category, '')) LIKE LOWER($${params.length}) OR p.barcode LIKE $${params.length})`;
    }

    if (category && category !== "All items" && category !== "All products") {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    if (filter === "Low stock") {
      query += ` AND COALESCE(i.current_stock, 0) > 0 AND COALESCE(i.current_stock, 0) <= COALESCE(i.reorder_level, p.minimum_stock, 10)`;
    } else if (filter === "Out of stock") {
      query += ` AND COALESCE(i.current_stock, 0) = 0`;
    }

    query += ` ORDER BY p.id ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Products query failed:", error.message);
    res.status(500).json({ error: "Failed to retrieve products." });
  }
});

// GET /api/products/barcode/:code - lookup single product by barcode
router.get("/barcode/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const cleanCode = code.trim();
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.category,
        p.price,
        p.purchase_price,
        p.minimum_stock,
        p.barcode,
        COALESCE(i.current_stock, 0) AS current_stock,
        COALESCE(i.reorder_level, p.minimum_stock, 10) AS reorder_level
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE p.barcode = $1 OR p.id::text = $1
      LIMIT 1
    `, [cleanCode]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No product found with barcode " + cleanCode });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Barcode lookup failed:", error);
    res.status(500).json({ error: "Barcode lookup failed." });
  }
});

// GET /api/products/categories - distinct categories
router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category 
      FROM products 
      WHERE category IS NOT NULL AND category <> ''
      ORDER BY category ASC
    `);
    const cats = result.rows.map(r => r.category);
    res.json(cats);
  } catch (error) {
    console.error("Categories query failed:", error.message);
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});

// POST /api/products - create new product
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      name,
      category = "General",
      price,
      purchase_price = 0,
      initial_stock = 10,
      minimum_stock = 5,
      reorder_level = 10,
      barcode
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "Product name and selling price are required." });
    }

    const finalBarcode = barcode ? barcode.trim() : ("8901262" + String(Date.now()).slice(-6));

    const prodResult = await client.query(`
      INSERT INTO products (name, category, price, purchase_price, minimum_stock, barcode)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name.trim(), category.trim(), Number(price), Number(purchase_price), Number(minimum_stock), finalBarcode]);

    const newProd = prodResult.rows[0];

    await client.query(`
      INSERT INTO inventory (product_id, current_stock, reorder_level)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id) DO UPDATE 
        SET current_stock = EXCLUDED.current_stock,
            reorder_level = EXCLUDED.reorder_level
    `, [newProd.id, Number(initial_stock), Number(reorder_level)]);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Product created successfully!",
      product: {
        ...newProd,
        current_stock: Number(initial_stock),
        reorder_level: Number(reorder_level)
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create product failed:", error);
    res.status(500).json({ error: "Failed to create product: " + error.message });
  } finally {
    client.release();
  }
});

// POST /api/products/:id/restock - add stock
router.post("/:id/restock", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 10 } = req.body;

    const qty = Math.max(1, parseInt(quantity, 10));

    const result = await pool.query(`
      INSERT INTO inventory (product_id, current_stock, reorder_level)
      VALUES ($1, $2, 10)
      ON CONFLICT (product_id) DO UPDATE
        SET current_stock = inventory.current_stock + $2
      RETURNING product_id, current_stock, reorder_level
    `, [id, qty]);

    res.json({
      message: `Restocked ${qty} units successfully!`,
      inventory: result.rows[0]
    });
  } catch (error) {
    console.error("Restock error:", error);
    res.status(500).json({ error: "Failed to restock product." });
  }
});

// PUT /api/products/:id - edit product
router.put("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    const { name, category, price, purchase_price, minimum_stock, current_stock, reorder_level } = req.body;

    const prodRes = await client.query(`
      UPDATE products
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          price = COALESCE($3, price),
          purchase_price = COALESCE($4, purchase_price),
          minimum_stock = COALESCE($5, minimum_stock)
      WHERE id = $6
      RETURNING *
    `, [name, category, price, purchase_price, minimum_stock, id]);

    if (prodRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found." });
    }

    if (current_stock !== undefined || reorder_level !== undefined) {
      await client.query(`
        INSERT INTO inventory (product_id, current_stock, reorder_level)
        VALUES ($1, COALESCE($2, 0), COALESCE($3, 10))
        ON CONFLICT (product_id) DO UPDATE
          SET current_stock = COALESCE($2, inventory.current_stock),
              reorder_level = COALESCE($3, inventory.reorder_level)
      `, [id, current_stock, reorder_level]);
    }

    await client.query("COMMIT");
    res.json({ message: "Product updated successfully!", product: prodRes.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update product failed:", error);
    res.status(500).json({ error: "Failed to update product." });
  } finally {
    client.release();
  }
});

module.exports = router;