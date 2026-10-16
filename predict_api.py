"""
Lightweight HTTP inference server for AutoWise AI.
Serves predictions directly from models/best_model.joblib on port 5001 with CORS enabled.
"""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path("models") / "best_model.joblib"
print(f"Loading trained model bundle from {MODEL_PATH}...")
bundle = joblib.load(MODEL_PATH)
model = bundle["model"]
features = bundle.get("features", [
    "car_age", "km_driven", "brand", "car_model",
    "fuel", "seller_type", "transmission", "owner"
])
reference_year = int(bundle.get("reference_year", 2026))
brand_model_counts = bundle.get("brand_model_counts", {})
model_name = bundle.get("model_name", "Random Forest")
print(f"Model {model_name} loaded successfully!")


class PredictHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        if self.path == "/health":
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "model": model_name}).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode("utf-8"))

    def do_POST(self):
        if self.path == "/predict":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                data = json.loads(body)

                brand = data.get("brand", "Maruti")
                car_model = data.get("car_model", "")
                year = int(data.get("year", 2020))
                km_driven = int(data.get("km_driven", 45000))
                fuel = data.get("fuel", "Petrol")
                seller_type = data.get("seller_type", "Individual")
                transmission = data.get("transmission", "Manual")
                owner = data.get("owner", "First Owner")

                car_age = max(0, reference_year - year)

                record = {
                    "car_age": car_age,
                    "km_driven": km_driven,
                    "brand": brand,
                    "car_model": car_model,
                    "fuel": fuel,
                    "seller_type": seller_type,
                    "transmission": transmission,
                    "owner": owner,
                }

                input_df = pd.DataFrame([record])[features]
                pred = float(model.predict(input_df)[0])

                pair_key = f"{brand}::{car_model}"
                coverage = brand_model_counts.get(pair_key, 0)

                res = {
                    "predicted_price": round(pred),
                    "coverage": coverage,
                    "car_age": car_age,
                    "model_name": model_name,
                    "reference_year": reference_year,
                    "record": record,
                }

                self._set_headers(200)
                self.wfile.write(json.dumps(res).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))


def run(port=5001):
    server = HTTPServer(("0.0.0.0", port), PredictHandler)
    print(f"Prediction API running on http://localhost:{port}/predict")
    server.serve_forever()


if __name__ == "__main__":
    run()
