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
function draw(){var target=document.getElementById("root"),root=h("div");
 var sel=S.filter(function(s){return s.r==="Selected"}).length,dv=S.filter(differs).length;
 var l=S.filter(function(s){return(st.f==="all"||s.r===st.f)&&(!st.div||differs(s))}).sort(function(a,b){return st.sort==="p"?b.p-a.p:a.n.localeCompare(b.n)});
 root.appendChild(h("div",{class:"kpi top",style:"margin-bottom:16px"},[["Submissions",String(S.length)],["Slots available",String(slots)],["Chosen by reviewers",sel+" of "+slots],["Where reviewers differ from the market",String(dv)]].map(function(k){return h("div",{},[h("small",{text:k[0]}),h("b",{class:"num",text:k[1]})])})));
 root.appendChild(h("div",{class:"notice",style:"margin-bottom:16px",text:"The market signal is a forecast of what reviewers will do. It is shown beside their decision and never replaces it."}));
 root.appendChild(h("div",{class:"head",style:"margin:0 0 12px"},[
  h("div",{style:"display:flex;gap:10px;flex-wrap:wrap;align-items:center"},[h("div",{class:"seg",role:"group","aria-label":"Reviewer status"},["all","Selected","In review","Pending","Not selected"].map(function(f){return h("button",{type:"button","aria-pressed":String(st.f===f),text:f==="all"?"All":f,onclick:function(){st.f=f;draw()}})})),
   h("label",{style:"display:flex;gap:8px;align-items:center;color:var(--text-2);min-height:44px;cursor:pointer"},[h("input",{type:"checkbox",checked:st.div?"checked":null,onchange:function(e){st.div=e.target.checked;draw()}}),"Only where they differ"])]),
  h("select",{class:"field","aria-label":"Sort",onchange:function(e){st.sort=e.target.value;draw()}},[h("option",{value:"p",text:"Sort: market signal",selected:st.sort==="p"?"selected":null}),h("option",{value:"n",text:"Sort: name",selected:st.sort==="n"?"selected":null})])]));
 function pick(s){st.sel=s;draw();var t=document.querySelector(".opp-side");if(t&&window.innerWidth<=960&&t.scrollIntoView)t.scrollIntoView({block:"nearest",behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"})}
 var body=h("tbody");l.forEach(function(s){body.appendChild(h("tr",{tabindex:"0","data-key":"s"+s.id,class:st.sel===s?"is-sel":null,"aria-current":st.sel===s?"true":null,onclick:function(){pick(s)},onkeydown:function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(s);var r=document.querySelector("tr.is-sel");if(r)r.focus({preventScroll:true})}}},[
  h("td",{class:"w c-n"},[h("b",{style:"font-weight:500",text:s.n}),h("div",{class:"note",text:s.t})]),
  h("td",{class:"c-s"},[h("span",{class:"sigbar","aria-label":"Market signal "+Math.round(s.p*100)+"% chance of selection"},[h("span",{class:"trk","aria-hidden":"true"},[h("i",{style:"width:"+Math.round(s.p*100)+"%"})]),h("span",{class:"num",text:Math.round(s.p*100)+"%"})])]),
  h("td",{class:"r num c-v",text:U.money(s.v)}),h("td",{class:"c-d"},[badge(s.r)]),
  h("td",{class:"c-f"},[differs(s)?h("span",{class:"neg",text:"\u25C6 Reviewers differ"}):h("span",{class:"muted",text:"Consistent"})])]))});
 var tbl=h("div",{class:"tbl opp"},[h("table",{},[h("thead",{},[h("tr",{},[["Submission",""],["Market signal: chance of selection",""],["Volume","r"],["Reviewer decision",""],["Signal vs decision",""]].map(function(c){return h("th",{scope:"col",class:c[1],text:c[0]})}))]),body])]);
 var side=h("div",{class:"panel-c ticket opp-side"});
 if(st.sel){var s=st.sel,p=st.side==="Yes"?s.p:1-s.p,open=s.r==="In review"||s.r==="Pending";
  side.appendChild(h("h2",{text:s.n}));side.appendChild(h("div",{class:"line"},[h("span",{class:"muted",text:"Reviewer decision"}),badge(s.r)]));
  if(!open)side.appendChild(h("p",{class:"note",text:"Reviewers have decided. This market is settled by their decision."}));
  else{side.appendChild(h("div",{class:"seg",role:"group","aria-label":"Side"},["Yes","No"].map(function(x){return h("button",{type:"button","aria-pressed":String(st.side===x),text:"Will "+(x==="Yes"?"":"not ")+"be selected",onclick:function(){st.side=x;draw()}})})));
   var inp=h("input",{class:"field",id:"amt",type:"number",min:"1",value:String(st.amt),oninput:function(e){st.amt=Math.max(0,+e.target.value||0);var o=document.getElementById("opp-out"),v="$"+(st.amt/Math.min(.99,Math.max(.01,p))).toFixed(2);if(window.Motion)Motion.num(o,v);else o.textContent=v}}),out=h("b",{class:"num",id:"opp-out",text:"$"+(st.amt/Math.min(.99,Math.max(.01,p))).toFixed(2)});
   side.appendChild(h("div",{class:"line"},[h("span",{text:"Price"}),h("b",{class:"num",text:"$"+p.toFixed(2)})]));side.appendChild(h("label",{for:"amt",text:"Amount (USDC)"}));side.appendChild(inp);side.appendChild(h("div",{class:"line"},[h("span",{text:"Payout if reviewers agree"}),out]));
   side.appendChild(h("button",{class:"btn lg",type:"button",text:"Connect wallet to trade"}));}
  side.appendChild(h("p",{class:"note",text:"Demo only."}))}
 else{side.appendChild(h("h2",{text:"Select a submission"}));side.appendChild(h("p",{class:"note",text:"See its market signal and, while reviewers are still deciding, forecast the outcome."}))}
 root.appendChild(h("div",{class:"cols rev"},[h("div",{style:"min-width:0"},[h("p",{class:"tbl-hint opp-hint",text:"Tap a submission to see its signal and trade"}),tbl]),side]));
 U.patch(target,root,{flip:"tbody tr"})}
draw();
if(window.Motion){Motion.ready();Motion.reveal("#root > .kpi > div, #root > .notice, #root > .head, .opp-side",{onIn:Motion.dataIn});Motion.reveal(".opp tbody tr",{rise:8,onIn:Motion.dataIn})}
})();
