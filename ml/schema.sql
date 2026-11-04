CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    price NUMERIC(10,2),
    purchase_price NUMERIC(10,2),
    minimum_stock INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS sales (
    id BIGINT PRIMARY KEY,
    sale_date DATE NOT NULL,
    total_amount NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGINT PRIMARY KEY,
    sale_id BIGINT REFERENCES sales(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS inventory (
    product_id INTEGER PRIMARY KEY REFERENCES products(id),
    current_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS ml_predictions (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    prediction_date DATE,
    predicted_quantity NUMERIC(10,2),
    model_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
