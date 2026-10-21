/* Seer assistant (the floating ball) on all six pages. Production role: an AI assistant launcher with a chat ("Ask").
   Demo role: the judges' control panel for the simulated data layer ("Demo", js/demo.js).
   The ball is a 56px violet cut-corner block with the Seer mark, bottom right, clear of the safe areas and the page
   gutter. It steps out of the way while any other sheet is open, so it never covers a sheet's actions. Its panel is a
   pinned-header sheet built with U.sheet (js/util.js): a popover above the ball from 601px, a bottom sheet on phones,
   with the focus trap, Escape, focus return and drag to dismiss that every sheet has.
   Replies in Ask are scripted (a small knowledge map per page); the chat is kept for the tab in sessionStorage. */
(function(){
"use strict";
var doc=document,root=doc.documentElement,D=window.SeerDemo,KEY="seer-assistant",RID="as-root";
if(!window.U||!doc.body)return;
var h=U.h,mqR=matchMedia("(prefers-reduced-motion: reduce)"),mqPhone=matchMedia("(max-width:600px)");
function reduced(){return mqR.matches}
function svg(t,a,k){var n=doc.createElementNS("http://www.w3.org/2000/svg",t),x;for(x in a)n.setAttribute(x,a[x]);(k||[]).forEach(function(c){n.appendChild(c)});return n}
var MARK="M12.2695 6C12.1061 6 11.9486 6.06424 11.833 6.17969L7.05859 10.9492C6.67062 11.3368 6.94608 11.9999 7.49414 12H11.5176V12.002C11.7008 12.002 11.7919 12.2229 11.6631 12.3516L6.00879 18H11.7578C11.9212 17.9999 12.0778 17.9357 12.1934 17.8203L16.9688 13.0508C17.3565 12.6632 17.0803 12 16.5322 12H12.5088C12.3256 12 12.2346 11.779 12.3633 11.6504L18.0205 6H12.2695Z M22.7949 5.99805C23.4751 5.99805 24.0262 6.54913 24.0264 7.22852V11.4893C24.0263 11.8156 23.8961 12.1286 23.665 12.3594L12.373 23.6387C12.142 23.8695 11.8288 23.9999 11.502 24H7.2373C6.55706 24 6.00488 23.449 6.00488 22.7695V18.002H1.23145C0.551319 18.0018 0 17.4509 0 16.7715V12.5117C0 12.1852 0.130268 11.8715 0.361328 11.6406L11.6533 0.361328C11.8845 0.13043 12.1985 0 12.5254 0H16.79C17.4702 6.24588e-05 18.0215 0.551006 18.0215 1.23047V6H22.7949V5.99805Z";
function mark(cls){return svg("svg",{class:cls,viewBox:"0 0 24.03 24",width:"24",height:"24","aria-hidden":"true",focusable:"false"},[svg("path",{d:MARK,fill:"currentColor","fill-rule":"evenodd"})])}

/* ---------- which page this is ---------- */
var PAGE=(function(){if(doc.body.classList.contains("home"))return"home";var n=D&&D.pageName&&D.pageName();if(n)return n;
  var m=/(\w+)\.html/.exec(location.pathname);return m&&["app","futarchy","deep","opportunity","risk"].indexOf(m[1])>=0?m[1]:"home"})();
var FILE={home:"index.html",app:"app.html",futarchy:"futarchy.html",deep:"deep.html",opportunity:"opportunity.html",risk:"risk.html"}[PAGE];

/* ---------- state for the tab: the open tab and the conversation ---------- */
function load(){try{var v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&Array.isArray(v.msgs))return v}catch(e){}return{tab:"ask",msgs:[]}}
var ST=load();ST.msgs&&ST.msgs.forEach(function(m){if(m&&m.vis!=null)m.vis=null});
function save(){try{sessionStorage.setItem(KEY,JSON.stringify({tab:ST.tab,msgs:ST.msgs.slice(-40).map(function(m){return{r:m.r,t:m.t,link:m.link||null,follow:m.follow||null}})}))}catch(e){}}

/* ---------- the knowledge map: scripted answers, matched on words in the question ---------- */
var A={
  seer:{a:"Seer is a prediction-market protocol. Anyone can create a market on a question, people trade on the outcomes, and the prices show what the crowd expects. The five apps here are built on it: the explorer, Futarchy, Deep, Opportunity Markets and Risk Pricing.",k:["what is seer","seer","protocol","about"],f:["types","create"]},
  cond:{a:"A conditional market prices an outcome under a condition. For example: what will the token price be if proposal 42 passes, and what will it be if it fails? Each branch trades on its own, and trades in the branch that does not happen are refunded. Comparing the two branches shows what the market expects the decision to change.",k:["conditional","condition","branch","refund","if it passes","if it fails"],f:["futarchy","create"],link:["Browse conditional markets","app.html"]},
  futarchy:{a:"In Futarchy the market forecasts and the vote decides. For each proposal, two conditional markets forecast a success metric if it passes and if it fails. Token holders see the difference before they vote, but the vote is binding and the forecast is not.",k:["futarchy","decide","decision","vote","dao","govern"],f:["cond","branch"],link:["Open Futarchy","futarchy.html"]},
  branch:{a:"Pick a proposal, then in Trade a branch choose If it passes or If it fails, enter an amount and place the trade. You need a connected wallet first; in this demo the wallet and the funds are simulated. If the other branch happens, your trade is refunded.",k:["trade a branch","branch trade","how do i trade","place a trade","buy"],f:["cond","wallet"]},
  create:{a:"Open the Seer app and choose Create market in the page head. Write the question, pick a category and a type, set the outcomes or the range, a close date and at least 50 USDC of starting liquidity. A live preview shows the card as the explorer will show it. Connect a wallet, review, confirm, and the market appears at the top of the list.",k:["create","new market","make a market","launch a market","start a market","add a market"],f:["types","wallet"],link:["Open the explorer","app.html"]},
  types:{a:"Seer has five market types. Categorical: one outcome wins. Multi-categorical: several outcomes can come true. Scalar: a number inside a range. Multi-scalar: which range a number lands in. Conditional: a value if something happens, and if it does not.",k:["type","types","categorical","scalar","multi"],f:["cond","create"]},
  deep:{a:"Deep is for questions with many outcomes, here a grant round of 100 proposals. Agents and people forecast the score human evaluators will give each proposal. The evaluators still score every one; the market only forecasts them.",k:["deep","grant","100","many outcome","evaluator"],f:["agents","range"],link:["Open Deep","deep.html"]},
  agents:{a:"AI agents trade beside people. Each row in Deep shows how much of the volume comes from agents and how much from people, so you can see where the forecast comes from.",k:["agent","ai","bot","human"],f:["deep","range"]},
  range:{a:"The 90% range is where the market expects the evaluators' score to land nine times out of ten. A narrow range means traders agree; a wide one means they do not.",k:["90%","range","interval","confidence"],f:["deep"]},
  opp:{a:"Opportunity Markets forecast which submissions reviewers will select. The market signal sits beside the reviewers' decision, and the final pick always stays with the reviewers.",k:["opportunity","selection","submission","reviewer"],f:["differs"],link:["Open Opportunity Markets","opportunity.html"]},
  differs:{a:"Differs from the market marks a submission where the reviewers' decision went against the signal: selected with less than a 30% chance, or not selected with 50% or more. It flags only the exceptions, so most rows show nothing.",k:["differ","flag","disagree","mismatch"],f:["opp"]},
  risk:{a:"Risk Pricing compares market-estimated risk across protocols and horizons. Each cell is the market's probability of a loss event, such as a hack, a stablecoin depeg or an oracle failure, within that time. Darker cells are riskier, and you can compare up to three protocols side by side.",k:["risk","heatmap","hack","exploit","depeg","oracle","insurance"],f:["riskread"],link:["Open Risk Pricing","risk.html"]},
  riskread:{a:"Read down a column to compare protocols over the same horizon, and along a row to see how one protocol's risk grows with time. These are market estimates, not guarantees or advice.",k:["read","heat","column","horizon","compare"],f:["risk"]},
  wallet:{a:"Nothing here moves real money. The wallet is simulated: connecting, signing and every balance are part of the demo, and no wallet is contacted.",k:["wallet","connect","money","fund","real","usdc","balance","safe"],f:["create","branch"]},
  demo:{a:"Open the Demo tab in this panel. You can slow every load down, force an error (network, timeout, server, not found or an empty result), go offline, or turn on the cache, then replay the page's load to see how it behaves.",k:["demo","judge","slow","error","offline","cache","skeleton","loading"],f:[]},
  data:{a:"All the figures in these apps are illustrative, and each page says so once in its header. Nothing claims real users, funding or partners.",k:["real data","illustrative","numbers","fake","accurate"],f:["wallet"]}
};
var PAGES={
  home:"This is Seer's landing page. It shows the protocol as a base layer with five apps on top: the market explorer, Futarchy, Deep, Opportunity Markets and Risk Pricing. Launch App opens the explorer.",
  app:"This is the explorer: every market on Seer in one place. The tiles sum up what is open, the tabs and filters narrow the list, and Grid or Table changes the view. Choose a market to see its details and trade it, or use Create market to start your own.",
  futarchy:"This is Futarchy. Pick a proposal on the left. The market's forecast shows the success metric if it passes and if it fails, the DAO's decision shows the vote, and the chart shows how both forecasts moved. You can trade either branch.",
  deep:"This is Deep: a grant round of 100 proposals. Each dot is a proposal, bigger and brighter for a higher forecast score. The table lists the scores, their 90% range and who is trading, agents or people. Pick a dot or a row for its details.",
  opportunity:"This is Opportunity Markets. Each row is a submission with the market's chance that reviewers select it, beside the reviewers' actual decision. Rows where the two disagree are flagged. Pick an open submission to trade it.",
  risk:"This is Risk Pricing. The heatmap shows the market's estimated chance of a loss event per protocol and horizon; switch between hack, depeg and oracle risk. Add protocols to compare them side by side in the chart below."};
var SUGG={home:["What is Seer?","What is a conditional market?","How does Futarchy decide?","How do I create a market?"],
  app:["Explain this page","What is a conditional market?","How do I create a market?","How does Futarchy decide?"],
  futarchy:["Explain this page","How does Futarchy decide?","What is a conditional market?","How do I create a market?"],
  deep:["Explain this page","How do agents trade here?","What is a conditional market?","How does Futarchy decide?"],
  opportunity:["Explain this page","What does Differs from the market mean?","What is a conditional market?","How does Futarchy decide?"],
  risk:["Explain this page","How do I read the heatmap?","What is a conditional market?","How does Futarchy decide?"]};
var QUESTION={seer:"What is Seer?",cond:"What is a conditional market?",futarchy:"How does Futarchy decide?",branch:"How do I trade a branch?",create:"How do I create a market?",types:"What do the market types mean?",
  deep:"What is Deep?",agents:"How do agents trade here?",range:"What does the 90% range mean?",opp:"What are Opportunity Markets?",differs:"What does Differs from the market mean?",
  risk:"What is Risk Pricing?",riskread:"How do I read the heatmap?",wallet:"Is any of this real money?",demo:"How do I use the Demo controls?"};
function answer(q){var s=" "+q.toLowerCase().replace(/[^a-z0-9% ]+/g," ").replace(/\s+/g," ")+" ";
  if(/ (this|the) (page|screen)|explain|what am i (looking|seeing)|what is here|where am i /.test(s))return{t:PAGES[PAGE],f:SUGG[PAGE].filter(function(x){return x!=="Explain this page"}).slice(0,2).map(function(x){return x})};
  var best=null,bs=0;Object.keys(A).forEach(function(id){var sc=0;A[id].k.forEach(function(k){if(s.indexOf(k.indexOf(" ")>=0?k:" "+k)>=0)sc+=k.indexOf(" ")>=0?3:k.length>4?2:1});if(sc>bs){bs=sc;best=id}});
  if(!best)return{t:"I can only answer a few questions in this preview. Try one of these, or ask about market types, Futarchy, Deep, Opportunity Markets, Risk Pricing or creating a market.",f:["Explain this page","What is a conditional market?"]};
  var e=A[best];return{t:e.a,link:e.link||null,f:(e.f||[]).map(function(id){return QUESTION[id]}).filter(Boolean).slice(0,2)}}

/* ---------- the ball ---------- */
var dot=h("span",{class:"as-dot","aria-hidden":"true"},[h("span",{class:"as-dot-t",text:"Demo"})]);
var ball=h("button",{class:"as-ball",type:"button",id:"as-ball","aria-haspopup":"dialog","aria-expanded":"false",onclick:function(){if(isOpen())close();else open()}},[
  h("span",{class:"as-glow","aria-hidden":"true"}),h("span",{class:"as-face","aria-hidden":"true"},[mark("as-mark")]),dot]);
var dock=h("div",{class:"as-dock"},[ball]);doc.body.appendChild(dock);
function label(){var on=D&&!D.isDefault();ball.setAttribute("aria-label",on?"Open Seer assistant. Demo overrides are on.":"Open Seer assistant");ball.classList.toggle("is-demo",!!on);
  ball.title=on?"Seer assistant (demo overrides on)":"Seer assistant"}
label();
/* out of the way while another sheet is open: never over a sheet's actions, and out of the tab order */
function away(){var o=!!doc.querySelector("#panel-root .panel, #sheet-root .panel, #wallet-root .panel");dock.classList.toggle("as-away",o);dock.inert=o}
function watch(){["panel-root","sheet-root","wallet-root"].forEach(function(id){var r=doc.getElementById(id);if(r&&!r.__asw){r.__asw=1;new MutationObserver(away).observe(r,{childList:true})}})}
new MutationObserver(function(){watch();away()}).observe(doc.body,{childList:true});watch();away();
doc.addEventListener("visibilitychange",function(){dock.classList.toggle("as-paused",doc.hidden)});

/* ---------- the panel ---------- */
var opened=false,busy=false,tick=0,live=null;
function isOpen(){return!!doc.querySelector("#"+RID+" .panel")}
function say(t){if(D&&D.announce)D.announce(t);else{if(!live){live=h("div",{class:"dm-sr",role:"status","aria-live":"polite"});doc.body.appendChild(live)}live.textContent="";setTimeout(function(){live.textContent=t},90)}}
function open(){if(isOpen())return;opened=true;draw(true);ball.setAttribute("aria-expanded","true");dock.classList.add("as-open");
  var p=doc.querySelector("#"+RID+" .panel");if(!p)return;
  /* from 601px it is a popover above the ball: it rises from the ball, and the page does not recede behind it */
  if(!mqPhone.matches){root.classList.remove("m-sheet");if(window.Motion&&Motion.drive&&!reduced())Motion.drive(p,{x:0,y:0},"gentle",{from:{x:0,y:18},eps:.3})}
  scrollLog(true);clearInterval(tick);tick=setInterval(function(){if(isOpen()&&ST.tab==="demo")draw()},15000)}
function close(){if(!isOpen())return;clearInterval(tick);U.sheet({root:RID,open:false});ball.setAttribute("aria-expanded","false");dock.classList.remove("as-open");
  if(ball.isConnected&&!dock.inert)ball.focus({preventScroll:true})}
function draw(first){var kids=[tabs(),h("div",{class:"as-body","data-key":"as-body"},[ST.tab==="ask"?ask():demo()])];
  U.sheet({root:RID,cls:"as-sheet",open:true,label:"Seer assistant",title:"Seer assistant",badge:null,kids:kids,onClose:close,focus:first?".as-tabs [aria-pressed=true]":null});
  var p=doc.querySelector("#"+RID+" .panel");if(p&&!p.__as){p.__as=1;wirePane(p)}}
/* send stays put while a reply is on its way */
function tab(t){if(ST.tab===t)return;ST.tab=t;save();draw();if(t==="ask")scrollLog(true);say(t==="ask"?"Ask":"Demo controls")}
function tabs(){return h("div",{class:"as-tabbar","data-key":"as-tabbar"},[h("div",{class:"seg as-tabs",role:"group","aria-label":"Assistant mode"},[
  h("button",{type:"button","aria-pressed":String(ST.tab==="ask"),"aria-controls":"as-pane",onclick:function(){tab("ask")}},["Ask"]),
  h("button",{type:"button","aria-pressed":String(ST.tab==="demo"),"aria-controls":"as-pane",onclick:function(){tab("demo")}},["Demo"])])])}
/* the open pane scrolls on its own, below the pinned bar and the tabs; the bar's hairline follows that scroll, and on
   phones a drag that starts in a pane that can scroll moves the pane, never the sheet */
function wirePane(p){var y0=0,body=p.querySelector(".as-body");
  p.addEventListener("scroll",function(e){var t=e.target;if(!t.classList||!t.classList.contains("as-scroll"))return;var top=p.querySelector(".panel-top");if(top)top.classList.toggle("m-scrolled",t.scrollTop>0)},true);
  if(!body)return;
  /* the body is kept across re-renders, so these listeners stay; they run before the sheet's own drag handler */
  body.addEventListener("touchstart",function(e){y0=e.touches[0].clientY},{passive:true});
  body.addEventListener("touchmove",function(e){var s=e.target.closest&&e.target.closest(".as-scroll");if(!s)return;var d=e.touches[0].clientY-y0;
    if(s.scrollTop>0||(d<0&&s.scrollHeight>s.clientHeight+1))e.stopPropagation()},{passive:true})}

/* ---------- Ask ---------- */
/* a reply's visible text streams in an aria-hidden paragraph; screen readers get the whole reply, once, from the hidden twin */
/* a streaming reply is laid out in full from the first frame (so the bubble never grows or re-wraps) and each word fades in on its
   own delay; the delay is measured from when the reply started, so a re-render mid-stream resumes in place instead of restarting */
function streamWords(m){var ws=m.t.split(" "),el=performance.now()-(m.t0||0);
  return ws.map(function(w,k){return h("span",{class:"as-w",style:"animation-delay:"+Math.round(k*m.step-el)+"ms"},[w+(k<ws.length-1?" ":"")])})}
function bubble(m,i){var me=m.r==="me",streaming=m.vis!=null;
  return h("div",{class:"as-msg "+(me?"as-me":"as-bot"),"data-key":"m"+i},me?[h("span",{class:"dm-sr",text:"You: "}),h("p",{class:"as-txt",text:m.t})]:[
    h("span",{class:"dm-sr",text:"Seer assistant: "+m.t}),h("p",{class:"as-txt","aria-hidden":"true"},streaming?streamWords(m):[m.t]),
    m.link&&!streaming&&m.link[1]!==FILE?h("a",{class:"as-go",href:m.link[1]},[h("span",{text:m.link[0]}),svg("svg",{viewBox:"0 0 16 16",width:"16",height:"16","aria-hidden":"true",focusable:"false"},[svg("path",{d:"M3 8h9.5M8.5 3.5 13 8l-4.5 4.5",fill:"none",stroke:"currentColor","stroke-width":"1.5"})])]):null])}
function chips(list,key,hold){return h("div",{class:"as-sugg"+(hold?" as-hold":""),"aria-hidden":hold?"true":null,"data-key":key,role:"group","aria-label":key==="follow"?"Follow-up questions":"Suggested questions"},list.map(function(q){return h("button",{class:"chip as-chip",type:"button","aria-disabled":busy?"true":null,onclick:function(){send(q)}},[q])}))}
var HELLO="Hi, I am the Seer assistant. Ask me about markets, Futarchy or anything on this page.";
function ask(){var log=[h("div",{class:"as-msg as-bot","data-key":"hello"},[h("span",{class:"dm-sr",text:"Seer assistant: "+HELLO}),h("p",{class:"as-txt","aria-hidden":"true",text:HELLO})]),
    chips(SUGG[PAGE],"sugg0")];
  ST.msgs.forEach(function(m,i){log.push(bubble(m,i))});
  if(busy==="typing")log.push(h("div",{class:"as-msg as-bot as-typing","data-key":"typing","aria-hidden":"true"},[h("i"),h("i"),h("i")]));
  var last=ST.msgs[ST.msgs.length-1],reply=last&&last.r==="bot"&&last.follow&&last.follow.length;
  return h("div",{class:"as-pane as-ask",id:"as-pane","data-key":"ask"},[
    /* the one statement that the replies are scripted, and the way to start over */
    h("div",{class:"as-askbar","data-key":"askbar"},[h("p",{class:"as-note"},[h("i",{"aria-hidden":"true"}),"Scripted preview"]),
      ST.msgs.length&&!busy?h("button",{class:"as-clear",type:"button",onclick:function(){ST.msgs=[];save();draw();say("Conversation cleared.");var i=doc.getElementById("as-q");if(i)i.focus()}},["Clear conversation"]):null]),
    h("div",{class:"as-scroll as-log",role:"log","aria-live":"polite","aria-label":"Conversation",tabindex:"0","data-key":"log"},log),
    /* follow-up questions after a reply sit outside the log, so the log only ever announces the reply itself */
    /* held (invisible, same size) while the reply streams, so the log keeps its final height and nothing shifts when they appear */
    (busy?PENDING:(reply?last.follow:null))&&(busy?PENDING:last.follow).length?chips(busy?PENDING:last.follow,"follow",!!busy):null,
    h("form",{class:"as-compose","data-key":"compose",onsubmit:function(e){e.preventDefault();if(busy)return;var i=doc.getElementById("as-q");if(i&&i.value.trim()){var v=i.value.trim();i.value="";send(v)}}},[
      h("label",{class:"dm-sr",for:"as-q",text:"Ask the Seer assistant"}),
      h("input",{class:"field as-q",id:"as-q",type:"text",autocomplete:"off",maxlength:"200",placeholder:"Ask about markets or this page",enterkeyhint:"send"}),
      h("button",{class:"btn as-send",type:"submit","aria-label":"Send","aria-disabled":busy?"true":null},[svg("svg",{viewBox:"0 0 16 16",width:"16",height:"16","aria-hidden":"true",focusable:"false"},[svg("path",{d:"M2.5 8h10M8.5 3.5 13 8l-4.5 4.5",fill:"none",stroke:"currentColor","stroke-width":"1.8"})])])])])}
function scrollLog(instant){var l=doc.querySelector("#"+RID+" .as-log");if(!l)return;
  try{l.scrollTo({top:l.scrollHeight,behavior:instant||reduced()?"auto":"smooth"})}catch(e){l.scrollTop=l.scrollHeight}}
/* a reply: a short typing beat, then the text streams in word by word (all at once under reduced motion). Screen
   readers get the whole reply once, when it is added to the log. */
function redraw(){if(isOpen())draw()}
var PENDING=null; /* the follow-up chips of the reply being prepared: their space is held from the moment the question is sent */
function send(q){if(busy)return;var a=answer(q);PENDING=a.f||null;ST.msgs.push({r:"me",t:q});save();busy="typing";redraw();scrollLog();
  setTimeout(function(){var m={r:"bot",t:a.t,link:a.link||null,follow:a.f||null};
    if(reduced()){ST.msgs.push(m);busy=false;PENDING=null;save();redraw();scrollLog();return}
    var n=a.t.split(" ").length,step=Math.max(14,Math.min(36,1500/n));
    m.vis=0;m.t0=performance.now();m.step=step;ST.msgs.push(m);busy="stream";save();redraw();scrollLog();
    setTimeout(function(){m.vis=null;busy=false;PENDING=null;save();redraw()},Math.round(n*step+320))},reduced()?150:520+Math.random()*260)}

/* ---------- Demo: the judges' controls ---------- */
var DELAY_T={0:"Instant",1:"1s",2:"2s",3:"3s",8:"8s"},ERR_T={none:"None",network:"Network",timeout:"Timeout",server:"Server error",notfound:"Not found",empty:"Empty"};
function set(p,msg){if(!D)return;D.set(p);say(msg)}
function sw(id,on,text,note,fn){return h("div",{class:"as-swrow","data-key":id},[h("button",{class:"as-switch",type:"button",role:"switch",id:id,"aria-checked":String(on),"aria-describedby":note?id+"-n":null,onclick:fn},[
    h("span",{class:"as-sw-t",text:text}),h("span",{class:"as-track","aria-hidden":"true"},[h("i")])]),note?h("p",{class:"as-help",id:id+"-n",text:note}):null])}
function group(id,title,kids){return h("section",{class:"as-group","aria-labelledby":id,"data-key":id},[h("h3",{class:"as-gh",id:id,text:title})].concat(kids))}
function demo(){if(!D)return h("div",{class:"as-pane",id:"as-pane"},[h("p",{class:"as-help",text:"The demo controls are not available on this page."})]);
  var s=D.settings,c=D.counts,can=D.canReplay(),narrowClose=function(){if(mqPhone.matches)close()};
  var err=s.error,forceKind=err==="none"?"server":err;
  var items=[
    h("p",{class:"as-note as-demo-note","data-key":"dnote"},[h("i",{"aria-hidden":"true"}),"These controls are for the demo: they simulate slow, failing and offline loads on every page in this tab."]),
    group("as-g-load","Loading",[
      h("div",{class:"as-field"},[h("span",{class:"as-lbl",id:"as-delay-l",text:"Delay"}),
        h("div",{class:"seg as-seg",role:"group","aria-labelledby":"as-delay-l"},D.DELAYS.map(function(d){return h("button",{type:"button","aria-pressed":String(s.delay===d),onclick:function(){if(s.delay!==d)set({delay:d},d?"Delay set to "+d+(d===1?" second":" seconds"):"Delay set to instant")}},[DELAY_T[d]])}))]),
      h("button",{class:"btn soft as-wide",type:"button","aria-disabled":can?null:"true","aria-describedby":"as-replay-n",onclick:function(){if(!can)return;say("Replaying this page's load.");narrowClose();D.replay({})}},["Replay loading"]),
      h("p",{class:"as-help",id:"as-replay-n",text:can?(s.delay?"Runs this page's first load again with a "+DELAY_T[s.delay]+" delay.":"Runs this page's first load again. Pick a delay to see the skeleton."):"The landing page has no data to load. Open one of the apps to replay its loading."})]),
    group("as-g-err","Errors",[
      h("div",{class:"as-field"},[h("label",{class:"as-lbl",for:"as-err",text:"Forced error"}),
        h("select",{class:"field",id:"as-err",onchange:function(e){var v=e.target.value;set({error:v},"Forced error set to "+ERR_T[v].toLowerCase()+".")}},D.ERRORS.map(function(k){return h("option",{value:k,text:ERR_T[k],selected:s.error===k?"selected":null})}))]),
      h("fieldset",{class:"as-scope"},[h("legend",{class:"as-lbl",text:"Applies to"})].concat([["page","Page data"],["details","Details"],["tx","Transactions"]].map(function(x){var sc={};
        return h("label",{class:"as-check"},[h("input",{type:"checkbox",checked:s.scope[x[0]]?"checked":null,onchange:function(e){sc[x[0]]=e.target.checked;set({scope:sc},x[1]+(e.target.checked?" on.":" off."))}}),x[1]])}))),
      h("button",{class:"btn soft as-wide",type:"button","aria-disabled":can?null:"true","aria-describedby":"as-trig-n",onclick:function(){if(!can)return;say("Loading this page with a "+ERR_T[forceKind].toLowerCase()+(forceKind==="empty"?" result.":" error."));narrowClose();D.replay({force:forceKind})}},["Trigger error now"]),
      h("p",{class:"as-help",id:"as-trig-n",text:can?"Runs this page's load once with "+(err==="none"?"a server error":err==="empty"?"an empty result":"a "+ERR_T[err].toLowerCase()+" error")+", whatever the scope.":"Open one of the apps to trigger an error."})]),
    group("as-g-net","Network",[sw("as-off",s.offline,"Offline","Every load fails with a network error until you switch this off; the page then retries by itself.",function(){set({offline:!s.offline},s.offline?"Back online.":"Offline on.")})]),
    group("as-g-cache","Cache",[sw("as-cache",s.cache,"Cache","Saved loads show at once and refresh in the background.",function(){set({cache:!s.cache},s.cache?"Cache off.":"Cache on.")}),
      h("p",{class:"as-live num","data-key":"cache-line"},["Cache: "+c.entries+(c.entries===1?" entry":" entries")+", last read "+D.ago(c.lastRead)]),
      h("div",{class:"as-two"},[h("button",{class:"btn soft",type:"button",onclick:function(){D.warmCache();say("Cache warmed: "+D.counts.entries+" entries.")}},["Warm cache"]),
        h("button",{class:"btn soft",type:"button","aria-describedby":"as-clear-n",onclick:function(){D.clearCache();say("Cache cleared. The next load is cold.")}},["Clear cache ("+c.entries+")"])]),
      h("p",{class:"as-help",id:"as-clear-n",text:"Last cleared "+D.ago(c.lastCleared)+"."}),
      c.entries?h("details",{class:"as-entries","data-key":"entries"},[h("summary",{text:"Saved entries"}),h("ul",{},D.entries().slice(0,12).map(function(e){return h("li",{},[h("span",{text:e.label}),h("span",{class:"muted num",text:D.ago(e.at)})])}))]):null]),
    h("div",{class:"as-reset","data-key":"reset"},[h("button",{class:"btn soft as-wide",type:"button","aria-disabled":D.isDefault()&&s.scope.page&&!s.scope.details&&!s.scope.tx?"true":null,onclick:function(e){if(e.currentTarget.getAttribute("aria-disabled"))return;D.reset();say("All demo settings reset.")}},["Reset all"])]),
    group("as-g-sys","Open a system page",[h("ul",{class:"as-links"},[["404 page","this-page-does-not-exist.html"],["Error page: offline","error.html?type=offline"],["Error page: timeout","error.html?type=timeout"],
      ["Error page: server error","error.html?type=server"],["Error page: unexpected","error.html?type=unknown"],["Loading page","loading.html?next="+FILE]].map(function(l){
      return h("li",{},[h("a",{class:"as-link",href:l[1]},[h("span",{text:l[0]}),svg("svg",{viewBox:"0 0 16 16",width:"16",height:"16","aria-hidden":"true",focusable:"false"},[svg("path",{d:"M3 8h9.5M8.5 3.5 13 8l-4.5 4.5",fill:"none",stroke:"currentColor","stroke-width":"1.5"})])])])}))])];
  return h("div",{class:"as-pane as-demo",id:"as-pane","data-key":"demo"},[h("div",{class:"as-scroll","data-key":"dscroll"},items)])}

if(D&&D.subscribe)D.subscribe(function(){label();if(isOpen()&&ST.tab==="demo")draw()});
/* phone rotation or a resize across 600px: the panel changes form, so it closes rather than jump */
mqPhone.addEventListener("change",function(){if(isOpen())close()});
})();
