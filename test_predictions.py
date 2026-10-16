"""
test_predictions.py - Integration test verifying model inference on multiple combinations.
"""

import joblib
import pandas as pd

meta = joblib.load("models/best_model.joblib")
model = meta["model"]
features = meta["features"]
ref_year = meta["reference_year"]

test_cars = [
    {
        "desc": "Maruti Wagon R (High-volume economy hatchback)",
        "year": 2017,
        "km_driven": 45000,
        "brand": "Maruti",
        "car_model": "Wagon R LXI Minor",
        "fuel": "Petrol",
        "seller_type": "Individual",
        "transmission": "Manual",
        "owner": "First Owner",
    },
    {
        "desc": "Land Rover Discovery Sport (Luxury SUV)",
        "year": 2018,
        "km_driven": 26000,
        "brand": "Land Rover",
        "car_model": "Discovery Sport TD4 HSE 7S",
        "fuel": "Diesel",
        "seller_type": "Individual",
        "transmission": "Automatic",
        "owner": "First Owner",
    },
    {
        "desc": "Hyundai Creta 1.6 VTVT S (Compact SUV)",
        "year": 2015,
        "km_driven": 25000,
        "brand": "Hyundai",
        "car_model": "Creta 1.6 VTVT S",
        "fuel": "Petrol",
        "seller_type": "Individual",
        "transmission": "Manual",
        "owner": "First Owner",
    },
    {
        "desc": "Toyota Corolla Altis (Executive Sedan)",
        "year": 2018,
        "km_driven": 25000,
        "brand": "Toyota",
        "car_model": "Corolla Altis 1.8 VL CVT",
        "fuel": "Petrol",
        "seller_type": "Dealer",
        "transmission": "Automatic",
        "owner": "First Owner",
    },
    {
        "desc": "BMW 3 Series (Luxury Sedan)",
        "year": 2017,
        "km_driven": 35000,
        "brand": "BMW",
        "car_model": "3 Series 320d Sport Line",
        "fuel": "Diesel",
        "seller_type": "Dealer",
        "transmission": "Automatic",
        "owner": "First Owner",
    },
    {
        "desc": "Land Rover 2007 test case (extrapolation)",
        "year": 2007,
        "km_driven": 10000,
        "brand": "Land Rover",
        "car_model": "Discovery S 2.0 SD4",
        "fuel": "Petrol",
        "seller_type": "Individual",
        "transmission": "Automatic",
        "owner": "First Owner",
    },
]

print("Running Prediction Verification Tests:\n" + "=" * 50)
for car in test_cars:
    data = dict(car)
    desc = data.pop("desc")
    year = data.pop("year")
    data["car_age"] = max(0, ref_year - year)

    input_df = pd.DataFrame([data])[features]
    prediction = float(model.predict(input_df)[0])

    pair = f"{data['brand']}::{data['car_model']}"
    sample_count = meta["brand_model_counts"].get(pair, 0)

    print(f"[{desc}]")
    print(f"  Inputs: Brand={data['brand']}, Model={data['car_model']}, Year={year} (Age={data['car_age']} yrs)")
    print(f"  Dataset Samples: {sample_count}")
    print(f"  Predicted Price: INR {prediction:,.0f}")
    assert prediction > 0, "Predicted price must be positive"
    print("  Status: PASSED\n")

print("All prediction verification tests passed successfully!")
