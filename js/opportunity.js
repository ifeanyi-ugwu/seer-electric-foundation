(function(){
SeerShell.mount({product:"opportunity",cta:"Connect wallet"});
var h=U.h,S=[
 ["Open-source indexer","Team Lattice",.78,"Selected"],["Dispute-flow redesign","Kestrel Labs",.64,"Selected"],["Mobile wallet SDK","North Pier",.41,"In review"],["Fee-model research","Ostra Collective",.22,"Selected"],
 ["Docs translation programme","Polyglot DAO",.09,"Not selected"],["Onboarding game","Quill Studio",.55,"Not selected"],["Verifier dashboard","Marrow",.47,"In review"],["Bridge monitor","Halden",.36,"In review"],
 ["Education series","Fieldnotes",.18,"Pending"],["Prediction-market curriculum","Atlas School",.29,"Pending"],["Governance explorer","Tern",.52,"Pending"],["Privacy research","Violet Room",.12,"Not selected"],
 ["Public-goods analytics","Basalt",.44,"In review"],["Developer fellowship","Ember",.27,"Pending"],["Local-language outreach","Casa Seer",.15,"Not selected"],["Resolution oracle audit","Sable",.61,"In review"]].map(function(s,i){return{id:i+1,n:s[0],t:s[1],p:s[2],r:s[3],v:Math.round((8+(s[2]*90))*1e3)}});
var slots=6,st={f:"all",sort:"p",div:false,sel:null,side:"Yes",amt:50};
/* loads go through js/demo.js (delay, errors, offline, cache); without it they resolve at once, as before */
var DM=window.SeerDemo;
function slot(){return DM?DM.slot():{run:function(o){o.apply({data:o.producer(),fromCache:false,empty:false},{sync:true,shown:false})},cancel:function(){}}}
var pageSlot=slot(),selSlot=slot(),pageState="ok",det={id:0,state:"ok",err:null};
function differs(s){return(s.r==="Selected"&&s.p<.3)||(s.r==="Not selected"&&s.p>=.5)}
var ICON={"Selected":"✓","Not selected":"✕","In review":"…","Pending":"○"};
function badge(s){var c=s==="Selected"?"var(--pos)":s==="Not selected"?"var(--neg)":"var(--text-2)";return h("span",{style:"color:"+c,class:"num",text:ICON[s]+" "+s})}
/* the trade panel for one submission: inline beside the table on desktop, in a sheet on tablet and phone */
function sideKids(s,inSheet){var p=U.pround(Math.min(.99,Math.max(.01,st.side==="Yes"?s.p:1-s.p))),open=s.r==="In review"||s.r==="Pending",k=[],SK=DM&&DM.sk,B=DM&&DM.skBlock;
 /* the submission's details are loading: its title is already in the bar; the body waits as placeholders */
 if(det.id===s.id&&det.state==="loading")return[h("div",{class:"line"},[h("span",{class:"muted",text:"Reviewer decision"}),SK("10ch")]),B("sk-box","height:var(--ctl);border-radius:999px"),
  h("div",{class:"line"},[h("span",{},[SK("5ch")]),SK("5ch")]),h("div",{class:"field-grp"},[h("label",{},[SK("12ch")]),B("sk-box","height:var(--ctl);border-radius:999px")]),
  h("div",{class:"line"},[SK("22ch"),SK("6ch")]),B("sk-box","height:var(--tap)")];
 if(det.id===s.id&&det.state==="error")return[DM.errorView(det.err,{level:inSheet?"sheet":"panel",subject:"this submission",retry:function(){DM.holdFocus(document.querySelector("#sheet-root .panel")||document.querySelector(".opp-side"));loadSel(s)},
  back:{text:"Back to the list",onclick:close},titles:{notfound:"This submission no longer exists"},texts:{notfound:"It may have been withdrawn. Go back to the list to pick another."}})];
 if(det.id===s.id&&det.state==="empty")return[DM.emptyView({level:inSheet?"sheet":"panel",title:"No signal yet",text:"Nobody has traded this submission yet. Check again in a moment.",action:{text:"Check again",onclick:function(){loadSel(s)}}})];
 k.push(h("div",{class:"line"},[h("span",{class:"muted",text:"Reviewer decision"}),badge(s.r)]));
 if(flow.step!=="form"){k.push(flow.view());return k}
 if(!open){k.push(h("p",{class:"note",text:"Reviewers have decided. This market is settled by their decision."}));
  /* a wallet that holds the side the reviewers' decision matched can redeem it, as on a resolved explorer market */
  var won=s.r==="Selected"?"Will be selected":"Will not be selected";
  W.redeem({flow:flow,market:s.n,mid:s.id,product:"opportunity",quiet:true,after:focusPlace,win:function(x){return x.side===won}}).forEach(function(n){k.push(n)});return k}
 k.push(h("div",{class:"seg",role:"group","aria-label":"Side"},["Yes","No"].map(function(x){return h("button",{type:"button","aria-pressed":String(st.side===x),text:"Will "+(x==="Yes"?"":"not ")+"be selected",onclick:function(){st.side=x;draw()}})})));
 var pay=function(){return"$"+U.num(Math.max(0,st.amt)/p,2)},err=W.amountError(st.amt,flow.tried);
 k.push(h("div",{class:"line"},[h("span",{text:"Price"}),h("b",{class:"num",text:U.price(p)})]));
 W.holdLines(s.id,"opportunity").forEach(function(n){k.push(n)});
 k.push(h("div",{class:"field-grp"},[W.amountLabel("amt","Amount ("+U.COLL+")"),
  h("input",Object.assign({class:"field",id:"amt",type:"number",min:"1",value:String(st.amt),oninput:function(e){st.amt=+e.target.value||0;var o=document.getElementById("opp-out");if(window.Motion)Motion.num(o,pay());else o.textContent=pay();W.amountLive(e.target,st.amt,flow)}},W.amountAttrs("amt",err))),
  W.amountErr("amt",err)]));
 k.push(h("div",{class:"line"},[h("span",{text:"Payout if reviewers agree"}),h("b",{class:"num",id:"opp-out",text:pay()})]));
 k.push(W.placeBtn({onPlace:function(){place(s)}}));
 var hn=W.hint({after:focusPlace});if(hn)k.push(hn);return k}
/* the ticket's flow (js/wallet.js): review, signature and result replace the form inside the same panel or sheet */
var W=window.SeerWallet,flow=W.flow({box:function(){return document.querySelector('[data-tx="opp"]')},onChange:function(){draw()}});
function focusPlace(){var b=document.querySelector('[data-tx="opp"] [data-tx-place]');if(b)b.focus()}
function place(s){var yes=st.side==="Yes",p=U.pround(Math.min(.99,Math.max(.01,yes?s.p:1-s.p))),a=st.amt,sh=a/p,side="Will "+(yes?"":"not ")+"be selected";
 flow.place(a,function(){return{amount:a,meta:{type:"Trade",market:s.n,mid:s.id,product:"opportunity",outcome:null,side:side,shares:sh,price:p,status:"Open"},
  rows:[["Submission",s.n,"tx-q"],["Side",side],["Amount",W.money(a)+" "+U.COLL,"tx-tot"],["Price per share",U.price(p)],["Shares",U.shares(sh)],["Max slippage","0.5%"],["Minimum shares",U.shares(sh*.995)],
   ["Payout if reviewers agree","$"+U.num(sh,2)],["Network fee",U.cni("Free in demo")]],
  done:"You bought "+U.shares(sh)+" shares on "+s.n+": "+side.toLowerCase()+"."}},"amt")}
function close(){var s=st.sel;st.sel=null;selSlot.cancel();flow.reset();draw();if(s){var r=document.querySelector('tr[data-key="s'+s.id+'"]');if(r)r.focus({preventScroll:true})}}
/* the signal bar's 50% tick is explained once, in the hint line */
var HINT="Select a submission to see its signal and trade. The tick marks 50%.";
function draw(){if(pageState!=="ok")return;U.tipClose();var tipped=false,target=document.getElementById("root"),root=h("div"),narrow=U.narrow.matches;
 var sel=S.filter(function(s){return s.r==="Selected"}).length,dv=S.filter(differs).length;
 var l=S.filter(function(s){return(st.f==="all"||s.r===st.f)&&(!st.div||differs(s))}).sort(function(a,b){return st.sort==="p"?b.p-a.p:a.n.localeCompare(b.n)});
 /* the count of differences is the summary; the flag on each row is the detail; the filter shows only those rows */
 root.appendChild(h("div",{class:"kpi top"},[["Submissions",String(S.length)],["Slots filled",sel+" of "+slots],["Reviewers differ",String(dv)]].map(function(k){return h("div",{},[h("small",{text:k[0]}),h("b",{class:"num",text:k[1]})])})));
 var bar=h("div",{class:"head"},[
  h("div",{class:"ctrls"},[h("div",{class:"seg",role:"group","aria-label":"Reviewer status"},["all","Selected","In review","Pending","Not selected"].map(function(f){return h("button",{type:"button","aria-pressed":String(st.f===f),text:f==="all"?"All":f,onclick:function(){st.f=f;draw()}})})),
   h("label",{class:"check"},[h("input",{type:"checkbox",checked:st.div?"checked":null,onchange:function(e){st.div=e.target.checked;draw()}}),"Only where they differ"])]),
  h("select",{class:"field","aria-label":"Sort",onchange:function(e){st.sort=e.target.value;draw()}},[h("option",{value:"p",text:"Sort: market signal",selected:st.sort==="p"?"selected":null}),h("option",{value:"n",text:"Sort: name",selected:st.sort==="n"?"selected":null})])]);
 function pick(s){if(st.sel===s){draw();return}flow.reset();st.sel=s;loadSel(s)}
 var body=h("tbody");l.forEach(function(s){var df=differs(s);body.appendChild(h("tr",{tabindex:"0","data-key":"s"+s.id,class:st.sel===s?"is-sel":null,"aria-current":st.sel===s?"true":null,onclick:function(){pick(s)},onkeydown:function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(s);if(!U.narrow.matches){var r=document.querySelector("tr.is-sel");if(r)r.focus({preventScroll:true})}}}},[
  h("td",{class:"w c-n"},[h("b",{text:s.n}),h("div",{class:"note",text:s.t})]),
  h("td",{class:"c-s","data-label":"Market signal"},[h("span",{class:"sigbar","aria-label":"Market signal "+Math.round(s.p*100)+"% chance of selection"},[h("span",{class:"trk","aria-hidden":"true"},[h("i",{style:"width:"+Math.round(s.p*100)+"%"})]),h("span",{class:"num",text:Math.round(s.p*100)+"%"})])]),
  h("td",{class:"r num c-v","data-label":"Volume",text:U.money(s.v)}),
  /* agreement is the normal case and prints nothing; only a difference is flagged, inside the decision cell */
  h("td",{class:"c-d"},[h("span",{class:"dec"},[badge(s.r),df?h("span",{class:"flag tt-row"},["\u25C6 Differs from the market",tipped?null:(tipped=true,U.tip(U.GLOSS.differs,"What Differs from the market means"))]):null])])]))});
 var tbl=h("div",{class:"tbl opp rtbl"},[U.roles(h("table",{},[h("thead",{},[h("tr",{},[["Submission",""],["Market signal: chance of selection",""],["Volume","r"],["Reviewer decision",""]].map(function(c){return h("th",{scope:"col",class:c[1],text:c[0]})}))]),body]))]);
 var main=h("div",{class:"stack list-sec"},[bar,meta(),h("p",{class:"tap-hint",text:HINT}),tbl]);
 if(narrow)root.appendChild(main);
 else{var sl=st.sel&&det.id===st.sel.id&&det.state==="loading",side=h("div",Object.assign({class:"panel-c ticket opp-side","aria-busy":sl?"true":null},st.sel?{"data-tx":"opp",style:flow.style()}:{}));
  if(st.sel){side.appendChild(h("h2",{text:st.sel.n}));sideKids(st.sel).forEach(function(n){side.appendChild(n)})}
  else{side.appendChild(h("h2",{text:"Select a submission"}));side.appendChild(h("p",{class:"note",text:"See its market signal and, while reviewers are still deciding, forecast the outcome."}))}
  root.appendChild(h("div",{class:"cols rev"},[main,side]))}
 U.patch(target,root,{flip:"tbody tr"});
 U.sheet({open:!!(st.sel&&narrow),label:st.sel?st.sel.n:"",title:st.sel?st.sel.n:"",kids:st.sel&&narrow?[h("div",{class:"panel-c ticket","data-tx":"opp",style:flow.style(),"aria-busy":det.id===st.sel.id&&det.state==="loading"?"true":null},sideKids(st.sel,true))]:[],onClose:close,instant:!narrow})}
/* the round's two dates, counted from today as on the explorer */
function meta(){return h("p",{class:"muted"},["Round closes "+U.dayIn(40)+" \u00b7 Reviewers decide by "+U.dayIn(47)+" \u00b7 ",h("a",{class:"wl-link",href:"app.html?m=20",text:"Open in the Seer app"})])}
function loadSel(s){det={id:s.id,state:"ok",err:null};
 selSlot.run({key:"opp:submission:"+s.id,cacheLabel:"Submission: "+s.n,producer:function(){return s},scope:"details",initial:true,label:"Loading submission",
  show:function(){det={id:s.id,state:"loading",err:null};draw()},
  apply:function(res){det={id:s.id,state:res.empty?"empty":"ok",err:null};draw()},
  fail:function(e){det={id:s.id,state:"error",err:e};draw()}})}
function reveal(){if(window.Motion){Motion.reveal("#root > .kpi > div, .list-sec > .head, .opp-side",{onIn:Motion.dataIn});Motion.reveal(".opp tbody tr",{rise:8,onIn:Motion.dataIn})}}
/* ---------- the page's first load: tiles, filter bar, rows and the side panel as placeholders; or one page-level state ---------- */
var rootEl=document.getElementById("root"),pageEl=rootEl.parentNode,pageBox=h("div",{class:"dm-pagebox",hidden:""});if(DM)pageEl.insertBefore(pageBox,rootEl);
function modal(){return[].some.call(document.querySelectorAll('[aria-modal="true"]'),function(n){return!n.closest("[inert]")})}
function skPage(){var SK=DM.sk,B=DM.skBlock,narrow=U.narrow.matches,rows=[];
 for(var i=0;i<8;i++)rows.push(h("tr",{class:"dm-skr",style:"--i:"+i},[h("td",{class:"w c-n"},[h("b",{},[SK([60,48,70,54,66,44,58,62][i]+"%")]),h("div",{class:"note"},[SK("40%")])]),
  h("td",{class:"c-s"},[h("span",{class:"sigbar"},[B("sk-box","width:120px;height:8px;border-radius:0"),SK("3ch")])]),h("td",{class:"r num c-v"},[SK("5ch")]),h("td",{class:"c-d"},[SK("12ch")])]));
 var tbl=h("div",{class:"tbl opp rtbl"},[h("table",{},[h("thead",{},[h("tr",{},[["Submission",""],["Market signal: chance of selection",""],["Volume","r"],["Reviewer decision",""]].map(function(c){return h("th",{scope:"col",class:c[1],text:c[0]})}))]),h("tbody",{},rows)])]);
 var main=h("div",{class:"stack list-sec"},[h("div",{class:"head"},[h("div",{class:"ctrls"},[B("sk-box","height:var(--ctl);width:430px;max-width:100%;border-radius:999px"),h("span",{class:"check"},[SK("20ch")])]),B("sk-box","height:var(--ctl);width:190px;border-radius:999px")]),
  meta(),h("p",{class:"tap-hint",text:HINT}),tbl]);
 return[h("div",{class:"kpi top"},["Submissions","Slots filled","Reviewers differ"].map(function(l){return h("div",{},[h("small",{text:l}),h("b",{class:"num"},[SK("4ch")])])})),
  narrow?main:h("div",{class:"cols rev"},[main,h("div",{class:"panel-c ticket opp-side"},[h("h2",{text:"Select a submission"}),h("p",{class:"note",text:"See its market signal and, while reviewers are still deciding, forecast the outcome."})])])]}
function load(o){o=o||{};selSlot.cancel();
 pageSlot.run({key:"opp:submissions",producer:function(){return S},scope:"page",force:o.force,initial:true,busy:pageEl,label:"Loading submissions",
  show:function(){pageState="loading";rootEl.hidden=false;pageBox.hidden=true;U.sheet({open:false,onClose:close,instant:true});DM.skel(rootEl,skPage())},
  apply:function(res,info){
   if(res.empty||!res.data.length){pageState="empty";rootEl.hidden=true;pageBox.hidden=false;U.clear(rootEl);
    DM.renderEmpty(pageBox,{level:"page",title:"No submissions yet",text:"Nothing has been submitted to this round yet. Submissions appear here as soon as the round opens.",
     action:{text:"Check again",onclick:function(){DM.holdFocus(pageEl);load({retried:true})}},secondary:{text:"Open the explorer",href:"app.html"},focus:o.retried&&!modal()});return}
   pageState="ok";rootEl.hidden=false;pageBox.hidden=true;U.clear(pageBox);
   if(info.shown)DM.crossOut(rootEl);else if(o.replay)U.clear(rootEl);
   if(o.replay){st.sel=null;flow.reset()}
   draw();reveal();if(o.retried&&!modal())DM.focusFirst(rootEl)},
  fail:function(e){pageState="error";rootEl.hidden=true;pageBox.hidden=false;U.clear(rootEl);U.sheet({open:false,onClose:close,instant:true});
   DM.renderError(pageBox,e,{level:"page",subject:"the submissions",retry:function(){DM.holdFocus(pageEl);load({retried:true})},back:{text:"Back to home",href:"index.html"},focus:!modal()});
   if(e.kind==="network")DM.onOnline(function(){if(pageState==="error")load()})}})}
W.subscribe(function(){draw()});
U.narrow.addEventListener("change",function(){draw()});
if(DM){DM.page({name:"opportunity",replay:function(o){load({force:o.force,replay:true})}});load()}
else draw();
if(window.Motion){Motion.ready();if(!DM)reveal()}
})();
