const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const playButton=$('playButton'),restartButton=$('restartButton'),pauseButton=$('pauseButton');
const storageKey='aj-runner-high-score';
function readBest(){try{return Math.max(0,Number(localStorage.getItem(storageKey))||0);}catch{return 0;}}
const state={mode:'ready',score:0,highScore:readBest(),coins:0,speed:7,distance:0,spawnTimer:0,lastTime:0,sound:true,flash:0,scene:'day',mission:false,rows:0,streak:0,bestStreak:0,comboTime:0,boardTime:0,boardUsed:false,doubleTime:0};
const aj={lane:1,targetLane:1,y:0,vy:0,jumping:false,sliding:false,slideTimer:0,landTimer:0,stride:0};
let obstacles=[],coins=[],pickups=[],particles=[],shieldTime=0,magnetTime=0,worldDistance=0,worldTime=0,toastTime=0,audioContext;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function fitCanvas(){const r=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);}
function view(){const r=canvas.getBoundingClientRect();return{w:r.width,h:r.height,horizon:r.height*.28,ground:r.height*.81,center:r.width/2,spacing:Math.min(r.width*.27,210)};}
// One perspective transform is used by rails, scenery, obstacles, coins and AJ.
function depth(z){return Math.max(.015,1/(1+Math.max(-.16,z)*5));}
function trackPoint(lane,z=0){const v=view(),p=depth(z);return{x:v.center+(lane-1)*v.spacing*p,y:v.horizon+(v.ground-v.horizon)*p,p};}
function laneX(lane){return trackPoint(lane).x;}
function projectY(z){return trackPoint(1,z).y;}
function scaleForZ(z){return depth(z)*Math.min(1.4,view().spacing/78);}
function setMode(mode){state.mode=mode;document.body.dataset.mode=mode;$('startScreen').classList.toggle('hidden',mode!=='ready');$('pauseScreen').classList.toggle('hidden',mode!=='paused');$('gameOverScreen').classList.toggle('hidden',mode!=='over');pauseButton.textContent=mode==='paused'?'Resume':'Pause';pauseButton.setAttribute('aria-label',mode==='paused'?'Resume game':'Pause game');}
function toast(message){$('toast').textContent=message;toastTime=2.2;$('toast').classList.add('visible');}
function resetGame(){Object.assign(state,{score:0,coins:0,speed:7,distance:0,spawnTimer:0,flash:0,mission:false,rows:0,streak:0,bestStreak:0,comboTime:0,boardTime:0,boardUsed:false,doubleTime:0});Object.assign(aj,{lane:1,targetLane:1,y:0,vy:0,jumping:false,sliding:false,slideTimer:0,landTimer:0,stride:0});obstacles=[];coins=[];pickups=[];particles=[];shieldTime=0;magnetTime=0;worldDistance=0;setMode('playing');spawnObstacle();updateHud();toast('FOLLOW THE COINS / FIND YOUR RHYTHM');beep(480,.08);}
function updateHud(){
 $('score').textContent=Math.floor(state.score).toLocaleString();$('highScore').textContent=state.highScore.toLocaleString();$('coins').textContent=state.coins;
 $('speed').textContent=Math.round(state.speed*4)+' km/h';$('distance').textContent=Math.floor(state.distance)+' m';
 $('power').textContent='DISTRICT '+String(1+Math.floor(state.distance/500)).padStart(2,'0');
 $('missionText').textContent=state.mission?'COIN RUN / COMPLETE':'COIN RUN / '+Math.min(25,state.coins)+' OF 25';$('missionProgress').style.width=Math.min(100,state.coins*4)+'%';$('landingBest').textContent=state.highScore.toLocaleString()+' to beat.';
 if(typeof updateBonuses==='function')updateBonuses();
}
// A row occupies at most two lanes. Its lane assignments never change in flight.
function spawnObstacle(){
 const safeLane=Math.floor(Math.random()*3),available=[0,1,2].filter(l=>l!==safeLane),count=state.rows<3?1:2;
 const kinds=['barrier','signal','train'];
 for(let i=0;i<count;i++)obstacles.push({lane:available[i],z:1.35,kind:kinds[(state.rows+i)%3],hit:false,passed:false});
 for(let i=0;i<5;i++)coins.push({lane:safeLane,z:1.31+i*.055,spin:i*.8,taken:false});
 if(state.rows%3===1)pickups.push({lane:safeLane,z:1.35,kind:['shield','magnet','double'][Math.floor(state.rows/3)%3],taken:false});
 state.rows++;state.spawnTimer=Math.max(1.35,2.15-(state.speed-7)*.035);
}
function playPause(){if(state.mode==='playing'){setMode('paused');$('resumeButton').focus();}else if(state.mode==='paused'){setMode('playing');state.lastTime=performance.now();}}
function gameOver(){if(state.mode!=='playing')return;const newBest=Math.floor(state.score)>state.highScore;state.highScore=Math.max(state.highScore,Math.floor(state.score));try{localStorage.setItem(storageKey,String(state.highScore));}catch{}setMode('over');$('finalStats').textContent=Math.floor(state.score).toLocaleString()+' points / '+state.coins+' coins / '+Math.floor(state.distance)+' m';$('runAwards').textContent=(newBest?'NEW PERSONAL BEST | ':'')+'Best coin streak: '+state.bestStreak+(state.mission?' | Coin Run complete':'');updateHud();$('restartButton').focus();beep(130,.25);}
function home(){setMode('ready');obstacles=[];coins=[];pickups=[];particles=[];shieldTime=0;magnetTime=0;aj.lane=1;aj.y=0;aj.sliding=false;$('toast').classList.remove('visible');updateHud();playButton.focus();}
function moveLeft(){if(state.mode==='playing')aj.targetLane=Math.max(0,aj.targetLane-1);}
function moveRight(){if(state.mode==='playing')aj.targetLane=Math.min(2,aj.targetLane+1);}
function jump(){if(state.mode!=='playing'||aj.jumping)return;aj.sliding=false;aj.jumping=true;aj.vy=15.8;beep(650,.04);}
function slide(){if(state.mode!=='playing')return;if(aj.jumping){aj.vy=-17;return;}aj.sliding=true;aj.slideTimer=.7;}
function scoreMultiplier(){return Math.min(4,1+Math.floor(state.streak/10))*(state.doubleTime>0?2:1);}
function collect(coin){coin.taken=true;state.coins++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.comboTime=3;state.score+=18*scoreMultiplier();burst(coin.lane,'#ffdf68');beep(880+state.streak%10*35,.035);if(state.streak%10===0)toast(state.streak+' COIN STREAK / '+scoreMultiplier()+'x SCORE');if(state.coins>=25&&!state.mission){state.mission=true;state.score+=500;toast('COIN RUN COMPLETE / +500');}}
function burst(lane,color){for(let i=0;i<8;i++)particles.push({x:laneX(lane),y:view().ground-65,vx:(Math.random()-.5)*140,vy:-60-Math.random()*140,life:.6,color});}
function checkCollisions(){
 for(const item of obstacles){
  if(item.passed||item.hit||item.z>.012)continue;
  item.passed=true;
  const aligned=Math.abs(item.lane-aj.lane)<.4;
  const avoided=item.kind==='barrier'?aj.y>48:item.kind==='signal'?aj.sliding:false;
  if(aligned&&!avoided){if(state.boardTime>0||shieldTime>0){const board=state.boardTime>0;if(board)state.boardTime=0;else shieldTime=0;item.hit=true;burst(aj.lane,'#8fffd4');toast(board?'BOARD SAVE / KEEP RUNNING':'SHIELD SAVE');}else{state.flash=1;gameOver();return;}}
 }
 for(const coin of coins){if(coin.taken)continue;const aligned=Math.abs(coin.lane-aj.lane)<.42;const magnetic=magnetTime>0&&coin.z<.22;if((aligned&&coin.z<.035&&coin.z>-.04)||magnetic)collect(coin);}
 for(const p of pickups){if(!p.taken&&p.z<.04&&p.z>-.04&&Math.abs(p.lane-aj.lane)<.42){p.taken=true;if(p.kind==='shield')shieldTime=8;else if(p.kind==='magnet')magnetTime=8;else state.doubleTime=10;toast(p.kind==='shield'?'SHIELD / 8 SECONDS':p.kind==='magnet'?'COIN MAGNET / 8 SECONDS':'DOUBLE SCORE / 10 SECONDS');beep(740,.12);}}
}
function update(dt){
 const seconds=dt/1000;
 if(state.mode==='ready'){if(!reducedMotion)worldTime+=dt;return;}
 if(state.mode!=='playing')return;
 worldTime+=dt;const step=dt/16.667,travel=state.speed*dt*.000045;
 worldDistance+=travel;state.distance+=state.speed*seconds*1.6;state.score+=state.speed*seconds*9*scoreMultiplier();state.speed=Math.min(18,7+state.distance/180);state.spawnTimer-=seconds;
 state.boardTime=Math.max(0,state.boardTime-seconds);state.doubleTime=Math.max(0,state.doubleTime-seconds);state.comboTime=Math.max(0,state.comboTime-seconds);if(!state.comboTime)state.streak=0;
 shieldTime=Math.max(0,shieldTime-seconds);magnetTime=Math.max(0,magnetTime-seconds);state.flash=Math.max(0,state.flash-seconds*3);toastTime-=seconds;if(toastTime<0)$('toast').classList.remove('visible');
 if(state.spawnTimer<=0)spawnObstacle();
 aj.lane+=(aj.targetLane-aj.lane)*Math.min(1,dt/75);aj.stride+=dt*(.0075+state.speed*.00045);
 if(aj.jumping){aj.y+=aj.vy*step;aj.vy-=.82*step;if(aj.y<=0){aj.y=0;aj.vy=0;aj.jumping=false;aj.landTimer=.16;beep(210,.025);}}
 aj.landTimer=Math.max(0,aj.landTimer-seconds);
 if(aj.sliding){aj.slideTimer-=seconds;if(aj.slideTimer<=0)aj.sliding=false;}
 for(const item of [...obstacles,...coins,...pickups]){item.z-=travel;if('spin'in item)item.spin+=dt*.007;}
 checkCollisions();obstacles=obstacles.filter(i=>i.z>-.16);coins=coins.filter(i=>i.z>-.08&&!i.taken);pickups=pickups.filter(i=>i.z>-.08&&!i.taken);
 for(const p of particles){p.life-=seconds;p.x+=p.vx*seconds;p.y+=p.vy*seconds;p.vy+=seconds*400;}particles=particles.filter(p=>p.life>0);updateHud();
}
function beep(frequency,duration){if(!state.sound)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audioContext||=new Audio();if(audioContext.state==='suspended')audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(.03,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration);}catch{}}
function render(t){const dt=Math.min(40,t-(state.lastTime||t));state.lastTime=t;update(dt);drawBackground();const entities=[...obstacles.map(o=>({z:o.z,draw:()=>drawObstacle(o)})),...coins.map(o=>({z:o.z,draw:()=>drawCoin(o)})),...pickups.map(o=>({z:o.z,draw:()=>drawPickup(o)})),{z:0,draw:drawAJ}];entities.sort((a,b)=>b.z-a.z).forEach(o=>o.draw());for(const p of particles){ctx.globalAlpha=p.life/.6;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);}ctx.globalAlpha=1;if(state.flash>0){ctx.fillStyle='rgba(245,88,70,'+state.flash*.2+')';ctx.fillRect(0,0,view().w,view().h);}}
window.addEventListener('resize',fitCanvas);
window.addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON'&&(e.key===' '||e.key==='Enter'))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.repeat)return;const action={ArrowLeft:moveLeft,ArrowRight:moveRight,ArrowUp:jump,ArrowDown:slide,' ':jump,p:playPause,P:playPause,Escape:playPause}[e.key];if(action)action();if(e.key==='Enter'&&e.target===document.body){if(state.mode==='ready')startFromMenu();else if(state.mode==='over')resetGame();}});
for(const [id,action] of Object.entries({leftButton:moveLeft,rightButton:moveRight,jumpButton:jump,slideButton:slide}))$(id).addEventListener('click',action);
for(const id of ['restartButton','pauseRestart'])$(id).addEventListener('click',resetGame);
for(const id of ['pauseButton','resumeButton'])$(id).addEventListener('click',playPause);
for(const id of ['pauseHome','overHome'])$(id).addEventListener('click',home);
$('soundButton').addEventListener('click',()=>{state.sound=!state.sound;$('soundIcon').textContent=state.sound?'\u266b':'\u266a';$('soundButton').setAttribute('aria-label',state.sound?'Mute sound':'Unmute sound');$('soundButton').setAttribute('aria-pressed',String(!state.sound));$('soundButton').style.opacity=state.sound?'1':'.55';});
for(const button of document.querySelectorAll('[data-scene]'))button.addEventListener('click',()=>{state.scene=button.dataset.scene;document.body.dataset.scene=state.scene;document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
let touchOrigin=null;
canvas.addEventListener('pointerdown',e=>{touchOrigin=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',e=>{if(!touchOrigin)return;const dx=e.clientX-touchOrigin[0],dy=e.clientY-touchOrigin[1];touchOrigin=null;if(Math.max(Math.abs(dx),Math.abs(dy))<22)return;if(Math.abs(dx)>Math.abs(dy))dx>0?moveRight():moveLeft();else dy<0?jump():slide();});canvas.addEventListener('pointercancel',()=>touchOrigin=null);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='playing')playPause();});
// bootstrap.js owns initialization and the animation loop, after all scripts load.
