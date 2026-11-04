# Kirana ML MVP — 30 Minute Setup

This starter implements:
1. Synthetic 2-year Kirana sales data
2. PostgreSQL schema
3. XGBoost demand forecasting
4. Smart reorder calculation
5. FastAPI endpoints for the frontend

## Included sample dataset

The repository includes a reproducible synthetic dataset in `data/`:
- `products.csv` — 10 sample grocery products and their prices/stock thresholds
- `sales.csv` — daily transactions from 2024-10-01 through 2026-09-30
- `sale_items.csv` — product quantities and prices for each transaction
- `inventory.csv` — current stock and reorder levels

The sample contains 730 sales and 7,291 sale-item rows. Regenerate all four CSVs with `python src/generate_data.py` from this directory. The data is synthetic and should not be treated as real customer or market data.

## Install
- Python 3.11+: https://www.python.org/downloads/
- VS Code: https://code.visualstudio.com/
- Docker Desktop (recommended if PostgreSQL is not already installed):
  https://www.docker.com/products/docker-desktop/

## Setup

Windows PowerShell:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start PostgreSQL:
```bash
docker compose up -d
```

Generate demo data:
```bash
python src/generate_data.py
```

Train:
```bash
python src/train_forecast.py
```

Load database:
```bash
python src/load_to_postgres.py
```

Start API:
```bash
uvicorn src.api:app --reload --port 8000
```

Open:
- http://localhost:8000/docs
- http://localhost:8000/api/ml/forecast
- http://localhost:8000/api/ml/reorder

## Frontend connection

Your frontend can call:
GET http://localhost:8000/api/ml/forecast
GET http://localhost:8000/api/ml/reorder

Later, place this ML service behind your existing Node.js backend.

## Important
The generated data is demo data. Replace it with real transaction data once your application starts collecting sales.
