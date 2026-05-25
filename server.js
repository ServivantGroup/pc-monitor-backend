const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const KNOWN_DEVICES = [
  { id: "pc1", name: "ServiVant_Torre" },
  { id: "pc2", name: "SER-02" },
  { id: "pc3", name: "SER-03" },
];

const lastSeen = {};

app.post("/heartbeat", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Falta el id" });
  lastSeen[id] = Date.now();
  res.json({ ok: true });
});

app.get("/status", (req, res) => {
  const TIMEOUT_MS = 3 * 60 * 1000;
  const now = Date.now();
  const result = KNOWN_DEVICES.map((d) => {
    const ts = lastSeen[d.id] || 0;
    return {
      id: d.id,
      name: d.name,
      online: ts > 0 && now - ts < TIMEOUT_MS,
      lastSeen: ts,
      ago: ts > 0 ? Math.floor((now - ts) / 1000) : null,
    };
  });
  res.json(result);
});

app.get("*", (req,
