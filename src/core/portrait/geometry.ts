// Repères géométriques partagés — les recettes de classe/genre/faction
// s'alignent dessus pour que tête/yeux/accessoires restent cohérents.

export interface Rect { x: number; y: number; w: number; h: number }

export const HEAD: Rect = { x: 15, y: 5, w: 18, h: 20 };
export const EYE_L: Rect = { x: 18, y: 16, w: 4, h: 3 };
export const EYE_R: Rect = { x: 26, y: 16, w: 4, h: 3 };
export const NECK: Rect = { x: 22, y: 25, w: 4, h: 4 };
