const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const handler=(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const file=u.pathname.startsWith('/baseline')?root+'/archive/v32.1-original.html':u.pathname==='/phase-a'?root+'/downloads/wolf-sheep-phase-a.html':root+'/index.html';
 let content=fs.readFileSync(file,'utf8');
 if(u.pathname==='/save-lab'){
  const old={seen:{basic:true,trap:true},best:{0:17},v321Standard:{easy:{0:9},hard:{0:12}},v321Free:{easy:{0:{plays:3,wins:1,fastest:18}},hard:{}},options:{tutorials:true,resumeOnOpen:true,ambient:false},lastPlayedRun:{stage:12,difficulty:'easy',challengeMode:'standard',ruleset:'v32.1-stable-patrol-1'}};
  content=content.replace('<script>','<script>if(!localStorage.getItem("seededA")){localStorage.setItem("wolf_sheep_v26_memory",'+JSON.stringify(JSON.stringify(old))+');localStorage.setItem("seededA","yes")}</script><script>');
  content=content.replace('</body>','<button id="readSave" style="position:fixed;left:4px;top:4px;z-index:400">读取教学状态</button><pre id="saveReceipt" style="white-space:pre-wrap"></pre><script>document.getElementById("readSave").onclick=()=>document.getElementById("saveReceipt").textContent=localStorage.getItem("wolf_sheep_v26_memory");</script></body>');
 }
 if(u.pathname==='/rescue-lab'){
  content=content.replace('<script>','<script>window.__WOLF_DEBUG_DEV__=true;</script><script>');
  content=content.replace('</body>','<script>'+fs.readFileSync(__dirname+'/rescue-scenes.js','utf8')+';'+fs.readFileSync(__dirname+'/rescue-lab.js','utf8')+';'+fs.readFileSync(__dirname+'/flock-lab.js','utf8')+'</script></body>');
 }
 if(u.pathname.endsWith('motion')){
  content=content.replace('<script>','<script>window.__WOLF_DEBUG_DEV__=true;</script><script>');
  content=content.replace('</body>','<script>'+fs.readFileSync(__dirname+'/motion-probe.js','utf8')+'</script></body>');
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(content);
};
for(const port of [8770,8771,8772])http.createServer(handler).listen(port,'127.0.0.1',()=>console.log('candidate / baseline :'+port));
