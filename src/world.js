import {MAPS,MAP_NAMES,WALKABLE,DIRS} from './data.js';
import {startBattle} from './battle.js';

function walkable(map,x,y,r=0.27){
  for(const dy of [-r,r])for(const dx of [-r,r]){
    const tx=Math.floor(x+dx),ty=Math.floor(y+dy);
    if(!WALKABLE.has(map.tiles[ty]?.[tx]))return false;
  }
  return true;
}
export function movePlayer(game,dx,dy,dt){
  const s=game.state,p=s.player,m=MAPS[s.map];
  if(!dx&&!dy)return;
  const len=Math.hypot(dx,dy);dx/=len;dy/=len;
  if(Math.abs(dx)>Math.abs(dy))p.face=dx>0?'right':'left';
  else p.face=dy>0?'down':'up';
  const speed=s.map==='world'?4.5:4.1;
  const dist=Math.min(0.25,speed*dt),prevX=p.x,prevY=p.y;
  if(walkable(m,p.x+dx*dist,p.y))p.x+=dx*dist;
  if(walkable(m,p.x,p.y+dy*dist))p.y+=dy*dist;
  const traveled=Math.hypot(p.x-prevX,p.y-prevY);
  p.walk+=traveled*2.6;
  if(!traveled)return;
  s.encounterDist+=traveled;
  game.cameraTarget={x:p.x,y:p.y};
  if(s.transitionLock<=0&&checkPortals(game))return;
  const danger=s.map==='world'||s.map==='dungeon';
  if(danger&&s.flags.elder&&!s.flags.boss&&s.encounterDist>=s.encounterNext){
    s.encounterDist=0;s.encounterNext=(s.map==='world'?18:12)+Math.random()*11;
    const enemy=s.map==='dungeon'?(Math.random()<.6?'bat':'armor'):(Math.random()<.55?'slime':'wolf');
    if(!s.flags.firstEncounter){
      s.flags.firstEncounter=true;
      game.save();
      game.say(['草むらが揺れた。魔物が飛び出してきた！','戦闘では「こうげき」「特技」「道具」「ぼうぎょ」を選べる。','HPが減ったら道具か「気合」で回復しよう。'],()=>startBattle(game,enemy));
    }else startBattle(game,enemy);
  }
}
export function updateWorld(game,dt){
  const s=game.state;
  if(s.transitionLock>0)s.transitionLock=Math.max(0,s.transitionLock-dt);
  const axis=game.getAxis();
  movePlayer(game,axis.x,axis.y,dt);
}
function checkPortals(game){
  const s=game.state,p=s.player;
  for(const portal of MAPS[s.map].portals){
    if(Math.hypot(portal.x-p.x,portal.y-p.y)>portal.r)continue;
    if(portal.requires&&!s.flags[portal.requires]){
      // 閉じた出口上に立っても、メッセージは連続表示しない。
      s.transitionLock=1.2;
      game.toast(portal.requires==='elder'?'まず生存者の話を聞こう':'隊長に志願してから入ろう');
      return false;
    }
    enterMap(game,portal.to,portal.spawn);return true;
  }
  return false;
}
export function enterMap(game,id,spawn){
  const s=game.state;
  s.map=id;s.player.x=spawn[0];s.player.y=spawn[1];s.player.face='down';
  s.transitionLock=1.2;s.encounterDist=0;s.encounterNext=(id==='world'?18:12)+Math.random()*9;
  game.snapCamera();game.save();game.refresh();
  game.toast(MAP_NAMES[id]);
  if(id==='world'&&!s.flags.worldSeen){
    s.flags.worldSeen=true;game.save();
    game.say(['村の外には、焼け落ちたものとは違う景色が広がっている。','世界地図では村や王都のシンボルに触れると、その土地へ入れる。','草地や森では魔物との戦闘が起こる。']);
  }
  if(id==='capital'&&!s.flags.capitalSeen){
    s.flags.capitalSeen=true;game.save();
    game.say(['王都アステル。人々が集う大きな城下町。','広場の北側で討伐隊が志願者を募っている。','鍛冶屋で装備を買い、Xメニューの「装備」から身につけられる。']);
  }
  if(id==='dungeon'&&!s.flags.dungeonSeen){
    s.flags.dungeonSeen=true;game.save();
    game.say(['旧石門――討伐隊への入隊試練。','隊長バルド「最奥に潜む番兵を討て。命を落とすなよ。」']);
  }
}
export function interact(game){
  const s=game.state,p=s.player,m=MAPS[s.map];
  let nearest=null,nearestDistance=1.65;
  for(const n of m.npcs){
    if(n.id==='boss'&&s.flags.boss)continue;
    const d=Math.hypot(n.x-p.x,n.y-p.y);
    if(d<nearestDistance){nearest=n;nearestDistance=d;}
  }
  for(const mark of m.marks){
    if(mark.kind==='chest'&&s.flags.chest)continue;
    if(!['chest','camp'].includes(mark.kind))continue;
    const d=Math.hypot(mark.x-p.x,mark.y-p.y);
    if(d<nearestDistance){nearest={id:'chest'};nearestDistance=d;}
  }
  if(!nearest){game.toast('近くに話せる人や調べるものはない');return;}
  switch(nearest.id){
    case 'elder':
      if(!s.flags.elder){
        game.say(['ミラ「……レオン、あなたが生きていてよかった。」',
          'ミラ「王都では魔物討伐隊の志願者を探しているそうよ。」',
          'レオン「俺も行く。この村で失ったものの意味を、確かめたい。」',
          'ミラ「東の出口から、王都アステルを目指して。」'],()=>{s.flags.elder=true;game.save();game.refresh();});
      }else game.say(['ミラ「無理はしないで。王都なら、きっと助けてくれる人がいるはず。」']);
      break;
    case 'survivor':game.say(['生存者「夜になると、まだ炎の音が聞こえる気がするんだ。」','生存者「おまえは先へ進め。俺たちのことは気にするな。」']);break;
    case 'captain':
      if(!s.flags.captain)game.say(['隊長バルド「討伐隊に入るだと？ その目に覚悟はあるようだな。」',
        '隊長バルド「北門の先、旧石門の番兵を倒せ。生きて戻れば入隊を認めよう。」',
        'レオン「分かりました。必ず戻ります。」'],()=>{s.flags.captain=true;game.save();game.refresh();});
      else if(!s.flags.boss)game.say(['隊長バルド「北門から旧石門へ向かえ。」「己の剣と、備えた装備を信じろ。」']);
      else game.say(['隊長バルド「見事だった。今日からおまえは討伐隊の一員だ。」']);
      break;
    case 'smith':game.openShop('smith');break;
    case 'healer':game.openShop('healer');break;
    case 'recruit':game.say(['志願兵「剣や鎧を買うだけじゃ強くなれないぜ。」',
        '志願兵「Xのメニューで『装備』を選んで、ちゃんと装備しろよ。」',
        '志願兵「戦闘中、相手が弱ると見た目が変わるらしいぞ。」']);break;
    case 'camp':
      if(!s.flags.campRested){
        s.flags.campRested=true;s.hero.hp=Math.min(s.hero.maxHp,s.hero.hp+18);
        s.hero.mp=Math.min(s.hero.maxMp,s.hero.mp+5);game.save();
        game.say(['道端には小さな焚き火の跡があった。まだ温もりが残っている。',
          'レオンは少し休んだ。HPが18、MPが5回復した。',
          '「王都はもう遠くない。先へ進もう。」']);
      }else game.say(['消えかけた焚き火が静かにくすぶっている。']);
      break;
    case 'chest':
      s.flags.chest=true;s.hero.inventory.ironSword=(s.hero.inventory.ironSword||0)+1;
      game.save();game.say(['宝箱から「鉄の剣」を手に入れた！','Xメニュー → 装備 で、入手した武器を装備できる。']);break;
    case 'boss':
      game.say(['石門の奥から、重い足音が響く。','石門の番兵「……試練に挑む者よ。力を示せ。」'],()=>startBattle(game,'boss'));break;
  }
}
