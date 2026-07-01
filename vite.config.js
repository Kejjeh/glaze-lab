import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base: GitHub Pages serves the project at /<repo>/. Repo name is
// "glaze-lab". For a root-served host (Vercel/Netlify/Cloudflare), set '/'.
export default defineConfig({
  base: '/glaze-lab/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Glaze Lab',
        short_name: 'Glaze Lab',
        description:
          'Multi-protein air-fryer glaze builds & rice-cooker bowls with a shared pantry, batch scaling, and cook timers.',
        theme_color: '#EF5238',
        background_color: '#FFF3EC',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
