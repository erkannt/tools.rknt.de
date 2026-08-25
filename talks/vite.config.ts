import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import {
  readdirSync,
  statSync,
  createReadStream,
  mkdirSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

function slidesPlugin(): Plugin {
  const slidesDir = fileURLToPath(new URL("./slides/", import.meta.url));
  const distSlidesDir = fileURLToPath(
    new URL("./dist/slides/", import.meta.url)
  );

  function readSlides(): string[] {
    try {
      return readdirSync(slidesDir)
        .filter((f) => f.toLowerCase().endsWith(".pdf"))
        .sort();
    } catch {
      return [];
    }
  }

  return {
    name: "slides",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";

        if (url === "/talks/slides/manifest.json") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(readSlides()));
          return;
        }

        const prefix = "/talks/slides/";
        if (url.startsWith(prefix)) {
          const filename = decodeURIComponent(url.slice(prefix.length));
          const filePath = slidesDir + filename;
          try {
            const stat = statSync(filePath);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Length", stat.size);
            createReadStream(filePath).pipe(res as Parameters<typeof createReadStream>[1]);
          } catch {
            next();
          }
          return;
        }

        next();
      });
    },
    closeBundle() {
      const slides = readSlides();
      mkdirSync(distSlidesDir, { recursive: true });
      writeFileSync(distSlidesDir + "manifest.json", JSON.stringify(slides));
      for (const file of slides) {
        copyFileSync(slidesDir + file, distSlidesDir + file);
      }
    },
  };
}

export default defineConfig({
  plugins: [svelte(), slidesPlugin()],
  root: ".",
  base: "/talks/",
  build: {
    rollupOptions: {
      output: {
        assetFileNames(assetInfo) {
          // .mjs isn't in most default nginx mime.types; emit as .js instead
          if (assetInfo.name?.endsWith(".mjs")) {
            return "assets/[name]-[hash].js";
          }
          return "assets/[name]-[hash].[ext]";
        },
      },
    },
  },
});
