/* Electric Foundation: motion runtime (window.Motion).
   - patch(): morphs a container into freshly built DOM instead of rebuilding it, so focus, caret and
     scroll positions survive re-renders; keyed items FLIP to new positions, enter and leave with a fade.
   - Values: numbers tween between states (tabular numerals), charts interpolate, bars grow.
   - reveal(): once-only staggered entrance via IntersectionObserver.
   - Indicators, header condensing, landing nav + progress, theme reveal, tilt, ripple.
   Progressive enhancement throughout: without this file every page still renders and works.
   prefers-reduced-motion: every animation becomes the final state immediately. */
(function(){
"use strict";
var doc=document,root=doc.documentElement,NS="http://www.w3.org/2000/svg",M={};
var mqR=matchMedia("(prefers-reduced-motion: reduce)"),mqFine=matchMedia("(hover: hover) and (pointer: fine)"),mqWide=matchMedia("(min-width: 961px)");
function reduced(){return mqR.matches}
var D={xs:120,s:200,m:320,l:520,xl:900};
var E={standard:"cubic-bezier(.2,0,0,1)",decel:"cubic-bezier(.05,.7,.1,1)",accel:"cubic-bezier(.3,0,.8,.15)",spring:"cubic-bezier(.3,1.3,.5,1)"};
var STAG=50,MAXSTAG=8;
var SDA=!!(window.CSS&&CSS.supports&&CSS.supports("animation-timeline: view()"));
M.D=D;M.E=E;M.reduced=reduced;
root.classList.add("m-js");

function anim(el,kf,o){if(reduced()||!el||!el.animate)return null;try{return el.animate(kf,o)}catch(e){return null}}
M.anim=anim;
function each(l,f){if(!l)return;if(typeof l==="string")l=doc.querySelectorAll(l);else if(l.nodeType)l=[l];Array.prototype.forEach.call(l,f)}

/* ---------- JS easing (same curves as the CSS tokens) ---------- */
function bez(x1,y1,x2,y2){
  function A(a,b){return 1-3*b+3*a}function B(a,b){return 3*b-6*a}function C(a){return 3*a}
  function calc(t,a,b){return((A(a,b)*t+B(a,b))*t+C(a))*t}function slope(t,a,b){return 3*A(a,b)*t*t+2*B(a,b)*t+C(a)}
  return function(x){if(x<=0)return 0;if(x>=1)return 1;var t=x,i,s;
    for(i=0;i<8;i++){s=slope(t,x1,x2);if(Math.abs(s)<1e-6)break;t-=(calc(t,x1,x2)-x)/s;if(t<0)t=0;if(t>1)t=1}
    return calc(t,y1,y2)}}
var EF={decel:bez(.05,.7,.1,1),standard:bez(.2,0,0,1)};

/* ---------- one rAF loop for value tweens ---------- */
var tw=new Map(),raf=0,uid=0;
function idOf(n){return n.__mid||(n.__mid=++uid)}
function frame(now){raf=0;tw.forEach(function(t,k){var p=(now-t.t0)/t.dur;if(p<0)return;if(p>1)p=1;t.step(t.ease(p),p);if(p===1){tw.delete(k);if(t.done)t.done()}});if(tw.size)raf=requestAnimationFrame(frame)}
function tween(key,dur,step,o){o=o||{};tw.delete(key);
  if(reduced()||dur<=0||doc.hidden){step(1,1);if(o.done)o.done();return}
  step(0,0);tw.set(key,{t0:performance.now()+(o.delay||0),dur:dur,step:step,ease:o.ease||EF.decel,done:o.done});
  if(!raf)raf=requestAnimationFrame(frame)}
M.tween=tween;

/* ---------- numbers: keep the string's own format (prefix, decimals, grouping, unit) ---------- */
var NUM=/-?\d[\d,]*(?:\.\d+)?/g;
function split(s){var n=[];return{t:s.replace(NUM,function(m){n.push(m);return"\u0001"}),n:n}}
function val(m){return parseFloat(m.replace(/,/g,""))}
function fmt(v,like){var dec=(like.split(".")[1]||"").length,s=Math.abs(v).toFixed(dec);
  if(like.indexOf(",")>=0){var p=s.split(".");p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,",");s=p.join(".")}
  return(v<0&&parseFloat(s)!==0?"-":"")+s}
function join(t,a){var i=0;return t.replace(/\u0001/g,function(){return a[i++]})}
function live(el){return!!(el.closest&&el.closest("[aria-live],[role=status]"))}
function setTxt(el,s){var f=el.firstChild;if(f&&f.nodeType===3&&!f.nextSibling){if(f.nodeValue!==s)f.nodeValue=s}else el.textContent=s}
function setNum(el,text,o){o=o||{};var k=idOf(el)+":n";
  if(el.__nt===text&&tw.has(k))return;
  var cur=el.textContent;el.__nt=text;
  if(cur===text){tw.delete(k);return}
  var a=split(cur),b=split(text);
  if(reduced()||a.t!==b.t||a.n.length!==b.n.length||live(el)){tw.delete(k);setTxt(el,text);return}
  var from=a.n.map(val),to=b.n.map(val);
  tween(k,o.dur||D.l,function(e,p){setTxt(el,p===1?text:join(b.t,to.map(function(v,i){return fmt(from[i]+(v-from[i])*e,b.n[i])})))},{delay:o.delay,ease:o.ease})}
M.num=function(el,text,o){if(el)setNum(el,String(text),o||{dur:D.s+40})};
/* count the first number of an element up from zero (used on reveal) */
M.countUp=function(el,o){if(!el||reduced()||live(el))return;var text=el.__nt||el.textContent,s=split(text);if(!s.n.length)return;
  var z=s.n.slice();z[0]=fmt(0,s.n[0]);setTxt(el,join(s.t,z));el.__nt=null;setNum(el,text,o||{})};
M.countIn=function(l,delay){var i=0;each(l,function(el){M.countUp(el,{delay:(delay||0)+(i++)*40,dur:D.l+180})})};

/* ---------- small helpers for data motion ---------- */
M.grow=function(l,o){o=o||{};var i=0;each(l,function(el){anim(el,[{transform:o.y?"scaleY(0)":"scaleX(0)"},{transform:"none"}],
  {duration:o.dur||D.l+120,easing:E.decel,delay:(o.delay||0)+(i++)*(o.step==null?30:o.step),fill:"backwards"})})};
M.stagger=function(l,delay,step,dist){var i=0;each(l,function(el){anim(el,[{opacity:0,transform:"translateY("+(dist==null?8:dist)+"px)"},{opacity:1,transform:"none"}],
  {duration:D.m+80,easing:E.decel,delay:(delay||0)+Math.min(i++,12)*(step==null?40:step),fill:"backwards"})})};
/* chart draw-on: the line wipes in along x (works for solid and dashed strokes), endpoints pop after it lands */
M.draw=function(svg,o){o=o||{};var d=o.delay||0,n=0;
  each(svg.querySelectorAll(".m-line"),function(p){anim(p,[{clipPath:"inset(-10px 100% -10px -10px)"},{clipPath:"inset(-10px -10px -10px -10px)"}],{duration:D.xl,easing:E.standard,delay:d+(n++)*90,fill:"backwards"})});
  each(svg.querySelectorAll(".m-area"),function(p){anim(p,[{opacity:0},{opacity:1}],{duration:D.l,easing:E.standard,delay:d+D.m,fill:"backwards"})});
  each(svg.querySelectorAll(".m-end"),function(c,i){anim(c,[{opacity:0,transform:"scale(0)"},{opacity:1,transform:"none"}],{duration:D.m,easing:E.spring,delay:d+D.xl-60+i*70,fill:"backwards"})})};
/* everything numeric or bar-like inside a block that just appeared */
M.dataIn=function(el,d){d=(d||0)+100;
  var cnt=[];if(el.matches&&el.matches(".kpi > div,.stat"))cnt=el.querySelectorAll("b");else cnt=el.querySelectorAll(".kpi b,.stat b,.leg b");
  M.countIn(cnt,d);
  M.grow(el.querySelectorAll(".vote-bar i,.sigbar .trk i,.mini"),{delay:d,step:20});
  each(el.querySelectorAll("svg.chart"),function(s){if(s.querySelector(".m-line"))M.draw(s,{delay:d});
    else{M.grow(s.querySelectorAll("rect[data-key]"),{y:1,delay:d,step:35});
      each(s.querySelectorAll("text[data-key]"),function(t){anim(t,[{opacity:0},{opacity:1}],{duration:D.m,delay:d+D.l,fill:"backwards"})})}});
  var i=0;each(el.querySelectorAll("td.h"),function(td){var g=td.style.getPropertyValue("--g");if(g)anim(td,[{"--g":"0"},{"--g":g}],{duration:D.l+200,easing:E.decel,delay:d+(i++)*25,fill:"backwards"})});
  var dots=el.querySelectorAll(".dotfield circle");
  each(dots,function(c,k){anim(c,[{opacity:0,transform:"scale(0)"},{opacity:1,transform:"none"}],{duration:D.m+80,easing:E.spring,delay:d+((k%10)+Math.floor(k/10))*22,fill:"backwards"})})};

/* ---------- reveal on scroll, once ---------- */
var io=null;
function getIO(){if(io||!("IntersectionObserver" in window))return io;
  io=new IntersectionObserver(function(es){var ins=[];es.forEach(function(e){if(e.isIntersecting)ins.push(e.target)});if(!ins.length)return;
    ins.sort(function(a,b){return a.compareDocumentPosition(b)&4?-1:1});
    ins.forEach(function(el,i){io.unobserve(el);show(el,Math.min(i,MAXSTAG)*STAG)})},{rootMargin:"0px 0px -4% 0px",threshold:0});
  return io}
function show(el,delay){if(!el.classList.contains("m-rv"))return;el.classList.remove("m-rv");
  anim(el,[{opacity:0,transform:"translateY("+(el.__rise==null?12:el.__rise)+"px)"},{opacity:1,transform:"none"}],{duration:D.l,easing:E.decel,delay:delay,fill:"backwards"});
  if(el.__onIn)el.__onIn(el,delay)}
M.reveal=function(l,o){o=o||{};if(reduced()||!getIO())return;
  each(l,function(el){if(el.__rv)return;el.__rv=1;if(o.onIn)el.__onIn=o.onIn;if(o.rise!=null)el.__rise=o.rise;el.classList.add("m-rv");io.observe(el)})};
function unreveal(el){if(el.classList&&el.classList.contains("m-rv")){el.classList.remove("m-rv");if(io)io.unobserve(el)}}

/* ---------- attribute tweens (charts) ---------- */
function pts(d){var m=d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);if(!m||m.length%2||/[CcQqSsTtAaHhVvZz]/.test(d))return null;var p=[],i;for(i=0;i<m.length;i+=2)p.push([+m[i],+m[i+1]]);return p}
function mono(p){for(var i=1;i<p.length;i++)if(p[i][0]<p[i-1][0])return false;return true}
function sample(p,x){if(x<=p[0][0])return p[0][1];for(var i=1;i<p.length;i++)if(p[i][0]>=x){var a=p[i-1],b=p[i],t=(x-a[0])/((b[0]-a[0])||1);return a[1]+(b[1]-a[1])*t}return p[p.length-1][1]}
function pathLerp(da,db){var a=pts(da),b=pts(db),i;if(!a||!b||a.length<2||b.length<2)return null;
  var xs=[],ya=[],yb=[],xa=[];
  if(a.length===b.length){for(i=0;i<b.length;i++){xa.push(a[i][0]);xs.push(b[i][0]);ya.push(a[i][1]);yb.push(b[i][1])}}
  else{if(!mono(a)||!mono(b))return null;var n=Math.max(a.length,b.length),x0=b[0][0],x1=b[b.length-1][0];
    for(i=0;i<n;i++){var x=x0+(x1-x0)*i/(n-1);xs.push(x);xa.push(x);ya.push(sample(a,x));yb.push(sample(b,x))}}
  return function(t){var s="";for(var j=0;j<xs.length;j++)s+=(j?"L":"M")+(xa[j]+(xs[j]-xa[j])*t).toFixed(1)+" "+(ya[j]+(yb[j]-ya[j])*t).toFixed(1);return s}}
function tweenAttr(el,n,from,to){el.__ta=el.__ta||{};var k=idOf(el)+":"+n;if(el.__ta[n]===to&&tw.has(k))return;el.__ta[n]=to;
  if(n==="d"){var f=pathLerp(from,to);if(!f){el.setAttribute(n,to);return}
    tween(k,D.l+120,function(e,p){el.setAttribute("d",p===1?to:f(e))},{ease:EF.standard});return}
  var a=parseFloat(from),b=parseFloat(to);if(isNaN(a)||isNaN(b)){el.setAttribute(n,to);return}
  tween(k,D.l+120,function(e,p){el.setAttribute(n,p===1?to:String(+(a+(b-a)*e).toFixed(2)))},{ease:EF.standard})}
var WRX=/width:\s*([\d.]+)(px|%)/;
function barFlip(el,a,b){var x=WRX.exec(a||""),y=WRX.exec(b||"");if(!x||!y||x[2]!==y[2])return;var r=+x[1]/(+y[1]||1);if(!isFinite(r)||Math.abs(r-1)<.005||+y[1]===0)return;
  anim(el,[{transform:"scaleX("+r+")"},{transform:"none"}],{duration:D.l,easing:E.decel})}

/* ---------- morph ---------- */
var EVT=["onclick","oninput","onchange","onkeydown"],SWAP="h2,h3,.notice,.legend span,.fork-metric,.list-label";
function isKeep(n){return n.nodeType===1&&n.hasAttribute("data-m-keep")}
function keyOf(n){return n.nodeType===1?n.getAttribute("data-key"):null}
function mClasses(el){return(el.getAttribute("class")||"").split(/\s+/).filter(function(c){return c.indexOf("m-")===0})}
function syncAttrs(a,b,ctx){var i,n,v,old,tl=b.getAttribute("data-tween"),list=tl?tl.split(" "):null;
  for(i=a.attributes.length-1;i>=0;i--){n=a.attributes[i].name;if(n.indexOf("data-m")===0||b.hasAttribute(n))continue;
    if(n==="class"){var mk=mClasses(a);if(mk.length){a.setAttribute("class",mk.join(" "));continue}}
    a.removeAttribute(n)}
  for(i=0;i<b.attributes.length;i++){n=b.attributes[i].name;v=b.attributes[i].value;old=a.getAttribute(n);
    if(n==="class"){var keep=mClasses(a);if(keep.length)v=(v+" "+keep.join(" ")).trim();if(old!==v)a.setAttribute(n,v);continue}
    if(n==="value"&&a===doc.activeElement)continue;
    if(list&&ctx.animate&&old!=null){
      if(list.indexOf(n)>=0){if(old!==v||(a.__ta&&a.__ta[n]!==v&&a.__ta[n]!=null))tweenAttr(a,n,old,v);continue}
      if(list[0]==="bar"&&n==="style"){if(old!==v){a.setAttribute(n,v);barFlip(a,old,v)}continue}}
    if(list&&a.__ta&&a.__ta[n]!=null){tw.delete(idOf(a)+":"+n);a.__ta[n]=null}/* an instant update cancels any tween in flight */
    if(old!==v)a.setAttribute(n,v)}
  for(i=0;i<EVT.length;i++){n=EVT[i];if(a[n]!==b[n])a[n]=b[n]}}
function setText(node,v,ctx){var p=node.parentNode;
  if(p&&p.nodeType===1&&ctx.animate&&p.childNodes.length===1&&p.closest(".num")){setNum(p,v,{dur:D.l});return}
  if(p&&p.__nt!=null){p.__nt=null;tw.delete(idOf(p)+":n")}
  node.nodeValue=v;
  if(ctx.animate&&p&&p.nodeType===1){var s=p.closest(SWAP);if(s&&!ctx.swapped.has(s)){ctx.swapped.add(s);anim(s,[{opacity:.15,transform:"translateY(3px)"},{opacity:1,transform:"none"}],{duration:D.m,easing:E.decel})}}}
function morphEl(a,b,ctx){syncAttrs(a,b,ctx);morphKids(a,b,ctx)}
function morphKids(a,b,ctx){var olds=[],news=[],c;
  for(c=a.firstChild;c;c=c.nextSibling)if(!isKeep(c))olds.push(c);
  for(c=b.firstChild;c;c=c.nextSibling)news.push(c);
  var byKey=new Map(),used=new Set(),oi=0,res=[];
  olds.forEach(function(o){var k=keyOf(o);if(k!=null)byKey.set(k,o)});
  news.forEach(function(n){var k=keyOf(n),m=null,j,o;
    if(k!=null){m=byKey.get(k)||null;if(m&&(m.nodeName!==n.nodeName||used.has(m)))m=null}
    else for(j=oi;j<olds.length;j++){o=olds[j];if(!used.has(o)&&keyOf(o)==null&&o.nodeName===n.nodeName){m=o;oi=j+1;break}}
    if(m){used.add(m);if(m.nodeType===1)morphEl(m,n,ctx);else if(m.nodeValue!==n.nodeValue)setText(m,n.nodeValue,ctx);res.push(m)}
    else{res.push(n);ctx.added.push(n)}});
  olds.forEach(function(o){if(!used.has(o)){ctx.removed.push({n:o,p:a,next:o.nextSibling});a.removeChild(o)}});
  var tail=null;for(c=a.lastChild;c&&isKeep(c);c=c.previousSibling)tail=c;
  var cur=a.firstChild;
  res.forEach(function(n){while(cur&&cur!==tail&&isKeep(cur))cur=cur.nextSibling;if(cur===tail)cur=null;
    if(n===cur)cur=cur.nextSibling;else a.insertBefore(n,cur||tail)})}

/* ---------- FLIP, enters, ghosts ---------- */
function clipOf(el){var r={top:0,left:0,bottom:innerHeight,right:innerWidth},sc=el.closest&&el.closest(".tbl,.tbl-wrap,.panel");
  if(sc){var s=sc.getBoundingClientRect();r={top:Math.max(0,s.top),left:Math.max(0,s.left),bottom:Math.min(innerHeight,s.bottom),right:Math.min(innerWidth,s.right)}}return r}
function visIn(r,c){return r.width>0&&r.bottom>c.top&&r.top<c.bottom&&r.right>c.left&&r.left<c.right}
function ghost(el,f){var g=el.cloneNode(true),host=doc.createElement("div");
  g.removeAttribute("id");g.removeAttribute("tabindex");each(g.querySelectorAll("[id],[tabindex]"),function(x){x.removeAttribute("id");x.removeAttribute("tabindex")});
  if(el.tagName==="TR"){var t=doc.createElement("table"),tb=doc.createElement("tbody");t.style.cssText="width:100%;min-width:0;border-collapse:collapse"+(f.w?";table-layout:fixed":"");
    if(f.w)Array.prototype.forEach.call(g.children,function(td,i){td.style.width=f.w[i]+"px"});tb.appendChild(g);t.appendChild(tb);host.className=f.wc;host.appendChild(t)}
  else{g.style.width="100%";g.style.height="100%";g.style.margin="0";host.appendChild(g)}
  host.classList.add("m-ghost");host.setAttribute("aria-hidden","true");host.inert=true;
  var c=f.c,r=f.r,clip="inset("+Math.max(0,c.top-r.top)+"px "+Math.max(0,r.right-c.right)+"px "+Math.max(0,r.bottom-c.bottom)+"px "+Math.max(0,c.left-r.left)+"px)";
  host.style.cssText="position:fixed;left:"+r.left+"px;top:"+r.top+"px;width:"+r.width+"px;height:"+r.height+"px;margin:0;padding:0;z-index:15;pointer-events:none;overflow:hidden;max-height:none;background:"+(el.tagName==="TR"?"var(--card)":"none")+";clip-path:"+clip;
  doc.body.appendChild(host);
  var a=anim(host,[{opacity:1,transform:"none"},{opacity:0,transform:"scale(.98)"}],{duration:D.s,easing:E.accel,fill:"forwards"});
  if(a)a.onfinish=function(){host.remove()};else host.remove()}
function enterKf(el,i,dist){if(el.__flip){el.__flip.cancel();el.__flip=null}unreveal(el);
  el.__flip=anim(el,[{opacity:0,transform:"translateY("+(dist||8)+"px)"},{opacity:1,transform:"none"}],{duration:D.m,easing:E.decel,delay:Math.min(i,MAXSTAG)*40,fill:"backwards"})}

M.patch=function(target,next,o){o=o||{};
  var ctx={added:[],removed:[],swapped:new Set(),animate:o.animate!==false&&!reduced()},sel=o.flip;
  var ae=doc.activeElement,ss=null,se=null;try{ss=ae.selectionStart;se=ae.selectionEnd}catch(e){}
  /* rapid interactions coalesce into one pending job per container: the earliest "first" positions win */
  var job=target.__mjob;
  if(ctx.animate&&sel){if(!job){job=target.__mjob={first:new Map(),sel:sel,added:[],removed:[]}}
    var tcache=new Map();/* per table: wrapper class + column widths, read once from the header row */
    each(target.querySelectorAll(sel),function(el){if(job.first.has(el))return;var r=el.getBoundingClientRect(),c=clipOf(el);if(!visIn(r,c))return;
      var f={r:r,c:c,par:el.parentNode};
      if(el.tagName==="TR"){var tb=el.closest("table"),tc=tcache.get(tb);
        if(!tc){var w=el.closest(".tbl,.tbl-wrap"),hr=tb.querySelector("thead tr");tc={wc:w?w.className:"",w:null};
          if(hr&&getComputedStyle(el).display==="table-row")tc.w=Array.prototype.map.call(hr.children,function(th){return th.getBoundingClientRect().width});tcache.set(tb,tc)}
        f.wc=tc.wc;f.w=tc.w}
      job.first.set(el,f)})}
  morphKids(target,next,ctx);
  if(ae&&ae!==doc.body&&ae!==doc.activeElement&&ae.isConnected){try{ae.focus({preventScroll:true});if(ss!=null)ae.setSelectionRange(ss,se)}catch(e){}}
  if(ctx.animate){
    if(!job){job=target.__mjob={first:null,sel:null,added:[],removed:[]}}
    job.added=job.added.concat(ctx.added);job.removed=job.removed.concat(ctx.removed);
    if(!job.raf)job.raf=requestAnimationFrame(function(){target.__mjob=null;settle(target,job)})}
  scan(target);
  return ctx};
/* Runs in the next frame, before paint: reads all new positions in one pass, then writes all animations. */
function settle(target,job){var first=job.first,sel=job.sel,moves=[],enters=[];
  if(first)first.forEach(function(f,el){if(!el.isConnected&&f.par&&f.par.isConnected)ghost(el,f)});
  if(first){var all=target.querySelectorAll(sel);
    each(all,function(el){if(el.__flip){el.__flip.cancel();el.__flip=null}});
    each(all,function(el){var r=el.getBoundingClientRect(),f=first.get(el);
      if(f){var dx=f.r.left-r.left,dy=f.r.top-r.top;if(Math.abs(dx)>=1||Math.abs(dy)>=1)moves.push([el,dx,dy])}
      else if(visIn(r,clipOf(el)))enters.push(el)});
    moves.slice(0,60).forEach(function(m){m[0].__flip=anim(m[0],[{transform:"translate("+m[1]+"px,"+m[2]+"px)"},{transform:"none"}],{duration:D.m,easing:E.standard})});
    enters.slice(0,24).forEach(function(el,i){enterKf(el,i)})}
  var k=0;
  job.added.forEach(function(n){if(n.nodeType!==1||!n.isConnected)return;
    if(n instanceof SVGElement){if(n.hasAttribute("data-key")){if(n.tagName==="rect")M.grow(n,{y:1,delay:(k++)*30});else anim(n,[{opacity:0},{opacity:1}],{duration:D.m,delay:D.s,fill:"backwards"})}return}
    if(sel&&(n.matches(sel)||n.querySelector(sel)))return;
    anim(n,[{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:D.m,easing:E.decel,delay:Math.min(k++,MAXSTAG)*35,fill:"backwards"});
    M.dataIn(n,k*35)});
  job.removed.forEach(function(r){var n=r.n;if(n instanceof SVGElement&&n.hasAttribute&&n.hasAttribute("data-key")&&r.p.isConnected&&!n.isConnected){
    n.setAttribute("data-m-keep","");n.setAttribute("aria-hidden","true");r.p.appendChild(n);
    var a=anim(n,[{opacity:1},{opacity:0}],{duration:D.s,easing:E.accel,fill:"forwards"});if(a)a.onfinish=function(){n.remove()};else n.remove()}})}

/* ---------- sliding indicators (segmented controls, tab rows) ---------- */
function indicator(host){if(host.__ind){host.__ind();return}
  if(!host.querySelector(":scope > button[aria-pressed]"))return;
  var ind=doc.createElement("span"),firstPlace=true,q=0;ind.className="m-ind";ind.setAttribute("aria-hidden","true");ind.setAttribute("data-m-keep","");
  host.appendChild(ind);host.classList.add("m-ind-host");
  function place(){q=0;var a=host.querySelector(":scope > button[aria-pressed=true]");if(!a||!host.isConnected){ind.style.opacity="0";return}
    var l=a.offsetLeft,t=a.offsetTop,w=a.offsetWidth,h=a.offsetHeight;if(!w){return}
    /* sized to the active button (not a clipped full-width box) so what assistive tools read matches what is drawn */
    var set=function(){ind.style.width=w+"px";ind.style.height=h+"px";ind.style.transform="translate("+l+"px,"+t+"px)";ind.style.borderRadius=getComputedStyle(a).borderTopLeftRadius};
    ind.style.opacity="1";host.classList.add("m-ind-on");
    if(firstPlace||reduced()){ind.style.transition="none";set();void ind.offsetWidth;ind.style.transition="";firstPlace=false}
    else set()}
  function later(){if(!q)q=requestAnimationFrame(place)}
  host.__ind=later;
  new MutationObserver(later).observe(host,{subtree:true,attributes:true,attributeFilter:["aria-pressed"],childList:true});
  if(window.ResizeObserver)new ResizeObserver(function(){firstPlace=true;later()}).observe(host);
  later()}
function scan(r){r=r||doc;if(r.matches&&r.matches(".seg,.tabs"))indicator(r);each(r.querySelectorAll(".seg,.tabs"),indicator)}
M.scan=scan;

/* ---------- product nav: active indicator + gliding hover pill ---------- */
function navInd(){var nav=doc.querySelector(".shell-products");if(!nav||nav.__ind)return;nav.__ind=1;nav.classList.add("m-ind-host");
  var cur=nav.querySelector("[aria-current=page]");
  if(mqFine.matches){var hov=doc.createElement("span"),shown=false;hov.className="m-nav-hov";hov.setAttribute("aria-hidden","true");nav.insertBefore(hov,nav.firstChild);nav.classList.add("m-hov-on");
    nav.addEventListener("pointerover",function(e){var a=e.target.closest&&e.target.closest("a");if(!a||!nav.contains(a))return;
      var W=nav.scrollWidth,H=nav.scrollHeight,c="inset("+a.offsetTop+"px "+(W-a.offsetLeft-a.offsetWidth)+"px "+(H-a.offsetTop-a.offsetHeight)+"px "+a.offsetLeft+"px round 4px)";
      hov.style.width=W+"px";hov.style.height=H+"px";
      if(!shown||reduced()){hov.style.transition="opacity var(--dur-2) var(--ease-standard)";hov.style.clipPath=c;void hov.offsetWidth;hov.style.transition="";shown=true}else hov.style.clipPath=c;
      hov.style.opacity=a===cur?"0":"1"});
    nav.addEventListener("pointerleave",function(){hov.style.opacity="0";shown=false})}
  if(cur){var ind=doc.createElement("span");ind.className="m-nav-ind";ind.setAttribute("aria-hidden","true");nav.appendChild(ind);nav.classList.add("m-ind-on");
    var place=function(){ind.style.transform="translateX("+cur.offsetLeft+"px)";ind.style.top=cur.offsetTop+"px";ind.style.width=cur.offsetWidth+"px";ind.style.height=cur.offsetHeight+"px"};
    place();if(window.ResizeObserver)new ResizeObserver(place).observe(nav);
    /* glide from where the previous product's indicator was (survives the page change; works with or without View Transitions) */
    var prev=null;try{prev=JSON.parse(sessionStorage.getItem("m-nav")||"null");sessionStorage.removeItem("m-nav")}catch(e){}
    if(prev&&Date.now()-prev.t<4000&&prev.h!==location.pathname){var dx=prev.l-prev.s-(cur.offsetLeft-nav.scrollLeft);
      anim(ind,[{transform:"translateX("+(cur.offsetLeft+dx)+"px)",width:prev.w+"px"},{transform:"translateX("+cur.offsetLeft+"px)",width:cur.offsetWidth+"px"}],{duration:D.l,easing:E.decel,delay:60})}
    nav.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a");if(!a||a===cur)return;
      try{sessionStorage.setItem("m-nav",JSON.stringify({l:cur.offsetLeft,w:cur.offsetWidth,s:nav.scrollLeft,t:Date.now(),h:location.pathname}))}catch(x){}})}}

/* ---------- header: condense after 24px; expose its height for scroll-padding ---------- */
function condense(bar){if(!bar||bar.__cd)return;bar.__cd=1;
  var s=doc.createElement("div");s.className="m-sentinel";s.setAttribute("aria-hidden","true");doc.body.insertBefore(s,doc.body.firstChild);
  if("IntersectionObserver" in window)new IntersectionObserver(function(es){bar.classList.toggle("is-condensed",!es[es.length-1].isIntersecting)}).observe(s);
  function hv(){root.style.scrollPaddingTop=(bar.offsetHeight-(bar.__cut||0)+16)+"px"}
  hv();if(window.ResizeObserver)new ResizeObserver(hv).observe(bar)}

/* ---------- card tilt (pointer-fine only) ---------- */
function tilt(){if(!mqFine.matches||tilt.on)return;tilt.on=1;var cur=null,rect=null,ev=null,q=0;
  function reset(c){c.style.removeProperty("--m-tx");c.style.removeProperty("--m-ty")}
  doc.addEventListener("pointermove",function(e){if(reduced())return;var c=e.target.closest&&e.target.closest(".mgrid .mcard");
    if(c!==cur){if(cur)reset(cur);cur=c;rect=c?c.getBoundingClientRect():null}if(!c)return;ev=e;
    if(!q)q=requestAnimationFrame(function(){q=0;if(!cur||!rect)return;var x=(ev.clientX-rect.left)/rect.width-.5,y=(ev.clientY-rect.top)/rect.height-.5;
      cur.style.setProperty("--m-tx",(x*4).toFixed(2)+"deg");cur.style.setProperty("--m-ty",(-y*4).toFixed(2)+"deg")})},{passive:true});
  addEventListener("scroll",function(){rect=cur?cur.getBoundingClientRect():null},{passive:true})}

/* ---------- selection ripple (Deep dot field) ---------- */
M.ripple=function(c){if(reduced()||!c||!c.ownerSVGElement)return;var s=c.ownerSVGElement,r=doc.createElementNS(NS,"circle");
  ["cx","cy","r"].forEach(function(a){r.setAttribute(a,c.getAttribute(a))});
  r.setAttribute("fill","none");r.setAttribute("stroke","var(--violet-text)");r.setAttribute("stroke-width","2");r.setAttribute("vector-effect","non-scaling-stroke");
  r.setAttribute("class","m-ripple");r.setAttribute("aria-hidden","true");r.setAttribute("data-m-keep","");r.style.pointerEvents="none";s.appendChild(r);
  var a=anim(r,[{opacity:.9,transform:"scale(1)"},{opacity:0,transform:"scale(2.8)"}],{duration:D.l+240,easing:E.decel});if(a)a.onfinish=function(){r.remove()};else r.remove();
  anim(c,[{transform:"scale(1)"},{transform:"scale(1.3)",offset:.35},{transform:"scale(1)"}],{duration:D.l,easing:E.standard})};

/* ---------- panel exit ---------- */
M.exit=function(els,done){els=els.filter(Boolean);if(reduced()||!els.length||!els[0].animate){done();return}
  var n=els.length;els.forEach(function(el){el.inert=true;el.style.pointerEvents="none";
    var kf=el.classList.contains("panel")?[{opacity:1,transform:"none"},{opacity:0,transform:innerWidth<=600?"translateY(32px)":"translateX(32px)"}]:[{opacity:1},{opacity:0}];
    var a=el.animate(kf,{duration:D.s+40,easing:E.accel,fill:"forwards"});a.onfinish=a.oncancel=function(){if(--n===0)done()}})};

/* ---------- theme: circular reveal from the toggle, colour cross-fade fallback ---------- */
M.theme=function(apply,btn){if(reduced()){apply();return}
  if(doc.startViewTransition&&btn&&btn.getBoundingClientRect){var r=btn.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,
      R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y)),vt;
    root.classList.add("m-vt-theme");
    try{vt=doc.startViewTransition(apply)}catch(e){root.classList.remove("m-vt-theme");apply();return}
    vt.ready.then(function(){root.animate({clipPath:["circle(0px at "+x+"px "+y+"px)","circle("+R+"px at "+x+"px "+y+"px)"]},{duration:D.l,easing:E.decel,pseudoElement:"::view-transition-new(root)"})}).catch(function(){});
    vt.finished.then(done,done);function done(){root.classList.remove("m-vt-theme")}return}
  root.classList.add("m-theming");apply();setTimeout(function(){root.classList.remove("m-theming")},D.m+60)};

/* ---------- pause looping animations offscreen ---------- */
function pauseOff(sel){if(!("IntersectionObserver" in window))return;var o=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("m-off",!e.isIntersecting)})});each(sel,function(el){o.observe(el)})}

/* ---------- landing ---------- */
function landingNav(){var nav=doc.querySelector(".home .topnav");if(!nav)return;
  function measure(){var h=nav.offsetHeight,links=nav.querySelector(".nav-links"),end=nav.querySelector(".nav-end"),brand=nav.querySelector(".brand");
    var wrapped=!!(links&&brand&&links.offsetTop>brand.offsetTop+8),cut=20,shift=10;
    if(wrapped&&end){cut=Math.max(0,h-(end.offsetTop+end.offsetHeight+12));shift=0}
    /* variables live on the nav/hero, not :root, so updating them never restyles the whole document */
    nav.classList.toggle("is-wrapped",wrapped);if(hero)hero.style.setProperty("--m-nav-h",h+"px");nav.style.setProperty("--m-cut",cut+"px");nav.style.setProperty("--m-shift",shift+"px");nav.__cut=cut}
  var hero=nav.closest(".hero");root.classList.add("m-nav-fixed");measure();if(window.ResizeObserver)new ResizeObserver(measure).observe(nav);
  condense(nav)}
function progress(){var bar=doc.createElement("div");bar.className="m-progress";bar.setAttribute("aria-hidden","true");bar.appendChild(doc.createElement("i"));doc.body.appendChild(bar);
  if(window.CSS&&CSS.supports&&CSS.supports("animation-timeline: scroll()")&&!reduced())return;
  var i=bar.firstChild,q=0;function upd(){q=0;var max=root.scrollHeight-innerHeight;i.style.transform="scaleX("+(max>0?Math.min(1,Math.max(0,scrollY/max)):0)+")"}
  addEventListener("scroll",function(){if(!q)q=requestAnimationFrame(upd)},{passive:true});addEventListener("resize",upd,{passive:true});upd()}
function parallaxFallback(){if(SDA||reduced())return;var slabs=doc.querySelector(".home .slabs"),ol=doc.querySelector(".home .apps"),lis=ol?[].slice.call(ol.children):[],q=0,on=true;
  function upd(){q=0;if(!mqWide.matches){if(slabs)slabs.style.transform="";lis.forEach(function(l){l.style.transform=""});return}
    var y=scrollY,vh=innerHeight,r=ol?ol.getBoundingClientRect():null;
    if(slabs&&y<vh*1.5)slabs.style.transform="translateY("+(Math.min(y,vh)/vh*18).toFixed(2)+"%)";
    if(r&&r.top<vh&&r.bottom>0){var p=Math.min(1,Math.max(0,(vh-r.top)/(vh*.45+r.height*.2)));lis.forEach(function(l,k){var kk=[.7,1.2,.5,1,.85][k]||1;l.style.transform="translateY("+((1-p)*kk*56).toFixed(1)+"px)"})}}
  addEventListener("scroll",function(){if(on&&!q)q=requestAnimationFrame(upd)},{passive:true});addEventListener("resize",upd,{passive:true});upd()}
function vizIn(v,d){d+=140;
  M.stagger(v.querySelectorAll(".filters span"),d,25,4);M.stagger(v.querySelectorAll(".xlist .row"),d+80,45);M.countIn(v.querySelectorAll(".xv"),d+120);
  var f=v.querySelector(".fork-lines");if(f){anim(f,[{clipPath:"inset(0 0 100% 0)"},{clipPath:"inset(0 0 0 0)"}],{duration:D.l+120,easing:E.decel,delay:d,fill:"backwards"});
    M.stagger(v.querySelectorAll(".leg"),d+260,70);M.grow(v.querySelectorAll(".leg-bar i"),{delay:d+420,step:80});M.countIn(v.querySelectorAll(".leg-v"),d+300);M.countIn(v.querySelectorAll(".fork-read .num"),d+500)}
  var g=v.querySelectorAll(".d-deep g");each(g,function(c,i){anim(c,[{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:D.m+80,easing:E.decel,delay:d+i*11,fill:"backwards"})});
  M.countIn(v.querySelectorAll(".deep-key dd"),d+260);
  M.stagger(v.querySelectorAll(".board tbody tr"),d,45);M.grow(v.querySelectorAll(".sig i"),{delay:d+120,step:45});M.countIn(v.querySelectorAll(".board td .num"),d+120);
  M.stagger(v.querySelectorAll(".risk li"),d,45);M.grow(v.querySelectorAll(".rb i"),{delay:d+100,step:45});M.countIn(v.querySelectorAll(".rv"),d+100)}
function landing(){try{sessionStorage.setItem("seer-hero","1")}catch(e){}
  if(!root.classList.contains("m-hero-seen"))each(".hero .mbig",function(el){M.countUp(el,{delay:640,dur:D.xl})});
  M.reveal(".sec-head,.base,.steps > li,.types > li,.feat-copy,.cta-block,.foot-grid > *");
  M.reveal(".feat .viz",{onIn:vizIn});
  /* measurements wait for the first frame so they share its layout instead of forcing an extra one */
  requestAnimationFrame(function(){landingNav();progress();parallaxFallback();pauseOff(".dots")})}

/* ---------- product pages: called by each page script after its first render ---------- */
M.ready=function(){requestAnimationFrame(function(){navInd();condense(doc.querySelector(".shell-bar"));scan(doc);tilt()})};
M.frame=function(f){requestAnimationFrame(f)};

if(doc.body&&doc.body.classList.contains("home"))landing();
window.Motion=M;
})();
