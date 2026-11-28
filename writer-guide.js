/* Bellevue's desktop writing guide. The existing toolbar owns all editing actions. */
const writerGuide = (() => {
  const steps = [
    {
      tools: '[data-act="new"], [data-act="drafts"], [data-act="save-writer"]',
      zh: '我是贝利维，陪你写这封信。「新页」另起一封，「存草稿」把这封留在当前页面，「打开草稿」可以接着写。',
      en: 'I’m Bellevue. New page starts a letter. Save draft keeps it in this tab. Open drafts lets you pick it up again.'
    },
    {
      tools: '[data-act="insert-image"], [data-act="border"], .toolbar .row:nth-child(2) > *',
      zh: '想贴张照片？点「插图」。「花边」给信纸加框。下排可以调字体、字号、粗细、颜色和对齐，也能粘贴文字。',
      en: 'Illustration adds a photo. Page border frames your letter. The lower row changes font, size, weight, colour and alignment, or pastes text.'
    },
    {
      tools: '[data-act="undo"], [data-act="redo"], [data-act="preview"], [data-act="copy-text"], .tool.exit',
      zh: '「撤销」退回上一步，「重做」恢复它。「预览」读一遍整封信，「导出：复制」留一份文字。「退出」回到客厅。',
      en: 'Undo takes a change back and Redo restores it. Preview shows the letter. Export: copy copies the text. Exit returns to the living room.'
    },
    {
      tools: '[data-act="submit-story"]',
      zh: '写好了吗？想把信寄给作者，就点上方粉色的「正式投稿」，选好使用范围后确认。看到投稿编号，就寄到了。',
      en: 'Ready to send your letter? Click the pink Submit button above, choose how it may be used and confirm. Your receipt means it arrived.'
    }
  ];
  let draft, step = 0;
  return function setup() {
    const bubble = document.getElementById('writer-guide');
    if (!bubble) return;
    if (draft !== current) { draft = current; step = 0; }
    const en = lang === 'en';
    const label = bubble.querySelector('p');
    const next = bubble.querySelector('button');
    const toolbar = document.querySelector('#writer .toolbar');
    const editor = document.getElementById('editor');
    const last = steps.length - 1;
    function show(index) {
      step = index;
      label.textContent = steps[step][en ? 'en' : 'zh'];
      next.textContent = step === last ? (en ? 'Review tools' : '再看工具') : (en ? 'Next tip →' : '下一条 →');
      toolbar.querySelectorAll('.guide-target').forEach(el => el.classList.remove('guide-target'));
      toolbar.querySelectorAll(steps[step].tools).forEach(el => el.classList.add('guide-target'));
    }
    function ready() {
      if (editor.innerText.trim() && step !== last) show(last);
    }
    show(step);
    next.onclick = () => show((step + 1) % steps.length);
    editor.addEventListener('input', ready);
    editor.addEventListener('blur', ready);
    toolbar.addEventListener('click', event => {
      if (event.target.closest('[data-act="save-writer"], [data-act="preview"]')) ready();
    });
  };
})();
