import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Odvoji stabilne vendor pakete u zasebne, keširane chunkove.
        //  • react-vendor: react/react-dom/router — eager, ali se rijetko mijenja pa se kešira.
        //  • charts-vendor: recharts + d3 — koriste ga samo lazy ekrani s grafovima
        //    (svi importeri su lazy), pa ostaje async i ne opterećuje početno učitavanje.
        //  Leaflet ostaje u UnitsMap chunku (već lazy).
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router') || id.includes('/react-dom/') || /\/react\//.test(id) || id.includes('/scheduler/')) {
            return 'react-vendor'
          }
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory') || id.includes('/decimal.js')) {
            return 'charts-vendor'
          }
        },
      },
    },
  },
})
