// @leadconnector/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only, jsxSource fallback + tailwind config), @tanstack/devtools-vite source injection (data-tsd-source, dev-only),
//     HMR gate/flush, dev-server bridge controls, server diagnostics, lightningcss, and sandbox detection
//     (secure host allowlist, port/strictPort, watch ignores, and HMR overlay policy).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { readdirSync } from "node:fs";
import { defineConfig } from "@leadconnector/vite-tanstack-config";

// Caché de los estáticos de public/ sin hash en el nombre (mismas reglas que public/_headers,
// que solo lee Cloudflare): 30 días y revalidación con ETag; /assets/* ya sale immutable.
const STATIC_CACHE = {
  headers: { "cache-control": "public, max-age=2592000, stale-while-revalidate=604800" },
};
const staticCacheRoutes = [
  "/images/**",
  "/fonts/**",
  ...readdirSync("public")
    .filter(
      (file) =>
        /^(video_|logo_)/.test(file) || file === "favicon.ico" || file === "apple-touch-icon.png",
    )
    .map((file) => `/${file}`),
];

export default defineConfig({
  nitro: {
    // Destino real: cPanel con Node.js (el formulario guarda en MySQL con mysql2, que
    // necesita TCP). Se arranca con `node .output/server/index.mjs`. El plugin usa
    // Cloudflare por defecto y lo fuerza dentro de AI Studio (VIBE_SANDBOX=1): ese
    // entorno no puede alcanzar la MySQL local, así que allí el formulario responderá 503.
    preset: "node-server",
    routeRules: Object.fromEntries(staticCacheRoutes.map((route) => [route, STATIC_CACHE])),
    // Solo aplica al preset de Cloudflare (AI Studio); no afecta al build de Node.
    cloudflare: {
      nodeCompat: true,
      // Nombre fijo del Worker; sin esto Nitro lo deriva del remoto de git.
      wrangler: { name: "telcobras-web" },
    },
  },
  // Browser errors stay in the trusted parent-frame console-log flow;
  // do not expose the bridge collector on the public sandbox tunnel.
  devServerBridge: { errorCollector: false },
  // Do not set server.hmr.timeout — Vite 8 deprecated those websocket fields
  // (use server.ws.*). Overlay/host/port are package-owned; default WS timeout is 30s.
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
