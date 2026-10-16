"""
clean_dataset.py - Safe, reproducible dataset cleaning for AutoWise AI.

Performs systematic data cleaning on used_cars.csv and outputs used_cars_cleaned.csv
without overwriting or modifying the original raw dataset.
"""

from pathlib import Path
import re
import pandas as pd


INPUT_PATH = Path("used_cars.csv")
BACKUP_PATH = Path("used_cars_backup.csv")
OUTPUT_PATH = Path("used_cars_cleaned.csv")


def clean_car_name(name: str) -> str:
    """Normalize car name strings and correct dataset anomalies."""
    if not isinstance(name, str):
        return "Unknown"
    # Collapse multiple consecutive whitespaces
    clean = " ".join(name.strip().split())
    # Standardize Land Rover prefix
    clean = re.sub(r"^Land[- ]?Rover\s+Rover\b", "Land Rover", clean, flags=re.IGNORECASE)
    clean = re.sub(r"^Land-Rover\b", "Land Rover", clean, flags=re.IGNORECASE)
    # Separate Opel and Corsa
    clean = re.sub(r"^OpelCorsa\b", "Opel Corsa", clean, flags=re.IGNORECASE)
    # Fix Outlander artifact
    clean = clean.replace("OutLand-Roverer", "Outlander")
    return clean


def run_data_cleaning():
    """Execute complete reproducible data cleaning pipeline."""
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Input file not found: {INPUT_PATH}")

    # Ensure backup exists
    if not BACKUP_PATH.exists():
        import shutil
        shutil.copyfile(INPUT_PATH, BACKUP_PATH)
        print(f"Created backup at: {BACKUP_PATH}")

    print("=" * 60)
    print("AutoWise AI: Dataset Cleaning & Quality Enhancement")
    print("=" * 60)

    # 1. Load raw dataset
    df = pd.read_csv(INPUT_PATH)
    initial_rows = len(df)
    print(f"1. Initial raw records loaded: {initial_rows}")

    # 2. Normalize column headers
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

    # 3. Standardize text fields
    df["name"] = df["name"].apply(clean_car_name)
    for col in ["fuel", "seller_type", "transmission", "owner"]:
        df[col] = df[col].astype(str).str.strip()

    # 4. Remove exact duplicate listings
    exact_dupes = df.duplicated().sum()
    df = df.drop_duplicates().copy()
    print(f"2. Exact duplicate rows removed: {exact_dupes}")
    print(f"   Rows remaining after exact deduplication: {len(df)}")

    # 5. Resolve near-duplicate conflicting price listings
    spec_cols = ["name", "year", "km_driven", "fuel", "seller_type", "transmission", "owner"]
    conflicts = df.duplicated(subset=spec_cols, keep="last").sum()
    df = df.drop_duplicates(subset=spec_cols, keep="last").copy()
    print(f"3. Redundant relisted listings with conflicting prices resolved: {conflicts}")
    print(f"   Rows remaining after resolving relistings: {len(df)}")

    # 6. Filter out impossible / erroneous entries
    # A) Impossible mileage: 1 km on a multi-year-old vehicle (excluding test drive cars)
    invalid_km_mask = (df["km_driven"] < 100) & (df["owner"] != "Test Drive Car")
    invalid_km_count = int(invalid_km_mask.sum())
    df = df[~invalid_km_mask].copy()
    print(f"4. Invalid/placeholder mileage records removed (km < 100 on used cars): {invalid_km_count}")

    # B) Severe odometer recording typo (> 700,000 km on standard economy cars)
    typo_km_mask = df["km_driven"] > 700000
    typo_km_count = int(typo_km_mask.sum())
    df = df[~typo_km_mask].copy()
    print(f"5. Extreme odometer entry typos removed (> 700,000 km): {typo_km_count}")

    # C) Verify valid numerical boundaries
    df["year"] = pd.to_numeric(df["year"], errors="coerce")
    df["selling_price"] = pd.to_numeric(df["selling_price"], errors="coerce")
    df["km_driven"] = pd.to_numeric(df["km_driven"], errors="coerce")

    df = df.dropna(subset=["selling_price", "year", "km_driven"])
    df = df[(df["selling_price"] > 0) & (df["km_driven"] >= 0)]

    # Cast integer columns cleanly
    df["year"] = df["year"].astype(int)
    df["selling_price"] = df["selling_price"].astype(int)
    df["km_driven"] = df["km_driven"].astype(int)

    final_rows = len(df)
    removed_rows = initial_rows - final_rows

    print("-" * 60)
    print(f"Total records retained: {final_rows} ({(final_rows / initial_rows) * 100:.1f}%)")
    print(f"Total records removed:  {removed_rows} ({(removed_rows / initial_rows) * 100:.1f}%)")
    print("-" * 60)

    # 7. Export cleaned dataset
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Cleaned dataset successfully saved to: {OUTPUT_PATH}")
    print("=" * 60)

    return df


if __name__ == "__main__":
    run_data_cleaning()
