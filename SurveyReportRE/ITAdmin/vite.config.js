import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/ITAdmin/dist',
  build: {
    outDir: path.resolve(__dirname, '../wwwroot/ITAdmin/dist'),
    emptyOutDir: true,      // KHÔNG xóa toàn bộ wwwroot
  },
});