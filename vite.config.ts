import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // The Service Worker file
      srcDir: 'src',
      filename: 'sw.ts', 
      // Important: use 'injectManifest' to use our own service worker logic
      strategies: 'injectManifest',
      manifest: {
        // ...your PWA manifest options (name, icons, etc.)
        name: 'My Besties App',
        short_name: 'Besties',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'Logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          // ...other icons
        ],
      },
    }),
  ],
});