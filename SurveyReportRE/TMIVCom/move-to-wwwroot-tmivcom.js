import { rmSync, renameSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  cpSync
} from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const tempDir = path.resolve(__dirname, 'dist');
// const wwwroot = path.resolve(__dirname, '../wwwroot');
// const targetRoot = path.join(wwwroot, 'TMIVCom');

// const targetAssets = path.join(targetRoot, 'assets');
// if (existsSync(targetAssets)) {
//   rmSync(targetAssets, { recursive: true, force: true });
// }

// if (!existsSync(targetRoot)) {
//   // preserve other deployed static files under wwwroot
//   mkdirSync(targetRoot, { recursive: true });
// }

// renameSync(path.join(tempDir, 'assets'), targetAssets);
// renameSync(path.join(tempDir, 'index.html'), path.join(targetRoot, 'index.html'));



const tempDir = path.resolve(__dirname,'dist');

const targetRoot =
 path.resolve(__dirname,'../wwwroot/TMIVCom');


const targetAssets =
 path.join(targetRoot,'assets');


if(existsSync(targetAssets)){
   rmSync(targetAssets,{
      recursive:true,
      force:true
   });
}


mkdirSync(targetRoot,{
 recursive:true
});


cpSync(
 path.join(tempDir,'assets'),
 targetAssets,
 {
   recursive:true
 }
);


cpSync(
 path.join(tempDir,'index.html'),
 path.join(targetRoot,'index.html')
);