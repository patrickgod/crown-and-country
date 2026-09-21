import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const out='artifacts/audio/2026-09-21-calm-tabletop/runtime';await mkdir(out,{recursive:true});
const allowed=new Set(['audio.js','tools/check-audio.html',...['meadow-light','claim','place','rotate','invalid','finish'].map(n=>'assets/audio/'+n+'.mp3')]);
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://127.0.0.1:5175');
 if(req.method==='POST'&&u.pathname==='/save'&&req.headers.origin==='http://127.0.0.1:5175'){
 const name=u.searchParams.get('name');if(!['game-audio-showcase.webm','runtime-report.json'].includes(name)){res.writeHead(400).end();return;}
 const parts=[];let size=0;for await(const c of req){size+=c.length;if(size>10000000){res.writeHead(413).end();return;}parts.push(c);}
 await writeFile(out+'/'+name,Buffer.concat(parts));console.log('Saved '+name);res.end('OK');if(name==='runtime-report.json')setTimeout(()=>server.close(),500);return;
 }
 const file=u.pathname==='/'?'tools/check-audio.html':u.pathname.slice(1);
 if(!allowed.has(file)){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':file.endsWith('.mp3')?'audio/mpeg':file.endsWith('.js')?'text/javascript':'text/html','Cache-Control':'no-store'}).end(await readFile(file));
 }catch{res.writeHead(500).end('Audio verification failed');}});
server.listen(5175,'127.0.0.1',()=>console.log('Local audio verification: http://127.0.0.1:5175/'));
