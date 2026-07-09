// Interface de lancement de la génération — liste les personnages de
// l'Atlas, montre lesquels ont déjà un portrait dans output/, permet de
// forcer la régénération d'un seul perso ou de générer les manquants.
// Serveur Node local (pas de build web/GitHub Pages) : contourne aussi le
// souci de CORS d'Atlas/Héphaïstos (cf. src/renderer/renderer.ts) puisque
// le navigateur ne parle qu'à ce serveur, qui lui-même fait les fetch
// Node côté serveur (sans restriction CORS).
//
//   tsx src/server/admin.ts [--port=5691] [--out=output/]

import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { ZipArchive } from "archiver";
import { listTargets, generatePortrait, fileExists, renderPortraitBuffer } from "../core/pipeline";
import { captionInfoLine } from "../core/portrait/caption";
import type { ClassId, FactionStyle, Gender, PaletteName, PortraitParams } from "../shared/types";

function parseArgs(): Record<string, string> {
  const opts: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) opts[m[1]] = m[2];
  }
  return opts;
}

const opts = parseArgs();
const PORT = Number(opts.port) || 5691;
const OUT_DIR = opts.out ?? "output";

function sendJson(res: http.ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

const PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Quidam — Génération</title>
<style>
  :root { --c0: #040804; --c1: #1d3a22; --c2: #4e7d43; --c3: #a8d977; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--c0); color: var(--c3); font-family: "DejaVu Sans Mono", Consolas, monospace; font-size: 13px; padding: 20px; }
  header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--c2); padding-bottom: 10px; margin-bottom: 14px; }
  h1 { font-size: 15px; letter-spacing: 2px; }
  h1 span { color: var(--c2); font-weight: normal; }
  .controls { display: flex; gap: 8px; align-items: center; }
  select, input, button { background: var(--c0); color: var(--c3); border: 1px solid var(--c2); font-family: inherit; font-size: 12px; padding: 5px 10px; cursor: pointer; }
  input { cursor: text; }
  button:hover { background: var(--c1); }
  button.primary { background: var(--c1); font-weight: bold; }
  button.primary:hover { background: var(--c2); color: var(--c0); }
  button:disabled { opacity: 0.4; cursor: default; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--c1); vertical-align: middle; }
  th { color: var(--c2); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
  .thumb { width: 40px; height: 50px; image-rendering: pixelated; border: 1px solid var(--c1); background: var(--c0); display: block; }
  .status-ok { color: var(--c3); }
  .status-missing { color: var(--c2); }
  #summary { font-size: 11px; color: var(--c2); margin-top: 10px; }
  nav { display: flex; gap: 4px; margin-bottom: 14px; }
  nav a { color: var(--c2); text-decoration: none; font-size: 11px; letter-spacing: 1px; border: 1px solid var(--c1); padding: 4px 10px; }
  nav a.active { color: var(--c3); border-color: var(--c2); background: var(--c1); }
  fieldset { border: 1px solid var(--c1); padding: 10px; margin-bottom: 12px; }
  legend { color: var(--c2); font-size: 11px; letter-spacing: 1px; padding: 0 6px; }
  label { display: block; font-size: 11px; color: var(--c2); margin: 6px 0 2px; }
  .single-layout { display: flex; gap: 24px; align-items: flex-start; }
  .single-form { width: 280px; flex-shrink: 0; }
  .single-preview img { image-rendering: pixelated; border: 1px solid var(--c2); width: 192px; }
  #info, #manualInfo { font-size: 10px; color: var(--c1); margin-top: 6px; }
</style>
</head>
<body>
  <nav>
    <a href="/" class="active">LISTE</a>
    <a href="/unitaire">GÉNÉRATION UNITAIRE</a>
  </nav>
  <header>
    <h1>QUIDAM <span>// GÉNÉRATION — LANCEMENT</span></h1>
    <div class="controls">
      <select id="palette">
        <option value="phosphore" selected>Phosphore</option>
        <option value="sepia">Sépia</option>
        <option value="blueprint">Blueprint</option>
      </select>
      <button id="btnRefresh">RAFRAÎCHIR</button>
      <button id="btnMissing" class="primary">GÉNÉRER LES MANQUANTS</button>
      <button id="btnZip">TÉLÉCHARGER TOUT (.zip)</button>
    </div>
  </header>
  <table>
    <thead><tr><th></th><th>Personnage</th><th>Statut</th><th></th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
  <div id="summary">—</div>

<script>
async function loadTargets() {
  const res = await fetch("/api/targets");
  return res.json();
}

function row(t) {
  const tr = document.createElement("tr");
  tr.dataset.slug = t.slug;
  tr.innerHTML = \`
    <td><img class="thumb" src="\${t.exists ? "/output/" + encodeURIComponent(t.name) + ".png?t=" + Date.now() : ""}" onerror="this.style.visibility='hidden'"></td>
    <td>\${t.name}</td>
    <td class="\${t.exists ? "status-ok" : "status-missing"}">\${t.exists ? "✔ généré" : "— manquant"}</td>
    <td><button data-action="gen">\${t.exists ? "FORCER" : "GÉNÉRER"}</button></td>
  \`;
  tr.querySelector("[data-action=gen]").addEventListener("click", () => generateOne(t.slug, t.exists));
  return tr;
}

async function renderTable() {
  const targets = await loadTargets();
  const tbody = document.getElementById("rows");
  tbody.innerHTML = "";
  for (const t of targets) tbody.appendChild(row(t));
  const done = targets.filter((t) => t.exists).length;
  document.getElementById("summary").textContent = \`\${done} / \${targets.length} personnages généré(s)\`;
}

async function generateOne(slug, force) {
  const btn = document.querySelector(\`tr[data-slug="\${slug}"] button\`);
  btn.disabled = true;
  btn.textContent = "…";
  const palette = document.getElementById("palette").value;
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, force, palette }),
  });
  const result = await res.json();
  if (result.status === "error") alert(\`Échec \${slug} : \${result.message}\`);
  await renderTable();
}

document.getElementById("btnRefresh").addEventListener("click", renderTable);
document.getElementById("btnMissing").addEventListener("click", async () => {
  const btn = document.getElementById("btnMissing");
  btn.disabled = true;
  btn.textContent = "GÉNÉRATION…";
  const palette = document.getElementById("palette").value;
  const res = await fetch("/api/generate-missing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ palette }),
  });
  const summary = await res.json();
  btn.disabled = false;
  btn.textContent = "GÉNÉRER LES MANQUANTS";
  document.getElementById("summary").textContent = \`\${summary.generated} généré(s), \${summary.failed} échec(s)\`;
  await renderTable();
});

document.getElementById("btnZip").addEventListener("click", () => {
  window.location.href = "/api/export-zip";
});

renderTable();
</script>
</body>
</html>
`;

const SINGLE_PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Quidam — Génération unitaire</title>
<style>
  :root { --c0: #040804; --c1: #1d3a22; --c2: #4e7d43; --c3: #a8d977; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--c0); color: var(--c3); font-family: "DejaVu Sans Mono", Consolas, monospace; font-size: 13px; padding: 20px; }
  h1 { font-size: 15px; letter-spacing: 2px; margin-bottom: 14px; }
  h1 span { color: var(--c2); font-weight: normal; }
  nav { display: flex; gap: 4px; margin-bottom: 14px; }
  nav a { color: var(--c2); text-decoration: none; font-size: 11px; letter-spacing: 1px; border: 1px solid var(--c1); padding: 4px 10px; }
  nav a.active { color: var(--c3); border-color: var(--c2); background: var(--c1); }
  select, input, button { width: 100%; background: var(--c0); color: var(--c3); border: 1px solid var(--c2); font-family: inherit; font-size: 12px; padding: 5px 8px; cursor: pointer; margin-top: 2px; }
  input { cursor: text; }
  button:hover { background: var(--c1); }
  button.primary { background: var(--c1); font-weight: bold; }
  button.primary:hover { background: var(--c2); color: var(--c0); }
  fieldset { border: 1px solid var(--c1); padding: 10px; margin-bottom: 12px; }
  legend { color: var(--c2); font-size: 11px; letter-spacing: 1px; padding: 0 6px; }
  label { display: block; font-size: 11px; color: var(--c2); margin: 6px 0 2px; }
  .layout { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
  .col { width: 300px; flex-shrink: 0; }
  .preview img { image-rendering: pixelated; border: 1px solid var(--c2); width: 192px; display: block; }
  .info { font-size: 10px; color: var(--c1); margin-top: 6px; max-width: 192px; }
  a.dl { display: inline-block; margin-top: 8px; font-size: 11px; color: var(--c2); }
</style>
</head>
<body>
  <nav>
    <a href="/">LISTE</a>
    <a href="/unitaire" class="active">GÉNÉRATION UNITAIRE</a>
  </nav>
  <h1>QUIDAM <span>// GÉNÉRATION UNITAIRE — LORE OU MANUEL</span></h1>

  <div class="layout">
    <div class="col">
      <fieldset>
        <legend>DEPUIS LE LORE</legend>
        <label for="slug">Slug Atlas / Héphaïstos</label>
        <input id="slug" value="zoe" spellcheck="false">
        <label for="lorePalette">Palette</label>
        <select id="lorePalette">
          <option value="phosphore" selected>Phosphore</option>
          <option value="sepia">Sépia</option>
          <option value="blueprint">Blueprint</option>
        </select>
        <button id="btnLore" class="primary">GÉNÉRER DEPUIS LE LORE</button>
        <div id="loreInfo" class="info"></div>
      </fieldset>
      <div class="preview" id="lorePreview"></div>
    </div>

    <div class="col">
      <fieldset>
        <legend>MANUEL (hors-lore)</legend>
        <label for="seed">Seed</label>
        <input id="seed" value="quidam-001">
        <label for="classId">Classe</label>
        <select id="classId">
          <option value="humain" selected>Humain</option>
          <option value="robotarii">Robōtarii</option>
          <option value="hybride">Hybride</option>
          <option value="synthetique">Synthétique</option>
        </select>
        <label for="gender">Genre</label>
        <select id="gender">
          <option value="neutre" selected>Neutre</option>
          <option value="feminin">Féminin</option>
          <option value="masculin">Masculin</option>
        </select>
        <label for="factionStyle">Accessoire de faction</label>
        <select id="factionStyle">
          <option value="" selected>Aucun</option>
          <option value="martial">C.G.U. — Martial</option>
          <option value="liturgique">Pasteurs — Liturgique</option>
          <option value="clandestin">Voile d'Ombre — Clandestin</option>
          <option value="organique">Gardiens des Jardins — Organique</option>
          <option value="industriel">Magnats — Industriel</option>
          <option value="civique">Archivistes — Civique</option>
          <option value="dark-umbrae">Division Dark Umbrae</option>
        </select>
        <label for="manualPalette">Palette</label>
        <select id="manualPalette">
          <option value="phosphore" selected>Phosphore</option>
          <option value="sepia">Sépia</option>
          <option value="blueprint">Blueprint</option>
        </select>
        <button id="btnManual" class="primary">GÉNÉRER</button>
        <div id="manualInfo" class="info"></div>
      </fieldset>
      <div class="preview" id="manualPreview"></div>
    </div>
  </div>

<script>
document.getElementById("btnLore").addEventListener("click", async () => {
  const slug = document.getElementById("slug").value.trim();
  const palette = document.getElementById("lorePalette").value;
  const info = document.getElementById("loreInfo");
  const preview = document.getElementById("lorePreview");
  if (!slug) return;
  info.textContent = "Interrogation du lore…";
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, force: true, palette }),
  });
  const r = await res.json();
  if (r.status === "error") { info.textContent = "Échec : " + r.message; return; }
  preview.innerHTML = \`<img src="/output/\${encodeURIComponent(r.name)}.png?t=\${Date.now()}">
    <a class="dl" href="/output/\${encodeURIComponent(r.name)}.png" download>Télécharger PNG</a>\`;
  info.innerHTML = \`<b>\${r.name}</b><br>\${r.classId} · \${r.gender}\${r.factionStyle ? " · " + r.factionStyle : ""}<br>Type : \${r.typeText ?? "—"}\`;
});

document.getElementById("btnManual").addEventListener("click", async () => {
  const body = {
    seed: document.getElementById("seed").value.trim() || "quidam",
    classId: document.getElementById("classId").value,
    gender: document.getElementById("gender").value,
    factionStyle: document.getElementById("factionStyle").value || undefined,
    palette: document.getElementById("manualPalette").value,
  };
  const info = document.getElementById("manualInfo");
  const preview = document.getElementById("manualPreview");
  info.textContent = "Rendu…";
  const res = await fetch("/api/render-manual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const r = await res.json();
  if (r.error) { info.textContent = "Échec : " + r.error; return; }
  preview.innerHTML = \`<img src="\${r.dataUrl}">
    <a class="dl" href="\${r.dataUrl}" download="\${body.seed}.png">Télécharger PNG</a>\`;
  info.textContent = "Aperçu manuel — jamais écrit sur disque.";
});
</script>
</body>
</html>
`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }

  if (req.method === "GET" && url.pathname === "/unitaire") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(SINGLE_PAGE);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/render-manual") {
    try {
      const body = JSON.parse(await readBody(req)) as {
        seed: string; classId: ClassId; gender: Gender; factionStyle?: FactionStyle; palette: PaletteName;
      };
      const params: PortraitParams = {
        seed: body.seed || "quidam",
        classId: body.classId,
        gender: body.gender,
        factionStyle: body.factionStyle || undefined,
        palette: body.palette || "phosphore",
      };
      const buffer = renderPortraitBuffer(params, params.seed, captionInfoLine(params.classId, params.gender, params.factionStyle));
      sendJson(res, 200, { dataUrl: `data:image/png;base64,${buffer.toString("base64")}` });
    } catch (err) {
      sendJson(res, 500, { error: (err as Error).message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/targets") {
    try {
      const { targets } = await listTargets();
      const withStatus = targets.map((t) => ({ ...t, exists: fileExists(OUT_DIR, t.name) }));
      sendJson(res, 200, withStatus);
    } catch (err) {
      sendJson(res, 502, { error: (err as Error).message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/output/")) {
    const filename = decodeURIComponent(url.pathname.slice("/output/".length));
    const filePath = path.resolve(OUT_DIR, filename);
    if (!filePath.startsWith(path.resolve(OUT_DIR) + path.sep) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "image/png" });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/generate") {
    try {
      const { slug, force, palette } = JSON.parse(await readBody(req)) as { slug: string; force: boolean; palette: PaletteName };
      const { graph, targets } = await listTargets();
      const target = targets.find((t) => t.slug === slug);
      if (!target) { sendJson(res, 404, { status: "error", message: "slug introuvable" }); return; }
      const result = await generatePortrait(target.slug, target.name, graph, { palette: palette || "phosphore", outDir: OUT_DIR, force: !!force });
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { status: "error", message: (err as Error).message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/export-zip") {
    if (!fs.existsSync(OUT_DIR)) {
      res.writeHead(404);
      res.end("Aucun portrait généré pour l'instant.");
      return;
    }
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="quidam-portraits.zip"`,
    });
    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on("error", (err: Error) => res.destroy(err));
    archive.pipe(res);
    archive.directory(OUT_DIR, false);
    void archive.finalize();
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/generate-missing") {
    try {
      const { palette } = JSON.parse(await readBody(req)) as { palette: PaletteName };
      const { graph, targets } = await listTargets();
      let generated = 0;
      let failed = 0;
      for (const t of targets) {
        const r = await generatePortrait(t.slug, t.name, graph, { palette: palette || "phosphore", outDir: OUT_DIR, force: false });
        if (r.status === "generated") generated++;
        else if (r.status === "error") failed++;
      }
      sendJson(res, 200, { generated, failed, total: targets.length });
    } catch (err) {
      sendJson(res, 500, { error: (err as Error).message });
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Quidam — interface de génération : http://localhost:${PORT}`);
  console.log(`Sortie : ${path.resolve(OUT_DIR)}/`);
});
