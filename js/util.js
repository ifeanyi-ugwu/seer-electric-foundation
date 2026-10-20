window.U={
 h:function(tag,attrs,kids){var n=document.createElement(tag);for(var k in attrs||{}){if(attrs[k]==null)continue;if(k==="text")n.textContent=attrs[k];else if(k==="class")n.className=attrs[k];else if(k.slice(0,2)==="on")n[k]=attrs[k];else n.setAttribute(k,attrs[k])}
  (kids||[]).forEach(function(c){if(c!=null)n.appendChild(typeof c==="string"?document.createTextNode(c):c)});return n},
 svg:function(tag,attrs){var n=document.createElementNS("http://www.w3.org/2000/svg",tag);for(var k in attrs||{})n.setAttribute(k,attrs[k]);return n},
 rng:function(seed){return function(){seed=(seed*9301+49297)%233280;return seed/233280}},
 money:function(v){if(v>=1e6)return"$"+(v/1e6).toFixed(1).replace(/\.0$/,"")+"M";if(v>=1e3)return"$"+Math.round(v/1e3)+"K";return"$"+Math.round(v)},
 /* Explicit table roles: on phones .rtbl tables are laid out as cards (display:block/grid), which drops the native
    table semantics in some browsers. The roles keep rows, cells and headers announced in both layouts. */
 roles:function(t){t.setAttribute("role","table");[].forEach.call(t.querySelectorAll("thead,tbody"),function(n){n.setAttribute("role","rowgroup")});
  [].forEach.call(t.querySelectorAll("tr"),function(n){n.setAttribute("role","row")});
  [].forEach.call(t.querySelectorAll("th"),function(n){n.setAttribute("role",n.getAttribute("scope")==="row"?"rowheader":"columnheader")});
  [].forEach.call(t.querySelectorAll("td"),function(n){n.setAttribute("role","cell")});return t},
 clear:function(n){while(n.firstChild)n.removeChild(n.firstChild)},
 /* Update a container from freshly built DOM. With js/motion.js this morphs in place (focus, caret and scroll survive,
    keyed items animate); without it, it falls back to a plain swap. */
 patch:function(root,next,o){if(window.Motion)return Motion.patch(root,next,o);while(root.firstChild)root.removeChild(root.firstChild);while(next.firstChild)root.appendChild(next.firstChild)},
 /* Tablet and phone (up to 1100px): detail opens in a sheet instead of a side column. */
 narrow:matchMedia("(max-width:1100px)")
};
/* keep Tab and Shift+Tab inside an open modal sheet */
U.trap=function(e,panel){if(e.key!=="Tab"||!panel)return;var f=[].filter.call(panel.querySelectorAll("a[href],button,input,select,textarea,[tabindex]:not([tabindex='-1'])"),function(n){return!n.disabled&&n.getClientRects().length});
 if(!f.length)return;var a=f[0],z=f[f.length-1];
 if(e.shiftKey&&(document.activeElement===a||!panel.contains(document.activeElement))){e.preventDefault();z.focus()}
 else if(!e.shiftKey&&(document.activeElement===z||!panel.contains(document.activeElement))){e.preventDefault();a.focus()}};
/* U.sheet({open,label,badge,kids,onClose,instant}): one detail sheet per page, at body level (outside the query
   containers, so position:fixed is relative to the viewport). Side sheet on tablets, bottom sheet on phones
   (css/shell.css). It morphs in place like the page, so controls inside keep focus while values change.
   Escape, the scrim and Close all call onClose; the page clears its selection and returns focus. */
U.sheet=function(o){var root=document.getElementById("sheet-root"),h=U.h;
 if(!root){root=h("div",{id:"sheet-root"});document.body.appendChild(root)}
 if(U._esc){document.removeEventListener("keydown",U._esc);U._esc=null}
 var cur=root.querySelector(".panel");
 if(!o.open){if(!cur)return;
  if(window.Motion&&!o.instant&&!Motion.reduced()){/* exit plays in a detached layer so the root is free at once */
   var g=h("div",{"aria-hidden":"true"});g.inert=true;document.body.appendChild(g);while(root.firstChild)g.appendChild(root.firstChild);
   Motion.exit([g.querySelector(".panel"),g.querySelector(".scrim")],function(){g.remove()})}else{U.clear(root);if(window.Motion&&Motion.sheetOff)Motion.sheetOff()}return}
 var f=h("div",{},[h("div",{class:"scrim","data-key":"scrim",onclick:o.onClose}),
  h("div",{class:"panel sheet",role:"dialog","aria-modal":"true","aria-label":o.label,"data-key":"sheet"},
   [h("div",{class:"panel-top"},[o.badge||h("span"),h("button",{class:"btn soft",type:"button",text:"Close",onclick:o.onClose})])].concat(o.kids))]);
 U.patch(root,f,{animate:!!cur});
 U._esc=function(e){if(e.key==="Escape"){e.preventDefault();o.onClose()}else U.trap(e,root.querySelector(".panel"))};document.addEventListener("keydown",U._esc);
 if(!cur){root.querySelector(".panel-top button").focus({preventScroll:true});if(window.Motion){Motion.scan(root);if(Motion.panelIn)Motion.panelIn(root);Motion.stagger(root.querySelectorAll(".panel > :not(.panel-top)"),140,40)}}};
