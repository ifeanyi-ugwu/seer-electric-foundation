(function(){
SeerShell.mount({product:"risk",cta:"Connect wallet"});
var h=U.h,HZ=["30 days","90 days","180 days","12 months"],HS=["30d","90d","180d","12m"],TYPES=[["exploit","Exploit or hack","Hack"],["depeg","Stablecoin depeg","Depeg"],["oracle","Oracle failure","Oracle"]];
var P=[["Protocol A","Lending"],["Protocol B","Lending"],["Protocol C","DEX"],["Protocol D","Bridge"],["Protocol E","Liquid staking"],["Protocol F","Yield vault"],["Protocol G","DEX"],["Protocol H","Bridge"]],
 base={exploit:[.8,1.4,.9,4.2,1.8,3.1,1.2,5.6],depeg:[.5,.9,.3,1.1,2.4,1.6,.4,1.9],oracle:[.7,1.1,.6,.9,.8,1.9,.5,1.4]};
/* the four steps of the scale, with breaks at 2%, 5% and 10% (the classes rs0 to rs3 in css/products.css) */
var STEPS=[["Low","Low under 2%"],["Moderate","Moderate 2 to 5%"],["High","High 5 to 10%"],["Critical","Critical 10% or more"]];
function step(v){return v<2?0:v<5?1:v<10?2:3}
function scale(){return h("div",{class:"legend","data-key":"scale"},STEPS.map(function(x,k){return h("span",{},[h("i",{class:"sw rs"+k,"aria-hidden":"true"}),x[1]])}))}
/* the chance that none of the eight protocols has a loss event at a horizon: the product of (1 minus p) over the protocols */
function none(t,z){var q=1;P.forEach(function(_,i){q*=1-val(t,i,z)/100});return q*100}
var st={type:"exploit",sel:[0,3],sort:0},phone=matchMedia("(max-width:600px)");
/* st.type is the type the person picked; shown is the one whose estimates are on screen (the last that loaded) */
var shown="exploit",tst={state:"ok",err:null};
/* loads go through js/demo.js (delay, errors, offline, cache); without it they resolve at once, as before */
var DM=window.SeerDemo;
function slot(){return DM?DM.slot():{run:function(o){o.apply({data:o.producer(),fromCache:false,empty:false},{sync:true,shown:false})},cancel:function(){}}}
var pageSlot=slot(),typeSlot=slot(),pageState="ok";
/* adding a fourth protocol drops the oldest: the live region says so and the note under the heatmap shows the same text for 3 seconds */
var dropMsg="",dropT=0;
function dropped(i){dropMsg=P[i][0]+" removed from the comparison.";clearTimeout(dropT);dropT=setTimeout(function(){dropMsg="";draw(false)},3000);if(DM)DM.announce(dropMsg)}
/* A heatmap cell opens a sheet with its protocol, horizon and estimate, and a "Buy cover" ticket: Yes pays if the loss event happens, No pays if it does not.
   The ticket runs review, signature and result in place (js/wallet.js). Price per share is the estimate for Yes and one minus it for No. */
var W=window.SeerWallet,cell=null,side="Yes",amt=50,flow=W.flow({box:function(){return document.querySelector('[data-tx="risk"]')},onChange:function(){sheet()}});
/* the trading period, as on Deep's round line: estimates trade until one date and resolve by another (days counted from today) */
function dates(){return h("p",{class:"muted","data-key":"dates"},["Estimates trade until "+U.dayIn(71)+" \u00b7 Resolve by "+U.dayIn(162)])}
function tlabel(t){return TYPES.filter(function(x){return x[0]===t})[0][1]}
function cname(c){return P[c.i][0]+", "+HZ[c.k]}
function cmid(c){return(c.i+1)*100+TYPES.map(function(x){return x[0]}).indexOf(c.t)*10+c.k}
function cpx(c){var e=val(c.t,c.i,c.k)/100;return U.pround(Math.min(.99,Math.max(.01,side==="Yes"?e:1-e)))}
function focusPlace(){var b=document.querySelector('[data-tx="risk"] [data-tx-place]');if(b)b.focus()}
function cplace(){var c=cell,p=cpx(c),a=amt,sh=a/p,sd=side,nm=P[c.i][0]+" \u00b7 "+tlabel(c.t)+" \u00b7 "+HZ[c.k];
 flow.place(a,function(){return{amount:a,meta:{type:"Trade",market:nm,mid:cmid(c),product:"risk",outcome:null,side:sd,shares:sh,price:p,status:"Open"},
  rows:[["Market",nm,"tx-q"],["Side",sd==="Yes"?"Yes (loss event happens)":"No"],["Amount",W.money(a)+" "+U.COLL,"tx-tot"],["Price per share",U.price(p)],["Shares",U.shares(sh)],["Max slippage","0.5%"],["Minimum shares",U.shares(sh*.995)],["Payout if correct","$"+U.num(sh,2)],["Network fee",U.cni("Free in demo")]],
  done:"You bought "+U.shares(sh)+" "+sd+" shares on "+cname(c)+"."}},"amt")}
function ticketKids(c){var p=cpx(c),k=[h("h2",{text:"Buy cover"})];
 if(flow.step!=="form"){k.push(flow.view());return k}
 var err=W.amountError(amt,flow.tried),pay=function(){return"$"+U.num(Math.max(0,amt)/p,2)};
 k.push(h("div",{class:"seg",role:"group","aria-label":"Side"},["Yes","No"].map(function(x){return h("button",{type:"button","aria-pressed":String(side===x),text:x,onclick:function(){side=x;sheet()}})})));
 k.push(h("p",{class:"note",text:side==="Yes"?"Yes pays $1.00 per share if the loss event happens within "+HZ[c.k]+".":"No pays $1.00 per share if it does not."}));
 k.push(h("div",{class:"line"},[h("span",{text:"Price per share"}),h("b",{class:"num",text:U.price(p)})]));
 W.holdLines(cmid(c),"risk").forEach(function(n){k.push(n)});
 k.push(h("div",{class:"field-grp"},[W.amountLabel("amt","Amount ("+U.COLL+")"),
  h("input",Object.assign({class:"field",id:"amt",type:"number",min:"1",value:String(amt),oninput:function(e){amt=+e.target.value||0;var o=document.getElementById("risk-out");if(window.Motion)Motion.num(o,pay());else o.textContent=pay();W.amountLive(e.target,amt,flow)}},W.amountAttrs("amt",err))),W.amountErr("amt",err)]));
 k.push(h("div",{class:"line"},[h("span",{text:"Payout if correct"}),h("b",{class:"num",id:"risk-out",text:pay()})]));
 k.push(W.placeBtn({onPlace:cplace}));var hn=W.hint({after:focusPlace});if(hn)k.push(hn);return k}
function sheet(){var c=cell;
 if(!c){U.sheet({open:false,onClose:closeCell});return}
 U.sheet({open:true,label:cname(c)+", "+tlabel(c.t).toLowerCase(),badge:h("span",{class:"badge",text:tlabel(c.t)}),title:P[c.i][0],onClose:closeCell,
  kids:[h("div",{class:"kpi"},[["Horizon",HZ[c.k]],["Market estimate",val(c.t,c.i,c.k).toFixed(1)+"%"]].map(function(x){return h("div",{},[h("small",{text:x[0]}),h("b",{class:"num",text:x[1]})])})),
   h("div",{class:"panel-c ticket","data-tx":"risk",style:flow.style()},ticketKids(c))]})}
function openCell(i,k,btn){flow.reset();cell={t:shown,i:i,k:k};side="Yes";amt=50;sheet()}
function closeCell(){var c=cell;cell=null;flow.reset();sheet();if(c){var b=document.querySelector('.heat button[data-c="'+c.i+"-"+c.k+'"]');if(b)b.focus({preventScroll:true})}}
/* a reload of the page's data takes the sheet away with the table it came from */
function dropCell(){if(!cell)return;cell=null;flow.reset();U.sheet({open:false,onClose:closeCell,instant:true})}
W.subscribe(function(){if(cell)sheet()});
function val(t,i,z){return +(base[t][i]*[.22,.55,.8,1.15][z]*(1+((i*7+z*3)%5-2)*.04)).toFixed(1)}
function draw(animate){if(pageState!=="ok")return;var target=document.getElementById("root"),root=h("div"),t=shown,all=[],tl=tst.state==="loading",ph=phone.matches,sec=h("section",{class:"stack","aria-label":"Risk by protocol and horizon"});P.forEach(function(_,i){HZ.forEach(function(_,z){all.push(val(t,i,z))})});var mx=Math.max.apply(null,all);
 sec.appendChild(h("div",{class:"head"},[h("div",{class:"seg",role:"group","aria-label":"Risk type"},TYPES.map(function(x){return h("button",{type:"button","aria-pressed":String(st.type===x[0]),onclick:function(){if(st.type===x[0])return;st.type=x[0];draw(false);loadType()}},[h("span",{class:"rlabel",text:x[1]}),h("span",{class:"rlabel-s",text:x[2]})])})),
  h("span",{class:"muted"},["Market-estimated probability of a loss event within each horizon. ",h("a",{class:"wl-link",href:"app.html?m=21",text:"Open in the Seer app"})])]));
 sec.appendChild(dates());
 sec.appendChild(h("div",{class:"kpi top k1","data-key":"none"},[h("div",{},[h("small",{text:"Chance none has a loss event in 12 months"}),h("b",{class:"num",text:U.num(none(t,3),1)+"%"})])]));
 var rows=P.map(function(p,i){return i}).sort(function(a,b){return val(t,b,st.sort)-val(t,a,st.sort)});
 var head=h("tr",{},[h("th",{scope:"col",text:"Protocol"})].concat(HZ.map(function(z,k){return h("th",{scope:"col",class:"r","aria-sort":st.sort===k?"descending":"none"},[h("button",{type:"button",text:z+(st.sort===k?" ↓":""),onclick:function(){st.sort=k;draw()}})])}),[h("th",{scope:"col",class:"r",text:"Compare"})]));
 var body=h("tbody");rows.forEach(function(i){var on=st.sel.indexOf(i)>=0;body.appendChild(h("tr",{"data-key":"p"+i,class:on?"is-cmp":null},[h("td",{class:"c-p"},[h("b",{text:P[i][0]}),h("span",{class:"muted",text:P[i][1]})])].concat(HZ.map(function(z,k){var v=val(t,i,k);return h("td",{class:"r num h rs"+step(v),"data-label":HS[k],style:"--g:"+(v/mx).toFixed(2)},[h("button",{class:"hc",type:"button","data-key":"c"+k,"data-c":i+"-"+k,"aria-label":P[i][0]+", "+HZ[k]+", "+v.toFixed(1)+"%, "+STEPS[step(v)][0]+": buy cover",text:v.toFixed(1)+"%",onclick:function(e){openCell(i,k,e.currentTarget)}})])}),[h("td",{class:"c-c"},[h("button",{class:on?"btn":"btn soft",type:"button","aria-pressed":String(on),"aria-label":(on?"Remove ":"Add ")+P[i][0]+(on?" from":" to")+" comparison",text:on?"Comparing":"Add",onclick:function(){var k=st.sel.indexOf(i);if(k>=0)st.sel.splice(k,1);else{if(st.sel.length>=3)dropped(st.sel.shift());st.sel.push(i)}draw()}})])])))});
 /* phones: the horizon headers are hidden with the card layout, so the same sort state gets a select.
    From 601px the heatmap stays a table: reading down a column is the comparison. */
 if(ph)sec.appendChild(h("div",{class:"sortbar narrow-only","data-key":"sortbar"},[h("label",{for:"risk-sort",text:"Sort by risk at"}),
  h("select",{class:"field",id:"risk-sort",onchange:function(e){st.sort=+e.target.value;draw()}},HZ.map(function(z,k){return h("option",{value:String(k),text:z,selected:st.sort===k?"selected":null})}))]));
 /* a type that failed to load: only the heatmap says so (the chart keeps the type it shows, named in its title) */
 if(tst.state==="error")sec.appendChild(DM.errorView(tst.err,{level:"panel",hl:"h2",subject:"the "+TYPES.filter(function(x){return x[0]===st.type})[0][1].toLowerCase()+" estimates",retry:function(){DM.holdFocus(document.querySelector("#root > section"));loadType()}}));
 else{sec.appendChild(h("div",{class:"tbl heat"+(ph?" rtbl":"")+(tl?" dm-dim":""),"data-key":"heat","aria-busy":tl?"true":null},[U.roles(h("table",{},[h("thead",{},[head]),body]))]));
 sec.appendChild(scale());sec.appendChild(h("p",{class:"note",text:dropMsg||"Compare up to three protocols."}))}
 root.appendChild(sec);
 /* compare chart */
 /* Drawn at the panel's pixel width (no viewBox scaling) so every label stays 11px. */
 var CW=Math.max(240,chartW()),nar=CW<420,H=CW<520?220:260,L=nar?34:44,B=30,T=18,s=U.svg("svg",{class:"chart",viewBox:"0 0 "+CW+" "+H,width:CW,height:H,role:"img","aria-label":"Grouped bars comparing selected protocols across horizons"}),mv=Math.max.apply(null,st.sel.map(function(i){return val(t,i,3)}).concat([1])),FILL=["var(--violet)","var(--violet-text)","var(--text-2)"],PAT=["none","6 3","2 2"];
 for(var g=0;g<4;g++){var gy=T+g*(H-T-B)/3;s.appendChild(U.svg("line",{x1:L,x2:CW-8,y1:gy,y2:gy,stroke:"var(--line)"}));var tx=U.svg("text",{x:L-6,y:gy+4,"text-anchor":"end","font-size":"11",fill:"var(--muted)",class:"num"});tx.textContent=(mv*(1-g/3)).toFixed(1)+"%";s.appendChild(tx)}
 var gw=(CW-L-8)/4;HZ.forEach(function(z,k){var bw=Math.min(40,(gw-(nar?6:16))/Math.max(1,st.sel.length));st.sel.forEach(function(i,j){var v=val(t,i,k),bh=v/mv*(H-T-B),x=L+k*gw+(gw-bw*st.sel.length)/2+j*bw;
  s.appendChild(U.svg("rect",{"data-key":"b"+k+"-"+i,"data-tween":"x y width height",x:x,y:H-B-bh,width:bw-3,height:bh,fill:FILL[j],"fill-opacity":j===2?.6:1,stroke:"var(--bg)","stroke-dasharray":PAT[j]}));
  var v2=U.svg("text",{"data-key":"t"+k+"-"+i,"data-tween":"x y",x:x+(bw-3)/2,y:H-B-bh-4,"text-anchor":"middle","font-size":"11",fill:"var(--text)",class:"num"});v2.textContent=v.toFixed(1);s.appendChild(v2)});
  var lb=U.svg("text",{"data-key":"z"+k,x:L+k*gw+gw/2,y:H-10,"text-anchor":"middle","font-size":"12",fill:"var(--text-2)"});lb.textContent=nar?HS[k]:z;s.appendChild(lb)});
 var leg=h("div",{class:"legend"},st.sel.map(function(i,j){return h("span",{"data-key":"l"+i},[h("i",{style:"width:12px;height:12px;display:inline-block;background:"+FILL[j]+(j===2?";opacity:.6":"")}),P[i][0]])}));
 root.appendChild(h("div",{class:"panel-c chart-panel"+(tl?" dm-dim":""),"aria-busy":tl?"true":null},[h("h2",{class:"dm-keep",text:"Side by side: "+TYPES.filter(function(x){return x[0]===t})[0][1]}),st.sel.length?leg:h("p",{class:"note",text:"Pick protocols above to compare."}),st.sel.length?s:null,
  h("div",{class:"notice",text:"These are market estimates, not guarantees or advice. A market price is one input to a risk decision."})]));
 U.patch(target,root,{flip:".heat tbody tr",animate:animate!==false});
 var ss=document.getElementById("risk-sort");if(ss&&ss.value!==String(st.sort))ss.value=String(st.sort)}
/* the chart is drawn at its panel's content width (no viewBox scaling) so every label stays 11px */
/* the panel padding token is read once per width range (reading a computed style forces a style recalc) */
var padK=null,pad=16;
function chartW(){var w=document.getElementById("root").clientWidth,k=U.narrow.matches+":"+phone.matches;
 if(k!==padK){padK=k;pad=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pad-panel"))||16}return w-2*pad}
function reveal(){if(window.Motion){Motion.reveal("#root .head, #root .kpi > div, #root > .panel-c",{onIn:Motion.dataIn});Motion.reveal(".heat tbody tr",{rise:8,onIn:Motion.dataIn})}}
/* switching the risk type: the seg answers at once; the heatmap and the chart dim under a sweep until the estimates arrive */
function loadType(){var t=st.type;
 typeSlot.run({key:"risk:matrix:"+t,producer:function(){return base[t]},scope:"page",label:"Loading risk estimates",
  show:function(){tst={state:"loading",err:null};draw(false)},
  apply:function(){shown=t;tst={state:"ok",err:null};draw()},
  fail:function(e){tst={state:"error",err:e};draw();if(e.kind==="network")DM.onOnline(function(){if(tst.state==="error"&&st.type===t)loadType()})}})}
/* ---------- the page's first load: type toggle, heatmap rows and the compare chart as placeholders; or one page-level state ---------- */
var rootEl=document.getElementById("root"),pageEl=rootEl.parentNode,pageBox=h("div",{class:"dm-pagebox",hidden:""});if(DM)pageEl.insertBefore(pageBox,rootEl);
function modal(){return[].some.call(document.querySelectorAll('[aria-modal="true"]'),function(n){return!n.closest("[inert]")})}
function skPage(){var SK=DM.sk,B=DM.skBlock,ph=phone.matches,rows=[];
 for(var i=0;i<P.length;i++)rows.push(h("tr",{class:"dm-skr",style:"--i:"+i},[h("td",{class:"c-p"},[h("b",{},[SK("10ch")]),h("span",{class:"muted"},[SK("7ch")])])].concat(
  HZ.map(function(z,k){return h("td",{class:"r num h","data-label":HS[k]},[SK("4ch")])}),[h("td",{class:"c-c"},[B("sk-box","display:inline-block;vertical-align:middle;width:96px;height:var(--ctl-sm);border-radius:var(--r-chip)")])])));
 var hr=h("tr",{},[h("th",{scope:"col",text:"Protocol"})].concat(HZ.map(function(z){return h("th",{scope:"col",class:"r",text:z})}),[h("th",{scope:"col",class:"r",text:"Compare"})]));
 var H=chartW()<520?220:260;
 return[h("section",{class:"stack"},[h("div",{class:"head"},[B("sk-box","height:var(--ctl);width:420px;max-width:100%;border-radius:999px"),h("span",{class:"muted"},[SK("40ch")])]),
   dates(),h("div",{class:"kpi top k1"},[h("div",{},[h("small",{text:"Chance none has a loss event in 12 months"}),h("b",{class:"num"},[SK("4ch")])])]),
   ph?h("div",{class:"sortbar narrow-only"},[h("label",{text:"Sort by risk at"}),B("sk-box","height:var(--ctl);flex:1 1 auto;border-radius:999px")]):null,
   h("div",{class:"tbl heat"+(ph?" rtbl":"")},[h("table",{},[h("thead",{},[hr]),h("tbody",{},rows)])]),
   scale(),h("p",{class:"note",text:"Compare up to three protocols."})]),
  h("div",{class:"panel-c chart-panel"},[h("h2",{},[SK("40%")]),h("div",{class:"legend"},[SK("10ch"),SK("10ch")]),B("sk-box","height:"+H+"px"),
   h("div",{class:"notice",text:"These are market estimates, not guarantees or advice. A market price is one input to a risk decision."})])]}
function load(o){o=o||{};typeSlot.cancel();
 pageSlot.run({key:"risk:matrix:"+st.type,producer:function(){return base[st.type]},scope:"page",force:o.force,initial:true,busy:pageEl,label:"Loading risk estimates",
  show:function(){dropCell();pageState="loading";rootEl.hidden=false;pageBox.hidden=true;DM.skel(rootEl,skPage())},
  apply:function(res,info){tst={state:"ok",err:null};shown=st.type;
   if(res.empty||!res.data||!res.data.length){pageState="empty";rootEl.hidden=true;pageBox.hidden=false;U.clear(rootEl);
    DM.renderEmpty(pageBox,{level:"page",title:"No risk markets yet",text:"No protocol has an open risk market right now. Estimates appear here as soon as one opens.",
     action:{text:"Check again",onclick:function(){DM.holdFocus(pageEl);load({retried:true})}},secondary:{text:"Open the explorer",href:"app.html"},focus:o.retried&&!modal()});return}
   pageState="ok";rootEl.hidden=false;pageBox.hidden=true;U.clear(pageBox);
   if(info.shown)DM.crossOut(rootEl);else if(o.replay)U.clear(rootEl);
   draw();reveal();if(o.retried&&!modal())DM.focusFirst(rootEl)},
  fail:function(e){dropCell();pageState="error";rootEl.hidden=true;pageBox.hidden=false;U.clear(rootEl);
   DM.renderError(pageBox,e,{level:"page",subject:"the risk estimates",retry:function(){DM.holdFocus(pageEl);load({retried:true})},back:{text:"Back to home",href:"index.html"},focus:!modal()});
   if(e.kind==="network")DM.onOnline(function(){if(pageState==="error")load()})}})}
phone.addEventListener("change",function(){draw(false)});
if(DM){DM.page({name:"risk",replay:function(o){load({force:o.force,replay:true})}});load()}
else draw();
if(window.Motion){Motion.ready();if(!DM)reveal()}
var lw=document.getElementById("root").clientWidth,rt;
window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){var w=document.getElementById("root").clientWidth;if(w!==lw){lw=w;draw(false)}},150)});
})();
