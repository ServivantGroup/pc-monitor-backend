const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Estado en memoria de cada PC
const devices = {};

// El PC envía un heartbeat aquí cada minuto
// POST /heartbeat  body: { id: "pc1", name: "PC Salón" }
app.post("/heartbeat", (req, res) => {
  const { id, name } = req.body;
  if (!id) return res.status(400).json({ error: "Falta el id" });

  devices[id] = {
    id,
    name: name || id,
    lastSeen: Date.now(),
  };

  res.json({ ok: true });
});

// La app móvil consulta el estado de todos los PCs
// GET /status
app.get("/status", (req, res) => {
  const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos sin señal = apagado
  const now = Date.now();

  const result = Object.values(devices).map((d) => ({
    id: d.id,
    name: d.name,
    online: now - d.lastSeen < TIMEOUT_MS,
    lastSeen: d.lastSeen,
    ago: Math.floor((now - d.lastSeen) / 1000), // segundos desde última señal
  }));

  res.json(result);
});

// Health check para Render
app.get("/", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
