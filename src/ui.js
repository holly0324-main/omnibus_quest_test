import {MAP_NAMES,ITEMS,SKILLS,ENEMIES,attackOf,defenseOf,objective,makeNewState} from './data.js';
import {doBattleAction,escapeBattle} from './battle.js';
import {interact} from './world.js';

const panel=document.getElementById('panel');
const hud=document.getElementById('hud');
const area=document.getElementById('areaName');
const stats=document.getElementById('heroStats');
const mission=document.getElementById('mission');
const toastEl=document.getElementById('toast');
const esc=str=>String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function buttons(game,entries,grid=false){
  const idx=game.state.menu?.index??game.state.battle?.index??0;
  return `<div class="${grid?'choices':'panel-stack'}">${entries.map((opt,i)=>
     `<button type="button" class="panel-btn ${i===idx?'selected':''}" data-choice="${i}" ${opt.disabled?'disabled':''}>${esc(opt.label)}</button>`).join('')}</div>`;
}
function menuOptions(game){
  const s=game.state,h=s.hero,m=s.menu;
  if(m.page==='root')return [
    {label:'どうぐ',run:()=>page(game,'items')},{label:'装備',run:()=>page(game,'equipment')},
    {label:'つよさ',run:()=>page(game,'status')},{label:'とじる',run:()=>closeMenu(game)}];
  if(m.page==='items'){
    return Object.keys(ITEMS).filter(k=>ITEMS[k].kind==='use'&&h.inventory[k]>0)
      .map(k=>({label:`${ITEMS[k].name} ×${h.inventory[k]} — ${ITEMS[k].desc}`,run:()=>useItem(game,k)}))
      .concat([{label:'← もどる',run:()=>page(game,'root')}]);
  }
  if(m.page==='equipment')return [
    {label:`武器：${ITEMS[h.equipment.weapon].name} (攻+${ITEMS[h.equipment.weapon].atk})`,run:()=>page(game,'weapon')},
    {label:`防具：${ITEMS[h.equipment.armor].name} (防+${ITEMS[h.equipment.armor].def})`,run:()=>page(game,'armor')},
    {label:'← もどる',run:()=>page(game,'root')}];
  if(m.page==='weapon'||m.page==='armor'){
    const kind=m.page;
    return Object.keys(ITEMS).filter(k=>ITEMS[k].kind===kind&&h.inventory[k]>0)
      .map(k=>({label:`${h.equipment[kind]===k?'◆':'◇'} ${ITEMS[k].name} +${kind==='weapon'?ITEMS[k].atk:ITEMS[k].def}`,run:()=>{
        h.equipment[kind]=k;game.save();game.toast(`${ITEMS[k].name}を装備！`);page(game,'equipment');
      }})).concat([{label:'← もどる',run:()=>page(game,'equipment')}]);
  }
  return [{label:'← もどる',run:()=>page(game,'root')}];
}
function shopOptions(game){
  const s=game.state,h=s.hero;
  const choices=s.menu.shopId==='smith'?['bronzeSword','leather']:['potion','ether'];
  const list=choices.map(k=>({label:`${ITEMS[k].name}　${ITEMS[k].price}G`,run:()=>{
    if(h.gold<ITEMS[k].price){game.toast('お金が足りない');return;}
    h.gold-=ITEMS[k].price;h.inventory[k]=(h.inventory[k]||0)+1;
    game.toast(`${ITEMS[k].name}を購入！`);game.save();game.refresh();
  }}));
  if(s.menu.shopId==='healer')list.push({label:'治療　10G（HP・MP全快）',run:()=>{
    if(h.gold<10){game.toast('お金が足りない');return;}
    h.gold-=10;h.hp=h.maxHp;h.mp=h.maxMp;game.toast('傷が癒えた！');game.save();game.refresh();
  }});
  list.push({label:'← 店を出る',run:()=>closeMenu(game)});return list;
}
function battleOptions(game){
  const b=game.state.battle,h=game.state.hero;
  if(b.page==='root')return [
    {label:'こうげき',run:()=>doBattleAction(game,'attack')},
    {label:'特技',run:()=>battlePage(game,'skills')},
    {label:'道具',run:()=>battlePage(game,'items')},
    {label:'ぼうぎょ',run:()=>doBattleAction(game,'guard')}
  ];
  if(b.page==='skills')return Object.keys(SKILLS).map(k=>({
    label:`${SKILLS[k].name}　MP${SKILLS[k].mp}${h.level<SKILLS[k].level?' 🔒Lv'+SKILLS[k].level:''}`,
    run:()=>doBattleAction(game,'skill',k)
  })).concat([{label:'← もどる',run:()=>battlePage(game,'root')}]);
  return ['potion','ether'].filter(k=>(h.inventory[k]||0)>0).map(k=>({
    label:`${ITEMS[k].name} ×${h.inventory[k]}`,run:()=>doBattleAction(game,'item',k)
  })).concat([{label:'← もどる',run:()=>battlePage(game,'root')}]);
}
function page(game,p){game.state.menu.page=p;game.state.menu.index=0;game.refresh();}
function battlePage(game,p){game.state.battle.page=p;game.state.battle.index=0;game.refresh();}
function closeMenu(game){game.state.mode='explore';game.state.menu=null;game.refresh();}
function useItem(game,k){
  const h=game.state.hero;if(!h.inventory[k])return;
  const max=k==='potion'?'maxHp':'maxMp',field=k==='potion'?'hp':'mp';
  if(h[field]>=h[max]){game.toast('すでに全快している');return;}
  const amt=Math.min(k==='potion'?30:8,h[max]-h[field]);
  h[field]+=amt;h.inventory[k]--;game.save();game.toast(`${ITEMS[k].name}で ${field.toUpperCase()} +${amt}`);game.refresh();
}
function selectedOptions(game){const s=game.state;
  if(s.mode==='menu')return menuOptions(game);
  if(s.mode==='shop')return shopOptions(game);
  if(s.mode==='battle'&&s.battle.phase==='choose')return battleOptions(game);
  if(s.mode==='title')return [{label:'はじめから',run:()=>game.startNew()},{label:'つづきから',disabled:!game.hasSave(),run:()=>game.load()}];
  if(s.mode==='ending')return [{label:'自由に探索する',run:()=>{s.mode='explore';game.refresh();}},{label:'はじめから',run:()=>game.startNew()}];
  return [];
}
function getIndex(s){if(s.mode==='battle')return s.battle.index;return s.menu?.index??0;}
function setIndex(s,i){if(s.mode==='battle')s.battle.index=i;else if(s.menu)s.menu.index=i;}
function choose(game,i){const opts=selectedOptions(game);if(opts[i]&&!opts[i].disabled){setIndex(game.state,i);opts[i].run();}}
export function initUI(game){
  panel.addEventListener('click',e=>{
    const btn=e.target.closest('[data-choice]');if(!btn)return;
    choose(game,Number(btn.dataset.choice));
  });
  game.refresh=()=>renderUI(game);
  game.toast=text=>{game.state.toastText=text;game.state.toastTime=1.8;toastEl.textContent=text;toastEl.classList.add('show');};
  game.say=(lines,done=null)=>{game.state.mode='dialog';game.state.dialogue={lines,index:0,done};game.refresh();};
  game.openShop=id=>{game.state.mode='shop';game.state.menu={page:'shop',index:0,shopId:id};game.refresh();};
  game.openMenu=(p='root')=>{game.state.mode='menu';game.state.menu={page:p,index:0};game.refresh();};
  game.hideToast=()=>toastEl.classList.remove('show');
}
export function handleAction(game,key){
  const s=game.state;
  if(s.mode==='dialog'){
    if(key==='A'||key==='B'){
      const d=s.dialogue;
      if(++d.index>=d.lines.length){s.dialogue=null;s.mode='explore';d.done?.();}
      game.refresh();
    }return;
  }
  if(s.mode==='explore'){
    if(key==='A')interact(game);
    if(key==='X')game.openMenu();
    if(key==='Y')game.openMenu('status');
    return;
  }
  if(s.mode==='battle'&&s.battle?.phase!=='choose')return;
  if(key==='B'){
    if(s.mode==='battle'){
      if(s.battle.page==='root')escapeBattle(game);else battlePage(game,'root');
    }else if(s.mode==='menu'){
      if(s.menu.page==='root')closeMenu(game);
      else if(s.menu.page==='weapon'||s.menu.page==='armor')page(game,'equipment');
      else page(game,'root');
    }else if(s.mode==='shop')closeMenu(game);
    return;
  }
  if(s.mode==='battle'||s.mode==='menu'||s.mode==='title'||s.mode==='ending'||s.mode==='shop'){
    const opts=selectedOptions(game);if(!opts.length)return;
    if(key==='A'){choose(game,getIndex(s));return;}
    if(['up','down','left','right'].includes(key)){
      const grid=(s.mode==='battle'&&s.battle.page==='root')||(s.mode==='menu'&&s.menu.page==='root');
      const delta=key==='up'?(grid?-2:-1):key==='down'?(grid?2:1):key==='left'?-1:1;
      const i=(getIndex(s)+delta+opts.length*3)%opts.length;
      setIndex(s,i);game.refresh();
    }
  }
}
export function renderUI(game){
  const s=game.state,h=s.hero;
  hud.hidden=s.mode==='title'||s.mode==='ending';
  area.textContent=s.mode==='battle'?'戦闘中':MAP_NAMES[s.map];stats.textContent=`Lv${h.level} HP${h.hp}/${h.maxHp} MP${h.mp}/${h.maxMp}`;
  mission.textContent=s.mode==='battle'?'敵の動きと傷を見て戦おう':objective(s);
  if(s.mode==='explore'){panel.innerHTML='';return;}
  if(s.mode==='dialog'){
    const d=s.dialogue;
    panel.innerHTML=`<p>${esc(d.lines[d.index])}</p><span class="hint">A：次へ ▸ ${d.index+1}/${d.lines.length}</span>`;return;
  }
  if(s.mode==='title'){
    const opts=selectedOptions(game);
    panel.innerHTML=`<h2>第一章　戦士と石門</h2><p>焼けた故郷から、剣と共に旅立つ。</p>${buttons(game,opts)}`;return;
  }
  if(s.mode==='ending'){
    panel.innerHTML=`<h2>第一章　完</h2><p>討伐隊の一員となったレオン。彼が知ることになる真実は、まだ遠い。</p>${buttons(game,selectedOptions(game))}`;return;
  }
  if(s.mode==='battle'){
    const b=s.battle,e=ENEMIES[b.id];
    const opts=b.phase==='choose'?battleOptions(game):[];
    const title=b.page==='skills'?'特技を選ぶ':b.page==='items'?'道具を選ぶ':e.name;
    panel.innerHTML=`<h2>${esc(title)}</h2><p>${esc(b.log)}</p>${opts.length?buttons(game,opts,b.page==='root'):''}<span class="hint">${b.phase==='choose'?'B：戻る／逃げる':'戦闘演出中…'}</span>`;return;
  }
  if(s.mode==='shop'){
    const name=s.menu.shopId==='smith'?'鍛冶屋の店':'薬師の店';
    panel.innerHTML=`<h2>${name} <span class="gold">${h.gold} G</span></h2><p class="details">買った装備はX → 装備で切り替えよう。</p>${buttons(game,shopOptions(game))}`;return;
  }
  if(s.mode==='menu'){
    const m=s.menu;
    if(m.page==='status'){
      panel.innerHTML=`<h2>レオンの強さ</h2><p>Lv${h.level}　EXP ${h.exp}　<span class="gold">${h.gold} G</span>
HP ${h.hp}/${h.maxHp}　 MP ${h.mp}/${h.maxMp}
攻撃力 ${attackOf(h)}　防御力 ${defenseOf(h)}
武器 ${ITEMS[h.equipment.weapon].name}
防具 ${ITEMS[h.equipment.armor].name}</p>${buttons(game,menuOptions(game))}`;
    }else{
      const title={root:'さくせん',items:'どうぐ',equipment:'装備',weapon:'武器を選ぶ',armor:'防具を選ぶ'}[m.page];
      panel.innerHTML=`<h2>${title} <span class="gold">${h.gold} G</span></h2>${buttons(game,menuOptions(game),m.page==='root')}`;
    }
  }
}
