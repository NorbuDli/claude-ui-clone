import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApiMiddleware } from './server/apiMiddleware';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-backend-middleware',
      configureServer(server) {
        server.middlewares.use(createApiMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createApiMiddleware());
      }
    }
  ],
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-markdown': [
            'react-markdown',
            'rehype-highlight',
            'rehype-katex',
            'rehype-raw',
            'remark-gfm',
            'remark-math'
          ],
          'vendor-katex': ['katex'],
          'vendor-motion': ['framer-motion']
        }
      }
    }
  }
});

