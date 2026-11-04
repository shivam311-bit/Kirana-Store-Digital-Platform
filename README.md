# KiranaOne

A digital operations platform for neighborhood grocery stores, with a React dashboard, a Node.js API, and an optional machine-learning forecasting service.

## Project structure

- `src/` — React 19, Vite, and Tailwind CSS frontend
- `backend/` — Express API and PostgreSQL migrations
- `ml/` — FastAPI demand-forecasting API, synthetic-data generator, and PostgreSQL schema

The frontend and the two services are installed and run separately; there is no root-level workspace or shared dependency install.

## Requirements

- Node.js 20.19+ or 22.12+
- PostgreSQL 16+
- Python 3.11+
- Docker Desktop (optional, for the local PostgreSQL container)

## Run locally

### 1. Start PostgreSQL

From the project root:

```powershell
docker compose -f ml/docker-compose.yml up -d
```

The compose file is for local development only. Do not use its development credentials in a deployed environment.

### 2. Prepare the database and start the backend

In a second terminal, from the project root:

```powershell
psql "postgresql://kirana:kirana_dev@localhost:5432/kirana" -f ml/schema.sql
cd backend
npm ci
node src/services/migrate.js
npm start
```

The backend listens on `http://localhost:3000`. It reads `DATABASE_URL` when set; otherwise it uses the local development database URL in `backend/src/services/db.js`.

### 3. Start the forecasting API (optional)

In a separate terminal, from the project root:

```powershell
cd ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python src/generate_data.py
python src/train_forecast.py
python -m uvicorn src.api:app --reload --port 8000
```

The optional ML service provides `/health`, `/api/ml/forecast`, and `/api/ml/reorder`. The Node.js backend proxies its forecast routes and uses `ML_BASE_URL` if the service is hosted elsewhere.

### 4. Start the frontend

In another terminal, from the project root:

```powershell
npm ci
npm run dev
```

The frontend expects the backend at `http://localhost:3000`. Build the production frontend with `npm run build`.

## Demo data and production use

The ML data generator creates a deterministic, synthetic two-year Kirana dataset. Its starter CSVs are included under `ml/data/` and can be regenerated with `python src/generate_data.py` from the `ml/` directory. The backend migration creates clearly anonymized sample customers, suppliers, and IVR orders for local development. The displayed IVR number is a non-working placeholder. Trained model files, other generated outputs, local environments, and database dumps are not committed.

This repository is a development/demo starter, not a production deployment recipe. Review authentication, authorization, database credentials, CORS, and deployment configuration before exposing any service publicly.
