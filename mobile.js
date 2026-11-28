// Keep the same collection, consent and receipt flow on small screens.
const phoneLayout = matchMedia('(max-width: 700px), (pointer: coarse) and (max-width: 1000px) and (max-height: 600px)');
document.documentElement.classList.toggle('phone', phoneLayout.matches);
(() => {
  const en = (zh, english) => lang === 'en' ? english : zh;
  const mobileTemplate = (original, small) => () => phoneLayout.matches ? small() : original();
  const link = (zh, english, action, color) => btn(en(zh, english), action, color);
  const key = (kind, action, zh, english) =>
    `<button type="button" class="art-key ${kind}" data-act="${action}"><span>${en(zh,english)}</span></button>`;
  const home = () => `<section class="scene phone-cover">
    <div class="art-board flip-board">
      <img src="assets/mobile-flip.webp" width="941" height="1671" alt="${en('彩色像素翻盖手机','Colourful pixel-art flip phone')}">
      <div class="flip-screen"><h1>${en('记忆来信','Memory Letters')}</h1><strong>ROOM 302</strong><p>${en('让一件旧物，打开一段记忆。','Let an old object open a memory.')}</p></div>
      ${key('key-a','go:lobby','进入旅馆','Enter hotel')}${key('key-b','enter:writer','写一封来信','Write a letter')}
      ${key('key-c','go:cinema','观看动画','Watch film')}${key('key-d','drafts','我的草稿','My drafts')}
    </div></section>`;
  bootHTML = mobileTemplate(bootHTML, home);
  desktopHTML = mobileTemplate(desktopHTML, home);
  lobbyHTML = mobileTemplate(lobbyHTML, () => `<section class="scene phone-hotel">
    <div class="hotel-nav">${back('boot')}<h1>${en('记忆客厅','Memory room')}</h1></div>
    <div class="art-board hotel-board">
      <img src="assets/mobile-hotel.webp" width="941" height="1672" alt="${en('贝利维坐在旅馆沙发上，两扇门之间有一台电视','Bellevue on the hotel sofa, with a television between two doors')}">
      ${key('room-toys','enter:toy','玩具收藏室','Toy room')}${key('room-film','go:cinema','观看动画','Watch film')}${key('room-write','enter:writer','写一封来信','Write a letter')}
      ${key('key-a','go:story','项目故事图文册','Storybook')}${key('key-b','drafts','我的草稿','My drafts')}
      ${key('key-c','go:learn','了解与学习','Learn more')}${key('key-d','reading','阅读角','Reading corner')}
    </div></section>`);
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
