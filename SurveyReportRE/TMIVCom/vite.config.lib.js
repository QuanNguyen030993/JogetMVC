import { defineConfig,loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// export default defineConfig({
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
   return {build: {
   

    lib: {

      entry: path.resolve(
        __dirname,
        'src/components/Core.jsx'
      ),

      name: 'TMIVCom',

      formats: ['iife'],

      fileName: () => 'core.js'
    },


    outDir: path.resolve(
      __dirname,
      '../wwwroot/lib/tmivcom'
    ),

    // rollupOptions:{
    //     external:[
    //         "react",
    //         "react-dom"
    //     ]
    // },
    emptyOutDir:false
  },define: {
      'process.env': env,
    },
    plugins: [
      react(),
      {
        name: 'copy-com-all-css',
        closeBundle() {
          const src = path.resolve(__dirname, 'src/css/com.all.css');
          
          // Destination 1: wwwroot/css/tmivcom/com.all.css
          const dest1 = path.resolve(__dirname, '../wwwroot/css/tmivcom/com.all.css');
          fs.mkdirSync(path.dirname(dest1), { recursive: true });
          fs.copyFileSync(src, dest1);
          console.log('Successfully copied com.all.css to wwwroot/css/tmivcom/ !');

          // Destination 2: wwwroot/css/app/com.all.css
          const dest2 = path.resolve(__dirname, '../wwwroot/css/app/com.all.css');
          fs.mkdirSync(path.dirname(dest2), { recursive: true });
          fs.copyFileSync(src, dest2);
          console.log('Successfully copied com.all.css to wwwroot/css/app/ !');
        }
      }
    ],}
});