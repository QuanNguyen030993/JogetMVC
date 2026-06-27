import { defineConfig,loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

// export default defineConfig({
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
   return {build: {
   

    lib: {

      entry: path.resolve(
        __dirname,
        'src/components/Datebox.jsx'
      ),

      name: 'TMIVComDateBox',

      formats: ['iife'],

      fileName: () => 'datebox.js'
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
    emptyOutDir:true
  },define: {
      'process.env': env,
    },
    plugins: [react()],}
});