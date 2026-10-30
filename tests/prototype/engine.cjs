// Headless rules harness. No alternative sheep/guard rules: executes the shipped inline script.
const fs=require('fs'),vm=require('vm');
module.exports=function(file=__dirname+'/../../index.html'){
 const html=fs.readFileSync(file,'utf8');let code=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
 const els=new Map();const noop=()=>{};
 function el(id=''){if(els.has(id))return els.get(id);const o={id,hidden:true,style:{setProperty:noop,removeProperty:noop,getPropertyValue:()=>''},classList:{add:noop,remove:noop,toggle:()=>false,contains:()=>false},dataset:{},appendChild:noop,insertBefore:noop,setAttribute:noop,addEventListener:noop,remove:noop,querySelector:()=>el('generic'),querySelectorAll:()=>[],getBoundingClientRect:()=>({width:400,height:400,top:0,bottom:400,left:0,right:400}),getContext:()=>({}),clientWidth:400,clientHeight:800,scrollHeight:800};els.set(id,o);return o;}
 const document={getElementById:el,querySelector:()=>el('generic'),querySelectorAll:()=>[],createElement:()=>el('new'),addEventListener:noop,body:el('body'),documentElement:el('html')};
 const ctx={console,document,Map,Set,Math,Date,JSON,structuredClone,performance,Uint32Array,crypto:require('crypto').webcrypto,setTimeout:noop,clearTimeout:noop,requestAnimationFrame:()=>1,cancelAnimationFrame:noop,MutationObserver:class{observe(){}},getComputedStyle:()=>({paddingLeft:'0'}),localStorage:{getItem:()=>null,setItem:noop},navigator:{},innerWidth:1280,innerHeight:900,matchMedia:()=>({matches:false,addEventListener:noop}),addEventListener:noop,confirm:()=>true};ctx.window=ctx;
 const quiet=['draw','post','card','showNextCard','audioCue','startAmbience','stopAmbience','spotSchedule','lessonUI','tutText','showOutcomeFx'];
 code=code.replace('(()=>{','(()=>{\n'+quiet.map(f=>f+'=()=>{};').join('\n'));
 const at=code.lastIndexOf('})();');
 code=code.slice(0,at)+`\nwindow.engine={
 init(i,d,seed){difficulty=pickerDifficulty=d;challengeMode=pickerChallengeMode='standard';newLevel(i);if(seed!==undefined)gameRngState=seed|0;save.options.tutorials=false;$('overlay').hidden=$('settingsOverlay').hidden=$('chooseOverlay').hidden=true;start();return this.snapshot()},
 snapshot(){return structuredClone({S,rng:gameRngState,stage,difficulty,N})},
 restore(o){S=structuredClone(o.S);gameRngState=o.rng;stage=o.stage;difficulty=o.difficulty;N=o.N;$('overlay').hidden=$('settingsOverlay').hidden=$('chooseOverlay').hidden=true},
 legal(){let a=[];for(let d=0;d<5;d++){let p=xy(S.wolf.x+D[d][0],S.wolf.y+D[d][1]);if(inside(p))a.push({type:'move',d})}
 if(canUseAbility('sniff')&&S.sniff>0)a.push({type:'sniff'});if(canUseAbility('howl')&&S.howlCd===0)a.push({type:'howl'});
 if(canUseAbility('dash')&&S.dashCd===0)for(let x=0;x<N;x++)for(let y=0;y<N;y++){let p=xy(x,y);if(pouncePath(p))a.push({type:'pounce',p})}
 if(canUseAbility('trap')&&!S.trapFx)for(let d=0;d<4;d++){let p=xy(S.wolf.x+D[d][0],S.wolf.y+D[d][1]);if(trapCandidate(p))a.push({type:'trap',p})}
 if(canUseAbility('gate'))for(const k of S.gates.keys()){let [x,y]=k.split(',').map(Number),p=xy(x,y);if(dist(p,S.wolf)<=1)a.push({type:'gate',p})}
 if(stage===8&&!S.lessonEvidence.marker)a.push({type:'marker',p:{x:S.sheep[0].x,y:S.sheep[0].y}});return a;},
 act(a){if(a.type==='move')advance(a.d);else if(a.type==='pounce'){S.dashArmed=true;advance({type:'pounce',target:a.p})}else if(a.type==='trap'){S.trapArmed=true;advance({type:'trap',target:a.p})}else if(a.type==='gate')toggleGate(a.p);else if(a.type==='marker')markTile(a.p);else advance(a.type);return this.snapshot()},
 score(){const real=S.sheep.find(s=>s.real),guards=allGuards();return {distance:pathDist(S.wolf,real),protected:!!protectingGuard(real),snared:real.snared||0,guardDistance:Math.min(99,...guards.filter(g=>g.snared<=0).map(g=>pathDist(g.p,S.wolf))),trappedGuards:guards.filter(g=>g.snared>0).length}},
 disableRescue(){rescueTurn=()=>false},patch(o){Object.assign(S,structuredClone(o))},decide(o){moveSheep(o)},guardsTurn(){guardTurns()},save:()=>save,lessons:()=>({queue:cardQueue,visible:visibleMechanic}),mechanicCard,levels:stages
};\n`+code.slice(at);
 vm.createContext(ctx);vm.runInContext(code,ctx);return ctx.engine;
};
if(require.main===module){const e=module.exports();for(const d of ['easy','hard']){e.init(2,d);console.log(d,e.snapshot().S.wolf,e.legal().length)}}
