import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: "esnext",
    outDir: "dist",
    alias: {
        "@core": "./src/core",
        "@shared": "./src/shared",
        "@features": "./src/features"
    }
});
