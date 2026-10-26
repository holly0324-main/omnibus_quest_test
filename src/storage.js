import {MAPS,makeNewState} from './data.js';
const KEY='ashen_oath_chapter1_v2';
export function saveGame(s){
  const data={version:2,map:s.map,player:s.player,hero:s.hero,flags:s.flags,
    encounterDist:s.encounterDist,encounterNext:s.encounterNext};
  try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}
}
export function hasSave(){try{return localStorage.getItem(KEY)!==null;}catch{return false;}}
export function loadGame(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY));
    if(raw?.version!==2||!MAPS[raw.map]||!raw.hero||!raw.flags||!raw.player)return null;
    const base=makeNewState();
    const h={...base.hero,...raw.hero};
    h.inventory={...base.hero.inventory,...raw.hero.inventory};
    h.equipment={...base.hero.equipment,...raw.hero.equipment};
    h.hp=Math.max(1,Math.min(h.maxHp,Number(h.hp)||1));
    h.mp=Math.max(0,Math.min(h.maxMp,Number(h.mp)||0));
    const p={...base.player,...raw.player};
    p.x=Math.max(1,Math.min(MAPS[raw.map].w-2,Number(p.x)||1));
    p.y=Math.max(1,Math.min(MAPS[raw.map].h-2,Number(p.y)||1));
    return {...base,...raw,mode:'explore',hero:h,player:p,flags:{...base.flags,...raw.flags},transitionLock:1};
  }catch{return null;}
}
