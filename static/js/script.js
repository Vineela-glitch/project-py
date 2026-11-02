const form = document.querySelector("#analysis-form");
const resultsSection = document.querySelector("#results");
const errorMessage = document.querySelector("#error-message");
const resultBody = document.querySelector("#results-body");
const searchInput = document.querySelector("#state-search");
const analyzeButton = document.querySelector("#analyze-button");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});
let profitChart;
let currentResults = [];

function formatCurrency(value) {
  return `₹${currencyFormatter.format(value)}`;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  resultsSection.hidden = true;
}

function renderTable(rows) {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const filteredRows = rows.filter((row) =>
    row.state.toLocaleLowerCase().includes(query),
  );

  resultBody.replaceChildren(
    ...filteredRows.map((row) => {
      const tr = document.createElement("tr");
      const values = [
        row.rank,
        row.state,
        row.crop,
        Number(row.yield_tons_per_hectare).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        }),
        formatCurrency(row.selling_price_inr_per_ton),
        formatCurrency(row.cultivation_cost_inr_per_hectare),
        formatCurrency(row.estimated_revenue_inr_per_hectare),
        formatCurrency(row.estimated_profit_inr_per_hectare),
      ];

      values.forEach((value, index) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        if (index === 0) cell.className = "rank-cell";
        if (index === 7) cell.className = "profit-cell";
        tr.append(cell);
      });
      return tr;
    }),
  );
  document.querySelector("#no-matches").hidden = filteredRows.length !== 0;
}

function renderChart(rows) {
  if (typeof Chart === "undefined") {
    throw new Error("The chart library did not load. Check your internet connection and refresh.");
  }
  const context = document.querySelector("#profit-chart").getContext("2d");
  if (profitChart) profitChart.destroy();

  profitChart = new Chart(context, {
    type: "bar",
    data: {
      labels: rows.map((row) => row.state),
      datasets: [
        {
          label: "Estimated profit per hectare",
          data: rows.map((row) => row.estimated_profit_inr_per_hectare),
          backgroundColor: rows.map((_, index) =>
            index === 0 ? "#2f6848" : "#b6c8b3",
          ),
          borderRadius: 5,
          borderSkipped: false,
          maxBarThickness: 42,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${formatCurrency(context.raw)} / hectare`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#edf0eb" },
          ticks: {
            color: "#788079",
            callback: (value) => `₹${Number(value).toLocaleString("en-IN")}`,
          },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#4b554d" },
        },
      },
    },
  });
}

function renderResults(data) {
  const winner = data.winner;
  document.querySelector("#result-crop").textContent = data.crop;
  document.querySelector("#winner-state").textContent = winner.state;
  document.querySelector("#winner-profit").textContent =
    formatCurrency(winner.estimated_profit_inr_per_hectare);
  document.querySelector("#winner-revenue").textContent =
    formatCurrency(winner.estimated_revenue_inr_per_hectare);
  document.querySelector("#winner-cost").textContent =
    formatCurrency(winner.cultivation_cost_inr_per_hectare);
  document.querySelector("#state-count").textContent = data.results.length;
  document.querySelector("#data-note").textContent = data.data_note;
  document.querySelector("#dataset-year").textContent = winner.data_year;
  document.querySelector("#dataset-source").textContent = winner.source;
  currentResults = data.results;
  searchInput.value = "";
  renderTable(currentResults);
  renderChart(currentResults);
  errorMessage.hidden = true;
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  analyzeButton.disabled = true;
  analyzeButton.querySelector("span:first-child").textContent = "Analyzing...";
  errorMessage.hidden = true;
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crop: document.querySelector("#crop-select").value }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to analyze this crop.");
    renderResults(data);
  } catch (error) {
    showError(error.message || "A network error occurred. Please try again.");
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.querySelector("span:first-child").textContent = "Analyze profit";
  }
});

searchInput.addEventListener("input", () => renderTable(currentResults));

document.querySelector("#another-crop").addEventListener("click", () => {
  resultsSection.hidden = true;
  document.querySelector("#crop-select").focus();
  document.querySelector("#analyzer").scrollIntoView({ behavior: "smooth" });
});
