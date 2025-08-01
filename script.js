let labels = [];
for (let i = 0; i <= 7200; i += 300) {
  labels.push(i);
}

function generateGT2RSValues() {
  return labels
    .map((rpm) => {
      if (rpm < 2500) return 150;
      if (rpm < 4000) return 300 + (rpm - 2500) * 0.28;
      if (rpm <= 6700) return 700;
      if (rpm > 6700) return Math.max(0, 700 - (rpm - 6700) * 0.4);
      return 0;
    })
    .map((v) => Math.round(v));
}

let values = generateGT2RSValues();
let valuesKW = values.map((v) => +(v * 0.7355).toFixed(1));

function createSliders(filter = null) {
  let slidersDiv = document.getElementById("sliders");
  slidersDiv.innerHTML = "";

  for (let i = 0; i < labels.length; i++) {
    const rpmStr = labels[i].toString();
    if (filter !== null && !rpmStr.includes(filter.toString())) continue;

    slidersDiv.innerHTML += `
      <div class="slider-group">
        <label for="slider${i}">Régime = ${labels[i]} tr/min</label>
        <input type="range" min="0" max="1200" value="${values[i]}" id="slider${i}" oninput="updateValue(${i}, this.value, true)">
        <input type="number" min="0" max="1200" value="${values[i]}" id="number${i}" oninput="updateValue(${i}, this.value, false)">
      </div>
    `;
  }

  if (filter !== null && slidersDiv.innerHTML === "") {
    slidersDiv.innerHTML = `<div style="padding: 10px; color: #ef4444; text-align: center;">Aucun slider ne correspond à "${filter}"</div>`;
  }
}

function updateValue(index, val, fromSlider) {
  val = Math.max(0, Math.min(1200, Number(val)));
  values[index] = Math.round(val);
  valuesKW[index] = +(val * 0.7355).toFixed(1);
  document.getElementById("slider" + index).value = values[index];
  document.getElementById("number" + index).value = values[index];

  Courbes.data.datasets[0].data = values;
  Courbes.data.datasets[1].data = valuesKW;
  Courbes.options.scales.y.suggestedMax = Math.max(...values) * 1.1;
  Courbes.options.scales.y1.max =
    Courbes.options.scales.y.suggestedMax * 0.7355;
  Courbes.update();
  createTable();
}

function resetValues() {
  values = generateGT2RSValues();
  valuesKW = values.map((v) => +(v * 0.7355).toFixed(1));
  createSliders();
  Courbes.data.datasets[0].data = values;
  Courbes.data.datasets[1].data = valuesKW;
  Courbes.options.scales.y.suggestedMax = Math.max(...values) * 1.1;
  Courbes.options.scales.y1.max =
    Courbes.options.scales.y.suggestedMax * 0.7355;
  Courbes.update();
  createTable();
}

function smoothCurve() {
  let smoothed = [...values];
  for (let i = 1; i < values.length - 1; i++) {
    smoothed[i] = Math.round((values[i - 1] + values[i] + values[i + 1]) / 3);
  }
  values = smoothed;
  valuesKW = values.map((v) => +(v * 0.7355).toFixed(1));
  for (let i = 0; i < values.length; i++) {
    document.getElementById("slider" + i).value = values[i];
    document.getElementById("number" + i).value = values[i];
  }
  Courbes.data.datasets[0].data = values;
  Courbes.data.datasets[1].data = valuesKW;
  Courbes.options.scales.y.suggestedMax = Math.max(...values) * 1.1;
  Courbes.options.scales.y1.max =
    Courbes.options.scales.y.suggestedMax * 0.7355;
  Courbes.update();
  createTable();
}

function createTable() {
  let tableHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
      <button id="copy-table-button" onclick="copyTable()">Copier les données</button>
    </div>
    <table>
      <tr><th>Régime (tr/min)</th><th>Puissance (kW)</th></tr>
  `;
  for (let i = 0; i < labels.length; i++) {
    tableHTML += `<tr><td>${labels[i]}</td><td>${valuesKW[i]}</td></tr>`;
  }
  tableHTML += `</table>`;
  document.getElementById("table-container").innerHTML = tableHTML;
}

let ctx = document.getElementById("Courbes").getContext("2d");
let Courbes = new Chart(ctx, {
  type: "line",
  data: {
    labels: labels,
    datasets: [
      {
        label: "Puissance moteur (ch)",
        data: values,
        backgroundColor: "rgba(255,0,0,0.2)",
        borderColor: "rgba(255,0,0,1)",
        borderWidth: 2,
        yAxisID: "y",
      },
      {
        label: "Puissance moteur (kW)",
        data: valuesKW,
        backgroundColor: "rgba(0,255,0,0.2)",
        borderColor: "rgba(0,255,0,1)",
        borderWidth: 2,
        yAxisID: "y1",
      },
    ],
  },
  options: {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Régime moteur (tr/min)",
        },
      },
      y: {
        beginAtZero: true,
        position: "left",
        title: {
          display: true,
          text: "Puissance (ch)",
        },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        title: {
          display: true,
          text: "Puissance (kW)",
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function (value) {
            return (value * 0.7355).toFixed(0);
          },
        },
      },
    },
  },
});
createSliders();
createTable();

function copyTable() {
  let output = "";
  for (let i = 0; i < labels.length; i++) {
    output += `${labels[i]} | ${valuesKW[i]}\n`;
  }

  navigator.clipboard
    .writeText(output)
    .then(() => alert("Tableau copié dans le presse-papiers !"))
    .catch((err) => alert("Erreur lors de la copie : " + err));
}

function scrollToSlider(input) {
  const filter = input.trim();
  if (filter === "") {
    createSliders();
    return;
  }

  createSliders(filter);

  const firstMatch = document.querySelector(".slider-group");
  if (firstMatch) {
    firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
    firstMatch.style.boxShadow = "0 0 10px 3px #3b82f6";
    setTimeout(() => (firstMatch.style.boxShadow = ""), 1000);
  }
}
function importValues() {
  const input = document.getElementById("import-input").value.trim();
  const lines = input.split("\n");

  let newLabels = [];
  let newValuesKW = [];

  for (let line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length !== 2) continue;

    const rpm = parseInt(parts[0]);
    const kW = parseFloat(parts[1]);

    if (!isNaN(rpm) && !isNaN(kW)) {
      newLabels.push(rpm);
      newValuesKW.push(kW);
    }
  }

  if (newLabels.length === 0) {
    alert("Aucune donnée valide détectée. Format attendu : 1500 | 150");
    return;
  }

  // Met à jour les données globales
  labels = newLabels;
  valuesKW = newValuesKW;
  values = newValuesKW.map((kW) => Math.round(kW / 0.7355));

  // Recharge tous les éléments
  createSliders();
  createTable();

  Courbes.data.labels = labels;
  Courbes.data.datasets[0].data = values;
  Courbes.data.datasets[1].data = valuesKW;
  Courbes.options.scales.y.suggestedMax = Math.max(...values) * 1.1;
  Courbes.options.scales.y1.max =
    Courbes.options.scales.y.suggestedMax * 0.7355;
  Courbes.update();
}













