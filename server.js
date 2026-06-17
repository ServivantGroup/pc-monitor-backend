const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =============================================
//  PCs CONOCIDOS
// =============================================
const KNOWN_DEVICES = [
  { id: "PC1", name: "ServiVant_Torre" },
  { id: "PC2", name: "SER-02" },
  { id: "PC3", name: "SER-03" },
];

// =============================================
//  SCRIPTS CONOCIDOS (aparecen dentro del PC)
//  parent = id del PC donde corre
// =============================================
const KNOWN_SCRIPTS = [
  { id: "ahk-pc3", name: "AHK Vigilar Diseños", parent: "pc3" },
  { id: "wa-pc3", name: "WhatsApp Sender", parent: "pc3" },
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

    const scripts = KNOWN_SCRIPTS
      .filter((s) => s.parent === d.id)
      .map((s) => {
        const sts = lastSeen[s.id] || 0;
        return {
          id: s.id,
          name: s.name,
          online: sts > 0 && now - sts < TIMEOUT_MS,
          lastSeen: sts,
        };
      });

    return {
      id: d.id,
      name: d.name,
      online: ts > 0 && now - ts < TIMEOUT_MS,
      lastSeen: ts,
      ago: ts > 0 ? Math.floor((now - ts) / 1000) : null,
      scripts: scripts,
    };
  });

  res.json(result);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
