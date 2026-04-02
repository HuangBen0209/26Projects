import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['.monkeycode-ai.online']
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
