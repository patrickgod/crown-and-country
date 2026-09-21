"""Master generated soft effects while retaining all original audio."""
from pathlib import Path
import json,subprocess,shutil
ROOT=Path(__file__).resolve().parent.parent
raw=ROOT/'artifacts/audio/2026-09-21-soft-terrain'
target=ROOT/'assets/audio'
old=raw/'previous-published-effects'
old.mkdir(parents=True,exist_ok=True)
for name in ['claim','place','rotate','invalid','finish']:
 for directory in [target,ROOT/'docs/assets/audio']:
  file=(directory/(name+'.mp3')).resolve()
  assert file.is_relative_to(ROOT.resolve())
  if file.exists():
   if directory==target:shutil.copy2(file,old/file.name)
   file.unlink()
records=[]
for file in sorted(raw.glob('*-raw.mp3')):
 name=file.name.removesuffix('-raw.mp3')
 ambient=name.split('-')[0] in ['water','forest','wheat','grass','swamp','mine']
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(file)]))
 fade=.35 if ambient else .06
 filters=f'highpass=f=140,lowpass=f=5500,loudnorm=I=-29:TP=-9:LRA=5,volume={-6 if ambient else -3}dB,afade=t=in:d={.25 if ambient else .025},afade=t=out:st={max(0,duration-fade-.04)}:d={fade}'
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(file),'-af',filters,'-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','96k',str(target/(name+'.mp3'))],check=True)
 record=json.loads((raw/(name+'-provenance.json')).read_text())
 record['mastering']=filters
 records.append(record)
 print('Mastered '+name,flush=True)
(target/'SOFT-SFX-PROVENANCE.json').write_text(json.dumps({'date':'2026-09-21','purpose':'Soft card foley and varied quiet terrain accents','assets':records},indent=2))


