// Baselines are complete, previously captured browser saves. Variants change only
// the fields named below to exercise malformed/older/mode-specific records.
const capture=require('../../evidence/phase-b/final-save-compat.json');
const clone=x=>JSON.parse(JSON.stringify(x));
module.exports=function(name){
 const s=clone(name==='legacy'||name==='active-fallback'||name==='legacy-free'||name==='invalid-candidate'?capture.before:capture.afterWin);
 if(name==='candidate-only'){delete s.lastPlayedRun;delete s.activeV25;s.candidateLast={id:'d26',difficulty:'hard'};s.options.resumeOnOpen=false;}
 else if(name==='mixed-no-auto')s.options.resumeOnOpen=false;
 else if(name==='invalid-candidate')s.candidateLast={id:'removed-map',difficulty:'hard'};
 else if(name==='active-fallback'){s.activeV25=clone(s.lastPlayedRun);s.lastPlayedRun={stage:99,difficulty:'hard',challengeMode:'standard',ruleset:'v32.1-stable-patrol-1'};}
 else if(name==='legacy-free'){s.lastPlayedRun.challengeMode='free';s.lastPlayedRun.freeRunSeed=246813579;s.lastPlayedRun.difficulty='hard';}
 else if(!['mixed','legacy'].includes(name))throw Error('Unknown save fixture '+name);
 return s;
};
