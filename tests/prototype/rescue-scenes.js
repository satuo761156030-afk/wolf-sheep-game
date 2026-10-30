(function(root){
 function scene(kind,real=false){
  const voids=new Set();for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(!x||!y||x===8||y===8)voids.add(x+','+y);
  const victim={id:0,real,x:3,y:3,snared:3,stress:0,mood:'snared'},other={id:1,real:!real,x:7,y:1,snared:0,stress:0};
  const guard={id:'guardA',p:{x:6,y:3},home:{x:6,y:3},state:'patrol',personality:'cautious',facing:3,snared:0,cool:0,escape:0,awakeRound:-2};
  const s={round:0,wolf:{x:1,y:7},wolfBeforeAction:{x:1,y:7},walls:new Set(),voids,fences:new Set(),gates:new Map(),mud:new Set(),grassPatches:new Set(),shadowPatches:new Set(),sheep:[victim,other],guard,otherGuard:null,swapWarning:null,swapPressure:0,guardEvents:[],rescueCount:0,rustleFx:null,trapFx:{x:3,y:3,ttl:6,triggered:true,snaredType:'sheep',snaredId:0}};
  if(kind==='unseen'){victim.x=4;s.trapFx.x=4;s.walls.add('5,3');}
  if(kind==='late'){guard.p.x=guard.home.x=7;victim.snared=1;}
  if(kind==='door'){
   const open=new Set(['3,3','4,3','5,3','6,3','7,3','5,4']);s.voids=new Set();for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(!open.has(x+','+y))s.voids.add(x+','+y);
   s.wolf={x:5,y:4};s.wolfBeforeAction={...s.wolf};other.x=7;other.y=3;s.gates.set('5,3',true);guard.state='rescue';guard.rescueMemory={id:0,p:{x:3,y:3},expires:3};
  }
  if(kind==='contact'){s.wolf={x:6,y:4};s.wolfBeforeAction={...s.wolf};guard.state='rescue';guard.rescueMemory={id:0,p:{x:3,y:3},expires:3};}
  if(kind==='dual'){s.otherGuard={...guard,id:'guardB',p:{x:6,y:2},home:{x:6,y:2},facing:3,personality:'bold'};}
  return s;
 }
 if(typeof module==='object')module.exports=scene;else root.rescueScene=scene;
})(typeof window==='object'?window:globalThis);
