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
  { id: "pc1", name: "ServiVant_Torre" },
  { id: "pc2", name: "SER-02" },
  { id: "pc3", name: "SER-03" },
];

// =============================================
//  SCRIPTS CONOCIDOS (aparecen dentro del PC)
// =============================================
const KNOWN_SCRIPTS = [
  { id: "ahk-pc3", name: "AHK Vigilar Diseños", parent: "pc3" },
];

// =============================================
//  SERVICIOS EN LA NUBE (tarjeta independiente)
//  Se comprueban en tiempo real haciendo una petición
// =============================================
const CLOUD_SERVICES = [
  {
    id: "vanty",
    name: "WhatsApp | Vanty",
    url: "https://evolution-api-production-f8587.up.railway.app",
  },
];

const lastSeen = {};

// Heartbeat de PCs y scripts locales
app.post("/heartbeat", (req, res) => {
  let { id } = req.body;
  if (!id) return res.status(400).json({ error: "Falta el id" });
  id = String(id).toLowerCase();
  lastSeen[id] = Date.now();
  res.json({ ok: true });
});

// Comprueba si un servicio en la nube responde
function comprobarServicio(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === "https:" ? require("https") : require("http");
      const req = lib.get(url, { timeout: 8000 }, (r) => {
        // Cualquier respuesta (incluso 401/404) significa que el servicio está vivo
        resolve(r.statusCode > 0);
        r.resume();
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => { req.destroy(); resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

app.get("/status", async (req, res) => {
  const TIMEOUT_MS = 3 * 60 * 1000;
  const now = Date.now();

  // PCs con sus scripts
  const devices = KNOWN_DEVICES.map((d) => {
    const ts = lastSeen[d.id.toLowerCase()] || 0;
    const scripts = KNOWN_SCRIPTS
      .filter((s) => s.parent.toLowerCase() === d.id.toLowerCase())
      .map((s) => {
        const sts = lastSeen[s.id.toLowerCase()] || 0;
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
      type: "pc",
    };
  });

  // Servicios en la nube (comprobados en tiempo real)
  const cloud = await Promise.all(
    CLOUD_SERVICES.map(async (s) => {
      const online = await comprobarServicio(s.url);
      if (online) lastSeen[s.id] = now;
      const ts = lastSeen[s.id] || 0;
      return {
        id: s.id,
        name: s.name,
        online: online,
        lastSeen: ts,
        ago: online ? 0 : (ts > 0 ? Math.floor((now - ts) / 1000) : null),
        scripts: [],
        type: "cloud",
      };
    })
  );

  res.json([...devices, ...cloud]);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
