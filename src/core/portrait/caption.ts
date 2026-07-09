// Bandeau de légende ajouté sous le portrait pour l'export ("fiche image") :
// nom du personnage + ligne d'infos (classe/genre/faction). Nécessite un
// contexte capable de texte (fillText/font) — plus riche que le PixelCtx
// minimal utilisé par le reste du moteur, qui ne dessine que des rectangles.

import type { Palette } from "../palettes";
import { BG2, MID, LIGHT, LIGHT2 } from "../palettes";
import { GRID_W, GRID_H, PX, type PixelCtx } from "./draw";

export interface TextCtx extends PixelCtx {
  font: string;
  textAlign: CanvasTextAlign;
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
}

export const CAPTION_H = 46;
export const EXPORT_W = GRID_W * PX;
export const EXPORT_H = GRID_H * PX + CAPTION_H;

/** Libellés FR pour la ligne d'infos — cf. shared/types.ts. */
const CLASS_LABEL: Record<string, string> = {
  humain: "Humain",
  robotarii: "Robōtarii",
  hybride: "Hybride",
  synthetique: "Synthétique",
};
const GENDER_LABEL: Record<string, string> = {
  feminin: "féminin",
  masculin: "masculin",
  neutre: "genre indéterminé",
};

export function captionInfoLine(classId: string, gender: string, factionStyle?: string): string {
  const parts = [CLASS_LABEL[classId] ?? classId, GENDER_LABEL[gender] ?? gender];
  if (factionStyle) parts.push(factionStyle);
  return parts.join(" · ");
}

export function drawCaption(ctx: TextCtx, colors: Palette, name: string, infoLine: string): void {
  const y0 = GRID_H * PX;
  ctx.fillStyle = colors[MID];
  ctx.fillRect(0, y0, EXPORT_W, 1); // liseré séparateur
  ctx.fillStyle = colors[BG2];
  ctx.fillRect(0, y0 + 1, EXPORT_W, CAPTION_H - 1);

  ctx.textAlign = "center";
  ctx.fillStyle = colors[LIGHT2];
  ctx.font = "bold 13px \"DejaVu Sans Mono\", monospace";
  ctx.fillText(name, EXPORT_W / 2, y0 + 20, EXPORT_W - 8);

  ctx.fillStyle = colors[LIGHT];
  ctx.font = "10px \"DejaVu Sans Mono\", monospace";
  ctx.fillText(infoLine, EXPORT_W / 2, y0 + 36, EXPORT_W - 8);
}
