import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoURL = process.env.MONGO_URL || "mongodb://localhost:27017/health_tracker";
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Schema
const metricSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., "bmi", "steps"
  value: mongoose.Schema.Types.Mixed,
  date: { type: Date, default: Date.now }
});

const Metric = mongoose.model("Metric", metricSchema);

// Routes
app.get("/metrics/:type", async (req, res) => {
  try {
    const data = await Metric.find({ type: req.params.type })
      .sort({ date: -1 })
      .limit(14);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/metrics", async (req, res) => {
  try {
    const { type, value } = req.body;
    const metric = new Metric({ type, value });
    await metric.save();
    res.json({ message: "Saved successfully", metric });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/metrics/:type", async (req, res) => {
  try {
    await Metric.deleteMany({ type: req.params.type });
    res.json({ message: `Deleted all metrics of type ${req.params.type}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
