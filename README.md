# Quidam — Portraits pixel-art ROBOTARIIS

> **Générateur de fiches image** pour l'univers **ROBOTARIIS** : une silhouette
> de base (buste tête + épaules) sur laquelle se greffent une classe (espèce),
> un genre et un accessoire de faction — le tout, autant que possible, piochant
> directement dans le lore plutôt que saisi à la main.

![License](https://img.shields.io/badge/license-MIT-green)

## Le principe

Une seule silhouette générique, déclinée par couches :

- **Classe** (espèce) — change la tête elle-même, reconnaissable en silhouette :
  **Humain** (galbe lisse, chevelure), **Robōtarii** (tête anguleuse, visière
  unique, antenne), **Hybride** (moitié organique / moitié mécanique scindée),
  **Synthétique** (damier + trous scintillants, glitché).
- **Genre** — overlay discret (mèches vs ombre de mâchoire), posé sur
  n'importe quelle classe.
- **Accessoire de faction** (7 styles : C.G.U., Pasteurs, Voile d'Ombre,
  Gardiens des Jardins, Magnats, Archivistes, Division Dark Umbrae).
- **Variation seedée par individu** — deux personnages de même classe+genre
  restent semblables mais jamais identiques (antenne, coutures, phase du
  damier, côté mécanique gauche/droite…).

Palette 8 tons identique au pixel près à
[Terra-Incognita](https://obareau.github.io/terra-incognita/) et
[Recta](https://obareau.github.io/Recta/) (phosphore / sépia / blueprint) —
même famille visuelle dans tout l'écosystème ROBOTARIIS.

## Ancrage lore

Classe et genre sont **déduits automatiquement** des fiches
[Héphaïstos](http://localhost:5561) (service de lecture du vault
`robotariis-writing`) plutôt que saisis à la main :

- Classe : champ `**Type :**` de la fiche (table ou ligne), avec repli sur le
  paragraphe d'ouverture si absent (les citations en exergue sont ignorées —
  ce sont des mots d'ambiance, pas des descripteurs factuels).
- Genre : comptage de pronoms (`il`/`elle`) sur l'ensemble de la fiche —
  heuristique assumée en l'absence de champ structuré dans le lore, jamais
  fiable à 100 % sur un texte court ou ambigu.
- Faction : relation `membre` sortante vers un nœud
  [Atlas](http://localhost:5557) dont le style a une recette dédiée.

## Utilisation

```bash
npm install

# Génère les fiches PNG manquantes (mode incrémental par défaut)
npm run generate
npm run generate -- --slug=zoe              # un seul personnage
npm run generate -- --slug=zoe --force      # un seul, forcé (écrase)
npm run generate -- --force                 # tout, forcé
npm run generate -- --palette=sepia --out=output/

# Interface web de lancement (liste + statut + génère/force par personnage)
npm run admin                                # http://localhost:5691

# Aperçu manuel (classe/genre/faction/palette, hors-lore)
npm run build && npx serve dist-web          # ou tout serveur statique
```

Chaque PNG exporté (`output/<Nom du personnage>.png`) embarque un bandeau
nom + infos (classe · genre · faction) sous le portrait — le nom de fichier
est celui du personnage, pas son slug technique.

## Développement

```bash
npx tsc --noEmit   # typecheck
npm test           # jest — déterminisme + extraction lore (fixtures réelles)
```

Voir `prototype/apercu.html` pour le prototype visuel jetable qui a servi à
valider la direction esthétique avant l'implémentation réelle.

Fait partie de l'écosystème **ROBOTARIIS** ([Terra-Incognita](https://obareau.github.io/terra-incognita/),
[Recta](https://obareau.github.io/Recta/)).
