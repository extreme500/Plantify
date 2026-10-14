import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// `npm run dev:celular` usa HTTPS para que câmera e GPS funcionem no celular pela rede local.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'https' ? [basicSsl()] : []),
    // PWA: permite instalar o app na tela inicial e usá-lo offline depois do primeiro acesso.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Plantify · Flora do Campus do Vale',
        short_name: 'Plantify',
        description: 'Mapeamento colaborativo da flora do Campus do Vale (UFRGS).',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f8f4',
        theme_color: '#14532d',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Guarda os pedaços do mapa já vistos, para o mapa continuar aparecendo sem sinal.
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: './',
}))
