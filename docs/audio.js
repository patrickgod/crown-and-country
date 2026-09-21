export const AUDIO_FILES = {
 music:'assets/audio/meadow-light.mp3',claim:'assets/audio/claim.mp3',
 place:'assets/audio/place.mp3',rotate:'assets/audio/rotate.mp3',
 invalid:'assets/audio/invalid.mp3',finish:'assets/audio/finish.mp3'
};
export function sanitizeSettings(value={}) {
 const volume=(n,fallback)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;
 return {muted:value?.muted===true,music:volume(value?.music,.23),effects:volume(value?.effects,.5)};
}
export class GameAudio {
 constructor({Context=globalThis.AudioContext||globalThis.webkitAudioContext,fetcher=globalThis.fetch,storage,doc=globalThis.document}={}) {
  try{storage??=globalThis.localStorage;}catch{}
  this.Context=Context;this.fetcher=fetcher;this.storage=storage;this.doc=doc;
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
  this.status=this.failures.length?'Some audio could not load. You can retry.':'Calm music & gentle tabletop sounds.';
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
 async play(name){
  const requested=Date.now();await this.unlock();
  if(!this.ctx||this.ctx.state!=='running'||this.doc?.hidden||this.settings.muted||this.settings.effects===0||Date.now()-requested>700||!this.buffers[name])return;
  if(this.voices.size>=6){const oldest=this.voices.values().next().value;oldest.stop();oldest.disconnect();this.voices.delete(oldest);}
  const source=this.ctx.createBufferSource();source.buffer=this.buffers[name];source.connect(this.effectsGain);this.voices.add(source);
  source.onended=()=>{source.disconnect();this.voices.delete(source);};source.start();
 }
 async visibility(){
  if(!this.ctx||!this.started)return;
  try{if(this.doc?.hidden)await this.ctx.suspend();else await this.unlock();}catch{}
 }
 async retry(){if(this.loading)await this.loading;this.loading=null;await this.unlock();}
}
