// Pipeline partagé génération portrait ↔ lore, réutilisé par le CLI
// (src/cli/generate.ts) et le serveur d'admin (src/server/admin.ts) — une
// seule logique de "générer un perso", pas de duplication entre les deux
// points d'entrée.

import * as fs from "node:fs";
import * as path from "node:path";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { drawPortrait } from "./portrait";
import { EXPORT_W, EXPORT_H, drawCaption, captionInfoLine, type TextCtx } from "./portrait/caption";
import { PALETTES } from "./palettes";
import { fetchFiche, extractLore } from "./lore/hephaistos";
import { fetchGraph, factionStyleFor, type AtlasGraph, type AtlasNode } from "./lore/atlas";
import type { PaletteName, PortraitParams } from "../shared/types";

// @napi-rs/canvas n'a pas de police par défaut : sans enregistrement
// explicite, tout texte sort en glyphes "tofu" (carrés vides). On réutilise
// la police déjà standard dans toute l'UI Robotariis (DejaVu Sans Mono).
const DEJAVU = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf";
const DEJAVU_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf";
let fontsRegistered = false;
function ensureFonts(): void {
  if (fontsRegistered) return;
  if (fs.existsSync(DEJAVU)) GlobalFonts.registerFromPath(DEJAVU, "DejaVu Sans Mono");
  if (fs.existsSync(DEJAVU_BOLD)) GlobalFonts.registerFromPath(DEJAVU_BOLD, "DejaVu Sans Mono");
  fontsRegistered = true;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/["/\\]/g, "").replace(/\s+/g, " ").trim();
}

export function outputPath(outDir: string, name: string): string {
  return path.join(outDir, `${sanitizeFilename(name)}.png`);
}

export interface GenerateTarget {
  slug: string;
  name: string;
}

/** Liste des personnages Atlas — `name` (le label Atlas) sert de base au
 *  nom de fichier, ce qui permet de savoir si un portrait existe déjà
 *  SANS interroger Héphaïstos (seulement nécessaire pour générer). */
export async function listTargets(): Promise<{ graph: AtlasGraph; targets: GenerateTarget[] }> {
  const graph = await fetchGraph();
  const targets = graph.nodes
    .filter((n): n is AtlasNode => n.category === "personnage")
    .map((n) => ({ slug: n.id, name: n.label }));
  return { graph, targets };
}

export interface GenerateOptions {
  palette: PaletteName;
  outDir: string;
  force: boolean;
}

export interface GenerateResult {
  slug: string;
  name: string;
  file: string;
  status: "generated" | "skipped" | "error";
  classId?: string;
  gender?: string;
  factionStyle?: string;
  typeText?: string | null;
  message?: string;
}

/** Rendu pur (aucun accès lore/disque) — réutilisé par generatePortrait
 *  (écriture fichier) et par le rendu manuel à la demande (aperçu). */
export function renderPortraitBuffer(params: PortraitParams, name: string, infoLine: string): Buffer {
  ensureFonts();
  const canvas = createCanvas(EXPORT_W, EXPORT_H);
  const ctx = canvas.getContext("2d") as unknown as TextCtx;
  drawPortrait(ctx, params);
  drawCaption(ctx, PALETTES[params.palette], name, infoLine);
  return canvas.toBuffer("image/png");
}

/**
 * Génère le portrait d'un personnage — ou saute s'il existe déjà et que
 * `force` n'est pas demandé (mode incrémental : ne régénère que les
 * fiches manquantes par défaut).
 */
export async function generatePortrait(
  slug: string, name: string, graph: AtlasGraph, opts: GenerateOptions,
): Promise<GenerateResult> {
  const file = outputPath(opts.outDir, name);
  if (!opts.force && fs.existsSync(file)) {
    return { slug, name, file, status: "skipped" };
  }
  try {
    const fiche = await fetchFiche(slug);
    const { classId, gender, typeText } = extractLore(fiche.body);
    const factionStyle = factionStyleFor(slug, graph);
    const params: PortraitParams = { seed: slug, classId, gender, factionStyle, palette: opts.palette };
    const buffer = renderPortraitBuffer(params, name, captionInfoLine(classId, gender, factionStyle));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buffer);
    return { slug, name, file, status: "generated", classId, gender, factionStyle, typeText };
  } catch (err) {
    return { slug, name, file, status: "error", message: (err as Error).message };
  }
}

export function fileExists(outDir: string, name: string): boolean {
  return fs.existsSync(outputPath(outDir, name));
}
