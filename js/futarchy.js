(function(){
SeerShell.mount({product:"futarchy",cta:"Connect wallet"});
var h=U.h,P=[
 {id:14,t:"Fund a liquidity programme",dao:"Example DAO",metric:"Token price in 90 days",unit:"$",dec:2,pass:1.24,fail:1.09,better:"higher",vote:{f:62,a:38,end:"3 days"},vol:182e3},
 {id:15,t:"Raise protocol fee to 0.30%",dao:"Example DAO",metric:"Protocol revenue, next 30 days",unit:"$K",dec:0,pass:412,fail:388,better:"higher",vote:{f:48,a:52,end:"5 days"},vol:96e3},
 {id:16,t:"Hire a dedicated security lead",dao:"Example DAO",metric:"Critical audit findings in 6 months",unit:"",dec:1,pass:2.1,fail:3.4,better:"lower",vote:{f:81,a:19,end:"1 day"},vol:41e3},
 {id:17,t:"Diversify 20% of treasury into stables",dao:"Example DAO",metric:"Treasury value in 180 days",unit:"$M",dec:1,pass:18.2,fail:18.9,better:"higher",vote:{f:57,a:43,end:"4 days"},vol:128e3}];
/* sel and range are what the person picked; view is what the detail shows (the last proposal and range that loaded) */
var sel=P[0],range=60,view={p:P[0],range:60},branch="pass",amt=100,W=window.SeerWallet;
/* loads go through js/demo.js (delay, errors, offline, cache); without it they resolve at once, as before */
var DM=window.SeerDemo;
function slot(){return DM?DM.slot():{run:function(o){o.apply({data:o.producer(),fromCache:false,empty:false},{sync:true,shown:false})},cancel:function(){}}}
var pageSlot=slot(),detSlot=slot(),chartSlot=slot(),pageState="ok",det={state:"ok",err:null},cst={state:"ok",err:null};
var flow=W.flow({box:function(){return document.querySelector('[data-tx="fut"]')},onChange:function(){detail()}});
function focusPlace(){var b=document.querySelector('[data-tx="fut"] [data-tx-place]');if(b)b.focus()}
/* an illustrative price for the long side of a branch: where its forecast sits in a range around both forecasts */
function bprice(p,b){var lo=Math.min(p.pass,p.fail)*.75,hi=Math.max(p.pass,p.fail)*1.25,v=b==="pass"?p.pass:p.fail;return Math.round(Math.min(.95,Math.max(.05,(v-lo)/(hi-lo)))*100)/100}
function place(){var p=view.p,b=branch,a=amt,pr=b==="pass"?p.pass:p.fail,px=bprice(p,b),sh=a/px,name="#"+p.id+" "+p.t;
 flow.place(a,function(){return{amount:a,meta:{type:"Trade",market:name},
  rows:[["Market",name,"tx-q"],["Branch",b==="pass"?"If it passes":"If it fails"],["Forecast",fmt(p,pr)],["Amount",W.money(a)+" USDC","tx-tot"],
   ["Price per share","$"+px.toFixed(2)],["Shares",U.shares(sh)],["Payout if correct","$"+U.num(sh,2)],["Network fee","Free in demo","tx-free"]],
  note:"If the other branch happens, this trade is refunded.",
  done:"You bought "+U.shares(sh)+" shares in the "+(b==="pass"?"pass":"fail")+" branch of proposal #"+p.id+"."}},"amt")}
function fmt(p,v){if(p.unit==="$"&&Math.abs(v)>=1e3)return U.money(v);var n=U.num(v,p.dec),neg=n.charAt(0)==="\u2212";if(neg)n=n.slice(1);
 return(neg?"\u2212":"")+(p.unit==="$"?"$":"")+n+(p.unit&&p.unit!=="$"?" "+p.unit.replace("$",""):"")}
function series(p,key,n){var r=U.rng(p.id*7+(key==="pass"?1:2)),end=p[key],start=(p.pass+p.fail)/2,v=start,out=[];
 for(var i=0;i<n;i++){v+=(r()-.5)*Math.abs(end-start)*.9+(end-v)*(.05+i/n*.08);out.push(v)}out[n-1]=end;return out}
function chartH(cw){return Math.max(280,Math.round(cw))<520?200:240}
function chart(p,cw,range){
 /* Drawn at the container's pixel width so labels stay 11px at every size. */
 var W=Math.max(280,Math.round(cw)),H=chartH(cw),L=44,B=24,T=12,R=12,a=series(p,"pass",range),b=series(p,"fail",range),all=a.concat(b),mn=Math.min.apply(null,all),mx=Math.max.apply(null,all),pad=(mx-mn)*.15||1;mn-=pad;mx+=pad;
 var X=function(i){return L+i/(range-1)*(W-L-R)},Y=function(v){return T+(1-(v-mn)/(mx-mn))*(H-T-B)};
 /* data-y and data-fmt let js/motion.js add a pointer readout: value range, plot top and bottom, plot left and right, and the number format */
 var s=U.svg("svg",{class:"chart",viewBox:"0 0 "+W+" "+H,width:W,height:H,role:"img","aria-label":"Forecast of "+p.metric+" if the proposal passes ("+fmt(p,p.pass)+") versus if it fails ("+fmt(p,p.fail)+")",
  "data-y":[mn,mx,T,H-B,L,W-R].map(function(v){return+v.toFixed(2)}).join(" "),"data-fmt":(p.unit==="$"?"$":"")+"|"+p.dec+"|"+(p.unit&&p.unit!=="$"?" "+p.unit.replace("$",""):"")});
 for(var g=0;g<5;g++){var gy=T+g*(H-T-B)/4,gv=mx-g*(mx-mn)/4;s.appendChild(U.svg("line",{x1:L,x2:W-R,y1:gy,y2:gy,stroke:"var(--line)"}));var t=U.svg("text",{x:L-8,y:gy+4,"text-anchor":"end","font-size":"11",fill:"var(--muted)",class:"num"});t.textContent=gv.toFixed(p.dec);s.appendChild(t)}
 var lab=[["Start",0],["Now",range-1]];lab.forEach(function(l,k){var tx=U.svg("text",{x:X(l[1]),y:H-6,"text-anchor":k?"end":"start","font-size":"11",fill:"var(--muted)"});tx.textContent=l[0];s.appendChild(tx)});
 function path(arr,col,dash){var d=arr.map(function(v,i){return(i?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1)}).join(" ");s.appendChild(U.svg("path",{class:"m-line","data-tween":"d",d:d,fill:"none",stroke:col,"stroke-width":"2.5","stroke-dasharray":dash||"","stroke-linejoin":"round"}))}
 path(a,"var(--pos)");path(b,"var(--neg)","7 5");
 s.appendChild(U.svg("circle",{class:"m-end","data-tween":"cx cy",cx:X(range-1),cy:Y(a[range-1]),r:5,fill:"var(--pos)"}));
 s.appendChild(U.svg("rect",{class:"m-end","data-tween":"x y",x:X(range-1)-5,y:Y(b[range-1])-5,width:10,height:10,fill:"var(--neg)"}));
 return s}
function delta(p){var d=(p.pass-p.fail)/p.fail*100,good=(p.better==="higher")===(d>0);
 return{pct:d,good:good,arrow:d>0?"▲ ":"▼ ",text:(d>0?"+":"")+d.toFixed(1)+"% under pass",
  lead:(good?"Better":"Worse")+" for the DAO's goal if it passes.",
  msg:" The market expects "+p.metric.toLowerCase()+" to be "+(d>0?"higher":"lower")+" under pass, and the DAO wants it "+p.better+"."}}

/* ---------- skeletons: the list and the detail in their own layout, values as placeholders ---------- */
function skList(){var S=DM.sk;return[h("div",{class:"muted list-label"},[S("16ch")])].concat([[86,62],[70,74],[92,58],[78,66]].map(function(w,i){
 return h("div",{class:"pick",style:"--sk-d:"+i*90+"ms"},[h("b",{},[S(w[0]+"%")]),h("span",{class:"muted"},[S(w[1]+"%")]),h("div",{class:"line"},[h("span",{class:"muted"},[S("16ch")]),h("span",{class:"muted"},[S("9ch")])])])}))}
function skDetail(){var S=DM.sk,B=DM.skBlock;
 return[h("div",{class:"dhead"},[B("sk-box","width:220px;height:20px;border-radius:4px"),h("h2",{},[S("56%")])]),
  h("div",{class:"two"},[h("div",{class:"panel-c"},[h("h2",{text:"The market's forecast"}),h("div",{class:"fork-metric"},[S("18ch")]),B("sk-box","height:40px;opacity:.5"),
    h("div",{class:"fork-legs"},["If it passes","If it fails"].map(function(l,i){return h("div",{class:"leg"},[h("small",{},[h("i",{class:"mk "+(i?"fail":"pass")}),l]),h("b",{class:"num"},[S("4ch")])])})),
    h("div",{class:"fork-meta"},[h("div",{},[h("span",{text:"Change under pass"}),S("5ch")]),h("div",{},[h("span",{text:"Market volume"}),S("5ch")])])]),
   h("div",{class:"panel-c"},[h("h2",{text:"The DAO's decision"}),h("div",{class:"line"},[h("span",{text:"Voting open"}),h("span",{class:"muted"},[S("9ch")])]),
    h("div",{class:"votes"},["For","Against"].map(function(v){return h("div",{},[h("div",{class:"line"},[h("span",{text:v}),S("3ch")]),h("div",{class:"vote-bar"})])})),
    h("p",{class:"note",text:"Token holders decide. The vote is binding; the forecast is not."})])]),
  h("div",{class:"panel-c chart-panel"},[h("div",{class:"line"},[h("h2",{text:"Forecast history"}),B("sk-box","width:220px;height:var(--ctl);border-radius:999px")]),
   h("div",{class:"legend"},[h("span",{},[h("i",{class:"sw",style:"border-color:var(--pos)"}),"If it passes"]),h("span",{},[h("i",{class:"sw",style:"border-color:var(--neg);border-top-style:dashed"}),"If it fails"])]),
   B("sk-box","height:"+chartH(chartW())+"px"),h("div",{class:"notice"},[S("80%")])]),
  h("div",{class:"panel-c ticket fut-tk"},[h("h2",{text:"Trade a branch"}),B("sk-box t-a","height:var(--ctl);width:260px;max-width:100%;border-radius:999px"),h("div",{class:"line t-a"},[S("14ch"),S("5ch")]),
   h("div",{class:"field-grp t-b"},[h("label",{},[S("12ch")]),B("sk-box","height:var(--ctl);border-radius:999px")]),B("sk-box t-b","height:var(--tap)")])]}

function list(){var root=document.getElementById("list"),el=h("div");
 el.appendChild(h("div",{class:"muted list-label",text:"Active proposals · "+P.length}));
 P.forEach(function(p){var d=delta(p);el.appendChild(h("button",{class:"pick",type:"button","data-key":"p"+p.id,"aria-pressed":String(p===sel),onclick:function(){if(sel===p)return;flow.reset();sel=p;list();loadProposal()}},[
  h("b",{text:"#"+p.id+" "+p.t}),h("span",{class:"muted",text:p.metric}),
  h("div",{class:"line"},[h("span",{class:"num "+(d.good?"pos":"neg"),text:d.arrow+d.text+(d.good?" · better":" · worse")}),h("span",{class:"muted num",text:"vote ends in "+p.vote.end})])]))});U.patch(root,el)}
function detail(animate){var p=view.p,d=delta(p),root=document.getElementById("detail"),el=h("div");
 /* a proposal that failed to load: its title (known from the list) and the error, in place of the panels */
 if(det.state==="error"){
  el.appendChild(h("div",{class:"dhead"},[h("span",{class:"badge",text:"Conditional market · Proposal #"+sel.id}),h("h2",{text:sel.t})]));
  el.appendChild(DM.errorView(det.err,{level:"panel",subject:"this proposal",retry:function(){DM.holdFocus(root);loadProposal()},
   back:{text:"Back to the first proposal",onclick:function(){flow.reset();sel=P[0];list();loadProposal()}},titles:{notfound:"This proposal no longer exists"},
   texts:{notfound:"It may have been withdrawn by the DAO. Pick another proposal from the list."}}));
  U.patch(root,el,{animate:animate!==false});return}
 /* Each figure has one home: pass/fail values in the fork, the change under pass in the fork and the list,
    the reading in the notice, the price of a branch in the ticket. */
 var head=h("div",{class:"dhead"},[h("span",{class:"badge",text:"Conditional market · Proposal #"+p.id}),h("h2",{text:p.t})]);
 var fork=U.svg("svg",{class:"fork-lines",viewBox:"0 0 200 40",preserveAspectRatio:"none","aria-hidden":"true"});
 fork.appendChild(U.svg("path",{d:"M100 0V12C100 24 50 22 50 40",stroke:"var(--pos)","vector-effect":"non-scaling-stroke"}));
 fork.appendChild(U.svg("path",{d:"M100 0V12C100 24 150 22 150 40",stroke:"var(--neg)","stroke-dasharray":"5 4","vector-effect":"non-scaling-stroke"}));
 var sig=h("div",{class:"panel-c"},[h("h2",{text:"The market's forecast"}),
   h("div",{class:"fork-metric",text:p.metric}),fork,
   h("div",{class:"fork-legs"},[h("div",{class:"leg"},[h("small",{},[h("i",{class:"mk pass"}),"If it passes"]),h("b",{class:"num",text:fmt(p,p.pass)})]),
     h("div",{class:"leg"},[h("small",{},[h("i",{class:"mk fail"}),"If it fails"]),h("b",{class:"num",text:fmt(p,p.fail)})])]),
   h("div",{class:"fork-meta"},[h("div",{},[h("span",{text:"Change under pass"}),h("span",{class:"num "+(d.good?"pos":"neg"),text:d.arrow+(d.pct>0?"+":"")+d.pct.toFixed(1)+"%"})]),h("div",{},[h("span",{text:"Market volume"}),h("span",{class:"num",text:U.money(p.vol)})])])]);
 var dao=h("div",{class:"panel-c"},[h("h2",{text:"The DAO's decision"}),h("div",{class:"line"},[h("span",{text:"Voting open"}),h("span",{class:"muted num",text:"ends in "+p.vote.end})]),
   h("div",{class:"votes"},[["For",p.vote.f],["Against",p.vote.a]].map(function(v){return h("div",{},[h("div",{class:"line"},[h("span",{text:v[0]}),h("span",{class:"num",text:v[1]+"%"})]),h("div",{class:"vote-bar"},[h("i",{"data-tween":"bar",style:"width:"+v[1]+"%"})])])})),
   h("p",{class:"note",text:"Token holders decide. The vote is binding; the forecast is not."})]);
 var two=h("div",{class:"two"},[sig,dao]);
 var rg=h("div",{class:"seg",role:"group","aria-label":"Time range"},[["7 days",20],["30 days",40],["All",60]].map(function(r){return h("button",{type:"button","aria-pressed":String(range===r[1]),text:r[0],onclick:function(){if(range===r[1])return;range=r[1];detail(false);loadChart()}})}));
 /* the legend carries line style only; the values sit in the fork above. While a range loads, the chart dims under a
    sweep (its title row stays); if it fails, only this panel says so. */
 var cl=cst.state==="loading",ch=h("div",{class:"panel-c chart-panel"+(cl?" dm-dim":""),"aria-busy":cl?"true":null},[h("div",{class:"line dm-keep"},[h("h2",{text:"Forecast history"}),rg]),
  h("div",{class:"legend"},[h("span",{},[h("i",{class:"sw",style:"border-color:var(--pos)"}),"If it passes"]),h("span",{},[h("i",{class:"sw",style:"border-color:var(--neg);border-top-style:dashed"}),"If it fails"])])]);
 if(cst.state==="error")ch.appendChild(DM.errorView(cst.err,{level:"panel",subject:"the forecast history",retry:function(){DM.holdFocus(document.querySelector("#detail .chart-panel"));loadChart()}}));
 else{ch.appendChild(chart(p,chartW(),view.range));ch.appendChild(h("div",{class:"notice"},[h("b",{class:d.good?"pos":"neg",text:d.lead}),d.msg]))}
 var pr=branch==="pass"?p.pass:p.fail,t=h("div",{class:"panel-c ticket fut-tk","data-tx":"fut",style:flow.style()});
 t.appendChild(h("h2",{text:"Trade a branch"}));
 /* the ticket runs its whole flow in place: form, then review, signature and result (js/wallet.js) */
 if(flow.step!=="form")t.appendChild(flow.view());
 else{var err=W.amountError(amt,flow.tried);
  t.appendChild(h("div",{class:"seg t-a",role:"group","aria-label":"Branch"},[["pass","If it passes"],["fail","If it fails"]].map(function(b){return h("button",{type:"button","aria-pressed":String(branch===b[0]),text:b[1],onclick:function(){branch=b[0];detail()}})})));
  t.appendChild(h("div",{class:"line t-a"},[h("span",{text:"Current forecast"}),h("b",{class:"num",text:fmt(p,pr)})]));
  var inp=h("input",Object.assign({class:"field",type:"number",min:"1",value:String(amt),id:"amt",oninput:function(e){amt=+e.target.value||0;W.amountLive(e.target,amt,flow)}},W.amountAttrs("amt",err)));
  t.appendChild(h("div",{class:"field-grp t-b"},[W.amountLabel("amt","Amount (USDC)"),inp,W.amountErr("amt",err)]));
  var pb=W.placeBtn({extra:true,onPlace:place});pb.classList.add("t-b");t.appendChild(pb);
  t.appendChild(W.hint({extra:"If the other branch happens, this trade is refunded.",cls:"t-b",after:focusPlace}))}
 [head,two,ch,t].forEach(function(n){el.appendChild(n)});U.patch(root,el,{animate:animate!==false})}
/* the chart is drawn at its panel's content width so labels stay 11px at every size */
function chartW(){var r=document.getElementById("detail"),cs=getComputedStyle(document.documentElement),pad=parseFloat(cs.getPropertyValue("--pad-panel"))||16;return(r.clientWidth||600)-2*pad}

/* ---------- loading ---------- */
var listEl=document.getElementById("list"),detEl=document.getElementById("detail"),colsEl=document.querySelector("#main .cols"),pageEl=document.querySelector("#main .page");
var pageBox=h("div",{class:"dm-pagebox",hidden:""});if(DM)pageEl.insertBefore(pageBox,colsEl);
function modal(){return[].some.call(document.querySelectorAll('[aria-modal="true"]'),function(n){return!n.closest("[inert]")})}
function reveal(){if(window.Motion){Motion.reveal("#list > *",{rise:8});Motion.reveal("#detail > .dhead, #detail > .panel-c, #detail .two > .panel-c",{onIn:Motion.dataIn})}}
/* the proposals (the page's data): skeleton in the list and the detail, or one page-level error or empty state */
function load(o){o=o||{};detSlot.cancel();chartSlot.cancel();detEl.classList.remove("dm-dim");
 pageSlot.run({key:"fut:proposals",producer:function(){return P},scope:"page",force:o.force,initial:true,busy:pageEl,label:"Loading proposals",
  show:function(){pageState="loading";colsEl.hidden=false;pageBox.hidden=true;DM.skel(listEl,skList());DM.skel(detEl,skDetail())},
  apply:function(res,info){det={state:"ok",err:null};cst={state:"ok",err:null};
   if(res.empty||!res.data.length){pageState="empty";colsEl.hidden=true;pageBox.hidden=false;U.clear(listEl);U.clear(detEl);
    DM.renderEmpty(pageBox,{level:"page",title:"No active proposals",text:"There is nothing to forecast right now. Proposals appear here as soon as a DAO posts one.",
     action:{text:"Check again",onclick:function(){DM.holdFocus(pageEl);load({retried:true})}},secondary:{text:"Open the explorer",href:"app.html"},focus:o.retried&&!modal()});return}
   pageState="ok";colsEl.hidden=false;pageBox.hidden=true;U.clear(pageBox);
   if(!sel||P.indexOf(sel)<0)sel=P[0];view={p:sel,range:range};
   if(info.shown){DM.crossOut(listEl);DM.crossOut(detEl)}else if(o.replay){U.clear(listEl);U.clear(detEl)}
   list();detail();reveal();if(o.retried&&!modal())DM.focusFirst(listEl)},
  fail:function(e){pageState="error";colsEl.hidden=true;pageBox.hidden=false;U.clear(listEl);U.clear(detEl);
   DM.renderError(pageBox,e,{level:"page",subject:"the proposals",retry:function(){DM.holdFocus(pageEl);load({retried:true})},back:{text:"Back to home",href:"index.html"},focus:!modal()});
   if(e.kind==="network")DM.onOnline(function(){if(pageState==="error")load()})}})}
/* switching proposal: the list answers at once; the detail dims under a sweep until the proposal arrives */
function loadProposal(){var p=sel;chartSlot.cancel();cst={state:"ok",err:null};
 detSlot.run({key:"fut:proposal:"+p.id,cacheLabel:"Proposal #"+p.id,producer:function(){return p},scope:"details",busy:detEl,label:"Loading proposal",
  show:function(){detEl.classList.add("dm-dim")},
  apply:function(){detEl.classList.remove("dm-dim");det={state:"ok",err:null};view={p:p,range:range};detail()},
  fail:function(e){detEl.classList.remove("dm-dim");det={state:"error",err:e};detail();if(e.kind==="network")DM.onOnline(function(){if(det.state==="error"&&sel===p)loadProposal()})}})}
/* switching the time range: only the chart panel reloads */
function loadChart(){var p=view.p,r=range;
 chartSlot.run({key:"fut:chart:"+p.id+":"+r,cacheLabel:"Proposal #"+p.id+" history, "+(r===20?"7 days":r===40?"30 days":"all"),producer:function(){return series(p,"pass",r)},scope:"details",label:"Loading forecast history",
  show:function(){cst={state:"loading",err:null};detail(false)},
  apply:function(){cst={state:"ok",err:null};view.range=r;detail()},
  fail:function(e){cst={state:"error",err:e};detail();if(e.kind==="network")DM.onOnline(function(){if(cst.state==="error")loadChart()})}})}
if(DM){DM.page({name:"futarchy",replay:function(o){load({force:o.force,replay:true})}});load()}
else{list();detail()}
W.subscribe(function(){if(pageState==="ok")detail()});
if(window.Motion){Motion.ready();if(!DM)reveal()}
var lw=chartW(),rt;
window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){var w=chartW();if(w!==lw){lw=w;if(pageState==="ok")detail(false)}},150)});
})();
