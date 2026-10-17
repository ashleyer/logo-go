import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.API_KEY || env.VITE_GEMINI_API_KEY || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'inject-gemini-key',
          transformIndexHtml(html) {
            return html.replace(
              '</head>',
              `  <script>window.__GEMINI_API_KEY__ = ${JSON.stringify(apiKey)};</script>\n</head>`
            );
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.GOOGLE_API_KEY': JSON.stringify(apiKey),
        'process.env': JSON.stringify({
          API_KEY: apiKey,
          GEMINI_API_KEY: apiKey,
          GOOGLE_API_KEY: apiKey,
        }),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
