/* Electric Foundation: spring engine (window.Spring). Linked before js/motion.js on every page.
   A damped spring per animated value: x'' = (-k (x - target) - c x') / m, stepped with the closed-form
   solution, so the path is exact for any frame interval. Re-targeting a running spring keeps its
   position and velocity, so an interaction that starts mid-flight continues the motion instead of
   restarting it. One requestAnimationFrame loop drives every active spring; it stops when nothing
   moves and pauses while the tab is hidden.

   Presets (k stiffness, c damping, m mass 1; zeta = c / 2 sqrt(k m); settle = within 0.1%):
     press   k 1400  c 62    zeta .83  settles in 260ms, 1% overshoot          press and release
     snappy  k 900   c 46    zeta .77  settles in 310ms, 2.4% overshoot        toggles, indicators, icon turns
     settle  k 520   c 42    zeta .92  settles in 330ms, 0.06% overshoot       cards, hover lift, tilt, list moves
     gentle  k 260   c 32.25 zeta 1    settles in 580ms, critically damped     panels, sheets, header, recede
     glide   k 150   c 24.5  zeta 1    settles in 760ms, critically damped     count-ups, anchor scrolling
   Spring.ease(name) returns the same curve as a CSS linear() easing plus its duration, for the cases
   that are better left to CSS or the Web Animations API (entrances, one-shot grows). */
(function(){
"use strict";
var P={press:{k:1400,c:62},snappy:{k:900,c:46},settle:{k:520,c:42},gentle:{k:260,c:32.25},glide:{k:150,c:24.5}};

function S(x,p){this.x=x||0;this.v=0;this.t=this.x;this.set(p);this.eps=.05;this.done=true}
S.prototype.set=function(p){p=typeof p==="string"?P[p]||P.settle:p||P.settle;this.k=p.k;this.c=p.c;this.m=p.m||1;return this};
S.prototype.to=function(t){this.t=t;if(this.done&&Math.abs(this.x-t)<this.eps*.5){this.x=t;return this}this.done=false;return this};
S.prototype.jump=function(x){this.x=x;this.v=0;this.t=x;this.done=true;return this};
/* closed-form step: exact for any frame interval, so a dropped frame never changes the path */
S.prototype.step=function(dt){if(this.done)return this.x;var w=Math.sqrt(this.k/this.m),z=this.c/(2*Math.sqrt(this.k*this.m)),y0=this.x-this.t,v0=this.v,y,v,e;
  if(Math.abs(z-1)<1e-3){e=Math.exp(-w*dt);var a=v0+w*y0;y=(y0+a*dt)*e;v=(v0-w*a*dt)*e}
  else if(z<1){var wd=w*Math.sqrt(1-z*z),A=y0,B=(v0+z*w*y0)/wd,co=Math.cos(wd*dt),si=Math.sin(wd*dt);e=Math.exp(-z*w*dt);
    y=e*(A*co+B*si);v=e*(-z*w*(A*co+B*si)+wd*(B*co-A*si))}
  else{var r=w*Math.sqrt(z*z-1),s1=-z*w+r,s2=-z*w-r,C1=(v0-s2*y0)/(s1-s2),C2=y0-C1;y=C1*Math.exp(s1*dt)+C2*Math.exp(s2*dt);v=C1*s1*Math.exp(s1*dt)+C2*s2*Math.exp(s2*dt)}
  this.x=this.t+y;this.v=v;
  if(Math.abs(v)<this.eps*20&&Math.abs(y)<this.eps){this.x=this.t;this.v=0;this.done=true}
  return this.x};

/* ---------- the loop ---------- */
var items=new Map(),raf=0,last=0,hidden=false;
function tick(now){raf=0;var dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  var gone=[];
  items.forEach(function(it,key){var vals={},all=true,k,s;
    for(k in it.sp){s=it.sp[k];if(!s.done){s.step(dt);all=false}vals[k]=s.x}
    it.apply(vals,it.el,all);
    if(all)gone.push(key)});
  gone.forEach(function(key){var it=items.get(key);items.delete(key);if(it&&it.done)it.done(it.el)});
  if(items.size&&!hidden)raf=requestAnimationFrame(tick)}
function start(){if(!raf&&!hidden&&items.size){last=performance.now();raf=requestAnimationFrame(tick)}}
document.addEventListener("visibilitychange",function(){hidden=document.hidden;if(hidden){if(raf)cancelAnimationFrame(raf);raf=0}else start()});

/* drive(key, targets, preset, options): targets is {prop: value}; preset a name, a {k,c} object or
   {prop: preset} per property. options.from sets the starting position of a new spring (or re-positions a
   live one without touching its velocity), options.apply(vals, el, settled) is called every frame and
   options.done(el) once everything has settled. options.eps is the settle tolerance in the value's unit. */
function drive(key,targets,preset,o){o=o||{};var it=items.get(key),k,s,pr,fresh=!it;
  if(!it){it={el:o.el||key,sp:{},apply:o.apply||noop,done:o.done||null};items.set(key,it)}
  else{if(o.apply)it.apply=o.apply;if(o.done!==undefined)it.done=o.done}
  for(k in targets){pr=preset&&typeof preset==="object"&&!preset.k?preset[k]||"settle":preset;s=it.sp[k];
    if(!s){s=it.sp[k]=new S(o.from&&o.from[k]!=null?o.from[k]:(o.init&&o.init[k]!=null?o.init[k]:targets[k]),pr)}
    else{s.set(pr);if(o.from&&o.from[k]!=null)s.x=o.from[k];if(o.reset)s.v=0}
    if(o.eps!=null)s.eps=o.eps;
    s.to(targets[k])}
  /* a spring that starts away from its target paints its starting state now, not a frame later */
  if(fresh||o.from){var vals={},all=true;for(k in it.sp){vals[k]=it.sp[k].x;if(!it.sp[k].done)all=false}if(!all)it.apply(vals,it.el,false)}
  start();return it}
function noop(){}
function stop(key,finish){var it=items.get(key);if(!it)return;items.delete(key);
  if(finish){var vals={},k;for(k in it.sp){it.sp[k].jump(it.sp[k].t);vals[k]=it.sp[k].x}it.apply(vals,it.el,true);if(it.done)it.done(it.el)}}
function get(key,prop){var it=items.get(key);return it&&it.sp[prop]?it.sp[prop]:null}

/* ---------- CSS easing from the same curve ---------- */
var cache={};
function sample(p,T,n){var s=new S(1,p);s.eps=1e-4;s.to(0);var out=[],i,dt=T/n;for(i=0;i<=n;i++){out.push(1-s.x);if(i<n)s.step(dt)}return out}
function settleTime(p){p=typeof p==="string"?P[p]:p;var s=new S(1,p);s.eps=.001;s.to(0);var t=0;while(!s.done&&t<3){s.step(1/120);t+=1/120}return Math.round(t*1000/10)*10}
function ease(name){if(cache[name])return cache[name];var p=typeof name==="string"?P[name]:name,T=settleTime(p),n=Math.min(64,Math.max(24,Math.round(T/6)));
  var v=sample(p,T/1000,n).map(function(x){return(Math.abs(x)<5e-4?0:x).toFixed(4).replace(/\.?0+$/,"")});
  return cache[name]={easing:"linear("+v.join(",")+")",duration:T}}

/* the same curve as a progress function p in [0,1] -> value, for JS tweens of numbers and attributes */
function curve(name){var p=typeof name==="string"?P[name]:name,v=sample(p,settleTime(p)/1000,120);
  return function(x){if(x<=0)return 0;if(x>=1)return 1;var f=x*120,i=Math.floor(f),t=f-i;return v[i]+(v[i+1]-v[i])*t}}

window.Spring={S:S,P:P,drive:drive,stop:stop,get:get,ease:ease,curve:curve,settleTime:settleTime,has:function(k){return items.has(k)},active:function(){return items.size}};
})();
