import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const dir=fileURLToPath(new URL('./',import.meta.url)),proof=fileURLToPath(new URL('../../evidence/phase-b/',import.meta.url));
export async function driver(tab,print){
 const sourceHash=createHash('sha256').update(await fs.readFile(dir+'../../index.html')).digest('hex');
 const routes=JSON.parse(await fs.readFile(dir+'d23-alternate.json','utf8'));
 const results=JSON.parse(await fs.readFile(proof+'ui-results.json','utf8').catch(()=> '[]'));
 const log=JSON.parse(await fs.readFile(proof+'ui-actions.json','utf8').catch(()=> '[]'));
 async function observe(label){await tab.getAXState({emit:false});let dom=await tab.playwright.domSnapshot();const visible=await tab.playwright.locator('#board .hasGuard,#board .hasSheep,#board .hasWolf').evaluateAll(els=>els.map(e=>({x:+e.dataset.x,y:+e.dataset.y,kind:e.classList.contains('hasGuard')?'guard':e.classList.contains('hasWolf')?'wolf':'sheep',snared:!!e.querySelector('.snareBadge'),shield:!!e.querySelector('.shield'),intent:e.querySelector('.guardIntent')?.textContent})));log.push({label,dom,visible});return dom;}
 async function shot(name){await observe('screenshot '+name);await fs.writeFile(proof+'alternate-'+name+'.jpg',await tab.screenshot({fullPage:false}));}
 async function ack(){for(let j=0;j<5;j++){if(!(await tab.playwright.locator('#lessonSpotNext').isVisible()))break;const title=await tab.playwright.locator('#lessonSpotTitle').textContent();log.push({lesson:title});await shot('lesson-'+title.replaceAll(/[^\p{L}\p{N}]/gu,'').slice(0,30));await tab.playwright.locator('#lessonSpotNext').click();await observe('acknowledge lesson');}}
 async function action(a){await ack();if(a.type==='move'){
  if(a.d===4)await tab.playwright.locator('#wait').click();
  else if(await tab.playwright.evaluate(()=>innerWidth<=760)){const q=await tab.playwright.locator('#board .hasWolf').evaluate(el=>({x:+el.dataset.x,y:+el.dataset.y})),d=[[0,-1],[1,0],[0,1],[-1,0]][a.d];await tab.playwright.locator('#board .hasWolf').click();await observe('select wolf');await tab.playwright.locator('#board .touchMoveTarget[data-x="'+(q.x+d[0])+'"][data-y="'+(q.y+d[1])+'"]').click();}
  else await tab.pressKey(null,['Up','Right','Down','Left'][a.d]);
 }else if(['sniff','howl'].includes(a.type))await tab.playwright.locator('#'+a.type).click();
 else {const id={pounce:'dash',trap:'trap',gate:'gateBtn',marker:'marker'}[a.type];if(!(await tab.playwright.locator('#'+id).isVisible())){await tab.playwright.locator('#tacticsToggle').click();await observe('open tactics');}await tab.playwright.locator('#'+id).click();await observe('arm '+a.type);await tab.playwright.locator('#board>.tile[data-x="'+a.p.x+'"][data-y="'+a.p.y+'"]').click();await observe('target '+a.type);if(a.type==='marker'){const mobile=await tab.playwright.evaluate(()=>innerWidth<=760);await tab.playwright.locator(mobile?'#tacticsToggle':'#cancel').click();}}
 await observe('after '+JSON.stringify(a));if(await tab.playwright.locator('#guardIntentBar').isVisible()){const text=await tab.playwright.locator('#guardIntentBar').textContent();if(/救援|脱困|回防|保护/.test(text))await shot('guard-'+await tab.playwright.locator('#turn').textContent());}
 }
 async function open(stage,difficulty){
 for(let j=0;j<16&&await tab.playwright.locator('#overlay').isVisible();j++){await tab.playwright.locator('#cardButtons button').last().click();await observe('acknowledge outcome or pending mechanism card');}
 await tab.playwright.locator('#openSettings').click();await observe('settings');await tab.playwright.locator('#openLevels').click();await observe('picker');await tab.playwright.locator(difficulty==='hard'?'#pickHard':'#pickEasy').click();await observe('difficulty');await tab.playwright.locator(typeof stage==='string'?'[data-hunt="'+stage+'"]':'[data-pick="'+stage+'"]').click();await observe('load chapter');
 for(let j=0;j<16&&(await tab.playwright.locator('#overlay').isVisible());j++){log.push({intro:await tab.playwright.locator('#cardTitle').textContent()});await tab.playwright.locator('#cardButtons button').first().click();await observe('dismiss mechanism card');}
 await ack();await tab.playwright.locator('#begin').click();await observe('start chapter');
 if(String(stage).startsWith('t'))await tab.playwright.locator('#lessonSpotRoot').waitFor({state:'visible',timeoutMs:3000});
 }
 async function play(stage,difficulty){const route=routes.find(r=>r.stage===stage&&r.difficulty===difficulty);const record={variant:'without-trap',sourceHash,at:new Date().toISOString(),stage,difficulty,viewport:await tab.playwright.evaluate(()=>({width:innerWidth,height:innerHeight})),actions:route.actions,pass:false};const firstLog=log.length;
 try{await open(stage,difficulty);record.guideAtStart=await tab.playwright.locator('#lessonSpotRoot').isVisible();await shot(difficulty+'-'+(stage+1)+'-guide');for(const a of route.actions){await action(a);if(stage==='d26'){const doors=await tab.playwright.locator('#board .gate-overlay.closed').count(),guards=await tab.playwright.locator('#board .hasGuard').evaluateAll(els=>els.map(e=>({x:+e.dataset.x,y:+e.dataset.y}))),wolf=await tab.playwright.locator('#board .hasWolf').evaluate(e=>({x:+e.dataset.x,y:+e.dataset.y}));if(doors>=2&&guards.length===2&&guards.every(g=>g.y>=5)){if(!record.locked){record.locked={round:await tab.playwright.locator('#turn').textContent(),guards,wolf};await fs.writeFile(proof+'locked-'+difficulty+'.jpg',await tab.screenshot({fullPage:true}));}if(wolf.x===5&&wolf.y===2)record.usedThirdGateAfterLock=true;}} if(stage===8&&await tab.playwright.locator('#board .omen').count())await shot(difficulty+'-9-swap-warning');if(stage===8&&await tab.playwright.locator('#board .swapTrace').count())await shot(difficulty+'-9-swap-trace');if(await tab.playwright.locator('#overlay').isVisible())break;}record.result=await tab.playwright.locator('#cardTitle').textContent();record.text=await tab.playwright.locator('#cardText').textContent();record.pass=/抓到真羊|困难围猎成功/.test(record.result||'')&&(await tab.playwright.locator('#overlay').isVisible());await shot(difficulty+'-'+(stage+1)+'-result');}
 catch(error){record.error=String(error);print({failure:record.error});await shot(difficulty+'-'+(stage+1)+'-failure');}
 record.lessonSteps=log.slice(firstLog).filter(x=>x.lesson).map(x=>x.lesson);results.push(record);await fs.writeFile(proof+'ui-results.json',JSON.stringify(results,null,2));await fs.writeFile(proof+'ui-actions.json',JSON.stringify(log,null,2));print({...record,actions:undefined});return record.pass;
 }
 return {play,action,open,ack,shot,observe,results};
}
