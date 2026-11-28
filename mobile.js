// Keep the same collection, consent and receipt flow on small screens.
const phoneLayout = matchMedia('(max-width: 700px), (pointer: coarse) and (max-width: 1000px) and (max-height: 600px)');
document.documentElement.classList.toggle('phone', phoneLayout.matches);
(() => {
  const en = (zh, english) => lang === 'en' ? english : zh;
  const mobileTemplate = (original, small) => () => phoneLayout.matches ? small() : original();
  const link = (zh, english, action, color) => btn(en(zh, english), action, color);
  const write = () => link('写一封记忆来信','Write a memory','enter:writer','pink');
  const film = () => link('观看动画','Watch the animation','go:cinema','white');
  bootHTML = mobileTemplate(bootHTML, () => `<section class="scene phone-home">
    <div class="phone-computer"><img src="assets/MAHbXHvJMhk.png" alt="${en('手绘复古电脑','Hand-drawn vintage computer')}"></div>
    <h1>${en('记忆来信','Memory Letters')} <small>ROOM 302</small></h1>
    <p>${en('让一件旧物，打开一段记忆。','Let an old object open a memory.')}</p>
    <div class="phone-actions">${write()}${film()}${link('进入记忆房间','Enter the memory room','go:desktop','yellow')}</div></section>`);
  const menu = (isLobby) => `<section class="scene phone-menu"><div class="topline">${back(isLobby?'desktop':'boot')}<h1 class="scene-title">${isLobby?en('记忆客厅','Memory room'):en('电脑桌面','Desktop')}</h1></div>
    <img class="phone-room-art" src="${A.hall}" alt="${en('贝利维的旅馆客厅','Bellevue’s hotel living room')}"><div class="phone-actions">
    ${write()}${film()}${isLobby?link('玩具收藏室','Toy collection','enter:toy','yellow'):link('进入旅馆','Enter the hotel','go:lobby','yellow')}
    ${link('项目故事图文册','Project storybook','go:story','white')}${link('我的草稿','My drafts','drafts','white')}${link('了解与学习','Learn more','go:learn','white')}
    ${isLobby?link('阅读角','Reading corner','reading','white'):''}</div></section>`;
  desktopHTML = mobileTemplate(desktopHTML, () => menu(false));
  lobbyHTML = mobileTemplate(lobbyHTML, () => menu(true));
  writerHTML = mobileTemplate(writerHTML, () => `<section id="writer" class="scene phone-writer">
    <div class="topline">${back()}<h1 class="scene-title">${en('写一封来信','Write a memory')}</h1></div>
    <div class="phone-paper" id="writer-paper"><label for="writer-title">${en('标题（选填）','Title (optional)')}</label>
    <input id="writer-title" maxlength="300" value="${esc(current?.title||'')}" placeholder="${en('给记忆起个名字','Give your memory a name')}">
    <strong id="body-label">${en('故事正文','Your story')}</strong>
    <div id="editor" class="editor" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="body-label" data-placeholder="${en('从一个画面、一件旧物，或一句话写起……','Start with an image, an old object, or a few words…')}">${current?.html||''}</div>
    <div class="phone-edit-tools">${link('添加照片','Add photo','insert-image','white')}${link('移除末张照片','Remove last photo','phone-remove-image','white')}<span id="word-count"></span></div></div>
    <input type="file" id="writer-image-file" accept="image/*" hidden>
    <p id="status" role="status" aria-live="polite"></p><div class="phone-write-actions">${link('存草稿','Save draft','save-writer','white')}${link('正式投稿','Submit story','submit-story','pink')}</div>
    <p class="note">${en('草稿仅在当前页面保留。收到投稿编号，才表示已送达作者。','Drafts last only in this page. Your receipt confirms delivery.')}</p></section>`);
  stage.addEventListener('click', e => {
    if (!e.target.closest('[data-act="phone-remove-image"]')) return;
    const editor = document.getElementById('editor');
    const photo = Array.from(editor.querySelectorAll('img')).pop();
    if (!photo) return message(en('正文中没有照片。','No photo in the story.'));
    if (photo.src === current.image) { current.image=''; toyPhoto=''; }
    photo.remove(); editor.dispatchEvent(new Event('input')); capture();
  });
  const desktopImage = loadImage;
  loadImage = async function(file, done) {
    if (!phoneLayout.matches || !file) return desktopImage(file, done);
    const draft = current, from = scene;
    if (from==='writer' && new Set([draft?.image,...Array.from(document.querySelectorAll('#editor img'),img=>img.src)].filter(Boolean)).size>=2) {
      return message(en('每封来信最多附两张照片，可先移除一张。','Remove a photo before adding another (two per letter).'));
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src=url; await img.decode();
      const ratio = Math.min(1, 1440 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
      const ctx = canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const data = canvas.toDataURL('image/jpeg',0.78);
      if (data.length>3500000) throw Error('size');
      if (current===draft && from===scene) done(data);
    } catch { if (current===draft && from===scene) message(en('无法读取这张照片，请试试较小的 JPG 或 PNG。','Try a smaller JPG or PNG photo.')); }
    finally { URL.revokeObjectURL(url); }
  };
  let previousScene = scene;
  const ordinaryRender = render;
  render = function() {
    if (phoneLayout.matches && scene==='demo') scene='cinema';
    ordinaryRender();
    if (phoneLayout.matches && previousScene !== scene) window.scrollTo(0,0);
    previousScene=scene;
  };
  phoneLayout.addEventListener('change', () => {
    // Do not discard live input, a consent dialog, or a pending receipt on rotation.
    capture();
    document.documentElement.classList.toggle('phone', phoneLayout.matches);
    if (!modal && !document.getElementById('submission-dialog')?.open) render();
  });
})();
