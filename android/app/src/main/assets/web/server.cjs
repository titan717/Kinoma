var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var KINOMA_API = "https://kinomaapi.vercel.app";
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  async function proxyHandler(targetPath, req, res) {
    try {
      const queryString = new URLSearchParams(req.query).toString();
      const url = `${KINOMA_API}${targetPath}${queryString ? "?" + queryString : ""}`;
      const r = await fetch(url);
      const data = await r.json();
      res.status(r.status).json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
  app.get(["/api/health", "/health"], (req, res) => proxyHandler("/health", req, res));
  app.get(["/api/search", "/api/anime/search", "/search"], (req, res) => proxyHandler("/search", req, res));
  app.get(["/api/search/:query", "/api/anime/search/:query"], (req, res) => {
    req.query.q = req.params.query;
    proxyHandler("/search", req, res);
  });
  app.get(["/api/trending", "/api/anime/trending", "/trending"], async (req, res) => {
    try {
      const r = await fetch(`${KINOMA_API}/search?q=action&limit=20&offset=0`);
      const data = await r.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get(["/api/popular", "/api/anime/popular", "/popular"], async (req, res) => {
    try {
      const r = await fetch(`${KINOMA_API}/search?q=adventure&limit=20&offset=0`);
      const data = await r.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get(["/api/info/:id", "/info/:id"], (req, res) => proxyHandler(`/info/${req.params.id}`, req, res));
  app.get(["/api/episodes/:id", "/episodes/:id"], (req, res) => proxyHandler(`/episodes/${req.params.id}`, req, res));
  app.get(["/api/servers/:id/:ep", "/servers/:id/:ep"], (req, res) => proxyHandler(`/servers/${req.params.id}/${req.params.ep}`, req, res));
  app.get(["/api/stream/:id/:ep", "/stream/:id/:ep"], (req, res) => proxyHandler(`/stream/${req.params.id}/${req.params.ep}`, req, res));
  app.get(["/api/schedule", "/schedule"], (req, res) => proxyHandler("/schedule", req, res));
  app.get(["/tv/update.json", "/update/latest.json"], (req, res) => {
    const latestJsonPath = import_path.default.join(process.cwd(), "update", "latest.json");
    if (import_fs.default.existsSync(latestJsonPath)) {
      res.setHeader("Content-Type", "application/json");
      return res.sendFile(latestJsonPath);
    }
    res.json({
      versionCode: 1,
      versionName: "1.0.0",
      apkUrl: "https://github.com/titan717/Kinoma/releases/latest/download/Kinoma.apk",
      releaseNotes: "Initial release of Kinoma Native Android TV App.",
      mandatory: false,
      sha256: "PENDING"
    });
  });
  app.use("/downloads", import_express.default.static(import_path.default.join(process.cwd(), "public", "downloads")));
  app.get("/downloads/Kinoma.apk", async (req, res) => {
    const filePath = import_path.default.join(process.cwd(), "public", "downloads", "Kinoma.apk");
    if (import_fs.default.existsSync(filePath)) {
      return res.download(filePath, "Kinoma.apk", {
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
        }
      }, (err) => {
        if (err && !res.headersSent) {
          res.status(404).send("APK file not found");
        }
      });
    }
    res.redirect("https://github.com/titan717/Kinoma/releases/latest/download/Kinoma.apk");
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
