// Recettes de tête par classe (espèce) — chacune doit se reconnaître à la
// silhouette seule, sans dépendre de la couleur. Portées du prototype
// DEV/Quidam/prototype/apercu.html, typées et seedées via rngFor(seed,domain)
// (convention Terra-Incognita) plutôt que le RNG ad-hoc du prototype.

import type { ClassId } from "../../shared/types";
import type { Palette } from "../palettes";
import { BG, DARK, DARK2, MID, MID2, LIGHT2, RAMP } from "../palettes";
import { rngFor, int, chance, pick } from "../rng";
import { px, pixels, rectPx, roundCorners, randomHoles, type PixelCtx } from "./draw";
import { HEAD, EYE_L, EYE_R } from "./geometry";

export type FaceRecipe = (ctx: PixelCtx, colors: Palette, seed: string) => void;

/** HUMAIN : galbe lisse (dégradé 6 crans du ramp), sourcils, oreilles,
 *  mouchetis de peau, pommette seedée. */
export function drawFaceHumain(ctx: PixelCtx, colors: Palette, seed: string): void {
  const rng = rngFor(seed, "face");
  const bands: [number, number][] = [[0, 2], [2, 3], [5, 3], [8, 5], [13, 3], [16, 2]];
  const ramp = [1, 2, 3, 4, 5, 6];
  bands.forEach(([dx, w], i) => rectPx(ctx, HEAD.x + dx, HEAD.y, w, HEAD.h, RAMP[ramp[i]], colors));
  rectPx(ctx, HEAD.x + HEAD.w - 5, HEAD.y + 2, 3, 3, LIGHT2, colors); // reflet haut-droit
  for (let i = 0; i < 10; i++) {
    px(ctx, HEAD.x + int(rng, 1, HEAD.w - 2), HEAD.y + int(rng, 1, HEAD.h - 2), DARK2, colors);
  }
  roundCorners(ctx, HEAD.x, HEAD.y, HEAD.w, HEAD.h, 4, BG, colors);
  rectPx(ctx, EYE_L.x - 1, EYE_L.y - 2, EYE_L.w + 1, 1, DARK, colors);
  rectPx(ctx, EYE_R.x, EYE_R.y - 2, EYE_R.w + 1, 1, DARK, colors);
  rectPx(ctx, EYE_L.x, EYE_L.y, EYE_L.w, EYE_L.h, BG, colors);
  px(ctx, EYE_L.x + 1, EYE_L.y, LIGHT2, colors);
  rectPx(ctx, EYE_R.x, EYE_R.y, EYE_R.w, EYE_R.h, BG, colors);
  px(ctx, EYE_R.x + 2, EYE_R.y, LIGHT2, colors);
  rectPx(ctx, HEAD.x - 1, EYE_L.y + 1, 1, 3, DARK, colors);
  rectPx(ctx, HEAD.x + HEAD.w, EYE_R.y + 1, 1, 3, MID2, colors);
  if (chance(rng, 0.5)) px(ctx, pick(rng, [HEAD.x + 3, HEAD.x + HEAD.w - 4]), HEAD.y + 13, DARK2, colors);
}

/** ROBŌTARII : tête anguleuse, visière unique, antenne, boulons, grille de
 *  ventilation, coutures de plaques — lisible comme "machine" en silhouette. */
export function drawFaceRobotarii(ctx: PixelCtx, colors: Palette, seed: string): void {
  const rng = rngFor(seed, "face");
  const flip = chance(rng, 0.5);
  rectPx(ctx, HEAD.x, HEAD.y, HEAD.w, HEAD.h, MID, colors);
  rectPx(ctx, HEAD.x, HEAD.y, 5, HEAD.h, flip ? MID2 : DARK, colors);
  rectPx(ctx, HEAD.x + HEAD.w - 5, HEAD.y, 5, HEAD.h, flip ? DARK : MID2, colors);
  roundCorners(ctx, HEAD.x, HEAD.y, HEAD.w, HEAD.h, 1, BG, colors);
  const ventSide = chance(rng, 0.5) ? HEAD.x + 2 : HEAD.x + HEAD.w - 4;
  for (let i = 0; i < 3; i++) rectPx(ctx, ventSide, HEAD.y + 13 + i * 2, 2, 1, BG, colors);
  pixels(ctx, [
    [HEAD.x + 2, HEAD.y + 2], [HEAD.x + HEAD.w - 3, HEAD.y + 2],
    [HEAD.x + 2, HEAD.y + HEAD.h - 3], [HEAD.x + HEAD.w - 3, HEAD.y + HEAD.h - 3],
  ], BG, colors);
  if (chance(rng, 0.65)) {
    const antH = int(rng, 2, 4);
    rectPx(ctx, HEAD.x + HEAD.w / 2 - 1, HEAD.y - antH, 2, antH, DARK, colors);
    px(ctx, HEAD.x + HEAD.w / 2 - 1, HEAD.y - antH, LIGHT2, colors);
  }
  const seamCount = int(rng, 1, 2);
  const seamXs = seamCount === 1
    ? [pick(rng, [HEAD.x + 6, HEAD.x + HEAD.w - 7])]
    : [HEAD.x + 6, HEAD.x + HEAD.w - 7];
  for (const sx of seamXs) rectPx(ctx, sx, HEAD.y + 1, 1, HEAD.h - 2, BG, colors);
  const visorH = int(rng, 2, 3);
  rectPx(ctx, EYE_L.x - 1, EYE_L.y - 1, EYE_R.x + EYE_R.w - EYE_L.x + 2, visorH + 2, BG, colors);
  rectPx(ctx, EYE_L.x, EYE_L.y, EYE_R.x + EYE_R.w - EYE_L.x, visorH, LIGHT2, colors);
  px(ctx, EYE_L.x + int(rng, 2, 8), EYE_L.y, MID2, colors);
}

/**
 * HYBRIDE : moitié organique / moitié mécanique scindée — "l'entre-deux
 * vivant". Le côté mécanique (gauche/droite) vit dans le domaine "mech",
 * séparé de "face", pour que drawTorsoDetail (autre module) puisse retomber
 * sur la même décision sans partager la suite de tirages.
 */
export function drawFaceHybride(ctx: PixelCtx, colors: Palette, seed: string): void {
  const rng = rngFor(seed, "face");
  const mechLeft = chance(rngFor(seed, "mech"), 0.5);
  const midX = HEAD.x + HEAD.w / 2;
  const orgX = mechLeft ? midX : HEAD.x;
  const mecX = mechLeft ? HEAD.x : midX;
  const orgEye = mechLeft ? EYE_R : EYE_L;
  const mecEye = mechLeft ? EYE_L : EYE_R;
  rectPx(ctx, orgX, HEAD.y, HEAD.w / 2, HEAD.h, MID, colors);
  rectPx(ctx, orgX + (mechLeft ? HEAD.w / 2 - 5 : 0), HEAD.y, 5, HEAD.h, DARK, colors);
  rectPx(ctx, orgEye.x, orgEye.y, orgEye.w, orgEye.h, BG, colors);
  px(ctx, orgEye.x + 1, orgEye.y, LIGHT2, colors);
  rectPx(ctx, mecX, HEAD.y, HEAD.w / 2, HEAD.h, MID2, colors);
  const seamCount = int(rng, 2, 3);
  for (let i = 0; i < seamCount; i++) rectPx(ctx, mecX + 2 + i * 3, HEAD.y + 2, 1, HEAD.h - 4, BG, colors);
  rectPx(ctx, mecEye.x - 1, mecEye.y - 1, mecEye.w + 2, mecEye.h + 2, BG, colors);
  rectPx(ctx, mecEye.x, mecEye.y, mecEye.w - 1, mecEye.h - 1, LIGHT2, colors);
  px(ctx, mecX + (mechLeft ? HEAD.w / 2 - 3 : 2), HEAD.y + HEAD.h - 4, BG, colors);
  rectPx(ctx, midX - 1, HEAD.y + 3, 1, HEAD.h - 6, LIGHT2, colors);
  roundCorners(ctx, orgX, HEAD.y, HEAD.w / 2 + 2, HEAD.h, 3, BG, colors);
  const mecEdgeX = mechLeft ? HEAD.x : HEAD.x + HEAD.w - 1;
  pixels(ctx, [[mecEdgeX, HEAD.y], [mecEdgeX, HEAD.y + HEAD.h - 1]], BG, colors);
}

/** SYNTHÉTIQUE : damier + trous scintillants + lignes de scan — "pas tout
 *  à fait solide", conscience/prototype instable. */
export function drawFaceSynthetique(ctx: PixelCtx, colors: Palette, seed: string): void {
  const rng = rngFor(seed, "face");
  const phase = int(rng, 0, 1);
  for (let yy = 0; yy < HEAD.h; yy++) {
    for (let xx = 0; xx < HEAD.w; xx++) {
      px(ctx, HEAD.x + xx, HEAD.y + yy, (xx + yy + phase) % 2 === 0 ? DARK2 : MID2, colors);
    }
  }
  pixels(ctx, randomHoles(rng, int(rng, 5, 9), HEAD.w - 2, HEAD.h - 2).map(([dx, dy]) => [HEAD.x + dx, HEAD.y + dy]), BG, colors);
  const scanCount = int(rng, 2, 4);
  for (let i = 0; i < scanCount; i++) {
    rectPx(ctx, HEAD.x + int(rng, 0, 4), int(rng, 1, HEAD.h - 2), int(rng, 8, HEAD.w - 4), 1, LIGHT2, colors);
  }
  px(ctx, EYE_L.x + 1, EYE_L.y + 1, LIGHT2, colors);
  px(ctx, EYE_R.x + 2, EYE_R.y + 1, LIGHT2, colors);
}

export const FACES: Record<ClassId, FaceRecipe> = {
  humain: drawFaceHumain,
  robotarii: drawFaceRobotarii,
  hybride: drawFaceHybride,
  synthetique: drawFaceSynthetique,
};
