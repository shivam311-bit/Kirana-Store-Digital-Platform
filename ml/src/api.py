from pathlib import Path
import pandas as pd
from fastapi import FastAPI

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs"

app = FastAPI(title="Kirana ML API", version="1.0.0")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/ml/forecast")
def forecast():
    df = pd.read_csv(OUT / "predictions.csv")
    return {"data": df.to_dict(orient="records")}

@app.get("/api/ml/reorder")
def reorder():
    df = pd.read_csv(OUT / "reorder_recommendations.csv")
    return {"data": df.to_dict(orient="records")}
