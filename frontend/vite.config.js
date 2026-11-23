import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_PROXY_TARGET || 'http://localhost:4000';

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          // Forward Set-Cookie for FitPlus-style HttpOnly sessions
          cookieDomainRewrite: '',
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.API_KEY) proxyReq.setHeader('x-api-key', env.API_KEY);
              if (env.CLIENT_ID) proxyReq.setHeader('x-client-id', env.CLIENT_ID);
              if (env.CLIENT_SECRET) {
                proxyReq.setHeader('x-client-secret', env.CLIENT_SECRET);
              }
            });
          },
        },
      },
    },
  };
});
