import { drawPortrait } from "../src/core/portrait";
import type { PixelCtx } from "../src/core/portrait/draw";
import type { ClassId, PortraitParams } from "../src/shared/types";

// Faux contexte : enregistre chaque fillRect en texte plutôt que de rendre
// de vrais pixels — suffisant pour comparer deux rendus au trait près sans
// dépendre de @napi-rs/canvas dans les tests.
function fakeCtx(): { ctx: PixelCtx; trace: () => string } {
  const ops: string[] = [];
  const ctx: PixelCtx = {
    fillStyle: "",
    fillRect(x: number, y: number, w: number, h: number) {
      ops.push(`${this.fillStyle}:${x},${y},${w},${h}`);
    },
  };
  return { ctx, trace: () => ops.join("|") };
}

const CLASS_IDS: ClassId[] = ["humain", "robotarii", "hybride", "synthetique"];

describe("déterminisme du portrait", () => {
  test("même seed+classe+genre+palette → trace de pixels identique", () => {
    const params: PortraitParams = { seed: "zoe", classId: "hybride", gender: "feminin", palette: "phosphore" };
    const a = fakeCtx();
    drawPortrait(a.ctx, params);
    const b = fakeCtx();
    drawPortrait(b.ctx, params);
    expect(a.trace()).toBe(b.trace());
  });

  test("seeds différentes → traces différentes (Robōtarii, variation individuelle)", () => {
    const a = fakeCtx();
    drawPortrait(a.ctx, { seed: "haiku-12", classId: "robotarii", gender: "masculin", palette: "phosphore" });
    const b = fakeCtx();
    drawPortrait(b.ctx, { seed: "tessera-18", classId: "robotarii", gender: "feminin", palette: "phosphore" });
    expect(a.trace()).not.toBe(b.trace());
  });

  test.each(CLASS_IDS)("la classe %s produit un rendu non vide", (classId) => {
    const t = fakeCtx();
    drawPortrait(t.ctx, { seed: `test-${classId}`, classId, gender: "neutre", palette: "phosphore" });
    expect(t.trace().length).toBeGreaterThan(0);
  });

  test("un accessoire de faction ajoute des opérations de dessin", () => {
    const without = fakeCtx();
    drawPortrait(without.ctx, { seed: "x", classId: "humain", gender: "neutre", palette: "phosphore" });
    const withFaction = fakeCtx();
    drawPortrait(withFaction.ctx, { seed: "x", classId: "humain", gender: "neutre", palette: "phosphore", factionStyle: "dark-umbrae" });
    expect(withFaction.trace().length).toBeGreaterThan(without.trace().length);
  });

  test("hybride : le côté mécanique retombe sur la même décision entre tête et torse (pas d'exception)", () => {
    for (const seed of ["a", "b", "c", "zoe", "homo-mechanicus"]) {
      const t = fakeCtx();
      expect(() => drawPortrait(t.ctx, { seed, classId: "hybride", gender: "masculin", palette: "phosphore" })).not.toThrow();
    }
  });
});
