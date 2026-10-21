/* Seer EF: behaviour for the system-state pages (404.html, error.html, loading.html).
   Shared: the one theme toggle (persisted as 'seer-theme'), in-page links that survive a <base> element,
   and pausing ambient loops in hidden tabs and offscreen. Then one small block per page, chosen by
   <body data-page>. Text that comes from the address bar or the query string is only ever written with
   textContent, and query values are looked up in fixed allowlists, never echoed. */
(function(){
  "use strict";
  var d=document,root=d.documentElement,body=d.body,page=body.getAttribute("data-page");
  var mqR=window.matchMedia?matchMedia("(prefers-reduced-motion: reduce)"):{matches:false};
  function reduced(){return mqR.matches}
  function $(s){return d.querySelector(s)}
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
  function own(o,k){return k!=null&&Object.prototype.hasOwnProperty.call(o,k)}
  function param(k){try{return new URLSearchParams(location.search).get(k)}catch(e){return null}}

  /* ---------- theme: one toggle; the same circular reveal as the site, a cross-fade without view transitions,
     instant under reduced motion ---------- */
  var tg=$("[data-theme-toggle]");
  function sync(){if(!tg)return;var l=root.dataset.theme==="light";tg.setAttribute("aria-pressed",String(l));tg.title=l?"Light theme on":"Light theme off"}
  function apply(t){root.dataset.theme=t;store("seer-theme",t);sync()}
  if(tg){sync();tg.addEventListener("click",function(){
    var next=root.dataset.theme==="light"?"dark":"light",did=false,go=function(){if(!did){did=true;apply(next)}};
    if(reduced()){go();return}
    if(!d.startViewTransition){root.classList.add("st-xfade");go();setTimeout(function(){root.classList.remove("st-xfade")},360);return}
    var r=tg.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y)),
      retreat=next==="dark",dur=retreat?676:520,c0="circle(0px at "+x+"px "+y+"px)",c1="circle("+R+"px at "+x+"px "+y+"px)",vt,keep=null,released=0;
    /* darkness is the absence of light, so light leads: to light, the new theme radiates out of the toggle; to dark, the light is
       withdrawn into the toggle and the dark is what is left behind */
    root.classList.add("st-vt");if(retreat)root.classList.add("st-vt-back");
    /* the toggle rides above both themes, in the colours of the view that is closing in, so its turn reads against it */
    tg.style.viewTransitionName="st-toggle";
    if(retreat){var cs=getComputedStyle(tg);keep=1;tg.style.color=cs.color;tg.style.borderColor=cs.borderColor;tg.style.backgroundColor=cs.backgroundColor}
    function release(){if(released||!keep)return;released=1;tg.style.transition="color 180ms,border-color 180ms,background-color 180ms";
      tg.style.color=tg.style.borderColor=tg.style.backgroundColor="";setTimeout(function(){tg.style.transition=""},300)}
    function done(){root.classList.remove("st-vt","st-vt-back");tg.style.viewTransitionName="";release()}
    try{vt=d.startViewTransition(go)}catch(e){done();go();return}
    /* safety: if the browser never gets to the update (a stalled capture), skip the transition and switch anyway */
    setTimeout(function(){if(!did){try{vt.skipTransition()}catch(e){}go();done()}},500);
    if(retreat)setTimeout(release,Math.round(dur*.64));
    vt.ready.then(function(){root.animate({clipPath:retreat?[c1,c0]:[c0,c1]},{duration:dur,easing:"cubic-bezier(.05,.7,.1,1)",
      pseudoElement:retreat?"::view-transition-old(root)":"::view-transition-new(root)",fill:"both"})},done);
    vt.finished.then(done,done)})}

  /* ---------- header: pinned at the top at every size (css/states.css) and condensed the way the site's headers are
     (js/motion.js pinHead), self-contained here: .m-scrolled as soon as the page moves, .m-cond past 24px and back
     below 12px. The amounts are measured from the layout: the content rises by half its top padding (at most 10px)
     and the ground so far that the bottom padding matches the condensed top one. One passive scroll listener, read
     once per frame; classes change only when a threshold is crossed. The stage's top padding holds the fixed header's
     place and is kept equal to its height. Focus and anchors stop below the condensed bar
     (scroll-padding-top), and --hdr-h holds its visible height, as on the tool pages. ---------- */
  var hd=$(".st-top");
  if(hd){var hs=null,hc=null,hq=0,hH=0,hrc=0,sat=d.createElement("div");
    sat.setAttribute("aria-hidden","true");sat.style.cssText="position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:env(safe-area-inset-top,0px)";body.appendChild(sat);
    var hv=function(){root.style.setProperty("--hdr-h",(hH-(hc?hrc:0))+"px")};
    var hm=function(){var H=hd.offsetHeight,top=1e9,bot=0;
      Array.prototype.forEach.call(hd.children,function(c){if(!c.offsetHeight)return;top=Math.min(top,c.offsetTop);bot=Math.max(bot,c.offsetTop+c.offsetHeight)});
      if(!H||top>H)return;var pad=Math.max(0,top-sat.offsetHeight),dd=Math.max(2,Math.min(10,Math.round(pad/2)));
      hH=H;hrc=Math.max(0,Math.round(H-(bot-dd+pad-dd)));hd.style.setProperty("--hd-d",dd+"px");hd.style.setProperty("--hd-rc",hrc+"px");
      var sp=hd.parentNode;if(parseFloat(getComputedStyle(sp).paddingTop)!==H)sp.style.paddingTop=H+"px";
      root.style.scrollPaddingTop=(H-hrc+12)+"px";hv()};
    var hu=function(){hq=0;var max=Math.max(0,root.scrollHeight-innerHeight),y=Math.max(0,Math.min(window.pageYOffset,max)),s=y>0,c=hc?y>12:y>24;
      if(s!==hs){hs=s;hd.classList.toggle("m-scrolled",s)}if(c!==hc){hc=c;hd.classList.toggle("m-cond",c);hv()}};
    addEventListener("scroll",function(){if(!hq)hq=requestAnimationFrame(hu)},{passive:true});
    hm();hu();if(window.ResizeObserver)new ResizeObserver(hm).observe(hd);else addEventListener("resize",hm)}

  /* ---------- in-page links: the 404 page sets <base href> to the site root, which would send "#main" to the
     home page. Point fragment links at this document instead. ---------- */
  Array.prototype.forEach.call(d.querySelectorAll('a[href^="#"]'),function(a){a.setAttribute("href",location.href.split("#")[0]+a.getAttribute("href"))});

  /* ---------- ambient loops: paused in hidden tabs and when scrolled offscreen ---------- */
  function vis(){root.classList.toggle("st-paused",d.hidden)}
  d.addEventListener("visibilitychange",vis);vis();
  if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("st-off",!e.isIntersecting)})});
    Array.prototype.forEach.call(d.querySelectorAll("[data-ambient]"),function(el){io.observe(el)})}

  /* ---------- 404: show the address that was asked for, once, in the meta line ---------- */
  if(page==="404"){var pe=$("#st-path");if(pe){var p=location.pathname||"/";
    try{p=decodeURIComponent(p)}catch(e){}
    p=p.replace(/[\u0000-\u001f\u007f-\u009f]/g,"");
    if(p.length>64)p=p.slice(0,30)+"…"+p.slice(-30);
    pe.textContent=p;pe.closest("[hidden]")&&pe.closest("[hidden]").removeAttribute("hidden")}}

  /* ---------- error: variant from a fixed map, reference code, copy, retry ---------- */
  if(page==="error"){
    var V={
      offline:{kind:"Network",title:"You are offline",text:"Seer cannot reach the network right now; this page tries again by itself as soon as you are back online.",doc:"You are offline | Seer"},
      timeout:{kind:"Timeout",title:"That took too long",text:"The server did not answer in time, because it is busy or the connection is slow.",doc:"Request timed out | Seer"},
      server:{kind:"Server error",title:"Something failed on our side",text:"The service returned an error that you did not cause, and trying again usually works.",doc:"Server error | Seer"},
      unknown:{kind:"Unexpected error",title:"Something went wrong",text:"An unexpected problem stopped this page from loading, and trying again usually fixes it.",doc:"Something went wrong | Seer"}
    };
    var type=param("type");if(!own(V,type))type="unknown";var v=V[type];
    body.setAttribute("data-variant",type);
    $("#st-kind").textContent=v.kind;$("#st-title").textContent=v.title;$("#st-text").textContent=v.text;d.title=v.doc;

    /* Try again. A retry has to make a fresh request, so it never uses history.back(), which can restore the
       failed page from the back-forward cache without asking the server again. If we came here from a page
       on this site (a same-origin referrer that is not this error page), load that page again, replacing
       this entry so Back does not return to the error. Otherwise, opened directly, from another site or
       with the referrer withheld, reload this address, which repeats whatever request produced the error. */
    var ref=null;try{var u=new URL(d.referrer);if(u.origin===location.origin&&u.pathname!==location.pathname)ref=u.href}catch(e){}
    function retry(){if(ref)location.replace(ref);else location.reload()}
    var again=$("#st-again");if(again)again.addEventListener("click",function(e){e.preventDefault();retry()});

    /* reference code: 8 hex characters, generated here, so a person can quote it */
    var code=$("#st-ref-code"),cbtn=$("#st-copy"),said=$("#st-copied"),sayT;
    var b=new Uint8Array(4);try{crypto.getRandomValues(b)}catch(e){for(var i=0;i<4;i++)b[i]=Math.random()*256|0}
    code.textContent=Array.prototype.map.call(b,function(x){return(x<16?"0":"")+x.toString(16)}).join("").toUpperCase();
    $("#st-ref").removeAttribute("hidden");
    function say(t,okay){clearTimeout(sayT);said.textContent=t;cbtn.classList.toggle("is-done",!!okay);
      sayT=setTimeout(function(){said.textContent="";cbtn.classList.remove("is-done")},2400)}
    function selectCode(){try{var r=d.createRange();r.selectNodeContents(code);var s=getSelection();s.removeAllRanges();s.addRange(r)}catch(e){}}
    function legacy(){var ok=false,ta=d.createElement("textarea");ta.value=code.textContent;ta.setAttribute("readonly","");
      ta.style.cssText="position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none";body.appendChild(ta);
      try{ta.select();ok=d.execCommand("copy")}catch(e){ok=false}body.removeChild(ta);cbtn.focus();
      if(ok)say("Copied",true);else{selectCode();say("Selected, copy it now")}}
    cbtn.addEventListener("click",function(){
      try{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(code.textContent).then(function(){say("Copied",true)},legacy);else legacy()}catch(e){legacy()}});

    /* offline: wait for the browser's online event, then retry once after a short, visible pause */
    if(type==="offline"){var line=$("#st-retry"),msg=$("#st-retry-msg"),bar=$("#st-retrybar"),rt=null,WAIT=3000;
      line.parentNode.removeAttribute("hidden");
      function waiting(){clearTimeout(rt);rt=null;line.setAttribute("data-state","wait");msg.textContent="Waiting for a connection";bar.hidden=true;bar.classList.remove("is-run")}
      function back(){if(rt)return;line.setAttribute("data-state","back");msg.textContent="Back online. Trying again in 3 seconds";
        bar.style.setProperty("--retry",WAIT+"ms");bar.hidden=false;bar.classList.remove("is-run");void bar.offsetWidth;bar.classList.add("is-run");
        rt=setTimeout(function(){msg.textContent="Trying again";retry()},WAIT)}
      if(navigator.onLine===false)waiting();
      else{line.setAttribute("data-state","ready");msg.textContent="Your connection is working again. Try again when you are ready."}
      addEventListener("online",back);addEventListener("offline",waiting)}
  }

  /* ---------- loading: a valid ?next is opened after the minimum display time; otherwise it loops ---------- */
  if(page==="loading"){
    /* for each page that can follow: its name, the kicker and the title of this page while it loads */
    var NEXT={"app.html":["Seer app","Market explorer","Loading markets"],"futarchy.html":["Futarchy","Futarchy","Loading proposals"],"deep.html":["Deep","Deep","Loading proposals"],
      "opportunity.html":["Opportunity Markets","Opportunity Markets","Loading submissions"],"risk.html":["Risk Pricing","Risk Pricing","Loading risk estimates"],"index.html":["the home page","Home page","Loading the home page"]};
    var MIN=1600,next=param("next");
    if(own(NEXT,next)){
      var nl=$("#st-next"),kk=$(".st-lhead .st-kicker"),tt=$(".st-lhead .st-ltitle [role=status]"),sk=$(".st-skwrap");
      kk.lastChild.textContent=NEXT[next][1];tt.textContent=NEXT[next][2];sk.setAttribute("aria-label",NEXT[next][2].replace(/^Loading /,"").replace(/^./,function(c){return c.toUpperCase()}));
      nl.textContent="Then opening "+NEXT[next][0];nl.removeAttribute("hidden");
      root.classList.add("is-once");
      /* under reduced motion the strip steps in quarters, with no animation between steps */
      if(reduced()){var cols=d.querySelectorAll(".st-prog .on g"),n=cols.length;
        [1,2,3,4].forEach(function(q){setTimeout(function(){for(var j=0;j<Math.round(n*q/4);j++)cols[j].classList.add("is-lit")},q*MIN/4-100)})}
      setTimeout(function(){location.replace(new URL(next,location.href).href)},MIN)}
  }
})();
