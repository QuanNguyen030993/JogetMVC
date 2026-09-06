import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/DataGrid/index.ts'),
      name: 'TMIVGrid',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'tmiv-grid.js' : 'tmiv-grid.cjs',
    },
    outDir: path.resolve(__dirname, 'dist-grid'),
    emptyOutDir: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        assetFileNames: (asset) => asset.name?.endsWith('.css') ? 'tmiv-grid.css' : 'assets/[name][extname]',
      },
    },
  },
});
