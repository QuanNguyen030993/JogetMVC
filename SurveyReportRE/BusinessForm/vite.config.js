import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/dist/',
  build: {
    outDir: path.resolve(__dirname, '../wwwroot/dist'),
    assetsDir: 'assets-bizform',
    emptyOutDir: false,
  },
});