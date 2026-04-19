import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'], // Removed cli.ts - build separately if needed
  format: ['esm', 'cjs'],
  dts: false, // Temporarily disabled due to type mismatches - will be fixed in a separate PR
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['@aah/ai', '@aah/database'],
});
