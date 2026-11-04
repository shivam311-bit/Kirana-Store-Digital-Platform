const pool = require("./db");
const crypto = require("crypto");

function hashPassword(password) {
  const salt = "kirana_salt_2025";
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Starting database migrations...");

    // 1. Create sequences for existing tables if not attached
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS products_id_seq;
      SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM products), false);
      ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');

      CREATE SEQUENCE IF NOT EXISTS sales_id_seq;
      SELECT setval('sales_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM sales), false);
      ALTER TABLE sales ALTER COLUMN id SET DEFAULT nextval('sales_id_seq');

      CREATE SEQUENCE IF NOT EXISTS sale_items_id_seq;
      SELECT setval('sale_items_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM sale_items), false);
      ALTER TABLE sale_items ALTER COLUMN id SET DEFAULT nextval('sale_items_id_seq');

      -- Add barcode column to products if not exists
      ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
      UPDATE products SET barcode = '8901262' || LPAD(id::text, 6, '0') WHERE barcode IS NULL OR barcode = '';
    `);

    // 2. Enhance sales table with extra fields
    await client.query(`
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id INTEGER;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) DEFAULT 'Walk-in customer';
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash';
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'Counter';
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Delivered';
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0.00;
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // 3. Create users table for Login / Register
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        store_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'owner',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        address TEXT,
        credit_limit NUMERIC(10,2) DEFAULT 10000.00,
        current_balance NUMERIC(10,2) DEFAULT 0.00,
        total_purchases NUMERIC(10,2) DEFAULT 0.00,
        orders_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed customers if empty
    const custCount = await client.query("SELECT COUNT(*) FROM customers");
    if (parseInt(custCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO customers (name, phone, address, credit_limit, current_balance, total_purchases, orders_count)
        VALUES 
          ('Demo Customer 1', '00000 00001', 'Demo address 1', 15000, 3280, 18420, 42),
          ('Demo Customer 2', '00000 00002', 'Demo address 2', 10000, 2450, 14850, 35),
          ('Demo Customer 3', '00000 00003', 'Demo address 3', 8000, 1840, 12220, 28),
          ('Demo Customer 4', '00000 00004', 'Demo address 4', 5000, 1320, 9640, 21),
          ('Demo Customer 5', '00000 00005', 'Demo address 5', 12000, 0, 8450, 19),
          ('Demo Customer 6', '00000 00006', 'Demo address 6', 10000, 540, 6890, 15);
      `);
    }

    // 5. Create udhaar_transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS udhaar_transactions (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL, -- 'debit' (credit purchase) or 'credit' (repayment)
        amount NUMERIC(10,2) NOT NULL,
        payment_mode VARCHAR(50) DEFAULT 'Cash',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed sample transactions if empty
    const txCount = await client.query("SELECT COUNT(*) FROM udhaar_transactions");
    if (parseInt(txCount.rows[0].count, 10) === 0) {
      const firstCust = await client.query("SELECT id FROM customers ORDER BY id LIMIT 1");
      if (firstCust.rows.length > 0) {
        const cId = firstCust.rows[0].id;
        await client.query(`
          INSERT INTO udhaar_transactions (customer_id, type, amount, payment_mode, notes, created_at)
          VALUES 
            ($1, 'debit', 860, 'Credit', 'Purchase on credit - Invoice #SS-1984', NOW() - INTERVAL '6 days'),
            ($1, 'credit', 1500, 'UPI', 'UPI Repayment received', NOW() - INTERVAL '10 days'),
            ($1, 'debit', 1240, 'Credit', 'Purchase on credit - Invoice #SS-1851', NOW() - INTERVAL '16 days'),
            ($1, 'debit', 2680, 'Credit', 'Monthly grocery credit bill', NOW() - INTERVAL '25 days');
        `, [cId]);
      }
    }

    // 6. Create ivr_orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ivr_orders (
        id SERIAL PRIMARY KEY,
        caller_name VARCHAR(150) NOT NULL,
        caller_phone VARCHAR(50) NOT NULL,
        transcript TEXT NOT NULL,
        parsed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
        total_amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Needs review', -- 'Needs review', 'Confirmed', 'Delivered'
        language VARCHAR(50) DEFAULT 'Hindi',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed sample IVR calls if empty
    const ivrCount = await client.query("SELECT COUNT(*) FROM ivr_orders");
    if (parseInt(ivrCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO ivr_orders (caller_name, caller_phone, transcript, parsed_items, total_amount, status, language, created_at)
        VALUES 
          ('Demo Customer 6', '00000 00006', '2 Amul Milk packet, 1 Tata Salt aur 1 Parle-G bhej dijiye', '[{"name": "Amul Milk 500ml", "qty": 2, "price": 33}, {"name": "Tata Salt 1kg", "qty": 1, "price": 28}, {"name": "Parle-G 250g", "qty": 1, "price": 30}]'::jsonb, 124.00, 'Confirmed', 'Hindi', NOW() - INTERVAL '1 hour'),
          ('Demo Caller 2', '00000 00007', 'Ek Fortune Sunflower Oil 1L aur Aashirvaad Atta 5kg urgently', '[{"name": "Fortune Sunflower Oil 1L", "qty": 1, "price": 145}, {"name": "Aashirvaad Atta 5kg", "qty": 1, "price": 275}]'::jsonb, 420.00, 'Needs review', 'Hindi', NOW() - INTERVAL '2 hours'),
          ('Demo Customer 5', '00000 00005', '2 Maggi Masala 4-pack and Surf Excel 1kg please deliver today', '[{"name": "Maggi 2-Min Noodles 70g", "qty": 4, "price": 14}, {"name": "Surf Excel Easy Wash 1kg", "qty": 1, "price": 135}]'::jsonb, 191.00, 'Confirmed', 'English', NOW() - INTERVAL '3 hours'),
          ('Demo Caller 4', '00000 00008', '1 India Gate Basmati 5kg aur 2 Amul Milk pack', '[{"name": "India Gate Basmati Rice 1kg", "qty": 5, "price": 120}, {"name": "Amul Milk 500ml", "qty": 2, "price": 33}]'::jsonb, 666.00, 'Delivered', 'Hindi', NOW() - INTERVAL '5 hours');
      `);
    }

    // 7. Create suppliers table & purchase orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        contact_person VARCHAR(150),
        phone VARCHAR(50),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        po_number VARCHAR(50) NOT NULL UNIQUE,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
        total_amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'In transit', -- 'Arriving today', 'Received', 'In transit'
        items_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed suppliers & purchase orders if empty
    const suppCount = await client.query("SELECT COUNT(*) FROM suppliers");
    if (parseInt(suppCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO suppliers (name, contact_person, phone, category)
        VALUES 
          ('Demo Supplier 1', 'Demo Contact 1', '00000 00011', 'Staples & Grains'),
          ('Demo Supplier 2', 'Demo Contact 2', '00000 00012', 'FMCG & Groceries'),
          ('Demo Supplier 3', 'Demo Contact 3', '00000 00013', 'Snacks & Beverages'),
          ('Demo Supplier 4', 'Demo Contact 4', '00000 00014', 'Dairy & Fresh');

        INSERT INTO purchase_orders (po_number, supplier_id, total_amount, status, items_summary, created_at)
        VALUES
          ('PO-1082', 1, 42600.00, 'Arriving today', 'Aashirvaad Atta (50 bags), India Gate Basmati (30 bags)', NOW() - INTERVAL '1 day'),
          ('PO-1081', 2, 28450.00, 'Received', 'Fortune Oil (10 boxes), Tata Salt (20 cartons)', NOW() - INTERVAL '3 days'),
          ('PO-1080', 3, 16820.00, 'In transit', 'Parle-G, Maggi, Britannia Biscuits assortment', NOW() - INTERVAL '2 days'),
          ('PO-1079', 4, 8240.00, 'Received', 'Amul Taaza, Butter, Paneer daily supply', NOW() - INTERVAL '4 days');
      `);
    }

    await client.query("COMMIT");
    console.log("Migrations executed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration error:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { migrate, hashPassword };
