/* Only navigation, explicit clipboard actions and the game rectangle cross the local bridge. */
(() => {
  let browserFrame = null;
  let browserReady = false;
  function send(type, extra={}) {
    if (window.ipc) { window.ipc.postMessage(JSON.stringify({type,lang,...extra})); return; }
    if(type==='game_rect' && browserFrame) {
      Object.assign(browserFrame.style,{left:extra.x+'px',top:extra.y+'px',width:extra.width+'px',height:extra.height+'px'});return;
    }
    if(type==='language') { if(browserReady) browserFrame.contentWindow.room302Command('language',lang); return; }
    if(type==='page') { pauseBrowser(); return; }
    if(type==='pause') { pauseBrowser(); return; }
    if(type==='play') {
      if(!browserFrame) {
        browserFrame=document.createElement('iframe');
        browserFrame.title='ROOM 302 playable game';browserFrame.src='game/index.html';
        browserFrame.allow='autoplay; fullscreen';
        Object.assign(browserFrame.style,{position:'fixed',border:'0',zIndex:'20',visibility:'hidden',background:'#211b26'});
        document.body.append(browserFrame);reportRect();
        const button=document.getElementById('game-play');button.disabled=true;button.textContent=lang==='en'?'Loading game…':'游戏加载中…';
        return;
      }
      if(!browserReady)return;
      browserFrame.style.visibility='visible';browserFrame.contentWindow.focus();
      browserFrame.contentWindow.room302Command('language',lang);
      browserFrame.contentWindow.room302Command('play');setPlaying(true);return;
    }
    if(type==='copy')navigator.clipboard?.writeText(extra.text).catch(()=>message(lang==='en'?'Please copy the selected text manually':'请选中文字后手动复制'));
    if(type==='paste')navigator.clipboard?.readText().then(window.room302.pasteText).catch(()=>message(lang==='en'?'Use the browser paste command':'请使用浏览器粘贴命令'));
  }
  function pauseBrowser() {
    if(browserReady)browserFrame.contentWindow.room302Command('pause');
    if(browserFrame)browserFrame.style.visibility='hidden';
    setPlaying(false);
  }
  window.addEventListener('message',event=>{
    if(!browserFrame || event.source!==browserFrame.contentWindow || event.origin!==location.origin)return;
    if(event.data?.type==='room302-ready') {
      browserReady=true;
      const button=document.getElementById('game-play');if(button){button.disabled=false;button.textContent=lang==='en'?'Start exploring':'开始探索';}
      const note=document.querySelector('#game-start-cover p');if(note)note.textContent=lang==='en'?'Loaded · Click to enter the room':'加载完成 · 点击进入房间';
    }
    if(event.data?.type==='room302-pause')pauseBrowser();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!window.ipc)pauseBrowser()});
  const originalRender = render;
  let pasteTarget = null;
  let playing = false;
  let gameStarted = false;
  const controls = [
    ['W A S D','移动','Move'],['Shift','奔跑','Run'],['C','蹲下','Crouch'],
    ['E','互动 / 开门','Interact / open'],['F','呼唤小狗','Call Bellevue'],['鼠标 · Esc','转动视角 · 释放鼠标','Look · release mouse']
  ];
  demoHTML = function() {
    return `<section id="demo" class="scene screen embedded-demo">
      <div id="game-aperture" class="game-aperture" aria-label="${lang==='en'?'Playable ROOM 302 game':'ROOM 302 可玩游戏'}"></div>
      <div class="topline">${back()}<h1 class="scene-title">${lang==='en'?'ROOM 302 · Play the memory':'ROOM 302 · 走进记忆'}</h1></div>
      <aside class="game-guide"><span class="game-kicker">ROOM 302</span><h2>${lang==='en'?'A little room.<br>A memory to find.':'一间小屋，<br>一段待寻的记忆。'}</h2><p>${lang==='en'?'Explore with Bellevue. Open doors and follow the toys to their memories.':'跟着贝利维慢慢探索。打开门，寻找旧玩具，让回忆在电视里亮起。'}</p></aside>
      ${dog(A.film,'demo-dog','game-guide-dog','放映室里的贝利维')}
      <div class="game-frame" aria-hidden="true"></div>
      <div id="game-start-cover" class="game-start-cover"><button type="button" class="btn pink" id="game-play">${lang==='en'?'Start exploring':'开始探索'}</button><p>${lang==='en'?'Click to play · Esc returns the cursor':'点击进入操作 · Esc 释放鼠标'}</p></div>
      <div class="game-caption"><span id="game-play-status">${lang==='en'?'Ready when you are':'准备好了就出发吧'}</span><button type="button" id="game-pause">${lang==='en'?'Pause / release cursor':'暂停 / 释放鼠标'}</button></div>
      <div class="game-control-cards" aria-label="${lang==='en'?'Game controls':'游戏操作提示'}">${controls.map((c,i)=>`<div class="game-control-card"><span class="control-art control-${i}" role="img" aria-label="${c[0]}"></span><strong>${lang==='en'?c[2]:c[1]}</strong></div>`).join('')}</div>
    </section>`;
  };
  function fitDialogue() {
    const bubble = document.querySelector(".bubble-next");
    if (!bubble) return;
    bubble.style.fontSize = "1.35cqw";
    let size = parseFloat(getComputedStyle(bubble).fontSize);
    while (bubble.scrollHeight > bubble.clientHeight + 1 && size > 7) {
      size -= 0.25; bubble.style.fontSize = size + "px";
    }
  }
  function reportRect() {
    fitDialogue();
    const aperture = document.getElementById('game-aperture');
    if (!aperture) return;
    const r = aperture.getBoundingClientRect();
    send('game_rect',{x:r.x,y:r.y,width:r.width,height:r.height,vw:innerWidth,vh:innerHeight});
  }
  function setPlaying(value) {
    playing = !!value;
    if (playing) gameStarted = true;
    const cover = document.getElementById('game-start-cover');
    if (cover) cover.hidden = playing;
    const play = document.getElementById('game-play');
    if (play) play.textContent = lang==='en' ? (gameStarted?'Continue exploring':'Start exploring') : (gameStarted?'继续探索':'开始探索');
    const status = document.getElementById('game-play-status');
    if (status) status.textContent = lang==='en' ? (playing?'Exploring · Esc releases the cursor':'Paused · your place is kept') : (playing?'探索中 · Esc 释放鼠标':'已暂停 · 保留当前位置');
  }
  render = function() {
    document.body.classList.toggle('showing-game',scene==='demo');
    document.documentElement.classList.toggle('showing-game',scene==='demo');
    originalRender();
    requestAnimationFrame(fitDialogue);
    send('language');
    send('page',{page:scene});
    if (scene==='demo') {
      document.getElementById('game-play').onclick=()=>send('play');
      document.getElementById('game-aperture').onclick=()=>send('play');
      document.getElementById('game-pause').onclick=()=>send('pause');
      setPlaying(false);
      requestAnimationFrame(reportRect);
    }
    if (scene === 'writer') {
      const paste = document.createElement('button');
      paste.type='button'; paste.className='tool';
      paste.innerHTML='<span class="sprite sprite-folder" aria-hidden="true"></span><span>'+(lang==='en'?'Paste':'粘贴')+'</span>';
      paste.title=lang==='en'?'Paste from clipboard':'从剪贴板粘贴';
      paste.addEventListener('pointerdown',e=>{e.preventDefault();pasteTarget=document.activeElement;rememberSelection();});
      paste.addEventListener('click',()=>send('paste'));
      stage.querySelector('.toolbar .row:nth-child(2)').append(paste);
    }
  };
  setupDemo=function(){};
  stage.addEventListener('click',e=>{
    const action=e.target.closest('[data-act]')?.dataset.act;
    if(action==='talk') requestAnimationFrame(fitDialogue);
    if(action==='copy-text'){
      e.preventDefault();e.stopImmediatePropagation();capture();
      send('copy',{text:current.title+'\n'+draftTopic(current)+'\n\n'+(document.getElementById('editor')?.innerText||'')});
    }
  },true);
  document.addEventListener('keydown',e=>{
    if(scene==='demo'&&e.key==='Escape'){
      e.preventDefault();e.stopImmediatePropagation();send('pause');return;
    }
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='v'&&scene==='writer'){
      e.preventDefault();e.stopImmediatePropagation();pasteTarget=document.activeElement;rememberSelection();send('paste');
    }
  },true);
  window.room302={
    setPlaying,
    pasteText(text){
      if(scene!=='writer')return;
      if(pasteTarget?.id==='writer-title'){
        pasteTarget.focus();pasteTarget.setRangeText(text,pasteTarget.selectionStart,pasteTarget.selectionEnd,'end');pasteTarget.dispatchEvent(new Event('input',{bubbles:true}));
      }else{
        restoreSelection();document.execCommand('insertText',false,text);dirty=true;capture();document.getElementById('editor').dispatchEvent(new Event('input',{bubbles:true}));
      }
    }
  };
  new ResizeObserver(reportRect).observe(stage);
  window.addEventListener('resize',reportRect);
  if (location.hash === '#game') scene = 'demo';
  if (location.hash === '#animation') scene = 'cinema';
  render();
})();
