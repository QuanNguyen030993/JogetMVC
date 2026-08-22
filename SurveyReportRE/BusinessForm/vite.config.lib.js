import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, '');

  return {
    plugins: [react()],
    define: {
      'process.env': env,
    },
    build: {
      lib: {
        entry: path.resolve(configDir, 'src/components/Core.jsx'),
        name: 'TMIVCom',
        formats: ['iife'],
        fileName: () => 'bizform.js',
      },
      outDir: path.resolve(configDir, '../wwwroot/lib/tmivcom'),
      emptyOutDir: false,
    },
  };
});
