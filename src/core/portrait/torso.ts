// Cou + épaules/combinaison, communs à toutes les classes, plus un détail
// de poitrine par classe (écho de la tête), seedé indépendamment.

import type { ClassId } from "../../shared/types";
import type { Palette } from "../palettes";
import { BG, DARK, MID, MID2, LIGHT2, RAMP } from "../palettes";
import { rngFor, int, chance, pick } from "../rng";
import { pixels, rectPx, GRID_H, type PixelCtx } from "./draw";
import { NECK } from "./geometry";

export function drawTorso(ctx: PixelCtx, colors: Palette): void {
  rectPx(ctx, NECK.x, NECK.y, 2, NECK.h, DARK, colors);
  rectPx(ctx, NECK.x + 2, NECK.y, 2, NECK.h, MID, colors);
  rectPx(ctx, 19, 29, 10, 2, DARK, colors);
  rectPx(ctx, 16, 31, 16, 2, DARK, colors);
  rectPx(ctx, 12, 33, 24, 2, DARK, colors);
  rectPx(ctx, 7, 35, 10, GRID_H - 35, RAMP[1], colors);
  rectPx(ctx, 17, 35, 14, GRID_H - 35, RAMP[2], colors);
  rectPx(ctx, 31, 35, 10, GRID_H - 35, RAMP[3], colors);
  rectPx(ctx, 19, 35, 10, 2, MID, colors);
  rectPx(ctx, 27, 35, 2, 2, MID2, colors);
  rectPx(ctx, 23, 37, 1, GRID_H - 37 - 2, BG, colors);
}

export function drawTorsoDetail(ctx: PixelCtx, colors: Palette, classId: ClassId, seed: string): void {
  const rng = rngFor(seed, "torso");
  if (classId === "humain") {
    for (let i = 0; i < 3; i++) rectPx(ctx, 22, 42 + i * 5, 2, 1, MID2, colors);
  } else if (classId === "robotarii") {
    const light = pick(rng, [LIGHT2, MID2]);
    rectPx(ctx, 21, 41, 6, 4, BG, colors);
    rectPx(ctx, 22, 42, 4, 2, light, colors);
    pixels(ctx, [[13, 40], [34, 40]], BG, colors);
  } else if (classId === "hybride") {
    const mechLeft = chance(rngFor(seed, "mech"), 0.5);
    const x0 = mechLeft ? 9 : 27;
    rectPx(ctx, x0, 39, 8, GRID_H - 39 - 2, MID2, colors);
    rectPx(ctx, x0 + 3, 41, 1, GRID_H - 41 - 4, BG, colors);
  } else if (classId === "synthetique") {
    const holes: [number, number][] = Array.from(
      { length: int(rng, 3, 6) },
      () => [int(rng, 8, 33), int(rng, 40, GRID_H - 3)],
    );
    pixels(ctx, holes, BG, colors);
  }
}
