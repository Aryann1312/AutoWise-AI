"""
train_model.py - Model training pipeline for AutoWise AI.

Trains used car price prediction models incorporating brand and dependent
car model features, performs cross-validation model selection, evaluates on
a held-out test set, and exports pipeline artifacts and metadata.
"""

from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from car_utils import parse_car_name


# --------------------------------------------------
# 1. File paths and settings
# --------------------------------------------------

DATA_PATH = Path("used_cars_cleaned.csv") if Path("used_cars_cleaned.csv").exists() else Path("used_cars.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

MODEL_PATH = MODEL_DIR / "best_model.joblib"
COMPARISON_PATH = MODEL_DIR / "model_comparison.csv"
PLOT_PATH = MODEL_DIR / "actual_vs_predicted.png"

RANDOM_STATE = 42

# Reference year for calculating car age
REFERENCE_YEAR = 2026


# --------------------------------------------------
# 2. Load and validate dataset
# --------------------------------------------------

if not DATA_PATH.exists():
    raise FileNotFoundError(
        "used_cars.csv was not found. "
        "Place it in the project root folder."
    )

df = pd.read_csv(DATA_PATH)

# Normalize column names
df.columns = (
    df.columns.str.strip()
    .str.lower()
    .str.replace(" ", "_")
)

required_columns = [
    "name",
    "year",
    "selling_price",
    "km_driven",
    "fuel",
    "seller_type",
    "transmission",
    "owner",
]

missing = [col for col in required_columns if col not in df.columns]

if missing:
    raise ValueError(f"Missing required columns: {missing}")

# Convert numeric columns and remove unusable records
for col in ["year", "selling_price", "km_driven"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df = df.dropna(subset=["selling_price", "year", "km_driven"])
df = df[df["selling_price"] > 0]
df = df[df["km_driven"] >= 0]

# Remove exact duplicate records
df = df.drop_duplicates().copy()

if len(df) < 20:
    raise ValueError(
        "Too few usable rows after cleaning. "
        "Please check your dataset."
    )

print(f"Usable dataset rows after deduplication: {len(df)}")


# --------------------------------------------------
# 3. Feature engineering (Brand and Car Model Extraction)
# --------------------------------------------------

# Extract brand and model using the dedicated parse_car_name parser
parsed_tuples = [parse_car_name(n) for n in df["name"]]
df["brand"] = [p[0] for p in parsed_tuples]
df["car_model"] = [p[1] for p in parsed_tuples]

# Derive vehicle age based on the fixed reference year
df["car_age"] = (REFERENCE_YEAR - df["year"]).clip(lower=0)

# Intended features: car_age, km_driven, brand, car_model, fuel, seller_type, transmission, owner
feature_columns = [
    "car_age",
    "km_driven",
    "brand",
    "car_model",
    "fuel",
    "seller_type",
    "transmission",
    "owner",
]

target_column = "selling_price"

X = df[feature_columns].copy()
y = df[target_column].copy()

numeric_features = ["car_age", "km_driven"]
categorical_features = [
    "brand",
    "car_model",
    "fuel",
    "seller_type",
    "transmission",
    "owner",
]

print(f"Total unique brands: {df['brand'].nunique()}")
print(f"Total unique car models: {df['car_model'].nunique()}")


# --------------------------------------------------
# 4. Split data into training and test sets
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=RANDOM_STATE,
)

print(f"Training set rows: {len(X_train)}")
print(f"Test set rows:     {len(X_test)}")


# --------------------------------------------------
# 5. Preprocessing pipeline
# --------------------------------------------------

numeric_transformer = Pipeline(
    steps=[
        ("imputer", SimpleImputer(strategy="median")),
    ]
)

categorical_transformer = Pipeline(
    steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        (
            "onehot",
            OneHotEncoder(handle_unknown="ignore"),
        ),
    ]
)

preprocessor = ColumnTransformer(
    transformers=[
        ("num", numeric_transformer, numeric_features),
        ("cat", categorical_transformer, categorical_features),
    ]
)


def make_pipeline(regressor):
    """Create a combined preprocessing and regression pipeline."""
    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", regressor),
        ]
    )


# --------------------------------------------------
# 6. Train baseline Linear Regression & estimate CV score
# --------------------------------------------------

print("\nEvaluating baseline Linear Regression...")

linear_pipeline = make_pipeline(LinearRegression())
linear_pipeline.fit(X_train, y_train)

import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Cross-validation on training data to assess generalization
lr_cv_scores = cross_val_score(
    linear_pipeline,
    X_train,
    y_train,
    cv=3,
    scoring="neg_root_mean_squared_error",
    n_jobs=-1,
)
lr_cv_rmse = -float(np.mean(lr_cv_scores))
print(f"Linear Regression 3-Fold CV RMSE: INR {lr_cv_rmse:,.2f}")


# --------------------------------------------------
# 7. Tune Random Forest using cross-validation (training data only)
# --------------------------------------------------

print("\nTuning Random Forest using RandomizedSearchCV...")

rf_pipeline = make_pipeline(
    RandomForestRegressor(
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
)

rf_parameters = {
    "regressor__n_estimators": [100, 200, 300],
    "regressor__max_depth": [None, 15, 25, 35],
    "regressor__min_samples_split": [2, 5, 10],
    "regressor__min_samples_leaf": [1, 2, 4],
    "regressor__max_features": [0.7, 1.0],
}

search = RandomizedSearchCV(
    estimator=rf_pipeline,
    param_distributions=rf_parameters,
    n_iter=12,
    scoring="neg_root_mean_squared_error",
    cv=3,
    random_state=RANDOM_STATE,
    n_jobs=-1,
    verbose=1,
)

search.fit(X_train, y_train)

rf_cv_rmse = -float(search.best_score_)
rf_best_model = search.best_estimator_

print(f"Random Forest Best 3-Fold CV RMSE: INR {rf_cv_rmse:,.2f}")
print("Best hyperparameters found:", search.best_params_)


# --------------------------------------------------
# 8. Model Selection via Cross-Validation
# --------------------------------------------------

# Select model based on training cross-validation performance,
# avoiding data leakage or selection bias from the test set.
cv_results = {
    "Linear Regression": lr_cv_rmse,
    "Random Forest": rf_cv_rmse,
}

best_name = min(cv_results, key=lambda k: cv_results[k])
best_model = rf_best_model if best_name == "Random Forest" else linear_pipeline

print(f"\nModel selected based on CV RMSE: {best_name}")


# --------------------------------------------------
# 9. Evaluate both models on held-out test set
# --------------------------------------------------

models = {
    "Linear Regression": linear_pipeline,
    "Random Forest": rf_best_model,
}

test_results = {}
predictions = {}

print("\n--- Final Test Set Evaluation ---")
for name, model in models.items():
    y_pred = model.predict(X_test)
    predictions[name] = y_pred

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    test_results[name] = {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "R2": float(r2),
    }

    print(f"\n{name}:")
    print(f"  MAE:  INR {mae:,.2f}")
    print(f"  RMSE: INR {rmse:,.2f}")
    print(f"  R²:   {r2:.4f}")



# --------------------------------------------------
# 10. Build Brand-to-Model mappings and metadata
# --------------------------------------------------

categories = {}
for col in categorical_features:
    categories[col] = sorted(
        df[col]
        .fillna("Unknown")
        .astype(str)
        .unique()
        .tolist()
    )

# Brand to available models mapping (only models belonging to each brand)
brand_models = {}
for brand, group in df.groupby("brand"):
    brand_models[brand] = sorted(group["car_model"].dropna().unique().tolist())

# Brand and model frequency counts (for sample-size warning triggers)
brand_model_counts = {}
for (b, m), count in df.groupby(["brand", "car_model"]).size().items():
    brand_model_counts[f"{b}::{m}"] = int(count)

# Year range per brand
brand_year_ranges = {}
for brand, group in df.groupby("brand"):
    brand_year_ranges[brand] = {
        "min": int(group["year"].min()),
        "max": int(group["year"].max()),
    }

metadata = {
    "model": best_model,
    "model_name": best_name,
    "categories": categories,
    "brand_models": brand_models,
    "brand_model_counts": brand_model_counts,
    "brand_year_ranges": brand_year_ranges,
    "metrics": test_results,
    "cv_scores": cv_results,
    "year_min": int(df["year"].min()),
    "year_max": int(df["year"].max()),
    "km_max": int(df["km_driven"].max()),
    "reference_year": REFERENCE_YEAR,
    "features": feature_columns,
}

joblib.dump(metadata, MODEL_PATH)

comparison_df = pd.DataFrame(test_results).T
comparison_df.to_csv(COMPARISON_PATH, index=True)

print(f"\nSaved updated model bundle to: {MODEL_PATH}")
print(f"Saved model comparison table to: {COMPARISON_PATH}")


# --------------------------------------------------
# 11. Save actual vs predicted graph
# --------------------------------------------------

best_predictions = predictions[best_name]

plt.figure(figsize=(9, 6))
plt.scatter(y_test, best_predictions, alpha=0.60, color="#1f77b4", edgecolors="none")

min_value = min(float(y_test.min()), float(best_predictions.min()))
max_value = max(float(y_test.max()), float(best_predictions.max()))

plt.plot(
    [min_value, max_value],
    [min_value, max_value],
    "r--",
    linewidth=2,
    label="Ideal prediction line",
)

plt.xlabel("Actual Selling Price (₹)", fontsize=11)
plt.ylabel("Predicted Selling Price (₹)", fontsize=11)
plt.title(f"Actual vs Predicted Selling Prices ({best_name})", fontsize=12)
plt.legend()
plt.tight_layout()
plt.savefig(PLOT_PATH, dpi=150)
plt.close()

print(f"Saved actual vs predicted chart to: {PLOT_PATH}")
print("\nPipeline execution completed successfully!")
