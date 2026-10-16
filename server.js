const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "cars.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readCars() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function saveCars(cars) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(cars, null, 2));
}

app.get("/api/cars", (req, res) => {
  let cars = readCars();
  const q = String(req.query.q || "").toLowerCase();
  const brand = String(req.query.brand || "");
  if (q) cars = cars.filter(c => `${c.brand} ${c.model} ${c.city}`.toLowerCase().includes(q));
  if (brand) cars = cars.filter(c => c.brand === brand);
  res.json(cars);
});

app.get("/api/cars/:id", (req, res) => {
  const car = readCars().find(c => c.id === Number(req.params.id));
  if (!car) return res.status(404).json({ error: "Көлік табылмады" });
  res.json(car);
});

app.post("/api/cars", (req, res) => {
  const { brand, model, year, price, mileage, city, image, description } = req.body;
  if (!brand || !model || !year || !price || !city) {
    return res.status(400).json({ error: "Міндетті жолдарды толтырыңыз." });
  }
  const cars = readCars();
  const car = {
    id: Date.now(), brand, model, year: Number(year), price: Number(price),
    mileage: Number(mileage || 0), city,
    image: image || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
    description: description || ""
  };
  cars.unshift(car);
  saveCars(cars);
  res.status(201).json(car);
});

app.delete("/api/cars/:id", (req, res) => {
  const cars = readCars();
  const updated = cars.filter(c => c.id !== Number(req.params.id));
  if (updated.length === cars.length) return res.status(404).json({ error: "Көлік табылмады." });
  saveCars(updated);
  res.json({ ok: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`AutoMarket ашылды: http://localhost:${PORT}`));
