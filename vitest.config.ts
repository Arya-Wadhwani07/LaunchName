import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // Next's guard that throws if a server module is bundled for the
      // browser; tests run on the server side, so it's a no-op here.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration tests run against the in-repo name.com mock, never the live
    // sandbox, so results are deterministic and spend no sandbox balance.
    env: { NAMECOM_USERNAME: "", NAMECOM_API_TOKEN: "", ANTHROPIC_API_KEY: "" },
  },
});
