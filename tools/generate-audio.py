"""Generate original game audio; never print or copy the API credential."""
from pathlib import Path
import os,json,urllib.request,urllib.error,concurrent.futures
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'artifacts'/'audio'/'2026-09-21-calm-tabletop'
OUT.mkdir(parents=True,exist_ok=True)
token=next((os.environ[n] for n in ('ELEVENLABS_API_KEY','ELEVEN_API_KEY','XI_API_KEY') if os.environ.get(n)),None)
if not token:
 keyfile=Path(os.environ.get('FN_AUDIO_KEY_FILE',r'C:\Development\FallenNights2D\.env'))
 for line in keyfile.read_text(encoding='utf-8-sig').splitlines():
  if line.strip().startswith('#'):continue
  value=line.split('=',1)[-1].strip().strip('"\'')
  if value.startswith('sk_'):token=value;break
if not token:raise SystemExit('ElevenLabs credential unavailable; no credentials printed.')
music="Original gentle instrumental background music for a peaceful kingdom-building tabletop game. 75 seconds, calm pastoral chamber ambient, soft fingerpicked nylon guitar and sparse warm harp, muted felt piano, very soft sustained strings and airy wooden flute phrases. Slow relaxed 68 BPM, warm major and suspended harmonies, delicate unhurried melody, natural intimate room sound. Consistent quiet energy throughout, plenty of breathing space for thinking. A continuous seamless-feeling bed with stable instrumentation and harmony at beginning and end, no dramatic intro or final cadence. No vocals, no choir, no drums, no ticking, no heavy bass, no sharp bells, no big swells, no famous melodies."
jobs={
 'meadow-light':('/v1/music',{'prompt':music,'music_length_ms':75000,'force_instrumental':True,'model_id':'music_v2'}),
 'claim':('/v1/sound-generation',{'text':'One very soft wooden game token being picked up from a felt tabletop. A tiny dry warm wood tick and short felt brush. Intimate, gentle, rounded, no harsh high frequencies, no music, no voices, no background. Single short event.','duration_seconds':.5}),
 'place':('/v1/sound-generation',{'text':'One small wooden domino gently set down on a soft felt game table. A satisfying muted warm woody tok with a tiny low resonance. Quiet tactile board game piece, no slam, no ringing, no music or background, single short event.','duration_seconds':.6}),
 'rotate':('/v1/sound-generation',{'text':'One tiny soft dry wooden tile turn, light short felt swish ending in a delicate rounded wooden click. Very subtle board game interface sound, no sharp frequencies, no music, no background.','duration_seconds':.5}),
 'invalid':('/v1/sound-generation',{'text':'A small wooden game tile softly sliding back onto felt with a muted low tap. A gentle non alarming return sound. No buzzer, no harsh beep, no music, no voices. Single short event.','duration_seconds':.6}),
 'finish':('/v1/sound-generation',{'text':'A quiet warm three-note acoustic harp and soft felt piano flourish resolving to a gentle major chord. A peaceful small kingdom completed, understated satisfaction. Soft rounded attack and natural decay to silence. No fanfare, no brass, no drums, no bright bells, no vocals.','duration_seconds':3.0})
}
def generate(item):
 name,(endpoint,payload)=item
 if endpoint.endswith('sound-generation'):payload.update({'model_id':'eleven_text_to_sound_v2','prompt_influence':.65,'loop':False})
 dest=OUT/(name+'-raw.mp3')
 (OUT/(name+'-request.json')).write_text(json.dumps(payload,indent=2),encoding='utf-8')
 if dest.exists():return {'name':name,'cached':True,'bytes':dest.stat().st_size}
 req=urllib.request.Request('https://api.elevenlabs.io'+endpoint,data=json.dumps(payload).encode(),headers={'xi-api-key':token,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=480) as response:
   audio=response.read(); song_id=response.headers.get('song-id')
  dest.write_bytes(audio)
  record={'name':name,'provider':'ElevenLabs','model':payload['model_id'],'bytes':len(audio),'songId':song_id,'request':payload}
  (OUT/(name+'-provenance.json')).write_text(json.dumps(record,indent=2),encoding='utf-8')
  return {'name':name,'bytes':len(audio)}
 except urllib.error.HTTPError as e:
  # Do not log request headers or response bodies that could reflect authentication.
  return {'name':name,'error':'HTTP '+str(e.code)}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 for result in pool.map(generate,jobs.items()):print(json.dumps(result),flush=True)
