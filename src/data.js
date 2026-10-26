// ゲームデータとマップ定義。章の追加時はこの層を拡張する。
export const TILE=16;
export const DIRS={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
export const ITEMS={
  potion:{name:'薬草',kind:'use',price:14,desc:'HPを30回復する'},
  ether:{name:'魔力の雫',kind:'use',price:25,desc:'MPを8回復する'},
  rustySword:{name:'錆びた剣',kind:'weapon',atk:2,price:0,desc:'故郷で使っていた古い剣'},
  bronzeSword:{name:'青銅の剣',kind:'weapon',atk:6,price:30,desc:'扱いやすい片手剣'},
  ironSword:{name:'鉄の剣',kind:'weapon',atk:10,price:75,desc:'試練の遺物。刃はまだ鋭い'},
  cloth:{name:'旅人の服',kind:'armor',def:1,price:0,desc:'旅立ちの日の服'},
  leather:{name:'革の鎧',kind:'armor',def:4,price:25,desc:'頑丈な革を重ねた鎧'}
};
export const SKILLS={
  heavy:{name:'強打',mp:3,level:1,desc:'威力の高い一撃（MP3）'},
  guardBreak:{name:'崩し斬り',mp:5,level:2,desc:'防御を崩して攻撃力を下げる（MP5）'},
  rally:{name:'気合',mp:4,level:1,desc:'自身のHPを16回復（MP4）'}
};
export const ENEMIES={
  slime:{name:'灰のスライム',hp:22,atk:5,def:0,exp:7,gold:9},
  wolf:{name:'煤毛の狼',hp:30,atk:7,def:1,exp:11,gold:13},
  bat:{name:'洞窟コウモリ',hp:29,atk:8,def:1,exp:12,gold:12},
  armor:{name:'石屑の兵',hp:39,atk:10,def:3,exp:17,gold:18},
  boss:{name:'石門の番兵',hp:100,atk:12,def:3,exp:60,gold:90}
};
function createMap(id,w,h,base){return {id,w,h,tiles:Array.from({length:h},()=>Array(w).fill(base)),npcs:[],portals:[],marks:[]};}
function put(m,x,y,t){if(x>=0&&y>=0&&x<m.w&&y<m.h)m.tiles[y][x]=t;}
function rect(m,x,y,w,h,t){for(let iy=y;iy<y+h;iy++)for(let ix=x;ix<x+w;ix++)put(m,ix,iy,t);}
function border(m,t){rect(m,0,0,m.w,1,t);rect(m,0,m.h-1,m.w,1,t);rect(m,0,0,1,m.h,t);rect(m,m.w-1,0,1,m.h,t);}
function house(m,x,y,w=7,h=6){rect(m,x,y,w,h,'roof');rect(m,x,y+h-2,w,2,'wall');put(m,x+Math.floor(w/2),y+h-1,'door');}
const village=createMap('village',42,34,'grass');
border(village,'trees');
for(let y=1;y<village.h-1;y++)for(let x=1;x<village.w-1;x++)if((x*19+y*31)%29===0)put(village,x,y,'ash');
rect(village,1,16,41,4,'path');rect(village,16,8,5,22,'path');
house(village,5,5,8,7);house(village,26,5,9,7);house(village,4,23,8,7);house(village,28,24,9,6);
rect(village,28,6,3,2,'rubble');rect(village,6,24,3,2,'rubble');
rect(village,41,16,1,4,'path');
village.npcs=[{id:'elder',name:'ミラ',x:18.5,y:13.5,color:'#b8a4ba'},{id:'survivor',name:'生存者',x:25.5,y:20.5,color:'#b3c6ac'}];
village.portals=[{x:41.35,y:17.5,r:1.4,to:'world',spawn:[15.8,30.5],requires:'elder'}];
const world=createMap('world',72,54,'grass');
for(let y=0;y<54;y++)for(let x=0;x<72;x++){
  const v=(x*37+y*23+x*y*3)%53;
  if(v<8)put(world,x,y,'tallgrass');
  if((x<6||x>65||y<5||y>49)&&v<31)put(world,x,y,'forest');
  if((y<11&&x>22&&x<51)||(x>33&&x<42&&y>35))if(v<38)put(world,x,y,'mountain');
  if((x<18&&y>39)||(x>60&&y>32))if(v<12)put(world,x,y,'water');
}
// 道を先に敷いた上でポータル周辺を広く確保。移動可能な一本道にしない。
for(let x=13;x<=56;x++){
 const y=Math.round(29+(24-29)*(x-13)/(56-13));
 for(let d=-1;d<=1;d++)put(world,x,y+d,'dirt');
}
for(let y=22;y<=31;y++){for(let x=10;x<=17;x++)put(world,x,y,'grass');for(let x=52;x<=60;x++)put(world,x,y,'grass');}
world.marks=[{x:13.5,y:28.5,label:'ミルト村',kind:'village'},{x:34.5,y:27.5,label:'旅人の野営地',kind:'camp'},{x:55.5,y:24.5,label:'王都アステル',kind:'capital'}];
world.portals=[{x:13.5,y:28.5,r:1.05,to:'village',spawn:[39.0,17.5]},{x:55.5,y:24.5,r:1.15,to:'capital',spawn:[28.5,41.0]}];
const capital=createMap('capital',56,45,'stone');border(capital,'wall');
rect(capital,25,0,7,45,'pave');rect(capital,0,21,56,6,'pave');
rect(capital,20,28,17,5,'pave');rect(capital,12,12,32,4,'pave');
rect(capital,26,22,5,5,'fountain');
house(capital,5,5,12,9);house(capital,39,5,12,9);house(capital,4,30,13,9);house(capital,39,31,12,9);
house(capital,9,16,9,7);house(capital,37,17,10,7);
rect(capital,25,0,7,1,'pave');rect(capital,25,44,7,1,'pave');
for(let x=0;x<56;x++)for(let y=0;y<45;y++)if((x*17+y*13)%59===0&&capital.tiles[y][x]==='stone')put(capital,x,y,'flower');
capital.npcs=[
 {id:'captain',name:'隊長バルド',x:28.5,y:16.5,color:'#dfbb70'},
 {id:'smith',name:'鍛冶屋',x:18.5,y:25.5,color:'#cd8e64'},
 {id:'healer',name:'薬師',x:35.5,y:25.5,color:'#b8d8c1'},
 {id:'recruit',name:'志願兵',x:30.5,y:33.5,color:'#7fc2c8'}
];
capital.portals=[
 {x:28.5,y:0.65,r:1.0,to:'dungeon',spawn:[23.5,39.4],requires:'captain'},
 {x:28.5,y:44.3,r:1.0,to:'world',spawn:[54.1,27.2]}
];
const dungeon=createMap('dungeon',46,42,'floor');border(dungeon,'rock');
rect(dungeon,1,27,17,2,'rock');rect(dungeon,28,27,17,2,'rock');
rect(dungeon,1,17,8,2,'rock');rect(dungeon,15,17,16,2,'rock');rect(dungeon,37,17,8,2,'rock');
rect(dungeon,9,8,10,2,'rock');rect(dungeon,27,8,10,2,'rock');
rect(dungeon,6,31,5,3,'rock');rect(dungeon,36,32,4,3,'rock');
rect(dungeon,4,21,4,3,'rock');rect(dungeon,39,22,4,3,'rock');
rect(dungeon,22,41,3,1,'floor');
dungeon.npcs=[{id:'boss',name:'石門の番兵',x:23.5,y:6.5,color:'#8bb2c2'}];
dungeon.marks=[{x:12.5,y:23.5,kind:'chest',label:'古い宝箱'}];
dungeon.portals=[{x:23.5,y:41.0,r:1.1,to:'capital',spawn:[28.5,2.7]}];
export const MAPS={village,world,capital,dungeon};
export const MAP_NAMES={village:'ミルト村・廃墟',world:'アステル地方',capital:'王都アステル',dungeon:'旧石門・入隊試練'};
export const WALKABLE=new Set(['grass','path','ash','dirt','tallgrass','forest','stone','pave','flower','floor','door']);
export function makeNewState(){return {
 mode:'title',map:'village',player:{x:18.5,y:22.5,face:'up',walk:0},
 hero:{name:'レオン',level:1,exp:0,hp:52,maxHp:52,mp:12,maxMp:12,baseAtk:5,baseDef:1,gold:35,
  inventory:{potion:3,ether:1,rustySword:1,cloth:1},equipment:{weapon:'rustySword',armor:'cloth'}},
 flags:{elder:false,firstEncounter:false,captain:false,chest:false,boss:false,campRested:false},
 encounterDist:0,encounterNext:13,transitionLock:0,
 dialogue:null,menu:null,battle:null,toastTime:0,toastText:''
};}
export function attackOf(h){return h.baseAtk+(ITEMS[h.equipment.weapon]?.atk||0);}
export function defenseOf(h){return h.baseDef+(ITEMS[h.equipment.armor]?.def||0);}
export function objective(s){if(s.flags.boss)return '第一章 完了';if(!s.flags.elder)return '生存者ミラと話す';if(s.map==='village')return '東の出口から旅立つ';if(!s.flags.firstEncounter)return '街道を越えて王都へ';if(!s.flags.captain)return '王都で討伐隊に志願';return '旧石門の最奥にいる番兵を倒す';}
