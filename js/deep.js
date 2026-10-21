(function(){
SeerShell.mount({product:"deep",cta:"Connect wallet"});
var h=U.h,W=window.SeerWallet,r=U.rng(42),A=["Open","Modular","Private","Verifiable","Composable","Lightweight","Cross-chain","Community","Resilient","Adaptive"],N=["indexer","wallet kit","oracle feed","audit tooling","education hub","bridge monitor","data commons","rollup toolkit","identity layer","dev grants portal"];
var D=[];for(var i=0;i<100;i++){var sc=Math.min(9.6,Math.max(2.4,4+r()*4.5+(r()-.5)*2)),w=.5+r()*1.4,av=Math.round((5+r()*120)*1e3*(r()>.5?1.6:.5)),hv=Math.round((5+r()*70)*1e3*(r()>.5?1.5:.6));
 D.push({id:i+1,name:A[Math.floor(r()*A.length)]+" "+N[Math.floor(r()*N.length)],s:+sc.toFixed(1),lo:+Math.max(0,sc-w).toFixed(1),hi:+Math.min(10,sc+w).toFixed(1),av:av,hv:hv,at:Math.round(3+r()*40),ht:Math.round(2+r()*30),ch:+((r()-.5)*1.2).toFixed(1)})}
var st={q:"",f:"all",sort:"s",dir:-1,n:25,sel:null};
/* loads go through js/demo.js (delay, errors, offline, cache); without it they resolve at once, as before */
var DM=window.SeerDemo;
function slot(){return DM?DM.slot():{run:function(o){o.apply({data:o.producer(),fromCache:false,empty:false},{sync:true,shown:false})},cancel:function(){}}}
var pageSlot=slot(),selSlot=slot(),moreSlot=slot(),pageState="ok",det={id:0,state:"ok",err:null},moreErr=null;
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
  c.onclick=function(){choose(d,"dot")};c.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(d,"dot")}};dotEls.push(c);s.appendChild(c)});return s}
/* selecting updates in place; the dot for the choice ripples so the eye finds it in the field */
/* src is where the choice was made, a dot or a row: closing the selection returns focus there */
var src="row";
function choose(d,from){src=from||"row";if(st.sel!==d)flow.reset();st.sel=d;loadSel(d);if(window.Motion)Motion.ripple(dotEls[d.id-1])}
/* a selection's details: the readout (or the sheet's body) shows placeholders at once while they load */
function loadSel(d){det={id:d.id,state:"ok",err:null};
 selSlot.run({key:"deep:proposal:"+d.id,cacheLabel:"Deep proposal #"+d.id,producer:function(){return d},scope:"details",initial:true,label:"Loading proposal details",
  show:function(){det={id:d.id,state:"loading",err:null};render()},
  apply:function(res){det={id:d.id,state:res.empty?"empty":"ok",err:null};render()},
  fail:function(e){det={id:d.id,state:"error",err:e};render()}})}
function split(d){var p=Math.round(ag(d)*100);return h("span",{class:"split","aria-label":p+"% agent volume"},[h("span",{class:"split-trk"},[h("i",{class:"mini",style:"width:"+p+"%;background:var(--violet)"}),h("i",{class:"mini",style:"width:"+(100-p)+"%;background:var(--text-2);opacity:.5"})]),h("span",{class:"num muted",style:"margin-left:8px",text:p+"% agents"})])}
function rowOn(tr,on){tr.classList.toggle("is-sel",on);if(on)tr.setAttribute("aria-current","true");else tr.removeAttribute("aria-current")}
/* one row per proposal, built the first time it is shown and reused after that (its values never change) */
function row(d){var tr=rowEls.get(d.id);if(tr)return tr;
 tr=h("tr",{tabindex:"0","data-key":"d"+d.id,role:"row",onclick:function(){choose(d,"row")},onkeydown:function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(d,"row")}}},[
  h("td",{class:"num muted c-id",role:"cell",text:String(d.id)}),h("td",{class:"c-n",role:"cell",text:d.name}),h("td",{class:"r num c-s",role:"cell","data-label":"Forecast",text:d.s.toFixed(1)}),h("td",{class:"r num muted c-r",role:"cell","data-label":"90% range",text:d.lo+" to "+d.hi}),h("td",{class:"c-ag",role:"cell"},[split(d)]),
  h("td",{class:"r num c-av",role:"cell","data-label":"Agent vol.",text:U.money(d.av)}),h("td",{class:"r num c-hv",role:"cell","data-label":"Human vol.",text:U.money(d.hv)}),
  h("td",{class:"r num c-ch "+(d.ch>0?"pos":d.ch<0?"neg":"muted"),role:"cell","data-label":"7d",text:d.ch===0?"0.0":(d.ch>0?"▲ +":"▼ ")+U.num(d.ch,1)})]);
 if(st.sel===d)rowOn(tr,true);rowEls.set(d.id,tr);return tr}
/* the selected proposal's readout. It repeats the row's score and range on purpose: a dot-field pick may sit in a
   row that is filtered out or not yet loaded, and the readout adds who is trading it. */
function readout(d,inSheet){var S=DM&&DM.sk,L=["Forecast score","90% range","Agent traders","Human traders"];
 if(det.id===d.id&&det.state==="loading")return h("div",{class:"kpi k4","aria-busy":"true"},L.map(function(l){return h("div",{},[h("small",{text:l}),h("b",{class:"num"},[S(l==="90% range"?"9ch":"4ch")])])}));
 if(det.id===d.id&&det.state==="error")return DM.errorView(det.err,{level:inSheet?"sheet":"panel",subject:"this proposal",retry:function(){DM.holdFocus(document.querySelector("#sheet-root .panel")||ui.side);loadSel(d)},
  back:{text:"Back to the list",onclick:close},titles:{notfound:"This proposal no longer exists"},texts:{notfound:"It may have been withdrawn from the round. Go back to the list to pick another."}});
 if(det.id===d.id&&det.state==="empty")return DM.emptyView({level:inSheet?"sheet":"panel",title:"No forecast yet",text:"Nobody has traded this proposal yet, so there is no score to show. Check again in a moment.",action:{text:"Check again",onclick:function(){loadSel(d)}}});
 return h("div",{class:"kpi k4"},[h("div",{},[h("small",{text:"Forecast score"}),h("b",{class:"num",text:d.s.toFixed(1)+" / 10"})]),h("div",{},[h("small",{text:"90% range"}),h("b",{class:"num",text:d.lo+" to "+d.hi})]),h("div",{},[h("small",{text:"Agent traders"}),h("b",{class:"num",text:String(d.at)})]),h("div",{},[h("small",{text:"Human traders"}),h("b",{class:"num",text:String(d.ht)})])])}
function close(){var d=st.sel;st.sel=null;selSlot.cancel();flow.reset();render();if(!d)return;var r=rowEls.get(d.id),o=dotEls[d.id-1],ok=function(n){return n&&n.isConnected&&!n.__out},t=src==="dot"?[o,r]:[r,o];(ok(t[0])?t[0]:ok(t[1])?t[1]:o).focus({preventScroll:true})}
/* desktop: the readout sits beside the field. Tablet and phone: it opens in a sheet, and this panel keeps the hint. */
function side(narrow){var inline=st.sel&&!narrow;return h("div",{class:"stack"},[h("div",{class:"kpi top"},[h("div",{},[h("small",{text:"Agent volume"}),h("b",{class:"num",text:U.money(TOT.av)})]),h("div",{},[h("small",{text:"Human volume"}),h("b",{class:"num",text:U.money(TOT.hv)})]),h("div",{},[h("small",{text:"Top forecast"}),h("b",{class:"num",text:BEST.toFixed(1)+" / 10"})])]),
  h("div",{class:"notice",text:"Evaluators still score every proposal. The market forecasts their scores; it does not choose winners."}),
  inline?h("div",{class:"panel-c"},[h("div",{class:"line"},[h("h2",{text:"#"+st.sel.id+" "+st.sel.name}),h("button",{class:"btn soft",type:"button",text:"Clear",onclick:close})]),readout(st.sel)].concat(tradable(st.sel)?[ticketNode()]:[]))
   :h("div",{class:"panel-c"},[h("h2",{text:"Select a proposal"}),h("p",{class:"note",text:"Pick a dot in the field or a proposal below to see its forecast score, 90% range and who is trading it."})])])}
/* the round's one date: when the evaluators score (a day counted from today, as on the explorer) */
function meta(){return h("p",{class:"muted"},["Evaluators score by "+U.dayIn(52)])}
function head(l){return h("div",{class:"head"},[
 h("div",{class:"ctrls"},[h("input",{class:"field",type:"search",placeholder:"Search proposals",value:st.q,"aria-label":"Search proposals","aria-keyshortcuts":"/",oninput:function(e){st.q=e.target.value;st.n=25;moreReset();render()}}),
  h("div",{class:"tt-row"},[h("div",{class:"seg",role:"group","aria-label":"Participation"},[["all","All"],["agent","Agent-led"],["human","Human-led"]].map(function(f){return h("button",{type:"button","aria-pressed":String(st.f===f[0]),text:f[1],onclick:function(){st.f=f[0];st.n=25;moreReset();render()}})})),
   U.tip(U.GLOSS.agents,"What Agent-led and Human-led mean")])]),
 h("span",{class:"muted",role:"status",text:"Showing "+Math.min(st.n,l.length)+" of "+l.length})])}
var COLS=[["id","#"],["name","Proposal"],["s","Forecast score","r"],["lo","90% range","r"],["ag","Agent vs human volume"],["av","Agent vol.","r"],["hv","Human vol.","r"],["ch","7d change","r"]];
/* the "90% range" toggletip: one node, in the column head from 1101px and in the first card's range line below it (the head is hidden there) */
var rangeTip=U.tip(U.GLOSS.range,"What the 90% range means");
function placeRange(narrow,first){var host=narrow&&first?first.querySelector(".c-r"):ui.th[3];if(host&&rangeTip.parentNode!==host)host.appendChild(rangeTip)}
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
 var body=h("tbody");l.slice(0,st.n).forEach(function(d){body.appendChild(row(d))});placeRange(narrow,body.firstChild);
 var tbl=h("div",{class:"tbl tall rtbl deep-tbl","data-key":"tbl"},[U.roles(h("table",{},[h("thead",{},[tr]),body]))]);
 ui.more=h("button",{class:"btn lg",type:"button",text:"Show 25 more",onclick:more});
 /* the filter bar belongs to the list, so it sits closer to the table than to the field above */
 var sec=h("section",{class:"stack list-sec","aria-label":"Proposals"},[head(l),meta(),sortbar(),tbl]);
 if(l.length>st.n)sec.appendChild(ui.more);
 root.appendChild(top);root.appendChild(sec);
 U.patch(target,root,{flip:"tbody tr"});
 U.sheet({open:false,onClose:close});
 ui.side=top.lastChild;ui.sec=sec;ui.head=sec.firstChild;ui.sortbar=sec.children[2];ui.tbody=body;shown=st.sel;sideK=st.sel&&!narrow?st.sel.id+":"+det.state:0}
function render(){U.tipClose();var l=view(),narrow=U.narrow.matches,want=l.slice(0,st.n).map(row),more=l.length>st.n&&!moreErr,sk=st.sel&&!narrow?st.sel.id+":"+det.state:0;
 /* the list first: its rows are measured before anything above them can change height, so every shift glides */
 U.patch(ui.sec,function(ctx){rows(ctx,want);var m=ui.more;
  if(more&&!m.isConnected){ui.sec.appendChild(m);ctx.added.push(m)}else if(!more&&m.isConnected)ctx.drop(m,ui.sec)},{flip:"tbody tr",lazy:!narrow});
 if(shown!==st.sel){if(shown){dotOn(dotEls[shown.id-1],false);if(rowEls.has(shown.id))rowOn(rowEls.get(shown.id),false)}
  if(st.sel){dotOn(dotEls[st.sel.id-1],true);if(rowEls.has(st.sel.id))rowOn(rowEls.get(st.sel.id),true)}shown=st.sel}
 if(sk!==sideK){sideK=sk;U.patch(ui.side,side(narrow))}
 placeRange(narrow,want[0]);U.patch(ui.head,head(l));
 ui.th.forEach(function(th,k){var c=COLS[k],b=th.firstChild,t=thText(c);if(th.getAttribute("aria-sort")!==thSort(c))th.setAttribute("aria-sort",thSort(c));if(b.textContent!==t)b.textContent=t});
 U.patch(ui.sortbar,sortbar());
 U.sheet({open:!!(st.sel&&narrow),label:st.sel?"#"+st.sel.id+" "+st.sel.name:"",badge:h("span",{class:"badge",text:"Proposal #"+(st.sel?st.sel.id:"")}),
  title:st.sel?st.sel.name:"",kids:st.sel?[readout(st.sel,true)].concat(tradable(st.sel)?[ticketNode()]:[]):[],onClose:close,instant:!narrow});
 var ss=document.getElementById("deep-sort");if(ss&&ss.value!==st.sort)ss.value=st.sort}
function reveal(){if(!window.Motion)return;
 Motion.reveal(".cols2 > .panel-c, .kpi.top > div, .cols2 .stack > .notice, .cols2 .stack > .panel-c, .list-sec > .head",{onIn:Motion.dataIn});
 /* table rows: only the ones visible in the scroll box stagger in; the rest are simply there */
 Motion.reveal([].slice.call(ui.tbody.children,0,14),{rise:8,onIn:Motion.dataIn})}

/* ---------- the ticket: trade the selected proposal's score ----------
   The score runs 0 to 10. A long share costs score/10 and pays $1.00 at 10; a short share costs 1 minus that and pays $1.00 at 0.
   The ticket is one node, inline in the side panel on desktop and in the sheet on tablet and phone. It redraws itself on its own
   (typing, side, wallet, flow step), so the table and the dot field are never touched. */
var tside="Long",tamt=50,flow=W.flow({box:function(){return document.querySelector('[data-tx="deep"]')},onChange:function(){drawTicket()}});
function tradable(d){return det.id!==d.id||det.state==="ok"}
function tprice(d){return tside==="Long"?d.s/10:1-d.s/10}
function focusPlace(){var b=document.querySelector('[data-tx="deep"] [data-tx-place]');if(b)b.focus()}
function place(){var d=st.sel,p=tprice(d),a=tamt,s=a/p,sd=tside,name="#"+d.id+" "+d.name;
 flow.place(a,function(){return{amount:a,meta:{type:"Trade",market:"Grant round",mid:d.id,product:"deep",outcome:name,side:sd,shares:s,price:p,status:"Open"},
  rows:[["Proposal",name,"tx-q"],["Side",sd],["Amount",W.money(a)+" USDC","tx-tot"],["Price per share","$"+p.toFixed(2)],["Shares",U.shares(s)],["Max slippage","1%"],["Minimum shares",U.shares(s*.99)],["Network fee","Free in demo","tx-free"]],
  note:"Pays $1.00 per share at "+(sd==="Long"?"10":"0")+".",
  done:"You bought "+U.shares(s)+" "+sd.toLowerCase()+" shares on the score of proposal #"+d.id+"."}},"deep-amt")}
function ticketKids(){var d=st.sel,p=tprice(d),ks=[h("h3",{class:"wl-sub","data-key":"tk-h",text:"Trade this score"})];
 if(flow.step!=="form"){ks.push(flow.view());return ks}
 var err=W.amountError(tamt,flow.tried),at=W.amountAttrs("deep-amt",err);
 ks.push(h("div",{class:"seg",role:"group","aria-label":"Side"},["Long","Short"].map(function(s){return h("button",{type:"button","aria-pressed":String(tside===s),text:s,onclick:function(){tside=s;drawTicket()}})})));
 W.holdLines(d.id,"deep").forEach(function(n){ks.push(n)});
 var inp=h("input",{class:"field",type:"number",min:"1",value:String(tamt),id:"deep-amt","aria-label":"Amount in USDC","aria-invalid":at["aria-invalid"],"aria-describedby":at["aria-describedby"],
  oninput:function(e){tamt=Number(e.target.value)||0;var n=document.querySelector('[data-tx="deep"] [data-k="shares"]'),t=U.shares(Math.max(0,tamt)/p);
   if(n){if(window.Motion)Motion.num(n,t);else n.textContent=t}W.amountLive(e.target,tamt,flow)}});
 ks.push(h("div",{class:"field-grp"},[W.amountLabel("deep-amt","Amount (USDC)"),inp,W.amountErr("deep-amt",err)]));
 ks.push(h("div",{class:"line"},[h("span",{text:"Price per share"}),h("span",{class:"num","data-k":"price",text:"$"+p.toFixed(2)})]));
 ks.push(h("div",{class:"line"},[h("span",{text:"Shares"}),h("span",{class:"num","data-k":"shares",text:U.shares(Math.max(0,tamt)/p)})]));
 ks.push(h("div",{class:"line"},[h("span",{text:"Pays $1.00 per share at "+(tside==="Long"?"10":"0")})]));
 ks.push(W.placeBtn({onPlace:place}));
 var hn=W.hint({after:focusPlace});if(hn)ks.push(hn);return ks}
function ticketNode(){return h("div",{class:"ticket","data-tx":"deep","data-key":"tk",style:flow.style()},ticketKids())}
function drawTicket(){var box=flow.o.box();if(!box||!st.sel)return;box.style.minHeight=flow.style()?flow.hold+"px":"";U.patch(box,h("div",{},ticketKids()))}

/* ---------- Show 25 more: placeholder rows join the end of the list while the next page loads ---------- */
function moreReset(){moreSlot.cancel();moreErr=null;if(ui.moreBox&&ui.moreBox.isConnected)ui.moreBox.remove();skRows(false);moreBusy(false)}
function moreBusy(on){var m=ui.more;if(!m)return;if(on){m.setAttribute("aria-disabled","true");m.textContent="Loading 25 more"}else{m.removeAttribute("aria-disabled");m.textContent="Show 25 more"}}
function skRows(on){var tb=ui.tbody;[].slice.call(tb.querySelectorAll(":scope > .dm-skr")).forEach(function(r){r.remove()});if(!on)return;
 for(var i=0;i<4;i++)tb.appendChild(skRow(i,1e4+i))}
function skRow(i,order){var S=DM.sk;return h("tr",{class:"dm-skr","aria-hidden":"true",style:"--i:"+i+(order?";order:"+order:"")},[h("td",{class:"num muted c-id"},[S("2ch")]),h("td",{class:"c-n"},[S([62,48,70,56,66,52,74,44,60,58][i%10]+"%")]),
  h("td",{class:"r num c-s"},[S("3ch")]),h("td",{class:"r num muted c-r"},[S("9ch")]),h("td",{class:"c-ag"},[S("80%")]),h("td",{class:"r num c-av"},[S("5ch")]),h("td",{class:"r num c-hv"},[S("5ch")]),h("td",{class:"r num c-ch"},[S("4ch")])])}
function more(){if(ui.more.getAttribute("aria-disabled")==="true")return;var n=st.n+25;
 moreSlot.run({key:"deep:proposals?n="+n,cacheLabel:"Deep proposals, first "+n,producer:function(){return D},scope:"page",busy:ui.sec,label:"Loading 25 more proposals",
  show:function(){skRows(true);moreBusy(true)},
  apply:function(){moreBusy(false);skRows(false);moreErr=null;st.n=n;render()},
  fail:function(e){moreBusy(false);skRows(false);moreErr=e;var f=document.activeElement===ui.more;
   ui.moreBox=DM.errorView(e,{level:"panel",subject:"the next proposals",retry:function(){var b=ui.moreBox;moreErr=null;if(b)b.remove();render();ui.more.focus();more()}});
   ui.sec.appendChild(ui.moreBox);render();if(f)DM.focusHead(ui.moreBox)}})}

/* ---------- the page's first load: skeleton (dot field, tiles, filter bar, rows), then the page; or one page-level state ---------- */
var rootEl=document.getElementById("root"),pageEl=rootEl.parentNode,pageBox=h("div",{class:"dm-pagebox",hidden:""});if(DM)pageEl.insertBefore(pageBox,rootEl);
function modal(){return[].some.call(document.querySelectorAll('[aria-modal="true"]'),function(n){return!n.closest("[inert]")})}
function skPage(){var S=DM.sk,B=DM.skBlock,narrow=U.narrow.matches,rows=[];for(var i=0;i<10;i++)rows.push(skRow(i));
 var hr=h("tr",{},COLS.map(function(c){return h("th",{scope:"col",class:c[2]||"",text:c[1]})}));
 return[h("div",{class:"cols2"},[h("div",{class:"panel-c"},[h("h2",{text:"Grant round · 100 proposals"}),B("sk-box","aspect-ratio:1"),h("p",{class:"note",text:"Bigger, brighter dot = higher forecast score."})]),
   h("div",{class:"stack"},[h("div",{class:"kpi top"},["Agent volume","Human volume","Top forecast"].map(function(l){return h("div",{},[h("small",{text:l}),h("b",{class:"num"},[S("5ch")])])})),
    h("div",{class:"notice",text:"Evaluators still score every proposal. The market forecasts their scores; it does not choose winners."}),
    h("div",{class:"panel-c"},[h("h2",{text:"Select a proposal"}),h("p",{class:"note",text:"Pick a dot in the field or a proposal below to see its forecast score, 90% range and who is trading it."})])])]),
  h("section",{class:"stack list-sec"},[h("div",{class:"head"},[h("div",{class:"ctrls"},[B("sk-box","height:var(--ctl);width:240px;max-width:100%;border-radius:999px"),B("sk-box","height:var(--ctl);width:260px;max-width:100%;border-radius:999px")]),h("span",{class:"muted"},[S("14ch")])]),meta(),
   narrow?h("div",{class:"sortbar narrow-only"},[h("label",{text:"Sort by"}),B("sk-box","height:var(--ctl);flex:1 1 auto;max-width:320px;border-radius:999px"),B("sk-box","height:var(--ctl);width:120px;border-radius:var(--r-chip)")]):null,
   h("div",{class:"tbl tall rtbl deep-tbl"},[h("table",{},[h("thead",{},[hr]),h("tbody",{},rows)])])])]}
function load(o){o=o||{};selSlot.cancel();moreSlot.cancel();moreErr=null;
 pageSlot.run({key:"deep:proposals",producer:function(){return D},scope:"page",force:o.force,initial:true,busy:pageEl,label:"Loading proposals",
  show:function(){pageState="loading";rootEl.hidden=false;pageBox.hidden=true;U.sheet({open:false,onClose:close,instant:true});DM.skel(rootEl,skPage())},
  apply:function(res,info){
   if(res.empty||!res.data.length){pageState="empty";rootEl.hidden=true;pageBox.hidden=false;U.clear(rootEl);
    DM.renderEmpty(pageBox,{level:"page",title:"No proposals yet",text:"This grant round has no proposals to forecast yet. They appear here as soon as the round opens.",
     action:{text:"Check again",onclick:function(){DM.holdFocus(pageEl);load({retried:true})}},secondary:{text:"Open the explorer",href:"app.html"},focus:o.retried&&!modal()});return}
   var was=pageState;pageState="ok";rootEl.hidden=false;pageBox.hidden=true;U.clear(pageBox);
   if(info.shown)DM.crossOut(rootEl);else if(o.replay)U.clear(rootEl);
   if(was!=="ok"||o.replay){dotEls=[];rowEls=new Map();ui={};st.n=25;st.sel=null}
   frame();reveal();if(o.retried&&!modal())DM.focusFirst(rootEl)},
  fail:function(e){pageState="error";rootEl.hidden=true;pageBox.hidden=false;U.clear(rootEl);U.sheet({open:false,onClose:close,instant:true});
   DM.renderError(pageBox,e,{level:"page",subject:"the proposals",retry:function(){DM.holdFocus(pageEl);load({retried:true})},back:{text:"Back to home",href:"index.html"},focus:!modal()});
   if(e.kind==="network")DM.onOnline(function(){if(pageState==="error")load()})}})}
U.narrow.addEventListener("change",function(){if(pageState==="ok")render()});
W.subscribe(function(){if(pageState==="ok")drawTicket()});
if(DM){DM.page({name:"deep",replay:function(o){load({force:o.force,replay:true})}});load()}
else{frame()}
U.slashSearch('.list-sec input[type="search"]');
if(window.Motion){Motion.ready();if(!DM)reveal()}
})();
