require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());


app.get("/api/health", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    next(err);
  }
});
app.use("/api/auth", authRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});