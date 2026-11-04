
const ML_BASE_URL = process.env.ML_BASE_URL || "http://127.0.0.1:8000";

async function callML(path) {
  const response = await fetch(`${ML_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`ML service returned HTTP ${response.status}`);
  }

  return response.json();
}

async function getForecast() {
  return callML("/api/ml/forecast");
}

async function getReorderRecommendations() {
  return callML("/api/ml/reorder");
}

async function getMLHealth() {
  return callML("/health");
}

module.exports = {
  getForecast,
  getReorderRecommendations,
  getMLHealth,
};