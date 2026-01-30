const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Consciobite API" });
});

app.use("/api/products", productRoutes);

app.listen(PORT, () => {
  console.log(`Consciobite API running on http://localhost:${PORT}`);
});
