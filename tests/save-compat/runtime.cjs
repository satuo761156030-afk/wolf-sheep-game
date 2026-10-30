// Executes the shipped inline application and its real menu handlers.
// DOM/render/audio are stubbed; parsing, persistence, startup and resume logic are not.
const fs=require('node:fs'),vm=require('node:vm');
const STORAGE='wolf_sheep_v26_memory';
module.exports=function runtime(store,html=fs.readFileSync(__dirname+'/../../index.html','utf8')){
 const els=new Map(),noop=()=>{};
 function el(id=''){if(els.has(id))return els.get(id);const o={id,hidden:true,textContent:'',value:'',style:{setProperty:noop,removeProperty:noop,getPropertyValue:()=>''},classList:{add:noop,remove:noop,toggle:()=>false,contains:()=>false},dataset:{},appendChild:noop,insertBefore:noop,insertAdjacentHTML:noop,setAttribute(k,v){this[k]=v},addEventListener:noop,remove:noop,querySelector:()=>el('generic'),querySelectorAll:()=>[],getBoundingClientRect:()=>({width:400,height:400,top:0,bottom:400,left:0,right:400}),getContext:()=>({}),clientWidth:400,clientHeight:800,scrollHeight:800};els.set(id,o);return o;}
 const document={getElementById:el,querySelector:()=>el('generic'),querySelectorAll:()=>[],createElement:()=>el('new'),addEventListener:noop,body:el('body'),documentElement:el('html')};
 const ctx={console,document,Map,Set,Math,Date,JSON,structuredClone,performance,Uint32Array,crypto:require('node:crypto').webcrypto,setTimeout:noop,clearTimeout:noop,requestAnimationFrame:()=>1,cancelAnimationFrame:noop,MutationObserver:class{observe(){}},getComputedStyle:()=>({paddingLeft:'0'}),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},navigator:{},innerWidth:1280,innerHeight:900,matchMedia:()=>({matches:false,addEventListener:noop}),addEventListener:noop,confirm:()=>true};ctx.window=ctx;
 let code=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
 const quiet=['draw','post','card','showNextCard','audioCue','startAmbience','stopAmbience','spotSchedule','lessonUI','tutText','showOutcomeFx'];
 code=code.replace('(()=>{','(()=>{\n'+quiet.map(f=>f+'=()=>{};').join('\n'));
 const at=code.lastIndexOf('})();');code=code.slice(0,at)+`window.__saveProbe=()=>({stage,difficulty,pickerDifficulty,challengeMode,pickerChallengeMode,freeRunSeed,mode:S.mode,name:levelName()});`+code.slice(at);
 vm.createContext(ctx);vm.runInContext(code,ctx);
 return {
  read:()=>structuredClone(ctx.__saveProbe()),
  saved:()=>JSON.parse(store.get(STORAGE)||'null'),
  progress(){el('openSettings').onclick();return el('localProgress').textContent},
  click(id){if(typeof el(id).onclick!=='function')throw Error('Missing real handler '+id);el(id).onclick()},
  choose(id,difficulty='easy',mode='standard'){
   el(difficulty==='hard'?'pickHard':'pickEasy').onclick();el(mode==='free'?'pickFree':'pickStandard').onclick();
   const b={dataset:typeof id==='string'?{hunt:id}:{pick:String(id)}};
   el('levelsPicker').onclick({target:{closest:s=>(typeof id==='string')===(s==='[data-hunt]')?b:null}});
  }
 };
};
module.exports.STORAGE=STORAGE;
