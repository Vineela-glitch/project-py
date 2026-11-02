"""Flask application for the Agricultural Crop Production Analysis System."""

from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

DATA_FILE = Path(__file__).parent / "data" / "agricultural_data.csv"
REQUIRED_COLUMNS = {
    "state",
    "crop",
    "yield_tons_per_hectare",
    "selling_price_inr_per_ton",
    "cultivation_cost_inr_per_hectare",
    "data_year",
    "source",
}
NUMERIC_COLUMNS = [
    "yield_tons_per_hectare",
    "selling_price_inr_per_ton",
    "cultivation_cost_inr_per_hectare",
]


def load_agricultural_data():
    """Load and validate the CSV before using it for an analysis."""
    if not DATA_FILE.is_file():
        raise FileNotFoundError(f"Dataset not found: {DATA_FILE}")

    data = pd.read_csv(DATA_FILE)
    missing_columns = REQUIRED_COLUMNS.difference(data.columns)
    if missing_columns:
        raise ValueError(
            "Dataset is missing required columns: "
            + ", ".join(sorted(missing_columns))
        )
    if data.empty:
        raise ValueError("The agricultural dataset contains no records.")
    if data[list(REQUIRED_COLUMNS)].isnull().any().any():
        raise ValueError("The agricultural dataset contains empty required values.")

    for column in NUMERIC_COLUMNS:
        data[column] = pd.to_numeric(data[column], errors="raise")
    if (data["yield_tons_per_hectare"] <= 0).any():
        raise ValueError("Crop yields in the dataset must be greater than zero.")
    if (data[["selling_price_inr_per_ton", "cultivation_cost_inr_per_hectare"]] < 0).any().any():
        raise ValueError("Prices and cultivation costs cannot be negative.")
    return data


def get_crops():
    """Return crop names in a stable, user-friendly order."""
    return sorted(load_agricultural_data()["crop"].unique().tolist())


@app.get("/")
def home():
    try:
        crops = get_crops()
    except (OSError, ValueError, pd.errors.ParserError) as error:
        app.logger.exception("Unable to load the crop dataset.")
        return render_template("index.html", crops=[], data_error=str(error)), 500
    return render_template("index.html", crops=crops, data_error=None)


@app.get("/about")
def about():
    return render_template("about.html")


@app.post("/api/analyze")
def analyze_crop():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Please submit a valid JSON request."}), 400

    crop = payload.get("crop")
    if not isinstance(crop, str) or not crop.strip():
        return jsonify({"error": "Select a crop before starting the analysis."}), 400

    try:
        data = load_agricultural_data()
    except (OSError, ValueError, pd.errors.ParserError) as error:
        app.logger.exception("Unable to load the crop dataset.")
        return jsonify({"error": f"The dataset could not be loaded: {error}"}), 500

    available_crops = data["crop"].unique().tolist()
    if crop not in available_crops:
        return jsonify({"error": "That crop is not available in the dataset."}), 400

    crop_data = data.loc[data["crop"] == crop].copy()
    crop_data["estimated_revenue_inr_per_hectare"] = (
        crop_data["yield_tons_per_hectare"]
        * crop_data["selling_price_inr_per_ton"]
    )
    crop_data["estimated_profit_inr_per_hectare"] = (
        crop_data["estimated_revenue_inr_per_hectare"]
        - crop_data["cultivation_cost_inr_per_hectare"]
    )
    crop_data = crop_data.sort_values(
        ["estimated_profit_inr_per_hectare", "state"],
        ascending=[False, True],
    ).reset_index(drop=True)
    crop_data.insert(0, "rank", range(1, len(crop_data) + 1))

    records = crop_data.rename(
        columns={
            "yield_tons_per_hectare": "yield_tons_per_hectare",
            "selling_price_inr_per_ton": "selling_price_inr_per_ton",
            "cultivation_cost_inr_per_hectare": "cultivation_cost_inr_per_hectare",
            "estimated_revenue_inr_per_hectare": "estimated_revenue_inr_per_hectare",
            "estimated_profit_inr_per_hectare": "estimated_profit_inr_per_hectare",
        }
    )[
        [
            "rank",
            "state",
            "crop",
            "yield_tons_per_hectare",
            "selling_price_inr_per_ton",
            "cultivation_cost_inr_per_hectare",
            "estimated_revenue_inr_per_hectare",
            "estimated_profit_inr_per_hectare",
            "data_year",
            "source",
        ]
    ]
    return jsonify(
        {
            "crop": crop,
            "winner": records.iloc[0].to_dict(),
            "results": records.to_dict(orient="records"),
            "data_note": (
                "Illustrative sample data only—not official or current "
                "state-wise agricultural statistics."
            ),
        }
    )


@app.errorhandler(404)
def page_not_found(_error):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True)
