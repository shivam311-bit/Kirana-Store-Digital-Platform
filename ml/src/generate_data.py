from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)

rng = np.random.default_rng(42)
products = [
    (1, "Milk 500ml", "Dairy", 30, 27, 10),
    (2, "Bread", "Bakery", 45, 38, 10),
    (3, "Rice 5kg", "Staples", 350, 310, 8),
    (4, "Sugar 1kg", "Staples", 48, 42, 10),
    (5, "Tea 250g", "Beverages", 120, 98, 8),
    (6, "Biscuits", "Snacks", 20, 15, 15),
    (7, "Eggs", "Dairy", 7, 5, 20),
    (8, "Cooking Oil 1L", "Staples", 150, 132, 8),
    (9, "Soap", "Personal Care", 35, 28, 10),
    (10, "Shampoo", "Personal Care", 180, 150, 5),
]

products_df = pd.DataFrame(products, columns=[
    "id", "name", "category", "price", "purchase_price", "minimum_stock"
])
products_df.to_csv(DATA / "products.csv", index=False)

dates = pd.date_range("2024-10-01", "2026-09-30", freq="D")
base_demand = {1:42, 2:32, 3:8, 4:15, 5:10, 6:28, 7:35, 8:9, 9:12, 10:4}
rows = []
sale_id = 1
item_id = 1

for d_idx, d in enumerate(dates):
    dow = d.dayofweek
    weekend = dow >= 5
    festival_boost = 1.18 if d.month in (10, 11) else (1.08 if d.month in (3, 8) else 1.0)

    day_rows = []
    for pid, name, category, price, purchase_price, min_stock in products:
        weekly = 1.12 if weekend else 1.0
        seasonal = 1 + 0.08 * np.sin(2 * np.pi * d.timetuple().tm_yday / 365.25)
        noise = rng.normal(1.0, 0.13)
        trend = 1 + 0.00015 * d_idx
        lam = max(1, base_demand[pid] * weekly * seasonal * festival_boost * trend * noise)
        qty = max(0, int(rng.poisson(lam)))
        if qty:
            day_rows.append([item_id, sale_id, d.date(), pid, qty, price, qty * price])
            item_id += 1

    if day_rows:
        rows.extend(day_rows)
        sale_id += 1

sales_items = pd.DataFrame(rows, columns=[
    "id", "sale_id", "sale_date", "product_id", "quantity", "unit_price", "line_total"
])
sales_items.to_csv(DATA / "sale_items.csv", index=False)

sales = sales_items.groupby(["sale_id", "sale_date"], as_index=False)["line_total"].sum()
sales.rename(columns={"line_total": "total_amount"}, inplace=True)
sales.to_csv(DATA / "sales.csv", index=False)

inv = []
for pid, name, category, price, purchase_price, min_stock in products:
    inv.append([pid, int(base_demand[pid] * 4), min_stock])
pd.DataFrame(inv, columns=["product_id", "current_stock", "reorder_level"]).to_csv(
    DATA / "inventory.csv", index=False
)

print(f"Generated {len(sales_items):,} sale-item rows and {len(sales):,} sales.")
