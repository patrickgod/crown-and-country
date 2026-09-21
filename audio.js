export const SOUND_BANKS = {
 claim:['claim-1','claim-2'],place:['place-1','place-2'],
 rotate:['rotate-1','rotate-2'],invalid:['invalid-1','invalid-2'],finish:['finish-soft'],
 ...Object.fromEntries(['water','forest','wheat','grass','swamp','mine'].map(t=>[t,[1,2,3].map(i=>t+'-'+i)]))
};
export const AUDIO_FILES = {music:'assets/audio/meadow-light.mp3',
 ...Object.fromEntries(Object.values(SOUND_BANKS).flat().map(n=>[n,'assets/audio/'+n+'.mp3']))};
export function placementTerrain(domino){
 const [a,b]=domino?.halves||[];
 if(!a||!b)return null;
 if(a.type===b.type&&SOUND_BANKS[a.type])return a.type;
 // The standard deck has no double mines; mine-bearing tiles get the cavern accent.
 return a.type==='mine'||b.type==='mine'?'mine':null;
}
export function sanitizeSettings(value={}) {
 const volume=(n,fallback)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;
 return {muted:value?.muted===true,music:volume(value?.music,.23),effects:volume(value?.effects,.5)};
}
export class GameAudio {
 constructor({Context=globalThis.AudioContext||globalThis.webkitAudioContext,fetcher=globalThis.fetch,storage,doc=globalThis.document,random=Math.random}={}) {
  try{storage??=globalThis.localStorage;}catch{}
  this.random=random;this.lastVariant={};this.Context=Context;this.fetcher=fetcher;this.storage=storage;this.doc=doc;
  this.buffers={};this.voices=new Set();this.failures=[];this.status='Starts after your first tap.';this.started=false;
  try{this.settings=sanitizeSettings(JSON.parse(storage?.getItem('crown-country-audio')||'{}'));}catch{this.settings=sanitizeSettings();}
  doc?.addEventListener('visibilitychange',()=>this.visibility());
 }
 ensureContext(){
  if(this.ctx)return true;
  if(!this.Context){this.status='Audio is unavailable in this browser.';return false;}
  try{
   this.ctx=new this.Context();
   this.master=this.ctx.createGain();this.musicGain=this.ctx.createGain();this.effectsGain=this.ctx.createGain();
   this.musicGain.connect(this.master);this.effectsGain.connect(this.master);this.master.connect(this.ctx.destination);
   this.master.gain.value=this.settings.muted?0:1;this.musicGain.gain.value=0;this.effectsGain.gain.value=this.settings.effects;
   return true;
  }catch{this.status='Audio could not start in this browser.';return false;}
 }
 async unlock(){
  if(!this.ensureContext()||this.doc?.hidden)return;
  this.started=true;
  try{await this.ctx.resume();}catch{this.status='Tap again to enable audio.';return;}
  if(!this.loading)this.loading=this.load();
  await this.loading;this.startMusic();
 }
 async load(){
  this.status='Loading audio…';this.failures=[];
  await Promise.all(Object.entries(AUDIO_FILES).map(async([name,url])=>{
   if(this.buffers[name])return;
   try{const response=await this.fetcher.call(globalThis,url);if(!response.ok)throw Error('Audio download failed');
    this.buffers[name]=await this.ctx.decodeAudioData(await response.arrayBuffer());
   }catch{this.failures.push(name);}
  }));
  this.status=this.failures.length?'Some audio could not load. You can retry.':'Soft cards & little sounds of nature.';
 }
 startMusic(){
  if(this.musicSource||!this.buffers.music||this.doc?.hidden)return;
  const source=this.ctx.createBufferSource();source.buffer=this.buffers.music;source.loop=true;source.connect(this.musicGain);source.start();
  this.musicSource=source;this.apply();
 }
 apply(){
  if(!this.ctx)return;const t=this.ctx.currentTime;
  for(const [param,value] of [[this.master.gain,this.settings.muted?0:1],[this.musicGain.gain,this.settings.music],[this.effectsGain.gain,this.settings.effects]]){
   param.cancelScheduledValues(t);param.setTargetAtTime(value,t,.08);
  }
 }
 set(values){
  this.settings=sanitizeSettings({...this.settings,...values});this.apply();
  try{this.storage?.setItem('crown-country-audio',JSON.stringify(this.settings));}catch{}
 }
 choose(name){
  const bank=SOUND_BANKS[name];
  if(!bank)return null;
  const choices=bank.filter(n=>n!==this.lastVariant[name]);
  const pool=choices.length?choices:bank;
  const selected=pool[Math.min(pool.length-1,Math.floor(this.random()*pool.length))];
  this.lastVariant[name]=selected;return selected;
 }
 async placement(domino){
  const terrain=placementTerrain(domino);
  await Promise.all([this.play('place'),terrain?this.play(terrain):Promise.resolve()]);
 }
 async play(name){
  const requested=Date.now();await this.unlock();
  if(!this.ctx||this.ctx.state!=='running'||this.doc?.hidden||this.settings.muted||this.settings.effects===0||Date.now()-requested>700)return;
  const variant=this.choose(name);if(!variant||!this.buffers[variant])return;
  const ambient=['water','forest','wheat','grass','swamp','mine'].includes(name);
  if(ambient&&this.ambience){
   const old=this.ambience;
   old.voiceGain.gain.setTargetAtTime(0,this.ctx.currentTime,.04);
   old.stop(this.ctx.currentTime+.2);
  }
  if(this.voices.size>=6){const oldest=this.voices.values().next().value;oldest.stop();oldest.disconnect();oldest.voiceGain.disconnect();this.voices.delete(oldest);}
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
  source.buffer=this.buffers[variant];source.voiceGain=gain;source.variant=variant;
  gain.gain.value=ambient?.65:name==='rotate'||name==='invalid'?.65:1;
  source.connect(gain);gain.connect(this.effectsGain);this.voices.add(source);
  if(ambient)this.ambience=source;
  source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(source);if(this.ambience===source)this.ambience=null;};source.start();
 }
 async visibility(){
  if(!this.ctx||!this.started)return;
  try{if(this.doc?.hidden)await this.ctx.suspend();else await this.unlock();}catch{}
 }
 async retry(){if(this.loading)await this.loading;this.loading=null;await this.unlock();}
}
