// CLI batch : génère une fiche image PNG par personnage, en piochant
// classe/genre/faction directement dans le lore (Héphaïstos + Atlas).
// Le PNG porte le nom du personnage (pas le slug) et embarque un bandeau
// nom + infos (classe/genre/faction) sous le portrait.
//
//   tsx src/cli/generate.ts                       # tous les personnages
//   tsx src/cli/generate.ts --slug=zoe             # un seul
//   tsx src/cli/generate.ts --palette=sepia --out=output/

import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import * as fs from "node:fs";
import * as path from "node:path";

// @napi-rs/canvas n'a pas de police par défaut : sans enregistrement
// explicite, tout texte sort en glyphes "tofu" (carrés vides). On réutilise
// la police déjà standard dans toute l'UI Robotariis (DejaVu Sans Mono).
const DEJAVU = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf";
const DEJAVU_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf";
if (fs.existsSync(DEJAVU)) GlobalFonts.registerFromPath(DEJAVU, "DejaVu Sans Mono");
if (fs.existsSync(DEJAVU_BOLD)) GlobalFonts.registerFromPath(DEJAVU_BOLD, "DejaVu Sans Mono");
import { drawPortrait } from "../core/portrait";
import { EXPORT_W, EXPORT_H, drawCaption, captionInfoLine, type TextCtx } from "../core/portrait/caption";
import { PALETTES } from "../core/palettes";
import { fetchFiche, extractLore } from "../core/lore/hephaistos";
import { fetchGraph, factionStyleFor, type AtlasGraph } from "../core/lore/atlas";
import type { PaletteName, PortraitParams } from "../shared/types";

function parseArgs(): Record<string, string> {
  const opts: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) opts[m[1]] = m[2];
  }
  return opts;
}

/** Nom de fichier à partir du nom du personnage — pas du slug. */
function sanitizeFilename(name: string): string {
  return name.replace(/["/\\]/g, "").replace(/\s+/g, " ").trim();
}

function renderFicheImage(params: PortraitParams, name: string, infoLine: string, outPath: string): void {
  const canvas = createCanvas(EXPORT_W, EXPORT_H);
  const ctx = canvas.getContext("2d") as unknown as TextCtx;
  drawPortrait(ctx, params);
  drawCaption(ctx, PALETTES[params.palette], name, infoLine);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
}

async function generateOne(slug: string, palette: PaletteName, outDir: string, graph: AtlasGraph): Promise<void> {
  const fiche = await fetchFiche(slug);
  const { classId, gender, typeText } = extractLore(fiche.body);
  const factionStyle = factionStyleFor(slug, graph);
  const params: PortraitParams = { seed: slug, classId, gender, factionStyle, palette };
  const name = fiche.title || slug;
  const infoLine = captionInfoLine(classId, gender, factionStyle);
  const filename = `${sanitizeFilename(name)}.png`;
  renderFicheImage(params, name, infoLine, path.join(outDir, filename));
  const tag = factionStyle ? `/${factionStyle}` : "";
  console.log(`✔ ${filename} — ${classId}/${gender}${tag} (Type : ${typeText ?? "—"})`);
}

async function main(): Promise<void> {
  const opts = parseArgs();
  const palette = (opts.palette as PaletteName) ?? "phosphore";
  const outDir = opts.out ?? "output";
  const graph = await fetchGraph();

  if (opts.slug) {
    await generateOne(opts.slug, palette, outDir, graph);
    return;
  }

  const personnages = graph.nodes.filter((n) => n.category === "personnage");
  let ok = 0;
  let fail = 0;
  for (const n of personnages) {
    try {
      await generateOne(n.id, palette, outDir, graph);
      ok++;
    } catch (err) {
      fail++;
      console.error(`✘ ${n.id} : ${(err as Error).message}`);
    }
  }
  console.log(`\n${ok} portrait(s) généré(s), ${fail} échec(s) → ${outDir}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
