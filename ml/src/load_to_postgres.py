
from pathlib import Path
import os

import pandas as pd
import psycopg

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = ROOT / "outputs"

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://kirana:kirana_dev@localhost:5432/kirana",
)


def main():
    # Read and validate the files before modifying the database.
    products = pd.read_csv(DATA / "products.csv")
    sales = pd.read_csv(DATA / "sales.csv")
    items = pd.read_csv(DATA / "sale_items.csv")
    inventory = pd.read_csv(DATA / "inventory.csv")
    predictions = pd.read_csv(OUT / "predictions.csv")

    required_columns = {
        "products": (
            products,
            {"id", "name", "category", "price", "purchase_price", "minimum_stock"},
        ),
        "sales": (sales, {"id", "sale_date", "total_amount"}),
        "sale_items": (
            items,
            {"id", "sale_id", "product_id", "quantity", "unit_price"},
        ),
        "inventory": (
            inventory,
            {"product_id", "current_stock", "reorder_level"},
        ),
        "predictions": (
            predictions,
            {"product_id", "prediction_date", "predicted_quantity", "model_name"},
        ),
    }

    for table_name, (frame, required) in required_columns.items():
        missing = required - set(frame.columns)
        if missing:
            raise ValueError(
                f"{table_name} CSV is missing columns: {sorted(missing)}"
            )

    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # All changes below are part of one transaction.
            # If an insert fails, PostgreSQL rolls the transaction back.
            cur.execute((ROOT / "schema.sql").read_text(encoding="utf-8"))

            # Delete child rows before parent rows to respect foreign keys.
            cur.execute("DELETE FROM sale_items")
            cur.execute("DELETE FROM ml_predictions")
            cur.execute("DELETE FROM inventory")
            cur.execute("DELETE FROM sales")
            cur.execute("DELETE FROM products")

            cur.executemany(
                """
                INSERT INTO products
                    (id, name, category, price, purchase_price, minimum_stock)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                products[
                    [
                        "id", "name", "category", "price",
                        "purchase_price", "minimum_stock",
                    ]
                ].itertuples(index=False, name=None),
            )

            cur.executemany(
                """
                INSERT INTO sales (id, sale_date, total_amount)
                VALUES (%s, %s, %s)
                """,
                sales[["id", "sale_date", "total_amount"]].itertuples(
                    index=False, name=None
                ),
            )

            cur.executemany(
                """
                INSERT INTO sale_items
                    (id, sale_id, product_id, quantity, unit_price)
                VALUES (%s, %s, %s, %s, %s)
                """,
                items[
                    ["id", "sale_id", "product_id", "quantity", "unit_price"]
                ].itertuples(index=False, name=None),
            )

            cur.executemany(
                """
                INSERT INTO inventory
                    (product_id, current_stock, reorder_level)
                VALUES (%s, %s, %s)
                """,
                inventory[
                    ["product_id", "current_stock", "reorder_level"]
                ].itertuples(index=False, name=None),
            )

            cur.executemany(
                """
                INSERT INTO ml_predictions
                    (product_id, prediction_date, predicted_quantity, model_name)
                VALUES (%s, %s, %s, %s)
                """,
                predictions[
                    [
                        "product_id", "prediction_date",
                        "predicted_quantity", "model_name",
                    ]
                ].itertuples(index=False, name=None),
            )

            # Reset the prediction ID sequence after replacing its records.
            cur.execute(
                """
                SELECT setval(
                    pg_get_serial_sequence('ml_predictions', 'id'),
                    COALESCE((SELECT MAX(id) FROM ml_predictions), 1),
                    EXISTS (SELECT 1 FROM ml_predictions)
                )
                """
            )

            # Report loaded row counts before the transaction commits.
            for table in (
                "products", "sales", "sale_items",
                "inventory", "ml_predictions",
            ):
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                print(f"{table}: {cur.fetchone()[0]} rows")

    print("Demo data and ML predictions loaded successfully.")


if __name__ == "__main__":
    main()