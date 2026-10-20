(function(){
SeerShell.mount({product:"deep",cta:"Connect wallet"});
var h=U.h,r=U.rng(42),A=["Open","Modular","Private","Verifiable","Composable","Lightweight","Cross-chain","Community","Resilient","Adaptive"],N=["indexer","wallet kit","oracle feed","audit tooling","education hub","bridge monitor","data commons","rollup toolkit","identity layer","dev grants portal"];
var D=[];for(var i=0;i<100;i++){var sc=Math.min(9.6,Math.max(2.4,4+r()*4.5+(r()-.5)*2)),w=.5+r()*1.4,av=Math.round((5+r()*120)*1e3*(r()>.5?1.6:.5)),hv=Math.round((5+r()*70)*1e3*(r()>.5?1.5:.6));
 D.push({id:i+1,name:A[Math.floor(r()*A.length)]+" "+N[Math.floor(r()*N.length)],s:+sc.toFixed(1),lo:+Math.max(0,sc-w).toFixed(1),hi:+Math.min(10,sc+w).toFixed(1),av:av,hv:hv,at:Math.round(3+r()*40),ht:Math.round(2+r()*30),ch:+((r()-.5)*1.2).toFixed(1)})}
var st={q:"",f:"all",sort:"s",dir:-1,n:25,sel:null};
var TOT=D.reduce(function(a,d){return{av:a.av+d.av,hv:a.hv+d.hv}},{av:0,hv:0}),BEST=D.reduce(function(a,d){return d.s>a?d.s:a},0);
function ag(d){return d.av/(d.av+d.hv)}
/* derived once: the agent share, the lower-cased name for search and the name's rank in collation order (a
   number compare per pair instead of localeCompare) */
D.forEach(function(d){d.ag=ag(d);d.lc=d.name.toLowerCase();d.sid=String(d.id)});
D.slice().sort(function(a,b){return a.name.localeCompare(b.name)}).forEach(function(d,i,o){d.nr=i&&!o[i-1].name.localeCompare(d.name)?o[i-1].nr:i});
function view(){var q=st.q.toLowerCase(),l=D.filter(function(d){return(!st.q||d.lc.indexOf(q)>=0||d.sid===st.q)&&(st.f==="all"||(st.f==="agent"?d.ag>=.5:d.ag<.5))});
 var k=st.sort==="name"?"nr":st.sort;l.sort(function(a,b){return(a[k]-b[k])*st.dir});return l}

/* The page keeps its nodes. The frame, the 100 dots and each row are built once; an update touches only what
   changed: a selection restyles two dots and two rows, a sort or filter moves rows (fewest moves), and the
   small parts that do change (readout, filter bar, sort bar) are morphed on their own. */
var dotEls=[],rowEls=new Map(),shown=null,sideK=null,ui={};
function dotOn(c,on){c.setAttribute("stroke",on?"var(--text)":"none");c.setAttribute("stroke-width",on?3:2);c.setAttribute("aria-pressed",String(on))}
function dots(){var s=U.svg("svg",{class:"dotfield",viewBox:"0 0 300 300",width:"100%",role:"group","aria-label":"Field of 100 proposals coloured by forecast score"});
 D.forEach(function(d,i){var c=U.svg("circle",{cx:15+(i%10)*30,cy:15+Math.floor(i/10)*30,r:4+d.s*.8,fill:"var(--violet)","fill-opacity":(.18+d.s/10*.82).toFixed(2),tabindex:"0",role:"button","aria-label":"#"+d.id+" "+d.name+", forecast "+d.s});dotOn(c,st.sel===d);
  c.onclick=function(){choose(d)};c.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(d)}};dotEls.push(c);s.appendChild(c)});return s}
/* selecting updates in place; the dot for the choice ripples so the eye finds it in the field */
function choose(d){st.sel=d;render();if(window.Motion)Motion.ripple(dotEls[d.id-1])}
function split(d){var p=Math.round(ag(d)*100);return h("span",{class:"split","aria-label":p+"% agent volume"},[h("span",{class:"split-trk"},[h("i",{class:"mini",style:"width:"+p+"%;background:var(--violet)"}),h("i",{class:"mini",style:"width:"+(100-p)+"%;background:var(--text-2);opacity:.5"})]),h("span",{class:"num muted",style:"margin-left:8px",text:p+"% agents"})])}
function rowOn(tr,on){tr.classList.toggle("is-sel",on);if(on)tr.setAttribute("aria-current","true");else tr.removeAttribute("aria-current")}
/* one row per proposal, built the first time it is shown and reused after that (its values never change) */
function row(d){var tr=rowEls.get(d.id);if(tr)return tr;
 tr=h("tr",{tabindex:"0","data-key":"d"+d.id,role:"row",onclick:function(){choose(d)},onkeydown:function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(d)}}},[
  h("td",{class:"num muted c-id",role:"cell",text:String(d.id)}),h("td",{class:"c-n",role:"cell",text:d.name}),h("td",{class:"r num c-s",role:"cell","data-label":"Forecast",text:d.s.toFixed(1)}),h("td",{class:"r num muted c-r",role:"cell","data-label":"90% range",text:d.lo+" to "+d.hi}),h("td",{class:"c-ag",role:"cell"},[split(d)]),
  h("td",{class:"r num c-av",role:"cell","data-label":"Agent vol.",text:U.money(d.av)}),h("td",{class:"r num c-hv",role:"cell","data-label":"Human vol.",text:U.money(d.hv)}),
  h("td",{class:"r num c-ch "+(d.ch>=0?"pos":"neg"),role:"cell","data-label":"7d",text:(d.ch>=0?"▲ +":"▼ ")+d.ch.toFixed(1)})]);
 if(st.sel===d)rowOn(tr,true);rowEls.set(d.id,tr);return tr}
/* the selected proposal's readout. It repeats the row's score and range on purpose: a dot-field pick may sit in a
   row that is filtered out or not yet loaded, and the readout adds who is trading it. */
function readout(d){return h("div",{class:"kpi k4"},[h("div",{},[h("small",{text:"Forecast score"}),h("b",{class:"num",text:d.s.toFixed(1)+" / 10"})]),h("div",{},[h("small",{text:"90% range"}),h("b",{class:"num",text:d.lo+" to "+d.hi})]),h("div",{},[h("small",{text:"Agent traders"}),h("b",{class:"num",text:String(d.at)})]),h("div",{},[h("small",{text:"Human traders"}),h("b",{class:"num",text:String(d.ht)})])])}
function close(){var d=st.sel;st.sel=null;render();if(!d)return;var r=rowEls.get(d.id);if(!r||!r.isConnected||r.__out)r=dotEls[d.id-1];r.focus({preventScroll:true})}
/* desktop: the readout sits beside the field. Tablet and phone: it opens in a sheet, and this panel keeps the hint. */
function side(narrow){var inline=st.sel&&!narrow;return h("div",{class:"stack"},[h("div",{class:"kpi top"},[h("div",{},[h("small",{text:"Agent volume"}),h("b",{class:"num",text:U.money(TOT.av)})]),h("div",{},[h("small",{text:"Human volume"}),h("b",{class:"num",text:U.money(TOT.hv)})]),h("div",{},[h("small",{text:"Top forecast"}),h("b",{class:"num",text:BEST.toFixed(1)+" / 10"})])]),
  h("div",{class:"notice",text:"Evaluators still score every proposal. The market forecasts their scores; it does not choose winners."}),
  inline?h("div",{class:"panel-c"},[h("div",{class:"line"},[h("h2",{text:"#"+st.sel.id+" "+st.sel.name}),h("button",{class:"btn soft",type:"button",text:"Clear",onclick:function(){st.sel=null;render()}})]),readout(st.sel)])
   :h("div",{class:"panel-c"},[h("h2",{text:"Select a proposal"}),h("p",{class:"note",text:"Pick a dot in the field or a proposal below to see its forecast score, 90% range and who is trading it."})])])}
function head(l){return h("div",{class:"head"},[
 h("div",{class:"ctrls"},[h("input",{class:"field",type:"search",placeholder:"Search proposals",value:st.q,"aria-label":"Search proposals",oninput:function(e){st.q=e.target.value;st.n=25;render()}}),
  h("div",{class:"seg",role:"group","aria-label":"Participation"},[["all","All"],["agent","Agent-led"],["human","Human-led"]].map(function(f){return h("button",{type:"button","aria-pressed":String(st.f===f[0]),text:f[1],onclick:function(){st.f=f[0];st.n=25;render()}})}))]),
 h("span",{class:"muted",role:"status",text:"Showing "+Math.min(st.n,l.length)+" of "+l.length})])}
var COLS=[["id","#"],["name","Proposal"],["s","Forecast score","r"],["lo","90% range","r"],["ag","Agent vs human volume"],["av","Agent vol.","r"],["hv","Human vol.","r"],["ch","7d change","r"]];
function thText(c){return c[1]+(st.sort===c[0]?(st.dir>0?" ↑":" ↓"):"")}
function thSort(c){return st.sort===c[0]?(st.dir>0?"ascending":"descending"):"none"}
/* phones: the column headers are hidden with the card layout, so the same sort state gets a select and an order toggle */
var SORTS=[["s","Forecast score"],["ch","7d change"],["ag","Agent share of volume"],["av","Agent volume"],["hv","Human volume"],["lo","90% range, low end"],["name","Proposal name"],["id","Proposal number"]];
function sortbar(){var ord=st.sort==="name"?(st.dir>0?"A to Z":"Z to A"):(st.dir>0?"Lowest first":"Highest first");
 return h("div",{class:"sortbar narrow-only","data-key":"sortbar"},[h("label",{for:"deep-sort",text:"Sort by"}),
  h("select",{class:"field",id:"deep-sort",onchange:function(e){var k=e.target.value;st.sort=k;st.dir=k==="name"||k==="id"?1:-1;render()}},SORTS.map(function(o){return h("option",{value:o[0],text:o[1],selected:st.sort===o[0]?"selected":null})})),
  h("button",{class:"btn soft",type:"button",onclick:function(){st.dir*=-1;render()}},[h("span",{"aria-hidden":"true",text:st.dir>0?"↑ ":"↓ "}),ord])])}
/* rows: the visual order is set with the CSS order property (a style change: no row is detached, so none has to
   be laid out again in the frame that starts the glide). The DOM follows a frame later, a few rows per frame
   (tidy), so reading and tab order match what is on screen a moment after the sort. */
function rows(ctx,want){var tb=ui.tbody,keep=new Set(want),c,nx,last=want[want.length-1];
 want.forEach(function(n){if(n.__out)ctx.back(n)});/* still fading out from an earlier update, and listed again */
 for(c=tb.firstElementChild;c;c=nx){nx=c.nextElementSibling;if(!c.__out&&!keep.has(c))ctx.drop(c,tb)}
 want.forEach(function(n,k){var o=String(k);if(n.style.order!==o)n.style.order=o;if(!n.isConnected){ctx.added.push(n);tb.appendChild(n)}});
 /* the last row drops its rule; marked here because the DOM's last child can lag the visual order for a moment */
 if(ui.end!==last){if(ui.end)ui.end.classList.remove("is-end");if(last)last.classList.add("is-end");ui.end=last}
 ui.want=want;tidy()}
/* longest increasing subsequence (indices into a): the rows that can stay where they are while the rest move */
function lis(a){var p=new Array(a.length),m=[],i,lo,hi,mid;
 for(i=0;i<a.length;i++){lo=0;hi=m.length;while(lo<hi){mid=(lo+hi)>>1;if(a[m[mid]]<a[i])lo=mid+1;else hi=mid}p[i]=lo?m[lo-1]:-1;m[lo]=i}
 var out=[],k=m.length?m[m.length-1]:-1;while(k>=0){out.push(k);k=p[k]}return out.reverse()}
/* bring the DOM order in line with the visual order: keep the longest run already in order, move up to 8 others
   per frame (moveBefore where it exists, so a row keeps its style, focus and running animations), starting the
   frame after the change so it never adds to the frame that starts the motion */
var tq=0;
function tidy(){if(!tq)tq=requestAnimationFrame(function(){tq=requestAnimationFrame(step)})}
function step(){tq=0;var tb=ui.tbody,want=ui.want,pos=new Map(),seq=[],at=[],i=0,c,n=0,f=document.activeElement;
 for(c=tb.firstElementChild;c;c=c.nextElementSibling)if(!c.__out)pos.set(c,i++);
 want.forEach(function(r,k){if(pos.has(r)){seq.push(pos.get(r));at.push(k)}});
 var run=lis(seq);if(run.length===want.length)return;
 var stay=new Set(run.map(function(j){return want[at[j]]}));
 for(var k=want.length-1,anchor=null;k>=0&&n<8;k--){c=want[k];if(!stay.has(c)&&c.parentNode===tb){if(tb.moveBefore)tb.moveBefore(c,anchor);else{tb.insertBefore(c,anchor);if(c===f)c.focus({preventScroll:true})}n++}anchor=c}
 tidy()}
/* first render: the whole page is built and handed to the morph, so it enters exactly as before */
function frame(){var target=document.getElementById("root"),root=h("div"),l=view(),narrow=U.narrow.matches;
 var top=h("div",{class:"cols2"},[h("div",{class:"panel-c"},[h("h2",{text:"Grant round · 100 proposals"}),dots(),h("p",{class:"note",text:"Bigger, brighter dot = higher forecast score."})]),side(narrow)]);
 var tr=h("tr");ui.th=COLS.map(function(c){var th=h("th",{scope:"col",class:c[2]||"","aria-sort":thSort(c)},[h("button",{type:"button",text:thText(c),onclick:function(){if(st.sort===c[0])st.dir*=-1;else{st.sort=c[0];st.dir=c[0]==="name"||c[0]==="id"?1:-1}render()}})]);tr.appendChild(th);return th});
 var body=h("tbody");l.slice(0,st.n).forEach(function(d){body.appendChild(row(d))});
 var tbl=h("div",{class:"tbl tall rtbl deep-tbl","data-key":"tbl"},[U.roles(h("table",{},[h("thead",{},[tr]),body]))]);
 ui.more=h("button",{class:"btn lg",type:"button",text:"Show 25 more",onclick:function(){st.n+=25;render()}});
 /* the filter bar belongs to the list, so it sits closer to the table than to the field above */
 var sec=h("section",{class:"stack list-sec","aria-label":"Proposals"},[head(l),sortbar(),tbl]);
 if(l.length>st.n)sec.appendChild(ui.more);
 root.appendChild(top);root.appendChild(sec);
 U.patch(target,root,{flip:"tbody tr"});
 U.sheet({open:false,onClose:close});
 ui.side=top.lastChild;ui.sec=sec;ui.head=sec.firstChild;ui.sortbar=sec.children[1];ui.tbody=body;shown=st.sel;sideK=st.sel&&!narrow?st.sel.id:0}
function render(){var l=view(),narrow=U.narrow.matches,want=l.slice(0,st.n).map(row),more=l.length>st.n,sk=st.sel&&!narrow?st.sel.id:0;
 /* the list first: its rows are measured before anything above them can change height, so every shift glides */
 U.patch(ui.sec,function(ctx){rows(ctx,want);var m=ui.more;
  if(more&&!m.isConnected){ui.sec.appendChild(m);ctx.added.push(m)}else if(!more&&m.isConnected)ctx.drop(m,ui.sec)},{flip:"tbody tr",lazy:!narrow});
 if(shown!==st.sel){if(shown){dotOn(dotEls[shown.id-1],false);if(rowEls.has(shown.id))rowOn(rowEls.get(shown.id),false)}
  if(st.sel){dotOn(dotEls[st.sel.id-1],true);if(rowEls.has(st.sel.id))rowOn(rowEls.get(st.sel.id),true)}shown=st.sel}
 if(sk!==sideK){sideK=sk;U.patch(ui.side,side(narrow))}
 U.patch(ui.head,head(l));
 ui.th.forEach(function(th,k){var c=COLS[k],b=th.firstChild,t=thText(c);if(th.getAttribute("aria-sort")!==thSort(c))th.setAttribute("aria-sort",thSort(c));if(b.textContent!==t)b.textContent=t});
 U.patch(ui.sortbar,sortbar());
 U.sheet({open:!!(st.sel&&narrow),label:st.sel?"#"+st.sel.id+" "+st.sel.name:"",badge:h("span",{class:"badge",text:"Proposal #"+(st.sel?st.sel.id:"")}),
  kids:st.sel?[h("h2",{text:st.sel.name}),readout(st.sel)]:[],onClose:close,instant:!narrow});
 var ss=document.getElementById("deep-sort");if(ss&&ss.value!==st.sort)ss.value=st.sort}
frame();
U.narrow.addEventListener("change",function(){render()});
if(window.Motion){Motion.ready();
 Motion.reveal(".cols2 > .panel-c, .kpi.top > div, .cols2 .stack > .notice, .cols2 .stack > .panel-c, .list-sec > .head",{onIn:Motion.dataIn});
 /* table rows: only the ones visible in the scroll box stagger in; the rest are simply there */
 Motion.reveal([].slice.call(ui.tbody.children,0,14),{rise:8,onIn:Motion.dataIn})}
})();
