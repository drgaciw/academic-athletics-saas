import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'cli.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['@aah/ai', '@aah/database'],
});
