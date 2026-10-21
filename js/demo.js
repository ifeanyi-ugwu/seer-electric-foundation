/* Seer demo data layer (window.SeerDemo). Every tool page loads its data through here, so a judge can see how the
   product behaves when the network is slow, failing, offline or cached. Nothing here makes a network request: the
   "server" is the page's own producer function, and the delay, the errors and the cache are simulated.

   Settings live in sessionStorage (try/catch) and are read synchronously when this file runs, which on the tool pages
   is before the first paint (the scripts are render-blocking), so every page in the tab starts in the same state.
     delay    0, 1, 3 or 8 seconds, with a +-20% jitter
     error    none, network, timeout, server, notfound or empty, applied to the scopes that are switched on
     scope    page (a page's main data), details (sheets, selections, a proposal or a chart), tx (wallet and trades)
     offline  every request fails with a network error until it is switched off (or the browser comes back online)
     cache    on: a key already in the cache resolves at once from it ({fromCache:true, cachedAt}) and is revalidated
              in the background (stale while revalidate); a fresh load stores its key. Clear cache makes the next
              load cold; Warm cache stores every known page-level key.
   With the defaults (instant, no error, online, no cache) a load resolves synchronously, so a visitor who never opens
   the demo panel sees the site exactly as before: no skeleton, no extra frame.

   API
     settings (a copy), set(patch), subscribe(fn) (returns an unsubscribe), reset(), isDefault(), overrides()
     fetch(key, producer, {scope, empty, force}) -> Promise<{data, fromCache, cachedAt, empty}>, rejects with a typed
       error {name, kind, code, status, message, retryable, offline, ref}
     request(...) the same, but tells a synchronous outcome apart: {sync:true, ok, res|err} or {sync:false, promise}
     wait(base) the wallet's connect and sign steps: {ms, err} for the transactions scope
     slot() a loader for one region: skeleton after 120ms (at once on a first paint), held at least 350ms, aria-busy,
       one announcement, stale runs dropped
     errorView(err, o), emptyView(o), renderError(container, err, o), sk(width), announce(text)
     cache: entries(), counts, clearCache(), warmCache()
     page({replay}) a page registers how to re-run its first load; replay({force}) runs it (the demo panel calls it)
     ago(ms) "just now", "2 minutes ago" */
(function(){
"use strict";
var doc=document,root=doc.documentElement,KEY="seer-demo",CKEY="seer-demo-cache",D={},subs=[];
var DELAYS=[0,1,3,8],ERRORS=["none","network","timeout","server","notfound","empty"];
var SHOW_AFTER=120,MIN_SHOW=350,TIMEOUT=4000;
var mqR=window.matchMedia?matchMedia("(prefers-reduced-motion: reduce)"):{matches:false};

/* ---------- settings ---------- */
function norm(v){v=v&&typeof v==="object"?v:{};var sc=v.scope&&typeof v.scope==="object"?v.scope:{};
  return{delay:DELAYS.indexOf(+v.delay)>=0?+v.delay:0,error:ERRORS.indexOf(v.error)>=0?v.error:"none",
    scope:{page:sc.page!==false,details:!!sc.details,tx:!!sc.tx},offline:!!v.offline,cache:!!v.cache}}
function read(k){try{return JSON.parse(sessionStorage.getItem(k)||"null")}catch(e){return null}}
function write(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var S=norm(read(KEY));
function copy(){return{delay:S.delay,error:S.error,scope:{page:S.scope.page,details:S.scope.details,tx:S.scope.tx},offline:S.offline,cache:S.cache}}
Object.defineProperty(D,"settings",{get:copy});
D.DELAYS=DELAYS;D.ERRORS=ERRORS;
function emit(why){write(KEY,S);paintRoot();var s=copy();subs.slice().forEach(function(f){try{f(s,why)}catch(e){}})}
D.subscribe=function(f){subs.push(f);return function(){var i=subs.indexOf(f);if(i>=0)subs.splice(i,1)}};
D.set=function(p){var was=isOffline(),n=norm(Object.assign(copy(),p||{},{scope:Object.assign(copy().scope,p&&p.scope||{})}));S=n;emit("set");
  var now=isOffline();if(was!==now)netChange(now)};
D.reset=function(){var was=isOffline();S=norm(null);emit("reset");if(was!==isOffline())netChange(isOffline())};
/* an override is anything that changes what a visitor sees; the scopes alone change nothing while no error is chosen */
D.overrides=function(){var o=[];if(S.delay)o.push("delay");if(S.error!=="none")o.push("error");if(S.offline)o.push("offline");if(S.cache)o.push("cache");return o};
D.isDefault=function(){return!D.overrides().length};

/* ---------- network: the demo switch, or the browser itself ---------- */
function isOffline(){return S.offline||navigator.onLine===false}
D.isOffline=isOffline;
var retries=[];
/* a region that failed with a network error asks to be retried once the connection is back */
D.onOnline=function(fn){if(retries.indexOf(fn)<0)retries.push(fn)};
D.offOnline=function(fn){var i=retries.indexOf(fn);if(i>=0)retries.splice(i,1)};
var backT=0;
function netChange(off){paintRoot();bar(off);
  if(!off){var l=retries.splice(0);clearTimeout(backT);
    /* a short, visible pause so "Back online" reads before the page moves */
    backT=setTimeout(function(){l.forEach(function(f){try{f()}catch(e){}})},600)}}
addEventListener("online",function(){if(!S.offline)netChange(false)});
addEventListener("offline",function(){netChange(true)});

/* ---------- typed errors ---------- */
var KINDS={network:["NetworkError","NETWORK_ERROR",0,"The network could not be reached."],
  timeout:["TimeoutError","TIMEOUT",408,"The server did not answer in time."],
  server:["ServerError","HTTP_500",500,"The server returned an error."],
  notfound:["NotFoundError","HTTP_404",404,"The item was not found."]};
function hex(n){var b=new Uint8Array(n),s="",i;try{crypto.getRandomValues(b)}catch(e){for(i=0;i<n;i++)b[i]=Math.random()*256|0}
  for(i=0;i<n;i++)s+=(b[i]<16?"0":"")+b[i].toString(16);return s.toUpperCase()}
function mkErr(kind,o){var k=KINDS[kind]||KINDS.server,e=new Error(o&&o.offline?"You are offline.":k[3]);
  e.name=k[0];e.kind=KINDS[kind]?kind:"server";e.code=k[1];e.status=k[2];e.retryable=kind!=="notfound";e.offline=!!(o&&o.offline);e.ref=hex(4);return e}
D.error=mkErr;

/* ---------- cache: what was loaded and when (persisted for the tab; the data itself is the page's producer) ---------- */
var C=(function(){var c=read(CKEY);c=c&&typeof c==="object"?c:{};if(!c.entries||typeof c.entries!=="object")c.entries={};
  ["hits","misses","lastRead","lastCleared"].forEach(function(k){c[k]=+c[k]||0});return c})();
function saveC(){write(CKEY,C)}
var LABELS={"app:markets":"Explorer markets","fut:proposals":"Futarchy proposals","deep:proposals":"Deep proposals",
  "opp:submissions":"Opportunity submissions","risk:matrix:exploit":"Risk: exploit","risk:matrix:depeg":"Risk: depeg","risk:matrix:oracle":"Risk: oracle"};
D.label=function(k){if(LABELS[k])return LABELS[k];var m=/^(\w+):(\w+):(.+)$/.exec(k);return m?m[1]+" "+m[2]+" "+m[3]:k};
function store(key,label){var o=C.entries[key];C.entries[key]={at:Date.now(),reads:(o&&o.reads)||0,label:label||(o&&o.label)||null};saveC();emit("cache")}
D.entries=function(){return Object.keys(C.entries).map(function(k){var e=C.entries[k];return{key:k,label:e.label||D.label(k),at:e.at,reads:e.reads||0}}).sort(function(a,b){return b.at-a.at})};
Object.defineProperty(D,"counts",{get:function(){return{entries:Object.keys(C.entries).length,hits:C.hits,misses:C.misses,lastRead:C.lastRead||null,lastCleared:C.lastCleared||null}}});
D.clearCache=function(){C.entries={};C.lastCleared=Date.now();saveC();emit("cache")};
/* warm: every page-level key of the five tools is stored now, as if each page had been visited */
D.warmCache=function(){var t=Date.now();Object.keys(LABELS).forEach(function(k){C.entries[k]={at:t,reads:(C.entries[k]&&C.entries[k].reads)||0}});saveC();emit("cache")};

/* ---------- requests ---------- */
function jitter(s){return s?Math.round(s*1000*(.8+Math.random()*.4)):0}
function forcedFor(scope,o){if(o&&o.force)return o.force;return S.error!=="none"&&S.scope[scope]?S.error:null}
function settle(key,producer,o,f){
  if(f&&f!=="empty")return{ok:false,err:mkErr(f)};
  var data=producer(),empty=f==="empty";
  if(empty)data=o.empty?o.empty(data):Array.isArray(data)?[]:null;
  else if(S.cache&&!o.noStore)store(key,o.cacheLabel);
  return{ok:true,res:{data:data,fromCache:false,cachedAt:null,empty:empty}}}
/* one place decides the outcome; a synchronous one (instant, offline, a cache hit) is told apart so callers can render
   in the same frame */
D.request=function(key,producer,o){o=o||{};var scope=o.scope||"page",f=forcedFor(scope,o),ent=S.cache&&!o.force&&!o.noCache&&C.entries[key];
  if(ent){ent.reads=(ent.reads||0)+1;C.hits++;C.lastRead=Date.now();saveC();emit("cache");
    var res={data:producer(),fromCache:true,cachedAt:ent.at,empty:false};
    revalidate(key,producer,o,ent.at);return{sync:true,ok:true,res:res}}
  if(S.cache&&!o.noCache){C.misses++;C.lastRead=Date.now();saveC();emit("cache")}
  if(isOffline())return{sync:true,ok:false,err:mkErr("network",{offline:true})};
  var ms=jitter(S.delay);
  if(f==="timeout")ms=Math.max(ms,TIMEOUT);
  if(!ms){var r=settle(key,producer,o,f);r.sync=true;return r}
  return{sync:false,promise:new Promise(function(res,rej){setTimeout(function(){
    /* a request still in flight when the connection drops fails like a real one */
    if(isOffline()){rej(mkErr("network",{offline:true}));return}
    var r=settle(key,producer,o,f);if(r.ok)res(r.res);else rej(r.err)},ms)})}};
D.fetch=function(key,producer,o){var r=D.request(key,producer,o);if(!r.sync)return r.promise;return r.ok?Promise.resolve(r.res):Promise.reject(r.err)};
/* stale while revalidate: the page already shows the cached entry; this asks again in the background and says how it went */
function revalidate(key,producer,o,at){var scope=o.scope||"page";
  if(scope==="page")toast("Showing saved data, saved "+ago(at)+". Refreshing",true);
  var r=D.request(key,producer,{scope:scope,empty:o.empty,noCache:true,cacheLabel:o.cacheLabel});
  var ok=function(res){if(scope==="page")toast("Updated just now");if(o.onFresh)o.onFresh(res)},
      no=function(e){if(scope==="page")toast((e.offline?"You are offline.":"Could not refresh.")+" Showing saved data, saved "+ago(at)+".")};
  if(r.sync)setTimeout(function(){r.ok?ok(r.res):no(r.err)},0);else r.promise.then(ok,no)}
/* the wallet's connect and sign steps: the time to wait and the failure to show, for the transactions scope */
D.wait=function(base){var f=S.error!=="none"&&S.error!=="empty"&&S.scope.tx?S.error:null,ms=Math.max(base,jitter(S.delay));
  if(f==="timeout")ms=Math.max(ms,TIMEOUT);
  return{ms:ms,err:isOffline()?mkErr("network",{offline:true}):f?mkErr(f):null,check:function(){return isOffline()?mkErr("network",{offline:true}):this.err}}};

/* ---------- time ---------- */
function ago(t){if(!t)return"never";var s=Math.max(0,Math.round((Date.now()-t)/1000));if(s<10)return"just now";if(s<60)return s+" seconds ago";
  var m=Math.round(s/60);if(m<60)return m===1?"1 minute ago":m+" minutes ago";var h=Math.round(m/60);return h===1?"1 hour ago":h+" hours ago"}
D.ago=ago;

/* ---------- small builders ---------- */
function h(tag,a,kids){var n=doc.createElement(tag),k;for(k in a||{}){if(a[k]==null)continue;if(k==="text")n.textContent=a[k];else if(k==="class")n.className=a[k];else if(k.slice(0,2)==="on")n[k]=a[k];else n.setAttribute(k,a[k])}
  (kids||[]).forEach(function(c){if(c!=null)n.appendChild(typeof c==="string"?doc.createTextNode(c):c)});return n}
function svg(tag,a,kids){var n=doc.createElementNS("http://www.w3.org/2000/svg",tag),k;for(k in a)n.setAttribute(k,a[k]);(kids||[]).forEach(function(c){n.appendChild(c)});return n}
D.h=h;
/* a text placeholder: an inline block on the text's own line box, so the element keeps the height its text will have */
D.sk=function(w,cls){return h("span",{class:"sk sk-t"+(cls?" "+cls:""),style:"--w:"+(w||"60%"),"aria-hidden":"true"})};
D.skBlock=function(cls,style){return h("span",{class:"sk "+(cls||""),style:style||null,"aria-hidden":"true"})};

/* ---------- one polite live region for the data layer and the demo panel ---------- */
var live=null;
function liveEl(){if(!live||!live.isConnected){live=h("div",{class:"dm-sr",role:"status","aria-live":"polite",id:"dm-live"});doc.body.appendChild(live)}return live}
D.announce=function(t){var l=liveEl();l.textContent="";clearTimeout(l.__t);l.__t=setTimeout(function(){l.textContent=t},90)};

/* ---------- the inline state: error variants and the empty state, in error.html's language ---------- */
var ICONS={network:["M2.8 18.8A30 30 0 0 1 45.2 18.8M9.9 25.9A20 20 0 0 1 38.1 25.9M16.9 32.9A10 10 0 0 1 31.1 32.9M7 5l34 38",[24,40]],
  timeout:["M24 17v10l7 5M19 5h10M24 5v5",null,[24,27,17]],
  server:["M6 8h36v13H6zM6 27h36v13H6zM22 14.5h13M22 33.5h13",[13,14.5],null,[13,33.5]],
  notfound:["M20 34a14 14 0 1 1 0-28 14 14 0 0 1 0 28ZM30 30l13 13M14 14l12 12M26 14 14 26"],
  empty:["M6 14h36v26H6zM6 14l6-8h24l6 8M18 24h12"],
  unknown:["M24 6 43 40H5ZM24 19v10",[24,34.5]]};
function icon(kind){var d=ICONS[kind]||ICONS.unknown,kids=[svg("path",{d:d[0]})];
  if(d[2])kids.push(svg("circle",{cx:d[2][0],cy:d[2][1],r:d[2][2]}));
  [d[1],d[3]].forEach(function(c){if(c)kids.push(svg("circle",{cx:c[0],cy:c[1],r:"2.5",fill:"currentColor",stroke:"none"}))});
  return svg("svg",{class:"dm-ic",viewBox:"0 0 48 48",fill:"none",stroke:"currentColor","stroke-width":"3","stroke-linecap":"square","aria-hidden":"true",focusable:"false"},kids)}
/* copy for each variant; {s} is what failed to load ("the markets"), {S} the same with a capital */
var COPY={
  network:{kind:"Network",title:"Could not reach the network",text:"Your connection dropped before {s} loaded. Check it, then try again."},
  offline:{kind:"Network",title:"You are offline",text:"{S} will load by themselves as soon as you are back online."},
  timeout:{kind:"Timeout",title:"That took too long",text:"The server did not answer in time, so {s} did not load. Trying again usually works."},
  server:{kind:"Server error",title:"Something failed on our side",text:"The service returned an error while loading {s}. You did not cause it, and trying again usually works."},
  notfound:{kind:"Not found",title:"This could not be found",text:"{S} may have been moved or removed."}};
function fill(t,s){return t.replace(/\{s\}/g,s).replace(/\{S\}/g,s.charAt(0).toUpperCase()+s.slice(1))}
function copyBtn(code){var said=h("span",{class:"dm-copied",role:"status"});
  var b=h("button",{class:"dm-copy",type:"button","aria-label":"Copy reference code",onclick:function(){
    var done=function(ok){said.textContent=ok?"Copied":"Selected, copy it now";b.classList.toggle("is-done",!!ok);clearTimeout(said.__t);said.__t=setTimeout(function(){said.textContent="";b.classList.remove("is-done")},2400)};
    var legacy=function(){var ok=false,ta=h("textarea",{readonly:"",style:"position:fixed;left:0;top:0;width:1px;height:1px;opacity:0"});ta.value=code;doc.body.appendChild(ta);
      try{ta.select();ok=doc.execCommand("copy")}catch(e){}ta.remove();b.focus();if(!ok){try{var r=doc.createRange(),c=b.parentNode.querySelector("code");r.selectNodeContents(c);var s=getSelection();s.removeAllRanges();s.addRange(r)}catch(e){}}done(ok)};
    try{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(code).then(function(){done(true)},legacy);else legacy()}catch(e){legacy()}}},[
    svg("svg",{class:"cp",viewBox:"0 0 16 16","aria-hidden":"true",focusable:"false"},[svg("path",{d:"M5.5 5.5h7v7h-7zM3.5 10.5v-7h7",fill:"none",stroke:"currentColor","stroke-width":"1.5"})]),
    svg("svg",{class:"ok",viewBox:"0 0 16 16","aria-hidden":"true",focusable:"false"},[svg("path",{d:"M3 8.5 6.5 12 13 4.5",fill:"none",stroke:"currentColor","stroke-width":"1.6"})])]);
  return[b,said]}
function act(a,primary){if(!a)return null;var cls=primary?"btn lg dm-primary":"dm-link";
  if(a.href)return h("a",{class:cls,href:a.href},[h("span",{text:a.text})]);
  return h("button",{class:cls,type:"button",onclick:a.onclick},[primary?a.text:h("span",{text:a.text})])}
/* errorView(err, {subject, level, retry, back, titles, texts, hl}): hl overrides the heading level where the outline needs it. level "page" (an alert, h2), "panel" or "sheet" (a status, h3).
   Every error has a next action: Try again where trying again can help; for not found, the way back. */
D.errorView=function(err,o){o=o||{};var lvl=o.level||"panel",kind=err&&err.offline?"offline":err&&COPY[err.kind]?err.kind:"server",c=COPY[kind],s=o.subject||"this",
  title=o.titles&&o.titles[kind]||c.title,text=o.texts&&o.texts[kind]||fill(c.text,s),ref=err&&err.ref||hex(4);
  var prim=null,sec=null;
  if(kind==="notfound"){prim=o.back||null;sec=o.retry?{text:"Try again",onclick:o.retry}:null;if(!prim){prim=sec;sec=null}}
  else{prim=o.retry?{text:"Try again",onclick:o.retry}:null;sec=o.back||o.secondary||null}
  var hd=h(o.hl||(lvl==="page"?"h2":"h3"),{class:"dm-title",tabindex:"-1",text:title});
  var parts=copyBtn(ref);
  return h("div",{class:"dm-state dm-"+lvl,"data-variant":kind,"data-key":"dm-err-"+ref},[
    h("div",{class:"dm-block","aria-hidden":"true"},[h("span",{class:"dm-block-face"}),icon(kind==="offline"?"network":kind)]),
    h("div",{class:"dm-copy-col"},[
      h("div",{role:lvl==="page"?"alert":"status"},[h("p",{class:"dm-kick"},[h("i"),h("span",{text:c.kind})]),hd,h("p",{class:"dm-text",text:text})]),
      h("div",{class:"dm-acts"},[act(prim,true),act(sec,false)]),
      kind==="offline"?h("p",{class:"dm-wait"},[h("span",{text:"Waiting for a connection"})]):null,
      h("p",{class:"dm-ref"},[h("span",{text:"Reference"}),h("code",{class:"dm-code",text:ref})].concat(parts))])])};
/* emptyView({title, text, action, secondary, level}): a result with nothing in it, set apart from "no matches" */
D.emptyView=function(o){o=o||{};var lvl=o.level||"panel";
  return h("div",{class:"dm-state dm-empty dm-"+lvl,"data-variant":"empty","data-key":"dm-empty"},[
    h("div",{class:"dm-block","aria-hidden":"true"},[h("span",{class:"dm-block-face"}),icon("empty")]),
    h("div",{class:"dm-copy-col"},[
      h("div",{role:"status"},[h("p",{class:"dm-kick"},[h("i"),h("span",{text:o.kind||"Nothing here yet"})]),
        h(o.hl||(lvl==="page"?"h2":"h3"),{class:"dm-title",tabindex:"-1",text:o.title||"Nothing here yet"}),h("p",{class:"dm-text",text:o.text||""})]),
      h("div",{class:"dm-acts"},[act(o.action,true),act(o.secondary,false)])])])};
D.renderError=function(c,err,o){var n=D.errorView(err,o);while(c.firstChild)c.removeChild(c.firstChild);c.appendChild(n);if(o&&o.focus)D.focusHead(n);return n};
D.renderEmpty=function(c,o){var n=D.emptyView(o);while(c.firstChild)c.removeChild(c.firstChild);c.appendChild(n);if(o&&o.focus)D.focusHead(n);return n};
D.focusHead=function(n){var t=n&&n.querySelector&&n.querySelector(".dm-title");if(t)try{t.focus({preventScroll:true})}catch(e){t.focus()}};

/* ---------- a loader for one region ----------
   slot().run({key, producer, scope, empty, force, initial, busy, label, show, apply, fail})
   - a synchronous outcome renders at once: no skeleton, no extra frame
   - otherwise show() runs at once on a first load (initial) or after 120ms, and stays at least 350ms once shown
   - busy gets aria-busy while loading; label is announced once, when the skeleton appears
   - a newer run (or cancel) makes an older one a no-op, so a slow answer never paints over a newer request
   apply(res, info) and fail(err, info) get info.shown (a skeleton was on screen) and info.sync. */
D.slot=function(){var tok=0,timer=0,hold=0,shown=false,at=0,busyEl=null;
  function busy(el,on){if(!el)return;if(on)el.setAttribute("aria-busy","true");else el.removeAttribute("aria-busy")}
  var api={run:function(o){var t=++tok;clearTimeout(timer);clearTimeout(hold);
      if(busyEl&&busyEl!==o.busy)busy(busyEl,false);busyEl=o.busy||null;
      var r=D.request(o.key,o.producer,o);
      function done(ok,v,sync){if(t!==tok)return;clearTimeout(timer);var wait=shown?Math.max(0,at+MIN_SHOW-Date.now()):0;
        var fin=function(){if(t!==tok)return;var was=shown;shown=false;busy(busyEl,false);var info={shown:was,sync:!!sync};
          if(ok)o.apply(v,info);else o.fail(v,info)};
        if(wait)hold=setTimeout(fin,wait);else fin()}
      if(r.sync){done(r.ok,r.ok?r.res:r.err,true);return api}
      function show(){if(t!==tok)return;var again=shown;shown=true;if(!again)at=Date.now();busy(busyEl,true);if(o.show)o.show(again);if(o.label&&!again)D.announce(o.label)}
      if(o.initial||shown)show();else timer=setTimeout(show,SHOW_AFTER);
      r.promise.then(function(res){done(true,res)},function(e){done(false,e)});return api},
    cancel:function(){tok++;clearTimeout(timer);clearTimeout(hold);if(busyEl)busy(busyEl,false);shown=false},
    get pending(){return!!(timer||hold||shown)}};
  return api};

/* while a region reloads, focus that sat on a control inside it moves to the region itself, so it is never lost */
D.holdFocus=function(region){var a=doc.activeElement;if(!region||!a||a===doc.body||!region.contains(a))return;
  if(!region.hasAttribute("tabindex")){region.setAttribute("tabindex","-1");region.addEventListener("blur",function f(){region.removeAttribute("tabindex");region.removeEventListener("blur",f)})}
  try{region.focus({preventScroll:true})}catch(e){}};

/* skel(region, kids): the region shows a skeleton laid out like its content (same grid and gaps).
   crossOut(region): when the content is ready, the skeleton lifts out of the flow where it stands and fades while the
   content renders beneath it, so the two cross instead of the region going blank. The skeleton is kept out of the
   page's morph (data-m-keep) and leaves the DOM when the fade ends. */
D.skel=function(region,kids){var s=h("div",{class:"dm-skel dm-inh","aria-hidden":"true"},kids);while(region.firstChild)region.removeChild(region.firstChild);
  region.classList.add("dm-region");region.appendChild(s);return s};
D.crossOut=function(region){var s=region&&region.querySelector(":scope > .dm-skel");if(!s)return;
  if(mqR.matches||!s.animate){s.remove();return}
  var t=s.offsetTop,l=s.offsetLeft,w=s.offsetWidth;s.setAttribute("data-m-keep","");s.classList.add("dm-out");
  s.style.cssText+=";position:absolute;top:"+t+"px;left:"+l+"px;width:"+w+"px;margin:0;pointer-events:none;z-index:2";
  var a=s.animate([{opacity:1},{opacity:0}],{duration:260,easing:"cubic-bezier(.3,0,.8,.15)",fill:"forwards"});a.onfinish=a.oncancel=function(){s.remove()}};
D.focusFirst=function(region){var l=region&&region.querySelectorAll("a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex='-1'])"),i;
  for(i=0;l&&i<l.length;i++)if(l[i].getClientRects().length&&!l[i].closest("[inert],[aria-hidden=true]")){try{l[i].focus({preventScroll:true})}catch(e){}return}};

/* ---------- the page's first load, for Replay loading and Trigger error now ---------- */
var PG=null;
D.page=function(o){PG=o||null};
D.canReplay=function(){return!!(PG&&PG.replay)};
D.replay=function(o){if(PG&&PG.replay)PG.replay(o||{})};
D.pageName=function(){return PG&&PG.name||null};

/* ---------- offline bar and the freshness note ---------- */
function paintRoot(){root.classList.toggle("dm-is-offline",isOffline());root.classList.toggle("dm-override",!D.isDefault())}
var barEl=null,barT=0;
function bar(off){if(!doc.body)return;if(!barEl){barEl=h("div",{class:"dm-bar",role:"status"},[h("i",{"aria-hidden":"true"}),h("span")]);doc.body.appendChild(barEl)}
  clearTimeout(barT);var s=barEl.lastChild;
  if(off){barEl.setAttribute("data-state","off");s.textContent="You are offline. Seer will try again when you are back online.";barEl.hidden=false}
  else if(!barEl.hidden){barEl.setAttribute("data-state","on");s.textContent="Back online.";barT=setTimeout(function(){barEl.hidden=true;s.textContent=""},2200)}}
var toastEl=null,toastT=0;
function toast(t,keep){if(!doc.body)return;if(!toastEl){toastEl=h("div",{class:"dm-toast",role:"status",hidden:""},[h("i",{"aria-hidden":"true"}),h("span")]);doc.body.appendChild(toastEl)}
  clearTimeout(toastT);toastEl.lastChild.textContent=t;toastEl.hidden=false;toastEl.classList.toggle("is-busy",!!keep);
  toastEl.classList.remove("is-out");if(!keep)toastT=setTimeout(function(){toastEl.classList.add("is-out");toastT=setTimeout(function(){toastEl.hidden=true},260)},2600)}
D.toast=toast;
paintRoot();
if(doc.body){if(isOffline())bar(true)}else doc.addEventListener("DOMContentLoaded",function(){if(isOffline())bar(true)});

D.reduced=function(){return mqR.matches};
window.SeerDemo=D;
})();
