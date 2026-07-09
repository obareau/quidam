// Client Héphaïstos (port 5561) : sert le texte source du vault
// robotariis-writing. Read-only. Les fonctions d'extraction sont pures
// (texte en entrée) pour rester testables sans réseau — voir
// tests/lore-extraction.test.ts.

import type { ClassId, Gender, LoreExtraction } from "../../shared/types";

const HEPHAISTOS_URL = process.env.HEPHAISTOS_URL ?? "http://localhost:5561";
const FETCH_TIMEOUT_MS = 3000;

export interface Fiche {
  slug: string;
  title: string;
  category: string | null;
  body: string;
  words: number;
}

export async function fetchFiche(slug: string): Promise<Fiche> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${HEPHAISTOS_URL}/api/fiche/${encodeURIComponent(slug)}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Héphaïstos GET /api/fiche/${slug} → HTTP ${res.status}`);
    return (await res.json()) as Fiche;
  } finally {
    clearTimeout(timer);
  }
}

export async function listPersonnages(): Promise<{ slug: string; name: string }[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${HEPHAISTOS_URL}/api/entities?category=personnage`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Héphaïstos GET /api/entities → HTTP ${res.status}`);
    const raw = (await res.json()) as { entities: { slug: string; name: string }[] };
    return raw.entities;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Champ Type structuré, sous 2 formes vues dans le vault :
 *   | **Type** | Hybride synthétique — fusion de deux consciences |   (table)
 *   **Type :** Hybride humain-machine (Programme HM)                  (ligne)
 */
function extractTypeField(body: string): string | null {
  const table = body.match(/\|\s*\*\*Type\*\*\s*\|\s*([^|]+)\|/i);
  if (table) return table[1].trim();
  const inline = body.match(/\*\*Type\s*:?\*\*\s*:?\s*(.+)/i);
  if (inline) return inline[1].trim();
  return null;
}

/**
 * Paragraphe d'ouverture (avant la première rupture de section) — sert de
 * filet quand aucun champ Type structuré n'existe (ex. Haiku-12, dont le
 * premier paragraphe dit explicitement "Robōtarii de type archiviste").
 * Les lignes de citation (`> …`, épigraphes) sont retirées : ce sont des
 * mots d'ambiance sur le personnage, pas des descripteurs factuels — sans
 * ça, une citation mentionnant "le synthétique" comme thème philosophique
 * (ex. Elise Kessler, humaine) faussait le classement en synthétique.
 */
function leadParagraph(body: string): string {
  const withoutTitle = body.replace(/^#[^\n]*\n/, "").replace(/^\s*>.*$/gm, "");
  const cut = withoutTitle.search(/\n(---|##)/);
  return (cut === -1 ? withoutTitle : withoutTitle.slice(0, cut)).slice(0, 800);
}

function classifyText(text: string): ClassId {
  const t = text.toLowerCase();
  if (/hybride/.test(t)) return "hybride";
  if (/synth[ée]tique/.test(t)) return "synthetique";
  if (/rob[ōo]tarii/.test(t)) return "robotarii";
  return "humain";
}

/**
 * Genre déduit par comptage de pronoms sur l'ensemble de la fiche —
 * heuristique choisie explicitement (pas de champ structuré dans le lore).
 * "il y a" est exclu (tournure impersonnelle très fréquente en français qui
 * biaiserait tout le monde vers le masculin) ; d'autres tournures
 * impersonnelles ("il est possible que…") ne sont pas filtrées — sur une
 * fiche longue, le bruit reste minoritaire face aux pronoms qui désignent
 * réellement le sujet.
 */
function detectGender(body: string): Gender {
  const feminin = (body.match(/\belle\b/gi) ?? []).length;
  const masculin = (body.match(/\bil\b(?!\s+y\s+a)/gi) ?? []).length;
  if (feminin === masculin) return "neutre";
  return feminin > masculin ? "feminin" : "masculin";
}

export function extractLore(body: string): LoreExtraction {
  const typeText = extractTypeField(body);
  const classId = classifyText(typeText ?? leadParagraph(body));
  const gender = detectGender(body);
  return { classId, gender, typeText };
}
