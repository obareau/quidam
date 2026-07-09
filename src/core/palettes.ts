import type { PaletteName } from "../shared/types";

/**
 * Palette 8 tons, copie verbatim de Terra-Incognita/src/core/palettes.ts —
 * même famille visuelle dans tout l'écosystème ROBOTARIIS.
 *
 * Découverte (validée sur les 3 palettes) : les tons sont rangés du plus
 * sombre au plus clair dans le même ordre non-trivial `[0,4,1,5,2,6,3,7]`
 * — voir RAMP ci-dessous. C'est ce qui permet un dégradé à 6-8 crans
 * générique quelle que soit la palette active (utilisé par
 * core/portrait/classes.ts).
 */
export type Palette = readonly [string, string, string, string, string, string, string, string];

export const PALETTES: Record<PaletteName, Palette> = {
  phosphore: ["#040804", "#1e4a24", "#5fae4e", "#d8ff9a", "#0a1f0d", "#37653a", "#8ecb63", "#f4ffd6"],
  sepia: ["#170e04", "#5e4223", "#c09154", "#ffedc0", "#2c1c0a", "#7c5c33", "#d9ab72", "#fff6e0"],
  blueprint: ["#040d1c", "#1d4a7d", "#6fa8d8", "#f4faff", "#0a2036", "#3168a3", "#94c3e8", "#ffffff"],
};

export const PALETTE_NAMES: PaletteName[] = ["phosphore", "sepia", "blueprint"];

// Index sémantiques dans le tableau à 8 tons.
export const BG = 0;
export const DARK = 1;
export const MID = 2;
export const LIGHT = 3;
export const BG2 = 4;
export const DARK2 = 5;
export const MID2 = 6;
export const LIGHT2 = 7;

/** Rampe sombre→clair, cf. commentaire ci-dessus. */
export const RAMP = [BG, BG2, DARK, DARK2, MID, MID2, LIGHT, LIGHT2] as const;
