import {ENEMIES,SKILLS,ITEMS,attackOf,defenseOf} from './data.js';

export function startBattle(game,id){
  const s=game.state,enemy=ENEMIES[id];
  s.mode='battle';
  s.battle={id,hp:enemy.hp,maxHp:enemy.hp,phase:'choose',page:'root',index:0,
    action:null,elapsed:0,resolved:false,enemyDone:false,defending:false,atkDebuff:0,
    flash:0,shake:0,floats:[],log:`${enemy.name}が あらわれた！`};
  game.refresh();
}
const jitter=n=>Math.floor(Math.random()*(n*2+1))-n;
export function doBattleAction(game,kind,key){
  const s=game.state,b=s.battle,h=s.hero;if(!b||b.phase!=='choose')return;
  let action={kind,key};
  if(kind==='skill'){
    const sk=SKILLS[key];
    if(h.level<sk.level){game.toast(`Lv${sk.level} で覚える`);return;}
    if(h.mp<sk.mp){game.toast('MPが足りない！');return;}
    if(key==='rally'&&h.hp===h.maxHp){game.toast('HPは満タンだ');return;}
    h.mp-=sk.mp;
  }
  if(kind==='item'){
    if(!h.inventory[key]){game.toast('持っていない！');return;}
    if(ITEMS[key]?.kind!=='use'){game.toast('戦闘では使えない');return;}
    if((key==='potion'&&h.hp===h.maxHp)||(key==='ether'&&h.mp===h.maxMp)){game.toast('まだ使う必要はない');return;}
    h.inventory[key]--;
  }
  b.phase='anim';b.page='root';b.action=action;b.elapsed=0;b.resolved=false;b.enemyDone=false;b.defending=kind==='guard';
  b.log=kind==='attack'?'レオンの攻撃！':kind==='guard'?'レオンは身を守った！':
    kind==='skill'?`レオンの「${SKILLS[key].name}」！`:`${ITEMS[key].name}を使った！`;
  game.refresh();
}
function float(b,text,target='enemy',healing=false){b.floats.push({text,target,healing,time:0.95});}
function resolvePlayer(game){
  const s=game.state,b=s.battle,h=s.hero,e=ENEMIES[b.id],a=b.action;
  if(a.kind==='attack'||(a.kind==='skill'&&a.key!=='rally')){
    let atk=attackOf(h)+jitter(3);
    if(a.key==='heavy')atk=Math.floor(atk*1.7);
    if(a.key==='guardBreak'){atk=Math.floor(atk*1.12);b.atkDebuff=3;}
    const dmg=Math.max(1,atk-(a.key==='guardBreak'?0:e.def));
    b.hp=Math.max(0,b.hp-dmg);b.flash=0.36;b.shake=0.3;
    float(b,`-${dmg}`);
    b.log=`${e.name}に ${dmg} ダメージ！`;
    if(a.key==='guardBreak')b.log+=' 敵の攻撃力が下がった！';
  }else if(a.kind==='skill'&&a.key==='rally'){
    const heal=Math.min(h.maxHp-h.hp,16);h.hp+=heal;float(b,`+${heal}`,'hero',true);b.log=`HPが ${heal} 回復した。`;
  }else if(a.kind==='item'){
    const heal=a.key==='potion'?Math.min(30,h.maxHp-h.hp):Math.min(8,h.maxMp-h.mp);
    if(a.key==='potion')h.hp+=heal;else h.mp+=heal;
    float(b,`+${heal}`,'hero',true);b.log=`${a.key==='potion'?'HP':'MP'}が ${heal} 回復した。`;
  }
  if(b.hp<=0){victory(game);return;}
  game.refresh();
}
function enemyTurn(game){
  const s=game.state,b=s.battle,h=s.hero,e=ENEMIES[b.id];
  const power=Math.max(1,e.atk-(b.atkDebuff>0?3:0)+jitter(2)-defenseOf(h));
  const dmg=Math.max(1,Math.floor(power*(b.defending?.5:1)));
  h.hp=Math.max(0,h.hp-dmg);float(b,`-${dmg}`,'hero');
  b.log=`${e.name}の反撃！ レオンは ${dmg} ダメージ！`;
  b.shake=0.2;
  if(b.atkDebuff>0)b.atkDebuff--;
  if(h.hp<=0){defeat(game);return;}
  game.refresh();
}
export function updateBattle(game,dt){
  const b=game.state.battle;if(!b)return;
  b.flash=Math.max(0,b.flash-dt);b.shake=Math.max(0,b.shake-dt);
  b.floats=b.floats.filter(f=>(f.time-=dt)>0);
  if(b.phase!=='anim')return;
  b.elapsed+=dt;
  if(!b.resolved&&b.elapsed>=0.38){b.resolved=true;resolvePlayer(game);}
  if(game.state.mode!=='battle')return;
  if(!b.enemyDone&&b.elapsed>=1.06){b.enemyDone=true;enemyTurn(game);}
  if(game.state.mode!=='battle')return;
  if(b.elapsed>=1.65){b.phase='choose';b.action=null;b.elapsed=0;b.page='root';b.index=0;game.save();game.refresh();}
}
function victory(game){
  const s=game.state,b=s.battle,e=ENEMIES[b.id],h=s.hero;
  h.gold+=e.gold;h.exp+=e.exp;
  const notes=[`${e.name}を倒した！`,`${e.exp} EXP と ${e.gold} G を獲得！`];
  const needed=lv=>14+(lv-1)*24;
  while(h.exp>=needed(h.level)){
    h.exp-=needed(h.level);h.level++;
    h.maxHp+=10;h.maxMp+=3;h.baseAtk+=2;h.baseDef+=1;
    h.hp=Math.min(h.maxHp,h.hp+18);h.mp=Math.min(h.maxMp,h.mp+5);
    notes.push(`レベル ${h.level} に上がった！ HP・MP・能力が上昇！`);
    if(h.level===2)notes.push('新たな特技「崩し斬り」を覚えた！');
  }
  s.battle=null;
  if(b.id==='boss'){
    s.flags.boss=true;game.save();
    game.say([...notes,'番兵は静かに膝をついた。石門の向こうから朝の光が差し込む。',
      'レオンは旧石門を抜け、王都へ帰還した。',
      '隊長バルド「よく戻った。レオン、これでおまえも討伐隊の一員だ。」',
      '焼けた故郷を背に、レオンの長い旅が始まる――'],()=>{s.mode='ending';game.save();game.refresh();});
  }else{game.save();game.say(notes);}
}
function defeat(game){
  const s=game.state;s.battle=null;
  s.hero.hp=Math.max(1,Math.ceil(s.hero.maxHp*.7));s.hero.mp=Math.max(2,Math.ceil(s.hero.maxMp*.5));
  s.hero.gold=Math.max(0,s.hero.gold-8);
  s.map=s.flags.captain?'capital':'village';
  s.player.x=s.map==='capital'?28.5:18.5;s.player.y=s.map==='capital'?38.5:22.5;
  s.transitionLock=1.5;s.encounterDist=0;game.snapCamera();game.save();
  game.say(['視界が暗くなった……。','気づくと、安全な場所で手当てを受けていた。','HPとMPが一部回復した。所持金を少し落としてしまった。']);
}
export function escapeBattle(game){
  const s=game.state,b=s.battle;
  if(!b||b.phase!=='choose')return;
  if(b.id==='boss'){game.toast('この戦いからは逃げられない！');return;}
  if(Math.random()<.72){s.battle=null;s.mode='explore';s.encounterDist=0;s.encounterNext=17;game.toast('逃げ切った！');game.refresh();}
  else{doBattleAction(game,'guard');game.toast('逃げられなかった！');}
}
