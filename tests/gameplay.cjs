const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const root = require('path').resolve(__dirname, '..') + require('path').sep;
const html = fs.readFileSync(root+'index.html','utf8');
class Element {
  constructor(id='') { this.id=id; this.dataset={}; this.style={}; this.listeners={}; this.children=[]; this.classes=new Set();this.classList={add:v=>this.classes.add(v),remove:v=>this.classes.delete(v),contains:v=>this.classes.has(v),toggle:(v,on)=>{on?this.classes.add(v):this.classes.delete(v);}}; }
  addEventListener(k,f){(this.listeners[k]??=[]).push(f);}
  click(){for(const f of this.listeners.click??[])f({});}
  setAttribute(k,v){this[k]=v;}
  append(...els){this.children.push(...els);for(const e of els)if(e.id)elements[e.id]=e;}
  get lastElementChild(){return this.children.at(-1);}
  focus(){document.activeElement=this;}
  getBoundingClientRect(){return{width:390,height:844};}
  setPointerCapture(){}
  querySelectorAll(){return[];}
}
const elements={};for(const m of html.matchAll(/id="([^"]+)"/g)) elements[m[1]]=new Element(m[1]);
const grad={addColorStop(){}};
let drawCalls=0;
const ctx=new Proxy({}, {get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),'Non-finite drawing input: '+k);drawCalls++;if(k==='createLinearGradient')return grad;},set:(o,k,v)=>(o[k]=v,true)});
elements.gameCanvas.getContext=()=>ctx;
const document={body:new Element('body'),activeElement:null,getElementById:id=>elements[id]??null,createElement:()=>new Element(),querySelectorAll:()=>[],addEventListener(){}};
const localStorage={data:{},getItem(k){return this.data[k]??null;},setItem(k,v){this.data[k]=v;}};
const sandbox={document,localStorage,window:{addEventListener(){}},matchMedia:()=>({matches:false}),devicePixelRatio:1,performance:{now:()=>0},requestAnimationFrame(){},console,Math};vm.createContext(sandbox);
for(const file of ['runner.js','district.js','extras.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),sandbox,{filename:file});
function run(code){return vm.runInContext(code,sandbox);}
function equal(code,value){assert.equal(run(code),value,code);}
elements.playButton.click();equal("$('guideScreen').classList.contains('hidden')",false);equal('state.mode','ready');elements.guidePlay.click();equal('state.mode','playing');equal("localStorage.getItem('aj-runner-guide-seen')",'yes');
run("state.sound=false;obstacles=[];coins=[];pickups=[];state.spawnTimer=100");
elements.boardButton.click();equal('state.boardTime',10);equal('state.boardUsed',true);
run("obstacles=[{lane:1,z:0,kind:'train'}];checkCollisions()");equal('state.mode','playing');equal('state.boardTime',0);
elements.boardButton.click();equal('state.boardTime',0);
run("obstacles=[{lane:1,z:0,kind:'train'}];checkCollisions()");equal('state.mode','over');elements.restartButton.click();equal('state.boardUsed',false);
run("state.sound=false;obstacles=[];coins=[];pickups=[{lane:1,z:0,kind:'double'}];checkCollisions()");equal('state.doubleTime',10);equal('scoreMultiplier()',2);
run("pickups=[];for(let i=0;i<10;i++)collect({lane:1})");equal('state.streak',10);equal('scoreMultiplier()',4);
run('playPause();update(1000)');equal('state.doubleTime',10);run('playPause();state.spawnTimer=100;update(3100)');equal('state.streak',0);
run("resetGame();state.sound=false;obstacles=[];coins=[];pickups=[];jump();state.spawnTimer=100;for(let i=0;i<45;i++)update(16.667)");equal('aj.jumping',false);equal('aj.y',0);
for(let i=0;i<30;i++){run('obstacles=[];coins=[];pickups=[];spawnObstacle()');assert(run('new Set(obstacles.map(o=>o.lane)).size')<=2);assert(run('coins.every(c=>!obstacles.some(o=>o.lane===c.lane))'));}
run('resetGame();state.sound=false');
for(const scene of ['day','night']){run(`state.scene='${scene}'`);run("drawBackground();drawAJ();for(const kind of ['shield','magnet','double'])drawPickup({lane:1,z:.3,kind});for(const kind of ['train','barrier','signal'])drawObstacle({lane:0,z:.2,kind});drawCoin({lane:2,z:.2,spin:1});");}
assert(drawCalls>500);console.log('Passed: first-run guide, board save and exhaustion, restart, double-score pickup, combo stacking and expiry, paused timers, jump landing, 30 safe obstacle rows, finite canvas drawing in both scenes.');
