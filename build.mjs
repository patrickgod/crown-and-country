import {mkdir,copyFile,writeFile} from 'node:fs/promises';
await mkdir('docs',{recursive:true});
for(const file of ['index.html','app.js','engine.js','tabletop.js','tile-drag.js','style.css'])await copyFile(file,`docs/${file}`);
await writeFile('docs/.nojekyll','');
console.log('GitHub Pages site built in docs/');
