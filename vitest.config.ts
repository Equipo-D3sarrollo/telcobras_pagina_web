import { defineConfig } from "vitest/config";

// Solo las pruebas de la capa de servidor (src/lib). Los demás archivos *.test.tsx del
// proyecto siguen vacíos (ver pendiente 2 de documentacion/contexto.md).
export default defineConfig({
  test: {
    environment: "node",
    // Con Node 26 y vitest 5.0.5 los pools «forks» y «threads» no encuentran el runner
    // («Vitest failed to find the runner»); «vmThreads» funciona.
    pool: "vmThreads",
    include: ["src/lib/**/*.server.test.ts"],
  },
});
