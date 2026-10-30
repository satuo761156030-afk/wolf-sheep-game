const fs=require('fs'),make=require('./engine.cjs');const e=make();
const needs=[['wait','move'],['wait','move'],['sniff'],['pounce'],['howlGuard'],['trap'],['trap','waitAfterTrap'],['gate'],['marker'],['grass'],['howlFlock'],['wait']];
const width=Number(process.env.BEAM||80),maxDepth=60;const out=process.env.OUT||__dirname+'/solutions.json';const results=fs.existsSync(out)?JSON.parse(fs.readFileSync(out)):[];
let serial=1;const jitter=()=>{serial=(Math.imul(serial,1664525)+1013904223)>>>0;return serial/4294967296};
const chosen=process.argv[2]?process.argv[2].split(',').map(x=>/^\d+$/.test(x)?+x:x):Array.from({length:20},(_,i)=>i);
for(const difficulty of ['easy','hard'])for(const stage of chosen){
 if(results.some(r=>r.stage===stage&&r.difficulty===difficulty&&r.pass))continue;
 const need=process.env.NEED?[process.env.NEED]:stage==='t1'?['move','wait']:stage==='t2'?['sniff']:needs[stage]||[];e.init(stage,difficulty,process.env.SEED===undefined?undefined:+process.env.SEED);let prefix=[];
 if([0,1,11].includes(stage))prefix=[{type:'move',d:4}];if(stage==='t1')prefix=[{type:'move',d:0},{type:'move',d:4}];
 if(stage===2||stage==='t2')prefix=[{type:'sniff'}];if(stage===9)prefix=[{type:'move',d:0}];
 for(const a of prefix)e.act(a);
 let beam=[{state:e.snapshot(),path:prefix,score:0}],solution=null,nodes=0;const start=Date.now();let seen=new Set();
 for(let depth=0;depth<maxDepth&&!solution&&beam.length;depth++){
  const next=[];
  for(const node of beam){e.restore(node.state);const actions=e.legal().filter(a=>!(process.env.NO_POUNCE&&a.type==='pounce'));
   for(const action of actions){e.restore(node.state);const state=e.act(action);const trapHit=node.trapHit||(state.S.trapFx?.triggered&&state.S.trapFx.snaredType==='sheep'&&state.S.sheep.find(s=>s.id===state.S.trapFx.snaredId)?.real);nodes++;if(state.S.mode==='lost')continue;
    const missing=(process.env.REQUIRE_TRAP_HIT&&!trapHit?1:0)+need.filter(k=>!state.S.lessonEvidence[k]).length+(stage===8&&!state.S.swapHistory?1:0);
    if(state.S.mode==='won'){if(!missing){solution={state,path:[...node.path,action]};break;}continue}
    const key=JSON.stringify([state.rng,state.S.wolf,state.S.sheep,state.S.guard,state.S.otherGuard,state.S.trapFx,state.S.dashCd,state.S.howlCd,[...state.S.gates],state.S.lessonEvidence,state.S.swapWarning]);
    if(seen.has(key))continue;seen.add(key);
    const m=e.score();let score=m.distance*2.5+missing*4+(m.protected?3:0)-(m.snared?3:0)-m.trappedGuards*2;
    if(m.guardDistance<=2)score+=2;if(action.type==='sniff'&&!missing)score+=1;
    // Keep tactical diversity across deterministic paths, never change the game RNG.
    score+=jitter()*3.5;
    next.push({state,trapHit,path:[...node.path,action],score});
   }if(solution)break;
  }
  next.sort((a,b)=>a.score-b.score);beam=next.slice(0,width);if(seen.size>30000)seen=new Set();
 }
 const record={seed:process.env.SEED===undefined?undefined:+process.env.SEED,stage,difficulty,pass:!!solution,nodes,ms:Date.now()-start,round:solution?.state.S.round,actions:solution?.path,evidence:solution?.state.S.lessonEvidence};
 const index=results.findIndex(r=>r.stage===stage&&r.difficulty===difficulty);if(index>=0)results[index]=record;else results.push(record);
 fs.writeFileSync(out,JSON.stringify(results,null,2));console.log(JSON.stringify({...record,actions:undefined,evidence:undefined}));
}
