const express = require("express");
const router = express.Router();
const pool = require("../services/db");

// GET /api/udhaar/customers - list all customers
router.get("/customers", async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        id, 
        name, 
        phone, 
        address, 
        credit_limit, 
        current_balance, 
        total_purchases, 
        orders_count, 
        created_at
      FROM customers
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (LOWER(name) LIKE LOWER($1) OR phone LIKE $1)`;
    }

    query += ` ORDER BY current_balance DESC, name ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch customers failed:", error);
    res.status(500).json({ error: "Failed to load customers." });
  }
});

// POST /api/udhaar/customers - create new customer
router.post("/customers", async (req, res) => {
  try {
    const { name, phone, address = "", credit_limit = 10000, initial_balance = 0 } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Customer name and phone number are required." });
    }

    const result = await pool.query(`
      INSERT INTO customers (name, phone, address, credit_limit, current_balance)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name.trim(), phone.trim(), address.trim(), Number(credit_limit), Number(initial_balance)]);

    const newCustomer = result.rows[0];

    if (Number(initial_balance) > 0) {
      await pool.query(`
        INSERT INTO udhaar_transactions (customer_id, type, amount, payment_mode, notes)
        VALUES ($1, 'debit', $2, 'Opening Balance', 'Initial outstanding balance recorded')
      `, [newCustomer.id, Number(initial_balance)]);
    }

    res.status(201).json({ message: "Customer added successfully!", customer: newCustomer });
  } catch (error) {
    console.error("Create customer failed:", error);
    res.status(500).json({ error: "Failed to create customer: " + error.message });
  }
});

// GET /api/udhaar/customers/:id/transactions - get ledger
router.get("/customers/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT id, customer_id, type, amount, payment_mode, notes, created_at
      FROM udhaar_transactions
      WHERE customer_id = $1
      ORDER BY created_at DESC, id DESC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch transactions failed:", error);
    res.status(500).json({ error: "Failed to load ledger transactions." });
  }
});

// POST /api/udhaar/payment - record payment from customer
router.post("/payment", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { customer_id, amount, payment_mode = "Cash", notes = "Payment received" } = req.body;

    if (!customer_id || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid customer ID and positive payment amount are required." });
    }

    const payAmount = Number(amount);

    // Update customer current balance
    const custRes = await client.query(`
      UPDATE customers
      SET current_balance = GREATEST(0, current_balance - $1)
      WHERE id = $2
      RETURNING *
    `, [payAmount, customer_id]);

    if (custRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Customer not found." });
    }

    // Insert transaction
    const txRes = await client.query(`
      INSERT INTO udhaar_transactions (customer_id, type, amount, payment_mode, notes, created_at)
      VALUES ($1, 'credit', $2, $3, $4, NOW())
      RETURNING *
    `, [customer_id, payAmount, payment_mode, notes]);

    await client.query("COMMIT");

    res.json({
      message: `Payment of ₹${payAmount} recorded successfully!`,
      customer: custRes.rows[0],
      transaction: txRes.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Record payment failed:", error);
    res.status(500).json({ error: "Failed to record payment." });
  } finally {
    client.release();
  }
});

module.exports = router;
