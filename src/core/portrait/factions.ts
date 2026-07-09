// Accessoires greffés par faction (posés après tête+genre, avant le
// rendu final) — portés du prototype, + Division Dark Umbrae (nouvelle,
// v1) : sous-faction secrète du C.G.U. (tags canon manipulation/
// psychologie/annihilation/secret), masque intégral façon masque à gaz,
// plus menaçant que le simple bandana du Voile d'Ombre.

import type { FactionStyle } from "../../shared/types";
import type { Palette } from "../palettes";
import { BG, DARK, MID, LIGHT, LIGHT2, MID2 } from "../palettes";
import { pixels, rectPx, roundCorners, px, type PixelCtx } from "./draw";
import { HEAD, EYE_L, EYE_R } from "./geometry";

export type FactionRecipe = (ctx: PixelCtx, colors: Palette) => void;

const martial: FactionRecipe = (ctx, colors) => {
  rectPx(ctx, 11, 1, 26, 13, DARK, colors);
  roundCorners(ctx, 11, 1, 26, 13, 5, BG, colors);
  rectPx(ctx, 11, 19, 26, 1, DARK, colors);
  rectPx(ctx, 15, 15, 18, 4, LIGHT, colors);
  px(ctx, 30, 16, MID, colors);
  rectPx(ctx, 19, 21, 10, 1, MID, colors);
  rectPx(ctx, 7, 32, 7, 5, MID, colors);
  rectPx(ctx, 9, 34, 2, 2, LIGHT, colors);
};

const liturgique: FactionRecipe = (ctx, colors) => {
  rectPx(ctx, 9, 0, 30, 24, DARK, colors);
  roundCorners(ctx, 9, 0, 30, 24, 6, BG, colors);
  rectPx(ctx, 20, 42, 8, 8, LIGHT, colors);
  rectPx(ctx, 22, 44, 4, 4, DARK, colors);
};

const clandestin: FactionRecipe = (ctx, colors) => {
  rectPx(ctx, 15, 6, 18, 6, BG, colors);
  rectPx(ctx, 18, 16, 4, 3, BG, colors);
  rectPx(ctx, 26, 16, 4, 3, BG, colors);
  rectPx(ctx, 18, 17, 4, 1, LIGHT, colors);
  rectPx(ctx, 26, 17, 4, 1, LIGHT, colors);
  rectPx(ctx, 15, 18, 18, 5, BG, colors);
  rectPx(ctx, 15, 18, 18, 1, DARK, colors);
};

const organique: FactionRecipe = (ctx, colors) => {
  pixels(ctx, [
    [13, 6], [14, 7], [13, 8], [17, 4], [18, 5], [19, 4],
    [23, 3], [24, 4], [25, 3], [29, 4], [30, 5], [31, 4],
    [34, 6], [35, 7], [34, 8],
  ], LIGHT2, colors);
  pixels(ctx, [[15, 7], [18, 6], [24, 5], [30, 6], [33, 7]], MID, colors);
  pixels(ctx, [[17, 20], [18, 21], [19, 20], [29, 20], [30, 21], [31, 20]], DARK, colors);
};

const industriel: FactionRecipe = (ctx, colors) => {
  rectPx(ctx, 12, 2, 24, 10, MID2, colors);
  roundCorners(ctx, 12, 2, 24, 10, 4, BG, colors);
  pixels(ctx, [[16, 6], [24, 4], [32, 6]], DARK, colors);
  rectPx(ctx, 15, 14, 7, 7, BG, colors);
  rectPx(ctx, 26, 14, 7, 7, BG, colors);
  rectPx(ctx, 17, 16, 3, 3, LIGHT, colors);
  rectPx(ctx, 28, 16, 3, 3, LIGHT, colors);
  rectPx(ctx, 22, 16, 4, 2, DARK, colors);
};

const civique: FactionRecipe = (ctx, colors) => {
  rectPx(ctx, 16, 14, 6, 6, BG, colors);
  rectPx(ctx, 26, 14, 6, 6, BG, colors);
  rectPx(ctx, 17, 15, 4, 4, LIGHT, colors);
  rectPx(ctx, 27, 15, 4, 4, LIGHT, colors);
  rectPx(ctx, 22, 16, 4, 1, BG, colors);
  pixels(ctx, [[15, 29], [16, 30], [17, 31], [32, 29], [31, 30], [30, 31]], LIGHT, colors);
  rectPx(ctx, 22, 31, 4, 8, MID, colors);
  rectPx(ctx, 23, 39, 2, 2, LIGHT2, colors);
};

/**
 * Division Dark Umbrae : masque intégral façon masque à gaz (filtre au
 * menton, lentilles rondes assombries), capuche opaque — le visage sous-
 * jacent disparaît complètement, seule une fente lumineuse trahit un
 * regard. Symbole "œil barré" sur la poitrine (surveillance + annihilation).
 */
const darkUmbrae: FactionRecipe = (ctx, colors) => {
  rectPx(ctx, HEAD.x - 1, HEAD.y - 1, HEAD.w + 2, HEAD.h + 2, BG, colors);
  roundCorners(ctx, HEAD.x - 1, HEAD.y - 1, HEAD.w + 2, HEAD.h + 2, 5, BG, colors);
  rectPx(ctx, EYE_L.x - 1, EYE_L.y - 1, EYE_L.w + 2, EYE_L.h + 2, DARK, colors);
  rectPx(ctx, EYE_R.x - 1, EYE_R.y - 1, EYE_R.w + 2, EYE_R.h + 2, DARK, colors);
  rectPx(ctx, EYE_L.x, EYE_L.y, EYE_L.w, 1, LIGHT2, colors);
  rectPx(ctx, EYE_R.x, EYE_R.y, EYE_R.w, 1, LIGHT2, colors);
  rectPx(ctx, HEAD.x + HEAD.w / 2 - 2, HEAD.y + HEAD.h - 5, 4, 4, DARK, colors); // filtre au menton
  px(ctx, HEAD.x + HEAD.w / 2 - 1, HEAD.y + HEAD.h - 3, MID, colors);
  pixels(ctx, [[20, 44], [21, 45], [22, 46], [23, 45], [24, 44]], LIGHT2, colors); // œil barré (poitrine)
  rectPx(ctx, 18, 45, 8, 1, BG, colors);
};

export const FACTIONS: Record<FactionStyle, FactionRecipe> = {
  martial,
  liturgique,
  clandestin,
  organique,
  industriel,
  civique,
  "dark-umbrae": darkUmbrae,
};
