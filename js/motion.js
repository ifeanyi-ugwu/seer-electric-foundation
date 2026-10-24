/* Electric Foundation: motion runtime (window.Motion). Needs js/spring.js before it.
   - patch(): morphs a container into freshly built DOM instead of rebuilding it, so focus, caret and
     scroll positions survive re-renders; keyed items glide to new positions on springs (a re-sort
     mid-flight continues from the current position and velocity), enter from below, leave as fading ghosts.
   - Physics: press, release, hover lift, card tilt and specular, sliding indicators, sheets, the focus-ring
     follower, anchor scrolling and the scroll progress line all run on the spring engine. The springs write
     --m-* custom properties; css/motion.css composes them into one transform per element (.m-phys).
   - Values: numbers count with a critically damped curve, charts interpolate, bars grow, changes get a wash.
   - reveal(): once-only staggered entrance via IntersectionObserver.
   Progressive enhancement throughout: without this file every page still renders and works.
   prefers-reduced-motion: every animation becomes the final state immediately. */
(function(){
"use strict";
var doc=document,root=doc.documentElement,NS="http://www.w3.org/2000/svg",M={},SP=window.Spring;
var mqR=matchMedia("(prefers-reduced-motion: reduce)"),mqFine=matchMedia("(hover: hover) and (pointer: fine)"),mqWide=matchMedia("(min-width: 961px)"),mqPhone=matchMedia("(max-width: 600px)");
function reduced(){return mqR.matches}
var D={xs:120,s:200,m:320,l:520,xl:900};
var E={standard:"cubic-bezier(.2,0,0,1)",decel:"cubic-bezier(.05,.7,.1,1)",decelBack:"cubic-bezier(.9,0,.95,.3)",accel:"cubic-bezier(.3,0,.8,.15)",spring:"cubic-bezier(.3,1.3,.5,1)"};
var STAG=40,MAXSTAG=8;
var SDA=!!(window.CSS&&CSS.supports&&CSS.supports("animation-timeline: view()"));
var LIN=!!(window.CSS&&CSS.supports&&CSS.supports("animation-timing-function","linear(0,1)"));
/* spring curves as WAAPI easings; where linear() is unsupported the bezier tokens stand in */
var SE={};["press","snappy","settle","gentle","glide"].forEach(function(n){var e=SP?SP.ease(n):null;SE[n]=e&&LIN?e:{easing:n==="snappy"?E.spring:n==="press"?E.standard:E.decel,duration:{press:260,snappy:310,settle:330,gentle:580,glide:760}[n]}});
M.D=D;M.E=E;M.SE=SE;M.reduced=reduced;
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
EF.glide=SP?SP.curve("glide"):EF.decel;EF.gentle=SP?SP.curve("gentle"):EF.decel;

/* ---------- physics: springs write --m-* variables, one CSS rule composes them ---------- */
var UNIT={x:"px",y:"px",fx:"px",fy:"px",s:"",r:"deg",rx:"deg",ry:"deg",gx:"px",gy:"px",px:"px",py:"px",l:"px",t:"px",w:"px",h:"px"};
var DEF={s:1};
function applyVars(vals,el){var st=el.style,mv=el.__mv||(el.__mv={}),k,v;
  for(k in vals){v=(k==="s"?vals[k].toFixed(4):vals[k].toFixed(2));if(mv[k]===v)continue;mv[k]=v;st.setProperty("--m-"+k,v+(UNIT[k]||""))}}
function physDone(el){el.classList.remove("m-live");var mv=el.__mv,k;if(!mv)return;
  for(k in mv)if(+mv[k]===(DEF[k]||0)){el.style.removeProperty("--m-"+k);delete mv[k]}
  if(!el.getAttribute("style"))el.removeAttribute("style")}
function drive(el,t,preset,o){if(!SP)return null;o=o||{};if(!o.apply)o.apply=applyVars;if(o.done===undefined)o.done=physDone;
  if(el.classList&&o.apply===applyVars)el.classList.add("m-phys","m-live");return SP.drive(el,t,preset,o)}
M.drive=drive;

/* ---------- one rAF loop for value tweens (numbers, chart attributes) ---------- */
var tw=new Map(),raf=0,uid=0;
function idOf(n){return n.__mid||(n.__mid=++uid)}
function frame(now){raf=0;tw.forEach(function(t,k){var p=(now-t.t0)/t.dur;if(p<0)return;if(p>1)p=1;t.step(t.ease(p),p);if(p===1){tw.delete(k);if(t.done)t.done()}});if(tw.size)raf=requestAnimationFrame(frame)}
function tween(key,dur,step,o){o=o||{};tw.delete(key);
  if(reduced()||dur<=0||doc.hidden){step(1,1);if(o.done)o.done();return}
  step(0,0);tw.set(key,{t0:performance.now()+(o.delay||0),dur:dur,step:step,ease:o.ease||EF.glide,done:o.done});
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
/* a soft violet wash on whatever just changed value (class-based so it survives a morph) */
function wash(el){if(reduced()||!el||!el.classList)return;
  /* one already running restarts by switching to its twin keyframes: no reflow, so a list can wash many rows at once */
  if(el.classList.contains("m-wash"))el.classList.toggle("m-wash2");else el.classList.add("m-wash");
  if(!el.__wl){el.__wl=1;el.addEventListener("animationend",function(e){if(e.target===el&&/^m-wash2?$/.test(e.animationName))el.classList.remove("m-wash","m-wash2")})}}
M.wash=wash;
function setNum(el,text,o){o=o||{};var k=idOf(el)+":n";
  if(el.__nt===text&&tw.has(k))return;
  var cur=el.textContent;el.__nt=text;
  if(cur===text){tw.delete(k);return}
  var a=split(cur),b=split(text);
  if(reduced()||a.t!==b.t||a.n.length!==b.n.length||live(el)){tw.delete(k);setTxt(el,text);return}
  var from=a.n.map(val),to=b.n.map(val);
  if(o.wash!==false)wash(el);
  tween(k,o.dur||D.l,function(e,p){setTxt(el,p===1?text:join(b.t,to.map(function(v,i){return fmt(from[i]+(v-from[i])*e,b.n[i])})))},{delay:o.delay,ease:o.ease||EF.glide})}
M.num=function(el,text,o){if(el)setNum(el,String(text),o||{dur:D.m+80})};
/* count the first number of an element up from zero (used on reveal): critically damped, no wash */
M.countUp=function(el,o){if(!el||reduced()||live(el))return;var text=el.__nt||el.textContent,s=split(text);if(!s.n.length)return;
  var z=s.n.slice();z[0]=fmt(0,s.n[0]);setTxt(el,join(s.t,z));el.__nt=null;o=o||{};o.wash=false;setNum(el,text,o)};
M.countIn=function(l,delay){var i=0;each(l,function(el){M.countUp(el,{delay:(delay||0)+(i++)*40,dur:D.l+240})})};

/* ---------- small helpers for data motion ---------- */
M.grow=function(l,o){o=o||{};var i=0;each(l,function(el){anim(el,[{transform:o.y?"scaleY(0)":"scaleX(0)"},{transform:"none"}],
  {duration:o.dur||SE.gentle.duration,easing:SE.gentle.easing,delay:(o.delay||0)+(i++)*(o.step==null?30:o.step),fill:"backwards"})})};
M.stagger=function(l,delay,step,dist){var i=0;each(l,function(el){anim(el,[{opacity:0,transform:"translateY("+(dist==null?8:dist)+"px)"},{opacity:1,transform:"none"}],
  {duration:SE.settle.duration+90,easing:SE.settle.easing,delay:(delay||0)+Math.min(i++,12)*(step==null?STAG:step),fill:"backwards"})})};
M.pop=function(l,delay,step){var i=0;each(l,function(el){anim(el,[{opacity:0,transform:"scale(.8)"},{opacity:1,transform:"none"}],{duration:SE.snappy.duration,easing:SE.snappy.easing,delay:(delay||0)+(i++)*(step||40),fill:"backwards"})})};
/* violet blocks wipe in along the diagonal (css .m-wipe); the class leaves when the animation ends */
function wipe(el,delay){if(reduced()||!el)return;el.style.setProperty("--m-d",(delay||0)+"ms");el.classList.add("m-wipe");
  el.addEventListener("animationend",function f(e){if(e.animationName!=="m-wipe")return;el.classList.remove("m-wipe");el.style.removeProperty("--m-d");el.removeEventListener("animationend",f)})}
M.wipe=wipe;
/* a ring pulse from a chart endpoint, once it has settled */
M.pulse=function(c){if(reduced()||!c||!c.ownerSVGElement)return;var s=c.ownerSVGElement,rect=c.tagName==="rect",r=doc.createElementNS(NS,rect?"rect":"circle");
  (rect?["x","y","width","height"]:["cx","cy","r"]).forEach(function(a){r.setAttribute(a,c.getAttribute(a))});
  r.setAttribute("fill","none");r.setAttribute("stroke",c.getAttribute("fill")||"var(--violet)");r.setAttribute("stroke-width","1.5");r.setAttribute("vector-effect","non-scaling-stroke");
  r.setAttribute("class","m-ring");r.setAttribute("aria-hidden","true");r.setAttribute("data-m-keep","");r.style.pointerEvents="none";s.appendChild(r);
  var a=anim(r,[{opacity:.7,transform:"scale(1)"},{opacity:0,transform:"scale(2.8)"}],{duration:D.l+180,easing:E.decel});if(a)a.onfinish=function(){r.remove()};else r.remove()};
function pulseLater(el){clearTimeout(el.__pt);el.__pt=setTimeout(function(){if(el.isConnected)M.pulse(el)},40)}
/* chart draw-on: the line wipes in along x (works for solid and dashed strokes), endpoints pop and pulse after it lands */
M.draw=function(svg,o){o=o||{};var d=o.delay||0,n=0;
  each(svg.querySelectorAll(".m-line"),function(p){anim(p,[{clipPath:"inset(-10px 100% -10px -10px)"},{clipPath:"inset(-10px -10px -10px -10px)"}],{duration:D.xl,easing:E.decel,delay:d+(n++)*90,fill:"backwards"})});
  each(svg.querySelectorAll(".m-area"),function(p){anim(p,[{opacity:0},{opacity:1}],{duration:D.l,easing:E.standard,delay:d+D.m,fill:"backwards"})});
  each(svg.querySelectorAll(".m-end"),function(c,i){var a=anim(c,[{opacity:0,transform:"scale(0)"},{opacity:1,transform:"none"}],{duration:SE.snappy.duration,easing:SE.snappy.easing,delay:d+D.xl-120+i*70,fill:"backwards"});
    if(a)a.onfinish=function(){M.pulse(c)}})};
/* everything numeric or bar-like inside a block that just appeared */
M.dataIn=function(el,d){d=(d||0)+100;
  var cnt=[];if(el.matches&&el.matches(".kpi > div,.stat"))cnt=el.querySelectorAll("b");else cnt=el.querySelectorAll(".kpi b,.stat b,.leg b");
  M.countIn(cnt,d);
  M.grow(el.querySelectorAll(".vote-bar i,.sigbar .trk i,.mini"),{delay:d,step:20});
  each(el.querySelectorAll("svg.chart"),function(s){if(s.querySelector(".m-line"))M.draw(s,{delay:d});
    else{M.grow(s.querySelectorAll("rect[data-key]"),{y:1,delay:d,step:35});
      each(s.querySelectorAll("text[data-key]"),function(t){anim(t,[{opacity:0},{opacity:1}],{duration:D.m,delay:d+D.l,fill:"backwards"})})}});
  var i=0;each(el.querySelectorAll("td.h"),function(td){var g=td.style.getPropertyValue("--g");if(g)anim(td,[{transform:"scaleX(0)"},{transform:"scaleX("+g+")"}],{duration:SE.gentle.duration,easing:SE.gentle.easing,delay:d+(i++)*25,fill:"backwards",pseudoElement:"::after"})});
  var dots=el.querySelectorAll(".dotfield circle");
  each(dots,function(c,k){anim(c,[{opacity:0,transform:"scale(0)"},{opacity:1,transform:"none"}],{duration:SE.snappy.duration,easing:SE.snappy.easing,delay:d+((k%10)+Math.floor(k/10))*22,fill:"backwards"})});
  M.pop(el.querySelectorAll(".flag,.won,.badge:not(.ghost)"),d+160,30);
  each(el.querySelectorAll(".btn.lg"),function(b){wipe(b,d+120)})};

/* ---------- reveal on scroll, once ---------- */
var io=null;
function getIO(){if(io||!("IntersectionObserver" in window))return io;
  io=new IntersectionObserver(function(es){var ins=[];es.forEach(function(e){if(e.isIntersecting)ins.push(e.target)});if(!ins.length)return;
    ins.sort(function(a,b){return a.compareDocumentPosition(b)&4?-1:1});
    ins.forEach(function(el,i){io.unobserve(el);show(el,Math.min(i,MAXSTAG)*STAG)})},{rootMargin:"0px 0px -4% 0px",threshold:0});
  return io}
function show(el,delay){if(!el.classList.contains("m-rv"))return;el.classList.remove("m-rv");
  if(el.__wipe)wipe(el,delay);
  else anim(el,[{opacity:0,transform:"translateY("+(el.__rise==null?12:el.__rise)+"px)"},{opacity:1,transform:"none"}],{duration:SE.gentle.duration,easing:SE.gentle.easing,delay:delay,fill:"backwards"});
  if(el.__onIn)el.__onIn(el,delay)}
M.reveal=function(l,o){o=o||{};if(reduced()||!getIO())return;
  each(l,function(el){if(el.__rv)return;el.__rv=1;if(o.onIn)el.__onIn=o.onIn;if(o.rise!=null)el.__rise=o.rise;if(o.wipe)el.__wipe=1;el.classList.add("m-rv");io.observe(el)})};
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
  var done=el.classList.contains("m-end")?function(){pulseLater(el)}:null;
  if(n==="d"){var f=pathLerp(from,to);if(!f){el.setAttribute(n,to);return}
    tween(k,SE.gentle.duration,function(e,p){el.setAttribute("d",p===1?to:f(e))},{ease:EF.gentle});return}
  var a=parseFloat(from),b=parseFloat(to);if(isNaN(a)||isNaN(b)){el.setAttribute(n,to);return}
  tween(k,SE.gentle.duration,function(e,p){el.setAttribute(n,p===1?to:String(+(a+(b-a)*e).toFixed(2)))},{ease:EF.gentle,done:done})}
var WRX=/width:\s*([\d.]+)(px|%)/;
function barFlip(el,a,b){var x=WRX.exec(a||""),y=WRX.exec(b||"");if(!x||!y||x[2]!==y[2])return;var r=+x[1]/(+y[1]||1);if(!isFinite(r)||Math.abs(r-1)<.005||+y[1]===0)return;
  anim(el,[{transform:"scaleX("+r+")"},{transform:"none"}],{duration:SE.gentle.duration,easing:SE.gentle.easing})}

/* ---------- morph ---------- */
var EVT=["onclick","oninput","onchange","onkeydown"],SWAP="h2,h3,.notice,.legend span,.fork-metric,.list-label,.results-line,[role=status]";
var MV=/--m-[\w-]+\s*:\s*[^;]+;?/g;
function isKeep(n){return n.nodeType===1&&n.hasAttribute("data-m-keep")}
function keyOf(n){return n.nodeType===1?n.getAttribute("data-key"):null}
function mClasses(el){return(el.getAttribute("class")||"").split(/\s+/).filter(function(c){return c.indexOf("m-")===0})}
/* motion state in the inline style (--m-* variables written by the springs) survives a morph, like m- classes */
function mVars(el){var s=el.getAttribute("style");return s&&s.indexOf("--m-")>=0?(s.match(MV)||[]).join("").trim():""}
function withVars(v,mv){if(!mv)return v;v=(v||"").trim();return v?v.replace(/;?\s*$/,";")+mv:mv}
function syncAttrs(a,b,ctx){var i,n,v,old,tl=b.getAttribute("data-tween"),list=tl?tl.split(" "):null,mv;
  for(i=a.attributes.length-1;i>=0;i--){n=a.attributes[i].name;if(n.indexOf("data-m")===0||b.hasAttribute(n))continue;
    if(n==="class"){var mk=mClasses(a);if(mk.length){a.setAttribute("class",mk.join(" "));continue}}
    if(n==="style"){mv=mVars(a);if(mv){a.setAttribute("style",mv);continue}}
    a.removeAttribute(n)}
  for(i=0;i<b.attributes.length;i++){n=b.attributes[i].name;v=b.attributes[i].value;old=a.getAttribute(n);
    if(n==="class"){var keep=mClasses(a);if(keep.length)v=(v+" "+keep.join(" ")).trim();if(old!==v)a.setAttribute(n,v);continue}
    if(n==="style"){mv=mVars(a);v=withVars(v,mv)}
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
/* an unchanged subtree (most rows and tiles on most updates) costs one native comparison; only the handlers,
   which are fresh closures on every render, are carried over. Live motion state (m- classes, --m- variables,
   kept nodes, a number mid-count) makes the trees differ, so those still take the full morph. */
function handlers(a,b){var i,n;for(i=0;i<EVT.length;i++){n=EVT[i];if(a[n]!==b[n])a[n]=b[n]}
  for(var x=a.firstElementChild,y=b.firstElementChild;x&&y;x=x.nextElementSibling,y=y.nextElementSibling)handlers(x,y)}
function morphKids(a,b,ctx){var olds=[],news=[],c;
  for(c=a.firstChild;c;c=c.nextSibling)if(!isKeep(c))olds.push(c);
  for(c=b.firstChild;c;c=c.nextSibling)news.push(c);
  var byKey=new Map(),used=new Set(),oi=0,res=[];
  olds.forEach(function(o){var k=keyOf(o);if(k!=null)byKey.set(k,o)});
  news.forEach(function(n){var k=keyOf(n),m=null,j,o;
    if(k!=null){m=byKey.get(k)||null;if(m&&(m.nodeName!==n.nodeName||used.has(m)))m=null}
    else for(j=oi;j<olds.length;j++){o=olds[j];if(!used.has(o)&&keyOf(o)==null&&o.nodeName===n.nodeName){m=o;oi=j+1;break}}
    if(m){used.add(m);if(m.nodeType===1){if(m.isEqualNode(n))handlers(m,n);else morphEl(m,n,ctx)}else if(m.nodeValue!==n.nodeValue)setText(m,n.nodeValue,ctx);res.push(m)}
    else{res.push(n);ctx.added.push(n)}});
  olds.forEach(function(o){if(!used.has(o)){if(ctx.drop)ctx.drop(o,a);else if(o.parentNode===a){ctx.removed.push({n:o,p:a,next:o.nextSibling});try{a.removeChild(o)}catch(e){}}}});
  var tail=null;for(c=a.lastChild;c&&isKeep(c);c=c.previousSibling)tail=c;
  var cur=a.firstChild;
  res.forEach(function(n){while(cur&&cur!==tail&&isKeep(cur))cur=cur.nextSibling;if(cur===tail)cur=null;
    /* a node that is already here moves with moveBefore where it exists: it keeps its computed style, focus and
       running animations, so only its layout is redone */
    if(n===cur)cur=cur.nextSibling;else if(a.moveBefore&&n.parentNode===a)a.moveBefore(n,cur||tail);else a.insertBefore(n,cur||tail)})}

/* ---------- FLIP on springs, enters, ghosts ---------- */
function clipOf(el,cache){var sc=el.closest&&el.closest(".tbl,.tbl-wrap,.panel"),r=cache&&cache.get(sc||doc);if(r)return r;
  r={top:0,left:0,bottom:innerHeight,right:innerWidth};
  if(sc){var s=sc.getBoundingClientRect();r={top:Math.max(0,s.top),left:Math.max(0,s.left),bottom:Math.min(innerHeight,s.bottom),right:Math.min(innerWidth,s.right)}}
  if(cache)cache.set(sc||doc,r);return r}
function visIn(r,c){return r.width>0&&r.bottom>c.top&&r.top<c.bottom&&r.right>c.left&&r.left<c.right}
function ghost(el,f){var g=el.cloneNode(true),host=doc.createElement("div");
  g.removeAttribute("id");g.removeAttribute("tabindex");each(g.querySelectorAll("[id],[tabindex]"),function(x){x.removeAttribute("id");x.removeAttribute("tabindex")});
  g.classList.remove("m-phys","m-live","m-wash","m-wash2");g.style.removeProperty("--m-fx");g.style.removeProperty("--m-fy");
  if(el.tagName==="TR"){var t=doc.createElement("table"),tb=doc.createElement("tbody");t.style.cssText="width:100%;min-width:0;border-collapse:collapse"+(f.w?";table-layout:fixed":"");
    if(f.w)Array.prototype.forEach.call(g.children,function(td,i){td.style.width=f.w[i]+"px"});tb.appendChild(g);t.appendChild(tb);host.className=f.wc;host.appendChild(t)}
  else{g.style.width="100%";g.style.height="100%";g.style.margin="0";host.appendChild(g)}
  host.classList.add("m-ghost");host.setAttribute("aria-hidden","true");host.inert=true;
  var c=f.c,r=f.r,clip="inset("+Math.max(0,c.top-r.top)+"px "+Math.max(0,r.right-c.right)+"px "+Math.max(0,r.bottom-c.bottom)+"px "+Math.max(0,c.left-r.left)+"px)";
  host.style.cssText="position:fixed;left:"+r.left+"px;top:"+r.top+"px;width:"+r.width+"px;height:"+r.height+"px;margin:0;padding:0;z-index:15;pointer-events:none;overflow:hidden;max-height:none;background:"+(el.tagName==="TR"?"var(--card)":"none")+";clip-path:"+clip;
  doc.body.appendChild(host);
  /* exits accelerate and take 60% of an entrance */
  var a=anim(host,[{opacity:1,transform:"none"},{opacity:0,transform:"translateY(-4px) scale(.985)"}],{duration:D.s,easing:E.accel,fill:"forwards"});
  if(a)a.onfinish=function(){host.remove()};else host.remove()}
function enterKf(el,i,dist){if(el.__flip){el.__flip.cancel();el.__flip=null}unreveal(el);
  el.__flip=anim(el,[{opacity:0,transform:"translateY("+(dist||8)+"px)"},{opacity:1,transform:"none"}],{duration:SE.settle.duration+90,easing:SE.settle.easing,delay:Math.min(i,MAXSTAG)*STAG,fill:"backwards"})}
/* a list move: the spring starts at the old visual offset and keeps whatever velocity it already had.
   Long moves (more than 600px) take the softer spring, so a row heading for the far end of a long table
   leaves readably instead of streaking. */
function flipTo(el,dx,dy){el.__fl=1;var far=Math.abs(dy)>600||Math.abs(dx)>600;
  drive(el,{fx:0,fy:0},far?"gentle":"settle",{from:{fx:dx,fy:dy},eps:.3})}
function flipStop(el){el.__fl=0;if(SP)SP.stop(el,true);applyVars({fx:0,fy:0},el);physDone(el)}
/* a node a page detaches to reuse later goes back to rest, so it never returns mid-glide */
function rest(el){if(!el||el.nodeType!==1)return;if(el.__flip){el.__flip.cancel();el.__flip=null}if(el.__fl)flipStop(el);el.classList.remove("m-wait")}
/* A row leaving a positioned list that is not in table layout exits where it stands: it stays in the DOM, out of
   flow at its last visual position, hidden from assistive tech, and fades like a ghost (css .m-out). A clone
   would need its whole content laid out again; this costs one small layout. Its handlers are held back so a
   click on the fading row does nothing. It leaves the DOM when the fade ends, or comes straight back (back)
   if the list wants it again first. */
function exitAt(n,f){rest(n);n.__out=1;n.setAttribute("data-m-keep","");n.setAttribute("aria-hidden","true");
  var off=[],all=[n].concat([].slice.call(n.getElementsByTagName("*")));
  all.forEach(function(e){var o=null,i;for(i=0;i<EVT.length;i++)if(e[EVT[i]]){if(!o)o={e:e,h:{}};o.h[EVT[i]]=e[EVT[i]];e[EVT[i]]=null}if(o)off.push(o)});n.__off=off;
  var s=n.style,p=f.pr;s.position="absolute";s.margin="0";s.left=(f.r.left-p.left)+"px";s.top=(f.r.top-p.top)+"px";s.width=f.r.width+"px";s.height=f.r.height+"px";
  /* done on animationend, or by a timer when no animation runs (a hidden tab, motion switched off mid-fade) */
  n.__oe=function(e){if(e&&(e.target!==n||e.animationName!=="m-exit"))return;var q=n.parentNode;back(n);if(q)q.removeChild(n)};
  n.addEventListener("animationend",n.__oe);n.__ot=setTimeout(n.__oe,D.s+400);n.classList.add("m-out")}
function back(n){if(!n||!n.__out)return;n.__out=0;clearTimeout(n.__ot);if(n.__oe){n.removeEventListener("animationend",n.__oe);n.__oe=null}
  n.removeAttribute("data-m-keep");n.removeAttribute("aria-hidden");n.classList.remove("m-out");
  (n.__off||[]).forEach(function(o){for(var k in o.h)o.e[k]=o.h[k]});n.__off=null;
  ["position","margin","left","top","width","height"].forEach(function(k){n.style.removeProperty(k)});if(!n.getAttribute("style"))n.removeAttribute("style")}

M.patch=function(target,next,o){o=o||{};
  var ctx={added:[],removed:[],swapped:new Set(),animate:o.animate!==false&&!reduced()},sel=o.flip;
  var ae=doc.activeElement,ss=null,se=null;try{ss=ae.selectionStart;se=ae.selectionEnd}catch(e){}
  /* rapid interactions coalesce into one pending job per container: the earliest "first" positions win */
  var job=target.__mjob;
  if(ctx.animate&&sel){if(!job){job=target.__mjob={first:new Map(),sel:sel,added:[],removed:[]}}
    var tcache=new Map(),cc=new Map(),pcache=new Map();/* per table: wrapper class + column widths, read once from the header row; per scroll box: its clip; per list: its box and whether rows can exit in place */
    each(target.querySelectorAll(sel),function(el){if(job.first.has(el))return;var r=el.getBoundingClientRect(),c=clipOf(el,cc);if(!visIn(r,c))return;
      var par=el.parentNode,pi=pcache.get(par);if(!pi){var ps=getComputedStyle(par);pi={r:par.getBoundingClientRect(),ip:ps.position!=="static"&&ps.display!=="table-row-group"};pcache.set(par,pi)}
      var f={r:r,c:c,par:par,pr:pi.r,ip:pi.ip,pc:par.getAttribute&&par.getAttribute("class")||""};
      if(el.tagName==="TR"){var tb=el.closest("table"),tc=tcache.get(tb);
        if(!tc){var w=el.closest(".tbl,.tbl-wrap"),hr=tb.querySelector("thead tr");tc={wc:w?w.className:"",w:null};
          if(hr&&getComputedStyle(el).display==="table-row")tc.w=Array.prototype.map.call(hr.children,function(th){return th.getBoundingClientRect().width});tcache.set(tb,tc)}
        f.wc=tc.wc;f.w=tc.w}
      job.first.set(el,f)})}
  /* next is either freshly built DOM to morph into target, or a function that updates target's live DOM itself
     (a page that keeps its nodes) and reports what it added and removed in ctx, so moves, entrances and exits
     animate exactly as they do for a morph */
  /* drop(node, parent): take a node out (a list item on screen in a positioned list exits in place);
     back(node): a node still exiting is wanted again, so it returns to the flow where it is */
  /* a container can be re-used for something else in the same pass (the grid becomes the table, the list becomes the empty state): its
     class changes and it may stop being positioned, and a card fading "in place" would then be drawn at the corner of the page. So a
     card fades in place only while its container is still the same kind of positioned list. */
  var posOK=new Map();function stillList(p,f){if(!f||!p||p!==f.par)return false;var c=p.getAttribute&&p.getAttribute("class")||"";if(c!==f.pc)return false;
    var v=posOK.get(p);if(v==null){v=getComputedStyle(p).position!=="static";posOK.set(p,v)}return v}
  ctx.drop=function(n,p){var f=ctx.animate&&job&&job.first&&job.first.get(n);if(f&&f.ip&&n.nodeType===1&&stillList(p,f)){exitAt(n,f);return}
    /* removing a focused node fires its blur handler at once, and that handler can re-render and move the node: tolerate it */
    if(n.parentNode!==p)return;ctx.removed.push({n:n,p:p,next:n.nextSibling});try{p.removeChild(n)}catch(e){}};
  ctx.back=back;
  if(typeof next==="function"){
    next(ctx);ctx.removed.forEach(function(r){rest(r.n)});
    /* o.lazy: a new row starts as an empty box of its usual size (css .m-wait); settle fills the ones that fade in
       a few per frame, just ahead of their staggered entrance, so no single frame lays out a screenful of rows */
    if(o.lazy&&ctx.animate&&sel)ctx.added.forEach(function(n){if(n.nodeType===1&&n.matches(sel))n.classList.add("m-wait")})}
  else{wrapSel(next);morphKids(target,next,ctx)}
  if(ae&&ae!==doc.body&&ae!==doc.activeElement&&ae.isConnected){try{ae.focus({preventScroll:true});if(ss!=null)ae.setSelectionRange(ss,se)}catch(e){}}
  if(ctx.animate){
    if(!job){job=target.__mjob={first:null,sel:null,added:[],removed:[]}}
    job.added=job.added.concat(ctx.added);job.removed=job.removed.concat(ctx.removed);
    if(!job.raf)job.raf=requestAnimationFrame(function(){target.__mjob=null;settle(target,job)})}
  scan(target);
  return ctx};
/* Runs in the next frame, before paint: clears live offsets, reads all new positions in one pass, then writes all springs. */
function settle(target,job){var first=job.first,sel=job.sel,moves=[],enters=[];
  if(first)first.forEach(function(f,el){if(!el.isConnected&&f.par&&f.par.isConnected)ghost(el,f)});
  if(first){var all=target.querySelectorAll(sel);
    all=[].filter.call(all,function(el){return!el.__out});
    each(all,function(el){if(el.__flip){el.__flip.cancel();el.__flip=null}if(el.__fl){el.style.setProperty("--m-fx","0px");el.style.setProperty("--m-fy","0px");if(el.__mv){el.__mv.fx=el.__mv.fy=null}}});
    var cc=new Map();each(all,function(el){var r=el.getBoundingClientRect(),f=first.get(el),c=clipOf(el,cc);
      if(f){var dx=f.r.left-r.left,dy=f.r.top-r.top;if(Math.abs(dx)>=1||Math.abs(dy)>=1)moves.push([el,dx,dy,r.height,visIn(r,c)?0:1]);
        else if(el.__fl)flipStop(el)}
      else if(visIn(r,c))enters.push(el)});
    /* at most 60 rows glide at once; the ones that stay on screen come first, the ones leaving it may simply go */
    moves.sort(function(a,b){return a[4]-b[4]});
    moves.slice(0,60).forEach(function(m){flipTo(m[0],m[1],m[2]);if(Math.abs(m[2])>m[3]*2.5)wash(m[0])});
    moves.slice(60).forEach(function(m){if(m[0].__fl)flipStop(m[0])});
    enters.slice(0,24).forEach(function(el,i){enterKf(el,i)});
    var queue=[];job.added.forEach(function(n){if(n.classList&&n.classList.contains("m-wait")&&enters.indexOf(n)<0)n.classList.remove("m-wait")});
    enters.forEach(function(el,i){if(!el.classList.contains("m-wait"))return;if(i>=24)el.classList.remove("m-wait");else queue.push([el,performance.now()+Math.min(i,MAXSTAG)*STAG])});
    if(queue.length)fill(queue)}
  var k=0;
  job.added.forEach(function(n){if(n.nodeType!==1||!n.isConnected)return;
    if(n instanceof SVGElement){if(n.hasAttribute("data-key")){if(n.tagName==="rect")M.grow(n,{y:1,delay:(k++)*30});else anim(n,[{opacity:0},{opacity:1}],{duration:D.m,delay:D.s,fill:"backwards"})}return}
    if(sel&&(n.matches(sel)||n.querySelector(sel)))return;
    anim(n,[{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:SE.settle.duration+90,easing:SE.settle.easing,delay:Math.min(k++,MAXSTAG)*35,fill:"backwards"});
    M.dataIn(n,k*35)});
  job.removed.forEach(function(r){var n=r.n;if(n instanceof SVGElement&&n.hasAttribute&&n.hasAttribute("data-key")&&r.p.isConnected&&!n.isConnected){
    n.setAttribute("data-m-keep","");n.setAttribute("aria-hidden","true");r.p.appendChild(n);
    var a=anim(n,[{opacity:1},{opacity:0}],{duration:D.s,easing:E.accel,fill:"forwards"});if(a)a.onfinish=function(){n.remove()};else n.remove()}})}

/* release waiting rows: every row whose entrance starts within the next 50ms, at least two and at most six per frame */
function fill(q){requestAnimationFrame(function(){var now=performance.now()+50,n=0;
  while(q.length&&n<6&&(n<2||q[0][1]<=now)){q.shift()[0].classList.remove("m-wait");n++}
  if(q.length)fill(q)})}

/* ---------- sliding indicators (segmented controls, tab rows): two edge springs, the leading one stiffer ---------- */
/* set up once per host; after that its own observers (aria-pressed, children, size) move it, so a re-render
   that changes nothing here costs no layout read */
function indicator(host){if(host.__ind)return;
  if(!host.querySelector(":scope > button[aria-pressed]"))return;
  var ind=doc.createElement("span"),firstPlace=true,q=0;ind.className="m-ind";ind.setAttribute("aria-hidden","true");ind.setAttribute("data-m-keep","");
  host.appendChild(ind);host.classList.add("m-ind-host");
  function set(l,r,t){ind.__l=l;ind.__r=r;ind.__t=t;ind.style.transform="translate("+l.toFixed(2)+"px,"+t.toFixed(2)+"px)";ind.style.width=Math.max(0,r-l).toFixed(2)+"px"}
  function place(){q=0;var a=host.querySelector(":scope > button[aria-pressed=true]");if(!a||!host.isConnected){ind.style.opacity="0";return}
    var l=a.offsetLeft,t=a.offsetTop,w=a.offsetWidth,h=a.offsetHeight;if(!w){return}
    /* sized to the active button (not a clipped full-width box) so what assistive tools read matches what is drawn */
    ind.style.height=h+"px";ind.style.borderRadius=getComputedStyle(a).borderTopLeftRadius;ind.style.opacity="1";host.classList.add("m-ind-on");
    if(firstPlace||reduced()||!SP){firstPlace=false;if(SP)SP.stop(ind);set(l,l+w,t);return}
    var right=l>=ind.__l;
    SP.drive(ind,{l:l,r:l+w,t:t},{l:right?"settle":"snappy",r:right?"snappy":"settle",t:"snappy"},{init:{l:ind.__l,r:ind.__r,t:ind.__t},apply:function(v){set(v.l,v.r,v.t)},eps:.25})}
  function later(){if(!q)q=requestAnimationFrame(place)}
  host.__ind=later;
  new MutationObserver(later).observe(host,{subtree:true,attributes:true,attributeFilter:["aria-pressed"],childList:true});
  if(window.ResizeObserver)new ResizeObserver(function(){firstPlace=true;later()}).observe(host);
  later()}

/* ---------- charts: a readout that follows the pointer with damping (lines with data-y on the svg) ---------- */
function chartHover(svg){if(svg.__ch||!svg.getAttribute("data-y"))return;svg.__ch=1;
  var g=null,q=0,ev=null,on=false;
  function build(){var sc=svg.getAttribute("data-y").split(" ").map(Number),fm=(svg.getAttribute("data-fmt")||"||").split("|"),lines=[].slice.call(svg.querySelectorAll(".m-line")),W=+svg.getAttribute("width")||svg.clientWidth;
    g=doc.createElementNS(NS,"g");g.setAttribute("class","m-cross");g.setAttribute("aria-hidden","true");g.setAttribute("data-m-keep","");
    var ln=doc.createElementNS(NS,"line");ln.setAttribute("y1",sc[2]);ln.setAttribute("y2",sc[3]);g.appendChild(ln);
    var box=doc.createElementNS(NS,"rect");box.setAttribute("height",lines.length*16+8);box.setAttribute("width",64);g.appendChild(box);
    var marks=lines.map(function(p,i){var c=doc.createElementNS(NS,"circle"),t=doc.createElementNS(NS,"text");c.setAttribute("r","4");c.setAttribute("fill",p.getAttribute("stroke")||"var(--violet)");
      t.setAttribute("font-size","11");t.setAttribute("y",sc[2]+16+i*16);g.appendChild(c);g.appendChild(t);return{p:p,c:c,t:t,pts:null}});
    svg.appendChild(g);
    return{sc:sc,fm:fm,marks:marks,ln:ln,box:box,W:W}}
  var st=null;
  function place(x){if(!st)st=build();var sc=st.sc,v,s;
    x=Math.max(sc[4],Math.min(sc[5],x));st.ln.setAttribute("x1",x);st.ln.setAttribute("x2",x);
    var flip=x>st.W-80,bx=flip?x-72:x+8;st.box.setAttribute("x",bx);st.box.setAttribute("y",sc[2]+2);
    st.marks.forEach(function(m){var pt=pts(m.p.getAttribute("d"));if(!pt)return;var y=sample(pt,x);m.c.setAttribute("cx",x);m.c.setAttribute("cy",y);
      v=sc[1]-(y-sc[2])/(sc[3]-sc[2])*(sc[1]-sc[0]);s=st.fm[0]+v.toFixed(+st.fm[1]||0)+st.fm[2];m.t.textContent=s;m.t.setAttribute("x",bx+6);m.t.setAttribute("fill",m.p.getAttribute("stroke")||"var(--text)")})}
  function move(e){var r=svg.getBoundingClientRect(),x=(e.clientX-r.left)*(st&&st.W||svg.clientWidth)/r.width;
    if(!on){on=true;place(x);g.classList.add("m-on");if(SP&&!reduced())SP.drive(svg,{x:x},"snappy",{apply:function(v){place(v.x)},eps:.3});return}
    if(SP&&!reduced())SP.drive(svg,{x:x},"snappy",{apply:function(v){place(v.x)},eps:.3});else place(x)}
  svg.addEventListener("pointermove",function(e){ev=e;if(!q)q=requestAnimationFrame(function(){q=0;if(ev)move(ev)})},{passive:true});
  svg.addEventListener("pointerdown",function(e){ev=e;move(e)},{passive:true});
  svg.addEventListener("pointerleave",function(){on=false;if(g)g.classList.remove("m-on")},{passive:true})}

/* ---------- selects: a wrapper that carries the chevron, so it can turn while the menu is open ---------- */
/* Every select.field gets a <span class="sel-wrap"> (not "m-": the wrapper is structure, not state). Freshly built DOM
   is wrapped before it is morphed in (patch), so old and new trees match node for node and the live select, with its
   focus, value and handlers, is kept. A select already on the page is moved with moveBefore where it exists (it
   keeps focus), otherwise refocused. Idempotent. */
function wrapSel(r){if(!r||!r.querySelectorAll)return;var l=r.querySelectorAll("select.field"),i,s,p,w,f;
  for(i=0;i<l.length;i++){s=l[i];p=s.parentNode;if(!p||p.classList&&p.classList.contains("sel-wrap"))continue;
    w=doc.createElement("span");w.className="sel-wrap";f=doc.activeElement===s;p.insertBefore(w,s);
    if(w.moveBefore&&s.isConnected){try{w.moveBefore(s,null)}catch(e){w.appendChild(s)}}else w.appendChild(s);
    if(f&&doc.activeElement!==s){try{s.focus({preventScroll:true})}catch(e){}}}
  selOpen()}
M.selects=wrapSel;
/* Open state: CSS reads select:open where it exists (Chromium 135+). Elsewhere one set of delegated listeners keeps
   .m-open on the wrapper, best effort: a press toggles it; change, blur, Escape, Tab, Enter on an open menu and the
   window losing focus close it; Space, F4 and Alt+Up/Down (plus the arrows and Enter on macOS) open it from the
   keyboard. A native menu holds the pointer while it is open, so the page seeing the pointer travel again (after a
   moment, by more than a few pixels) means it has closed. When unsure it errs towards closed. */
var HAS_OPEN=(function(){try{return CSS.supports("selector(select:open)")}catch(e){return false}})();
function selOf(t){return t&&t.tagName==="SELECT"&&t.parentNode&&t.parentNode.classList&&t.parentNode.classList.contains("sel-wrap")?t:null}
var selAt=null;
function selSet(s,on){var w=s&&s.parentNode;selAt=null;if(w&&w.classList.contains("m-open")!==on)w.classList.toggle("m-open",on)}
function selIs(s){return s.parentNode.classList.contains("m-open")}
function selOpen(){if(selOpen.on||HAS_OPEN)return;selOpen.on=1;var mac=/Mac|iP(hone|ad|od)/.test(navigator.platform||""),tp="";
  doc.addEventListener("pointerdown",function(e){var s=selOf(e.target);tp=e.pointerType;if(!s||e.button>0||s.disabled||tp==="touch")return;
    var o=!selIs(s);selSet(s,o);if(o)selAt={s:s,x:e.clientX,y:e.clientY,t:e.timeStamp}},true);
  doc.addEventListener("pointermove",function(e){var a=selAt;if(a&&e.pointerType!=="touch"&&e.timeStamp-a.t>250&&Math.abs(e.clientX-a.x)+Math.abs(e.clientY-a.y)>6)selSet(a.s,false)},{passive:true});
  /* touch opens the picker on the tap itself */
  doc.addEventListener("click",function(e){var s=selOf(e.target);if(s&&tp==="touch"&&!s.disabled)selSet(s,true)},true);
  doc.addEventListener("change",function(e){var s=selOf(e.target);if(s)selSet(s,false)},true);
  doc.addEventListener("focusout",function(e){var s=selOf(e.target);if(s)selSet(s,false)},true);
  doc.addEventListener("keydown",function(e){var s=selOf(e.target);if(!s||s.disabled)return;var k=e.key,o=selIs(s);
    if(k==="Escape"||k==="Tab"||(k==="Enter"&&o))selSet(s,false);
    else if(k==="F4"||(e.altKey&&(k==="ArrowDown"||k==="ArrowUp")))selSet(s,!o);
    else if(k===" "||(mac&&(k==="ArrowDown"||k==="ArrowUp"||k==="Enter")))selSet(s,true)},true);
  addEventListener("blur",function(){each(doc.querySelectorAll(".sel-wrap.m-open"),function(w){w.classList.remove("m-open")})})}

function scan(r){r=r||doc;wrapSel(r);if(r.matches&&r.matches(".seg,.tabs,.pv-tabs"))indicator(r);each(r.querySelectorAll(".seg,.tabs,.pv-tabs"),indicator);
  each(r.querySelectorAll("svg.chart[data-y]"),chartHover);}
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
    var set=function(l,w){ind.style.transform="translateX("+l.toFixed(2)+"px)";ind.style.width=w.toFixed(2)+"px"};
    var place=function(){set(cur.offsetLeft,cur.offsetWidth);ind.style.top=cur.offsetTop+"px";ind.style.height=cur.offsetHeight+"px"};
    place();if(window.ResizeObserver)new ResizeObserver(place).observe(nav);
    /* glide from where the previous product's indicator was (survives the page change; works with or without View Transitions) */
    var prev=null;try{prev=JSON.parse(sessionStorage.getItem("m-nav")||"null");sessionStorage.removeItem("m-nav")}catch(e){}
    if(prev&&SP&&!reduced()&&Date.now()-prev.t<4000&&prev.h!==location.pathname){var l0=prev.l-prev.s+nav.scrollLeft,l1=cur.offsetLeft,right=l1>=l0;
      SP.drive(ind,{l:l1,r:l1+cur.offsetWidth},{l:right?"settle":"snappy",r:right?"snappy":"settle"},{init:{l:l0,r:l0+prev.w},apply:function(v){set(v.l,v.r-v.l)},eps:.25})}
    nav.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a");if(!a||a===cur)return;
      try{sessionStorage.setItem("m-nav",JSON.stringify({l:cur.offsetLeft,w:cur.offsetWidth,s:nav.scrollLeft,t:Date.now(),h:location.pathname}))}catch(x){}})}}

/* ---------- page header: pinned, condensing like the sheet bar, the secondary row tucked while scrolling down ----------
   The same states and thresholds as sheetHead: .m-scrolled as soon as the page moves, .m-cond past 24px (back below
   12px). Headers with a second row (the product nav on phones, the landing's Documentation and Blog row) add .m-tuck:
   16px of scrolling down, once past the header's own height, tucks that row under the core row; 12px back up, the
   top of the page, or focus inside the row brings it back, and it never tucks while it holds focus. The scroll
   position is clamped to the scrollable range, so a rubber-band bounce reads as no movement. Everything the CSS
   moves is measured here from the layout (offsets ignore transforms): the content rises by --hd-d (half the top
   padding, at most 10px), the ground by --hd-rc so the bottom padding matches the condensed top one, or by --hd-rt
   to just below the core row when tucked; --hd-n (the difference) lifts and clips the second row so its bottom edge
   travels with the ground. Classes and the root's --hdr-h (the visible height, for sticky table heads) change only
   when a threshold is crossed; scroll-padding-top holds the condensed height with the second row showing, plus 12px,
   so focus and anchors never land under it. o: {core, row2} selectors inside the bar; spacer, the element that holds
   the fixed bar's place in the flow (kept at the bar's height). */
var HD_ON=24,HD_OFF=12,HD_DOWN=16,HD_UP=12,satProbe=null;
function sat(){if(!satProbe){satProbe=doc.createElement("div");satProbe.setAttribute("aria-hidden","true");
    satProbe.style.cssText="position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:env(safe-area-inset-top,0px)";doc.body.appendChild(satProbe)}
  return satProbe.offsetHeight}
function offIn(el,bar){var y=0;while(el&&el!==bar){y+=el.offsetTop;el=el.offsetParent}return y}
var HD=null;
function pinHead(bar,o){if(!bar||bar.__ph)return;bar.__ph=1;o=o||{};
  var core=[].slice.call(bar.querySelectorAll(o.core||":scope > *")),row2=o.row2?bar.querySelector(o.row2):null,
      g={H:0,rc:0,rt:0,rows:false},st={s:null,c:null,t:null},last=-1,acc=0,q=0,hv=null;
  function measure(){var H=bar.offsetHeight,top=1e9,bot=0,all=0,i,el,t,b;if(!H)return;
    for(i=0;i<core.length;i++){el=core[i];if(!el.offsetHeight)continue;t=offIn(el,bar);b=t+el.offsetHeight;top=Math.min(top,t);bot=Math.max(bot,b)}
    if(top>H)return;all=bot;
    var r2=row2&&row2.offsetHeight?offIn(row2,bar):-1,rows=r2>=bot-1;if(r2>=0)all=Math.max(all,r2+row2.offsetHeight);
    var pad=Math.max(0,top-sat()),d=Math.max(2,Math.min(10,Math.round(pad/2))),pc=pad-d,
        rc=Math.max(0,Math.round(H-(all-d+pc))),rt=rows?Math.max(rc,Math.round(H-(bot-d+pc))):rc;
    g={H:H,rc:rc,rt:rt,rows:rows};
    bar.style.setProperty("--hd-d",d+"px");bar.style.setProperty("--hd-rc",rc+"px");bar.style.setProperty("--hd-rt",rt+"px");bar.style.setProperty("--hd-n",(rt-rc)+"px");
    if(o.spacer&&o.spacer.offsetHeight!==H)o.spacer.style.minHeight=H+"px";
    root.style.scrollPaddingTop=(H-rc+12)+"px";last=-1;upd();show(true)}
  function focusIn(){var a=doc.activeElement;return!!(row2&&a&&row2.contains(a))}
  function show(force){var h=g.H-(st.t?g.rt:st.c?g.rc:0);if(force||h!==hv){hv=h;root.style.setProperty("--hdr-h",h+"px")}}
  function upd(){q=0;var max=Math.max(0,root.scrollHeight-innerHeight),y=Math.max(0,Math.min(scrollY,max)),dy=last<0?0:y-last;last=y;
    var s=y>0,c=st.c?y>HD_OFF:y>HD_ON,t=!!st.t;
    if(!g.rows||y<=HD_OFF){t=false;acc=0}
    else if(dy){acc=(acc>0)===(dy>0)?acc+dy:dy;if(acc>HD_DOWN&&y>g.H)t=true;else if(acc<-HD_UP)t=false}
    if(t&&focusIn())t=false;
    if(s!==st.s){st.s=s;bar.classList.toggle("m-scrolled",s)}
    if(c!==st.c){st.c=c;bar.classList.toggle("m-cond",c)}
    if(t!==st.t){st.t=t;bar.classList.toggle("m-tuck",t)}
    show()}
  addEventListener("scroll",function(){if(!q)q=requestAnimationFrame(upd)},{passive:true});
  /* keyboard focus moving into a tucked row brings it back at once */
  if(row2)row2.addEventListener("focusin",function(){acc=0;if(st.t){st.t=false;bar.classList.remove("m-tuck");show()}});
  measure();if(window.ResizeObserver)new ResizeObserver(measure).observe(bar);
  /* anchors: the header height to clear at a destination (scrolling down past the header tucks its second row) */
  HD=function(y){return(y>Math.max(scrollY,g.H)&&g.rows?g.H-g.rt:y>HD_ON?g.H-g.rc:g.H)+12}}
M.pinHead=pinHead;

/* ---------- press, hover lift, tilt: delegated, so re-rendered controls need no setup ---------- */
var PRESS=".btn,.chip,.tab,.pick,.sel,.star,.mcard,.pill,.btn-v,.btn-w,.app,.shell-products a,.shell-icon,.theme-toggle,.seg > button,th button,.rtbl tr[tabindex],input[type=checkbox]";
var HOVER=".mgrid .mcard,.pick,.rtbl tr[tabindex],.btn.lg,.btn.act,.pill,.btn-v,.btn-w,.btn-pill,.app,tr[tabindex]";
var LIFT=[[".mgrid .mcard",-3],[".pick",-2],[".rtbl tr[tabindex]",-1],[".btn.lg,.btn.act,.pill,.btn-v,.btn-w,.btn-pill,.app",-1]];
function liftOf(t){for(var i=0;i<LIFT.length;i++)if(t.matches(LIFT[i][0]))return LIFT[i][1];return 0}
function pressScale(t){return t.matches("input[type=checkbox]")?.86:t.matches(".star")?.8:t.matches(".mcard,.pick,.app,.rtbl tr")?.985:t.matches("th button")?.94:.965}
/* a table row (table layout, or a desktop row grid) stays flat; a row reflowed into a card (its body is a grid) lifts and presses */
function flatRow(t){return t.tagName==="TR"&&getComputedStyle(t.parentNode).display!=="grid"}
function phys(){if(phys.on||!SP)return;phys.on=1;var pressed=null,hov=null,card=null,rect=null,ev=null,q=0;
  doc.addEventListener("pointerdown",function(e){if(reduced()||e.button>0)return;var t=e.target.closest&&e.target.closest(PRESS);
    if(!t||t.matches(".mcard.static")||t.getAttribute("aria-disabled")==="true")return;
    if(flatRow(t))return;
    pressed=t;drive(t,{s:pressScale(t)},"press",{eps:.0008})},{passive:true});
  function release(){if(!pressed)return;drive(pressed,{s:1},"press",{eps:.0008});pressed=null}
  doc.addEventListener("pointerup",release,{passive:true});doc.addEventListener("pointercancel",release,{passive:true});addEventListener("blur",release);
  /* keyboard activation gets the same give */
  doc.addEventListener("keydown",function(e){if(reduced()||(e.key!==" "&&e.key!=="Enter")||e.repeat)return;var t=e.target.closest&&e.target.closest(PRESS);if(!t||t.tagName==="INPUT"&&t.type!=="checkbox")return;
    if(flatRow(t))return;pressed=t;drive(t,{s:pressScale(t)},"press",{eps:.0008})});
  doc.addEventListener("keyup",release);
  function leave(t){drive(t,{y:0,rx:0,ry:0,px:0,py:0},"settle",{eps:.05});t.style.setProperty("--m-gl","0");if(t===card){card=null;rect=null}}
  doc.addEventListener("pointerover",function(e){if(reduced()||!mqFine.matches||e.pointerType==="touch")return;var t=e.target.closest&&e.target.closest(HOVER);
    if(t&&t.matches(".mcard.static"))t=null;
    if(t===hov)return;if(hov)leave(hov);hov=t;if(!t)return;
    if(t.tagName==="TR"){var r=t.getBoundingClientRect();t.classList.toggle("m-from-b",e.clientY>r.top+r.height/2);if(flatRow(t))return}
    var l=liftOf(t);if(l)drive(t,{y:l},"settle",{eps:.05});
    if(t.matches(".mgrid .mcard")){card=t;rect=t.getBoundingClientRect();t.style.setProperty("--m-gl","1")}},{passive:true});
  doc.addEventListener("pointerout",function(e){if(!hov)return;var rt=e.relatedTarget;if(rt&&hov.contains(rt))return;if(e.target!==hov&&!hov.contains(e.target))return;leave(hov);hov=null},{passive:true});
  /* tilt towards the pointer, the specular highlight and the inner parallax follow with a little lag */
  doc.addEventListener("pointermove",function(e){if(!card)return;ev=e;
    if(!q)q=requestAnimationFrame(function(){q=0;if(!card||!rect)return;var x=Math.max(-.5,Math.min(.5,(ev.clientX-rect.left)/rect.width-.5)),y=Math.max(-.5,Math.min(.5,(ev.clientY-rect.top)/rect.height-.5));
      drive(card,{rx:-y*8,ry:x*8,gx:x*rect.width*.6,gy:y*rect.height*.6,px:-x*4,py:-y*4},"settle",{eps:.05})})},{passive:true});
  addEventListener("scroll",function(){if(card)rect=card.getBoundingClientRect()},{passive:true})}

/* ---------- keyboard focus: a follower ring glides from the last focused control to the next ---------- */
function focusRing(){if(focusRing.on||!SP)return;focusRing.on=1;var ring=null,lastR=null,lastT=0;
  doc.addEventListener("focusin",function(e){var t=e.target;if(!t.matches)return;
    requestAnimationFrame(function(){var vis;try{vis=t.matches(":focus-visible")||t.tagName==="SELECT"}catch(x){vis=false}
      if(!vis||doc.activeElement!==t){lastR=null;return}
      var r=t.getBoundingClientRect();if(!r.width||!r.height)return;
      if(!reduced()&&lastR&&performance.now()-lastT<2500&&(Math.abs(lastR.left-r.left)>2||Math.abs(lastR.top-r.top)>2)&&Math.abs(lastR.top-r.top)<innerHeight){
        if(!ring){ring=doc.createElement("div");ring.className="m-fring";ring.setAttribute("aria-hidden","true");ring.style.transition="opacity var(--dur-2) var(--ease-standard)";doc.body.appendChild(ring)}
        var rad=parseFloat(getComputedStyle(t).borderTopLeftRadius)||4;ring.style.borderRadius=Math.min(rad+3,999)+"px";ring.style.opacity="1";
        SP.drive(ring,{l:r.left-3,t:r.top-3,w:r.width+6,h:r.height+6},"snappy",{init:{l:lastR.left-3,t:lastR.top-3,w:lastR.width+6,h:lastR.height+6},
          apply:function(v,el){el.style.transform="translate("+v.l.toFixed(1)+"px,"+v.t.toFixed(1)+"px)";el.style.width=v.w.toFixed(1)+"px";el.style.height=v.h.toFixed(1)+"px"},
          done:function(el){el.style.opacity="0"},eps:.4})}
      lastR=r;lastT=performance.now()})});
  addEventListener("scroll",function(){lastR=null},{passive:true})}

/* ---------- selection ripple (Deep dot field) ---------- */
M.ripple=function(c){if(reduced()||!c||!c.ownerSVGElement)return;var s=c.ownerSVGElement,r=doc.createElementNS(NS,"circle");
  ["cx","cy","r"].forEach(function(a){r.setAttribute(a,c.getAttribute(a))});
  r.setAttribute("fill","none");r.setAttribute("stroke","var(--violet-text)");r.setAttribute("stroke-width","2");r.setAttribute("vector-effect","non-scaling-stroke");
  r.setAttribute("class","m-ripple");r.setAttribute("aria-hidden","true");r.setAttribute("data-m-keep","");r.style.pointerEvents="none";s.appendChild(r);
  var a=anim(r,[{opacity:.9,transform:"scale(1)"},{opacity:0,transform:"scale(2.8)"}],{duration:D.l+240,easing:E.decel});if(a)a.onfinish=function(){r.remove()};else r.remove();
  anim(c,[{transform:"scale(1)"},{transform:"scale(1.3)",offset:.35},{transform:"scale(1)"}],{duration:SE.snappy.duration,easing:SE.snappy.easing})};

/* ---------- sheets and panels: spring in, page recedes, drag to dismiss on phones, accelerated exit ---------- */
M.panelIn=function(host){var p=host.querySelector(".panel"),s=host.querySelector(".scrim");if(!p)return;
  root.classList.add("m-sheet");sheetHead(p);if(reduced()||!SP)return;
  var bottom=mqPhone.matches;
  if(s)anim(s,[{opacity:0},{opacity:1}],{duration:D.m,easing:E.standard,fill:"backwards"});
  if(bottom){drive(p,{y:0},"gentle",{from:{y:p.offsetHeight||innerHeight},eps:.3});dragSheet(p)}
  else{drive(p,{x:0},"gentle",{from:{x:48},eps:.3});anim(p,[{opacity:0},{opacity:1}],{duration:D.s,easing:E.standard,fill:"backwards"})}};
M.sheetOff=function(){root.classList.remove("m-sheet")};
/* The pinned top bar (css/shell.css): .m-scrolled fades in its hairline and shadow as soon as the body scrolls,
   .m-cond condenses it after 24px (back below 12px, so it never flickers at the threshold). One passive scroll
   listener, read once per frame; classes change only when a threshold is crossed. The m- classes and --m-
   variables survive the sheet's morphs. --m-pt-cut (how far the ground rises) is measured from the bar's own
   content, --m-pt-h (the condensed bar's height) keeps focused controls from landing under it. */
var PT_S=.85,PT_D=4;
function sheetHead(p){var top=p.querySelector(".panel-top");if(!top||p.__ph===top)return;p.__ph=top;var sc=null,cd=null,q=0;
  function measure(){var inn=top.querySelector(".pt-in");if(!inn||!top.isConnected)return;var b0=0,b1=0;
    [].forEach.call(inn.children,function(c){var b=c.offsetTop+c.offsetHeight;b0=Math.max(b0,b);b1=Math.max(b1,c.classList.contains("pt-title")?c.offsetTop+c.offsetHeight*PT_S:b)});
    var cut=Math.max(0,Math.round(PT_D*2+b0-b1));top.style.setProperty("--m-pt-cut",cut+"px");p.style.setProperty("--m-pt-h",Math.round(top.offsetHeight-cut-PT_D)+"px")}
  function upd(){q=0;var y=p.scrollTop,a=y>0,c=cd?y>12:y>24;
    if(a!==sc){sc=a;top.classList.toggle("m-scrolled",a)}if(c!==cd){cd=c;top.classList.toggle("m-cond",c)}}
  p.addEventListener("scroll",function(){if(!q)q=requestAnimationFrame(upd)},{passive:true});
  measure();upd();if(window.ResizeObserver)new ResizeObserver(measure).observe(top)}
M.sheetHead=sheetHead;
/* Drag to dismiss (phones). A drag that starts on the pinned bar always moves the sheet (the bar is touch-action:none);
   one that starts in the body moves it only when pulling down from the very top, or when there is nothing to scroll,
   so scrolling the body never turns into a drag. */
function dragSheet(p){if(p.__drag)return;p.__drag=1;var y0=0,on=false,off=false,hist=[],head=false;
  function rub(d){return d<0?-(64*(1-Math.exp(d/140))):d}
  p.addEventListener("touchstart",function(e){if(e.touches.length!==1){off=true;return}y0=e.touches[0].clientY;on=false;off=false;hist=[];
    head=!!(e.target&&e.target.closest&&e.target.closest(".panel-top"))},{passive:true});
  p.addEventListener("touchmove",function(e){if(off||e.touches.length!==1)return;var y=e.touches[0].clientY,d=y-y0;
    if(!on){if(Math.abs(d)<4)return;
      if(!e.cancelable||(!head&&(p.scrollTop>0||(d<0&&p.scrollHeight>p.clientHeight+1)))){off=true;return}
      on=true;p.classList.add("m-drag","m-live");SP.stop(p)}
    if(e.cancelable)e.preventDefault();var v=rub(d);applyVars({y:v},p);hist.push([e.timeStamp,y]);if(hist.length>6)hist.shift()},{passive:false});
  function end(){if(!on)return;on=false;p.classList.remove("m-drag");var cur=p.__mv?+p.__mv.y||0:0,v=0;
    if(hist.length>1){var a=hist[0],b=hist[hist.length-1];v=(b[1]-a[1])/Math.max(1,b[0]-a[0])*1000}
    if(v>500||(cur>p.offsetHeight*.35&&v>-200)){p.__vel=Math.max(v,600);var btn=p.querySelector(".panel-top .pt-x")||p.querySelector(".panel-top button");if(btn)btn.click()}
    else{drive(p,{y:0},"gentle",{eps:.3});var sp=SP.get(p,"y");if(sp)sp.v=v}}
  p.addEventListener("touchend",end,{passive:true});p.addEventListener("touchcancel",end,{passive:true})}
M.exit=function(els,done){els=els.filter(Boolean);M.sheetOff();if(reduced()||!els.length||!els[0].animate){done();return}
  var n=els.length;els.forEach(function(el){el.inert=true;el.style.pointerEvents="none";var kf,dur=D.s+40;
    if(el.classList.contains("panel")){if(SP)SP.stop(el);var bottom=mqPhone.matches,cur=el.__mv?+el.__mv[bottom?"y":"x"]||0:0,dist=bottom?el.offsetHeight:40;
      kf=[{transform:"translate"+(bottom?"Y":"X")+"("+cur+"px)",opacity:1},{transform:"translate"+(bottom?"Y":"X")+"("+dist+"px)",opacity:bottom?1:0}];
      if(el.__vel)dur=Math.max(120,Math.min(260,(dist-cur)/el.__vel*1000))}
    else kf=[{opacity:1},{opacity:0}];
    var a=el.animate(kf,{duration:dur,easing:E.accel,fill:"forwards"});a.onfinish=a.oncancel=function(){if(--n===0)done()}})};

/* ---------- theme: the icon turns on a spring, then a circular reveal from the toggle; colour cross-fade fallback ---------- */
/* Darkness is the absence of light, so light leads: going to light, light radiates out of the toggle; going to dark, the light is
   withdrawn into the toggle and the dark is what is left behind. Set LIGHT_LEADS to false for the old "dark spreads out" version. */
var LIGHT_LEADS=true;
M.theme=function(apply,btn){if(reduced()){apply();return}
  var svg=btn&&btn.querySelector&&btn.querySelector("svg"),toLight=root.dataset.theme!=="light",keep=null,
      retreat=LIGHT_LEADS?!toLight:toLight; /* the retreating layer is the old view, shrinking into the toggle */
  /* the icon turns on its own spring; on the retreating direction it gets a springier curve so it turns, overshoots a touch and rests about when the layer has closed into it */
  if(svg&&SP){var full=btn.classList.contains("theme-toggle")?180:360,from=toLight?0:full,to=toLight?full:0;
    drive(svg,{r:to},{k:380,c:23},{init:{r:from},eps:.2})}
  if(doc.startViewTransition&&btn&&btn.getBoundingClientRect){var r=btn.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,
      R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y)),vt,c0="circle(0px at "+x+"px "+y+"px)",c1="circle("+R+"px at "+x+"px "+y+"px)",
      dur=Math.round(D.l*1.3);
    root.classList.add("m-vt-theme");if(retreat)root.classList.add("m-vt-back");
    /* the toggle gets its own layer above both themes, so its icon stays visible while the old view closes over it */
    btn.style.viewTransitionName="m-theme-toggle";
    if(retreat){/* keep the toggle in the colours of the view that is closing in, so the turn reads against it */
      var cs=getComputedStyle(btn);keep={c:cs.color,b:cs.borderColor,g:cs.backgroundColor};
      btn.style.color=keep.c;btn.style.borderColor=keep.b;btn.style.backgroundColor=keep.g}
    var released=0;function release(){if(released||!keep)return;released=1;btn.style.transition="color 180ms,border-color 180ms,background-color 180ms";
      btn.style.color=btn.style.borderColor=btn.style.backgroundColor="";setTimeout(function(){btn.style.transition=""},300)}
    try{vt=doc.startViewTransition(apply)}catch(e){root.classList.remove("m-vt-theme","m-vt-back");btn.style.viewTransitionName="";release();apply();return}
    if(retreat)setTimeout(release,Math.round(dur*.64));
    vt.ready.then(function(){root.animate({clipPath:retreat?[c1,c0]:[c0,c1]},{duration:dur,easing:retreat?E.decel:E.decelBack,fill:"forwards",pseudoElement:retreat?"::view-transition-old(root)":"::view-transition-new(root)"})}).catch(function(){});
    vt.finished.then(done,done);function done(){root.classList.remove("m-vt-theme","m-vt-back");btn.style.viewTransitionName="";release()}return}
  root.classList.add("m-theming");apply();setTimeout(function(){root.classList.remove("m-theming")},D.m+60)};

/* ---------- pause looping animations offscreen and in hidden tabs ---------- */
var pauseIO=("IntersectionObserver" in window)?new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("m-off",!e.isIntersecting)})}):null;
function pauseOff(sel){if(pauseIO)each(sel,function(el){if(!el.__po){el.__po=1;pauseIO.observe(el)}})}
doc.addEventListener("visibilitychange",function(){root.classList.toggle("m-hidden",doc.hidden)});

/* ---------- page-head glyph: the entrance replays on a press, one quiet ping every 12s while the head is on screen ---------- */
var GLYPHS=["app","futarchy","deep","opportunity","risk"];
function glyph(){var svg=doc.querySelector(".ph-glyph");if(!svg||svg.__g||reduced())return;svg.__g=1;
  var btn=svg.closest(".ph-glyph-btn"),run=0,busy=false,lag=Math.max(0,GLYPHS.indexOf(svg.getAttribute("data-glyph")))*500;
  /* clears the state class once every animation under the mark has finished (a timer backs it up) */
  function after(cls,ms){var n=++run;function fin(){if(n!==run)return;svg.classList.remove(cls);busy=false}
    var a=svg.getAnimations?svg.getAnimations({subtree:true}):[];
    if(a.length)Promise.all(a.map(function(x){return x.finished})).then(fin,fin);
    setTimeout(fin,ms)}
  function play(){if(busy||reduced())return;busy=true;svg.classList.remove("m-gin","m-gping");svg.style.setProperty("--m-g0","0ms");void svg.getBoundingClientRect();svg.classList.add("m-gin");after("m-gin",1500)}
  function ping(){if(!busy&&!reduced()&&!doc.hidden&&!svg.classList.contains("m-off")){busy=true;svg.classList.add("m-gping");after("m-gping",1100)}
    setTimeout(ping,12000)}
  if(svg.classList.contains("m-gin")){busy=true;after("m-gin",1900)}
  if(btn)btn.addEventListener("click",play);
  pauseOff(".ph-glyph");setTimeout(ping,12000+lag)}

/* ---------- in-page anchors: an interruptible glide (wheel, touch or a key hands control back) ---------- */
M.scrollTo=function(y,done){if(!SP||reduced()){scrollTo(0,y);if(done)done();return}
  function stop(){SP.stop("scroll");off()}
  function off(){removeEventListener("wheel",stop);removeEventListener("touchstart",stop);removeEventListener("keydown",stop)}
  addEventListener("wheel",stop,{passive:true});addEventListener("touchstart",stop,{passive:true});addEventListener("keydown",stop);
  SP.drive("scroll",{y:y},"glide",{init:{y:scrollY},apply:function(v){scrollTo({top:v.y,left:0,behavior:"instant"})},done:function(){off();if(done)done()},eps:.5})};
function anchors(){doc.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||reduced()||!SP||e.defaultPrevented)return;
  var id=a.getAttribute("href").slice(1),t=id&&doc.getElementById(id);if(!t)return;e.preventDefault();
  var top=t.getBoundingClientRect().top+scrollY,pad=parseFloat(getComputedStyle(root).scrollPaddingTop)||0,y=top-pad;
  if(HD)y=top-HD(top-HD(top));y=Math.max(0,Math.min(y,root.scrollHeight-innerHeight));
  try{history.pushState(null,"","#"+id)}catch(x){}
  M.scrollTo(y,function(){if(!t.hasAttribute("tabindex"))t.setAttribute("tabindex","-1");t.focus({preventScroll:true})})})}

/* ---------- leaving for another page without cross-document View Transitions: <main> exits first ---------- */
function leave(){if("CSSViewTransitionRule" in window)return;
  /* Back/forward restores the page from the browser cache with the exit still applied; undo it */
  window.addEventListener("pageshow",function(){var m=doc.querySelector("main");if(m)m.classList.remove("m-leave")});
  doc.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a||reduced()||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button)return;
    var u=a.getAttribute("href");if(!u||u[0]==="#"||a.target||/^(https?:|mailto:|javascript:)/i.test(u)||!/\.html(\?|#|$)/.test(u))return;var m=doc.querySelector("main");if(!m)return;
    e.preventDefault();m.classList.add("m-leave");setTimeout(function(){location.href=a.href},D.s)})}

/* ---------- landing ---------- */
function landingNav(){var nav=doc.querySelector(".home .topnav");if(!nav)return;
  /* the hero keeps the fixed nav's height as its top padding (a variable on the hero, not :root, so it never restyles the document) */
  function measure(){if(hero)hero.style.setProperty("--m-nav-h",nav.offsetHeight+"px")}
  var hero=nav.closest(".hero");root.classList.add("m-nav-fixed");measure();if(window.ResizeObserver)new ResizeObserver(measure).observe(nav);
  pinHead(nav,{core:".brand,.nav-end",row2:".nav-links"})}
function progress(){var bar=doc.createElement("div");bar.className="m-progress";bar.setAttribute("aria-hidden","true");bar.appendChild(doc.createElement("i"));doc.body.appendChild(bar);
  var i=bar.firstChild,q=0,set=function(p){i.style.transform="scaleX("+p.toFixed(4)+")"};
  function upd(){q=0;var max=root.scrollHeight-innerHeight,p=max>0?Math.min(1,Math.max(0,scrollY/max)):0;
    if(SP&&!reduced())SP.drive(bar,{p:p},"gentle",{init:{p:p},apply:function(v){set(v.p)},eps:.0005});else set(p)}
  addEventListener("scroll",function(){if(!q)q=requestAnimationFrame(upd)},{passive:true});addEventListener("resize",upd,{passive:true});upd()}
function parallaxFallback(){if(SDA||reduced())return;var slabs=doc.querySelector(".home .slabs"),cards=doc.querySelector(".home .hero-cards"),ol=doc.querySelector(".home .apps"),lis=ol?[].slice.call(ol.children):[],q=0;
  function upd(){q=0;if(!mqWide.matches){if(slabs)slabs.style.transform="";if(cards)cards.style.transform="";lis.forEach(function(l){l.style.transform=""});return}
    var y=scrollY,vh=innerHeight,r=ol?ol.getBoundingClientRect():null,t=Math.min(y,vh)/vh;
    if(y<vh*1.5){if(slabs)slabs.style.transform="translateY("+(t*18).toFixed(2)+"%)";if(cards)cards.style.transform="translateY("+(t*12).toFixed(2)+"%)"}
    if(r&&r.top<vh&&r.bottom>0){var p=Math.min(1,Math.max(0,(vh-r.top)/(vh*.45+r.height*.2)));lis.forEach(function(l,k){var kk=[.7,1.2,.5,1,.85][k]||1;l.style.transform="translateY("+((1-p)*kk*56).toFixed(1)+"px)"})}}
  addEventListener("scroll",function(){if(!q)q=requestAnimationFrame(upd)},{passive:true});addEventListener("resize",upd,{passive:true});upd()}
function vizIn(v,d){d+=140;
  M.stagger(v.querySelectorAll(".filters span"),d,25,4);M.stagger(v.querySelectorAll(".xlist .row"),d+80,45);M.countIn(v.querySelectorAll(".xv"),d+120);
  var f=v.querySelector(".fork-lines");if(f){anim(f,[{clipPath:"inset(0 0 100% 0)"},{clipPath:"inset(0 0 0 0)"}],{duration:D.l+120,easing:E.decel,delay:d,fill:"backwards"});
    M.stagger(v.querySelectorAll(".leg-fail"),d+260,70);wipe(v.querySelector(".leg-pass"),d+220);M.grow(v.querySelectorAll(".leg-bar i"),{delay:d+420,step:80});M.countIn(v.querySelectorAll(".leg-v"),d+300);M.countIn(v.querySelectorAll(".fork-read .num"),d+500)}
  var g=v.querySelectorAll(".d-deep g");each(g,function(c,i){anim(c,[{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:D.m+80,easing:E.decel,delay:d+i*11,fill:"backwards"})});
  M.countIn(v.querySelectorAll(".deep-key dd"),d+260);
  M.stagger(v.querySelectorAll(".board tbody tr"),d,45);M.grow(v.querySelectorAll(".sig i"),{delay:d+120,step:45});M.countIn(v.querySelectorAll(".board td .num"),d+120);
  M.stagger(v.querySelectorAll(".risk li"),d,45);M.grow(v.querySelectorAll(".rb i"),{delay:d+100,step:45});M.countIn(v.querySelectorAll(".rv"),d+100)}
function landing(){try{sessionStorage.setItem("seer-hero","1")}catch(e){}
  M.reveal(".sec-head,.steps > li,.types > li,.feat-copy,.foot-grid > *");
  M.reveal(".base,.cta-block",{wipe:true});
  M.reveal(".feat .viz",{onIn:vizIn});
  /* measurements wait for the first frame so they share its layout instead of forcing an extra one */
  requestAnimationFrame(function(){landingNav();progress();parallaxFallback();pauseOff(".dots,.hero");phys();focusRing();anchors();leave()})}

/* ---------- product pages: called by each page script after its first render ---------- */
M.ready=function(){requestAnimationFrame(function(){glyph();navInd();pinHead(doc.querySelector(".shell-bar"),{core:".shell-brand,.shell-end",row2:".shell-products",spacer:doc.getElementById("shell")});scan(doc);phys();focusRing();anchors();leave()})};
M.frame=function(f){requestAnimationFrame(f)};

if(doc.body&&doc.body.classList.contains("home"))landing();
window.Motion=M;
})();
