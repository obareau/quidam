import { extractLore } from "../src/core/lore/hephaistos";
import { FICHES } from "./fixtures/fiches";

describe("extraction classe/genre depuis le texte des fiches Héphaïstos", () => {
  for (const [slug, fixture] of Object.entries(FICHES)) {
    test(`${slug} → classe "${fixture.expectedClass}", genre "${fixture.expectedGender}"`, () => {
      const result = extractLore(fixture.body);
      expect(result.classId).toBe(fixture.expectedClass);
      expect(result.gender).toBe(fixture.expectedGender);
    });
  }

  test("aucun champ Type ni mot-clé de classe → repli humain", () => {
    const result = extractLore("# Quidam\n\nUn personnage sans indication d'espèce dans le texte.");
    expect(result.classId).toBe("humain");
    expect(result.typeText).toBeNull();
  });

  test("« il y a » n'influence pas la détection de genre (tournure impersonnelle)", () => {
    const result = extractLore("Il y a longtemps, il y avait un lieu. Elle y est retournée.");
    expect(result.gender).toBe("feminin");
  });

  test("autant de pronoms des deux genres → neutre", () => {
    const result = extractLore("Il parle. Elle répond. Il écoute. Elle continue.");
    expect(result.gender).toBe("neutre");
  });

  test("une citation en exergue ne fausse pas le classement (Elise Kessler, humaine)", () => {
    const result = extractLore(
      `# Elise Kessler — L'Architecte de la Mémoire\n\n` +
      `**Génération :** 1 · **Faction :** Neutre\n\n` +
      `> "Elise Kessler ne voyait pas de frontière entre l'humain et le synthétique."\n` +
      `> — Ezekiel Kessler\n\n---\n\n## Identité\n\nElise Kessler est la figure fondatrice de la lignée Kessler.`,
    );
    expect(result.classId).toBe("humain");
  });

  test("priorité hybride > synthétique > robotarii dans le classement", () => {
    expect(extractLore("**Type :** Hybride robotarii-synthétique").classId).toBe("hybride");
    expect(extractLore("**Type :** Robōtarii de conscience synthétique").classId).toBe("synthetique");
  });
});
