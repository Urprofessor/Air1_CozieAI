/* Air1 CozieAI — App update page interactions
   Extracted from single-file template. Modules: in-page edit mode, scroll-spy nav,
   carousels, theme toggle. (Chinese-only build) */


(function(){
  var EDIT_TTL = 3 * 24 * 60 * 60 * 1000;
  var SAVE_KEY = 'momcozy_device_assistant_v1v2v3_structure_v36';
  var NO_EDIT = 'nav, .topbar, .tnav, .edit-toolbar, .save-btn, .edit-hint, .badge, .btn, .icon-btn, svg, img, script, style, button';
  var TEXT_TAGS = /^(P|H1|H2|H3|H4|H5|H6|LI|A|SPAN|EM|B|STRONG|DIV|DT|DD|TD|TH|LABEL|SMALL)$/;
  var editMode = false;
  var preEditSnapshot = null;

  function stageEl(){ return document.querySelector('.stage'); }
  function hasOwnText(el){
    for(var i=0;i<el.childNodes.length;i++){
      if(el.childNodes[i].nodeType===3 && el.childNodes[i].nodeValue.trim()) return true;
    }
    return false;
  }
  function hasElementChildren(el){
    for(var i=0;i<el.childNodes.length;i++){ if(el.childNodes[i].nodeType===1) return true; }
    return false;
  }
  function editableBlock(t){
    var el=t;
    while(el && el!==document.body){
      if(el.closest(NO_EDIT)) return null;
      if(TEXT_TAGS.test(el.tagName)){
        if(hasOwnText(el)) return el;
        if(!hasElementChildren(el) && el.closest('.stage')) return el;
      }
      el=el.parentElement;
    }
    return null;
  }
  function commitEditing(el){
    if(!el) return;
    el.removeAttribute('contenteditable');
    el.classList.remove('editing');
    if(el.hasAttribute('data-zh')){
      var lang=document.documentElement.getAttribute('data-lang') || 'zh';
      el.setAttribute('data-'+lang, el.textContent.trim());
    }
  }
  function persistSnapshot(){
    try{
      var s=stageEl(); if(!s) return;
      localStorage.setItem(SAVE_KEY, JSON.stringify({t:Date.now(), h:s.innerHTML}));
    }catch(e){}
  }
  function syncSnapshotToDisk(){
    try{
      var s=stageEl(); if(!s || !window.XMLHttpRequest) return;
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/__sync', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = function(){
        if(xhr.status >= 200 && xhr.status < 300){
          console.info('Momcozy edits synced to local HTML and zip.');
        }else{
          console.warn('Momcozy local file sync failed:', xhr.responseText || xhr.status);
        }
      };
      xhr.onerror = function(){ console.warn('Momcozy local file sync failed.'); };
      xhr.send(JSON.stringify({stageHtml: s.innerHTML}));
    }catch(e){}
  }
  function clearSnapshot(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
  window.momcozyTryRestoreSavedEdits = function(){
    try{
      var raw=localStorage.getItem(SAVE_KEY); if(!raw) return;
      var d=JSON.parse(raw); if(!d||!d.h) return;
      if(Date.now()-d.t > EDIT_TTL){ localStorage.removeItem(SAVE_KEY); return; }
      var s=stageEl(); if(s) s.innerHTML=d.h;
    }catch(e){}
  };
  window.momcozyTryRestoreSavedEdits();

  function enterEditMode(){
    var s=stageEl(); if(!s) return;
    preEditSnapshot = s.innerHTML;
    editMode = true;
    document.body.classList.add('edit-mode');
    document.getElementById('editBtn').style.display='none';
    document.getElementById('saveBtn').style.display='inline-flex';
    document.getElementById('cancelBtn').style.display='inline-flex';
  }
  function exitEditMode(){
    editMode = false;
    document.body.classList.remove('edit-mode');
    document.getElementById('editBtn').style.display='inline-flex';
    document.getElementById('saveBtn').style.display='none';
    document.getElementById('cancelBtn').style.display='none';
    var ed=document.querySelector('[contenteditable="true"]');
    if(ed) commitEditing(ed);
  }
  function cancelEdit(){
    var ed=document.querySelector('[contenteditable="true"]');
    if(ed) commitEditing(ed);
    if(preEditSnapshot!==null){ var s=stageEl(); if(s) s.innerHTML=preEditSnapshot; }
    preEditSnapshot=null;
    clearSnapshot();
    exitEditMode();
  }
  function saveEdit(){
    var ed=document.querySelector('[contenteditable="true"]');
    if(ed) commitEditing(ed);
    preEditSnapshot=null;
    persistSnapshot();
    syncSnapshotToDisk();
    exitEditMode();
  }

  document.addEventListener('click', function(e){
    if(!editMode) return;
    if(e.target.closest && e.target.closest('.edit-toolbar, button')) return;
    var link = e.target.closest ? e.target.closest('a') : null;
    if(link) e.preventDefault();
    var el = e.target instanceof Element ? editableBlock(e.target) : null;
    if(!el || el.getAttribute('contenteditable')==='true') return;
    el._orig = el.innerHTML;
    el.setAttribute('contenteditable','true');
    el.classList.add('editing');
    el.focus();
  });
  document.addEventListener('keydown', function(e){
    var ed=document.activeElement;
    if(!ed || !ed.isContentEditable) return;
    if(e.key==='Escape'){
      if(ed._orig!==undefined) ed.innerHTML=ed._orig;
      commitEditing(ed);
      return;
    }
    if(e.key==='Backspace' && ed.closest('[data-addlist]') && ed.textContent.trim()===''){
      e.preventDefault();
      var prev=ed.previousElementSibling, next=ed.nextElementSibling;
      ed.remove();
      var t=prev||next;
      if(t){ t._orig=t.innerHTML; t.setAttribute('contenteditable','true'); t.classList.add('editing'); t.focus(); }
      return;
    }
    if(e.key==='Enter' && !e.shiftKey){
      e.preventDefault();
      if(ed.closest('[data-addlist]')){
        var clone=ed.cloneNode(false);
        ed.after(clone);
        commitEditing(ed);
        clone.setAttribute('contenteditable','true');
        clone.classList.add('editing');
        clone.focus();
      } else {
        commitEditing(ed);
      }
    }
  });
  document.addEventListener('focusout', function(e){
    var el=e.target;
    if(el && el.isContentEditable) commitEditing(el);
  });
  window.addEventListener('beforeunload', function(){
    var ed=document.querySelector('[contenteditable="true"]');
    if(ed) commitEditing(ed);
  });
  document.getElementById('editBtn').addEventListener('click', enterEditMode);
  document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
  document.getElementById('saveBtn').addEventListener('click', saveEdit);
})();



/* ---- */


(function(){
  var assistantTitle=document.querySelector('[data-zh="设备助手升级，使用问题更好解决"]');
  var assistantShot=assistantTitle && assistantTitle.closest('.zzcard').querySelector('.zz-shot .shot');
  if(assistantShot) assistantShot.src='assets/sleep/device-assistant-air1.jpg';
})();


/* ---- */


(function(){
  var links=[].slice.call(document.querySelectorAll('.jump a')), navMap={};
  links.forEach(function(a){var el=document.querySelector(a.getAttribute('href'));if(el)navMap[a.getAttribute('href')]=el;});
  var anchorIds=['v1','v2','v3'], anchorMap={}, settlingHref='', settlingTimer=0;
  anchorIds.forEach(function(id){var el=document.getElementById(id);if(el)anchorMap['#'+id]=el;});
  function anchorOffset(){
    var jump=document.querySelector('.jump'), topbar=document.querySelector('.topbar');
    var offset=(jump?jump.getBoundingClientRect().height:58) + 42;
    if(topbar){
      var rect=topbar.getBoundingClientRect();
      if(rect.top<=1 && rect.bottom>1) offset += rect.height;
    }
    return offset;
  }
  function anchorHead(el){
    if(!el) return null;
    if(el.id==='top') return el;
    return el.querySelector('.sec-head') || el.querySelector('h2') || el;
  }
  function targetTop(el){
    if(!el || el.id==='top') return 0;
    var targetHead=anchorHead(el);
    return Math.max(0,targetHead.getBoundingClientRect().top + window.pageYOffset - anchorOffset());
  }
  function setActive(href){
    links.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')===href);});
    var active=links.find(function(a){return a.getAttribute('href')===href;});
    var rail=document.querySelector('.jump .wrap');
    if(active && rail){
      var left=active.offsetLeft - (rail.clientWidth-active.offsetWidth)/2;
      rail.scrollTo({left:Math.max(0,left),behavior:'auto'});
    }
  }
  function targetFor(href){ return anchorMap[href] || navMap[href]; }
  function sectionFromViewport(){
    var x=Math.max(1,Math.min(window.innerWidth-1,window.innerWidth/2));
    var ys=[anchorOffset()+10, anchorOffset()+86, window.innerHeight*.42, window.innerHeight*.58];
    for(var i=0;i<ys.length;i++){
      var y=Math.max(1,Math.min(window.innerHeight-1,ys[i]));
      var el=document.elementFromPoint(x,y);
      var sec=el && el.closest ? el.closest('section[id]') : null;
      if(sec && anchorMap['#'+sec.id]) return sec;
    }
    return null;
  }
  window.mczCurrentSectionId=function(){
    var visible=sectionFromViewport();
    if(visible) return visible.id;
    var y=window.scrollY || window.pageYOffset || 0, cur='';
    Object.keys(anchorMap).forEach(function(href){
      if(targetTop(anchorMap[href])<=y+4) cur=href;
    });
    return cur ? cur.slice(1) : '';
  };
  window.mczCaptureScrollAnchor=function(){
    var y=window.scrollY || window.pageYOffset || 0;
    var visible=sectionFromViewport();
    var id=visible ? visible.id : window.mczCurrentSectionId();
    if(!id) return {id:'', scrollY:y};
    var target=targetFor('#'+id), head=anchorHead(target);
    return {id:id, screenTop:head ? head.getBoundingClientRect().top : 0, delta:Math.max(0,y-targetTop(target))};
  };
  window.mczRestoreScrollAnchor=function(state,behavior){
    if(!state || !state.id){ window.scrollTo({top:(state&&state.scrollY)||0,behavior:behavior||'auto'}); return; }
    var href=state.id.charAt(0)==='#' ? state.id : '#'+state.id;
    var target=targetFor(href), head=anchorHead(target);
    if(!target || !head) return;
    var y;
    if(typeof state.screenTop==='number'){
      y=(window.scrollY || window.pageYOffset || 0) + head.getBoundingClientRect().top - state.screenTop;
    }else{
      y=targetTop(target)+(state.delta||0);
    }
    window.scrollTo({top:Math.max(0,y),behavior:behavior||'auto'});
    setActive(navMap[href]?href:'');
  };
  function viewportAnchorElement(){
    var probeY=Math.max(anchorOffset()+18,Math.min(window.innerHeight-80,window.innerHeight*.36));
    var selector='h1, h2, h3, h4, p, blockquote, .deveco-item, .pcard, .zzcard, .sleep-feature-card, .card, .wellness-map, .voice, .closing-card, .hist-row';
    var candidates=[].slice.call(document.querySelectorAll(selector));
    var best=null, bestScore=Infinity;
    candidates.forEach(function(el){
      if(!el.closest || !el.closest('.stage') || el.closest('.topbar, .jump, .edit-toolbar')) return;
      var r=el.getBoundingClientRect();
      if(r.width<8 || r.height<8 || r.bottom<anchorOffset()+8 || r.top>window.innerHeight-24) return;
      var inBand = r.top<=probeY && r.bottom>=probeY;
      var dist = inBand ? 0 : Math.min(Math.abs(r.top-probeY), Math.abs(r.bottom-probeY));
      var tagPenalty = (/^H[1-4]$/.test(el.tagName) || el.matches('p, blockquote')) ? 0 : 18;
      var score = dist + tagPenalty;
      if(score<bestScore){ bestScore=score; best=el; }
    });
    if(best) return best;
    return sectionFromViewport();
  }
  window.mczCaptureViewportAnchor=function(){
    var el=viewportAnchorElement();
    if(!el) return {fallback:window.mczCaptureScrollAnchor ? window.mczCaptureScrollAnchor() : {id:'', scrollY:(window.scrollY || window.pageYOffset || 0)}};
    return {el:el, screenTop:el.getBoundingClientRect().top, fallback:window.mczCaptureScrollAnchor ? window.mczCaptureScrollAnchor() : null};
  };
  window.mczRestoreViewportAnchor=function(state,behavior){
    if(state && state.el && document.documentElement.contains(state.el)){
      var y=(window.scrollY || window.pageYOffset || 0) + state.el.getBoundingClientRect().top - state.screenTop;
      window.scrollTo({top:Math.max(0,y),behavior:behavior||'auto'});
      return;
    }
    if(state && state.fallback && window.mczRestoreScrollAnchor) window.mczRestoreScrollAnchor(state.fallback,behavior||'auto');
  };
  window.mczAlignSection=function(id){
    var href=id && id.charAt(0)==='#' ? id : '#'+id;
    var target=targetFor(href);
    if(!target) return;
    window.scrollTo({top:targetTop(target),behavior:'auto'});
    setActive(navMap[href]?href:'');
  };
  window.mczScrollToSection=function(id,behavior){
    var href=id && id.charAt(0)==='#' ? id : '#'+id;
    var target=targetFor(href);
    if(!target) return;
    settlingHref=href;
    clearTimeout(settlingTimer);
    settlingTimer=setTimeout(function(){settlingHref='';},720);
    window.scrollTo({top:targetTop(target),behavior:window.matchMedia('(max-width:640px)').matches?'instant':(behavior||'smooth')});
    setActive(navMap[href]?href:'');
    var settle=function(){
      if(!document.documentElement.contains(target)) return;
      window.mczAlignSection(href);
    };
    requestAnimationFrame(function(){requestAnimationFrame(settle);});
    setTimeout(settle,460);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
  };
  links.forEach(function(a){
    a.addEventListener('click',function(e){
      var href=a.getAttribute('href');
      if(!targetFor(href)) return;
      e.preventDefault();
      window.mczScrollToSection(href,'smooth');
      if(history && history.pushState) history.pushState(null,'',href);
    });
  });
  document.querySelectorAll('a.btn[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var href=a.getAttribute('href');
      if(!targetFor(href)) return;
      e.preventDefault();
      window.mczScrollToSection(href,'smooth');
      if(history && history.pushState) history.pushState(null,'',href);
    });
  });
  function on(){
    if(settlingHref){ setActive(settlingHref); return; }
    var id=window.mczCurrentSectionId();
    setActive(navMap['#'+id]?'#'+id:'');
    if(id && location.hash!==('#'+id) && history && history.replaceState) history.replaceState(null,'','#'+id);
  }
  window.addEventListener('scroll',on,{passive:true});on();
  if(location.hash && targetFor(location.hash)){
    requestAnimationFrame(function(){window.mczScrollToSection(location.hash,'auto');});
  }
})();
function slideW(s){return s.querySelector('.slide').getBoundingClientRect().width+20;}
function swipeMove(id,dir){var s=document.getElementById(id);s.scrollBy({left:dir*slideW(s),behavior:'smooth'});}
function initSwiper(id,dotsId){
  var s=document.getElementById(id);if(!s)return;
  var slides=s.querySelectorAll('.slide'),dots=document.getElementById(dotsId);
  slides.forEach(function(_,i){var d=document.createElement('i');if(i===0)d.className='on';
    d.onclick=function(){s.scrollTo({left:i*slideW(s),behavior:'smooth'});};dots.appendChild(d);});
  s.addEventListener('scroll',function(){var idx=Math.round(s.scrollLeft/slideW(s));
    dots.querySelectorAll('i').forEach(function(d,i){d.classList.toggle('on',i===idx);});},{passive:true});
}
initSwiper('feat-swiper','feat-dots');
initSwiper('v1-swiper','v1-dots');
var playT={};
function swipePlay(id,btn){
  if(playT[id]){clearInterval(playT[id]);playT[id]=null;btn.textContent='▶';return;}
  btn.textContent='❚❚';
  playT[id]=setInterval(function(){
    var s=document.getElementById(id);var n=s.querySelectorAll('.slide').length,w=slideW(s);
    var idx=(Math.round(s.scrollLeft/w)+1)%n; s.scrollTo({left:idx*w,behavior:'smooth'});
  },3500);
}
function updateThemeLabel(){
  var d=document.documentElement, btn=document.getElementById('themeBtn');
  if(!btn) return;
  var lang=d.getAttribute('data-lang') || 'zh';
  var isDark=d.getAttribute('data-theme')==='dark';
  btn.textContent=isDark?'☀':'☾';
  btn.setAttribute('aria-label', lang==='en' ? (isDark?'Switch to light mode':'Switch to dark mode') : (isDark?'切换到浅色模式':'切换到深色模式'));
}


function toggleTheme(){var d=document.documentElement,c=d.getAttribute('data-theme')==='dark'?'light':'dark';
  d.setAttribute('data-theme',c);updateThemeLabel();}
(function(){try{if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){
  document.documentElement.setAttribute('data-theme','dark');} updateThemeLabel();}catch(e){}})();

(function(){
  document.querySelectorAll('a[href="#top"]').forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault();
      window.scrollTo({top:0,behavior:'smooth'});
      if(history && history.pushState) history.pushState(null,'','#top');
      document.querySelectorAll('.jump a').forEach(function(link){link.classList.remove('active');});
    });
  });
})();
