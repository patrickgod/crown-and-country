import {Tabletop,origin,CELL} from '../tabletop.js';
import {createGame,claim,place,legalMoves,validate} from '../engine.js';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status');
const palette=['#bb744b','#688fb6','#858b54','#ac7796'];
// Reuse the exact shipped terrain artwork without initializing the interactive app.
const source=await(await fetch('/app.js')).text();
const artBody=source.slice(source.indexOf('function art(type){'),source.indexOf('\nfunction land(c)'));
const art=new Function(artBody+'; return art;')();
let seed=179;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const game=createGame(['Amber','Azure','Sage','Rose'],rng);
const table=new Tabletop(canvas,{art,onSelect(){},onView(){}});
const state={game,view:0,colors:palette,hints:true,selection:null,rotation:0};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function update(){state.view=game.active;table.setState(state);}
function claimAvailable(){claim(game,[...game.market].filter(d=>d.owner===null).sort((a,b)=>b.id-a.id)[0].id);update();}
while(game.phase==='draft')claimAvailable();
update();table.focus(game.active);
await Promise.all(Object.values(table.images).map(img=>img.complete?Promise.resolve():new Promise(resolve=>img.onload=resolve)));
await delay(150);
const assets=[];
async function save(name,blob){const r=await fetch('/save?name='+encodeURIComponent(name),{method:'POST',body:blob});if(!r.ok)throw Error('Saving '+name+' failed: '+r.status);assets.push({file:name,bytes:blob.size});}
async function shot(name){table.draw();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));await save(name,blob);}
function screen(x,y){return {x:canvas.getBoundingClientRect().left+table.w/2+(x-table.camera.x)*table.camera.z,y:canvas.getBoundingClientRect().top+table.centerY+(y-table.camera.y)*table.camera.z};}
function pointFor(move){const o=origin(game.active);return screen(o.x+(move.x+4.5)*CELL,o.y+(move.y+4.5)*CELL);}
await shot('desktop-before.png');
const stream=canvas.captureStream(30);
const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
if(!mime)throw Error('This browser cannot record WebM.');
const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000}),chunks=[];
const stopped=new Promise(resolve=>recorder.onstop=resolve);
recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
recorder.start(250);
const recordingStart=performance.now();
for(let i=0;i<8;i++){
 if(game.phase==='claim')claimAvailable();
 const d=game.current[game.turn],moves=legalMoves(game.players[game.active].board,d);
 const move=moves.find(m=>m.r===0)||moves[0];
 state.rotation=move.r;update();table.focus(game.active);
 await delay(350);
 if(i===0){
  const invalid=pointFor({x:0,y:0});
  table.dragAt(invalid.x,invalid.y,'mouse');await shot('desktop-drag-invalid.png');await delay(900);table.endDrag();
 }
 const end=pointFor(move),start={x:end.x-100,y:canvas.getBoundingClientRect().top+table.h-20};
 for(let frame=0;frame<=35;frame++){
  const t=frame/35,eased=1-(1-t)**3;
  table.dragAt(start.x+(end.x-start.x)*eased,start.y+(end.y-start.y)*eased,'mouse');await delay(33);
 }
 if(i===0)await shot('desktop-drag-valid.png');
 await delay(500);
 if(validate(game.players[game.active].board,d,move.x,move.y,move.r))throw Error('Replay selected invalid move');
 table.endDrag();place(game,move.x,move.y,move.r);update();
 await delay(350);
}
table.overview();await delay(1000);await shot('desktop-after.png');
const seconds=(performance.now()-recordingStart)/1000;
recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
await save('drag-and-drop-replay.webm',new Blob(chunks,{type:mime}));
for(const [w,h,name] of [[390,844,'phone-portrait.png'],[844,390,'phone-landscape.png']]){
 canvas.style.width=w+'px';canvas.style.height=h+'px';await delay(100);table.measure();table.focus(game.active);await shot(name);
}
await save('manifest.json',new Blob([JSON.stringify({capturedAt:new Date().toISOString(),kind:'staged engine replay',description:'Actual Canvas 2D renderer and engine. The capture page drives drag previews and legal placements directly, not mouse/touch input. No human playtest or full-UI verification is implied.',seed:179,recording:{mime,seconds,width:1280,height:720,requestedFPS:30,audio:false},assets},null,2)],{type:'application/json'}));
status.textContent='Capture complete. Screenshots, raw recording and manifest are stored in the local artifacts folder.';
