// Overlay de genre — posé après la tête, seul point de variation entre les
// genres (mèches vs ombre de mâchoire), volontairement discret mais dans un
// ton contrasté (MID2, pas DARK — DARK se distingue à peine du fond quasi
// noir et serait invisible malgré des pixels corrects).

import type { Gender } from "../../shared/types";
import type { Palette } from "../palettes";
import { MID2, DARK2, LIGHT2 } from "../palettes";
import { rngFor, int, chance, pick } from "../rng";
import { px, rectPx, type PixelCtx } from "./draw";
import { HEAD } from "./geometry";

export type GenderRecipe = (ctx: PixelCtx, colors: Palette, seed: string) => void;

function feminin(ctx: PixelCtx, colors: Palette, seed: string): void {
  const rng = rngFor(seed, "gender");
  const len = int(rng, 16, 24);
  rectPx(ctx, HEAD.x - 2, HEAD.y + 2, 3, len, MID2, colors);
  rectPx(ctx, HEAD.x + HEAD.w - 1, HEAD.y + 2, 3, len, MID2, colors);
  rectPx(ctx, HEAD.x + 2, HEAD.y - 1, HEAD.w - 4, 2, MID2, colors);
  if (chance(rng, 0.4)) px(ctx, HEAD.x + HEAD.w - 6, HEAD.y - 2, LIGHT2, colors);
}

function masculin(ctx: PixelCtx, colors: Palette, seed: string): void {
  const rng = rngFor(seed, "gender");
  const w = int(rng, HEAD.w - 8, HEAD.w - 4);
  rectPx(ctx, HEAD.x + (HEAD.w - w) / 2, HEAD.y + HEAD.h - 3, w, 2, DARK2, colors);
  if (chance(rng, 0.35)) px(ctx, pick(rng, [HEAD.x + 4, HEAD.x + HEAD.w - 5]), HEAD.y + HEAD.h - 6, DARK2, colors);
}

function neutre(): void {
  // Aucune coiffe ajoutée — silhouette de base seule.
}

export const GENDER_OVERLAY: Record<Gender, GenderRecipe> = { feminin, masculin, neutre };
