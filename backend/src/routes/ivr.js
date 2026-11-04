const express = require("express");
const router = express.Router();
const pool = require("../services/db");

const STORE_IVR_NUMBER = "0000000000";
const STORE_IVR_DISPLAY = "000 0000 0000";

// GET /api/ivr/config - returns active IVR phone line configuration
router.get("/config", (req, res) => {
  res.json({
    ivr_number: STORE_IVR_NUMBER,
    display: STORE_IVR_DISPLAY,
    formatted: "+91 000 0000 0000",
    status: "Demo placeholder",
    service: "Kirana AI Voice Ordering Hotline"
  });
});

// GET /api/ivr - list IVR voice orders
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT id, caller_name, caller_phone, transcript, parsed_items, total_amount, status, language, created_at
      FROM ivr_orders
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "All calls") {
      params.push(status === "Needs review" ? "Needs review" : status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC, id DESC LIMIT 50`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch IVR orders failed:", error);
    res.status(500).json({ error: "Failed to load IVR orders." });
  }
});

// POST /api/ivr/simulate - AI parse & create IVR call order
router.post("/simulate", async (req, res) => {
  try {
    const {
      caller_name = "Demo Caller",
      caller_phone = "00000 00009",
      transcript = "2 Amul Milk and 1 Tata Salt packet please deliver",
      language = "Hindi"
    } = req.body;

    // Fetch all products from DB to perform match
    const prods = await pool.query("SELECT id, name, price FROM products");
    const parsedItems = [];
    let estimatedTotal = 0;

    // Smart matching logic against spoken words
    const lowerTranscript = transcript.toLowerCase();
    for (const prod of prods.rows) {
      const pNameLower = prod.name.toLowerCase();
      // Check keywords like milk, salt, atta, oil, maggi, parle, tea, sugar, basmati
      const keywords = pNameLower.split(" ").filter(w => w.length > 2);
      const matched = keywords.some(k => lowerTranscript.includes(k));

      if (matched) {
        // extract quantity if nearby
        let qty = 1;
        const matchDigits = lowerTranscript.match(new RegExp(`(\\d+)\\s*(?:kg|l|packet|pack|packet)?\\s*(?:of)?\\s*${keywords[0]}`, 'i'));
        if (matchDigits && matchDigits[1]) {
          qty = parseInt(matchDigits[1], 10);
        } else {
          // check words: ek, do, teen, char, 2, 3
          if (lowerTranscript.includes("do ") || lowerTranscript.includes("2 ")) qty = 2;
          else if (lowerTranscript.includes("teen ") || lowerTranscript.includes("3 ")) qty = 3;
          else if (lowerTranscript.includes("char ") || lowerTranscript.includes("4 ")) qty = 4;
        }

        parsedItems.push({
          product_id: prod.id,
          name: prod.name,
          qty: qty,
          price: Number(prod.price)
        });
        estimatedTotal += Number(prod.price) * qty;

        if (parsedItems.length >= 3) break; // keep realistic
      }
    }

    if (parsedItems.length === 0) {
      // Fallback first 2 items
      const sample = prods.rows.slice(0, 2);
      for (const s of sample) {
        parsedItems.push({
          product_id: s.id,
          name: s.name,
          qty: 1,
          price: Number(s.price)
        });
        estimatedTotal += Number(s.price);
      }
    }

    const result = await pool.query(`
      INSERT INTO ivr_orders (caller_name, caller_phone, transcript, parsed_items, total_amount, status, language, created_at)
      VALUES ($1, $2, $3, $4, $5, 'Needs review', $6, NOW())
      RETURNING *
    `, [caller_name, caller_phone, transcript, JSON.stringify(parsedItems), estimatedTotal, language]);

    res.status(201).json({
      message: "New IVR order captured from voice!",
      order: result.rows[0]
    });
  } catch (error) {
    console.error("Simulate IVR error:", error);
    res.status(500).json({ error: "Failed to simulate IVR order." });
  }
});

// POST /api/ivr/:id/confirm - confirm and convert IVR order to real sale
router.post("/:id/confirm", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = req.params;

    const ivrRes = await client.query("SELECT * FROM ivr_orders WHERE id = $1", [id]);
    if (ivrRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "IVR order not found." });
    }

    const ivr = ivrRes.rows[0];
    const items = typeof ivr.parsed_items === "string" ? JSON.parse(ivr.parsed_items) : ivr.parsed_items;

    // 1. Create real sale in sales table
    const saleRes = await client.query(`
      INSERT INTO sales (sale_date, total_amount, customer_name, payment_method, channel, status, created_at)
      VALUES (CURRENT_DATE, $1, $2, 'Cash on Delivery', 'IVR', 'Confirmed', NOW())
      RETURNING *
    `, [ivr.total_amount, ivr.caller_name]);

    const newSale = saleRes.rows[0];

    // 2. Insert line items & deduct stock
    for (const item of items) {
      const prodId = item.product_id || 1;
      const qty = item.qty || 1;
      const price = item.price || 0;

      await client.query(`
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [newSale.id, prodId, qty, price]);

      await client.query(`
        UPDATE inventory 
        SET current_stock = GREATEST(0, current_stock - $1)
        WHERE product_id = $2
      `, [qty, prodId]);
    }

    // 3. Update IVR order status
    await client.query("UPDATE ivr_orders SET status = 'Confirmed' WHERE id = $1", [id]);

    await client.query("COMMIT");

    res.json({
      message: `IVR Order #${id} confirmed and converted to Bill #SS-${newSale.id}!`,
      sale_id: newSale.id
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Confirm IVR order error:", error);
    res.status(500).json({ error: "Failed to confirm IVR order." });
  } finally {
    client.release();
  }
});

module.exports = router;
