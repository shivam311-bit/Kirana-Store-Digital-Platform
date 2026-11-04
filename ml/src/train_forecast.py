from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

ROOT = Path(__file__).resolve().parents[1]
DATA, MODELS, OUT = ROOT / "data", ROOT / "models", ROOT / "outputs"
MODELS.mkdir(exist_ok=True)
OUT.mkdir(exist_ok=True)

items = pd.read_csv(DATA / "sale_items.csv", parse_dates=["sale_date"])
products = pd.read_csv(DATA / "products.csv")

dates = pd.date_range(items.sale_date.min(), items.sale_date.max(), freq="D")
idx = pd.MultiIndex.from_product([dates, products.id], names=["sale_date", "product_id"])
daily = (
    items.groupby(["sale_date", "product_id"])["quantity"]
    .sum().reindex(idx, fill_value=0).reset_index()
)

daily["day_of_week"] = daily.sale_date.dt.dayofweek
daily["month"] = daily.sale_date.dt.month
daily["is_weekend"] = (daily.day_of_week >= 5).astype(int)
daily["day_of_year"] = daily.sale_date.dt.dayofyear

for lag in [1, 7, 14]:
    daily[f"lag_{lag}"] = daily.groupby("product_id")["quantity"].shift(lag)

for window in [7, 14, 30]:
    daily[f"rolling_{window}"] = (
        daily.groupby("product_id")["quantity"]
        .transform(lambda s: s.shift(1).rolling(window).mean())
    )

daily = daily.dropna().reset_index(drop=True)

features = [
    "product_id", "day_of_week", "month", "is_weekend", "day_of_year",
    "lag_1", "lag_7", "lag_14", "rolling_7", "rolling_14", "rolling_30"
]

cutoff = daily.sale_date.quantile(0.80)
train = daily[daily.sale_date <= cutoff]
test = daily[daily.sale_date > cutoff]

model = XGBRegressor(
    n_estimators=500, max_depth=7, learning_rate=0.05,
    subsample=0.85, colsample_bytree=0.85,
    objective="reg:squarederror", random_state=42
)
model.fit(train[features], train["quantity"])

pred = np.maximum(0, model.predict(test[features]))
mae = mean_absolute_error(test["quantity"], pred)
rmse = mean_squared_error(test["quantity"], pred) ** 0.5

joblib.dump(model, MODELS / "demand_model.joblib")
with open(OUT / "metrics.json", "w") as f:
    json.dump({"model": "XGBoost", "MAE": float(mae), "RMSE": float(rmse)}, f, indent=2)

forecast_date = daily.sale_date.max() + pd.Timedelta(days=1)
rows = []

for pid in products.id:
    hist = daily[daily.product_id == pid].sort_values("sale_date")
    recent = hist.tail(30)["quantity"].to_numpy()
    row = {
        "product_id": pid,
        "day_of_week": forecast_date.dayofweek,
        "month": forecast_date.month,
        "is_weekend": int(forecast_date.dayofweek >= 5),
        "day_of_year": forecast_date.dayofyear,
        "lag_1": recent[-1],
        "lag_7": recent[-7],
        "lag_14": recent[-14],
        "rolling_7": recent[-7:].mean(),
        "rolling_14": recent[-14:].mean(),
        "rolling_30": recent.mean(),
    }
    yhat = max(0, float(model.predict(pd.DataFrame([row])[features])[0]))
    rows.append([pid, forecast_date.date(), round(yhat, 2)])

predictions = pd.DataFrame(rows, columns=[
    "product_id", "prediction_date", "predicted_quantity"
])
predictions["model_name"] = "XGBoost-v1"
predictions.to_csv(OUT / "predictions.csv", index=False)

inventory = pd.read_csv(DATA / "inventory.csv")
r = predictions.merge(inventory, on="product_id", how="left")
lead_time_days, safety_days, target_days = 3, 1.5, 7
r["reorder_point"] = (r["predicted_quantity"] * (lead_time_days + safety_days)).round()
r["reorder_required"] = r.current_stock < r.reorder_point
r["recommended_quantity"] = np.maximum(
    0, np.ceil(r.predicted_quantity * target_days - r.current_stock)
).astype(int)
r.to_csv(OUT / "reorder_recommendations.csv", index=False)

print(f"MAE: {mae:.2f}")
print(f"RMSE: {rmse:.2f}")
print("Saved model and predictions.")
