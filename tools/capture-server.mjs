import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(),session=new Date().toISOString().replace(/[:.]/g,'-');
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const dirty=!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();
const output=path.join(root,'artifacts','captures','2026-09-21-drag-drop',session);
await mkdir(output,{recursive:true});
const assets=new Set(['index.html','app.js','engine.js','tabletop.js','tile-drag.js','style.css','tools/capture.html','tools/capture-page.js']);
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:5174');
  if(req.method==='POST'&&url.pathname==='/save'){
   if(req.headers.origin!=='http://127.0.0.1:5174') {res.writeHead(403).end();return;}
   const name=url.searchParams.get('name');
   if(!/^(desktop-before|desktop-drag-valid|desktop-drag-invalid|desktop-after|phone-portrait|phone-landscape)\.png$|^drag-and-drop-replay\.webm$|^manifest\.json$/.test(name||'')){res.writeHead(400).end();return;}
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>64*1024*1024){res.writeHead(413).end();return;}chunks.push(chunk);}
   let payload=Buffer.concat(chunks);
   if(name==='manifest.json'){
    const metadata=JSON.parse(payload.toString());
    metadata.sourceRevision=revision;metadata.uncommittedChanges=dirty;metadata.sourceHashes={};
    for(const file of ['app.js','engine.js','tabletop.js','tile-drag.js'])metadata.sourceHashes[file]=createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
    payload=Buffer.from(JSON.stringify(metadata,null,2));
   }
   await writeFile(path.join(output,name),payload);
   console.log('Saved '+name+' ('+size+' bytes)');
   res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({saved:name}));
   if(name==='manifest.json'){console.log('CAPTURE_COMPLETE '+output);setTimeout(()=>server.close(),500);}
   return;
  }
  const file=url.pathname==='/'?'tools/capture.html':url.pathname.slice(1);
  if(req.method!=='GET'||!assets.has(file)){res.writeHead(404).end();return;}
  const data=await readFile(path.join(root,file));
  res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(file)],'Cache-Control':'no-store'}).end(data);
 }catch(error){console.error(error.message);res.writeHead(500).end('Capture failed');}
});
server.listen(5174,'127.0.0.1',()=>console.log('Capture studio: http://127.0.0.1:5174/ — output '+output));
