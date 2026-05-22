const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

// Sirve la app web (index.html)
app.use(express.static(path.join(__dirname, "public")));

// Estado en memoria de cada PC
const devices = {};

// El PC envía un heartbeat aquí cada minuto
app.post("/heartbeat", (req, res) => {
  const { id, name } = req.body;
  if (!id) return res.status(400).json({ error: "Falta el id" });
  devices[id] = { id, name: name || id, lastSeen: Date.now() };
  res.json({ ok: true });
});

// La app móvil consulta el estado de todos los PCs
app.get("/status", (req, res) => {
  const TIMEOUT_MS = 3 * 60 * 1000;
  const now = Date.now();
  const result = Object.values(devices).map((d) => ({
    id: d.id,
    name: d.name,
    online: now - d.lastSeen < TIMEOUT_MS,
    lastSeen: d.lastSeen,
    ago: Math.floor((now - d.lastSeen) / 1000),
  }));
  res.json(result);
});

// Cualquier otra ruta devuelve la app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
