/* SeerShell.mount({ product, cta }): renders the shared header into #shell,
   and dresses the page head (.phead) with the FADES slabs and the product's glyph. */
(function(){
  var PRODUCTS=[["app","Seer app","app.html"],["futarchy","Futarchy","futarchy.html"],["deep","Deep","deep.html"],["opportunity","Opportunity","opportunity.html"],["risk","Risk Pricing","risk.html"]];
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
  function applyTheme(t){if(t==="light")document.documentElement.dataset.theme="light";else delete document.documentElement.dataset.theme}
  applyTheme(store("seer-theme"));
  var SUN='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

  /* The kit's FADES slab paths (assets/hero-slabs.svg), with theme-driven gradient stops. */
  var SLABS='<svg class="ph-slabs" viewBox="0 0 1440 600" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false"><defs>'+
    '<linearGradient id="phs0" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" class="lo"/><stop offset="1" class="hi"/></linearGradient>'+
    '<linearGradient id="phs1" x1="0" y1="0" x2="0" y2="1"><stop offset=".25" class="lo"/><stop offset="1" class="hi"/></linearGradient>'+
    '<linearGradient id="phs2" x1="1062" y1="-1.6" x2="566" y2="507.5" gradientUnits="userSpaceOnUse"><stop offset=".25" class="lo"/><stop offset="1" class="hi"/></linearGradient>'+
    '<linearGradient id="phs3" x1="1285" y1="115" x2="1130" y2="318" gradientUnits="userSpaceOnUse"><stop class="lo"/><stop offset="1" class="hi"/></linearGradient>'+
    '<linearGradient id="phs4" x1="1017.5" y1="0" x2="822" y2="385" gradientUnits="userSpaceOnUse"><stop offset=".25" class="lo"/><stop offset="1" class="hi"/></linearGradient></defs>'+
    '<path d="M301.5 493L0 384V0H301.5V493Z" fill="url(#phs0)"/><path d="M152 249.5L0 194.5V0H152V249.5Z" fill="url(#phs1)"/>'+
    '<path d="M226 271V0H618V417L226 271Z" fill="url(#phs0)"/><path d="M299.5 0V107L0 0H299.5Z" fill="url(#phs1)"/>'+
    '<path d="M367 135.5V0H759.5V277L367 135.5Z" fill="url(#phs1)"/><path d="M686 456.5V0H1078.5V600L686 456.5Z" fill="url(#phs2)"/>'+
    '<path d="M1129.5 246.5V0H1440V359L1129.5 246.5Z" fill="url(#phs3)"/><path d="M821.5 299V0H1213.5V442L821.5 299Z" fill="url(#phs4)"/></svg>';

  /* One small decorative glyph per product, drawn from each brief. */
  function glyph(p){var g="",i,x;
    if(p==="app"){[28,20,34,24,30].forEach(function(hh,k){x=k*24;g+='<path class="'+(k===2?"g-v":"g-s")+'" d="M'+x+' '+(40-hh+6)+'L'+(x+20)+' '+(40-hh)+'V40H'+x+'Z"/>'})}
    else if(p==="futarchy"){g='<path class="g-ln" d="M2 20H44"/><path class="g-pos" d="M44 20C64 20 70 8 104 8"/><path class="g-neg" d="M44 20C64 20 70 32 104 32"/><circle class="f-pos" cx="110" cy="8" r="4.5"/><rect class="f-neg" x="105.5" y="27.5" width="9" height="9"/><circle class="g-v" cx="44" cy="20" r="3.5"/>'}
    else if(p==="deep"){var r;for(i=0;i<48;i++){r=((Math.sin((i+1)*12.9898)*43758.5453)%1+1)%1;g+='<circle class="g-v" cx="'+(5+(i%12)*10)+'" cy="'+(5+Math.floor(i/12)*10)+'" r="'+(1.6+r*2).toFixed(1)+'" fill-opacity="'+(.18+r*.82).toFixed(2)+'"/>'}}
    else if(p==="opportunity"){g='<rect class="g-s" x="0" y="8" width="80" height="6"/><rect class="g-v" x="0" y="8" width="62" height="6"/><path class="g-pos" d="M96 11l4 4 8-9"/>'+
      '<rect class="g-s" x="0" y="26" width="80" height="6"/><rect class="g-v" x="0" y="26" width="22" height="6"/><path class="g-neg" style="stroke-dasharray:none" d="M97 24l9 9M106 24l-9 9"/>'}
    else if(p==="risk"){[.3,.48,.66,.84,1].forEach(function(w,k){var ww=Math.round(118*w),y=k*8;g+='<path class="'+(k===4?"g-v":"g-s")+'" d="M0 '+y+'H'+ww+'L'+(ww-4)+' '+(y+5)+'H0Z"/>'})}
    return '<svg class="ph-glyph" viewBox="0 0 120 40" aria-hidden="true" focusable="false">'+g+'</svg>'}

  window.SeerShell={mount:function(o){
    var el=document.getElementById("shell"); if(!el)return;
    var links=PRODUCTS.map(function(p){return '<a href="'+p[2]+'"'+(p[0]===o.product?' aria-current="page"':'')+'>'+p[1]+'</a>'}).join("");
    el.innerHTML=(document.getElementById("main")?'<a class="skip" href="#main">Skip to content</a>':'')+
      '<header class="shell-bar"><div class="shell-in"><a class="shell-brand" href="index.html" aria-label="Seer home"><img src="assets/logo.svg" alt="seer" height="24"></a>'+
      '<nav class="shell-products" aria-label="Seer products">'+links+'</nav>'+
      '<div class="shell-end">'+(o.cta?'<button class="btn btn-pill" id="shell-cta" type="button">'+o.cta+'</button>':'')+
      '<button class="shell-icon" id="shell-theme" type="button" aria-label="Light theme" aria-pressed="false">'+SUN+'</button></div></div></header>';
    /* one toggle per page; aria-pressed always mirrors the theme in use (also after a reload) */
    var tg=document.getElementById("shell-theme"),sync=function(){var l=document.documentElement.dataset.theme==="light";tg.setAttribute("aria-pressed",String(l));tg.title=l?"Light theme on":"Light theme off"};
    tg.onclick=function(){var l=document.documentElement.dataset.theme==="light",go=function(){applyTheme(l?"dark":"light");store("seer-theme",l?"dark":"light");sync()};
      if(window.Motion)Motion.theme(go,this);else go()};
    sync();
    var cur=el.querySelector(".shell-products [aria-current]"),nv=el.querySelector(".shell-products");
    if(cur&&nv.scrollWidth>nv.clientWidth)nv.scrollLeft=Math.max(0,cur.offsetLeft-nv.offsetLeft-(nv.clientWidth-cur.offsetWidth)/2);
    var ph=document.querySelector(".phead");
    if(ph){ph.insertAdjacentHTML("afterbegin",SLABS);var a=ph.querySelector(".phead-aside");if(a)a.insertAdjacentHTML("afterbegin",glyph(o.product))}
  }};
})();
