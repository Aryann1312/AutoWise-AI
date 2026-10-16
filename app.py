"""
app.py - AutoWise AI: Smart Used Car Price Prediction System.

Interactive Streamlit application featuring brand-dependent car model selection,
training-sample coverage safeguards, model evaluation dashboards, and price inference.
Redesigned with modern 3D floating cards and soft dark gradient aesthetics.
"""

from pathlib import Path

import joblib
import pandas as pd
import streamlit as st


# --------------------------------------------------
# 1. Page Configuration & Custom CSS Injection
# --------------------------------------------------

st.set_page_config(
    page_title="AutoWise AI - Used Car Price Prediction",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Load and inject custom CSS styling
CSS_PATH = Path("style.css")
if CSS_PATH.exists():
    with open(CSS_PATH, "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# Centered Top Hero Heading
st.markdown(
    """
    <div class="autowise-hero">
        <div class="autowise-badge">✨ AI-Powered Valuation</div>
        <h1 class="autowise-title">AutoWise AI</h1>
        <p class="autowise-tagline">Estimate fair market selling prices for used vehicles using trained machine learning models.</p>
    </div>
    """,
    unsafe_allow_html=True,
)


# --------------------------------------------------
# 2. Model & Metadata Loading
# --------------------------------------------------

MODEL_PATH = Path("models") / "best_model.joblib"

if not MODEL_PATH.exists():
    st.error(
        "⚠️ Trained model not found at `models/best_model.joblib`. "
        "Please train the model first by running: `python train_model.py`"
    )
    st.stop()

try:
    saved_data = joblib.load(MODEL_PATH)
except Exception as exc:
    st.error(f"Failed to load trained model bundle: {exc}")
    st.stop()

if not (isinstance(saved_data, dict) and "model" in saved_data):
    st.error(
        "The saved model file has an incompatible or outdated structure. "
        "Please run `python train_model.py` to retrain and regenerate the model."
    )
    st.stop()

model = saved_data["model"]
model_name = saved_data.get("model_name", "Random Forest")
categories = saved_data.get("categories", {})
metrics = saved_data.get("metrics", {})
year_min = int(saved_data.get("year_min", 1995))
year_max = int(saved_data.get("year_max", 2026))
km_max = int(saved_data.get("km_max", 500000))
reference_year = int(saved_data.get("reference_year", 2026))
features = saved_data.get("features", [
    "car_age", "km_driven", "brand", "car_model",
    "fuel", "seller_type", "transmission", "owner"
])

brand_models = saved_data.get("brand_models", {})
brand_model_counts = saved_data.get("brand_model_counts", {})
brand_year_ranges = saved_data.get("brand_year_ranges", {})

# Validate that the model is expecting the car_model feature
if "car_model" not in features:
    st.error(
        "The loaded model is missing the 'car_model' feature. "
        "Please re-run `python train_model.py` to train the updated model."
    )
    st.stop()


def get_options(column, defaults):
    """Retrieve unique category choices from metadata or fallback defaults."""
    values = categories.get(column, defaults)
    if not isinstance(values, (list, tuple)):
        values = defaults
    cleaned = [str(val) for val in values if pd.notna(val)]
    return sorted(set(cleaned)) if cleaned else defaults


# --------------------------------------------------
# 3. Dependent Brand & Model Dropdown Logic
# --------------------------------------------------

brand_list = sorted(brand_models.keys()) if brand_models else get_options(
    "brand", ["Maruti", "Hyundai", "Honda", "Toyota", "Ford"]
)

# Callback to reset model when brand changes
def on_brand_change():
    new_brand = st.session_state.car_brand
    valid_models = brand_models.get(new_brand, [])
    if valid_models:
        st.session_state.car_model = valid_models[0]


if "car_brand" not in st.session_state or st.session_state.car_brand not in brand_list:
    st.session_state.car_brand = "Maruti" if "Maruti" in brand_list else brand_list[0]


# --------------------------------------------------
# 4. Main Card: Vehicle Specification Form & Prediction
# --------------------------------------------------

with st.container(border=True):
    st.markdown(
        """
        <div class="card-header">
            <h2 class="card-title">Enter Vehicle Specifications</h2>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Row 1: Car Brand (Left) & Fuel Type (Right)
    r1_col1, r1_col2 = st.columns(2)

    with r1_col1:
        brand = st.selectbox(
            "Car Brand",
            brand_list,
            key="car_brand",
            on_change=on_brand_change,
            help="Select the vehicle manufacturer.",
        )

    with r1_col2:
        fuel_options = ["Petrol", "Diesel", "CNG", "Electric"]
        fuel = st.selectbox(
            "Fuel Type",
            fuel_options,
            help="Primary engine propulsion fuel.",
        )

    # Row 2: Car Model (Left) & Seller Type (Right)
    available_models = brand_models.get(brand, [])
    if not available_models:
        available_models = get_options("car_model", ["Standard"])

    if "car_model" not in st.session_state or st.session_state.car_model not in available_models:
        st.session_state.car_model = available_models[0]

    r2_col1, r2_col2 = st.columns(2)

    with r2_col1:
        car_model = st.selectbox(
            "Car Model",
            available_models,
            key="car_model",
            help=f"Models available for {brand} in the dataset.",
        )

    with r2_col2:
        seller_options = get_options(
            "seller_type", ["Individual", "Dealer", "Trustmark Dealer"]
        )
        seller_type = st.selectbox(
            "Seller Type",
            seller_options,
            help="Category of vehicle seller.",
        )

    # Row 3: Manufacturing Year (Left) & Transmission (Right)
    r3_col1, r3_col2 = st.columns(2)

    with r3_col1:
        default_year = max(year_min, min(year_max, reference_year - 6))
        year = st.number_input(
            "Manufacturing Year",
            min_value=year_min,
            max_value=year_max,
            value=default_year,
            step=1,
            help=f"Dataset records range from {year_min} to {year_max}.",
        )

    with r3_col2:
        transmission_options = ["Manual", "Automatic"]
        transmission = st.selectbox(
            "Transmission",
            transmission_options,
            help="Gearbox transmission type.",
        )

    # Row 4: Kilometres Driven (Left) & Previous Ownership (Right)
    owner_options = get_options(
        "owner",
        [
            "First Owner", "Second Owner", "Third Owner",
            "Fourth & Above Owner", "Test Drive Car"
        ]
    )
    r4_col1, r4_col2 = st.columns(2)

    with r4_col1:
        km_driven = st.number_input(
            "Kilometres Driven",
            min_value=0,
            max_value=max(km_max, 100000),
            value=45000,
            step=1000,
            help="Odometer reading in kilometres.",
        )

    with r4_col2:
        owner = st.selectbox(
            "Previous Ownership",
            owner_options,
            help="Number of registered previous owners.",
        )

    # --------------------------------------------------
    # 5. Dataset Coverage & Reliability Insights
    # --------------------------------------------------

    pair_key = f"{brand}::{car_model}"
    sample_count = brand_model_counts.get(pair_key, 0)
    brand_year_info = brand_year_ranges.get(brand, {})

    if sample_count == 0:
        st.warning(
            f"⚠️ **Unseen Combination**: No exact training records exist for **{brand} {car_model}**. "
            "Predictions will rely on generalized brand and vehicle attributes."
        )
    elif sample_count < 3:
        st.warning(
            f"⚠️ **Limited Data Coverage**: Only **{sample_count}** training record(s) exist for **{brand} {car_model}**. "
            "Estimates for rare variants have higher variance."
        )
    else:
        st.info(
            f"📊 **Data Coverage**: **{sample_count}** historical listings in dataset for **{brand} {car_model}**."
        )

    # Brand year range check
    if brand_year_info:
        b_min = brand_year_info.get("min")
        b_max = brand_year_info.get("max")
        if b_min and b_max and (year < b_min or year > b_max):
            st.caption(
                f"ℹ️ Note: Historical {brand} listings in this dataset range from **{b_min}** to **{b_max}**. "
                f"Selecting year **{year}** represents an extrapolation outside this historical span."
            )

    # --------------------------------------------------
    # 6. Prediction Execution
    # --------------------------------------------------

    # Validate that selected model belongs to the selected brand
    valid_models_for_brand = brand_models.get(brand, [])
    if brand_models and car_model not in valid_models_for_brand:
        st.error(
            f"Validation error: Selected model '{car_model}' does not belong to brand '{brand}'. "
            "Please choose a valid car model."
        )
        st.stop()

    # Derive car age using the reference year from model metadata
    car_age = max(0, reference_year - int(year))

    input_record = {
        "car_age": car_age,
        "km_driven": int(km_driven),
        "brand": brand,
        "car_model": car_model,
        "fuel": fuel,
        "seller_type": seller_type,
        "transmission": transmission,
        "owner": owner,
    }

    input_df = pd.DataFrame([input_record])[features]

    # Centered red-to-orange gradient predict button (reduced 20% on left and right, bold black text)
    if st.button("Predict Selling Price!", type="primary", use_container_width=True, key="predict_btn"):
        try:
            raw_prediction = float(model.predict(input_df)[0])

            if raw_prediction <= 0:
                st.warning(
                    "⚠️ The regression model produced a non-positive estimate for this combination. "
                    "In real markets, older vehicles maintain a baseline scrap/salvage value (~₹15,000–₹25,000)."
                )
                st.metric("Estimated Minimum Residual Value", "₹20,000")
            else:
                st.success("✅ Price Estimation Completed!")
                st.metric(
                    label="Estimated Selling Price",
                    value=f"₹{raw_prediction:,.0f}",
                    delta=f"Based on {sample_count} historical record(s)" if sample_count > 0 else "Extrapolated estimate",
                    delta_color="off"
                )
                st.caption(
                    f"Prediction produced by **{model_name}** | Reference Year: {reference_year} "
                    f"(Derived Car Age: {car_age} years). "
                    "This value is a statistical estimate reflecting historical dataset trends, "
                    "not a certified trade-in appraisal."
                )

            with st.expander("🔍 View Processed Feature Vector"):
                st.dataframe(input_df, use_container_width=True)

        except Exception as error:
            st.error(f"Prediction failed with error: {error}")
            st.info(
                "Please ensure that the saved model bundle in `models/best_model.joblib` "
                "matches the latest features from `train_model.py`."
            )


# --------------------------------------------------
# 7. Model Evaluation & Comparison Dashboard Card
# --------------------------------------------------

if isinstance(metrics, dict) and metrics:
    # Visual breathing room between the vehicle specification card and benchmark card
    st.markdown('<div class="card-separator"></div>', unsafe_allow_html=True)

    with st.container(border=True):
        st.markdown(
            f"""
            <div class="card-header">
                <h2 class="card-title">Model Evaluation & Benchmarking</h2>
                <p class="card-subtitle">Test Set Performance ({model_name})</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Unpack active model metrics
        if model_name in metrics and isinstance(metrics[model_name], dict):
            active_metrics = metrics[model_name]
        elif any(isinstance(v, dict) for v in metrics.values()):
            first_key = next(k for k in metrics if isinstance(metrics[k], dict))
            active_metrics = metrics[first_key]
        else:
            active_metrics = metrics

        metric_cols = st.columns(3)

        col_meta = [
            ("MAE", "Mean Absolute Error (MAE)", "₹"),
            ("RMSE", "Root Mean Squared Error (RMSE)", "₹"),
            ("R2", "R² Score (Coefficient of Determination)", "")
        ]

        for col, (metric_key, label, prefix) in zip(metric_cols, col_meta):
            val = active_metrics.get(metric_key, active_metrics.get(metric_key.lower()))
            with col:
                if val is not None and isinstance(val, (int, float)):
                    if metric_key == "R2":
                        st.metric(label, f"{val:.4f}")
                    else:
                        st.metric(label, f"{prefix}{val:,.2f}")

        # Model comparison table
        comparison_table = {}
        for m_label, m_values in metrics.items():
            if isinstance(m_values, dict) and any(k in m_values for k in ["MAE", "RMSE", "R2"]):
                comparison_table[m_label] = {
                    "MAE": f"₹{m_values.get('MAE', 0):,.2f}",
                    "RMSE": f"₹{m_values.get('RMSE', 0):,.2f}",
                    "R² Score": f"{m_values.get('R2', 0):.4f}",
                }

        if len(comparison_table) > 1:
            with st.expander("📊 Compare All Evaluated Models (Held-out Test Set)"):
                comp_df = pd.DataFrame.from_dict(comparison_table, orient="index")
                st.dataframe(comp_df, use_container_width=True)

        # Actual vs Predicted plot
        plot_file = Path("models") / "actual_vs_predicted.png"
        if plot_file.exists():
            with st.expander("📈 View Actual vs Predicted Scatter Chart"):
                st.image(
                    str(plot_file),
                    caption=f"Actual vs Predicted Selling Prices on Held-out Test Set ({model_name})",
                    use_container_width=True
                )
