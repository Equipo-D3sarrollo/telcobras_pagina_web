import { execFileSync } from "node:child_process";
import { chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";

try {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
    stdio: "ignore",
  });
} catch {
  process.exit(0);
}

try {
  chmodSync(fileURLToPath(new URL("../.githooks/pre-commit", import.meta.url)), 0o755);
} catch {}
