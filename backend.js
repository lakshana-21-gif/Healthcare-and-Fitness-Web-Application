const API_BASE = "http://localhost:5000"; // your backend URL

// Save a metric to backend
async function saveMetric(type, value) {
  try {
    await fetch(`${API_BASE}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, value })
    });
  } catch (err) {
    console.error("Backend save error:", err);
  }
}

// Override addEntry function safely without modifying script.js
if (window.addEntry) {
  const originalAddEntry = window.addEntry;
  window.addEntry = function(key, value) {
    originalAddEntry(key, value); // call original
    saveMetric(key, value);       // send to backend
  };
}
