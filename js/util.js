window.U={
 h:function(tag,attrs,kids){var n=document.createElement(tag);for(var k in attrs||{}){if(attrs[k]==null)continue;if(k==="text")n.textContent=attrs[k];else if(k==="class")n.className=attrs[k];else if(k.slice(0,2)==="on")n[k]=attrs[k];else n.setAttribute(k,attrs[k])}
  (kids||[]).forEach(function(c){if(c!=null)n.appendChild(typeof c==="string"?document.createTextNode(c):c)});return n},
 svg:function(tag,attrs){var n=document.createElementNS("http://www.w3.org/2000/svg",tag);for(var k in attrs||{})n.setAttribute(k,attrs[k]);return n},
 rng:function(seed){return function(){seed=(seed*9301+49297)%233280;return seed/233280}},
 /* The one dollar format. Sign first (U+2212), then B, M and K with one decimal for B and M, whole dollars from $1, two decimals below $1.
    A rounded figure that reaches the next unit moves up to it ("$999.5K" is "$1M"). */
 money:function(v){v=Number(v);if(!isFinite(v))return"$0";if(v<0)return"\u2212"+U.money(-v);if(v===0)return"$0";
  if(v<1)return"$"+v.toFixed(2);
  if(v<999.5)return"$"+Math.round(v);
  if(v<999.5e3)return"$"+Math.round(v/1e3)+"K";
  var m=v/1e6;if(m.toFixed(1)>=1e3)m=m/1e3;else return"$"+m.toFixed(1).replace(/\.0$/,"")+"M";
  return"$"+m.toFixed(1).replace(/\.0$/,"")+"B"},
 /* A demo address for a market: 0x and 40 lowercase hex characters worked out from its id, so the same id always gives the same address. Nothing about it is on a chain. */
 addr:function(id){var a=(Number(id)||0)+0x9e3779b9>>>0,s="",i;for(i=0;i<5;i++){a=a+0x6d2b79f5>>>0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;s+=(((t^t>>>14)>>>0)).toString(16).padStart(8,"0")}return"0x"+s.slice(0,40)},
 /* shares: two decimals below 10 so a small trade does not read 0.0, one decimal from 10 */
 shares:function(v){v=Number(v);return U.num(v,v<10?2:1)},
 /* a plain number to a fixed count of decimals (min decimals optional), grouped, with the same minus sign */
 num:function(v,dec,min){v=Number(v);if(!isFinite(v))return"0";var s=Math.abs(v).toLocaleString("en-GB",{minimumFractionDigits:min==null?dec:min,maximumFractionDigits:dec});return(v<0&&/[1-9]/.test(s)?"\u2212":"")+s},
 /* Explicit table roles: on phones .rtbl tables are laid out as cards (display:block/grid), which drops the native
    table semantics in some browsers. The roles keep rows, cells and headers announced in both layouts. */
 roles:function(t){t.setAttribute("role","table");[].forEach.call(t.querySelectorAll("thead,tbody"),function(n){n.setAttribute("role","rowgroup")});
  [].forEach.call(t.querySelectorAll("tr"),function(n){n.setAttribute("role","row")});
  [].forEach.call(t.querySelectorAll("th"),function(n){n.setAttribute("role",n.getAttribute("scope")==="row"?"rowheader":"columnheader")});
  [].forEach.call(t.querySelectorAll("td"),function(n){n.setAttribute("role","cell")});return t},
 clear:function(n){while(n.firstChild)n.removeChild(n.firstChild)},
 /* Update a container from freshly built DOM. With js/motion.js this morphs in place (focus, caret and scroll survive,
    keyed items animate); without it, it falls back to a plain swap. next may also be a function that updates the
    live DOM itself and reports what it added and removed (see Motion.patch); without motion it simply runs. */
 patch:function(root,next,o){if(window.Motion)return Motion.patch(root,next,o);if(typeof next==="function")return next({added:[],removed:[],drop:function(n,p){p.removeChild(n)},back:function(){}});
  while(root.firstChild)root.removeChild(root.firstChild);while(next.firstChild)root.appendChild(next.firstChild)},
 /* Tablet and phone (up to 1100px): detail opens in a sheet instead of a side column. */
 narrow:matchMedia("(max-width:1100px)")
};
/* keep Tab and Shift+Tab inside an open modal sheet */
U.trap=function(e,panel){if(e.key!=="Tab"||!panel)return;var f=[].filter.call(panel.querySelectorAll("a[href],button,input,select,textarea,[tabindex]:not([tabindex='-1'])"),function(n){return!n.disabled&&n.getClientRects().length});
 if(!f.length)return;var a=f[0],z=f[f.length-1];
 if(e.shiftKey&&(document.activeElement===a||!panel.contains(document.activeElement))){e.preventDefault();z.focus()}
 else if(!e.shiftKey&&(document.activeElement===z||!panel.contains(document.activeElement))){e.preventDefault();a.focus()}};
/* The pinned top bar of every detail sheet: grab handle (phones), badge or kicker, title and Close. It sticks to the
   top of the sheet while the body scrolls (css/shell.css); js/motion.js adds the hairline and the condense.
   Without a badge the title sits beside Close; with one, the badge does and the title takes the full width below. */
U.sheetTop=function(badge,title,onClose){var h=U.h;
 return h("div",{class:"panel-top"},[h("span",{class:"panel-grip","aria-hidden":"true"}),
  h("div",{class:"pt-in"+(badge?" has-k":"")},[badge||null,title!=null?h("h2",{class:"pt-title",text:title}):null,h("button",{class:"btn soft",type:"button",text:"Close",onclick:onClose})])])};
/* U.sheet({open,label,badge,title,kids,onClose,instant,root,cls,focus}): one detail sheet per root, at body level
   (outside the query containers, so position:fixed is relative to the viewport). Side sheet on tablets, bottom sheet
   on phones (css/shell.css). It morphs in place like the page, so controls inside keep focus while values change.
   Escape, the scrim and Close all call onClose; the page clears its selection and returns focus.
   root (default "sheet-root") lets a second sheet stack above the first: the wallet sheet (js/wallet.js) uses
   "wallet-root", so connecting from inside a ticket or a form leaves that sheet, and its values, where they were.
   Only the top sheet answers Escape and keeps Tab inside it. cls adds a class to the panel (and cls+"-scrim" to its
   scrim); focus is a selector for the control that takes focus when the sheet opens (Close by default). */
U.sheet=function(o){var R=o.root||"sheet-root",root=document.getElementById(R),h=U.h;
 if(!root){root=h("div",{id:R});document.body.appendChild(root)}
 U._keys=U._keys||{};if(U._keys[R]){document.removeEventListener("keydown",U._keys[R]);U._keys[R]=null}
 var cur=root.querySelector(".panel");
 if(!o.open){if(!cur)return;
  if(window.Motion&&!o.instant&&!Motion.reduced()){/* exit plays in a detached layer so the root is free at once */
   /* moving a node resets the scroll position of everything scrollable inside it: save it and put it back, or a chat or a long sheet jumps to the top just before it leaves */
   var keep=[];[].forEach.call(root.querySelectorAll("*"),function(e){if(e.scrollTop||e.scrollLeft)keep.push([e,e.scrollTop,e.scrollLeft])});
   var g=h("div",{"aria-hidden":"true",class:"m-ghost"});g.inert=true;document.body.appendChild(g);while(root.firstChild)g.appendChild(root.firstChild);
   keep.forEach(function(k){k[0].scrollTop=k[1];k[0].scrollLeft=k[2]});
   Motion.exit([g.querySelector(".panel"),g.querySelector(".scrim")],function(){g.remove()})}else{U.clear(root);if(window.Motion&&Motion.sheetOff)Motion.sheetOff()}
  /* a sheet still open underneath keeps the page receded */
  if(window.Motion&&U.openPanel())document.documentElement.classList.add("m-sheet");return}
 var f=h("div",{},[h("div",{class:"scrim"+(o.cls?" "+o.cls+"-scrim":""),"data-key":"scrim",onclick:o.onClose}),
  h("div",{class:"panel sheet"+(o.cls?" "+o.cls:""),role:"dialog","aria-modal":"true","aria-label":o.label,"data-key":"sheet"},
   [U.sheetTop(o.badge,o.title,o.onClose)].concat(o.kids))]);
 U.patch(root,f,{animate:!!cur});
 var k=function(e){if(e.defaultPrevented||U.covered(R))return;if(e.key==="Escape"){e.preventDefault();o.onClose()}else U.trap(e,root.querySelector(".panel"))};
 U._keys[R]=k;document.addEventListener("keydown",k);
 if(!cur){var fo=o.focus&&root.querySelector(o.focus);(fo||root.querySelector(".panel-top button")).focus({preventScroll:true});
  if(window.Motion){Motion.scan(root);if(Motion.panelIn)Motion.panelIn(root);Motion.stagger(root.querySelectorAll(".pt-title, .panel > :not(.panel-top)"),140,40)}}};
/* the wallet sheet sits above every other sheet: while it is open, the ones below ignore Escape and Tab */
U.covered=function(R){return R!=="wallet-root"&&!!document.querySelector("#wallet-root .panel")};
U.openPanel=function(){return document.querySelector("#sheet-root .panel, #panel-root .panel, #wallet-root .panel")};
