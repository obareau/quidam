export type PaletteName = "phosphore" | "sepia" | "blueprint";

/** Classe (espèce) du personnage — détermine la recette de tête. */
export type ClassId = "humain" | "robotarii" | "hybride" | "synthetique";

export type Gender = "feminin" | "masculin" | "neutre";

/** Faction canonique avec un accessoire dédié (voir core/portrait/factions.ts). */
export type FactionStyle =
  | "martial" // C.G.U.
  | "liturgique" // Pasteurs de la Rectitude
  | "clandestin" // Voile d'Ombre
  | "organique" // Gardiens des Jardins
  | "industriel" // Magnats Industriels
  | "civique" // Archivistes Libres
  | "dark-umbrae"; // Division Dark Umbrae (sous-faction C.G.U.)

/** Paramètres résolus d'un portrait — soit saisis à la main, soit déduits du lore. */
export interface PortraitParams {
  seed: string;
  classId: ClassId;
  gender: Gender;
  factionStyle?: FactionStyle;
  palette: PaletteName;
}

/** Résultat d'extraction depuis une fiche Héphaïstos — voir core/lore/hephaistos.ts. */
export interface LoreExtraction {
  classId: ClassId;
  gender: Gender;
  /** Texte brut du champ Type trouvé dans la fiche, pour audit/debug. */
  typeText: string | null;
}
