import * as esbuild from "esbuild";
import * as fs from "node:fs";

const production = process.argv.includes("--production");
const common = {
  bundle: true,
  sourcemap: !production,
  minify: production,
  logLevel: "info" as const,
};

async function main(): Promise<void> {
  // Aperçu web (Canvas 2D navigateur).
  await esbuild.build({
    ...common,
    entryPoints: ["src/renderer/renderer.ts"],
    outfile: "dist-web/renderer.js",
    platform: "browser",
    format: "iife",
  });
  fs.mkdirSync("dist-web", { recursive: true });
  fs.copyFileSync("src/renderer/index.html", "dist-web/index.html");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
