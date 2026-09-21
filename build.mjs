import {mkdir,copyFile,writeFile,cp} from 'node:fs/promises';
await mkdir('docs',{recursive:true});
for(const file of ['index.html','app.js','engine.js','tabletop.js','tile-drag.js','audio.js','style.css'])await copyFile(file,`docs/${file}`);
await cp('assets/audio','docs/assets/audio',{recursive:true});
await writeFile('docs/.nojekyll','');
console.log('GitHub Pages site built in docs/');
