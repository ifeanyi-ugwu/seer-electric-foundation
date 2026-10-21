(function(){
SeerShell.mount({product:"opportunity",cta:"Connect wallet"});
var h=U.h,S=[
 ["Open-source indexer","Team Lattice",.78,"Selected"],["Dispute-flow redesign","Kestrel Labs",.64,"Selected"],["Mobile wallet SDK","North Pier",.41,"In review"],["Fee-model research","Ostra Collective",.22,"Selected"],
 ["Docs translation programme","Polyglot DAO",.09,"Not selected"],["Onboarding game","Quill Studio",.55,"Not selected"],["Verifier dashboard","Marrow",.47,"In review"],["Bridge monitor","Halden",.36,"In review"],
 ["Education series","Fieldnotes",.18,"Pending"],["Prediction-market curriculum","Atlas School",.29,"Pending"],["Governance explorer","Tern",.52,"Pending"],["Privacy research","Violet Room",.12,"Not selected"],
 ["Public-goods analytics","Basalt",.44,"In review"],["Developer fellowship","Ember",.27,"Pending"],["Local-language outreach","Casa Seer",.15,"Not selected"],["Resolution oracle audit","Sable",.61,"In review"]].map(function(s,i){return{id:i+1,n:s[0],t:s[1],p:s[2],r:s[3],v:Math.round((8+(s[2]*90))*1e3)}});
var slots=6,st={f:"all",sort:"p",div:false,sel:null,side:"Yes",amt:50};
function differs(s){return(s.r==="Selected"&&s.p<.3)||(s.r==="Not selected"&&s.p>=.5)}
var ICON={"Selected":"✓","Not selected":"✕","In review":"…","Pending":"–"};
function badge(s){var c=s==="Selected"?"var(--pos)":s==="Not selected"?"var(--neg)":"var(--text-2)";return h("span",{style:"color:"+c,class:"num",text:ICON[s]+" "+s})}
/* the trade panel for one submission: inline beside the table on desktop, in a sheet on tablet and phone */
function sideKids(s){var p=st.side==="Yes"?s.p:1-s.p,open=s.r==="In review"||s.r==="Pending",k=[];
 k.push(h("div",{class:"line"},[h("span",{class:"muted",text:"Reviewer decision"}),badge(s.r)]));
 if(!open){k.push(h("p",{class:"note",text:"Reviewers have decided. This market is settled by their decision."}));return k}
 if(flow.step!=="form"){k.push(flow.view());return k}
 k.push(h("div",{class:"seg",role:"group","aria-label":"Side"},["Yes","No"].map(function(x){return h("button",{type:"button","aria-pressed":String(st.side===x),text:"Will "+(x==="Yes"?"":"not ")+"be selected",onclick:function(){st.side=x;draw()}})})));
 var pay=function(){return"$"+(st.amt/Math.min(.99,Math.max(.01,p))).toFixed(2)},err=W.amountError(st.amt,flow.tried);
 k.push(h("div",{class:"line"},[h("span",{text:"Price"}),h("b",{class:"num",text:"$"+p.toFixed(2)})]));
 k.push(h("div",{class:"field-grp"},[h("label",{for:"amt",text:"Amount (USDC)"}),
  h("input",Object.assign({class:"field",id:"amt",type:"number",min:"1",value:String(st.amt),oninput:function(e){st.amt=Math.max(0,+e.target.value||0);var o=document.getElementById("opp-out");if(window.Motion)Motion.num(o,pay());else o.textContent=pay();W.amountLive(e.target,st.amt,flow)}},W.amountAttrs("amt",err))),
  W.amountErr("amt",err)]));
 k.push(h("div",{class:"line"},[h("span",{text:"Payout if reviewers agree"}),h("b",{class:"num",id:"opp-out",text:pay()})]));
 k.push(W.placeBtn({onPlace:function(){place(s)}}));
 var hn=W.hint({after:focusPlace});if(hn)k.push(hn);return k}
/* the ticket's flow (js/wallet.js): review, signature and result replace the form inside the same panel or sheet */
var W=window.SeerWallet,flow=W.flow({box:function(){return document.querySelector('[data-tx="opp"]')},onChange:function(){draw()}});
function focusPlace(){var b=document.querySelector('[data-tx="opp"] [data-tx-place]');if(b)b.focus()}
function place(s){var yes=st.side==="Yes",p=Math.min(.99,Math.max(.01,yes?s.p:1-s.p)),a=st.amt,sh=a/p,side="Will "+(yes?"":"not ")+"be selected";
 flow.place(a,function(){return{amount:a,meta:{type:"Trade",market:s.n},
  rows:[["Submission",s.n,"tx-q"],["Side",side],["Amount",W.money(a)+" USDC","tx-tot"],["Price per share","$"+p.toFixed(2)],["Shares",sh.toFixed(1)],
   ["Payout if reviewers agree","$"+sh.toFixed(2)],["Network fee","Free in demo","tx-free"]],
  done:"You bought "+sh.toFixed(1)+" shares on "+s.n+": "+side.toLowerCase()+"."}},"amt")}
function close(){var s=st.sel;st.sel=null;flow.reset();draw();if(s){var r=document.querySelector('tr[data-key="s'+s.id+'"]');if(r)r.focus({preventScroll:true})}}
function draw(){var target=document.getElementById("root"),root=h("div"),narrow=U.narrow.matches;
 var sel=S.filter(function(s){return s.r==="Selected"}).length,dv=S.filter(differs).length;
 var l=S.filter(function(s){return(st.f==="all"||s.r===st.f)&&(!st.div||differs(s))}).sort(function(a,b){return st.sort==="p"?b.p-a.p:a.n.localeCompare(b.n)});
 /* the count of differences is the summary; the flag on each row is the detail; the filter shows only those rows */
 root.appendChild(h("div",{class:"kpi top"},[["Submissions",String(S.length)],["Slots filled",sel+" of "+slots],["Reviewers differ",String(dv)]].map(function(k){return h("div",{},[h("small",{text:k[0]}),h("b",{class:"num",text:k[1]})])})));
 var bar=h("div",{class:"head"},[
  h("div",{class:"ctrls"},[h("div",{class:"seg",role:"group","aria-label":"Reviewer status"},["all","Selected","In review","Pending","Not selected"].map(function(f){return h("button",{type:"button","aria-pressed":String(st.f===f),text:f==="all"?"All":f,onclick:function(){st.f=f;draw()}})})),
   h("label",{class:"check"},[h("input",{type:"checkbox",checked:st.div?"checked":null,onchange:function(e){st.div=e.target.checked;draw()}}),"Only where they differ"])]),
  h("select",{class:"field","aria-label":"Sort",onchange:function(e){st.sort=e.target.value;draw()}},[h("option",{value:"p",text:"Sort: market signal",selected:st.sort==="p"?"selected":null}),h("option",{value:"n",text:"Sort: name",selected:st.sort==="n"?"selected":null})])]);
 function pick(s){if(st.sel!==s)flow.reset();st.sel=s;draw()}
 var body=h("tbody");l.forEach(function(s){var df=differs(s);body.appendChild(h("tr",{tabindex:"0","data-key":"s"+s.id,class:st.sel===s?"is-sel":null,"aria-current":st.sel===s?"true":null,onclick:function(){pick(s)},onkeydown:function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(s);if(!U.narrow.matches){var r=document.querySelector("tr.is-sel");if(r)r.focus({preventScroll:true})}}}},[
  h("td",{class:"w c-n"},[h("b",{text:s.n}),h("div",{class:"note",text:s.t})]),
  h("td",{class:"c-s","data-label":"Market signal"},[h("span",{class:"sigbar","aria-label":"Market signal "+Math.round(s.p*100)+"% chance of selection"},[h("span",{class:"trk","aria-hidden":"true"},[h("i",{style:"width:"+Math.round(s.p*100)+"%"})]),h("span",{class:"num",text:Math.round(s.p*100)+"%"})])]),
  h("td",{class:"r num c-v","data-label":"Volume",text:U.money(s.v)}),
  /* agreement is the normal case and prints nothing; only a difference is flagged, inside the decision cell */
  h("td",{class:"c-d"},[h("span",{class:"dec"},[badge(s.r),df?h("span",{class:"flag",text:"\u25C6 Differs from the market"}):null])])]))});
 var tbl=h("div",{class:"tbl opp rtbl"},[U.roles(h("table",{},[h("thead",{},[h("tr",{},[["Submission",""],["Market signal: chance of selection",""],["Volume","r"],["Reviewer decision",""]].map(function(c){return h("th",{scope:"col",class:c[1],text:c[0]})}))]),body]))]);
 var main=h("div",{class:"stack list-sec"},[bar,h("p",{class:"tap-hint",text:"Select a submission to see its signal and trade"}),tbl]);
 if(narrow)root.appendChild(main);
 else{var side=h("div",Object.assign({class:"panel-c ticket opp-side"},st.sel?{"data-tx":"opp",style:flow.style()}:{}));
  if(st.sel){side.appendChild(h("h2",{text:st.sel.n}));sideKids(st.sel).forEach(function(n){side.appendChild(n)})}
  else{side.appendChild(h("h2",{text:"Select a submission"}));side.appendChild(h("p",{class:"note",text:"See its market signal and, while reviewers are still deciding, forecast the outcome."}))}
  root.appendChild(h("div",{class:"cols rev"},[main,side]))}
 U.patch(target,root,{flip:"tbody tr"});
 U.sheet({open:!!(st.sel&&narrow),label:st.sel?st.sel.n:"",title:st.sel?st.sel.n:"",kids:st.sel&&narrow?[h("div",{class:"panel-c ticket","data-tx":"opp",style:flow.style()},sideKids(st.sel))]:[],onClose:close,instant:!narrow})}
draw();
W.subscribe(function(){draw()});
U.narrow.addEventListener("change",function(){draw()});
if(window.Motion){Motion.ready();Motion.reveal("#root > .kpi > div, .list-sec > .head, .opp-side",{onIn:Motion.dataIn});Motion.reveal(".opp tbody tr",{rise:8,onIn:Motion.dataIn})}
})();
