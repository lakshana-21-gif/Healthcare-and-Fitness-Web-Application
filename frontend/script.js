/* =========================
   script.js — Health & Fitness Tracker
   Features + bar charts + weekly overview + vascular 1-100
========================= */

const STORAGE_KEY = "health_history_v2";

/* default history structure */
let history = {
  steps: [], glucose: [], sleep: [], bmi: [], water: [], workout: [], bp: [],
  mood: [], age: [], antioxidant: [], vascular: []
};

/* chart objects */
const charts = {};

/* mapping for quick chart creation */
const CHART_MAP = {
  steps: {canvasId: "stepsChart", allCanvasId: "allStepsChart", label: "Steps", color: "#007bff"},
  glucose: {canvasId: "glucoseChart", allCanvasId: "allGlucoseChart", label: "Glucose (mg/dL)", color: "#ff4d4f"},
  sleep: {canvasId: "sleepChart", allCanvasId: "allSleepChart", label: "Sleep (hrs)", color: "#28a745"},
  bmi: {canvasId: "bmiChart", allCanvasId: "allBMIChart", label: "BMI", color: "#ffc107"},
  water: {canvasId: "waterChart", allCanvasId: "allWaterChart", label: "Water (glasses)", color: "#17a2b8"},
  bp: {canvasId: "bpChart", allCanvasId: "allBPChart", label: "BP (avg)", color: "#6f42c1"},
  mood: {canvasId: "moodChart", allCanvasId: "allMoodChart", label: "Mood", color: "#ff69b4"},
  age: {canvasId: "ageChart", allCanvasId: "allAgeChart", label: "Age", color: "#00c853"},
  antioxidant: {canvasId: "antioxidantChart", allCanvasId: "allAntioxidantChart", label: "Antioxidant", color: "#ff6f00"},
  vascular: {canvasId: "vascularChart", allCanvasId: "allVascularChart", label: "Vascular", color: "#2196f3"}
};

/* --- Utilities --- */
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (let k of Object.keys(history)) {
        if (Array.isArray(parsed[k])) history[k] = parsed[k].slice(-14);
      }
    }
  } catch (e) { console.warn("Could not load history", e); }
}

function saveHistory() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); }
  catch(e){ console.warn("save error", e); }
}

function addEntry(key, value) {
  if (!history[key]) history[key] = [];
  history[key].push(value);
  if (history[key].length > 14) history[key].shift();
  saveHistory();
  updateChart(key);
  updateAllChartsView();
  renderWeeklyOverview();
}

/* --- Show/hide sections --- */
function showSection(id) {
  document.querySelectorAll("main section").forEach(s => {
    s.classList.remove("visible");
    s.classList.add("hidden");
  });
  const sec = document.getElementById(id);
  if (sec) {
    sec.classList.remove("hidden");
    sec.classList.add("visible");
    Object.keys(CHART_MAP).forEach(k => {
      const cfg = CHART_MAP[k];
      if (charts[k] && document.getElementById(cfg.canvasId)) charts[k].resize();
    });
    if(id === "charts") renderWeeklyOverview();
  }
}

/* --- Chart helpers (Bar charts) --- */
function createChartInstance(ctx, label, data, color) {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: (data || []).map((_, i) => `#${i+1}`),
      datasets: [{
        label,
        data: data || [],
        backgroundColor: hexToRgba(color, 0.6),
        borderColor: color,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, ticks: { autoSkip: false } },
        y: { beginAtZero: true }
      },
      plugins: { legend: { display: true } }
    }
  });
}

function updateChart(key) {
  const cfg = CHART_MAP[key];
  if (!cfg) return;

  if (charts[key]) {
    charts[key].data.labels = (history[key] || []).map((_,i) => `#${i+1}`);
    charts[key].data.datasets[0].data = history[key] || [];
    charts[key].update();
  }

  if (charts["all_"+key]) {
    charts["all_"+key].data.labels = (history[key] || []).map((_,i) => `#${i+1}`);
    charts["all_"+key].data.datasets[0].data = history[key] || [];
    charts["all_"+key].update();
  }
}

function updateAllChartsView() {
  Object.keys(CHART_MAP).forEach(k => updateChart(k));
}

function hexToRgba(hex, alpha=0.2) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* --- Weekly Overview Chart --- */
function renderWeeklyOverview() {
  const canvas = document.getElementById("weeklyOverviewChart");
  if (!canvas) return;

  const days = history.steps.map((_, i) => `#${i+1}`);

  if(canvas.chartInstance) canvas.chartInstance.destroy();

  canvas.chartInstance = new Chart(canvas.getContext("2d"), {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        { label: "Steps", data: history.steps || [], backgroundColor: "#007bff" },
        { label: "Sleep (hrs)", data: history.sleep || [], backgroundColor: "#28a745" },
        { label: "Water", data: history.water || [], backgroundColor: "#17a2b8" },
        { label: "BMI", data: history.bmi || [], backgroundColor: "#ffc107" },
        { label: "BP", data: history.bp || [], backgroundColor: "#6f42c1" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: { x: { stacked: false }, y: { beginAtZero: true } }
    }
  });
}

/* --- Feature functions --- */
function checkBMI() {
  const h = parseFloat(document.getElementById("height").value);
  const w = parseFloat(document.getElementById("weight").value);
  if (!h || !w) { alert("Enter height and weight"); return; }
  const bmi = +(w / ((h/100)*(h/100)));
  const bmiRounded = Math.round(bmi*10)/10;
  let cat = bmi<18.5?"Underweight":bmi<25?"Normal":bmi<30?"Overweight":"Obese";
  document.getElementById("bmiResult").innerText = `BMI ${bmiRounded} — ${cat}`;
  addEntry("bmi", bmiRounded);
}

function checkWater() {
  const val = parseInt(document.getElementById("waterGlasses").value);
  if (isNaN(val)) { alert("Enter number of glasses"); return; }
  document.getElementById("waterResult").innerText = `You logged ${val} glasses`;
  addEntry("water", val);
}

function checkWorkout() {
  const mins = parseInt(document.getElementById("workoutMins").value);
  const type = document.getElementById("workoutType").value;
  if (isNaN(mins)) { alert("Enter minutes"); return; }
  document.getElementById("workoutResult").innerText = `Saved ${mins} min (${type})`;
  addEntry("workout", mins);
}

function checkBP() {
  const s = parseInt(document.getElementById("systolic").value);
  const d = parseInt(document.getElementById("diastolic").value);
  if (isNaN(s)||isNaN(d)){ alert("Enter both values"); return; }
  let msg = `${s}/${d} mmHg — `;
  if (s<90||d<60) msg+="Low";
  else if (s<=120&&d<=80) msg+="Normal";
  else if (s<=139||d<=89) msg+="Prehypertension";
  else msg+="High";
  document.getElementById("bpResult").innerText = msg;
  addEntry("bp", Math.round((s+d)/2));
}

function checkGlucose() {
  const g = parseFloat(document.getElementById("glucoseValue").value);
  const type = document.getElementById("glucoseType").value;
  if (isNaN(g)) { alert("Enter glucose"); return; }
  let msg = `${g} mg/dL — `;
  if(type==="fasting"){ msg+= g<70?"Low":g<=99?"Normal":g<=125?"Prediabetes":"Diabetes"; }
  else { msg+= g<140?"Normal":g<=199?"Prediabetes":"Diabetes"; }
  document.getElementById("glucoseResult").innerText = msg;
  addEntry("glucose", g);
}

function checkSleep() {
  const hrs = parseFloat(document.getElementById("sleepHours").value);
  if (isNaN(hrs)) { alert("Enter hours"); return; }
  let msg = `You slept ${hrs} hrs — `;
  msg += hrs<5?"Very Poor":hrs<7?"Below Recommended":hrs<=9?"Healthy":"Oversleep";
  document.getElementById("sleepResult").innerText = msg;
  addEntry("sleep", hrs);
}

function checkSteps() {
  const s = parseInt(document.getElementById("stepsCount").value);
  if (isNaN(s)) { alert("Enter steps"); return; }
  let msg = s<5000?"Low":s<10000?"Good":"Excellent";
  document.getElementById("stepsResult").innerText = `${s} steps — ${msg}`;
  addEntry("steps", s);
}

function checkMood() {
  const v = parseInt(document.getElementById("moodSlider").value);
  const labels = {1:"Very Sad",2:"Sad",3:"Neutral",4:"Happy",5:"Very Happy"};
  document.getElementById("moodResult").innerText = labels[v];
}

function checkAge() {
  const a = parseInt(document.getElementById("ageValue").value);
  if (isNaN(a)) { alert("Enter age"); return; }
  const res = a<30?"Young":a<50?"Middle-aged":"Senior";
  document.getElementById("ageResult").innerText = `${a} — ${res}`;
}

function checkAntioxidant() {
  const v = parseInt(document.getElementById("antioxidantValue").value);
  if (isNaN(v)) { alert("Enter a number"); return; }
  const res = v<3?"Low — add more fruits/veggies":v<6?"Moderate":"High";
  document.getElementById("antioxidantResult").innerText = res;
}

/* --- Vascular Stress 1-100 with exercises --- */
function checkVascular() {
  const v = parseInt(document.getElementById("stressValue").value);
  if (isNaN(v) || v<1 || v>100) { alert("Enter stress level 1-100"); return; }

  let res = "";
  let exercise = "";

  if(v<=10){ res="Very Low Stress"; exercise="Light stretching or walk"; }
  else if(v<=30){ res="Low Stress"; exercise="Breathing exercises or meditation"; }
  else if(v<=50){ res="Moderate Stress"; exercise="Yoga or mindful stretching"; }
  else if(v<=70){ res="High Stress"; exercise="Cardio (running, brisk walk) or guided meditation"; }
  else if(v<=90){ res="Very High Stress"; exercise="Intense workout (cycling, HIIT) + deep breathing"; }
  else{ res="Extreme Stress"; exercise="Professional guidance recommended + relaxation exercises"; }

  document.getElementById("vascularResult").innerText = `${res} — Recommended: ${exercise}`;
  addEntry("vascular", v);
}

/* --- init: load history + create charts --- */
function initApp() {
  loadHistory();

  Object.keys(CHART_MAP).forEach(key => {
    const cfg = CHART_MAP[key];
    const sectionCanvas = document.getElementById(cfg.canvasId);
    if(sectionCanvas) charts[key] = createChartInstance(sectionCanvas.getContext("2d"), cfg.label, history[key] || [], cfg.color);
    const allCanvas = document.getElementById(cfg.allCanvasId);
    if(allCanvas) charts["all_"+key] = createChartInstance(allCanvas.getContext("2d"), cfg.label, history[key] || [], cfg.color);
  });

  updateAllChartsView();
  renderWeeklyOverview();
}

document.addEventListener("DOMContentLoaded", initApp);

/* Make functions accessible from HTML */
window.showSection = showSection;
window.checkBMI = checkBMI;
window.checkWater = checkWater;
window.checkWorkout = checkWorkout;
window.checkBP = checkBP;
window.checkGlucose = checkGlucose;
window.checkSleep = checkSleep;
window.checkSteps = checkSteps;
window.checkMood = checkMood;
window.checkAge = checkAge;
window.checkAntioxidant = checkAntioxidant;
window.checkVascular = checkVascular;