import test from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio,sanitizeSettings,AUDIO_FILES,placementTerrain} from './audio.js';
class Parameter{value=0;cancelScheduledValues(){}setTargetAtTime(v){this.value=v;}}
class Context{
 state='suspended';currentTime=0;destination={};sources=[];
 createGain(){return {gain:new Parameter(),connect(){},disconnect(){}};}
 createBufferSource(){const s={connect(){},disconnect(){},start(){s.started=true;},stop(){s.stopped=true;},loop:false};this.sources.push(s);return s;}
 async resume(){this.state='running';}async suspend(){this.state='suspended';}async decodeAudioData(){return {duration:1};}
}
const setup=(options={})=>{const storage={data:null,getItem(){return this.data;},setItem(k,v){this.data=v;}},doc={hidden:false,addEventListener(){}};let downloads=0;const audio=new GameAudio({Context,storage,doc,fetcher:async()=>{downloads++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};},...options});return {audio,doc,storage,downloads:()=>downloads};};
test('audio is lazy and settings are bounded even for malformed saves',()=>{const {audio,downloads}=setup();assert.equal(audio.ctx,undefined);assert.equal(downloads(),0);assert.deepEqual(sanitizeSettings({music:7,effects:-4,muted:'yes'}),{music:1,effects:0,muted:false});assert.deepEqual(sanitizeSettings(null),{muted:false,music:.23,effects:.5});});
test('concurrent first gestures load once and start exactly one loop',async()=>{const {audio,downloads}=setup();await Promise.all([audio.unlock(),audio.unlock(),audio.unlock()]);assert.equal(downloads(),Object.keys(AUDIO_FILES).length);assert.equal(audio.ctx.sources.filter(s=>s.loop).length,1);assert.equal(audio.musicSource.started,true);});
test('mute, separate levels and saved preferences apply to the mixer',async()=>{const {audio,storage}=setup();await audio.unlock();audio.set({muted:true,music:.1,effects:.8});assert.equal(audio.master.gain.value,0);assert.equal(audio.musicGain.gain.value,.1);assert.equal(audio.effectsGain.gain.value,.8);await audio.play('place');assert.equal(audio.voices.size,0);assert.equal(JSON.parse(storage.data).muted,true);audio.set({muted:false});await audio.play('place');assert.equal(audio.voices.size,1);});
test('hiding suspends playback and returning resumes without another music layer',async()=>{const {audio,doc}=setup();await audio.unlock();doc.hidden=true;await audio.visibility();assert.equal(audio.ctx.state,'suspended');await audio.play('claim');assert.equal(audio.voices.size,0);doc.hidden=false;await audio.visibility();assert.equal(audio.ctx.state,'running');assert.equal(audio.ctx.sources.filter(s=>s.loop).length,1);});
test('failed downloads can be retried and do not break gameplay calls',async()=>{let fail=true;const {audio}=setup({fetcher:async()=>({ok:!fail,arrayBuffer:async()=>new ArrayBuffer(1)})});await audio.play('place');assert.equal(audio.failures.length,Object.keys(AUDIO_FILES).length);assert.equal(audio.musicSource,undefined);fail=false;await audio.retry();assert.equal(audio.failures.length,0);assert.ok(audio.musicSource);});
test('rapid repeated actions cap effect voices',async()=>{const {audio}=setup();await audio.unlock();for(let i=0;i<20;i++)await audio.play('rotate');assert.equal(audio.voices.size,6);});
test('unsupported context and blocked storage fail quietly',async()=>{const {audio}=setup({Context:null,storage:{getItem(){throw Error('Blocked');}}});await audio.play('place');assert.match(audio.status,/unavailable/);assert.equal(audio.ctx,undefined);});

test('browser fetch receives the global receiver',async()=>{const {audio}=setup({fetcher:async function(){assert.equal(this,globalThis);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};}});await audio.unlock();assert.equal(audio.failures.length,0);});

test('variants do not immediately repeat even with a fixed random draw',async()=>{
 const {audio}=setup({random:()=>0});await audio.unlock();
 await audio.play('water');const first=audio.ambience;
 await audio.play('water');assert.notEqual(audio.ambience.variant,first.variant);assert.equal(first.stopped,true);
});
test('double terrains and mine-bearing tiles choose nature; mixed lands stay quiet',()=>{
 const tile=(a,b)=>({halves:[{type:a},{type:b}]});
 for(const t of ['water','forest','wheat','grass','swamp','mine'])assert.equal(placementTerrain(tile(t,t)),t);
 assert.equal(placementTerrain(tile('forest','water')),null);
 assert.equal(placementTerrain(tile('wheat','mine')),'mine');
 assert.equal(placementTerrain(null),null);
});
test('placement layers soft foley with only its matching nature accent',async()=>{
 const {audio}=setup();await audio.unlock();await audio.placement({halves:[{type:'water'},{type:'water'}]});
 const names=[...audio.voices].map(s=>s.variant);
 assert.equal(names.length,2);assert.ok(names.some(n=>n.startsWith('place-')));assert.ok(names.some(n=>n.startsWith('water-')));
 audio.set({muted:true});await audio.placement({halves:[{type:'forest'},{type:'forest'}]});assert.equal(audio.voices.size,2);
});
