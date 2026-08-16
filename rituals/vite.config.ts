import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function injectServiceWorkerBuildId(): Plugin {
  const distDir = fileURLToPath(new URL("./dist/", import.meta.url));
  return {
    name: "inject-service-worker-build-id",
    closeBundle() {
      const swPath = `${distDir}sw.js`;
      const buildId = Date.now().toString(36);
      writeFileSync(
        swPath,
        readFileSync(swPath, "utf8").replace("__BUILD_ID__", buildId)
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), injectServiceWorkerBuildId()],
  root: ".",
  base: "/rituals/",
});
