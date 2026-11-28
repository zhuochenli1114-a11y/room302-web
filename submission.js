(()=>{
 const endpoint='https://room302-submissions.newharp36.chatgpt.site/api/submit';
 const style=document.createElement('style');style.textContent=`#submission-dialog{width:min(580px,94vw);max-height:90vh;overflow:auto;border:3px solid #302430;border-radius:18px;padding:26px;background:#fff9ed;color:#302430;font:16px/1.65 system-ui}#submission-dialog::backdrop{background:#302430aa}#submission-dialog label{display:block;margin:16px 0}#submission-dialog select,#submission-dialog textarea{width:100%;font:inherit;padding:9px;border:1px solid #806379;border-radius:8px}#submission-dialog button{font:inherit;padding:9px 16px;border:2px solid #302430;border-radius:9px;background:#acd9ef;margin:8px 8px 0 0}#submission-dialog h2{margin-top:0}#submission-dialog input{width:18px;height:18px}#submission-dialog input[aria-invalid=true]{outline:2px solid #99455b;outline-offset:2px}#submission-dialog #submit-status:not(:empty){padding:8px 10px;background:#f9eedb;border-radius:6px}#submission-dialog [role=status]{white-space:pre-wrap;overflow-wrap:anywhere}`;document.head.append(style);
 const dialog=document.createElement('dialog');dialog.id='submission-dialog';document.body.append(dialog);
 let sending=false;
 const text=(zh,en)=>lang==='en'?en:zh;
 document.addEventListener('click',e=>{if(!e.target.closest('[data-act="submit-story"]'))return;capture();open();});
 function open(){
  if(!current)return;
  dialog.innerHTML=`<h2>${text('把这段记忆寄给我','Send your memory')}</h2><p>${text('只有项目作者能查看原始投稿。提交不会自动公开，也不会发送邮件。保存草稿与正式投稿是两回事。','Only the project author can read your original submission. It will not be published automatically or sent by email. Saving a draft is separate from submitting it.')}</p><p>${text('请隐去真实姓名、地址和他人的私密身份；不要提交未经允许的他人照片。','Remove real names, addresses and other people’s private identities. Do not send other people’s photos without permission.')}</p><form id="submission-form" novalidate><label>${text('使用范围','Permission')}<select id="submit-permission"><option value="reference-only">${text('仅供作者内部参考','For the author’s private reference only')}</option><option value="anonymous-adaptation">${text('允许去标识改编与项目展示','Allow de-identified adaptation and project presentation')}</option></select></label><label>${text('不希望出现的内容（选填）','Boundaries (optional)')}<textarea id="submit-boundaries" maxlength="3000" rows="3"></textarea></label><label><input type="checkbox" id="submit-consent" required> ${text('我自愿将当前故事和附图发送给项目作者保存与阅读。','I voluntarily send this story and its images to the project author to store and read.')}</label><label><input type="checkbox" id="submit-rights" required> ${text('我有权分享这些内容，并已保护故事中其他人的隐私。','I have the right to share this material and have protected other people’s privacy.')}</label><p id="submit-status" tabindex="-1" role="status" aria-live="polite"></p><button type="submit" id="send-story">${text('确认投稿','Submit')}</button><button type="button" id="cancel-submit">${text('继续修改','Keep editing')}</button></form>`;
  dialog.querySelector('form').onchange=event=>{
    if(event.target.type==='checkbox' && event.target.checked) event.target.removeAttribute('aria-invalid');
  };
  dialog.querySelector('#cancel-submit').onclick=()=>dialog.close();dialog.querySelector('form').onsubmit=send;dialog.showModal();
 }
 dialog.addEventListener('cancel',e=>{if(sending)e.preventDefault();});
 function newSubmissionCode() {
  if (typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => ('0' + byte.toString(16)).slice(-2)).join('');
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20)].join('-');
 }
 function postStory(payload) {
  return new Promise((resolve,reject)=>{
    const request = new XMLHttpRequest();
    request.open('POST',endpoint);
    request.timeout = 60000;
    request.setRequestHeader('Content-Type','application/json');
    request.onload = () => {
      let result;
      try {result = JSON.parse(request.responseText);} catch {reject(new Error('network'));return;}
      resolve({ok:request.status>=200 && request.status<300, result});
    };
    request.onerror = request.ontimeout = request.onabort = () => reject(new Error('network'));
    request.send(JSON.stringify(payload));
  });
 }
 function showStatus(message) {
  const status = dialog.querySelector('#submit-status');
  status.textContent = message;
  status.focus();
 }
 async function send(e){
  e.preventDefault();if(sending || dialog.querySelector('#send-story').hidden)return;
  const missing = Array.from(dialog.querySelectorAll('input[required]')).filter(input => !input.checked);
  if (missing.length) {
    for(const input of missing) input.setAttribute('aria-invalid','true');
    const consentMissing = missing[0].id === 'submit-consent';
    showStatus(missing.length===2 ? text('请先勾选上面的两项确认，再点「确认投稿」。','Please tick both confirmations above before submitting.') :
      consentMissing ? text('请勾选「我自愿将当前故事和附图发送给项目作者」。','Please confirm that you wish to send this story to the author.') :
      text('请勾选「我有权分享这些内容」，再确认投稿。','Please confirm that you have the right to share this story.'));
    return;
  }
  const status=dialog.querySelector('#submit-status');
  let started=false;
  try {
  const box=document.createElement('div');box.innerHTML=current.html||'';box.querySelectorAll('script,style').forEach(x=>x.remove());
  const images=[...new Set([current.image,...Array.from(box.querySelectorAll('img'),x=>x.src)].filter(Boolean))];
  // Text is stored and displayed as text, never as submitted HTML.
  box.querySelectorAll('p,div,br').forEach(x=>x.append(document.createTextNode('\n')));
  const payload={alias:current.alias||'',title:current.title||'',topic:draftTopic(current),story:box.textContent.trim(),object:Object.values(current.toy||{}).filter(Boolean).join('\n'),images,permission:dialog.querySelector('#submit-permission').value,boundaries:dialog.querySelector('#submit-boundaries').value,consent:dialog.querySelector('#submit-consent').checked,rights:dialog.querySelector('#submit-rights').checked};
  if(!payload.story){showStatus(text('正文为空。点「继续修改」写下故事后，再回来投稿。','Choose Keep editing and write your story first.'));return;}
  if(images.length>2){showStatus(text('每次投稿最多附两张图片，请减少插图后重试。','Please include no more than two images.'));return;}
  const fingerprint=JSON.stringify(payload);if(current.submissionFingerprint!==fingerprint){current.submissionId=newSubmissionCode();current.submissionFingerprint=fingerprint;}
  payload.submissionCode=current.submissionId;sending=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent=text('正在寄出，请稍候…','Sending…');
   started=true;
   const {ok, result} = await postStory(payload);
   if (!ok || !result || !result.ok || result.receipt!==payload.submissionCode) {
     if (!ok && result && typeof result.error==='string') {
       showStatus(text('投稿未完成：','Submission incomplete: ') + result.error);return;
     }
     throw new Error('receipt');
   }
   status.textContent=text('投稿成功，已经送达作者的私密收件箱。原稿不会自动公开。\n请保存投稿编号，之后可用它向作者提出撤回：\n','Your submission has been received and will remain private.\nKeep this receipt if you want to ask the author to withdraw it:\n')+result.receipt;
   if(document.documentElement.classList.contains('phone')) {
     const copy = document.createElement('button'); copy.type='button'; copy.textContent=text('复制投稿编号','Copy receipt');
     copy.onclick=async()=>{try{await navigator.clipboard.writeText(result.receipt);copy.textContent=text('编号已复制','Receipt copied');}catch{copy.textContent=text('请长按上方编号复制','Press and hold the receipt above to copy');}};
     dialog.querySelector('#cancel-submit').before(copy); status.scrollIntoView({block:'center'});
   }
   dialog.querySelector('#send-story').hidden=true;dialog.querySelector('#cancel-submit').textContent=text('完成','Done');
  }catch(error){
    showStatus(started ? text('未收到回执。请保留此页，检查网络后再点「确认投稿」。原样重试会沿用同一投稿编号。','No receipt yet. Keep this page open, check the connection and retry without changing the story to reuse its submission code.') :
      text('这次未能开始发送。请先复制正文备份，再用手机系统浏览器打开网站重试。','Sending could not start. Copy your story first, then reopen the site in your system browser.'));
  }
  finally{sending=false;dialog.querySelectorAll('button').forEach(b=>b.disabled=false);}
 }
})();
