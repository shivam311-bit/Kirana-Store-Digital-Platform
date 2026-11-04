const express = require("express");
const router = express.Router();
const pool = require("../services/db");

// GET /api/suppliers - list suppliers
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, 
        s.name, 
        s.contact_person, 
        s.phone, 
        s.category, 
        s.created_at,
        COUNT(po.id) AS total_orders,
        COALESCE(SUM(po.total_amount), 0) AS total_spent
      FROM suppliers s
      LEFT JOIN purchase_orders po ON po.supplier_id = s.id
      GROUP BY s.id
      ORDER BY s.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch suppliers error:", error);
    res.status(500).json({ error: "Failed to load suppliers." });
  }
});

// POST /api/suppliers - add supplier
router.post("/", async (req, res) => {
  try {
    const { name, contact_person = "", phone = "", category = "General" } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Supplier name is required." });
    }

    const result = await pool.query(`
      INSERT INTO suppliers (name, contact_person, phone, category)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name.trim(), contact_person.trim(), phone.trim(), category.trim()]);

    res.status(201).json({ message: "Supplier added successfully!", supplier: result.rows[0] });
  } catch (error) {
    console.error("Create supplier error:", error);
    res.status(500).json({ error: "Failed to create supplier." });
  }
});

// GET /api/suppliers/purchases - list purchase orders
router.get("/purchases", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        po.id,
        po.po_number,
        po.supplier_id,
        s.name AS supplier_name,
        po.total_amount,
        po.status,
        po.items_summary,
        po.created_at
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      ORDER BY po.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch purchase orders error:", error);
    res.status(500).json({ error: "Failed to load purchase orders." });
  }
});

// POST /api/suppliers/purchases - create new purchase order
router.post("/purchases", async (req, res) => {
  try {
    const { supplier_id, total_amount, items_summary, po_number } = req.body;
    if (!supplier_id || !total_amount) {
      return res.status(400).json({ error: "Supplier and total amount are required." });
    }

    const autoPO = po_number || `PO-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = await pool.query(`
      INSERT INTO purchase_orders (po_number, supplier_id, total_amount, status, items_summary)
      VALUES ($1, $2, $3, 'In transit', $4)
      RETURNING *
    `, [autoPO, supplier_id, Number(total_amount), items_summary || ""]);

    res.status(201).json({ message: "Purchase order created!", purchase_order: result.rows[0] });
  } catch (error) {
    console.error("Create purchase order error:", error);
    res.status(500).json({ error: "Failed to create purchase order: " + error.message });
  }
});

// PUT /api/suppliers/purchases/:id/status - update PO status
router.put("/purchases/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(`
      UPDATE purchase_orders
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    res.json({ message: "Purchase order updated!", purchase_order: result.rows[0] });
  } catch (error) {
    console.error("Update purchase order error:", error);
    res.status(500).json({ error: "Failed to update purchase order." });
  }
});

module.exports = router;
