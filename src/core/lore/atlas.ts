// Client Atlas (port 5557) — simplifié depuis Terra-Incognita/src/atlas/client.ts
// (même API REST, mêmes types de nœuds/relations). Read-only : Quidam ne
// publie rien vers l'Atlas.

import type { FactionStyle } from "../../shared/types";

const ATLAS_URL = process.env.ATLAS_URL ?? "http://localhost:5557";
const FETCH_TIMEOUT_MS = 3000;

export interface AtlasNode {
  id: string;
  label: string;
  category: string;
  subcat: string | null;
}

export interface AtlasRelation {
  source: string;
  target: string;
  rel_type: string;
}

export interface AtlasGraph {
  nodes: AtlasNode[];
  relations: AtlasRelation[];
}

async function api<T>(pathname: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${ATLAS_URL}${pathname}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Atlas GET ${pathname} → HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchGraph(category?: string): Promise<AtlasGraph> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  const raw = await api<{ nodes: AtlasNode[]; relations?: AtlasRelation[] }>(`/api/graph${qs}`);
  return { nodes: raw.nodes, relations: raw.relations ?? [] };
}

/**
 * Correspondance faction Atlas → style d'accessoire Quidam. Seules les
 * factions ayant une recette dédiée (core/portrait/factions.ts) sont
 * listées ; toute autre faction canon n'a simplement pas d'accessoire pour
 * l'instant (silhouette classe+genre seule).
 */
const FACTION_STYLE: Record<string, FactionStyle> = {
  "cgu-rectitude": "martial",
  "pasteurs-de-la-rectitude": "liturgique",
  "voile-ombre": "clandestin",
  "gardiens-des-jardins": "organique",
  "magnats-industriels": "industriel",
  "archivistes-libres": "civique",
  "division-dark-umbrae": "dark-umbrae",
};

/** Faction(s) dont `personnageId` est `membre` (relation sortante), résolue
 *  vers un style d'accessoire si l'une d'elles en a un. */
export function factionStyleFor(personnageId: string, graph: AtlasGraph): FactionStyle | undefined {
  const factionIds = graph.relations
    .filter((r) => r.source === personnageId && r.rel_type === "membre")
    .map((r) => r.target);
  for (const id of factionIds) {
    const style = FACTION_STYLE[id];
    if (style) return style;
  }
  return undefined;
}
