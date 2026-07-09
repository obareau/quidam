// Aperçu web : exploration manuelle (classe/genre/faction/palette) +
// tentative de génération directe depuis le lore. Note : Atlas/Héphaïstos
// n'exposent pas de CORS (cf. Mnémosyne, qui a dû passer par un proxy Flask
// pour cette même raison) — le fetch direct navigateur échouera si la page
// n'est pas servie depuis le même hôte. Le chemin fiable pour le lore reste
// le CLI (`npm run generate`, Node, aucune contrainte CORS). Ce bouton est
// un bonus best-effort, pas la voie principale.

import { drawPortrait } from "../core/portrait";
import { EXPORT_W, EXPORT_H, drawCaption, captionInfoLine, type TextCtx } from "../core/portrait/caption";
import { PALETTES } from "../core/palettes";
import type { ClassId, FactionStyle, Gender, PaletteName, PortraitParams } from "../shared/types";

function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Élément #${id} introuvable`);
  return el as T;
}

const canvas = $<HTMLCanvasElement>("view");
canvas.width = EXPORT_W;
canvas.height = EXPORT_H;
const ctx = canvas.getContext("2d") as unknown as TextCtx;

/** Nom affiché dans le bandeau — le nom du personnage si chargé depuis le
 *  lore (voir #btnFromLore), sinon la seed manuelle. */
let displayName = "";

function readParams(): PortraitParams {
  const factionValue = $<HTMLSelectElement>("factionStyle").value;
  return {
    seed: $<HTMLInputElement>("seed").value.trim() || "quidam",
    classId: $<HTMLSelectElement>("classId").value as ClassId,
    gender: $<HTMLSelectElement>("gender").value as Gender,
    factionStyle: (factionValue || undefined) as FactionStyle | undefined,
    palette: $<HTMLSelectElement>("palette").value as PaletteName,
  };
}

function render(): void {
  const params = readParams();
  drawPortrait(ctx, params);
  const name = displayName || params.seed;
  drawCaption(ctx, PALETTES[params.palette], name, captionInfoLine(params.classId, params.gender, params.factionStyle));
}

function writeParams(p: PortraitParams): void {
  $<HTMLInputElement>("seed").value = p.seed;
  $<HTMLSelectElement>("classId").value = p.classId;
  $<HTMLSelectElement>("gender").value = p.gender;
  $<HTMLSelectElement>("factionStyle").value = p.factionStyle ?? "";
}

$("btnGenerate").addEventListener("click", () => {
  displayName = ""; // retour au mode manuel : le bandeau reprend la seed
  render();
});
$<HTMLSelectElement>("palette").addEventListener("change", render);

$("btnCrt").addEventListener("click", () => {
  const vp = $("viewport");
  const on = vp.classList.toggle("crt");
  $<HTMLButtonElement>("btnCrt").textContent = `CRT : ${on ? "ON" : "OFF"}`;
});

$("btnPng").addEventListener("click", () => {
  const name = (displayName || $<HTMLInputElement>("seed").value.trim() || "quidam").replace(/["/\\]/g, "").trim();
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${name}.png`;
  a.click();
});

$("btnFromLore").addEventListener("click", async () => {
  const slug = $<HTMLInputElement>("slug").value.trim();
  const info = $("loreInfo");
  const status = $("status");
  if (!slug) return;
  status.textContent = "Interrogation du lore…";
  try {
    const [ficheRes, graphRes] = await Promise.all([
      fetch(`http://localhost:5561/api/fiche/${encodeURIComponent(slug)}`),
      fetch("http://localhost:5557/api/graph"),
    ]);
    if (!ficheRes.ok) throw new Error(`Héphaïstos → HTTP ${ficheRes.status}`);
    if (!graphRes.ok) throw new Error(`Atlas → HTTP ${graphRes.status}`);
    // Extraction faite côté navigateur en réimportant les mêmes règles que
    // core/lore/hephaistos.ts serait un doublon de logique ; pour ce bouton
    // bonus on affiche seulement le Type brut et laisse le CLI faire
    // l'extraction complète (voie fiable, testée).
    const fiche = (await ficheRes.json()) as { title?: string; body: string };
    const typeMatch = fiche.body.match(/\*\*Type\s*:?\*\*\s*:?\s*(.+)/i) ?? fiche.body.match(/\|\s*\*\*Type\*\*\s*\|\s*([^|]+)\|/i);
    info.innerHTML = `Type détecté : <b>${typeMatch ? typeMatch[1].trim() : "non trouvé — voir le CLI pour l'extraction complète"}</b>`;
    displayName = fiche.title || slug; // le bandeau (et le nom de fichier PNG) prend le nom du perso
    writeParams({ ...readParams(), seed: slug });
    render();
    status.textContent = `${slug} — chargé depuis le lore (voir CLI pour classe/genre auto)`;
  } catch (err) {
    status.textContent = "Échec lore (CORS probable) — utiliser le CLI : tsx src/cli/generate.ts --slug=" + slug;
    info.textContent = (err as Error).message;
  }
});

render();
