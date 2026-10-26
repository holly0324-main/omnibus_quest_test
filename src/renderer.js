import {MAPS,TILE,MAP_NAMES,ENEMIES} from './data.js';
const WIDTH=320,HEIGHT=360;
const T=TILE;
const palette={grass:'#557a53',tallgrass:'#48724c',forest:'#34593e',trees:'#244c39',ash:'#676c61',path:'#ae9470',dirt:'#aa9568',roof:'#755759',wall:'#89817d',door:'#7e5837',rubble:'#524c51',mountain:'#6a7480',water:'#396d95',stone:'#9c9488',pave:'#c7b39a',flower:'#a5aa87',floor:'#585968',rock:'#373849',fountain:'#537c8e'};
const hash=(x,y)=>((x*73856093^y*19349663)>>>0);
function rect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function tile(ctx,type,x,y,tx,ty,sec){
  const n=hash(tx,ty)%5;
  rect(ctx,x,y,16,16,palette[type]||'#182234');
  switch(type){
  case 'grass':case 'tallgrass':
    rect(ctx,x+n+2,y+4,2,4,type==='grass'?'#689363':'#5d9857');
    rect(ctx,x+10,y+11,3,2,'#3c6844');
    if(type==='tallgrass'){rect(ctx,x+6,y+7,2,6,'#2f6a37');rect(ctx,x+12,y+2,2,7,'#699d63');}break;
  case 'forest':case 'trees':
    rect(ctx,x+6,y+11,4,5,'#4e422f');rect(ctx,x+1,y+4,14,10,'#223f32');rect(ctx,x+3,y+1,10,10,'#346748');rect(ctx,x+4,y+3,4,3,'#538b5d');break;
  case 'path':case 'dirt':
    rect(ctx,x+n*2+1,y+4,3,2,'#8d795e');rect(ctx,x+9,y+12,2,2,'#c9ae7b');break;
  case 'ash':rect(ctx,x+5,y+8,8,2,'#3f4544');rect(ctx,x+3,y+11,3,3,'#a08370');break;
  case 'roof':rect(ctx,x,y,16,3,'#a88777');rect(ctx,x+1,y+6,14,2,'#503a40');rect(ctx,x+2,y+12,13,2,'#8b6a62');break;
  case 'wall':rect(ctx,x,y,16,3,'#514e50');rect(ctx,x+3,y+6,5,6,'#514949');rect(ctx,x+5,y+7,2,3,'#dec997');break;
  case 'door':rect(ctx,x,y,16,16,'#877967');rect(ctx,x+3,y+2,10,14,'#4f352e');rect(ctx,x+11,y+10,2,2,'#e1bb73');break;
  case 'rubble':rect(ctx,x+2,y+8,12,7,'#4d4850');rect(ctx,x+4,y+5,9,4,'#978071');break;
  case 'stone':case 'pave':
    rect(ctx,x,y+7,16,1,type==='stone'?'#7e756c':'#9f9284');
    rect(ctx,x+(ty%2?4:10),y+8,1,7,'#94877a');break;
  case 'flower':rect(ctx,x+6,y+7,2,5,'#4b7e4b');rect(ctx,x+4,y+5,6,4,n%2?'#dfaa78':'#f5d79a');break;
  case 'mountain':rect(ctx,x+1,y+13,14,3,'#485663');rect(ctx,x+3,y+8,12,5,'#7e8791');rect(ctx,x+7,y+2,5,9,'#c5c9c7');break;
  case 'water':rect(ctx,x+1,y+5,8,2,'#629dbb');rect(ctx,x+9,y+12,6,2,'#88baca');break;
  case 'fountain':rect(ctx,x+1,y+1,14,14,'#416374');rect(ctx,x+4,y+3,8,7,'#7ab8c2');rect(ctx,x+7,y+1,2,12,'#b6d1c2');break;
  case 'floor':rect(ctx,x+(n%3)*5,y+10,4,1,'#6f6e7b');rect(ctx,x+8,y+1,1,7,'#484b5d');break;
  case 'rock':rect(ctx,x+2,y+2,13,13,'#282c3b');rect(ctx,x+4,y+3,5,4,'#525464');rect(ctx,x+8,y+10,7,2,'#474453');break;
  }
}
function character(ctx,x,y,palette,dir='down',walk=0){
  const bounce=Math.floor(walk)%2;
  const px=Math.round(x-7),py=Math.round(y-14-bounce);
  rect(ctx,px+3,py+14,12,3,'#17202ca8');
  rect(ctx,px+4,py+1,8,5,palette.hair||'#49372d');
  rect(ctx,px+3,py+5,10,7,palette.skin||'#e2bc96');
  if(dir==='down'){rect(ctx,px+5,py+7,2,2,'#233047');rect(ctx,px+10,py+7,2,2,'#233047');}
  if(dir==='left')rect(ctx,px+3,py+7,2,2,'#1c2d45');
  if(dir==='right')rect(ctx,px+11,py+7,2,2,'#1c2d45');
  rect(ctx,px+2,py+12,12,7,palette.shirt||'#456a93');
  rect(ctx,px+4,py+18,3,4,'#323541');rect(ctx,px+10,py+18,3,4,'#323541');
  rect(ctx,px,py+13,3,5,palette.skin||'#e1bd96');rect(ctx,px+14,py+13,3,5,palette.skin||'#e1bd96');
  rect(ctx,px+12,py+10,2,8,'#ad8d56');
}
function npc(ctx,n,camera){
  if(n.id==='boss'){
    const x=n.x*T-camera.x,y=n.y*T-camera.y;
    rect(ctx,x-11,y-16,23,25,'#363847');rect(ctx,x-7,y-22,15,14,'#788a94');
    rect(ctx,x-4,y-17,9,3,'#c8b7a6');rect(ctx,x-7,y-10,5,12,'#879dab');rect(ctx,x+4,y-10,5,12,'#879dab');
  }else character(ctx,n.x*T-camera.x,n.y*T-camera.y,{shirt:n.color,hair:'#4f4138'},'down',0);
}
function mark(ctx,m,camera){
  const x=Math.round(m.x*T-camera.x),y=Math.round(m.y*T-camera.y);
  if(m.kind==='camp'){
    rect(ctx,x-15,y-6,28,16,'#6a6b55');rect(ctx,x-10,y-16,16,16,'#b9a77f');
    rect(ctx,x-3,y-16,5,20,'#5a6054');rect(ctx,x+13,y+3,6,8,'#ebad5c');
  }else if(m.kind==='chest'){
    rect(ctx,x-10,y-7,20,12,'#623f31');rect(ctx,x-11,y-10,22,6,'#b68b4c');
    rect(ctx,x-2,y-9,5,11,'#edd8a6');return;
  }
  if(m.kind==='camp'){ctx.textAlign='center';ctx.font='bold 9px sans-serif';ctx.fillStyle='#f6e3b8';ctx.fillText('旅人の野営地',x,y+24);return;}
  rect(ctx,x-18,y-15,36,28,'#2f342e');
  rect(ctx,x-20,y-18,40,6,m.kind==='capital'?'#91879a':'#9d635a');
  rect(ctx,x-12,y-10,24,20,m.kind==='capital'?'#c6b8a9':'#aa8c70');
  rect(ctx,x-4,y+1,9,12,'#433633');
  if(m.kind==='capital')rect(ctx,x-7,y-20,15,6,'#61759c');
  // シンボル名はカメラに関係なく影つきで読みやすくする。
  ctx.textAlign='center';ctx.font='bold 10px sans-serif';ctx.fillStyle='#102232';ctx.fillText(m.label,x+1,y+30);
  ctx.fillStyle='#fff2cc';ctx.fillText(m.label,x,y+29);
}
function drawMap(game,ctx){
  const s=game.state,m=MAPS[s.map],p=s.player;
  const maxX=m.w*T-WIDTH,maxY=m.h*T-HEIGHT;
  const cam=game.camera;
  const wantedX=Math.max(0,Math.min(maxX,p.x*T-WIDTH/2));
  const wantedY=Math.max(0,Math.min(maxY,p.y*T-HEIGHT/2));
  if(!cam.ready){cam.x=wantedX;cam.y=wantedY;cam.ready=true;}
  else{cam.x+=(wantedX-cam.x)*.25;cam.y+=(wantedY-cam.y)*.25;}
  const startX=Math.max(0,Math.floor(cam.x/T)),endX=Math.min(m.w-1,Math.ceil((cam.x+WIDTH)/T));
  const startY=Math.max(0,Math.floor(cam.y/T)),endY=Math.min(m.h-1,Math.ceil((cam.y+HEIGHT)/T));
  for(let y=startY;y<=endY;y++)for(let x=startX;x<=endX;x++){
    tile(ctx,m.tiles[y][x],Math.round(x*T-cam.x),Math.round(y*T-cam.y),x,y);
  }
  // 北門／東出口の誘導サイン。
  if(s.map==='village'){
    const x=38*T-cam.x,y=16*T-cam.y;
    if(x<WIDTH&&x>-40){rect(ctx,x,y-10,3,23,'#68513f');rect(ctx,x-6,y-18,29,10,'#b69c72');}
  }
  if(s.map==='capital'){
    const x=27*T-cam.x,y=1*T-cam.y;rect(ctx,x-9,y+3,41,6,'#8f9eb3');
  }
  for(const mkr of m.marks){if(mkr.kind==='chest'&&s.flags.chest)continue;mark(ctx,mkr,cam);}
  const sprites=[...m.npcs.filter(n=>n.id!=='boss'||!s.flags.boss).map(n=>({y:n.y,fn:()=>npc(ctx,n,cam)})),
    {y:p.y,fn:()=>character(ctx,p.x*T-cam.x,p.y*T-cam.y,{shirt:'#477e9c',hair:'#513628',skin:'#f2c69e'},p.face,p.walk)}];
  sprites.sort((a,b)=>a.y-b.y).forEach(v=>v.fn());
  if(s.map==='world'){
    ctx.fillStyle='#142239c9';ctx.fillRect(8,HEIGHT-27,142,18);
    ctx.fillStyle='#fff1c8';ctx.font='bold 10px sans-serif';ctx.textAlign='left';ctx.fillText('◆ 集落・王都に触れて入る',14,HEIGHT-15);
  }
}
function monsterSprite(ctx,id,x,y,weak,white){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  const boss=id==='boss',bat=id==='bat',wolf=id==='wolf',armor=id==='armor';
  ctx.scale(boss?1.45:1.2,boss?1.45:1.2);
  const body=white?'#fff':weak?'#877c80':boss?'#8093a4':bat?'#74628c':wolf?'#a19379':armor?'#737f89':'#80a9a0';
  const dark=white?'#fff':weak?'#514b58':boss?'#435167':'#3c5864';
  // 複数のモンスターに固有の輪郭と表情を用意する。
  if(boss||armor){
    rect(ctx,-20,-40,40,15,dark);rect(ctx,-16,-48,32,22,body);
    rect(ctx,-21,-25,42,34,dark);rect(ctx,-15,-23,30,29,body);
    rect(ctx,-26,-22,11,26,body);rect(ctx,15,-22,11,26,body);
    rect(ctx,-13,8,10,18,dark);rect(ctx,4,8,10,18,dark);
    rect(ctx,24,-45,5,70,white?'#fff':'#d5bb8a');rect(ctx,21,-47,11,8,body);
    rect(ctx,-9,-35,6,4,weak?'#d86d65':'#f0c778');rect(ctx,4,-35,6,4,weak?'#d86d65':'#f0c778');
    rect(ctx,-5,-3,11,9,dark);
  }else if(bat){
    rect(ctx,-40,-20,20,15,dark);rect(ctx,20,-20,20,15,dark);
    rect(ctx,-30,-27,18,10,body);rect(ctx,12,-27,18,10,body);
    rect(ctx,-16,-30,32,41,body);rect(ctx,-13,-42,10,13,dark);rect(ctx,4,-42,10,13,dark);
    rect(ctx,-10,-12,6,5,weak?'#ae3b43':'#f7d68a');rect(ctx,4,-12,6,5,weak?'#ae3b43':'#f7d68a');
    rect(ctx,-5,0,10,5,dark);
  }else if(wolf){
    rect(ctx,-24,-15,49,26,body);rect(ctx,-27,-39,17,26,body);rect(ctx,10,-39,17,26,body);
    rect(ctx,-18,-27,36,26,body);rect(ctx,-18,12,10,15,dark);rect(ctx,9,12,10,15,dark);
    rect(ctx,-13,-13,7,6,weak?'#d14f5a':'#e8dfc3');rect(ctx,6,-13,7,6,weak?'#d14f5a':'#e8dfc3');
    rect(ctx,-4,2,9,7,dark);
  }else{
    rect(ctx,-23,-9,46,26,body);rect(ctx,-19,-24,38,24,body);
    rect(ctx,-13,-37,25,20,body);rect(ctx,-23,11,9,8,dark);rect(ctx,14,11,9,8,dark);
    rect(ctx,-13,-16,9,6,weak?'#c94d55':'#243e50');rect(ctx,6,-16,9,6,weak?'#c94d55':'#243e50');
    rect(ctx,-4,-6,9,4,dark);
  }
  if(weak&&!white){
    rect(ctx,-10,9,4,5,'#c45659');rect(ctx,5,15,4,4,'#c45659');
    rect(ctx,-20,-13,8,2,'#ba5c68');rect(ctx,12,-26,4,10,'#ba5c68');
    rect(ctx,-6,20,15,2,'#2d3440');
  }
  ctx.restore();
}
function drawBattle(game,ctx){
  const s=game.state,b=s.battle;
  rect(ctx,0,0,WIDTH,HEIGHT,'#151d2b');
  for(let i=0;i<16;i++)rect(ctx,i*25,50+i%4*13,18,HEIGHT-50-i%3*11,i%2?'#243249':'#1e2a40');
  rect(ctx,0,166,WIDTH,194,'#444c59');
  for(let y=178;y<360;y+=20)rect(ctx,(y%3)*4,y,WIDTH,2,'#343b4c');
  rect(ctx,136,181,137,8,'#222939');rect(ctx,48,197,72,5,'#262b36');
  // 敵HPは一切描画しない。40%以下で負傷差分を表示。
  const weak=b.hp/b.maxHp<=.42;
  const shaking=b.shake>0?Math.sin(b.shake*75)*3:0;
  const flashing=b.flash>0&&Math.floor(b.flash*19)%2===0;
  monsterSprite(ctx,b.id,200+shaking,135,weak,flashing);
  character(ctx,85,190,{shirt:'#426e9d',skin:'#dcb698',hair:'#4d2e30'},'right',0);
  rect(ctx,97,151,3,27,'#d2bc7e');rect(ctx,90,149,14,4,'#afbec6');
  if(b.phase==='anim'&&b.action){
    const t=b.elapsed,offense=b.action.kind==='attack'||(b.action.kind==='skill'&&b.action.key!=='rally');
    if(offense&&t>.08&&t<.5){
      const phase=(t-.08)/.42;
      ctx.strokeStyle='#fbe3a7';ctx.lineWidth=6;ctx.beginPath();
      ctx.arc(201,130,42,-2.7+phase*.65,-2.7+phase*3.9);ctx.stroke();
      ctx.strokeStyle='#f8f9ff';ctx.lineWidth=2;ctx.stroke();
      for(let i=0;i<6;i++){
        const a=i*2.39+t*9;
        rect(ctx,201+Math.cos(a)*38,129+Math.sin(a)*25,5,5,'#f7c36b');
      }
    }
    if(b.enemyDone&&t<1.35){
      ctx.strokeStyle='#f2a373';ctx.lineWidth=3;ctx.beginPath();ctx.arc(85,176,18,0,Math.PI*2);ctx.stroke();
    }
  }
  ctx.textAlign='center';ctx.font='bold 18px monospace';
  for(const f of b.floats){
    const yy=f.target==='enemy'?85:160;
    const xx=f.target==='enemy'?200:83;
    ctx.fillStyle='#0b162b';ctx.fillText(f.text,xx+2,yy-(1-f.time)*33+2);
    ctx.fillStyle=f.healing?'#93f5b6':'#ffe69e';ctx.fillText(f.text,xx,yy-(1-f.time)*33);
  }
  if(weak){ctx.textAlign='center';ctx.font='bold 11px sans-serif';ctx.fillStyle='#ffb59d';ctx.fillText('息も絶え絶えだ…',201,69);}
}
function drawTitle(ctx,ending=false){
  rect(ctx,0,0,WIDTH,HEIGHT,'#18283a');
  for(let y=0;y<HEIGHT;y+=8)rect(ctx,0,y,WIDTH,1,'#25394d');
  rect(ctx,0,215,WIDTH,145,'#343b43');
  for(let i=0;i<16;i++){const x=i*25+(i%3)*7,h=30+(i*29)%70;
    rect(ctx,x,217-h,20,h,'#4e5054');rect(ctx,x+7,217-h-10,8,10,'#594c4c');}
  rect(ctx,32,94,256,4,'#bd966f');rect(ctx,50,103,218,1,'#807c77');
  ctx.textAlign='center';ctx.fillStyle='#0b101b';ctx.font='bold 30px serif';ctx.fillText('灰燼の誓い',162,82);
  ctx.fillStyle='#f6daa3';ctx.fillText('灰燼の誓い',160,80);
  ctx.fillStyle='#b7cbce';ctx.font='bold 12px sans-serif';ctx.fillText(ending?'第一章　終章':'第一章　戦士と石門',160,119);
  character(ctx,158,238,{shirt:'#477e9e',skin:'#e7bd92',hair:'#4e352f'},'down',0);
  ctx.fillStyle='#ddd1c0';ctx.font='bold 10px sans-serif';ctx.fillText(ending?'TO BE CONTINUED':'CHAPTER I  /  A WARRIOR RISES',160,276);
}
export function draw(game){
  const ctx=game.ctx,s=game.state;
  ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  if(s.mode==='title'||s.mode==='ending')drawTitle(ctx,s.mode==='ending');
  else if(s.mode==='battle')drawBattle(game,ctx);
  else drawMap(game,ctx);
}
