// PRNG déterministe seedé — AUCUN Math.random() dans src/core.
// Copie verbatim de Terra-Incognita/src/core/rng.ts : même convention de
// déterminisme dans tout l'écosystème ROBOTARIIS.

export type Rng = () => number;

/** xmur3 : hash d'une chaîne vers un générateur d'entiers 32 bits. */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** sfc32 : PRNG rapide et de bonne qualité, 4 mots d'état. */
function sfc32(a: number, b: number, c: number, d: number): Rng {
  return () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const out = (t + d) | 0;
    c = (c + out) | 0;
    return (out >>> 0) / 4294967296;
  };
}

/** RNG dédié à un domaine : rngFor(seed, 'face') ≠ rngFor(seed, 'torso'). */
export function rngFor(seed: string, domain: string): Rng {
  const gen = xmur3(`${seed}::${domain}`);
  const rng = sfc32(gen(), gen(), gen(), gen());
  // Écarte les premières valeurs (état initial corrélé au hash).
  for (let i = 0; i < 8; i++) rng();
  return rng;
}

/** Seed dérivée (ex. variante d'un même personnage). */
export function deriveSeed(seed: string, ...parts: (string | number)[]): string {
  const gen = xmur3(`${seed}::${parts.join(":")}`);
  return `${parts[0] ?? "sub"}-${gen().toString(36)}${gen().toString(36)}`;
}

export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Tirage pondéré : weights[i] ∝ probabilité de l'index i. */
export function weighted(rng: Rng, weights: readonly number[]): number {
  let total = 0;
  for (const w of weights) total += w;
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
