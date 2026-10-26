const MAP_KEYS={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',Enter:'A',' ':'A',z:'A',Escape:'B',Backspace:'B',x:'X',y:'Y'};
export function bindInput(game){
  const held=new Set();
  const pointers=new Map();
  function setDown(key,el,id){
    if(key==='up'||key==='down'||key==='left'||key==='right'){
      if(game.state.mode==='explore')held.add(key);
      else game.action(key);
    }else game.action(key);
    el?.classList.add('pressed');if(id!==undefined)pointers.set(id,{key,el});
  }
  function clear(id){const entry=pointers.get(id);if(!entry)return;pointers.delete(id);entry.el.classList.remove('pressed');
    if(![...pointers.values()].some(v=>v.key===entry.key))held.delete(entry.key);
  }
  document.querySelectorAll('[data-dir],[data-key]').forEach(btn=>{
    const key=btn.dataset.dir||btn.dataset.key;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);setDown(key,btn,e.pointerId);});
    btn.addEventListener('pointerup',e=>{e.preventDefault();clear(e.pointerId);});
    btn.addEventListener('pointercancel',e=>clear(e.pointerId));
    btn.addEventListener('lostpointercapture',e=>clear(e.pointerId));
    btn.addEventListener('contextmenu',e=>e.preventDefault());
  });
  const keyboardHeld=new Set();
  window.addEventListener('keydown',e=>{
    const key=MAP_KEYS[e.key]||MAP_KEYS[e.key.toLowerCase?.()];if(!key)return;
    e.preventDefault();
    if(keyboardHeld.has(key))return;
    keyboardHeld.add(key);setDown(key,null);
  });
  window.addEventListener('keyup',e=>{
    const key=MAP_KEYS[e.key]||MAP_KEYS[e.key.toLowerCase?.()];if(!key)return;
    keyboardHeld.delete(key);
    if(![...pointers.values()].some(v=>v.key===key))held.delete(key);
  });
  window.addEventListener('blur',()=>{keyboardHeld.clear();held.clear();for(const v of pointers.values())v.el.classList.remove('pressed');pointers.clear();});
  game.getAxis=()=>({x:Number(held.has('right'))-Number(held.has('left')),y:Number(held.has('down'))-Number(held.has('up'))});
}
