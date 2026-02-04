import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: "/chunked-calendar/",
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["node_modules"],
  },
});
