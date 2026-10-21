window.U={
 /* The one collateral of the concept, named once here and used by every amount, label and sentence that states a unit. */
 COLL:"sDAI",
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
 narrow:matchMedia("(max-width:1100px)"),
 /* British dates worked out from today: U.dayIn(n) is the day n days on, as "5 Oct" ("5 Oct 2027" in another year). The explorer's closing dates and the round dates on Deep and Opportunity Markets use it. */
 MON:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
 dayIn:function(n){var now=new Date(),d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+n)),s=d.getUTCDate()+" "+U.MON[d.getUTCMonth()];return d.getUTCFullYear()===now.getUTCFullYear()?s:s+" "+d.getUTCFullYear()}
};
/* "/" focuses the page's search field (sel is its selector), unless the key is typed into a field, a modal sheet is open, or the field is not on screen */
U.slashSearch=function(sel){document.addEventListener("keydown",function(e){
 if(e.key!=="/"||e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey)return;
 var t=e.target,tag=t&&t.tagName;if(tag==="INPUT"||tag==="SELECT"||tag==="TEXTAREA"||(t&&t.isContentEditable))return;
 if([].some.call(document.querySelectorAll('[aria-modal="true"]'),function(n){return!n.closest("[inert]")}))return;
 var f=document.querySelector(sel);if(!f||!f.getClientRects().length||f.closest("[inert]"))return;
 e.preventDefault();f.focus()})};
/* keep Tab and Shift+Tab inside an open modal sheet */
U.trap=function(e,panel){if(e.key!=="Tab"||!panel)return;var f=[].filter.call(panel.querySelectorAll("a[href],button,input,select,textarea,[tabindex]:not([tabindex='-1'])"),function(n){return!n.disabled&&n.getClientRects().length});
 if(!f.length)return;var a=f[0],z=f[f.length-1];
 if(e.shiftKey&&(document.activeElement===a||!panel.contains(document.activeElement))){e.preventDefault();z.focus()}
 else if(!e.shiftKey&&(document.activeElement===z||!panel.contains(document.activeElement))){e.preventDefault();a.focus()}};
/* The pinned top bar of every detail sheet: grab handle (phones), badge or kicker, title and Close. It sticks to the
   top of the sheet while the body scrolls (css/shell.css); js/motion.js adds the hairline and the condense.
   Without a badge the title sits beside Close; with one, the badge does and the title takes the full width below. */
U.sheetTop=function(badge,title,onClose,extra){var h=U.h,x=h("button",{class:"btn soft pt-x",type:"button",text:"Close",onclick:onClose});
 return h("div",{class:"panel-top"},[h("span",{class:"panel-grip","aria-hidden":"true"}),
  h("div",{class:"pt-in"+(badge?" has-k":"")},[badge||null,title!=null?h("h2",{class:"pt-title",text:title}):null,extra?h("div",{class:"pt-acts"},[extra,x]):x])])};
/* U.menu({label, items:[[text, fn(button)], ...]}): the "More actions" button of a sheet bar (three vertical dots) and the small menu it opens
   below itself. Up and Down move between the items (wrapping), Home and End jump, Escape closes and returns focus to the button, Tab closes,
   a press outside closes, and choosing an item closes the menu and returns focus to the button before the item runs. The menu stays inside
   the viewport (it is shifted right when the button sits near the left edge). Returns {el, btn, say(text)}: el goes in the sheet bar
   (U.sheetTop's fourth argument) and say(text) shows a short confirmation under the button ("Copied"). */
U.menu=function(o){var h=U.h,doc=document,id="menu-"+(U._mn=(U._mn||0)+1),on=false,tt=0;
 var ic=U.svg("svg",{viewBox:"0 0 16 16",width:"16",height:"16",fill:"currentColor","aria-hidden":"true",focusable:"false"});[3,8,13].forEach(function(y){ic.appendChild(U.svg("circle",{cx:"8",cy:String(y),r:"1.5"}))});
 var btn=h("button",{class:"btn soft pt-more",type:"button","aria-label":o.label,"aria-haspopup":"menu","aria-expanded":"false","aria-controls":id}),
  list=h("div",{class:"menu",role:"menu","aria-label":o.label,id:id,hidden:""}),tip=h("span",{class:"menu-tip",hidden:"","aria-hidden":"true"}),
  wrap=h("div",{class:"pt-menu"},[btn,list,tip]),items=o.items.map(function(it){
   return h("button",{class:"menu-i",type:"button",role:"menuitem",tabindex:"-1",text:it[0],onclick:function(){close(true);it[1](btn)}})});
 btn.appendChild(ic);items.forEach(function(i){list.appendChild(i)});
 function at(k){var n=items.length;k=(k+n)%n;items[k].focus({preventScroll:true})}
 function out(e){if(wrap.isConnected&&wrap.contains(e.target))return;close(false);
  /* a press on the dimmed page only closes the menu: its click is not passed on, so the sheet stays open */
  if(e.target.classList&&e.target.classList.contains("scrim")){var sw=function(v){v.stopPropagation();v.preventDefault()};doc.addEventListener("click",sw,{capture:true,once:true});setTimeout(function(){doc.removeEventListener("click",sw,true)},500)}}
 function close(back){if(!on)return;on=false;list.hidden=true;list.style.right="";btn.setAttribute("aria-expanded","false");doc.removeEventListener("pointerdown",out,true);if(back&&btn.isConnected)btn.focus({preventScroll:true})}
 function show(first){if(on)return;on=true;tip.hidden=true;list.hidden=false;btn.setAttribute("aria-expanded","true");doc.addEventListener("pointerdown",out,true);
  /* right edges line up; if that pushes the menu past the left edge of the screen, it moves right by the overshoot */
  var r=list.getBoundingClientRect(),gap=8;if(r.left<gap)list.style.right=(r.left-gap)+"px";at(first)}
 btn.onclick=function(){if(on)close(true);else show(0)};
 btn.onkeydown=function(e){if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();show(e.key==="ArrowUp"?-1:0)}};
 list.onkeydown=function(e){var k=items.indexOf(doc.activeElement);
  if(e.key==="ArrowDown"){e.preventDefault();at(k+1)}else if(e.key==="ArrowUp"){e.preventDefault();at(k-1)}
  else if(e.key==="Home"){e.preventDefault();at(0)}else if(e.key==="End"){e.preventDefault();at(-1)}
  else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close(true)}else if(e.key==="Tab")close(true)};
 return{el:wrap,btn:btn,say:function(t){clearTimeout(tt);tip.textContent=t;tip.hidden=false;tt=setTimeout(function(){tip.hidden=true},2200)}}};
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
 if(!cur){var fo=o.focus&&root.querySelector(o.focus);(fo||root.querySelector(".panel-top .pt-x")).focus({preventScroll:true});
  if(window.Motion){Motion.scan(root);if(Motion.panelIn)Motion.panelIn(root);Motion.stagger(root.querySelectorAll(".pt-title, .panel > :not(.panel-top)"),140,40)}}};
/* the wallet sheet sits above every other sheet: while it is open, the ones below ignore Escape and Tab */
U.covered=function(R){return R!=="wallet-root"&&!!document.querySelector("#wallet-root .panel")};
U.openPanel=function(){return document.querySelector("#sheet-root .panel, #panel-root .panel, #wallet-root .panel")};

/* A concept note: one short line at the foot of the screen for a control that exists in the live product and is outside this concept.
   U.concept(text, opener): one at a time, announced once through the page's polite live region, gone after 5 seconds, on Escape or on its
   Close button. Focus stays where it is; Close returns it to opener. While a sheet is open on a narrow screen the sheet is lifted by the
   note's height (html.cn-on, --cn-h in css/demo.css), so the note sits below the sheet and covers none of it. */
U.concept=function(text,opener){var h=U.h,doc=document,root=doc.documentElement;
 var old=doc.getElementById("concept-note");if(old&&old.__end)old.__end(true);
 var n,t=0,done=false,key=function(e){if(e.key==="Escape"&&!e.defaultPrevented){e.preventDefault();end()}};
 function end(quick,back){if(done)return;done=true;clearTimeout(t);n.removeAttribute("id");doc.removeEventListener("keydown",key,true);root.classList.remove("cn-on");root.style.removeProperty("--cn-h");
  var gone=function(){if(n.parentNode)n.remove()};
  if(quick||(window.Motion&&Motion.reduced())||(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches))gone();else{n.classList.add("is-out");setTimeout(gone,200)}
  if(back&&opener&&opener.isConnected)opener.focus({preventScroll:true})}
 var x=h("button",{class:"btn soft cn-x",type:"button","aria-label":"Close note",onclick:function(){end(false,true)}}),ic=U.svg("svg",{viewBox:"0 0 16 16",width:"16",height:"16","aria-hidden":"true",focusable:"false",fill:"none",stroke:"currentColor","stroke-width":"1.6","stroke-linecap":"round"});
 ic.appendChild(U.svg("path",{d:"M4 4l8 8M12 4l-8 8"}));x.appendChild(ic);
 n=h("div",{class:"concept-note",id:"concept-note",role:"region","aria-label":"Concept note"},[h("span",{class:"cn-t",text:text}),x]);n.__end=end;
 doc.body.appendChild(n);doc.addEventListener("keydown",key,true);
 if(U.openPanel()&&matchMedia("(max-width:760px)").matches){root.classList.add("cn-on");root.style.setProperty("--cn-h",Math.ceil(innerHeight-n.offsetTop+8)+"px")}
 var D=window.SeerDemo,W=window.SeerWallet;(D&&D.announce||W&&W.announce||function(){})(text);
 t=setTimeout(function(){end()},5000)};

/* The sentences that explain a term, once: the assistant (js/assistant.js) answers with them and the toggletips (U.tip) open with them. */
U.GLOSS={
 range:"The 90% range is where the market expects the evaluators' score to land nine times out of ten. A narrow range means traders agree; a wide one means they do not.",
 agents:"AI agents trade beside people. Each row in Deep shows how much of the volume comes from agents and how much from people, so you can see where the forecast comes from.",
 differs:"Differs from the market marks a submission where the reviewers' decision went against the signal: selected with less than a 30% chance, or not selected with 50% or more. It flags only the exceptions, so most rows show nothing.",
 change:"Change under pass is how much higher or lower the forecast is if the proposal passes than if it fails, as a percentage of the forecast if it fails."};
/* U.tip(text, label): a toggletip. A 24px "?" button (44px hit area) that opens a small popover with one sentence. The popover is one polite live region
   on the page (role status) that is empty while closed, so the sentence is announced once, when it opens; the button is aria-expanded and
   aria-describedby that region. Escape and a press outside close it (Escape returns focus to the button); so do leaving the button, a resize and
   the button leaving the page. It is placed with fixed coordinates below the button (above when there is no room) and kept 8px inside the
   viewport, at body level so a table cell or a contained row cannot clip it. Press and key events stop at the button, so a tip inside a
   selectable row does not select the row. U.tipClose() closes the open one (before a re-render). */
(function(){var pop=null,cur=null,doc=document,GAP=8;
 function place(){var r=cur.getBoundingClientRect(),w=document.documentElement.clientWidth;pop.style.left="0px";pop.style.top="0px";var p=pop.getBoundingClientRect(),
   left=Math.min(Math.max(GAP,r.left+r.width/2-p.width/2),w-GAP-p.width),top=r.bottom+GAP;
  if(top+p.height>innerHeight-GAP&&r.top-GAP-p.height>GAP)top=r.top-GAP-p.height;pop.style.left=Math.round(left)+"px";pop.style.top=Math.round(top)+"px"}
 function out(e){if(cur&&e.target!==cur&&!cur.contains(e.target)&&!pop.contains(e.target))close(false)}
 function key(e){if(cur&&e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close(true)}}
 function move(){if(!cur)return;if(!cur.isConnected)close(false);else place()}
 function close(back){var b=cur;if(!b)return;cur=null;b.setAttribute("aria-expanded","false");pop.hidden=true;pop.textContent="";
  doc.removeEventListener("pointerdown",out,true);doc.removeEventListener("keydown",key,true);doc.removeEventListener("scroll",move,true);removeEventListener("resize",rs);
  if(back&&b.isConnected)b.focus({preventScroll:true})}
 function rs(){close(false)}
 U.tipClose=function(){close(false)};
 U.tip=function(text,label){
  if(!pop){pop=U.h("div",{class:"tt-pop",id:"tt-pop",role:"status","aria-live":"polite",hidden:""});doc.body.appendChild(pop);pop.onpointerdown=function(e){e.preventDefault()}}
  var b=U.h("button",{class:"tt-b",type:"button","aria-label":label,"aria-expanded":"false","aria-describedby":"tt-pop",text:"?",
   onkeydown:function(e){e.stopPropagation()},
   onblur:function(){if(cur===b)close(false)},
   onclick:function(e){e.stopPropagation();if(cur===b){close(true);return}close(false);cur=b;b.setAttribute("aria-expanded","true");pop.hidden=false;pop.textContent=text;place();
    doc.addEventListener("pointerdown",out,true);doc.addEventListener("keydown",key,true);doc.addEventListener("scroll",move,true);addEventListener("resize",rs)}});
  return b}})();
