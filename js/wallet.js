/* Seer demo wallet (window.SeerWallet). One source of truth for the simulated wallet on the five tool pages.
   Nothing here talks to a wallet or a chain: connecting, signing and every balance are simulated, and the connect
   sheet says so once. State lives in sessionStorage (try/catch), so it follows the tab across pages and reloads, and
   it is read synchronously before the header renders: with the page scripts render-blocking, the first paint already
   shows the right control (no flicker).
   API: state (snapshot), subscribe(fn) / onChange(fn) (returns an unsubscribe), connect(kind), disconnect(),
   spend(amount, meta), credit(amount, meta), log(entry), openConnect({from, after}), openAccount(), mount(slot), announce(text),
   money(n), amountError(n, tried), maxBtn(inputId), amountLabel(id, text), flow(options) (the review, sign and result steps of a ticket or form),
   positions(mid, product), holdLines(mid, product), redeem(options) (positions and Redeem for tickets and the wallet sheet), copyText(text, cb, back).
   Needs js/util.js (U.h, U.sheet). js/motion.js is optional (count motion, step entrances). */
(function(){
"use strict";
var doc=document,KEY="seer-wallet",W={},subs=[];
var KINDS={browser:["Browser wallet","An extension in this browser"],mobile:["Mobile wallet","Scan a QR code with your phone"],
  hardware:["Hardware wallet","Connect by USB, then confirm on the device"],email:["Email or social login","Sign in with a one-time code"]};
var ORDER=["browser","mobile","hardware","email"];
var WAIT={browser:["Connecting to Browser wallet","Approve the connection in your browser wallet."],
  mobile:["Scan with your mobile wallet","Waiting for your phone to approve the connection."],
  hardware:["Connecting to Hardware wallet","Unlock the device and confirm on its screen."],
  email:["Signing you in","Waiting for the one-time code."]};
var SIGN={browser:"Approve the request in your browser wallet.",mobile:"Approve the request on your phone.",
  hardware:"Confirm the request on your hardware wallet.",email:"Approve the request in the sign-in window."};

/* ---------- state ---------- */
function rnd(n){var s="",i,a=null;try{a=crypto.getRandomValues(new Uint8Array(n))}catch(e){}
  for(i=0;i<n;i++)s+="0123456789abcdef"[a?a[i]&15:Math.floor(Math.random()*16)];return s}
/* mixed case, like a checksummed address, decided by the address's own digits so it never changes */
function cased(h){return h.split("").map(function(c,i){return/[a-f]/.test(c)&&parseInt(h[(i*7+3)%h.length],16)>7?c.toUpperCase():c}).join("")}
function load(){try{var v=JSON.parse(sessionStorage.getItem(KEY)||"null");return v&&typeof v.addr==="string"?v:null}catch(e){return null}}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
var S=load()||{addr:"0x"+cased(rnd(40)),on:false,kind:null,bal:2480,act:[],pos:[],seeded:false};
/* a wallet saved before positions existed has no pos: it starts empty */
if(!S.act)S.act=[];if(!Array.isArray(S.pos))S.pos=[];
/* Positions: one row per product, market, outcome and side, holding shares, cost and the current price of that side (this demo's prices do not move).
   The first time a wallet connects it also holds 10 shares of the resolved MLB market, so Redeem can be reached without waiting for a market to resolve. */
var SEED={mid:14,product:"app",market:"MLB All-Star Game: winning league",outcome:"American League",side:"",shares:10,cost:6.2,price:1,status:"Resolved"};
function seed(){if(S.seeded)return;S.seeded=true;S.pos.push(Object.assign({},SEED))}
if(S.on)seed();
save();
function money(n){return(Math.round(n*100)/100).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}
function short(a){return a.slice(0,6)+"..."+a.slice(-4)}
function ref(){var r=rnd(64);return{full:"0x"+r,short:"0x"+r.slice(0,8)+"..."+r.slice(-4)}}
function snapshot(){return{connected:!!S.on,kind:S.kind,kindName:S.kind?KINDS[S.kind][0]:null,address:S.addr,short:short(S.addr),balance:S.bal,activity:S.act.slice(),positions:S.on?S.pos.map(function(p){return Object.assign({},p)}):[]}}
function emit(){save();subs.slice().forEach(function(f){f(snapshot())})}
W.subscribe=W.onChange=function(f){subs.push(f);return function(){var i=subs.indexOf(f);if(i>=0)subs.splice(i,1)}};
Object.defineProperty(W,"state",{get:snapshot});
W.money=money;
W.connect=function(kind){S.on=true;S.kind=KINDS[kind]?kind:"browser";seed();paint(true);emit()};
W.disconnect=function(){if(!S.on)return;S.on=false;S.kind=null;paint(false);emit();announce("Wallet disconnected.")};
W.log=function(e){S.act.unshift({type:e.type,market:e.market,amount:e.amount,status:e.status,ref:e.ref||null});if(S.act.length>20)S.act.length=20;save();if(acct())sheet()};
/* spend: takes the amount from the balance and records it; returns the transaction reference, or null */
W.spend=function(amount,meta){meta=meta||{};if(!S.on||!(amount>0)||amount>S.bal+1e-9)return null;var r=ref();
  S.bal=Math.max(0,Math.round((S.bal-amount)*100)/100);
  S.act.unshift({type:meta.type||"Trade",market:meta.market||"",amount:amount,status:"Confirmed",ref:r.short});if(S.act.length>20)S.act.length=20;
  addPos(amount,meta);paintBal(true);if(acct())sheet();emit();return r.short};
/* credit: pays an amount into the balance (a redemption) and records it; the positions it settles are removed. Returns the reference, or null */
W.credit=function(amount,meta){meta=meta||{};if(!S.on||!(amount>0))return null;var r=ref();
  S.bal=Math.round((S.bal+amount)*100)/100;
  S.act.unshift({type:meta.type||"Redeem",market:meta.market||"",amount:amount,status:"Confirmed",ref:r.short,plus:true});if(S.act.length>20)S.act.length=20;
  S.pos=S.pos.filter(function(p){return(meta.redeem||[]).indexOf(pkey(p))<0});
  paintBal(true);if(acct())sheet();emit();return r.short};
/* ---------- positions ---------- */
function pkey(p){return[p.product,p.mid,p.outcome||"",p.side||""].join("|")}
function addPos(amount,m){if(m.mid==null||!(m.shares>0))return;var n={mid:m.mid,product:m.product||"app",market:m.market||"",outcome:m.outcome||null,side:m.side||"",shares:m.shares,cost:amount,price:m.price,status:m.status||"Open"},k=pkey(n),i;
  for(i=0;i<S.pos.length;i++)if(pkey(S.pos[i])===k){var o=S.pos[i];S.pos.splice(i,1);n.shares=Math.round((o.shares+n.shares)*1e6)/1e6;n.cost=Math.round((o.cost+n.cost)*100)/100;break}
  S.pos.unshift(n)}
/* the positions in one market (or every position), while a wallet is connected */
W.positions=function(mid,product){if(!S.on)return[];return S.pos.filter(function(p){return(mid==null||p.mid===mid)&&(!product||p.product===product)}).map(function(p){return Object.assign({},p)})};
W.posKey=pkey;
var PRODUCT={app:"Seer app",futarchy:"Futarchy",deep:"Deep",opportunity:"Opportunity Markets",risk:"Risk"};
/* "21.05 Yes shares on No change": a side that is Yes, No, Up or Down is part of the noun; any other side (a branch, a decision) follows */
/* held shares always show two decimals, so a position reads the same in the ticket, the wallet sheet and the redemption */
function sh2(v){return U.num(v,2)}
function holdText(p){var sd=p.side||"",kind=/^(Yes|No|Up|Down)$/.test(sd),t=sh2(p.shares)+(kind?" "+sd:"")+" shares";
  if(p.outcome)t+=" on "+p.outcome;if(sd&&!kind)t+=", "+sd.charAt(0).toLowerCase()+sd.slice(1);return t}
/* "21.05 Yes · No change": the same position as a row title */
function posTitle(p){var sd=p.side||"",kind=/^(Yes|No|Up|Down)$/.test(sd);return[sh2(p.shares)+(kind?" "+sd:" shares"),p.outcome,kind?null:sd||null].filter(Boolean).join(" \u00b7 ")}
W.holdText=holdText;
/* a ticket's "You hold ..." lines, one per position in the market */
W.holdLines=function(mid,product){return W.positions(mid,product).map(function(p,i){return h("div",{class:"line","data-key":"hold"+i},[h("span",{text:"You hold "+holdText(p)})])})};
/* Redeem, for a resolved market (the explorer) or a decided submission (Opportunity). o: {flow, market, mid, product, win(position), after, quiet}.
   Disconnected: a note whose Connect wallet button checks for winnings once connected. Connected with winning shares: what is held and a
   "Redeem N sDAI" button that runs review, signature and result in the ticket. Otherwise the note that nothing is held (nothing at all if quiet). */
W.redeem=function(o){var done="This market has resolved.",wins;
  if(!S.on)return o.quiet?[]:[h("p",{class:"note"},[done+" ",link("Connect wallet",function(e){W.openConnect({from:e.currentTarget,after:o.after})})," to check for winnings."])];
  wins=W.positions(o.mid,o.product).filter(o.win);
  if(!wins.length)return o.quiet?[]:[h("p",{class:"note",text:done+" You hold no winning shares."})];
  var sh=wins.reduce(function(a,p){return a+p.shares},0),amt=Math.round(sh*100)/100,outs=wins.map(function(p){return p.outcome||p.side}).join(", ");
  return wins.map(function(p,i){return h("div",{class:"line","data-key":"hold"+i},[h("span",{text:"You hold "+holdText(p)})])}).concat([
    h("button",{class:"btn lg",type:"button","data-tx-place":"",text:"Redeem "+money(amt)+" "+U.COLL,onclick:function(){
      o.flow.review({amount:amt,credit:true,t:{review:"Review redemption",done:"Winnings redeemed",doneBtn:"Done"},meta:{type:"Redeem",market:o.market,redeem:wins.map(pkey)},
        rows:[["Market",o.market,"tx-q"],["Outcome",outs,"tx-q"],["Shares",sh2(sh)],["You receive",money(amt)+" "+U.COLL,"tx-tot"]],
        done:"You redeemed "+sh2(sh)+" winning shares for "+money(amt)+" "+U.COLL+"."})}})])};
/* ticket amounts: an empty or zero amount is flagged once the person has tried to place; more than the balance at once */
W.amountError=function(a,tried){if(a<0)return"Enter an amount more than 0.";if(!(a>0))return tried?"Enter an amount more than 0.":"";
  if(S.on&&a>S.bal+1e-9)return"Amount is more than your balance of "+money(S.bal)+" "+U.COLL+".";return""};

/* ---------- live region: one per page, present before anything is announced ---------- */
var live=null;
function liveEl(){if(!live){live=doc.createElement("div");live.className="wl-sr";live.setAttribute("role","status");live.setAttribute("aria-live","polite");doc.body.appendChild(live)}return live}
function announce(t){var l=liveEl();l.textContent="";setTimeout(function(){l.textContent=t},80)}
W.announce=announce;

/* ---------- small builders ---------- */
function h(t,a,k){return U.h(t,a,k)}
function svg(t,a,k){var n=doc.createElementNS("http://www.w3.org/2000/svg",t),x;for(x in a)n.setAttribute(x,a[x]);(k||[]).forEach(function(c){n.appendChild(c)});return n}
var GLYPH={browser:["M2.5 5.5a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5Z","M2.5 7.5h15","M5 5.75h.01M7 5.75h.01"],
  mobile:["M6 4a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 14 4v12a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 6 16Z","M9 14.75h2"],
  hardware:["M3 8a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z","M14 8.75h3v2.5h-3","M6.5 10h.01M9 10h2"],
  email:["M2.5 6a1.5 1.5 0 0 1 1.5-1.5h12A1.5 1.5 0 0 1 17.5 6v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 14Z","M3 5.5l7 5.25L17 5.5"]};
function glyph(k){return svg("svg",{viewBox:"0 0 20 20",width:"20",height:"20",fill:"none",stroke:"currentColor","stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round","aria-hidden":"true",focusable:"false"},
  GLYPH[k].map(function(d){return svg("path",{d:d})}))}
/* success: a cut-corner violet tile, the tick draws in (css/wallet.css); failure: the same tile, outlined, with a cross */
function mark(ok){return svg("svg",{class:"wl-mark "+(ok?"ok":"no"),viewBox:"0 0 48 48",width:"48",height:"48","aria-hidden":"true",focusable:"false"},[
  svg("path",{class:"wl-tile",d:"M1 1H37L47 11V47H1Z"}),
  ok?svg("path",{class:"wl-tick",d:"M14 25l7 7 13-15",pathLength:"1"}):svg("path",{class:"wl-x",d:"M17 17l14 14M31 17L17 31",pathLength:"1"})])}
function dots(){return h("div",{class:"wl-dots","aria-hidden":"true"},[h("i"),h("i"),h("i")])}
/* a QR-like pattern drawn from the address (decorative: nothing can scan it) */
function qr(){var n=25,seed=parseInt(S.addr.slice(2,10),16)||7,d="",x,y;
  function fin(x,y){return x<8&&y<8||x>=n-8&&y<8||x<8&&y>=n-8}
  function rand(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff}
  for(y=0;y<n;y++)for(x=0;x<n;x++){if(fin(x,y))continue;if(rand()<.47)d+="M"+(x+2)+" "+(y+2)+"h1v1h-1z"}
  [[0,0],[n-7,0],[0,n-7]].forEach(function(p){var X=p[0]+2,Y=p[1]+2;d+="M"+X+" "+Y+"h7v7h-7zM"+(X+1)+" "+(Y+1)+"v5h5v-5zM"+(X+2)+" "+(Y+2)+"h3v3h-3z"});
  return h("div",{class:"wl-qr","aria-hidden":"true"},[svg("svg",{viewBox:"0 0 29 29",width:"168",height:"168",focusable:"false","shape-rendering":"crispEdges"},[
    svg("rect",{width:"29",height:"29",fill:"#fff"}),svg("path",{d:d,fill:"#101013","fill-rule":"evenodd"})])])}
function link(text,fn,a){var o={class:"wl-link",type:"button",text:text,onclick:fn};for(var k in a||{})o[k]=a[k];return h("button",o)}

/* ---------- header control: exactly one per page ---------- */
var hdr=null;
W.mount=function(slot){liveEl();var b=doc.createElement("button");b.type="button";b.id="shell-cta";b.setAttribute("aria-haspopup","dialog");
  b.onclick=function(){if(S.on)W.openAccount({from:b});else W.openConnect({from:b})};slot.appendChild(b);hdr=b;paint(false)};
function paint(fresh){var b=hdr;if(!b)return;U.clear(b);
  if(!S.on){b.className="btn btn-pill";b.appendChild(doc.createTextNode("Connect wallet"));return}
  b.className="btn btn-pill wl-pill";
  var bal=h("span",{class:"num","data-wl-bal":"",text:money(S.bal)});
  b.appendChild(h("span",{class:"wl-dot","aria-hidden":"true"}));
  b.appendChild(h("span",{class:"wl-txt"},[h("span",{class:"wl-sr",text:"Wallet "}),h("span",{class:"wl-addr num",text:short(S.addr)})," ",h("span",{class:"wl-bal"},[bal,h("span",{class:"wl-unit",text:" "+U.COLL})])]));
  /* a fresh connection: the pill settles in and the balance counts up */
  if(fresh&&window.Motion){Motion.pop(b);Motion.countUp(bal,{dur:Motion.D.xl})}}
function paintBal(anim){var n=hdr&&hdr.querySelector("[data-wl-bal]");if(!n)return;if(anim&&window.Motion)Motion.num(n,money(S.bal),{dur:Motion.D.l+200});else n.textContent=money(S.bal)}

/* ---------- the wallet sheet (connect, account): above every other sheet ---------- */
var ws=null;
function acct(){return ws&&ws.mode==="account"}
function close(){if(!ws)return;var w=ws;ws=null;clearTimeout(w.t);clearTimeout(w.ct);
  U.sheet({root:"wallet-root",open:false});
  /* focus returns to where the person was, or to what the connection unlocked */
  if(S.on&&w.after){w.after();return}
  /* focus returns once the sheet has finished leaving: doing it at the start of the exit made the browser restyle the pinned header
     (focus ring, backdrop blur) in the middle of the slide and stalled it for a frame. preventScroll: returning focus to a control in
     the pinned header must never move the page (some browsers scroll to reveal it). */
  var back=function(){if(w.from&&w.from.isConnected&&w.from.getClientRects().length)w.from.focus({preventScroll:true});else if(hdr)hdr.focus({preventScroll:true})};
  if(window.Motion&&!Motion.reduced())setTimeout(back,300);else back()}
function focusIn(sel){var r=doc.getElementById("wallet-root"),n=r&&r.querySelector(sel||"[data-wl-focus]");if(n)n.focus({preventScroll:false})}
function sheet(first){if(!ws)return;var kids,title,label,badge=null;
  if(ws.mode==="connect"){title=label="Connect a wallet";kids=[connectStep()]}
  else{title=label="Your wallet";badge=S.kind?h("span",{class:"badge",text:KINDS[S.kind][0]}):null;kids=[accountBody()]}
  U.sheet({root:"wallet-root",cls:"wl-sheet",open:true,label:label,title:title,badge:badge,kids:kids,onClose:close,focus:first?"[data-wl-focus]":null})}
function step(s){ws.step=s;sheet();focusIn()}
function connectStep(){var s=ws.step,k=ws.kind;
  if(s==="list")return h("div",{class:"wl-step","data-key":"wl-list"},[
    h("ul",{class:"wl-opts",role:"list"},ORDER.map(function(id,i){var a={class:"wl-opt",type:"button",onclick:function(){start(id)}};if(i===0)a["data-wl-focus"]="";
      return h("li",{},[h("button",a,[h("span",{class:"wl-ic"},[glyph(id)]),h("span",{class:"wl-opt-t"},[h("b",{text:KINDS[id][0]}),h("span",{class:"note",text:KINDS[id][1]})]),
        svg("svg",{class:"wl-chev",viewBox:"0 0 16 16",width:"16",height:"16",fill:"none",stroke:"currentColor","stroke-width":"1.5","aria-hidden":"true",focusable:"false"},[svg("path",{d:"M6 3.5 10.5 8 6 12.5"})])])])})),
    /* the one statement for the whole wallet flow */
    h("p",{class:"cn",text:"Demo only: no wallet is contacted and no funds move."})]);
  if(s==="wait")return h("div",{class:"wl-step wl-center","data-key":"wl-wait-"+k},[k==="mobile"?qr():dots(),
    h("h3",{class:"wl-h",tabindex:"-1","data-wl-focus":"",text:WAIT[k][0]}),
    h("p",{class:"note",role:"status",text:WAIT[k][1]}),link("Cancel",cancel)]);
  if(s==="fail"){var fe=ws.err,ft=fe?CONN_ERR[fe.offline?"offline":fe.kind]||CONN_ERR.server:null;
    return h("div",{class:"wl-step wl-center","data-key":"wl-fail"+(fe?"-"+fe.kind:"")},[mark(false),
    h("h3",{class:"wl-h",tabindex:"-1",text:ft?ft[0]:"Connection cancelled"}),
    h("p",{class:"note",text:ft?ft[1]:"No wallet was connected. Try again, or choose another way to connect."}),
    h("div",{class:"wl-acts"},[h("button",{class:"btn lg",type:"button","data-wl-focus":"",text:"Try again",onclick:function(){start(k)}}),
      h("button",{class:"btn soft wl-wide",type:"button",text:"Try another wallet",onclick:function(){step("list")}})])])}
  return h("div",{class:"wl-step wl-center","data-key":"wl-done"},[mark(true),
    h("h3",{class:"wl-h",tabindex:"-1","data-wl-focus":"",text:"Wallet connected"}),
    h("p",{class:"note"},[KINDS[k][0]+" ",h("span",{class:"num",text:short(S.addr)})])])}
/* the demo data layer (js/demo.js) can slow the connection down or make it fail (its transactions scope); the steps look the same */
var CONN_ERR={offline:["No network connection","Seer could not reach the network, so no wallet was connected. Try again when you are back online."],
  network:["Connection failed","The network dropped while connecting, so no wallet was connected. Try again."],
  timeout:["Connection timed out","Your wallet did not answer in time, so no wallet was connected. Try again."],
  server:["Connection failed","The connection could not be completed, so no wallet was connected. Try again."],
  notfound:["Wallet not found","That wallet could not be found. Try again, or choose another way to connect."]};
function plan(base){var D=window.SeerDemo;return D&&D.wait?D.wait(base):{ms:base,err:null,check:function(){return null}}}
function start(k){clearTimeout(ws.t);ws.kind=k;ws.err=null;step("wait");var w=plan(k==="mobile"?1800:1200);
  ws.t=setTimeout(function(){if(!ws||ws.step!=="wait")return;var e=w.check();
    if(e){ws.err=e;step("fail");announce((CONN_ERR[e.offline?"offline":e.kind]||CONN_ERR.server)[0]+". No wallet was connected.");return}
    S.on=true;S.kind=k;seed();paint(true);step("done");emit();
    announce("Wallet connected. Balance "+money(S.bal)+" "+U.COLL+".");
    ws.ct=setTimeout(close,950)},w.ms)}
function cancel(){clearTimeout(ws.t);ws.err=null;step("fail");announce("Connection cancelled. No wallet was connected.")}
W.openConnect=function(o){o=o||{};if(S.on){if(o.after)o.after();return}
  if(ws)close();ws={mode:"connect",step:"list",from:o.from||doc.activeElement,after:o.after||null};sheet(true)};

/* Your positions: up to four rows, then Show all; each at its current price, with the market's status word */
function posSection(){var l=W.positions(),n=l.length,all=ws.allPos&&n>4,rows=all?l:l.slice(0,4);
  return h("section",{class:"wl-acts-sec wl-pos","aria-labelledby":"wl-pos-h","data-key":"wl-pos"},[h("h3",{class:"wl-sub",id:"wl-pos-h",text:"Your positions"}),
    n?h("ol",{class:"wl-act"},rows.map(function(p){var res=p.status==="Resolved",lost=res&&!(p.price>0);
      return h("li",{"data-key":"p"+pkey(p)},[
        h("span",{class:"wl-act-t"},[h("b",{class:"num",text:posTitle(p)}),h("span",{class:"wl-st "+(lost?"no":"ok"),text:p.status})]),
        h("span",{class:"num wl-act-a",text:money(p.shares*p.price)+" "+U.COLL}),
        h("span",{class:"wl-act-m"},[h("span",{class:"muted",text:(PRODUCT[p.product]||"Seer")+" \u00b7 "}),p.market])])}))
      :h("p",{class:"note",text:"No positions yet. Trades you place show here."}),
    n>4?h("div",{class:"wl-more","data-key":"wl-more"},[link(all?"Show fewer":"Show all ("+n+")",function(){ws.allPos=!all;sheet()},{"aria-expanded":String(all)})]):null])}
function accountBody(){var a=S.act.slice(0,3);
  return h("div",{class:"wl-step wl-acct","data-key":"wl-acct"},[
    h("div",{class:"wl-box"},[h("small",{text:"Address"}),
      h("div",{class:"wl-addr-row"},[h("code",{class:"num wl-full",text:S.addr}),
        h("button",{class:"btn soft wl-copy",type:"button","data-wl-focus":"","aria-label":ws.copied==="ok"?"Copied":"Copy address",onclick:copy},[ws.copied==="ok"?"Copied":"Copy"])]),
      ws.copied==="fail"?h("p",{class:"note",text:"Copying is blocked here. Select the address and copy it by hand."}):null]),
    h("div",{class:"wl-bal-tile"},[h("small",{text:"Balance"}),h("b",{class:"num",text:money(S.bal)+" "+U.COLL})]),
    posSection(),
    /* Rewards exist in the live product and are outside this concept: the control names that instead of leading nowhere */
    h("div",{class:"wl-rew","data-key":"wl-rew"},[h("b",{text:"Rewards"}),
      link("View rewards",function(e){U.concept("Not part of this concept. In the product this lists trading and liquidity rewards.",e.currentTarget)})]),
    h("section",{class:"wl-acts-sec","aria-labelledby":"wl-act-h"},[h("h3",{class:"wl-sub",id:"wl-act-h",text:"Recent activity"}),
      a.length?h("ol",{class:"wl-act"},a.map(function(x,i){var ok=x.status==="Confirmed";return h("li",{"data-key":"a"+(S.act.length-i)},[
        h("span",{class:"wl-act-t"},[h("b",{text:x.type}),h("span",{class:"wl-st "+(ok?"ok":"no"),text:x.status})]),
        h("span",{class:"wl-act-m",text:x.market}),
        h("span",{class:"num wl-act-a",text:(ok?x.plus?"+":"−":"")+money(x.amount)+" "+U.COLL})])}))
       :h("p",{class:"note",text:"No activity in this session yet. Trades and new markets will show here."})]),
    h("button",{class:"btn soft wl-wide",type:"button",text:"Disconnect",onclick:function(){ws.from=hdr;W.disconnect();close()}})])}
/* copyText: the clipboard API, then a hidden textarea where it is blocked; cb(true|false). Used by the wallet sheet and by W.copyBtn. */
function copyText(text,cb,back){
  var legacy=function(){try{var t=doc.createElement("textarea");t.value=text;t.setAttribute("readonly","");t.style.cssText="position:fixed;left:-9999px;top:0";
    doc.body.appendChild(t);t.select();var ok=doc.execCommand("copy");t.remove();
    if(back&&back.isConnected)back.focus({preventScroll:true});return ok}catch(e){return false}};
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){cb(true)},function(){cb(legacy())});return}}catch(e){}
  cb(legacy())}
function copy(){copyText(S.addr,function(ok){if(!ws)return;ws.copied=ok?"ok":"fail";sheet();if(ok)announce("Address copied.");
  clearTimeout(ws.ct);ws.ct=setTimeout(function(){if(ws&&ws.copied){ws.copied=null;sheet()}},2200)},doc.querySelector("#wallet-root .wl-copy"))}
W.copyText=copyText;
/* the same Copy button outside the wallet sheet (the market address): the label reads "Copied" for a moment */
W.copyBtn=function(text,name){var b=h("button",{class:"btn soft wl-copy",type:"button","aria-label":"Copy "+name,text:"Copy"}),t=0;
  b.onclick=function(){copyText(text,function(ok){clearTimeout(t);b.textContent=ok?"Copied":"Not copied";b.setAttribute("aria-label",ok?"Copied":"Not copied, copying is blocked here");
    if(ok)announce("Copied.");t=setTimeout(function(){b.textContent="Copy";b.setAttribute("aria-label","Copy "+name)},2200)},b)};return b};
W.short=short;
W.openAccount=function(o){o=o||{};if(!S.on){W.openConnect(o);return}if(ws)close();ws={mode:"account",from:o.from||hdr};sheet(true)};

/* ---------- the review, sign and result steps of a ticket or form ----------
   W.flow({box, onChange, onSuccess, onDone, t}) keeps one ticket's step: form, review, sign, rejected or done. The page renders its form
   while step is "form" and f.view() otherwise, inside the same ticket or sheet, so nothing moves to a new surface.
   box() returns the live element of the ticket; its height is held while the flow runs (f.hold), so a short step
   never makes the sheet jump. onChange() re-renders the page. t overrides the copy. */
function Flow(o){this.o=o;this.t=Object.assign({review:"Review trade",confirm:"Confirm",done:"Trade placed",doneBtn:"Done",edit:"Edit trade"},o.t||{});
  this.step="form";this.tried=false;this.hold=0;this.sum=null;this.ref="";this.tm=0;this.dir=1}
Flow.prototype.go=function(s,sel){var b=this.o.box&&this.o.box();
  /* inside a sheet the hold never exceeds what is visible below the pinned bar, so a long form leaves no tall gap */
  if(s==="form")this.hold=0;else if(b){var hh=Math.round(b.getBoundingClientRect().height),pn=b.closest(".panel");
    if(pn&&b.offsetParent===pn)hh=Math.min(hh,pn.clientHeight-b.offsetTop-16);if(hh>this.hold)this.hold=hh}
  this.dir=s==="form"||(s==="review"&&this.step==="rejected")?-1:1;this.step=s;this.o.onChange();
  b=this.o.box&&this.o.box();var n=b&&b.querySelector(sel||"[data-tx-focus]");if(!n)return;n.focus({preventScroll:true});
  /* the whole step comes into view (the review's Confirm too), not just the control that took focus */
  var st=s==="form"?n:b.querySelector(".tx-step")||n,rm=window.Motion&&Motion.reduced();
  try{st.scrollIntoView({block:"nearest",behavior:rm?"auto":"smooth"})}catch(e){st.scrollIntoView(false)}};
Flow.prototype.reset=function(){clearTimeout(this.tm);this.tm=0;this.step="form";this.hold=0;this.tried=false;this.sum=null;this.err=null};
/* place: amount and a summary builder; invalid amounts flag the field and keep focus on it */
Flow.prototype.place=function(amount,sum,field){if(!S.on)return;var e=W.amountError(amount,true);
  if(e){this.tried=true;this.o.onChange();var f=field&&doc.getElementById(field);if(f)f.focus();return}
  this.sum=sum();this.go("review")};
Flow.prototype.review=function(sum){if(!S.on)return;this.sum=sum;this.go("review")};
Flow.prototype.sign=function(){var f=this,w=plan(1000);clearTimeout(f.tm);f.err=null;f.go("sign");
  f.tm=setTimeout(function(){f.tm=0;if(f.step!=="sign")return;var e=w.check();
    /* a failure from the network (js/demo.js, transactions scope): nothing is spent, the attempt is logged */
    if(e){f.err=e;W.log({type:f.sum.meta.type,market:f.sum.meta.market,amount:f.sum.amount,status:"Failed"});f.go("failed");
      announce("Transaction failed. "+txReason(e));return}
    var r=f.sum.credit?W.credit(f.sum.amount,f.sum.meta):W.spend(f.sum.amount,f.sum.meta);
    if(!r){f.go("rejected");return}f.ref=r;if(f.o.onSuccess)f.o.onSuccess(f);f.go("done");announce(f.copy().done+". "+f.sum.done+" Balance "+money(S.bal)+" "+U.COLL+".")},w.ms)};
/* the step copy: a summary may bring its own (a redemption in a ticket that otherwise trades) */
Flow.prototype.copy=function(){return Object.assign({},this.t,(this.sum&&this.sum.t)||{})};
function txReason(e){return({offline:"You are offline, so nothing was sent. Your balance is unchanged.",network:"The network could not be reached, so nothing was sent. Your balance is unchanged.",
  timeout:"The network did not confirm it in time, so nothing was sent. Your balance is unchanged.",server:"The network returned an error, so nothing was sent. Your balance is unchanged.",
  notfound:"This market is no longer available, so nothing was sent. Your balance is unchanged."})[e.offline?"offline":e.kind]||"Nothing was sent. Your balance is unchanged."}
Flow.prototype.reject=function(){clearTimeout(this.tm);this.tm=0;W.log({type:this.sum.meta.type,market:this.sum.meta.market,amount:this.sum.amount,status:"Rejected"});
  this.go("rejected");announce("Transaction rejected. Nothing was sent.")};
Flow.prototype.finish=function(){var d=this.o.onDone;this.tried=false;if(d){d(this);return}
  /* a ticket inside a sheet closes that sheet on Done; an inline ticket goes back to its form */
  var bx=typeof this.o.box==="function"?this.o.box():this.o.box,dlg=bx&&bx.closest&&bx.closest("[role=dialog]"),
      x=dlg&&[].slice.call(dlg.querySelectorAll("button")).filter(function(b){return /^close$/i.test(b.textContent.trim())})[0];
  if(x){x.click();return}
  this.go("form","[data-tx-place]")};
Flow.prototype.style=function(){return this.hold&&this.step!=="form"?"min-height:"+this.hold+"px":null};
Flow.prototype.view=function(){var f=this,s=f.step,t=f.copy(),sum=f.sum||{rows:[]},cls="tx-step"+(f.dir<0?" tx-rev":"");
  if(s==="review")return h("div",{class:cls,"data-key":"tx-review"},[
    h("h3",{class:"tx-h",tabindex:"-1","data-tx-focus":"",text:t.review}),
    h("dl",{class:"tx-sum"},sum.rows.map(function(r){return h("div",{class:"tx-row"+(r[2]?" "+r[2]:"")},[h("dt",{text:r[0]}),h("dd",{},[r[1]])])})),
    sum.note?h("p",{class:"note",text:sum.note}):null,
    h("div",{class:"wl-acts"},[h("button",{class:"btn lg",type:"button",text:t.confirm,onclick:function(){f.sign()}}),
      h("button",{class:"btn soft wl-wide",type:"button",text:"Back",onclick:function(){f.go("form","[data-tx-place]")}})])]);
  if(s==="sign")return h("div",{class:cls+" wl-center","data-key":"tx-sign"},[dots(),
    h("h3",{class:"tx-h",tabindex:"-1","data-tx-focus":"",text:"Waiting for your signature"}),
    h("p",{class:"note",role:"status",text:SIGN[S.kind||"browser"]}),link("Reject",function(){f.reject()})]);
  if(s==="failed")return h("div",{class:cls+" wl-center","data-key":"tx-failed"},[mark(false),
    h("h3",{class:"tx-h",tabindex:"-1",text:"Transaction failed"}),
    h("p",{class:"note",text:txReason(f.err||{})}),
    h("div",{class:"wl-acts"},[h("button",{class:"btn lg",type:"button","data-tx-focus":"",text:"Try again",onclick:function(){f.sign()}}),
      h("button",{class:"btn soft wl-wide",type:"button",text:"Back",onclick:function(){f.go("form","[data-tx-place]")}})])]);
  if(s==="rejected")return h("div",{class:cls+" wl-center","data-key":"tx-rejected"},[mark(false),
    h("h3",{class:"tx-h",tabindex:"-1",text:"Transaction rejected"}),
    h("p",{class:"note",text:"You rejected the request in your wallet. Nothing was sent and your balance is unchanged."}),
    h("div",{class:"wl-acts"},[h("button",{class:"btn lg",type:"button","data-tx-focus":"",text:"Try again",onclick:function(){f.sign()}}),
      h("button",{class:"btn soft wl-wide",type:"button",text:t.edit,onclick:function(){f.go("form","[data-tx-place]")}})])]);
  return h("div",{class:cls+" wl-center","data-key":"tx-done"},[mark(true),
    h("h3",{class:"tx-h",tabindex:"-1",text:t.done}),h("p",{class:"note",text:sum.done||""}),
    h("p",{class:"tx-ref"},[h("span",{class:"muted",text:"Transaction "}),h("code",{class:"num",text:f.ref})]),
    h("div",{class:"wl-acts"},[h("button",{class:"btn lg",type:"button","data-tx-focus":"",text:t.doneBtn,onclick:function(){f.finish()}})])])};
W.flow=function(o){return new Flow(o)};

/* ---------- ticket parts shared by the App, Futarchy and Opportunity tickets ---------- */
/* the amount field's error and its wiring: built into the page's DOM and kept in sync as the person types */
W.amountAttrs=function(id,err){return{"aria-invalid":err?"true":null,"aria-describedby":err?id+"-err":null}};
W.amountErr=function(id,err){return err?h("p",{class:"field-err",id:id+"-err",text:err}):null};
W.amountLive=function(input,amount,flow){if(!input)return;var id=input.id,err=W.amountError(amount,flow&&flow.tried),n=doc.getElementById(id+"-err");
  if(err){input.setAttribute("aria-invalid","true");input.setAttribute("aria-describedby",id+"-err");
    if(!n){n=h("p",{class:"field-err",id:id+"-err"});input.insertAdjacentElement("afterend",n)}if(n.textContent!==err)n.textContent=err}
  else{input.removeAttribute("aria-invalid");input.removeAttribute("aria-describedby");if(n)n.remove()}};
/* Max: shown only while connected; sets the amount field to the balance rounded down to cents and tells the page through its own input handler */
W.maxBtn=function(inputId){if(!S.on)return null;
  return link("Max",function(){var i=doc.getElementById(inputId);if(!i)return;i.value=(Math.floor(S.bal*100+1e-6)/100).toFixed(2);i.dispatchEvent(new Event("input",{bubbles:true}));i.focus({preventScroll:true})},{"aria-label":"Max: use your full balance","data-key":"max"})};
/* the amount field's label row: the label, and Max at its end once a wallet is connected */
W.amountLabel=function(id,text){return h("div",{class:"line","data-key":"amt-lbl"},[h("label",{for:id,text:text}),W.maxBtn(id)])};
/* Place trade: unavailable until a wallet is connected, with one hint whose inline button connects */
W.placeBtn=function(o){if(!S.on)return h("button",{class:"btn lg",type:"button","aria-disabled":"true","aria-describedby":o.hint||"tk-hint",text:o.text||"Place trade"});
  return h("button",{class:"btn lg",type:"button","data-tx-place":"","aria-describedby":o.extra?o.hint||"tk-hint":null,text:o.text||"Place trade",onclick:o.onPlace})};
W.hint=function(o){var id=o.hint||"tk-hint",x=o.extra?" "+o.extra:"";
  if(S.on)return o.extra?h("p",{class:"note"+(o.cls?" "+o.cls:""),id:id,text:o.extra}):null;
  return h("p",{class:"note"+(o.cls?" "+o.cls:""),id:id},[link("Connect wallet",function(e){W.openConnect({from:e.currentTarget,after:o.after})}),(o.tail||" to trade.")+x])};

window.SeerWallet=W;
})();
