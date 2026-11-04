# Kirana ML MVP — 30 Minute Setup

This starter implements:
1. Synthetic 2-year Kirana sales data
2. PostgreSQL schema
3. XGBoost demand forecasting
4. Smart reorder calculation
5. FastAPI endpoints for the frontend

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
