const fs=require('fs'),make=require('./engine.cjs');const e=make();
const needs=[['wait','move'],['wait','move'],['sniff'],['pounce'],['howlGuard'],['trap'],['trap','waitAfterTrap'],['gate'],['marker'],['grass'],['howlFlock'],['wait']];
const width=Number(process.env.BEAM||80),maxDepth=60;const out=process.env.OUT||__dirname+'/solutions.json';const results=fs.existsSync(out)?JSON.parse(fs.readFileSync(out)):[];
let serial=1;const jitter=()=>{serial=(Math.imul(serial,1664525)+1013904223)>>>0;return serial/4294967296};
const chosen=process.argv[2]?process.argv[2].split(',').map(x=>/^\d+$/.test(x)?+x:x):Array.from({length:20},(_,i)=>i);
for(const difficulty of (process.env.DIFFICULTY?[process.env.DIFFICULTY]:['easy','hard']))for(const stage of chosen){
 if(results.some(r=>r.stage===stage&&r.difficulty===difficulty&&r.pass))continue;
 const need=process.env.NEED?[process.env.NEED]:stage==='t1'?['move','wait']:stage==='t2'?['sniff']:needs[stage]||[];e.init(stage,difficulty,process.env.SEED===undefined?undefined:+process.env.SEED);let prefix=[];
 if([0,1,11].includes(stage))prefix=[{type:'move',d:4}];if(stage==='t1')prefix=[{type:'move',d:0},{type:'move',d:4}];
 if(stage===2||stage==='t2')prefix=[{type:'sniff'}];if(stage===9)prefix=[{type:'move',d:0}];
 for(const a of prefix)e.act(a);
 let beam=[{state:e.snapshot(),path:prefix,score:0}],solution=null,nodes=0;const start=Date.now();let seen=new Set();
 for(let depth=0;depth<maxDepth&&!solution&&beam.length;depth++){
  const next=[];
  for(const node of beam){e.restore(node.state);const actions=e.legal().filter(a=>!(process.env.NO_POUNCE&&a.type==='pounce')&&!(process.env.NO_TRAP&&a.type==='trap')&&!(process.env.NO_GATE&&a.type==='gate')&&!(process.env.GOAL==='lock'&&a.type==='gate'&&a.p.y===2)&&!(process.env.GOAL==='lock'&&a.type==='gate'&&a.p.x===6&&e.snapshot().S.gates.get('4,4')===true)&&!(process.env.GOAL==='lock'&&a.type==='gate'&&a.p.y===4&&e.snapshot().S.gates.get(a.p.x+','+a.p.y)&&e.snapshot().S.wolf.y>=4));
   for(const action of actions){e.restore(node.state);const state=e.act(action);const trapHit=node.trapHit||(state.S.trapFx?.triggered&&state.S.trapFx.snaredType==='sheep'&&state.S.sheep.find(s=>s.id===state.S.trapFx.snaredId)?.real);nodes++;if(state.S.mode==='lost'||state.S.round===node.state.S.round&&action.type!=='marker')continue;
    const baited=node.baited||(state.S.trapFx?.triggered&&state.S.trapFx.snaredType==='sheep'&&!state.S.sheep.find(s=>s.id===state.S.trapFx.snaredId)?.real),rescued=node.rescued||state.S.guardEvents?.some((e,i,all)=>{if(!e.text.includes('羊已脱困'))return false;const start=all.slice(0,i).reverse().find(x=>x.guard===e.guard&&x.state==='rescue');return start&&(start.p.x!==e.p.x||start.p.y!==e.p.y)});
    const gs=[state.S.guard,state.S.otherGuard].filter(Boolean),gates=state.S.gates;const locked=gs.length===2&&gs.every(g=>g.p.y>=5)&&gates.get('4,4')===false&&gates.get('6,4')===false;
    const crossed=node.crossed||(locked&&state.S.wolf.x===5&&state.S.wolf.y===2);
    const missing=(process.env.GOAL==='rescue'&&!(baited&&rescued)?2:0)+(process.env.GOAL==='lock'&&!(locked&&crossed)?2:0)+(process.env.REQUIRE_TRAP_HIT&&!trapHit?1:0)+need.filter(k=>!state.S.lessonEvidence[k]).length+(stage===8&&!state.S.swapHistory?1:0);
    if(state.S.mode==='won'){if(!missing){solution={state,path:[...node.path,action]};break;}continue}
    const key=JSON.stringify([state.rng,state.S.wolf,state.S.sheep,state.S.guard,state.S.otherGuard,state.S.trapFx,state.S.dashCd,state.S.howlCd,[...state.S.gates],state.S.lessonEvidence,state.S.swapWarning]);
    if(seen.has(key))continue;seen.add(key);
    const m=e.score();let score=m.distance*2.5+missing*4+(m.protected?3:0)-(m.snared?3:0)-m.trappedGuards*2;
    if(m.guardDistance<=2)score+=2;if(action.type==='sniff'&&!missing)score+=1;
    // Keep tactical diversity across deterministic paths, never change the game RNG.
    if(process.env.GOAL==='rescue'){
     const fake=state.S.sheep.find(s=>!s.real),w=state.S.wolf;
     if(!baited)score=(Math.abs(w.x-fake.x)+Math.abs(w.y-fake.y))*1.5+(state.S.trapFx&&!state.S.trapFx.triggered?Math.abs(state.S.trapFx.x-fake.x)+Math.abs(state.S.trapFx.y-fake.y):3)*.6+(m.guardDistance<=1?8:0);
     else score=-30+m.distance*2+(rescued?-20:5)+(m.protected?3:0);
    }
    if(process.env.GOAL==='lock'){
     if(locked)score=-60+m.distance*2+(crossed?-20:Math.abs(state.S.wolf.x-5)+Math.abs(state.S.wolf.y-2));
     else {score=gs.reduce((n,g)=>n+Math.max(0,5-g.p.y)*1.5,0);for(const [key,gx] of [['4,4',4],['6,4',6]]){const inside=gs.some(g=>g.p.y>=5&&(gx===4?g.p.x<=4:g.p.x>=6));if(inside&&gates.get(key)===false)score-=9;else if(inside)score-=2;}score+=m.guardDistance<=1?9:0;score+=Math.min(...[4,6].map(x=>Math.abs(state.S.wolf.x-x)+Math.abs(state.S.wolf.y-4)))*.3;if(gs.every(g=>g.p.y>=5)){const walk=(a,b)=>{const grid=state.S,seen=new Set([a.x+','+a.y]),q=[[a,0]];for(let i=0;i<q.length;i++){const [p,d]=q[i];if(p.x===b.x&&p.y===b.y)return d;for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const n={x:p.x+dx,y:p.y+dy},k=n.x+','+n.y;if(n.x<0||n.y<0||n.x>=state.N||n.y>=state.N||seen.has(k)||grid.voids.has(k)||grid.walls.has(k)||grid.gates.get(k)===false)continue;seen.add(k);q.push([n,d+1])}}return 99;};const left=Math.min(...gs.map(g=>walk(g.p,{x:4,y:4}))),right=Math.min(...gs.map(g=>walk(g.p,{x:6,y:4})));if(gates.get('4,4')===false)score=-18+Math.abs(state.S.wolf.x-6)+Math.abs(state.S.wolf.y-3)+Math.max(0,7-right)*3;else if(gates.get('6,4')===false)score=-18+Math.abs(state.S.wolf.x-4)+Math.abs(state.S.wolf.y-3)+Math.max(0,7-left)*3;else score-=Math.min(12,Math.max(left,right))*.5;}}
    }
    if(process.env.GOAL==='lock'&&!locked){const w=state.S.wolf,a=gs[0],b=gs[1];if(gates.get('4,4')!==false){score=Math.max(0,5-a.p.y)*2+(Math.abs(w.x-4)+Math.abs(w.y-(a.p.y>=5?3:7)))*.5;}else{score=-18+Math.max(0,5-b.p.y)*2+(Math.abs(w.x-6)+Math.abs(w.y-(b.p.y>=5?3:7)))*.5;if(a.p.y<5)score+=12;}}
    score+=jitter()*3.5;
    next.push({state,trapHit,baited,rescued,crossed,path:[...node.path,action],score});
   }if(solution)break;
  }
  next.sort((a,b)=>a.score-b.score);beam=next.slice(0,width);if(process.env.TRACE&&depth%5===0){fs.writeFileSync(out+'.best.json',JSON.stringify({path:beam[0]?.path,guards:beam[0]?.state.S.guard,other:beam[0]?.state.S.otherGuard,gates:beam[0]?[...beam[0].state.S.gates]:[],wolf:beam[0]?.state.S.wolf},null,2));}if(process.env.TRACE&&depth%5===0)console.log('depth',depth,'baited',next.filter(x=>x.baited).length,'rescued',next.filter(x=>x.rescued).length,'best',beam[0]?.score);if(seen.size>30000)seen=new Set();
 }
 const record={seed:process.env.SEED===undefined?undefined:+process.env.SEED,stage,difficulty,pass:!!solution,nodes,ms:Date.now()-start,round:solution?.state.S.round,actions:solution?.path,evidence:solution?.state.S.lessonEvidence};
 const index=results.findIndex(r=>r.stage===stage&&r.difficulty===difficulty);if(index>=0)results[index]=record;else results.push(record);
 fs.writeFileSync(out,JSON.stringify(results,null,2));console.log(JSON.stringify({...record,actions:undefined,evidence:undefined}));
}
