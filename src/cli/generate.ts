// CLI batch : génère une fiche image PNG par personnage, en piochant
// classe/genre/faction directement dans le lore (Héphaïstos + Atlas).
// Mode incrémental par défaut (ne régénère pas ce qui existe déjà) — voir
// --force pour écraser.
//
//   tsx src/cli/generate.ts                       # tous les manquants
//   tsx src/cli/generate.ts --slug=zoe            # un seul (manquant)
//   tsx src/cli/generate.ts --slug=zoe --force     # un seul, forcé
//   tsx src/cli/generate.ts --force                # tous, forcé (écrase tout)
//   tsx src/cli/generate.ts --palette=sepia --out=output/

import * as path from "node:path";
import { listTargets, generatePortrait } from "../core/pipeline";
import type { PaletteName } from "../shared/types";

function parseArgs(): { opts: Record<string, string>; force: boolean } {
  const opts: Record<string, string> = {};
  let force = false;
  for (const arg of process.argv.slice(2)) {
    if (arg === "--force") { force = true; continue; }
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) opts[m[1]] = m[2];
  }
  return { opts, force };
}

async function main(): Promise<void> {
  const { opts, force } = parseArgs();
  const palette = (opts.palette as PaletteName) ?? "phosphore";
  const outDir = opts.out ?? "output";
  const { graph, targets } = await listTargets();

  const wanted = opts.slug ? targets.filter((t) => t.slug === opts.slug) : targets;
  if (opts.slug && wanted.length === 0) {
    console.error(`✘ slug "${opts.slug}" introuvable dans l'Atlas (category: personnage)`);
    process.exit(1);
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const t of wanted) {
    const r = await generatePortrait(t.slug, t.name, graph, { palette, outDir, force });
    const base = path.basename(r.file);
    if (r.status === "generated") {
      generated++;
      const tag = r.factionStyle ? `/${r.factionStyle}` : "";
      console.log(`✔ ${base} — ${r.classId}/${r.gender}${tag} (Type : ${r.typeText ?? "—"})`);
    } else if (r.status === "skipped") {
      skipped++;
      console.log(`… ${base} déjà généré — ignoré (--force pour écraser)`);
    } else {
      failed++;
      console.error(`✘ ${t.slug} : ${r.message}`);
    }
  }
  console.log(`\n${generated} généré(s), ${skipped} ignoré(s) (déjà présents), ${failed} échec(s) → ${outDir}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
