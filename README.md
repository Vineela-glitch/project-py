# Agricultural Crop Production Analysis System

A beginner-friendly Flask project that compares estimated crop profitability across Indian states. The app uses Pandas to calculate estimated revenue and profit, and Chart.js to visualize the ranked comparison.

> **Important data note:** `data/agricultural_data.csv` contains manually created illustrative sample values for a classroom demonstration. It is not an official dataset, does not describe a verified year, and must not be presented or relied on as real agricultural statistics. The app labels this limitation on the results and About page.

## Project structure

```text
agricultural-crop-analysis/
├── app.py
├── requirements.txt
├── README.md
├── data/
│   └── agricultural_data.csv
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
└── templates/
    ├── 404.html
    ├── about.html
    └── index.html
```

## Requirements

- Python 3.9 or newer
- pip
- VS Code (recommended)
- Internet access for the Google Fonts and Chart.js CDN resources

## Run in VS Code

1. Open this project folder in VS Code (`File` → `Open Folder...`).
2. Open the integrated terminal (`Terminal` → `New Terminal`).
3. Create and activate a virtual environment:

   **Windows PowerShell**

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, use Command Prompt instead:

   ```bat
   .venv\Scripts\activate.bat
   ```

   **macOS/Linux**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

4. Install the required Python packages:

   ```bash
   python -m pip install -r requirements.txt
   ```

5. Start the Flask development server:

   ```bash
   python app.py
   ```

6. Open **http://127.0.0.1:5000** in a browser. Select a crop and choose **Analyze profit**. The project description is available at **http://127.0.0.1:5000/about**.
7. Stop the local server with `Ctrl+C` in the terminal.

Flask's development server is intended for local development and classroom demonstration, not production deployment.

## Analysis method

- Estimated revenue per hectare = expected yield per hectare × selling price per unit.
- Estimated profit per hectare = estimated revenue per hectare − cultivation cost per hectare.

The CSV uses yield in tonnes per hectare, selling price in INR per tonne, and cultivation cost in INR per hectare. The source and data-year fields explicitly identify the records as illustrative sample values.

## Replacing the demo data

For a real analysis, replace the sample rows only with dated, verifiable information from authoritative agricultural, market-price and cost sources. Record the source and year for every value, ensure that crop/state units are consistent, and update the on-page disclosure before presenting results as real-world statistics.
