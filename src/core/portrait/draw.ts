// Primitives de dessin pixel — isomorphes : tout ce qui accepte une
// interface fillStyle+fillRect marche (CanvasRenderingContext2D du
// navigateur ET le contexte @napi-rs/canvas du CLI batch).

import type { Rng } from "../rng";
import type { Palette } from "../palettes";
import { int } from "../rng";

export interface PixelCtx {
  fillStyle: string;
  fillRect(x: number, y: number, w: number, h: number): void;
}

/** Taille d'un pixel logique à l'écran, en pixels physiques du canvas. */
export const PX = 4;
export const GRID_W = 48;
export const GRID_H = 60;

export function px(ctx: PixelCtx, x: number, y: number, tone: number, colors: Palette): void {
  ctx.fillStyle = colors[tone];
  ctx.fillRect(x * PX, y * PX, PX, PX);
}

export function rectPx(ctx: PixelCtx, x: number, y: number, w: number, h: number, tone: number, colors: Palette): void {
  ctx.fillStyle = colors[tone];
  ctx.fillRect(x * PX, y * PX, w * PX, h * PX);
}

export function pixels(ctx: PixelCtx, list: readonly (readonly [number, number])[], tone: number, colors: Palette): void {
  for (const [x, y] of list) px(ctx, x, y, tone, colors);
}

/**
 * Arrondit les 4 coins d'un rectangle déjà rempli par un escalier de pixels
 * (steps, steps-1, …, 1) rongé jusqu'au fond — donne un ovale propre à
 * haute résolution au lieu d'un simple coin coupé.
 */
export function roundCorners(
  ctx: PixelCtx, x: number, y: number, w: number, h: number, steps: number, bgTone: number, colors: Palette,
): void {
  for (let i = 0; i < steps; i++) {
    const cut = steps - i;
    rectPx(ctx, x, y + i, cut, 1, bgTone, colors);
    rectPx(ctx, x + w - cut, y + i, cut, 1, bgTone, colors);
    rectPx(ctx, x, y + h - 1 - i, cut, 1, bgTone, colors);
    rectPx(ctx, x + w - cut, y + h - 1 - i, cut, 1, bgTone, colors);
  }
}

export function fillBackground(ctx: PixelCtx, colors: Palette, bgTone: number): void {
  ctx.fillStyle = colors[bgTone];
  ctx.fillRect(0, 0, GRID_W * PX, GRID_H * PX);
}

export function randomHoles(rng: Rng, count: number, maxX: number, maxY: number): [number, number][] {
  return Array.from({ length: count }, () => [int(rng, 1, maxX), int(rng, 1, maxY)] as [number, number]);
}
