import {makeNewState,MAPS,MAP_NAMES} from './data.js';
import {draw} from './renderer.js';
import {updateWorld} from './world.js';
import {updateBattle} from './battle.js';
import {bindInput} from './input.js';
import {initUI,handleAction} from './ui.js';
import {saveGame,hasSave,loadGame} from './storage.js';
const canvas=document.getElementById('screen');
const gameArea=document.getElementById('gameArea');
const frame=document.getElementById('frame');
const game={state:makeNewState(),ctx:canvas.getContext('2d'),camera:{x:0,y:0,ready:false}};
game.action=key=>handleAction(game,key);
game.save=()=>saveGame(game.state);
game.hasSave=hasSave;
game.snapCamera=()=>{game.camera.ready=false;};
game.startNew=()=>{
  game.state=makeNewState();game.state.mode='explore';game.snapCamera();game.save();
  game.say(['煙は消えた。それでもミルト村には焼けた木の匂いが残っている。',
    'レオン「……生き残った人を探そう。」',
    '十字キー長押しで歩き、村人の近くでAを押そう。'],()=>game.save());
};
game.load=()=>{
  const loaded=loadGame();if(!loaded){game.toast('セーブデータを読み込めなかった');return;}
  game.state=loaded;game.snapCamera();game.refresh();game.toast(`${MAP_NAMES[loaded.map]}から再開`);
};
initUI(game);bindInput(game);
// 開発時のみ ?debug=1 で状態検査を有効にする。通常プレイには影響しない。
if(new URLSearchParams(location.search).has('debug'))window.__ASHEN_DEBUG__=game;
function fit(){
  const r=gameArea.getBoundingClientRect();
  const width=Math.max(100,Math.min(r.width-8,(r.height-8)*(320/360)));
  frame.style.width=`${width}px`;
  frame.style.height=`${width*360/320}px`;
}
window.addEventListener('resize',fit);window.addEventListener('orientationchange',fit);
fit();game.refresh();
// 固定30 FPS：ブラウザの実描画FPSに依存せず、更新周期を1/30秒に保つ。
// タブ復帰時に巨大なdtが流入しないよう上限を設ける。
const STEP=1000/30;
let previous=performance.now(),accumulator=0,saveCounter=0;
function frameLoop(now){
  const delta=Math.min(150,now-previous);previous=now;accumulator+=delta;
  let cycles=0;
  while(accumulator>=STEP&&cycles<4){
    const dt=STEP/1000,s=game.state;
    if(s.mode==='explore')updateWorld(game,dt);
    if(s.mode==='battle')updateBattle(game,dt);
    if(s.toastTime>0){s.toastTime=Math.max(0,s.toastTime-dt);if(!s.toastTime)game.hideToast();}
    if(s.mode==='explore'){
      saveCounter+=dt;if(saveCounter>9){game.save();saveCounter=0;}
    }
    accumulator-=STEP;cycles++;
  }
  if(cycles===4)accumulator=0;
  if(cycles>0)draw(game);
  requestAnimationFrame(frameLoop);
}
requestAnimationFrame(frameLoop);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state.mode==='explore')game.save();});
