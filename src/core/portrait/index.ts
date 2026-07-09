// Point d'entrée du moteur de portrait : compose tête (classe) + genre +
// torse + accessoire de faction (optionnel) sur un canvas isomorphe.

import type { PortraitParams } from "../../shared/types";
import { PALETTES, BG } from "../palettes";
import { fillBackground, type PixelCtx } from "./draw";
import { FACES } from "./classes";
import { GENDER_OVERLAY } from "./gender";
import { drawTorso, drawTorsoDetail } from "./torso";
import { FACTIONS } from "./factions";

export { GRID_W, GRID_H, PX } from "./draw";
export { FACES, drawFaceHumain, drawFaceRobotarii, drawFaceHybride, drawFaceSynthetique } from "./classes";
export { FACTIONS } from "./factions";

export function drawPortrait(ctx: PixelCtx, params: PortraitParams): void {
  const colors = PALETTES[params.palette];
  fillBackground(ctx, colors, BG);
  FACES[params.classId](ctx, colors, params.seed);
  GENDER_OVERLAY[params.gender](ctx, colors, params.seed);
  drawTorso(ctx, colors);
  drawTorsoDetail(ctx, colors, params.classId, params.seed);
  if (params.factionStyle) FACTIONS[params.factionStyle](ctx, colors);
}
