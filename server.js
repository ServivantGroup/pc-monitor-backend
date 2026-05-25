const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "devices.json");

// Carga dispositivos del archivo
function loadDevices() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (e) {}
  return {};
}

// Guarda dispositivos en archivo
function saveDevices(devices) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(devices, null, 2));
  } catch (e) {}
}

let devices = loadDevices();

// El PC envía heartbeat
app.post("/heartbeat", (req, res) => {
  const { id, name } = req.body;
  if (!id) return res.status(400).json({ error: "Falta el id" });

  devices[id] = {
    id,
    name: name || id,
    lastSeen: Date.now(),
  };

  saveDevices(devices);
  res.json({ ok: true });
});

// La app consulta el estado
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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
