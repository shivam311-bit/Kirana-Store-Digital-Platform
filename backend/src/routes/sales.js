const express = require("express");
const router = express.Router();
const pool = require("../services/db");

// POST /api/sales - create a complete sale / order
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      customer_id = null,
      customer_name = "Walk-in customer",
      payment_method = "Cash",
      channel = "Counter",
      items = [],
      discount = 0,
      total_amount
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order must contain at least one item." });
    }

    // Calculate or verify total
    let calculatedTotal = 0;
    for (const item of items) {
      calculatedTotal += Number(item.unit_price) * Number(item.quantity);
    }
    const finalAmount = Math.max(0, calculatedTotal - Number(discount || 0));
    const effectiveTotal = total_amount !== undefined ? Number(total_amount) : finalAmount;

    // 1. Insert into sales
    const saleRes = await client.query(`
      INSERT INTO sales (sale_date, total_amount, customer_id, customer_name, payment_method, channel, status, discount, created_at)
      VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, 'Delivered', $6, NOW())
      RETURNING *
    `, [effectiveTotal, customer_id, customer_name, payment_method, channel || "Counter", Number(discount || 0)]);

    const sale = saleRes.rows[0];

    // 2. Insert items and decrement inventory
    for (const item of items) {
      await client.query(`
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [sale.id, item.product_id, item.quantity, item.unit_price]);

      // Decrement inventory current_stock
      await client.query(`
        INSERT INTO inventory (product_id, current_stock, reorder_level)
        VALUES ($1, 0, 10)
        ON CONFLICT (product_id) DO UPDATE
          SET current_stock = GREATEST(0, inventory.current_stock - $2)
      `, [item.product_id, item.quantity]);
    }

    // 3. Handle Udhaar / Customer update
    if (customer_id) {
      // Update customer total purchases and orders count
      await client.query(`
        UPDATE customers
        SET total_purchases = total_purchases + $1,
            orders_count = orders_count + 1
        WHERE id = $2
      `, [effectiveTotal, customer_id]);

      // If paid via Udhaar, increase current balance and log transaction
      if (payment_method.toLowerCase() === "udhaar") {
        await client.query(`
          UPDATE customers
          SET current_balance = current_balance + $1
          WHERE id = $2
        `, [effectiveTotal, customer_id]);

        await client.query(`
          INSERT INTO udhaar_transactions (customer_id, type, amount, payment_mode, notes, created_at)
          VALUES ($1, 'debit', $2, 'Udhaar', $3, NOW())
        `, [customer_id, effectiveTotal, `Credit purchase - Bill #SS-${sale.id}`]);
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Sale completed successfully!",
      invoice_number: `SS-${sale.id}`,
      sale
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Sale transaction failed:", error);
    res.status(500).json({ error: "Failed to record sale: " + error.message });
  } finally {
    client.release();
  }
});

// GET /api/sales - list recent sales / orders
router.get("/", async (req, res) => {
  try {
    const { limit = 50, status } = req.query;
    let query = `
      SELECT 
        s.id,
        s.sale_date,
        s.total_amount,
        s.customer_id,
        COALESCE(s.customer_name, 'Walk-in customer') AS customer_name,
        COALESCE(s.payment_method, 'Cash') AS payment_method,
        COALESCE(s.channel, 'Counter') AS channel,
        COALESCE(s.status, 'Delivered') AS status,
        COALESCE(s.discount, 0) AS discount,
        s.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', si.id,
              'product_id', si.product_id,
              'product_name', p.name,
              'quantity', si.quantity,
              'unit_price', si.unit_price
            )
          ) FILTER (WHERE si.id IS NOT NULL),
          '[]'::json
        ) AS items,
        COALESCE(SUM(si.quantity), 1) AS items_count
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "All") {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }

    query += `
      GROUP BY s.id
      ORDER BY s.id DESC
      LIMIT $${params.length + 1}
    `;
    params.push(parseInt(limit, 10));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch sales failed:", error);
    res.status(500).json({ error: "Failed to load orders/sales." });
  }
});

// PUT /api/sales/:id/status - update order status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(`
      UPDATE sales
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ message: "Status updated", order: result.rows[0] });
  } catch (error) {
    console.error("Update status failed:", error);
    res.status(500).json({ error: "Failed to update status." });
  }
});

// GET /api/sales/stats - dashboard summary metrics
router.get("/stats", async (req, res) => {
  try {
    // 1. Today sales & orders (or latest 24h)
    const todayRes = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS today_sales,
        COUNT(*) AS today_orders
      FROM sales
      WHERE sale_date = CURRENT_DATE
    `);

    let todaySales = Number(todayRes.rows[0].today_sales);
    let todayOrders = Number(todayRes.rows[0].today_orders);

    // If no sales today yet, take yesterday or recent 1-day representative stats
    if (todaySales === 0) {
      const recentDay = await pool.query(`
        SELECT sale_date, SUM(total_amount) as sales, COUNT(*) as orders
        FROM sales
        GROUP BY sale_date
        ORDER BY sale_date DESC
        LIMIT 1
      `);
      if (recentDay.rows.length > 0) {
        todaySales = Number(recentDay.rows[0].sales);
        todayOrders = Number(recentDay.rows[0].orders);
      }
    }

    // 2. Est profit (approx 24% of sales)
    const profit = Math.round(todaySales * 0.24);

    // 3. Udhaar outstanding
    const udhaarRes = await pool.query(`
      SELECT COALESCE(SUM(current_balance), 0) AS total_udhaar, COUNT(*) as total_debtors
      FROM customers
      WHERE current_balance > 0
    `);
    const udhaarDue = Number(udhaarRes.rows[0].total_udhaar);

    // 4. Low stock items count
    const stockRes = await pool.query(`
      SELECT COUNT(*) AS low_stock_count
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      WHERE i.current_stock <= i.reorder_level
    `);
    const lowStockCount = Number(stockRes.rows[0].low_stock_count);

    // 5. Last 7 days sales for chart
    const chartRes = await pool.query(`
      SELECT 
        TO_CHAR(sale_date, 'Dy') as day_label,
        sale_date,
        SUM(total_amount) as amount,
        COUNT(*) as count
      FROM sales
      GROUP BY sale_date
      ORDER BY sale_date DESC
      LIMIT 7
    `);
    const chartData = chartRes.rows.reverse();

    // 6. Top selling products
    const topProdRes = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        SUM(si.quantity) AS total_sold,
        SUM(si.quantity * si.unit_price) AS total_revenue
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      GROUP BY p.id, p.name, p.category, p.price
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // 7. Stock alerts list
    const alertListRes = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        i.current_stock,
        i.reorder_level
      FROM products p
      JOIN inventory i ON i.product_id = p.id
      WHERE i.current_stock <= i.reorder_level
      ORDER BY i.current_stock ASC
      LIMIT 5
    `);

    res.json({
      todaySales,
      todayOrders,
      profit,
      udhaarDue,
      lowStockCount,
      chartData,
      topProducts: topProdRes.rows,
      stockAlerts: alertListRes.rows
    });
  } catch (error) {
    console.error("Stats calculation failed:", error);
    res.status(500).json({ error: "Failed to calculate store stats." });
  }
});

module.exports = router;
