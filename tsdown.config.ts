import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { mcp: 'src/server.ts' },
  format: ['esm'],
  dts: false,
})
