/* Existing project material: captions distinguish research, sketches and implemented work. */
// Put the W02 proposal before the W03–04 experiment.
projectStoryPages.splice(9,0,...projectStoryPages.splice(10,2));
chapters.splice(0,chapters.length,...projectStoryPages.map(p=>p.title));
storyHTML=function(){
 const l=lang==='en'?1:0,p=projectStoryPages[storyPage];
 return `<section id="story" class="scene project-story"><div class="project-top">${back('lobby')}<h1>${l?'Project story album':'项目故事图文册'}</h1>${btn(l?'Contents':'目录','toc','yellow tiny')}</div><div class="project-book"><div class="project-gallery">${p.images.map((im,i)=>`<figure><button class="project-image" data-project-image="${i}" aria-label="${esc((l?'Enlarge: ':'放大：')+im.caption[l])}"><img src="${im.src}" alt="${esc(im.caption[l])}"></button><figcaption>${esc(im.caption[l])}</figcaption></figure>`).join('')}<p class="project-hint">${l?'Click an image to enlarge · Existing project archive':'点击图片可放大 · 项目现有资料档案'}</p></div><article class="project-text"><span class="project-stage">${esc(p.stage[l])}</span><h2>${esc(p.title[l])}</h2>${p.paragraphs[l].map(x=>`<p>${esc(x)}</p>`).join('')}</article></div><nav class="project-nav">${btn(l?'◀ Previous':'◀ 上一页','story-prev','tiny')}<strong>${String(storyPage+1).padStart(2,'0')} / ${projectStoryPages.length}</strong>${btn(l?'Next ▶':'下一页 ▶','story-next','tiny')}</nav></section>`;
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-project-image]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const im=projectStoryPages[storyPage].images[Number(b.dataset.projectImage)],l=lang==='en'?1:0;
 const d=document.createElement('dialog');d.className='project-lightbox';d.innerHTML=`<button class="project-close" aria-label="${l?'Close':'关闭'}">×</button><img src="${im.src}" alt="${esc(im.caption[l])}"><p>${esc(im.caption[l])}</p>`;document.body.append(d);
 d.querySelector('button').onclick=()=>{d.close();d.remove()};d.addEventListener('click',ev=>{if(ev.target===d){d.close();d.remove()}});d.addEventListener('cancel',()=>d.remove());d.showModal();
},true);
document.addEventListener('keydown',e=>{const d=document.querySelector('.project-lightbox');if(d&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();d.close();d.remove()}},true);
