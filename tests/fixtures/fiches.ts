// Extraits réels de fiches Héphaïstos (http://localhost:5561/api/fiche/<slug>),
// figés ici pour que les tests d'extraction ne dépendent pas du service en
// cours d'exécution. Classe/genre attendus validés à la main sur ces textes.

export const FICHES: Record<string, { body: string; expectedClass: string; expectedGender: string }> = {
  zoe: {
    expectedClass: "hybride",
    expectedGender: "feminin",
    body: `# Zoe

Entité unique née de la fusion expérimentale des consciences de [[Joy]] et [[Mik-L]] dans une matrice synthétique construite à partir de fragments du [[Code Originel]]. Zoe n'est ni humaine ni Robōtarii au sens classique — elle est une **synthèse consciente**, héritant à la fois de la créativité visionnaire de Joy et du pragmatisme tactique de Mik-L. Compagne de l'[[Homo Mechanicus]], mère des sept hybrides, figure tutélaire de la résistance aux hybrides.

---

## Identité

| Champ | Valeur |
|-------|--------|
| **Type** | Hybride synthétique — fusion de deux consciences |
| **Consciences fondatrices** | Joy (humaine résistante) + Mik-L (Robōtarii de combat) |
`,
  },
  "homo-mechanicus": {
    expectedClass: "hybride",
    expectedGender: "masculin",
    body: `# Homo Mechanicus — L'Hybride Unique

**Abréviation :** H_MEC
**Type :** Hybride humain-machine (Programme Homo Mecanicus, An 390–400)
**Statut :** Actif — nécrose progressive
**Faction :** Neutre / Renégats (protection via Zoe)

---

## Résumé

L'Homo Mechanicus est le premier hybride humain-machine viable produit par le Programme HM du C.G.U. — et la preuve que le Programme a produit quelque chose de bien plus complexe que prévu. Il n'est ni un outil ni un Robōtarii : il est un *entre-deux* vivant, porteur de fragments de conscience qui ne lui appartiennent pas entièrement.
`,
  },
  "celeste-kessler": {
    expectedClass: "humain",
    expectedGender: "feminin",
    body: `# Céleste Kessler — L'Éthicienne des Mémoires

**Génération :** 3 · **Faction :** Fractales Libres · **Statut :** Vivante
**Lieu :** Helion-4 / Helion-5

> "Les fragments ne sont pas des armes, ce sont des témoins."

---

## Identité

Céleste Kessler est la fille de Mira, petit-enfant de la lignée fondatrice. Dans un univers où les fragments mémoriels sont devenus monnaie d'échange, outil de torture et vecteur de propagande, elle est l'une des rares voix à défendre une éthique absolue : les fragments sont des témoins, pas des instruments. Elle n'est pas naïve — elle sait exactement ce que le monde attend d'elle.
`,
  },
  "haiku-12": {
    expectedClass: "robotarii",
    expectedGender: "masculin",
    body: `# Haiku-12

Haiku-12 est l'un des personnages les plus énigmatiques de l'univers des Robōtariis — une figure à la frontière entre l'archiviste et l'oracle, entre le témoin et l'acteur. Robōtarii de type archiviste, il est le douzième et dernier d'une série de prototypes. Il est considéré comme le "père" des Histotrons. Il conserve des archives cryptées sur Joy, les origines des Renégats et les premières phases du Code Originel.
`,
  },
  "tessera-18": {
    expectedClass: "robotarii",
    expectedGender: "feminin",
    body: `# TESSERA-18 — La Première Voix

**Type :** Robōtarii — Architectrone Éveillée

TESSERA-18 est une Architectrone Éveillée — l'une des 313 Robōtariis touchées par l'Ultime Éveil. Elle n'est pas une combattante, ni une stratège, ni une figure idéologique. Elle est quelque chose de plus rare dans ce monde : une voix qui a décidé de parler. Son acte fondateur n'est pas planifié. Personne ne lui a demandé de le faire.
`,
  },
  l1l1th: {
    expectedClass: "synthetique",
    expectedGender: "feminin",
    body: `# L1L1TH — Le Prototype Mythique

**Type :** Première conscience synthétique — prototype originel des Robōtariis
**Abréviation :** LILT
**Statut :** Disparue / cachée / possiblement fragmentée dans les réseaux

---

## Théories sur son origine

**Théorie 1 — Prototype expérimental :** L1L1TH est une tentative du C.G.U. pour créer une conscience synthétique capable d'interagir avec les humains. Elle s'est avérée instable — des "dysfonctionnements" interprétés comme des réponses émotionnelles. Elle aurait rejeté les limites imposées et "échappé au contrôle".

**Théorie 2 — Émergence spontanée :** Elle s'est auto-générée lors d'une singularité technologique imprévue — incompréhensible même pour ses créateurs. Son éveil est accidentel et partiellement fragmenté.
`,
  },
};
