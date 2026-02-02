import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Security Fix: Local Proxy setup to avoid using public CORS proxies
        proxy: {
          '/api/1secmail': {
            target: 'https://www.1secmail.com/api/v1',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/1secmail/, ''),
          },
          '/api/guerrilla': {
            target: 'https://api.guerrillamail.com/ajax.php',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/guerrilla/, ''),
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});