(function(){
  SeerShell.mount({product:"app",cta:"Connect wallet"});
  var ALL=window.MARKETS,M=ALL,TYPES=["Categorical","Multi-categorical","Scalar","Multi-scalar","Conditional"],W=window.SeerWallet;
  var st={cat:"All",type:"",status:"",q:"",sort:"vol",view:"grid",saved:false};
  /* the filters the list was last loaded with (category, status, type, sort are a server query; search is local) */
  var qs={cat:"All",type:"",status:"",sort:"vol"};
  function snap(){return{cat:st.cat,type:st.type,status:st.status,sort:st.sort}}
  /* data loads go through js/demo.js (delay, errors, offline, cache); without it they resolve at once, as before */
  var DM=window.SeerDemo;
  function slot(){return DM?DM.slot():{run:function(o){o.apply({data:o.producer(),fromCache:false,empty:false},{sync:true,shown:false})},cancel:function(){}}}
  var pageSlot=slot(),listSlot=slot(),detSlot=slot(),pageState="ok",listErr=null,listEmpty=false;
  function h(tag,attrs,kids){var n=document.createElement(tag);for(var k in attrs||{}){if(attrs[k]==null)continue;if(k==="text")n.textContent=attrs[k];else if(k==="class")n.className=attrs[k];else if(k.slice(0,2)==="on")n[k]=attrs[k];else n.setAttribute(k,attrs[k])}
    (kids||[]).forEach(function(c){if(c!=null)n.appendChild(typeof c==="string"?document.createTextNode(c):c)});return n}
  var money=U.money;
  function pc(p){return Math.round(p*100)+"%"}
  /* Close times are worked out from today (markets.js holds closeIn, in days, and closeAt, a UTC hour), so no open market goes stale.
     A market created in a session carries closeTs. A market with neither keeps its plain close label. Dates are British: "14 Nov",
     "14 Nov 2027" in another year, "14 Nov 2026, 17:00 UTC" in full. */
  var MON=U.MON;
  function ago(ms){var a=Math.abs(ms),n,u;
    if(a<864e5){n=Math.max(1,Math.round(a/36e5));u=n===1?"hour":"hours"}
    else{var d=Math.round(a/864e5);if(d===1)return ms>0?"tomorrow":"yesterday";
      if(d<60){n=d;u="days"}else if(d<730){n=Math.round(d/30.4);u="months"}else{n=Math.round(d/365.25);u="years"}}
    return ms>0?"in "+n+" "+u:n+" "+u+" ago"}
  function closeOf(m){var t=m.closeTs,now=new Date();
    if(t==null&&m.closeIn!=null)t=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+m.closeIn,m.closeAt==null?17:m.closeAt);
    if(t==null)return m.close?{label:m.close,full:m.close,rel:"",past:false}:null;
    var d=new Date(t),day=d.getUTCDate()+" "+MON[d.getUTCMonth()],y=d.getUTCFullYear(),hh=String(d.getUTCHours()).padStart(2,"0");
    return{label:y===now.getUTCFullYear()?day:day+" "+y,full:day+" "+y+", "+hh+":00 UTC",rel:ago(t-now.getTime()),past:t<now.getTime()}}
  /* a day counted from today, as "5 Oct" (with the year when it is not this one) */
  var dayIn=U.dayIn;
  /* what the sheet says about resolution: a market without its own record (one made in a session) gets a plain one */
  function resOf(m){return m.res||{state:m.status==="Resolved"?"final":"trading",answer:null,reportedIn:null,source:"Reality.eth",rules:"The answer reported for the question decides the outcome."}}
  function rulesBox(m,cl){var rs=resOf(m),addr=U.addr(m.id),a="Not reported yet",row=function(k,v,c){return h("div",{class:"tx-row"+(c?" "+c:"")},[h("dt",{text:k}),h("dd",{},[].concat(v))])};
    if(rs.answer)a=rs.answer+(rs.reportedIn!=null?", reported "+dayIn(rs.reportedIn):"")+(rs.state==="disputed"&&rs.disputedIn!=null?". Challenged on "+dayIn(rs.disputedIn)+".":"");
    var d=h("details",{class:"panel-c rules","data-key":"rules",open:U.narrow.matches?null:""},[h("summary",{text:"Rules and resolution"}),
      h("dl",{class:"tx-sum"},[row("Resolves by",rs.state==="disputed"?(rs.source||"Reality.eth")+", now in Kleros arbitration":(rs.source||"Reality.eth")+", with Kleros arbitration if disputed","tx-q"),
        row("Answer",a,"tx-q"),
        row("Collateral","USDC","tx-q"),
        row("Market address",[h("span",{class:"num",text:W.short(addr)}),W.copyBtn(addr,"market address")],"rules-addr")]),
      h("p",{class:"note",text:rs.rules+" If the question cannot be answered, it resolves Invalid and holders are refunded pro rata."})]);return d}
  /* a scalar value with its unit: "$" leads, a word follows after a space, a symbol follows directly */
  function sfmt(v,u){var n=U.num(v,2,0),neg=n.charAt(0)==="\u2212";if(neg)n=n.slice(1);
    return(neg?"\u2212":"")+(u==="$"?"$"+n:u&&/^[A-Za-z]/.test(u)?n+" "+u:n+(u||""))}
  function lead(m){if(!m.outs)return null;return m.outs.slice().sort(function(a,b){return b[1]-a[1]})[0]}
  function matches(m){
    if(qs.cat!=="All"&&m.cat!==qs.cat)return false;if(qs.type&&m.type!==qs.type)return false;if(qs.status&&m.status!==qs.status)return false;
    if(st.saved&&!isSaved(m.id))return false;
    if(st.q){var s=(m.q+" "+m.cat+" "+m.type+" "+(m.outs||[]).map(function(o){return o[0]}).join(" ")).toLowerCase();if(s.indexOf(st.q.toLowerCase())<0)return false}return true}
  /* Re-renders morph into the existing DOM (js/motion.js) so focus, caret and scroll never reset. */
  function patch(el,next,o){if(window.Motion)return Motion.patch(el,next,o);el.textContent="";while(next.firstChild)el.appendChild(next.firstChild)}
  /* markets created in this session lead the list, newest first, in every sort; the rest follow the sort */
  function sorted(l){l.sort(function(a,b){return qs.sort==="name"?a.q.localeCompare(b.q):b[qs.sort]-a[qs.sort]});
    return l.filter(function(m){return m.isNew}).sort(function(a,b){return b.isNew-a.isNew}).concat(l.filter(function(m){return!m.isNew}))}

  /* markets created earlier in this session (sessionStorage, so they survive a reload or a trip to another page) */
  var NEWKEY="seer-new-markets";
  function stored(){try{var v=JSON.parse(sessionStorage.getItem(NEWKEY)||"[]");return Array.isArray(v)?v:[]}catch(e){return[]}}
  function store(l){try{sessionStorage.setItem(NEWKEY,JSON.stringify(l))}catch(e){}}
  stored().slice().reverse().forEach(function(m){if(m&&m.id&&!ALL.some(function(x){return x.id===m.id}))ALL.unshift(m)});

  /* Saved markets: the ids of the markets starred in this tab (sessionStorage, so they follow a reload). Without storage they last for the page. */
  var SAVEKEY="seer-saved";
  var saved=(function(){try{var v=JSON.parse(sessionStorage.getItem(SAVEKEY)||"[]");return Array.isArray(v)?v:[]}catch(e){return[]}})();
  function isSaved(id){return saved.indexOf(id)>=0}
  function savedCount(){return M.filter(function(m){return isSaved(m.id)}).length}

  /* ======================= the address holds the explorer's state =======================
     ?cat=&type=&status=&sort=&view=&q=&saved=1&m=<id>. A value that is the default is left out, and a value that is not valid is ignored. It is read
     once, before the first load; the filters, the search (after 300 ms), the view and the Saved chip rewrite it with replaceState, so the page
     keeps one history entry. Opening a market pushes one entry (m=<id>), so Back closes the sheet and stays on the page. The grid or table choice
     is also kept in localStorage under seer-view; a view in the address wins over it. The hash (#leaderboard) is the view and is left as it is. */
  var STATUSES=["Open","Live","Awaiting result","In dispute","Resolved"],SORTS=["vol","liq","name"],VIEWKEY="seer-view";
  (function(){var p;try{p=new URLSearchParams(location.search)}catch(e){return}
    var cat=p.get("cat"),type=p.get("type"),status=p.get("status"),sort=p.get("sort"),v=p.get("view"),q=p.get("q");
    if(cat&&cat!=="All"&&ALL.some(function(m){return m.cat===cat}))st.cat=cat;
    if(TYPES.indexOf(type)>=0)st.type=type;if(STATUSES.indexOf(status)>=0)st.status=status;if(SORTS.indexOf(sort)>=0)st.sort=sort;
    if(q)st.q=q.slice(0,120);if(p.get("saved")==="1")st.saved=true;
    if(v!=="grid"&&v!=="table"){v=null;try{v=localStorage.getItem(VIEWKEY)}catch(e){}}
    if(v==="grid"||v==="table")st.view=v;
    qs=snap()})();
  var openId=null,pushed=false,closing=false,qt=0;
  function query(mid){var p=new URLSearchParams();
    if(st.cat!=="All")p.set("cat",st.cat);if(st.type)p.set("type",st.type);if(st.status)p.set("status",st.status);if(st.sort!=="vol")p.set("sort",st.sort);
    if(st.view!=="grid")p.set("view",st.view);if(st.q)p.set("q",st.q);if(st.saved)p.set("saved","1");if(mid!=null)p.set("m",mid);return p.toString()}
  /* the address of this page for the state now (the open market, if any), keeping the hash */
  function here(mid){var q=query(mid);return location.pathname+(q?"?"+q:"")+location.hash}
  function urlSync(){clearTimeout(qt);qt=0;try{history.replaceState(history.state,"",here(openId))}catch(e){}}
  function shareUrl(id){return location.origin+location.pathname+"?"+query(id)}
  addEventListener("pagehide",function(){if(qt)urlSync()});
  var STAR="M10 2.4l2.3 4.8 5.2.7-3.8 3.6.9 5.2L10 14.2l-4.6 2.5.9-5.2L2.5 7.9l5.2-.7z";
  /* the star: a toggle on a card and in a table row. It is a sibling of the card button, not inside it, so a press on it never opens the market */
  function star(m){var on=isSaved(m.id),ic=U.svg("svg",{viewBox:"0 0 20 20",width:"20",height:"20","aria-hidden":"true",focusable:"false","stroke-width":"1.6","stroke-linejoin":"round"});ic.appendChild(U.svg("path",{d:STAR}));
    var b=h("button",{class:"star",type:"button","aria-pressed":String(on),"aria-label":on?"Remove from saved: "+m.q:"Save market","data-key":"s"+m.id,onclick:function(e){e.stopPropagation();toggleSave(m,e.currentTarget)}});b.appendChild(ic);return b}
  function toggleSave(m,b){var i=saved.indexOf(m.id),on=i<0;if(on)saved.push(m.id);else saved.splice(i,1);
    try{sessionStorage.setItem(SAVEKEY,JSON.stringify(saved))}catch(e){}
    b.setAttribute("aria-pressed",String(on));b.setAttribute("aria-label",on?"Remove from saved: "+m.q:"Save market");
    if(on&&window.Motion)Motion.pop(b.firstChild,0);
    types();
    /* with Saved on, an unsaved market leaves the list; focus moves to the results line, which says how many remain */
    if(st.saved&&!on&&pageState==="ok"){render();countEl.setAttribute("tabindex","-1");countEl.focus({preventScroll:true})}}

  function stats(){var open=M.filter(function(m){return m.status==="Open"||m.status==="Live"}).length;
    var vol=M.reduce(function(a,m){return a+m.vol},0);var liq=M.reduce(function(a,m){return a+m.liq},0);
    var el=document.getElementById("stats"),f=h("div");
    /* the market count lives once, in the results line; the tiles carry what the list cannot */
    [["Open or live",String(open)],["Total volume",money(vol)],["Liquidity",money(liq)]].forEach(function(s){
      f.appendChild(h("div",{"data-key":s[0]},[h("small",{text:s[0]}),h("b",{class:"num",text:s[1]})]))});patch(el,f,{animate:!!el.firstChild})}

  function cats(){var el=document.getElementById("cats"),f=h("div"),sel=document.getElementById("cat-m"),all=["All"].concat(M.map(function(m){return m.cat}).filter(function(c,i,a){return a.indexOf(c)===i}));
    all.forEach(function(c){
      f.appendChild(h("button",{class:"tab",type:"button","data-key":c,"aria-pressed":String(st.cat===c),text:c,onclick:function(){st.cat=c;cats();refilter()}}))});patch(el,f);
    /* phones: the same category state as a select, so the long tab row never scrolls sideways */
    if(sel){if(sel.options.length!==all.length){U.clear(sel);all.forEach(function(c){sel.appendChild(h("option",{value:c,text:c==="All"?"All categories":c}))})}if(sel.value!==st.cat)sel.value=st.cat}}
  function types(){var el=document.getElementById("types"),f=h("div");
    [""].concat(TYPES).forEach(function(t){var n=M.filter(function(m){return!t||m.type===t}).length;
      f.appendChild(h("button",{class:"chip",type:"button","data-key":t||"all","aria-pressed":String(st.type===t),text:t?t+" · "+n:"All types",onclick:function(){st.type=t;types();refilter()}}))});
    /* Saved is one more chip after the types, and combines with every other filter. It filters the loaded markets at once, as search does. */
    f.appendChild(h("button",{class:"chip",type:"button","data-key":"saved","aria-pressed":String(st.saved),text:"Saved · "+savedCount(),onclick:function(){st.saved=!st.saved;urlSync();types();if(pageState==="ok"&&!pageSlot.pending)render()}}));patch(el,f)}

  function cardBody(m){
    var body=[];
    /* Outcome actions follow one rule: tradable markets with 3+ outcomes trade Yes/No per outcome;
       tradable two-outcome markets buy either outcome directly; closed markets show no actions,
       and a resolved market marks its winner. The chips are visual cues; the card opens the ticket. */
    var tradable=m.status==="Open"||m.status==="Live";
    function acts(o){
      if(!tradable)return m.status==="Resolved"&&o[1]===1?h("span",{class:"won",text:"Won"}):null;
      if(m.outs.length>2)return h("span",{class:"acts","aria-hidden":"true"},[h("span",{class:"yn","data-side":"Yes",text:"Yes"}),h("span",{class:"yn n","data-side":"No",text:"No"})]);
      return h("span",{class:"acts","aria-hidden":"true"},[h("span",{class:"yn buy",text:"Buy"})])}
    if(m.outs){m.outs.slice(0,m.outs.length>3?3:m.outs.length).forEach(function(o,i){
      body.push(h("div",{class:"orow","data-o":String(i)},[h("span",{text:o[0]}),h("span",{class:"pct"},[h("span",{class:"num",text:pc(o[1])}),acts(o)])]))});
      if(m.outs.length>3)body.push(h("span",{class:"more",text:"+ "+(m.outs.length-3)+(m.outs.length-3===1?" more outcome":" more outcomes")}))}
    else if(m.scalar){var s=m.scalar,p=(s.est-s.lo)/((s.hi-s.lo)||1)*100;p=Math.max(0,Math.min(100,p));
      body.push(h("div",{},[h("div",{class:"range"},[h("b",{class:"num",text:sfmt(s.est,s.unit),style:"left:"+p+"%"}),h("i",{style:"left:"+p+"%"})]),h("div",{class:"rl num"},[h("span",{text:U.num(s.lo,2,0)}),h("span",{text:"Market estimate"}),h("span",{text:U.num(s.hi,2,0)})])]))}
    else if(m.cond){var c=m.cond,f=function(v){return v==null?"No trades yet":sfmt(v,c.unit==="$"?"$":"")};
      body.push(h("div",{class:"cond"},[h("div",{},[h("small",{text:"If "+c.if.toLowerCase()}),h("b",{class:"num",text:f(c.a)})]),h("div",{},[h("small",{text:"If not"}),h("b",{class:"num",text:f(c.b)})])]))}
    var live=m.status==="Live",tb=h("span",{class:"badge",text:m.type});
    return[h("div",{class:"q"},[h("div",{class:"pfp",text:m.q.charAt(0)}),h("span",{text:m.q})])].concat(body,[
      h("div",{class:"foot"},[h("div",{class:"meta"},[h("span",{class:"num",text:money(m.vol)+" Vol."}),h("i"),h("span",{text:live?"LIVE":m.status==="Open"?(closeOf(m)?"Closes "+closeOf(m).label:"No close date"):m.status,class:live?"status-live":""})]),
        m.isNew?h("span",{class:"foot-b"},[h("span",{class:"badge new",text:"New"}),tb]):tb])])}
  function card(m){return h("div",{class:"mcell","data-key":"m"+m.id},[h("button",{class:"mcard",type:"button",onclick:function(e){var o=e.target.closest("[data-o]"),s=e.target.closest("[data-side]");openPanel(m,{pick:o?+o.dataset.o:0,side:s?s.dataset.side:"Yes"})},"aria-label":m.q+", "+m.type+(m.isNew?", new":"")},cardBody(m)),star(m)])}

  /* explicit table roles: on phones the table is laid out as cards, which drops the native semantics (see shell.css) */
  function roles(t){t.setAttribute("role","table");Array.prototype.forEach.call(t.querySelectorAll("thead,tbody,tr,th,td"),function(n){n.setAttribute("role",{THEAD:"rowgroup",TBODY:"rowgroup",TR:"row",TH:"columnheader",TD:"cell"}[n.tagName])});return t}
  function estText(m){return m.scalar.per?U.num(m.scalar.est,2,0)+" "+m.scalar.per:sfmt(m.scalar.est,m.scalar.unit)}
  function leadText(m){if(m.outs&&!m.outs.length)return"No outcomes yet";var l=lead(m);if(l)return l[0]+" · "+pc(l[1]);
    if(m.scalar)return"Estimate "+estText(m);
    return m.cond.a==null?"No trades yet":"Pass "+U.num(m.cond.a,2,0)+" / fail "+U.num(m.cond.b,2,0)}
  function table(list){var w=h("div",{class:"tbl-wrap rtbl app-tbl"}),t=h("table"),hd=h("tr"),f=document.createDocumentFragment();
    f.appendChild(w);
    [["Market",""],["Type",""],["Leading outcome",""],["Volume","r"],["Liquidity","r"],["Closes",""],["Status",""],["Saved","r c-sv"]].forEach(function(c){hd.appendChild(h("th",{class:c[1],scope:"col",text:c[0]}))});
    t.appendChild(h("thead",{},[hd]));var tb=h("tbody");
    list.forEach(function(m){
      var r=h("tr",{tabindex:"0","data-key":"r"+m.id,onclick:function(){openPanel(m)},onkeydown:function(e){if(e.target===e.currentTarget&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openPanel(m)}}},[
        h("td",{class:"mq c-q"},m.isNew?[h("span",{class:"badge new",text:"New"})," "+m.q]:[m.q]),h("td",{class:"c-ty"},[h("span",{class:"badge",text:m.type})]),h("td",{class:"num c-lo","data-label":"Leading outcome",text:leadText(m)}),h("td",{class:"r num c-vo","data-label":"Volume",text:money(m.vol)}),
        h("td",{class:"r num c-li","data-label":"Liquidity",text:money(m.liq)}),h("td",{class:"c-cl","data-label":"Closes",text:(closeOf(m)||{label:"Not set"}).label}),h("td",{class:"c-st","data-status":m.status,text:m.status}),h("td",{class:"r c-sv"},[star(m)])]);tb.appendChild(r)});
    t.appendChild(tb);w.appendChild(roles(t));return f}

  function render(){var list=sorted(M.filter(matches)),out=document.getElementById("out"),f=h("div");
    /* a filtered load that failed or came back empty says so in the list, with its next action; the filters stay usable */
    if(listErr||listEmpty){document.getElementById("count").textContent="";
      f.appendChild(listErr?DM.errorView(listErr,{level:"panel",hl:"h2",subject:"the markets",retry:function(){DM.holdFocus(out);refilter()}})
        :DM.emptyView({level:"panel",hl:"h2",title:"No markets here yet",text:"Nothing has been created for this selection yet. Clear the filters to see every market, or create the first one.",
          action:{text:"Clear filters",onclick:clearFilters},secondary:{text:"Create a market",onclick:function(){cmOpen()}}}));
      patch(out,f);return}
    document.getElementById("count").textContent=list.length===M.length?M.length+" markets":list.length+" of "+M.length+" markets";
    if(!list.length&&st.saved&&!savedCount()&&DM)f.appendChild(DM.emptyView({level:"panel",hl:"h2",kind:"Saved",title:"Saved markets",text:"No saved markets. Press the star on a market to save it.",
      action:{text:"Show all markets",onclick:function(){clearFilters();countEl.setAttribute("tabindex","-1");countEl.focus({preventScroll:true})}}}));
    else if(!list.length)f.appendChild(h("div",{class:"empty"},["No markets match these filters. ",h("button",{class:"wl-link",type:"button",text:"Clear filters",onclick:function(){clearFilters();countEl.setAttribute("tabindex","-1");countEl.focus({preventScroll:true})}})]));
    else if(st.view==="table")f.appendChild(table(list));else{var g=h("div",{class:"mgrid"});list.forEach(function(m){g.appendChild(card(m))});f.appendChild(g)}
    patch(out,f,{flip:".mcell, tbody tr"})}

  /* detail panel + trade ticket */
  var lastFocus=null,flow=null,redrawTicket=null;
  /* Close, Escape and the scrim: a sheet that this page pushed a history entry for closes by going back, and popstate does the closing; a sheet
     opened from the address (or one whose entry is gone) closes at once and takes ?m= out of the address */
  function closePanel(){if(closing)return;
    if(pushed&&openId!=null){closing=true;try{history.back();setTimeout(function(){if(closing&&openId!=null){closeNow();urlSync()}},600);return}catch(e){closing=false}}
    closeNow();urlSync()}
  function closeNow(){var r=document.getElementById("panel-root"),p=r.querySelector(".panel"),s=r.querySelector(".scrim");document.removeEventListener("keydown",esc);
    openId=null;pushed=false;closing=false;detSlot.cancel();if(flow)flow.reset();flow=null;redrawTicket=null;
    var clear=function(){if(!p||p.isConnected)r.textContent=""};
    if(window.Motion&&p)Motion.exit([p,s],clear);else{clear();if(window.Motion&&Motion.sheetOff)Motion.sheetOff()}/* focus returns after the exit has finished, so the restyle it causes never lands in the middle of the slide */
    if(lastFocus){var lf=lastFocus,back=function(){if(lf.isConnected)lf.focus({preventScroll:true})};if(window.Motion&&!Motion.reduced())setTimeout(back,300);else back()}}
  /* Escape closes; Tab and Shift+Tab stay inside the open panel. While the wallet sheet is open above it, it waits. */
  function esc(e){if(e.defaultPrevented||U.covered("panel-root"))return;if(e.key==="Escape"){closePanel();return}if(e.key!=="Tab")return;var p=document.querySelector("#panel-root .panel");if(!p)return;
    var f=[].filter.call(p.querySelectorAll("button,input,select,[tabindex]:not([tabindex='-1'])"),function(n){return!n.disabled&&n.getClientRects().length});if(!f.length)return;
    var a=f[0],z=f[f.length-1];if(e.shiftKey&&(document.activeElement===a||!p.contains(document.activeElement))){e.preventDefault();z.focus()}else if(!e.shiftKey&&(document.activeElement===z||!p.contains(document.activeElement))){e.preventDefault();a.focus()}}
  /* a made-up walk that ends on end (0 to 1); the same seed gives the same history */
  function walk(seed,end){var pts=[],v=Math.max(.05,end-.18),n=24,i;for(i=0;i<n;i++){seed=(seed*9301+49297)%233280;v+= (seed/233280-.5)*.06+(end-v)*.08;pts.push(Math.min(.97,Math.max(.03,v)))}
    pts[n-1]=end;return pts}
  /* One line (outcome markets, scalar markets) or several (o.lines: end, colour, dash) on one scale. o: title, label (the chart's text alternative), right (the head's second text). */
  function spark(seed,end,name,won,o){o=o||{};var L=o.lines||[{end:end,col:"var(--violet)"}],P=L.map(function(l,k){return walk(seed+k*101,l.end)}),all=[].concat.apply([],P),n=P[0].length;
    var lo=Math.min.apply(null,all),hi=Math.max.apply(null,all),pad=Math.max(.02,(hi-lo)*.12);lo-=pad;hi+=pad;
    var Y=function(p){return((hi-p)/(hi-lo)*64).toFixed(1)},D=P.map(function(pts){return pts.map(function(p,i){return(i?"L":"M")+(i/(n-1)*300).toFixed(1)+" "+Y(p)}).join(" ")});
    var NS="http://www.w3.org/2000/svg",s=document.createElementNS(NS,"svg");s.setAttribute("viewBox","0 0 300 64");s.setAttribute("preserveAspectRatio","none");s.setAttribute("class","spark");s.setAttribute("role","img");
    s.setAttribute("aria-label",o.label||"Price history of "+name+", ending at "+pc(end));
    if(L.length===1){var a=document.createElementNS(NS,"path");a.setAttribute("class","m-area");a.setAttribute("d",D[0]+" L300 64 L0 64 Z");a.setAttribute("fill","var(--violet)");a.setAttribute("fill-opacity",".12");s.appendChild(a)}
    L.forEach(function(l,k){var p=document.createElementNS(NS,"path");p.setAttribute("class","m-line");p.setAttribute("d",D[k]);p.setAttribute("fill","none");p.setAttribute("stroke",l.col);p.setAttribute("stroke-width","2");p.setAttribute("vector-effect","non-scaling-stroke");if(l.dash)p.setAttribute("stroke-dasharray",l.dash);s.appendChild(p)});
    var key=o.lines?h("div",{class:"legend"},o.lines.map(function(l){return h("span",{},[h("i",{class:"sw",style:"border-color:"+l.col+(l.dash?";border-top-style:dashed":"")}),l.name])})):null;
    return h("div",{class:"spark-box"},[h("div",{class:"spark-head"},[h("span",{text:o.title||"Price history"}),o.lines?null:h("span",{text:o.right||(won?"Winner: ":"Leading: ")+name})]),key,s])}
  /* the history of a scalar or conditional market: a scalar's estimate across its range, or both branches of a conditional (as in the Futarchy chart) */
  function history(m){
    if(m.scalar){var s=m.scalar,sp=Math.max(.03,Math.min(.97,(s.est-s.lo)/((s.hi-s.lo)||1)));
      return spark(m.id*37,sp,m.q,false,{title:"Estimate history",right:"Estimate "+estText(m),label:"Estimate history of "+m.q+", ending at "+estText(m)})}
    var c=m.cond;if(!c||c.a==null||c.b==null)return null;var mx=Math.max(c.a,c.b)||1,f=function(v){return sfmt(v,c.unit==="$"?"$":"")},ya="If "+c.if.toLowerCase();
    return spark(m.id*37,0,m.q,false,{title:"Estimate history",label:"Estimate history of "+m.q+": "+ya.toLowerCase()+", ending at "+f(c.a)+"; if not, ending at "+f(c.b),
      lines:[{end:.2+.6*c.a/mx,col:"var(--pos)",name:ya},{end:.2+.6*c.b/mx,col:"var(--neg)",dash:"7 5",name:"If not"}]})}
  /* the sheet's body while its details load: the real tiles' labels, outcome rows, the price chart and the ticket, as placeholders */
  function skDetail(m){var S=DM.sk,n=m.outs?Math.min(m.outs.length,4):0,k=[];
    k.push(h("div",{class:"kv"},["Volume","Liquidity","Closes","Status"].map(function(l){return h("div",{},[h("small",{text:l}),h("b",{},[S("56%")])])})));
    k.push(h("div",{class:"panel-c rules"},[S("18ch")]));
    if(n){k.push(h("div",{class:"olist"},m.outs.slice(0,n).map(function(o,i){return h("div",{class:"orow"},[h("span",{},[S([62,48,56,40][i]+"%")]),S("3ch")])})))}
    else k.push(h("div",{class:"mcard static"},[DM.skBlock("sk-box","height:64px")]));
    if(m.outs||m.scalar||(m.cond&&m.cond.a!=null&&m.cond.b!=null))k.push(h("div",{class:"spark-box"},[h("div",{class:"spark-head"},[S("9ch"),S("12ch")]),DM.skBlock("sk-box","height:64px;margin-top:8px;border-radius:4px")]));
    k.push(h("div",{class:"ticket"},[DM.skBlock("sk-box","height:var(--ctl);width:200px;max-width:100%;border-radius:999px"),h("div",{class:"field-grp"},[h("label",{},[S("10ch")]),DM.skBlock("sk-box","height:var(--ctl);border-radius:999px")]),
      h("div",{class:"line"},[S("12ch"),S("5ch")]),h("div",{class:"line"},[S("6ch"),S("5ch")]),DM.skBlock("sk-box","height:var(--tap)")]));
    return h("div",{class:"dm-skel"},k)}
  /* The sheet bar's More actions menu: Copy link (this page's address with the filters and ?m=<id>, which opens the same market on load) and View on explorer,
     a control of the live product that the concept note names */
  function moreMenu(m){var mn=U.menu({label:"More actions",items:[
    ["Copy link",function(b){W.copyText(shareUrl(m.id),function(ok){mn.say(ok?"Copied":"Not copied");W.announce(ok?"Link copied.":"Copying is blocked here.")},b)}],
    ["View on explorer",function(b){U.concept("Not part of this concept. In the product this opens the market on the chain explorer.",b)}]]});return mn}
  /* from: nothing for a press in the page (pushes an entry), "load" for the address on load, "pop" for Back or Forward */
  function openPanel(m,init,from){lastFocus=document.activeElement;var root=document.getElementById("panel-root");root.textContent="";detSlot.cancel();
    openId=m.id;closing=false;pushed=false;
    if(from==="pop")pushed=!!(history.state&&history.state.m!=null);
    else if(!from){try{history.pushState({m:m.id},"",here(m.id));pushed=true}catch(e){}}
    /* the pinned bar (badge, the title we already know, More actions, Close) shows at once; the body loads below it */
    var body=h("div",{class:"dm-body"}),p=h("div",{class:"panel",role:"dialog","aria-modal":"true","aria-label":m.q},[U.sheetTop(h("span",{class:"badge",text:m.isNew?"New · "+m.type:m.type}),m.q,closePanel,moreMenu(m).el),body]);
    root.appendChild(h("div",{class:"scrim",onclick:closePanel}));root.appendChild(p);document.addEventListener("keydown",esc);p.querySelector(".panel-top .pt-x").focus();
    if(window.Motion){Motion.scan(p);if(Motion.panelIn)Motion.panelIn(root)}
    function load(){detSlot.run({key:"app:market:"+m.id,cacheLabel:"Market: "+m.q,producer:function(){return m},scope:"details",initial:true,busy:p,label:"Loading market details",
      show:function(){U.clear(body);body.appendChild(skDetail(m))},
      apply:function(res,info){if(!p.isConnected)return;U.clear(body);
        if(res.empty){body.appendChild(DM.emptyView({level:"sheet",title:"No details yet",text:"This market has no details to show yet. Check again in a moment.",action:{text:"Check again",onclick:function(){DM.holdFocus(p);load()}}}));return}
        fill(info)},
      fail:function(e){if(!p.isConnected)return;U.clear(body);
        body.appendChild(DM.errorView(e,{level:"sheet",subject:"the market details",retry:function(){DM.holdFocus(p);load()},back:{text:"Back to markets",onclick:closePanel},
          titles:{notfound:"This market no longer exists"},texts:{notfound:"It may have been removed after it resolved. Go back to the list to find another market."}}))}})}
    load();
    function fill(info){
    /* a market with no outcomes has nothing to trade: the sheet says so in place of the details */
    if(m.outs&&!m.outs.length){body.appendChild(DM.emptyView({level:"sheet",title:"No outcomes yet",text:"This market has no outcomes to trade yet."}));return}
    /* side is Yes or No on every type: Yes is Buy Yes, Long, or the "If" branch; No is Buy No, Short, or "If not". A two-outcome market has no side: its outcome rows are the choice. */
    var bin=!!m.outs&&m.outs.length===2,pick=init&&init.pick<(m.outs||[]).length?init.pick:0,side=!bin&&init&&init.side==="No"?"No":"Yes",amt=50;
    var sp=m.scalar?Math.max(0,Math.min(1,(m.scalar.est-m.scalar.lo)/((m.scalar.hi-m.scalar.lo)||1))):.5;
    var cp=m.cond&&m.cond.a!=null&&m.cond.b!=null&&m.cond.a+m.cond.b>0?m.cond.a/(m.cond.a+m.cond.b):.5;
    var base=function(){return m.outs?m.outs[pick][1]:m.scalar?sp:cp};
    var price=function(){return side==="Yes"?base():1-base()};
    var sideName=function(){return m.scalar?(side==="Yes"?"Long":"Short"):m.cond?(side==="Yes"?"If "+m.cond.if.toLowerCase():"If not"):side};
    var tk=h("div",{class:"ticket","data-tx":"app"});
    /* the ticket runs the whole trade in place: form, review, signature, result (js/wallet.js) */
    flow=W.flow({box:function(){return tk},onChange:function(){drawTicket()}});
    var fl=flow;
    function focusPlace(){var b=tk.querySelector("[data-tx-place]");if(b)b.focus()}
    function place(){var p=Math.min(.99,Math.max(.01,price())),a=amt,s=a/p,o=m.outs?m.outs[pick][0]:null,sd=sideName();
      fl.place(a,function(){return{amount:a,meta:{type:"Trade",market:m.q,mid:m.id,product:"app",outcome:o,side:bin?"":sd,shares:s,price:p,status:m.status},
        rows:[["Market",m.q,"tx-q"]].concat(o?[["Outcome",o,"tx-q"]]:[],bin?[]:[["Side",sd]],[["Amount",W.money(a)+" USDC","tx-tot"],["Price per share","$"+p.toFixed(2)],["Shares",U.shares(s)],["Max slippage","1%"],["Minimum shares",U.shares(s*.99)],[m.scalar?"Maximum payout":"Payout if correct","$"+U.num(s,2)],["Network fee","Free in demo","tx-free"]]),
        done:"You bought "+U.shares(s)+" "+(o?(bin?"shares on "+o:side+" shares on "+o):m.scalar?sd.toLowerCase()+" shares":"shares on the branch \u201c"+sd.toLowerCase()+"\u201d")+"."}},"amt")}
    var drawTicket=function(){var p=Math.min(.99,Math.max(.01,price())),f=h("div");
      tk.style.minHeight=fl.style()?fl.hold+"px":"";
      if(fl.step!=="form"){f.appendChild(fl.view());patch(tk,f);return}
      if(m.status!=="Open"&&m.status!=="Live"){
        /* a resolved market offers Redeem to a wallet that holds the winning side; any other closed market just says so */
        if(m.status==="Resolved")W.redeem({flow:fl,market:m.q,mid:m.id,product:"app",after:focusPlace,win:function(x){return x.outcome===resOf(m).answer&&(!x.side||x.side==="Yes")}}).forEach(function(n){f.appendChild(n)});
        else f.appendChild(h("p",{text:"Trading is closed for this market.",class:"note"}));
        patch(tk,f);return}
      var tk0=tk;tk=f;
      var labs=m.scalar?["Long","Short"]:m.cond?["If "+m.cond.if.toLowerCase(),"If not"]:["Buy Yes","Buy No"];
      if(!bin)tk.appendChild(h("div",{class:"seg",role:"group","aria-label":m.cond?"Branch":"Side"},["Yes","No"].map(function(s,i){return h("button",{type:"button","aria-pressed":String(side===s),text:labs[i],onclick:function(){side=s;drawTicket()}})})));
      if(m.scalar)tk.appendChild(h("p",{class:"note",text:"Long gains as the value resolves higher; short gains as it resolves lower."}));
      if(m.cond)tk.appendChild(h("p",{class:"note",text:"If the other branch happens, this trade is refunded."}));
      W.holdLines(m.id,"app").forEach(function(n){tk.appendChild(n)});
      var err=W.amountError(amt,fl.tried),at=W.amountAttrs("amt",err);
      var inp=h("input",{class:"field",type:"number",min:"1",value:String(amt),id:"amt","aria-label":"Amount in USDC","aria-invalid":at["aria-invalid"],"aria-describedby":at["aria-describedby"],
        oninput:function(e){amt=Number(e.target.value)||0;upd(true);W.amountLive(e.target,amt,fl)}});
      tk.appendChild(h("div",{class:"field-grp"},[W.amountLabel("amt","Amount (USDC)"),inp,W.amountErr("amt",err)]));
      var l1=h("span",{class:"num","data-k":"price"}),l2=h("span",{class:"num","data-k":"shares"}),l3=m.scalar?null:h("span",{class:"num","data-k":"payout"});
      tk.appendChild(h("div",{class:"line"},[h("span",{text:"Price per share"}),l1]));tk.appendChild(h("div",{class:"line"},[h("span",{text:"Shares"}),l2]));
      if(m.scalar){var hiT=sfmt(m.scalar.hi,m.scalar.unit),loT=sfmt(m.scalar.lo,m.scalar.unit),up=side==="Yes";
        tk.appendChild(h("div",{class:"line"},[h("span",{text:"At "+(up?hiT:loT)+" or "+(up?"above":"below")}),h("span",{class:"num",text:"$1.00 per share"})]));
        tk.appendChild(h("div",{class:"line"},[h("span",{text:"At "+(up?loT:hiT)+" or "+(up?"below":"above")}),h("span",{class:"num",text:"$0"})]))}
      else tk.appendChild(h("div",{class:"line"},[h("span",{text:"Payout if correct"}),l3]));
      /* live: values tick to the new amount; the spans are looked up because a morph keeps the on-screen nodes */
      function upd(live){var s=Math.max(0,amt)/p,v=[["price","$"+p.toFixed(2)],["shares",U.shares(s)],["payout","$"+U.num(s,2)]];
        v.forEach(function(x){var n=live?tk0.querySelector('[data-k="'+x[0]+'"]'):[l1,l2,l3][["price","shares","payout"].indexOf(x[0])];if(!n)return;
          if(live&&window.Motion)Motion.num(n,x[1]);else n.textContent=x[1]})}upd();
      /* one wallet control per page (the header); until it is connected the ticket action waits, and its hint connects */
      tk.appendChild(W.placeBtn({onPlace:place}));
      var hn=W.hint({after:focusPlace});if(hn)tk.appendChild(hn);tk=tk0;patch(tk,f)};
    redrawTicket=drawTicket;
    var list=null;
    if(m.outs&&m.status==="Resolved"){/* a resolved market is not a choice: plain rows, the winner marked */
      list=h("div",{class:"olist"},m.outs.map(function(o,i){return h("div",{class:"orow","data-key":"o"+i},[h("span",{text:o[0]}),h("span",{class:"pct"},[h("span",{class:"num",text:pc(o[1])}),o[0]===resOf(m).answer?h("span",{class:"won",text:"Won"}):null])])}))}
    else if(m.outs){list=h("div",{class:"olist"},[]);var draw=function(){var f=h("div");m.outs.forEach(function(o,i){f.appendChild(h("button",{type:"button",class:"orow sel","data-key":"o"+i,"aria-pressed":String(pick===i),onclick:function(){pick=i;if(fl.step!=="form")fl.reset();draw();drawTicket()}},[h("span",{text:o[0]}),h("span",{class:"num",text:pc(o[1])})]))});patch(list,f)};draw()}
    else{list=h("div",{class:"mcard static"},cardBody(m).slice(1,-1))}
    var ld=lead(m),cl=closeOf(m),hist=ld?spark(m.id*37,ld[1],ld[0],m.status==="Resolved"):history(m);
    [h("div",{class:"kv"},[h("div",{},[h("small",{text:"Volume"}),h("b",{class:"num",text:money(m.vol)})]),h("div",{},[h("small",{text:m.status==="Resolved"?"Result":"Liquidity"}),h("b",{class:m.status==="Resolved"?null:"num",text:m.status==="Resolved"?(resOf(m).answer||"Not set"):money(m.liq)})]),h("div",{},[h("small",{text:cl&&cl.past?"Closed":"Closes"}),h("b",{text:cl?cl.full:"Not set"}),cl&&cl.rel?h("span",{class:"rel",text:cl.rel}):null]),h("div",{},[h("small",{text:"Status"}),h("b",{text:m.status})])]),
      rulesBox(m,cl),list,hist,tk].forEach(function(n){if(n)body.appendChild(n)});
    drawTicket();
    /* the same entrance whether the details were at hand or had to load; a load after a skeleton starts at once */
    if(window.Motion){Motion.scan(p);var late=info&&info.shown;Motion.stagger(p.querySelectorAll((late?"":".pt-title, ")+".kv > div, .rules, .sel, .olist > .orow:not(.sel), .mcard.static, .spark-box, .ticket"),late?0:140,35);if(hist)Motion.draw(p.querySelector(".spark"),{delay:late?180:320})}}}

  /* ======================= create a market =======================
     A sheet with the real form, a live preview drawn by the explorer's own card, and the wallet pattern on its action:
     disconnected it connects (the wallet sheet opens above and the form keeps its values); connected it validates,
     then review, signature and result run inside the same sheet. A created market joins MARKETS and every render path. */
  var TYPE_NOTE={"Categorical":"One outcome wins. Each outcome trades Yes and No.","Multi-categorical":"Any number of outcomes can come true. Each trades on its own.",
    "Scalar":"Trades a number inside a range: long gains as it resolves higher.","Multi-scalar":"Trades which range a number lands in, one outcome per range.",
    "Conditional":"Trades a metric if a condition happens. Trades are refunded if it does not."};
  var uid=0,cm=null,pending=[],cmFocus=null;
  function orow(v){return{id:++uid,v:v||""}}
  function mrow(l,a,b){return{id:++uid,l:l||"",min:a||"",max:b||""}}
  function fresh(){return{q:"",cat:"",catNew:"",type:"Categorical",outs:[orow(),orow()],other:false,sc:{min:"",max:"",unit:"",est:""},ms:[mrow(),mrow()],cond:{if:"",metric:"",unit:""},date:"",liq:"100",touched:{},sub:false}}
  function allCats(){return M.map(function(m){return m.cat}).filter(function(c,i,a){return a.indexOf(c)===i})}
  function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
  function tomorrow(){var d=new Date();d.setDate(d.getDate()+1);return iso(d)}
  function closeTs(v){if(!v)return null;var p=v.split("-");return Date.UTC(+p[0],+p[1]-1,+p[2],12)}
  function num(v){return v===""||v==null||isNaN(+v)?null:+v}
  function isOutT(t){return t==="Categorical"||t==="Multi-categorical"}
  function errs(c){var e={},q=c.q.trim(),bal=W.state;
    if(!q)e["cm-q"]="Enter a question.";else if(q.length<10)e["cm-q"]="Use at least 10 characters.";else if(q.length>120)e["cm-q"]="Keep the question to 120 characters or fewer.";
    if(!c.cat)e["cm-cat"]="Choose a category.";else if(c.cat==="__new"){var n=c.catNew.trim();if(n.length<2||n.length>24)e["cm-cat-new"]="Name the category in 2 to 24 characters.";}
    if(isOutT(c.type)){var seen={};c.outs.forEach(function(r){var v=r.v.trim().toLowerCase();if(!v)e["cm-o-"+r.id]="Enter an outcome.";else if(seen[v]||(c.other&&v==="other"))e["cm-o-"+r.id]="This outcome is already listed.";seen[v]=1})}
    else if(c.type==="Scalar"){var a=num(c.sc.min),b=num(c.sc.max),s=num(c.sc.est);
      if(a==null)e["cm-min"]="Enter a minimum.";if(b==null)e["cm-max"]="Enter a maximum.";else if(a!=null&&b<=a)e["cm-max"]="The maximum must be more than the minimum.";
      if(s==null)e["cm-est"]="Enter your initial estimate.";else if(a!=null&&b!=null&&b>a&&(s<a||s>b))e["cm-est"]="The estimate must sit between the minimum and the maximum."}
    else if(c.type==="Multi-scalar"){var ls={};c.ms.forEach(function(r){var l=r.l.trim().toLowerCase(),a=num(r.min),b=num(r.max);
      if(!l)e["cm-r-"+r.id+"-l"]="Name this range.";else if(ls[l])e["cm-r-"+r.id+"-l"]="Each range needs its own name.";ls[l]=1;
      if(a==null||b==null)e["cm-r-"+r.id+"-min"]="Enter a minimum and a maximum.";else if(b<=a)e["cm-r-"+r.id+"-min"]="The maximum must be more than the minimum."})}
    else{if(c.cond.if.trim().length<5)e["cm-if"]="Describe the condition in at least 5 characters.";if(c.cond.metric.trim().length<3)e["cm-metric"]="Name the metric in at least 3 characters."}
    if(!c.date)e["cm-date"]="Pick a close date.";else if(c.date<tomorrow())e["cm-date"]="Pick a date after today.";
    var l=num(c.liq);if(l==null||l<50)e["cm-liq"]="Add at least 50 USDC of liquidity.";else if(bal.connected&&l>bal.balance+1e-9)e["cm-liq"]="More than your balance of "+W.money(bal.balance)+" USDC.";
    return e}
  var LABEL={"cm-q":"Question","cm-cat":"Category","cm-cat-new":"Category name","cm-min":"Minimum","cm-max":"Maximum","cm-est":"Initial estimate","cm-if":"Condition","cm-metric":"Metric","cm-date":"Close date","cm-liq":"Initial liquidity"};
  function labelOf(id){if(LABEL[id])return LABEL[id];var k,i;
    for(i=0;i<cm.outs.length;i++)if(id==="cm-o-"+cm.outs[i].id)return"Outcome "+(i+1);
    for(i=0;i<cm.ms.length;i++){k="cm-r-"+cm.ms[i].id;if(id===k+"-l")return"Range "+(i+1)+" name";if(id===k+"-min")return"Range "+(i+1)+" values"}return"Field"}
  function toMarket(c,id){var t=c.type,m={id:id||0,q:c.q.trim()||"Your question appears here",type:t,cat:c.cat==="__new"?(c.catNew.trim()||"New category"):(c.cat||"No category"),
      status:"Open",vol:0,liq:Math.max(0,num(c.liq)||0),closeTs:closeTs(c.date),isNew:id?Date.now():1};
    if(isOutT(t)){var o=c.outs.map(function(r,i){return r.v.trim()||"Outcome "+(i+1)}).concat(c.other?["Other"]:[]);m.outs=o.map(function(n){return[n,t==="Categorical"?1/o.length:.5]})}
    else if(t==="Scalar"){var a=num(c.sc.min),b=num(c.sc.max),s=num(c.sc.est);if(a==null)a=0;if(b==null||b<=a)b=a+100;if(s==null||s<a||s>b)s=+(a+(b-a)/2).toFixed(2);m.scalar={lo:a,hi:b,est:s,unit:c.sc.unit.trim()}}
    else if(t==="Multi-scalar"){var rs=c.ms.map(function(r,i){var a=num(r.min),b=num(r.max);return(r.l.trim()||"Range "+(i+1))+(a!=null&&b!=null?" ("+a+" to "+b+")":"")});m.outs=rs.map(function(n){return[n,1/rs.length]})}
    else m.cond={if:c.cond.if.trim()||"The condition happens",metric:c.cond.metric.trim(),unit:c.cond.unit.trim(),a:null,b:null};
    return m}
  var cflow=W.flow({box:function(){return document.querySelector('#sheet-root [data-tx="cm"]')},onChange:function(){cmDraw()},
    t:{review:"Review your market",done:"Market created",doneBtn:"View in explorer",edit:"Edit market"},
    onSuccess:function(f){var m=toMarket(cm,Date.now()%1e9+1000);pending.push(m);store([m].concat(stored()));cm=fresh()},
    onDone:function(){cmClose(true)}});

  function shown(id){return cm.sub||cm.touched[id]}
  /* inputs: id, error wiring and handlers from one place. onchange marks the field touched (its error shows from then) */
  function ctl(tag,id,extra,set,kids){var e=errs(cm)[id],show=e&&shown(id),d=[show?id+"-err":null,extra&&extra.desc].filter(Boolean).join(" ");
    var a={class:"field",id:id,"aria-invalid":show?"true":null,"aria-describedby":d||null,oninput:function(ev){set(ev.target.value);cmDraw()},onchange:function(ev){set(ev.target.value);cm.touched[(extra&&extra.tid)||id]=1;cmDraw()}};
    for(var k in extra||{})if(k!=="desc"&&k!=="tid")a[k]=extra[k];return h(tag,a,kids)}
  function errP(id){var e=errs(cm)[id];return e&&shown(id)?h("p",{class:"field-err",id:id+"-err",text:e}):null}
  function grp(id,label,control,more){return h("div",{class:"field-grp","data-key":"g-"+id},[h("label",{for:id,text:label}),control].concat(more||[],[errP(id)]))}
  function focusField(id){var n=document.getElementById(id);if(n)n.focus()}
  function cmForm(){var c=cm,e=errs(c),ids=Object.keys(e),kids=[];
    /* the error summary appears after a submit with problems, takes focus, and links each problem to its field */
    if(c.sub&&ids.length)kids.push(h("div",{class:"cm-sum",id:"cm-sum",tabindex:"-1","data-key":"cm-sum"},[h("h3",{text:ids.length===1?"Fix 1 field to continue":"Fix "+ids.length+" fields to continue"}),
      h("ul",{},ids.map(function(id){return h("li",{},[h("button",{class:"wl-link",type:"button",onclick:function(){focusField(id)}},[labelOf(id)+": "+e[id]])])}))]));
    var f=[];
    var ql=c.q.trim().length;
    f.push(grp("cm-q","Question",ctl("input","cm-q",{type:"text",value:c.q,autocomplete:"off",placeholder:"Will the city open the new line by June 30?",desc:"cm-q-n"},function(v){c.q=v}),
      [h("span",{class:"cm-count num"+(ql>120?" over":""),id:"cm-q-n",text:ql+" of 120 characters"})]));
    var cats=allCats();
    f.push(grp("cm-cat","Category",ctl("select","cm-cat",{},function(v){c.cat=v},[h("option",{value:"",text:"Choose a category",selected:c.cat===""?"selected":null})].concat(
      cats.map(function(x){return h("option",{value:x,text:x,selected:c.cat===x?"selected":null})}),[h("option",{value:"__new",text:"New category",selected:c.cat==="__new"?"selected":null})]))));
    if(c.cat==="__new")f.push(grp("cm-cat-new","Category name",ctl("input","cm-cat-new",{type:"text",value:c.catNew,autocomplete:"off"},function(v){c.catNew=v})));
    f.push(grp("cm-type","Market type",ctl("select","cm-type",{desc:"cm-type-n"},function(v){if(v!==c.type){c.type=v}},TYPES.map(function(t){return h("option",{value:t,text:t,selected:c.type===t?"selected":null})})),
      [h("p",{class:"note",id:"cm-type-n",text:TYPE_NOTE[c.type]})]));
    f.push(typeFields());
    f.push(grp("cm-date","Close date",ctl("input","cm-date",{type:"date",value:c.date,min:tomorrow()},function(v){c.date=v})));
    f.push(grp("cm-liq","Initial liquidity (USDC)",ctl("input","cm-liq",{type:"number",min:"50",step:"1",inputmode:"decimal",value:c.liq,desc:"cm-liq-n"},function(v){c.liq=v}),
      [h("p",{class:"note",id:"cm-liq-n",text:"Locked in the market as its starting liquidity. At least 50 USDC."})]));
    kids.push(h("div",{class:"cm-fields","data-key":"cm-fields"},f));
    var pv=toMarket(c),card=h("div",{class:"mcard static cm-card"},cardBody(pv));
    kids.push(h("section",{class:"cm-prev","aria-labelledby":"cm-prev-h","data-key":"cm-prev"},[h("h3",{class:"cm-prev-h",id:"cm-prev-h",text:"Preview"}),card,h("p",{class:"note",text:"This is how the market appears in the explorer."})]));
    var on=W.state.connected;
    kids.push(h("div",{class:"cm-acts","data-key":"cm-acts"},[on?h("button",{class:"btn lg",type:"submit","data-tx-place":"",text:"Create market"})
      :h("button",{class:"btn lg",type:"button",text:"Connect wallet to create",onclick:function(e){W.openConnect({from:e.currentTarget,after:function(){var b=document.querySelector('#sheet-root [data-tx-place]');if(b)b.focus()}})}})]));
    return h("form",{class:"cm",novalidate:"",onsubmit:function(ev){ev.preventDefault();submit()}},kids)}
  function typeFields(){var c=cm,t=c.type;
    if(isOutT(t)){var n=c.outs.length;
      return h("fieldset",{class:"cm-set","data-key":"set-o"},[h("legend",{text:"Outcomes"}),h("p",{class:"note",id:"cm-o-n",text:"Between 2 and 8, each different."})].concat(
        c.outs.map(function(r,i){var id="cm-o-"+r.id;return h("div",{class:"cm-orow","data-key":"o"+r.id},[
          h("div",{class:"cm-line"},[ctl("input",id,{type:"text",value:r.v,autocomplete:"off","aria-label":"Outcome "+(i+1),desc:"cm-o-n"},function(v){r.v=v}),
            h("button",{class:"btn soft cm-rm",type:"button","aria-label":"Remove outcome "+(i+1),disabled:n<=2?"":null,onclick:function(){var k=c.outs.indexOf(r);c.outs.splice(k,1);cmDraw();var nx=c.outs[Math.max(0,k-1)];focusField("cm-o-"+nx.id)}},["Remove"])]),errP(id)])}),
        [h("div",{class:"cm-line cm-add"},[h("button",{class:"btn soft",type:"button",disabled:n>=8?"":null,onclick:function(){var r=orow();c.outs.push(r);cmDraw();focusField("cm-o-"+r.id)}},["Add outcome"]),
          h("label",{class:"check"},[h("input",{type:"checkbox",checked:c.other?"checked":null,onchange:function(ev){c.other=ev.target.checked;cmDraw()}}),"Add an “Other” outcome"])])]))}
    if(t==="Scalar")return h("fieldset",{class:"cm-set","data-key":"set-s"},[h("legend",{text:"Range"}),h("div",{class:"cm-grid"},[
      grp("cm-min","Minimum",ctl("input","cm-min",{type:"number",step:"any",value:c.sc.min},function(v){c.sc.min=v})),
      grp("cm-max","Maximum",ctl("input","cm-max",{type:"number",step:"any",value:c.sc.max},function(v){c.sc.max=v})),
      grp("cm-unit","Unit (optional)",ctl("input","cm-unit",{type:"text",value:c.sc.unit,autocomplete:"off",placeholder:"$, %, °C, users"},function(v){c.sc.unit=v})),
      grp("cm-est","Initial estimate",ctl("input","cm-est",{type:"number",step:"any",value:c.sc.est},function(v){c.sc.est=v}))])]);
    if(t==="Multi-scalar"){var k=c.ms.length;
      return h("fieldset",{class:"cm-set","data-key":"set-m"},[h("legend",{text:"Ranges"}),h("p",{class:"note",text:"Two or more named ranges, one outcome each."})].concat(
        c.ms.map(function(r,i){var b="cm-r-"+r.id;return h("div",{class:"cm-mrow","data-key":"r"+r.id},[
          h("div",{class:"cm-line"},[ctl("input",b+"-l",{type:"text",value:r.l,autocomplete:"off","aria-label":"Range "+(i+1)+" name",placeholder:"Range "+(i+1)+" name"},function(v){r.l=v}),
            h("button",{class:"btn soft cm-rm",type:"button","aria-label":"Remove range "+(i+1),disabled:k<=2?"":null,onclick:function(){var j=c.ms.indexOf(r);c.ms.splice(j,1);cmDraw();focusField("cm-r-"+c.ms[Math.max(0,j-1)].id+"-l")}},["Remove"])]),
          errP(b+"-l"),
          h("div",{class:"cm-line cm-mm"},[ctl("input",b+"-min",{type:"number",step:"any",value:r.min,"aria-label":"Range "+(i+1)+" minimum",placeholder:"Min"},function(v){r.min=v}),
            h("span",{class:"muted","aria-hidden":"true",text:"to"}),
            ctl("input",b+"-max",{type:"number",step:"any",value:r.max,"aria-label":"Range "+(i+1)+" maximum",placeholder:"Max","aria-invalid":errs(cm)[b+"-min"]&&shown(b+"-min")?"true":null,"aria-describedby":errs(cm)[b+"-min"]&&shown(b+"-min")?b+"-min-err":null,tid:b+"-min"},function(v){r.max=v})]),
          errP(b+"-min")])}),
        [h("div",{class:"cm-line cm-add"},[h("button",{class:"btn soft",type:"button",disabled:k>=6?"":null,onclick:function(){var r=mrow();c.ms.push(r);cmDraw();focusField("cm-r-"+r.id+"-l")}},["Add range"])])]))}
    return h("fieldset",{class:"cm-set","data-key":"set-c"},[h("legend",{text:"Condition and metric"}),
      grp("cm-if","Condition",ctl("input","cm-if",{type:"text",value:c.cond.if,autocomplete:"off",placeholder:"Proposal 42 passes"},function(v){c.cond.if=v})),
      h("div",{class:"cm-grid"},[grp("cm-metric","Metric",ctl("input","cm-metric",{type:"text",value:c.cond.metric,autocomplete:"off",placeholder:"Token price in 30 days"},function(v){c.cond.metric=v})),
        grp("cm-cunit","Unit (optional)",ctl("input","cm-cunit",{type:"text",value:c.cond.unit,autocomplete:"off",placeholder:"$"},function(v){c.cond.unit=v}))])])}
  function submit(){if(!W.state.connected)return;cm.sub=true;var e=errs(cm);
    if(Object.keys(e).length){cmDraw();var s=document.getElementById("cm-sum");if(s)s.focus();return}
    var m=toMarket(cm),liq=num(cm.liq),detail=m.outs?m.outs.map(function(o){return o[0]}).join(", "):m.scalar?m.scalar.lo+" to "+m.scalar.hi+(m.scalar.unit?" "+m.scalar.unit:"")+", estimate "+m.scalar.est:m.cond.if+"; "+m.cond.metric+(m.cond.unit?" ("+m.cond.unit+")":"");
    cflow.review({amount:liq,meta:{type:"Create market",market:m.q},
      rows:[["Question",m.q,"tx-q"],["Category",m.cat],["Type",m.type],[m.outs?(m.type==="Multi-scalar"?"Ranges":"Outcomes"):m.scalar?"Range":"Condition",detail,"tx-q"],["Closes",(closeOf(m)||{full:"Not set"}).full],
        ["Liquidity locked",W.money(liq)+" USDC","tx-tot"],["Network fee","Free in demo","tx-free"]],
      note:"The liquidity stays locked in the market until it resolves.",
      done:"“"+m.q+"” is open for trading. Its liquidity is locked in the market."})}
  function cmDraw(first){if(!cm)return;var body=cflow.step==="form"?cmForm():cflow.view();
    U.sheet({open:true,cls:"cm-sheet",label:"Create a market",title:"Create a market",kids:[h("div",{class:"cm-wrap","data-tx":"cm","data-key":"cm-wrap",style:cflow.style()},[body])],onClose:function(){cmClose(false)}})}
  function cmOpen(){cmFocus=document.activeElement;if(!cm)cm=fresh();cflow.reset();cmDraw(true)}
  /* closing: a market created in the sheet joins the explorer; "View in explorer" also takes you to it */
  function cmClose(view){cflow.reset();U.sheet({open:false,onClose:function(){}});if(view&&tab!=="markets")go("markets");
    if(!pending.length){if(cmFocus&&cmFocus.isConnected)cmFocus.focus();return}
    var add=pending.splice(0),first=add[0];add.slice().reverse().forEach(function(m){M.unshift(m);if(M!==ALL)ALL.unshift(m)});
    /* the first market of an empty explorer brings the explorer back */
    if(pageState==="empty"){pageState="ok";sections(true)}
    if(pageState!=="ok"){if(cmFocus&&cmFocus.isConnected)cmFocus.focus();return}
    if(!matches(first)||listErr||listEmpty){st.cat="All";st.type="";st.status="";st.q="";st.saved=false;qs=snap();listErr=null;listEmpty=false;listSlot.cancel();document.getElementById("out").classList.remove("dm-dim");
      document.getElementById("q").value="";document.getElementById("status").value="";urlSync()}
    stats();cats();types();
    var show=function(){render();var c=document.querySelector('#out [data-key="m'+first.id+'"] .mcard, #out [data-key="r'+first.id+'"]');if(!c)return;
      if(window.Motion){Motion.anim(c,[{boxShadow:"0 0 0 2px var(--violet)"},{boxShadow:"0 0 0 2px transparent"}],{duration:1600,easing:Motion.E.standard,delay:420});Motion.pop(c.querySelectorAll(".badge.new"),260)}
      if(view)c.focus({preventScroll:true})};
    if(view){var y=document.getElementById("count").getBoundingClientRect().top+scrollY-(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0);
      y=Math.max(0,Math.min(y,document.documentElement.scrollHeight-innerHeight));
      if(window.Motion&&!Motion.reduced())Motion.scrollTo(y,show);else{scrollTo(0,y);show()}}
    else{show();if(cmFocus&&cmFocus.isConnected)cmFocus.focus()}}
  document.getElementById("create").onclick=cmOpen;

  /* the wallet changed (connected, disconnected, a balance after a trade): tickets and the form follow */
  W.subscribe(function(){if(redrawTicket)redrawTicket();if(cm&&document.querySelector("#sheet-root .cm-sheet"))cmDraw()});

  U.slashSearch("#q");
  document.getElementById("q").oninput=function(e){st.q=e.target.value;render();clearTimeout(qt);qt=setTimeout(urlSync,300)};
  document.getElementById("cat-m").onchange=function(e){st.cat=e.target.value;cats();refilter()};
  document.getElementById("status").onchange=function(e){st.status=e.target.value;refilter()};
  document.getElementById("sort").onchange=function(e){st.sort=e.target.value;refilter()};
  function view(v){st.view=v;try{localStorage.setItem(VIEWKEY,v)}catch(e){}urlSync();document.getElementById("vg").setAttribute("aria-pressed",String(v==="grid"));document.getElementById("vt").setAttribute("aria-pressed",String(v==="table"));if(pageState==="ok"&&!pageSlot.pending)render()}
  document.getElementById("vg").onclick=function(){view("grid")};document.getElementById("vt").onclick=function(){view("table")};
  /* the controls show the state read from the address */
  document.getElementById("q").value=st.q;document.getElementById("status").value=st.status;document.getElementById("sort").value=st.sort;
  document.getElementById("vg").setAttribute("aria-pressed",String(st.view==="grid"));document.getElementById("vt").setAttribute("aria-pressed",String(st.view==="table"));

  /* ======================= loading =======================
     The page's markets load once (skeleton, error or empty state in place of the list), then a category, status,
     type or sort change is a new query for the list alone: what is on screen dims under a sweep until the answer
     arrives, and a newer query always wins. Search filters the loaded markets at once. */
  var wrap=document.getElementById("explorer"),statsEl=document.getElementById("stats"),filtersEl=wrap.querySelector(".filters"),toolbarEl=wrap.querySelector(".toolbar"),
      countEl=document.getElementById("count"),outEl=document.getElementById("out"),catsEl=document.getElementById("cats"),typesEl=document.getElementById("types");
  var pageBox=h("div",{class:"dm-pagebox",hidden:""});wrap.insertBefore(pageBox,wrap.firstChild);
  function sections(on){[statsEl,filtersEl,countEl,outEl].forEach(function(n){n.hidden=!on});pageBox.hidden=on;if(on)U.clear(pageBox)}
  function skeleton(){var S=DM.sk;sections(true);
    /* the tiles keep their keys, so the real ones morph into these and only the figures change */
    U.clear(statsEl);["Open or live","Total volume","Liquidity"].forEach(function(l){statsEl.appendChild(h("div",{class:"dm-skel","data-key":l},[h("small",{text:l}),h("b",{class:"num"},[S(l==="Open or live"?"2ch":"5ch")])]))});
    U.clear(catsEl);["All","Politics","Sports","Business","Crypto","Pop Culture","Elections","Weather","Science"].forEach(function(c,i){catsEl.appendChild(h("span",{class:"tab dm-skchip","aria-hidden":"true",style:"--sk-d:"+i*40+"ms",text:c}))});
    U.clear(typesEl);["All types"].concat(TYPES.map(function(t){return t+" · 00"}),["Saved · 0"]).forEach(function(c,i){typesEl.appendChild(h("span",{class:"chip dm-skchip","aria-hidden":"true",style:"--sk-d:"+i*40+"ms",text:c}))});
    toolbarEl.classList.add("dm-skz");filtersEl.inert=true;
    countEl.textContent="";countEl.appendChild(S("9ch"));
    U.clear(outEl);outEl.appendChild(skList(st.view==="table"))}
  /* placeholder cards (or table rows) in the list's own layout */
  function skList(table){var S=DM.sk,f=h("div",{class:"dm-skel"});
    if(table){var tb=h("tbody");for(var i=0;i<8;i++)tb.appendChild(h("tr",{class:"dm-skr",style:"--i:"+i},[h("td",{class:"mq c-q"},[S([70,54,82,60,66,48,74,58][i]+"%")]),h("td",{class:"c-ty"},[S("10ch")]),h("td",{class:"num c-lo"},[S("80%")]),
        h("td",{class:"r num c-vo"},[S("5ch")]),h("td",{class:"r num c-li"},[S("5ch")]),h("td",{class:"c-cl"},[S("6ch")]),h("td",{class:"c-st"},[S("5ch")]),h("td",{class:"r c-sv"},[S("2ch")])]));
      var hd=h("tr");["Market","Type","Leading outcome","Volume","Liquidity","Closes","Status","Saved"].forEach(function(c,k){hd.appendChild(h("th",{scope:"col",class:k===3||k===4||k===7?"r":"",text:c}))});
      f.appendChild(h("div",{class:"tbl-wrap rtbl app-tbl","aria-hidden":"true"},[h("table",{},[h("thead",{},[hd]),tb])]));return f}
    var g=h("div",{class:"mgrid","aria-hidden":"true"});
    [[92,58,3],[84,0,2],[96,70,3],[78,0,2],[88,52,3],[74,0,2],[90,64,2],[80,0,3]].forEach(function(c,i){
      g.appendChild(h("div",{class:"mcard static dm-skc",style:"--i:"+i},[h("div",{class:"sk-q"},[DM.skBlock("sk-pfp"),h("span",{class:"sk-stack"},[DM.skBlock("sk-line lg","--w:"+c[0]+"%;height:14px")].concat(c[1]?[DM.skBlock("sk-line","--w:"+c[1]+"%;height:14px")]:[]))])].concat(
        [0,1,2].slice(0,c[2]).map(function(k){return h("div",{class:"sk-row"},[DM.skBlock("sk-line","--w:"+[42,30,48][k]+"%"),DM.skBlock("sk-pill")])}),
        [h("div",{class:"sk-foot"},[DM.skBlock("sk-line","--w:38%"),DM.skBlock("sk-pill")])])))});
    f.appendChild(g);return f}
  function unskeleton(){toolbarEl.classList.remove("dm-skz");filtersEl.inert=false}
  function filtered(){return st.cat!=="All"||st.type||st.status||st.q||st.saved}
  function clearFilters(){st.cat="All";st.type="";st.status="";st.q="";st.saved=false;urlSync();document.getElementById("q").value="";document.getElementById("status").value="";
    cats();types();if(pageState==="ok")refilter();else load({initial:true})}
  function modal(){return[].some.call(document.querySelectorAll('[aria-modal="true"]'),function(n){return!n.closest("[inert]")})}
  function load(o){o=o||{};listSlot.cancel();outEl.classList.remove("dm-dim");
    pageSlot.run({key:"app:markets",producer:function(){return ALL},scope:"page",force:o.force,initial:true,busy:wrap,label:"Loading markets",
      empty:function(){return ALL.filter(function(m){return m.isNew})},
      show:skeleton,
      apply:function(res,info){unskeleton();M=res.data;qs=snap();listErr=null;listEmpty=false;
        if(!M.length){pageState="empty";sections(false);
          DM.renderEmpty(pageBox,{level:"page",kind:"Nothing here yet",title:"No markets yet",text:"Markets appear here as soon as someone creates one. Start the first one, it takes a minute.",
            action:{text:"Create a market",onclick:function(){cmOpen()}},secondary:filtered()?{text:"Clear filters",onclick:clearFilters}:null,focus:o.retried&&!modal()});return}
        pageState="ok";sections(true);
        if(o.retried&&!modal())DM.focusFirst(wrap);
        if(!info.shown){U.clear(statsEl);U.clear(catsEl);U.clear(typesEl);U.clear(outEl)}
        stats();cats();types();render();openFromUrl();
        if(!window.Motion)return;
        /* after a skeleton the tiles morph in place and count up; the cards cross over (js/motion.js) and the rest
           reveal as they scroll in, exactly as on a first load */
        if(info.shown)Motion.countIn(statsEl.querySelectorAll("b"),80);else Motion.reveal("#stats > div",{onIn:Motion.dataIn});
        Motion.reveal("#cats, .toolbar, #types, #count",{rise:8});Motion.reveal("#out .mcell, #out tbody tr")},
      fail:function(e,info){unskeleton();pageState="error";sections(false);
        DM.renderError(pageBox,e,{level:"page",subject:"the markets",retry:function(){DM.holdFocus(wrap);load({initial:true,retried:true})},
          back:{text:"Back to home",href:"index.html"},focus:!modal()});
        if(e.kind==="network")DM.onOnline(retryOnline)}})}
  /* A shared link, app.html?m=<id>, opens that market's sheet once the first render is done. An id that is not a market does nothing and leaves the address. */
  var deepId=null;try{deepId=new URLSearchParams(location.search).get("m")}catch(e){}
  function marketBy(id){return ALL.filter(function(x){return String(x.id)===id})[0]}
  function openFromUrl(){var id=deepId;deepId=null;if(id==null)return;var m=marketBy(id);if(m)openPanel(m,null,"load");else urlSync()}
  /* Back and Forward: the sheet follows ?m= in the address */
  function onPop(){syncView();var id=null;try{id=new URLSearchParams(location.search).get("m")}catch(e){}
    if(id==null){if(openId!=null)closeNow();return}
    if(String(openId)===id)return;var m=marketBy(id);if(m)openPanel(m,null,"pop");else if(openId!=null)closeNow()}
  function retryOnline(){if(pageState==="error")load({initial:true})}
  function refilter(){urlSync();if(pageState!=="ok"){return}
    var q=snap(),key="app:markets?"+[q.cat,q.status,q.type,q.sort].join("|");
    listSlot.run({key:key,cacheLabel:"Explorer markets, filtered",producer:function(){return ALL},scope:"page",busy:outEl,label:"Loading markets",empty:function(){return[]},
      show:function(){outEl.classList.add("dm-dim")},
      apply:function(res){outEl.classList.remove("dm-dim");qs=q;listErr=null;listEmpty=!!res.empty;render()},
      fail:function(e){outEl.classList.remove("dm-dim");qs=q;listErr=e;listEmpty=false;render();if(e.kind==="network")DM.onOnline(refilter)}})}
  /* ======================= two views: Markets and Leaderboard =======================
     One page, two views, chosen by the bare hash: #leaderboard shows the leaderboard, #markets or no hash the explorer (any other hash,
     such as #demo, leaves the view as it is). The switch in the page head pushes the hash without scrolling, so Back, Forward and a reload
     keep the view. A view loads when it is first shown. */
  var pvTitle=document.querySelector(".phead h1"),pvLede=document.querySelector(".phead .lede"),pvT0=pvTitle.textContent,pvL0=pvLede.textContent;
  var tab="markets",started=false,pvM=document.getElementById("pv-m"),pvL=document.getElementById("pv-l");
  function hashView(){var x=location.hash;return x==="#leaderboard"?"leaderboard":x===""||x==="#markets"?"markets":null}
  function startExplorer(){if(started)return;started=true;
    if(!DM){stats();cats();types();render();openFromUrl();if(window.Motion){Motion.reveal("#stats > div",{onIn:Motion.dataIn});Motion.reveal("#cats, .toolbar, #types, #count",{rise:8});Motion.reveal("#out .mcell, #out tbody tr")}}
    else load({initial:true})}
  function showView(v){tab=v;var l=v==="leaderboard";wrap.hidden=l;lbEl.hidden=!l;
    pvM.setAttribute("aria-pressed",String(!l));pvL.setAttribute("aria-pressed",String(l));
    document.title=l?"Seer app | Leaderboard":"Seer app | Market explorer";
    /* the page head follows the view: its title and sentence, and Create market only where a market can be created */
    pvTitle.textContent=l?"Leaderboard":pvT0;pvLede.textContent=l?"The most profitable traders, with volume and win rate.":pvL0;
    document.getElementById("create").hidden=l;
    if(l){if(lbState==="idle")lbLoad({initial:true});else if(lbState==="ok")lbRender()}else startExplorer()}
  function go(v){if(v===tab)return;try{history.pushState(null,"",v==="leaderboard"?"#leaderboard":location.pathname+location.search)}catch(e){}
    showView(v);if(DM)DM.announce(v==="leaderboard"?"Showing the leaderboard.":"Showing the markets.")}
  function syncView(){var v=hashView();if(v&&v!==tab)showView(v)}
  pvM.onclick=function(){go("markets")};pvL.onclick=function(){go("leaderboard")};
  addEventListener("popstate",onPop);addEventListener("hashchange",syncView);

  /* ======================= leaderboard =======================
     25 illustrative traders in three fixed sets (js/leaders.js), ranked by profit, in a table from 1101px and cut-corner cards below it (the
     shared reflow rules). A wallet that is connected adds a "You" row, worked out from its positions and activity (see youRow). It loads through
     js/demo.js like the explorer: a skeleton, an error with Try again, offline; changing the period is a new query for the list alone. */
  var lbEl=document.getElementById("lb"),lbBox=document.getElementById("lb-box"),lbMain=document.getElementById("lb-main"),lbCtl=document.getElementById("lb-ctl"),lbOut=document.getElementById("lb-out"),
      lbCount=document.getElementById("lb-count"),lbSortEl=document.getElementById("lb-sortbar"),lbHint=document.getElementById("lb-hint"),lbPer=document.getElementById("lb-per");
  var LB=window.LEADERS||{week:[],month:[],all:[]},PNAME={week:"Week",month:"Month",all:"All time"};
  var lb={period:"week",sort:"pf",dir:-1},lbState="idle",lbErr=null,lbEmpty=false,lbSlot=slot(),lbListSlot=slot();
  var LBCOLS=[["rk","Rank",""],["tr","Trader",""],["pf","Profit","r",1],["vo","Volume","r",1],["mk","Markets","r",1],["wr","Win rate","r",1]];
  var LBSORTS=[["pf","Profit"],["vo","Volume"],["mk","Markets"],["wr","Win rate"]];
  /* The "You" row. Profit: the value of the positions held at the price stored with them, minus what they cost, plus every redemption credited
     (the cost of a position that was redeemed is not kept, so its credit counts in full). Volume: the cost of the positions held plus the
     confirmed trades that no held position covers. Markets: the different markets among held positions and confirmed trades and redemptions.
     Win rate: resolved positions held that pay out, plus redemptions, over all of those and the resolved positions that pay nothing; "-" when
     there are none. */
  function youRow(){var s=W.state;if(!s.connected)return null;
    var val=0,cost=0,vol=0,red=0,wins=0,losses=0,mk={},held={};
    s.positions.forEach(function(p){val+=p.shares*p.price;cost+=p.cost;vol+=p.cost;mk[p.market]=1;held[p.market]=1;if(p.status==="Resolved"){if(p.price>0)wins++;else losses++}});
    s.activity.forEach(function(a){if(a.status!=="Confirmed")return;
      if(a.type==="Trade"){mk[a.market]=1;if(!held[a.market])vol+=a.amount}
      else if(a.type==="Redeem"){mk[a.market]=1;red+=a.amount;wins++}});
    return{key:"you",you:true,addr:s.short,pf:Math.round((val-cost+red)*100)/100,vo:Math.round(vol*100)/100,mk:Object.keys(mk).length,wr:wins+losses?Math.round(wins/(wins+losses)*100):null}}
  /* every row with its rank by profit (a tie keeps the traders ahead of You), then in the order the sort asks for; a missing win rate goes last */
  function lbRows(){var r=(LB[lb.period]||[]).map(function(t){return{key:"t"+t[0],addr:W.short(U.addr(t[0])),pf:t[1],vo:t[2],mk:t[3],wr:t[4]}}),y=youRow();if(y)r.push(y);
    r.sort(function(a,b){return b.pf-a.pf});r.forEach(function(x,i){x.rank=i+1});
    var k=lb.sort,d=lb.dir;r.sort(function(a,b){var x=a[k],z=b[k];if(x==null&&z==null)return a.rank-b.rank;if(x==null)return 1;if(z==null)return-1;return(x-z)*d||a.rank-b.rank});return r}
  function lbTh(c){var on=lb.sort===c[0],txt=c[1]+(on?(lb.dir>0?" \u2191":" \u2193"):"");
    if(!c[3])return h("th",{scope:"col",class:c[2],text:c[1]});
    return h("th",{scope:"col",class:c[2],"aria-sort":on?(lb.dir>0?"ascending":"descending"):"none"},[h("button",{type:"button",text:txt,onclick:function(){if(lb.sort===c[0])lb.dir*=-1;else{lb.sort=c[0];lb.dir=-1}lbRender()}})])}
  function lbTr(r){var up=r.pf>0,dn=r.pf<0;
    return h("tr",{"data-key":r.key,class:r.you?"is-sel":null},[
      h("td",{class:"num muted c-rk",text:String(r.rank)}),
      h("td",{class:"c-tr"},[r.you?h("span",{class:"badge new",text:"You"}):null,r.you?" ":null,h("span",{class:"num",text:r.addr})]),
      h("td",{class:"r num c-pf "+(up?"pos":dn?"neg":"")},[up||dn?h("span",{"aria-hidden":"true",text:up?"\u25b2 ":"\u25bc "}):null,(up?"+":"")+U.money(r.pf)]),
      h("td",{class:"r num c-vo","data-label":"Volume",text:U.money(r.vo)}),
      h("td",{class:"r num c-mk","data-label":"Markets",text:String(r.mk)}),
      h("td",{class:"r num c-wr","data-label":"Win rate",text:r.wr==null?"-":r.wr+"%"})])}
  function lbTable(rows){var tb=h("tbody");rows.forEach(function(r){tb.appendChild(lbTr(r))});
    return h("div",{class:"tbl tall rtbl lb-tbl","data-key":"lbt"},[U.roles(h("table",{},[h("thead",{},[h("tr",{},LBCOLS.map(lbTh))]),tb]))])}
  /* below 1101px the column headers are hidden, so the same sort state gets a select and an order toggle, as Deep does */
  function lbSortbar(){var ord=lb.dir>0?"Lowest first":"Highest first";
    return h("div",{class:"sortbar narrow-only"},[h("label",{for:"lb-sort",text:"Sort by"}),
      h("select",{class:"field",id:"lb-sort",onchange:function(e){lb.sort=e.target.value;lb.dir=-1;lbRender()}},LBSORTS.map(function(o){return h("option",{value:o[0],text:o[1],selected:lb.sort===o[0]?"selected":null})})),
      h("button",{class:"btn soft",type:"button",onclick:function(){lb.dir*=-1;lbRender()}},[h("span",{"aria-hidden":"true",text:lb.dir>0?"\u2191 ":"\u2193 "}),ord])])}
  function lbRender(){if(lbState!=="ok")return;var f=h("div"),n;
    if(lbErr||lbEmpty){lbCount.textContent="";U.clear(lbHint);
      f.appendChild(lbErr?DM.errorView(lbErr,{level:"panel",hl:"h2",subject:"the traders",retry:function(){DM.holdFocus(lbOut);lbRefresh()}})
        :DM.emptyView({level:"panel",hl:"h2",title:"No traders yet",text:"Nobody has traded in this period yet. Check again in a moment.",action:{text:"Check again",onclick:function(){DM.holdFocus(lbOut);lbRefresh()}}}));
      patch(lbOut,f);return}
    var rows=lbRows();lbCount.textContent=rows.length+" traders";
    f.appendChild(lbTable(rows));patch(lbOut,f,{flip:"tbody tr"});
    patch(lbSortEl,lbSortbar());var ss=document.getElementById("lb-sort");if(ss&&ss.value!==lb.sort)ss.value=lb.sort;
    /* a wallet that is not connected is asked to connect, with the shared hint */
    n=W.hint({hint:"lb-hint-t",tail:" to see where you rank.",after:function(){lbCount.setAttribute("tabindex","-1");lbCount.focus({preventScroll:true});
      var r=lbRows().filter(function(x){return x.you})[0];if(r&&DM)DM.announce("You rank "+r.rank+" of "+lbRows().length+" by profit.")}});
    var hf=h("div");if(n)hf.appendChild(n);patch(lbHint,hf)}
  function lbSections(on){lbMain.hidden=!on;lbBox.hidden=on;if(on)U.clear(lbBox)}
  function lbSkRow(i){var S=DM.sk;return h("tr",{class:"dm-skr","aria-hidden":"true",style:"--i:"+i},[h("td",{class:"num muted c-rk"},[S("2ch")]),h("td",{class:"c-tr"},[S("14ch")]),h("td",{class:"r num c-pf"},[S("5ch")]),
    h("td",{class:"r num c-vo"},[S("5ch")]),h("td",{class:"r num c-mk"},[S("3ch")]),h("td",{class:"r num c-wr"},[S("4ch")])])}
  function lbSkeleton(){lbSections(true);var S=DM.sk,tb=h("tbody");for(var i=0;i<10;i++)tb.appendChild(lbSkRow(i));
    lbCtl.classList.add("dm-skz");lbCtl.inert=true;lbCount.textContent="";lbCount.appendChild(S("9ch"));U.clear(lbHint);
    U.clear(lbOut);lbOut.appendChild(h("div",{class:"dm-skel"},[h("div",{class:"tbl tall rtbl lb-tbl","aria-hidden":"true"},[h("table",{},[h("thead",{},[h("tr",{},LBCOLS.map(function(c){return h("th",{scope:"col",class:c[2],text:c[1]})}))]),tb])])]))}
  function lbUnskel(){lbCtl.classList.remove("dm-skz");lbCtl.inert=false}
  function lbLoad(o){o=o||{};lbListSlot.cancel();lbOut.classList.remove("dm-dim");var p=lb.period;
    lbSlot.run({key:"app:leaderboard?p="+p,cacheLabel:"Leaderboard, "+PNAME[p],producer:function(){return LB[p]},scope:"page",force:o.force,initial:true,busy:lbEl,label:"Loading the leaderboard",
      empty:function(){return[]},show:lbSkeleton,
      apply:function(res,info){lbUnskel();lbErr=null;lbEmpty=false;
        if(res.empty||!res.data.length){lbState="empty";lbSections(false);
          DM.renderEmpty(lbBox,{level:"page",kind:"Nothing here yet",title:"No traders yet",text:"Nobody has traded in this period yet. Check again in a moment.",action:{text:"Check again",onclick:function(){DM.holdFocus(lbEl);lbLoad({initial:true,retried:true})}},focus:o.retried&&!modal()});return}
        lbState="ok";lbSections(true);if(!info.shown){U.clear(lbOut)}
        lbRender();if(o.retried&&!modal())DM.focusFirst(lbMain);openFromUrl();
        if(window.Motion){Motion.scan(lbEl);Motion.reveal("#lb .lb-head, #lb .sortbar",{rise:8});Motion.reveal("#lb tbody tr")}},
      fail:function(e){lbUnskel();lbState="error";lbSections(false);
        DM.renderError(lbBox,e,{level:"page",subject:"the traders",retry:function(){DM.holdFocus(lbEl);lbLoad({initial:true,retried:true})},back:{text:"Back to home",href:"index.html"},focus:!modal()});
        if(e.kind==="network")DM.onOnline(function(){if(lbState==="error")lbLoad({initial:true})})}})}
  /* a new period is a new query for the table alone: it dims under a sweep, and its answer or failure replaces it */
  function lbRefresh(){if(lbState!=="ok")return;var p=lb.period;
    lbListSlot.run({key:"app:leaderboard?p="+p,cacheLabel:"Leaderboard, "+PNAME[p],producer:function(){return LB[p]},scope:"page",busy:lbOut,label:"Loading the leaderboard",empty:function(){return[]},
      show:function(){lbOut.classList.add("dm-dim")},
      apply:function(res){lbOut.classList.remove("dm-dim");lbErr=null;lbEmpty=!!res.empty;lbRender()},
      fail:function(e){lbOut.classList.remove("dm-dim");lbErr=e;lbEmpty=false;lbRender();if(e.kind==="network")DM.onOnline(lbRefresh)}})}
  [].forEach.call(lbPer.querySelectorAll("button"),function(b){b.onclick=function(){var p=b.getAttribute("data-p");if(p===lb.period)return;lb.period=p;
    [].forEach.call(lbPer.querySelectorAll("button"),function(x){x.setAttribute("aria-pressed",String(x===b))});lbRefresh()}});
  /* a wallet that connects or disconnects adds or removes the You row */
  W.subscribe(function(){if(tab==="leaderboard"&&lbState==="ok")lbRender()});

  if(DM)DM.page({name:"app",replay:function(o){if(document.querySelector("#panel-root .panel"))closePanel();if(document.querySelector("#sheet-root .cm-sheet"))cmClose(false);
    if(tab==="leaderboard"){lbLoad({initial:true,force:o.force});return}load({initial:true,force:o.force})}});
  showView(hashView()||"markets");
  if(window.Motion)Motion.ready();
})();
