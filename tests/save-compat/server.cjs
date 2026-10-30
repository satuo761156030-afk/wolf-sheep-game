// Local, serial browser fixtures. Never used in the downloadable game.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),fixture=require('./cases.cjs');
const before=execFileSync('git',['show','eb95545:index.html'],{cwd:root,maxBuffer:8*1024*1024}).toString('utf8');
http.createServer((req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),id=url.pathname.split('/')[2]||'mixed',build=url.searchParams.get('build')==='before'?'before':'after';
 if(url.pathname==='/play'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(root+'/downloads/wolf-sheep-phase-b-save-fix.html'));return;}
 let html=build==='before'?before:fs.readFileSync(root+'/index.html','utf8');const sourceHash=require('node:crypto').createHash('sha256').update(html).digest('hex');
 const key=id+':'+build+':'+(url.searchParams.get('run')||'1'),save=fixture(id);
 const bootstrap='<script>if(localStorage.getItem("__saveFixtureCase")!=='+JSON.stringify(key)+'){localStorage.setItem("wolf_sheep_v26_memory",'+JSON.stringify(JSON.stringify(save))+');localStorage.setItem("__saveFixtureCase",'+JSON.stringify(key)+');}</script>';
 html=html.replace('<script>',bootstrap+'<script>');
 html=html.replace('</body>','<aside id="saveFixturePanel" data-source-hash="'+sourceHash+'" style="position:fixed;left:4px;top:4px;z-index:400;background:white;color:#123;padding:6px;max-width:245px;max-height:180px;overflow:auto"><b>隔离存档测试：'+id+' / '+build+'</b><br><button id="readSaveReceipt">读取真实存档</button><pre id="saveReceipt" style="white-space:pre-wrap"></pre></aside><script>document.getElementById("readSaveReceipt").onclick=()=>document.getElementById("saveReceipt").textContent=localStorage.getItem("wolf_sheep_v26_memory");</script></body>');
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
 }catch(e){res.writeHead(400);res.end(String(e));}}).listen(8780,'127.0.0.1',()=>console.log('Isolated save compatibility browser fixtures at http://127.0.0.1:8780/case/mixed'));
