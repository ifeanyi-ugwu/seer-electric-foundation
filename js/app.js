(function(){
  SeerShell.mount({product:"app",cta:"Connect wallet"});
  var M=window.MARKETS,TYPES=["Categorical","Multi-categorical","Scalar","Multi-scalar","Conditional"],W=window.SeerWallet;
  var st={cat:"All",type:"",status:"",q:"",sort:"vol",view:"grid"};
  function h(tag,attrs,kids){var n=document.createElement(tag);for(var k in attrs||{}){if(attrs[k]==null)continue;if(k==="text")n.textContent=attrs[k];else if(k==="class")n.className=attrs[k];else if(k.slice(0,2)==="on")n[k]=attrs[k];else n.setAttribute(k,attrs[k])}
    (kids||[]).forEach(function(c){if(c!=null)n.appendChild(typeof c==="string"?document.createTextNode(c):c)});return n}
  function money(v){if(v>=1e9)return"$"+(v/1e9).toFixed(1)+"B";if(v>=1e6)return"$"+(v/1e6).toFixed(v>=1e8?0:1).replace(/\.0$/,"")+"M";if(v>=1e3)return"$"+Math.round(v/1e3)+"K";return"$"+v}
  function pc(p){return Math.round(p*100)+"%"}
  /* a scalar value with its unit: "$" leads, a word follows after a space, a symbol follows directly */
  function sfmt(v,u){return u==="$"?"$"+v:u&&/^[A-Za-z]/.test(u)?v+" "+u:v+(u||"")}
  function lead(m){if(!m.outs)return null;return m.outs.slice().sort(function(a,b){return b[1]-a[1]})[0]}
  function matches(m){
    if(st.cat!=="All"&&m.cat!==st.cat)return false;if(st.type&&m.type!==st.type)return false;if(st.status&&m.status!==st.status)return false;
    if(st.q){var s=(m.q+" "+m.cat+" "+m.type+" "+(m.outs||[]).map(function(o){return o[0]}).join(" ")).toLowerCase();if(s.indexOf(st.q.toLowerCase())<0)return false}return true}
  /* Re-renders morph into the existing DOM (js/motion.js) so focus, caret and scroll never reset. */
  function patch(el,next,o){if(window.Motion)return Motion.patch(el,next,o);el.textContent="";while(next.firstChild)el.appendChild(next.firstChild)}
  /* markets created in this session lead the list, newest first, in every sort; the rest follow the sort */
  function sorted(l){l.sort(function(a,b){return st.sort==="name"?a.q.localeCompare(b.q):b[st.sort]-a[st.sort]});
    return l.filter(function(m){return m.isNew}).sort(function(a,b){return b.isNew-a.isNew}).concat(l.filter(function(m){return!m.isNew}))}

  /* markets created earlier in this session (sessionStorage, so they survive a reload or a trip to another page) */
  var NEWKEY="seer-new-markets";
  function stored(){try{var v=JSON.parse(sessionStorage.getItem(NEWKEY)||"[]");return Array.isArray(v)?v:[]}catch(e){return[]}}
  function store(l){try{sessionStorage.setItem(NEWKEY,JSON.stringify(l))}catch(e){}}
  stored().slice().reverse().forEach(function(m){if(m&&m.id&&!M.some(function(x){return x.id===m.id}))M.unshift(m)});

  function stats(){var open=M.filter(function(m){return m.status==="Open"||m.status==="Live"}).length;
    var vol=M.reduce(function(a,m){return a+m.vol},0);var liq=M.reduce(function(a,m){return a+m.liq},0);
    var el=document.getElementById("stats"),f=h("div");
    /* the market count lives once, in the results line; the tiles carry what the list cannot */
    [["Open or live",String(open)],["Total volume",money(vol)],["Liquidity",money(liq)]].forEach(function(s){
      f.appendChild(h("div",{"data-key":s[0]},[h("small",{text:s[0]}),h("b",{class:"num",text:s[1]})]))});patch(el,f,{animate:!!el.firstChild})}

  function cats(){var el=document.getElementById("cats"),f=h("div"),sel=document.getElementById("cat-m"),all=["All"].concat(M.map(function(m){return m.cat}).filter(function(c,i,a){return a.indexOf(c)===i}));
    all.forEach(function(c){
      f.appendChild(h("button",{class:"tab",type:"button","data-key":c,"aria-pressed":String(st.cat===c),text:c,onclick:function(){st.cat=c;cats();render()}}))});patch(el,f);
    /* phones: the same category state as a select, so the long tab row never scrolls sideways */
    if(sel){if(sel.options.length!==all.length){U.clear(sel);all.forEach(function(c){sel.appendChild(h("option",{value:c,text:c==="All"?"All categories":c}))})}if(sel.value!==st.cat)sel.value=st.cat}}
  function types(){var el=document.getElementById("types"),f=h("div");
    [""].concat(TYPES).forEach(function(t){var n=M.filter(function(m){return!t||m.type===t}).length;
      f.appendChild(h("button",{class:"chip",type:"button","data-key":t||"all","aria-pressed":String(st.type===t),text:t?t+" · "+n:"All types",onclick:function(){st.type=t;types();render()}}))});patch(el,f)}

  function cardBody(m){
    var body=[];
    /* Outcome actions follow one rule: tradable markets with 3+ outcomes trade Yes/No per outcome;
       tradable two-outcome markets buy either outcome directly; closed markets show no actions,
       and a resolved market marks its winner. The chips are visual cues; the card opens the ticket. */
    var tradable=m.status==="Open"||m.status==="Live";
    function acts(o){
      if(!tradable)return m.status==="Resolved"&&o[1]===1?h("span",{class:"won",text:"Won"}):null;
      if(m.outs.length>2)return h("span",{class:"acts","aria-hidden":"true"},[h("span",{class:"yn",text:"Yes"}),h("span",{class:"yn n",text:"No"})]);
      return h("span",{class:"acts","aria-hidden":"true"},[h("span",{class:"yn buy",text:"Buy"})])}
    if(m.outs){m.outs.slice(0,m.outs.length>3?3:m.outs.length).forEach(function(o){
      body.push(h("div",{class:"orow"},[h("span",{text:o[0]}),h("span",{class:"pct"},[h("span",{class:"num",text:pc(o[1])}),acts(o)])]))});
      if(m.outs.length>3)body.push(h("span",{class:"more",text:"+ "+(m.outs.length-3)+(m.outs.length-3===1?" more outcome":" more outcomes")}))}
    else if(m.scalar){var s=m.scalar,p=(s.est-s.lo)/((s.hi-s.lo)||1)*100;p=Math.max(0,Math.min(100,p));
      body.push(h("div",{},[h("div",{class:"range"},[h("b",{class:"num",text:sfmt(s.est,s.unit),style:"left:"+p+"%"}),h("i",{style:"left:"+p+"%"})]),h("div",{class:"rl num"},[h("span",{text:String(s.lo)}),h("span",{text:"Market estimate"}),h("span",{text:String(s.hi)})])]))}
    else if(m.cond){var c=m.cond,f=function(v){return v==null?"No trades yet":(c.unit==="$"?"$":"")+v.toLocaleString("en-US")};
      body.push(h("div",{class:"cond"},[h("div",{},[h("small",{text:"If "+c.if.toLowerCase()}),h("b",{class:"num",text:f(c.a)})]),h("div",{},[h("small",{text:"If not"}),h("b",{class:"num",text:f(c.b)})])]))}
    var live=m.status==="Live",tb=h("span",{class:"badge",text:m.type});
    return[h("div",{class:"q"},[h("div",{class:"pfp",text:m.q.charAt(0)}),h("span",{text:m.q})])].concat(body,[
      h("div",{class:"foot"},[h("div",{class:"meta"},[h("span",{class:"num",text:money(m.vol)+" Vol."}),h("i"),h("span",{text:live?"LIVE":m.status==="Open"?(m.close?"Closes "+m.close:"No close date"):m.status,class:live?"status-live":""})]),
        m.isNew?h("span",{class:"foot-b"},[h("span",{class:"badge new",text:"New"}),tb]):tb])])}
  function card(m){return h("button",{class:"mcard",type:"button","data-key":"m"+m.id,onclick:function(){openPanel(m)},"aria-label":m.q+", "+m.type+(m.isNew?", new":"")},cardBody(m))}

  /* explicit table roles: on phones the table is laid out as cards, which drops the native semantics (see shell.css) */
  function roles(t){t.setAttribute("role","table");Array.prototype.forEach.call(t.querySelectorAll("thead,tbody,tr,th,td"),function(n){n.setAttribute("role",{THEAD:"rowgroup",TBODY:"rowgroup",TR:"row",TH:"columnheader",TD:"cell"}[n.tagName])});return t}
  function leadText(m){var l=lead(m);if(l)return l[0]+" · "+pc(l[1]);
    if(m.scalar)return"Estimate "+(m.scalar.per?m.scalar.est+" "+m.scalar.per:sfmt(m.scalar.est,m.scalar.unit));
    return m.cond.a==null?"No trades yet":"Pass "+m.cond.a.toLocaleString("en-US")+" / fail "+m.cond.b.toLocaleString("en-US")}
  function table(list){var w=h("div",{class:"tbl-wrap rtbl app-tbl"}),t=h("table"),hd=h("tr"),f=document.createDocumentFragment();
    f.appendChild(w);
    [["Market",""],["Type",""],["Leading outcome",""],["Volume","r"],["Liquidity","r"],["Closes",""],["Status",""]].forEach(function(c){hd.appendChild(h("th",{class:c[1],scope:"col",text:c[0]}))});
    t.appendChild(h("thead",{},[hd]));var tb=h("tbody");
    list.forEach(function(m){
      var r=h("tr",{tabindex:"0","data-key":"r"+m.id,onclick:function(){openPanel(m)},onkeydown:function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openPanel(m)}}},[
        h("td",{class:"mq c-q"},m.isNew?[h("span",{class:"badge new",text:"New"})," "+m.q]:[m.q]),h("td",{class:"c-ty"},[h("span",{class:"badge",text:m.type})]),h("td",{class:"num c-lo","data-label":"Leading outcome",text:leadText(m)}),h("td",{class:"r num c-vo","data-label":"Volume",text:money(m.vol)}),
        h("td",{class:"r num c-li","data-label":"Liquidity",text:money(m.liq)}),h("td",{class:"c-cl","data-label":"Closes",text:m.close||"Not set"}),h("td",{class:"c-st","data-status":m.status,text:m.status})]);tb.appendChild(r)});
    t.appendChild(tb);w.appendChild(roles(t));return f}

  function render(){var list=sorted(M.filter(matches)),out=document.getElementById("out"),f=h("div");
    document.getElementById("count").textContent=list.length===M.length?M.length+" markets":list.length+" of "+M.length+" markets";
    if(!list.length)f.appendChild(h("div",{class:"empty",text:"No markets match these filters."}));
    else if(st.view==="table")f.appendChild(table(list));else{var g=h("div",{class:"mgrid"});list.forEach(function(m){g.appendChild(card(m))});f.appendChild(g)}
    patch(out,f,{flip:".mcard, tbody tr"})}

  /* detail panel + trade ticket */
  var lastFocus=null,flow=null,redrawTicket=null;
  function closePanel(){var r=document.getElementById("panel-root"),p=r.querySelector(".panel"),s=r.querySelector(".scrim");document.removeEventListener("keydown",esc);
    if(flow)flow.reset();flow=null;redrawTicket=null;
    var clear=function(){if(!p||p.isConnected)r.textContent=""};
    if(window.Motion&&p)Motion.exit([p,s],clear);else{clear();if(window.Motion&&Motion.sheetOff)Motion.sheetOff()}if(lastFocus)lastFocus.focus()}
  /* Escape closes; Tab and Shift+Tab stay inside the open panel. While the wallet sheet is open above it, it waits. */
  function esc(e){if(e.defaultPrevented||U.covered("panel-root"))return;if(e.key==="Escape"){closePanel();return}if(e.key!=="Tab")return;var p=document.querySelector("#panel-root .panel");if(!p)return;
    var f=[].filter.call(p.querySelectorAll("button,input,select,[tabindex]:not([tabindex='-1'])"),function(n){return!n.disabled&&n.getClientRects().length});if(!f.length)return;
    var a=f[0],z=f[f.length-1];if(e.shiftKey&&(document.activeElement===a||!p.contains(document.activeElement))){e.preventDefault();z.focus()}else if(!e.shiftKey&&(document.activeElement===z||!p.contains(document.activeElement))){e.preventDefault();a.focus()}}
  function spark(seed,end,name){var pts=[],v=Math.max(.05,end-.18),n=24,i;for(i=0;i<n;i++){seed=(seed*9301+49297)%233280;v+= (seed/233280-.5)*.06+(end-v)*.08;pts.push(Math.min(.97,Math.max(.03,v)))}
    pts[n-1]=end;var lo=Math.min.apply(null,pts),hi=Math.max.apply(null,pts),pad=Math.max(.02,(hi-lo)*.12);lo-=pad;hi+=pad;
    var Y=function(p){return((hi-p)/(hi-lo)*64).toFixed(1)},d=pts.map(function(p,i){return(i?"L":"M")+(i/(n-1)*300).toFixed(1)+" "+Y(p)}).join(" ");
    var NS="http://www.w3.org/2000/svg",s=document.createElementNS(NS,"svg");s.setAttribute("viewBox","0 0 300 64");s.setAttribute("preserveAspectRatio","none");s.setAttribute("class","spark");s.setAttribute("role","img");
    s.setAttribute("aria-label","Price history of "+name+", ending at "+pc(end));
    var a=document.createElementNS(NS,"path");a.setAttribute("class","m-area");a.setAttribute("d",d+" L300 64 L0 64 Z");a.setAttribute("fill","var(--violet)");a.setAttribute("fill-opacity",".12");s.appendChild(a);
    var p=document.createElementNS(NS,"path");p.setAttribute("class","m-line");p.setAttribute("d",d);p.setAttribute("fill","none");p.setAttribute("stroke","var(--violet)");p.setAttribute("stroke-width","2");p.setAttribute("vector-effect","non-scaling-stroke");s.appendChild(p);
    var box=h("div",{class:"spark-box"},[h("div",{class:"spark-head"},[h("span",{text:"Price history"}),h("span",{text:"Leading: "+name})]),s]);return box}
  function openPanel(m){lastFocus=document.activeElement;var root=document.getElementById("panel-root");root.textContent="";
    var pick=0,side="Yes",amt=50;
    var price=function(){return m.outs?(side==="Yes"?m.outs[pick][1]:1-m.outs[pick][1]):.5};
    var tk=h("div",{class:"ticket","data-tx":"app"});
    /* the ticket runs the whole trade in place: form, review, signature, result (js/wallet.js) */
    flow=W.flow({box:function(){return tk},onChange:function(){drawTicket()}});
    var fl=flow;
    function focusPlace(){var b=tk.querySelector("[data-tx-place]");if(b)b.focus()}
    function place(){var p=Math.min(.99,Math.max(.01,price())),a=amt,s=a/p,o=m.outs?m.outs[pick][0]:null,sd=m.outs?side:m.scalar?"Long":"If "+m.cond.if.toLowerCase();
      fl.place(a,function(){return{amount:a,meta:{type:"Trade",market:m.q},
        rows:[["Market",m.q,"tx-q"]].concat(o?[["Outcome",o,"tx-q"]]:[],[["Side",sd],["Amount",W.money(a)+" USDC","tx-tot"],["Price per share","$"+p.toFixed(2)],["Shares",s.toFixed(1)],["Payout if correct","$"+s.toFixed(2)],["Network fee","Free in demo","tx-free"]]),
        done:"You bought "+s.toFixed(1)+" "+(o?side+" shares on "+o:m.scalar?"long shares":"shares in the branch where "+m.cond.if.toLowerCase())+"."}},"amt")}
    var drawTicket=function(){var p=Math.min(.99,Math.max(.01,price())),f=h("div");
      if(m.status!=="Open"&&m.status!=="Live"){f.appendChild(h("p",{text:"Trading is closed for this market.",class:"note"}));patch(tk,f);return}
      tk.style.minHeight=fl.style()?fl.hold+"px":"";
      if(fl.step!=="form"){f.appendChild(fl.view());patch(tk,f);return}
      var tk0=tk;tk=f;
      if(m.outs){tk.appendChild(h("div",{class:"seg",role:"group","aria-label":"Side"},["Yes","No"].map(function(s){return h("button",{type:"button","aria-pressed":String(side===s),text:"Buy "+s,onclick:function(){side=s;drawTicket()}})})))}
      else tk.appendChild(h("div",{class:"note",text:m.scalar?"Scalar markets trade a long/short position on the value.":"Conditional markets trade each branch separately."}));
      var err=W.amountError(amt,fl.tried),at=W.amountAttrs("amt",err);
      var inp=h("input",{class:"field",type:"number",min:"1",value:String(amt),id:"amt","aria-label":"Amount in USDC","aria-invalid":at["aria-invalid"],"aria-describedby":at["aria-describedby"],
        oninput:function(e){amt=Math.max(0,Number(e.target.value)||0);upd(true);W.amountLive(e.target,amt,fl)}});
      tk.appendChild(h("div",{class:"field-grp"},[h("label",{for:"amt",text:"Amount (USDC)"}),inp,W.amountErr("amt",err)]));
      var l1=h("span",{class:"num","data-k":"price"}),l2=h("span",{class:"num","data-k":"shares"}),l3=h("span",{class:"num","data-k":"payout"});
      tk.appendChild(h("div",{class:"line"},[h("span",{text:"Price per share"}),l1]));tk.appendChild(h("div",{class:"line"},[h("span",{text:"Shares"}),l2]));tk.appendChild(h("div",{class:"line"},[h("span",{text:"Payout if correct"}),l3]));
      /* live: values tick to the new amount; the spans are looked up because a morph keeps the on-screen nodes */
      function upd(live){var s=amt/p,v=[["price","$"+p.toFixed(2)],["shares",s.toFixed(1)],["payout","$"+s.toFixed(2)]];
        v.forEach(function(x){var n=live?tk0.querySelector('[data-k="'+x[0]+'"]'):[l1,l2,l3][["price","shares","payout"].indexOf(x[0])];if(!n)return;
          if(live&&window.Motion)Motion.num(n,x[1]);else n.textContent=x[1]})}upd();
      /* one wallet control per page (the header); until it is connected the ticket action waits, and its hint connects */
      tk.appendChild(W.placeBtn({onPlace:place}));
      var hn=W.hint({after:focusPlace});if(hn)tk.appendChild(hn);tk=tk0;patch(tk,f)};
    redrawTicket=drawTicket;
    var list=null;
    if(m.outs){list=h("div",{class:"olist"},[]);var draw=function(){var f=h("div");m.outs.forEach(function(o,i){f.appendChild(h("button",{type:"button",class:"orow sel","data-key":"o"+i,"aria-pressed":String(pick===i),onclick:function(){pick=i;if(fl.step!=="form")fl.reset();draw();drawTicket()}},[h("span",{text:o[0]}),h("span",{class:"num",text:pc(o[1])})]))});patch(list,f)};draw()}
    else{list=h("div",{class:"mcard static"},cardBody(m))}
    var ld=lead(m);
    var p=h("div",{class:"panel",role:"dialog","aria-modal":"true","aria-label":m.q},[
      U.sheetTop(h("span",{class:"badge",text:m.isNew?"New · "+m.type:m.type}),m.q,closePanel),
      h("div",{class:"kv"},[h("div",{},[h("small",{text:"Volume"}),h("b",{class:"num",text:money(m.vol)})]),h("div",{},[h("small",{text:"Liquidity"}),h("b",{class:"num",text:money(m.liq)})]),h("div",{},[h("small",{text:"Closes"}),h("b",{text:m.close||"Not set"})]),h("div",{},[h("small",{text:"Status"}),h("b",{text:m.status})])]),
      list,ld?spark(m.id*37,ld[1],ld[0]):null,tk]);
    drawTicket();
    root.appendChild(h("div",{class:"scrim",onclick:closePanel}));root.appendChild(p);document.addEventListener("keydown",esc);p.querySelector(".panel-top button").focus();
    if(window.Motion){Motion.scan(p);if(Motion.panelIn)Motion.panelIn(root);Motion.stagger(p.querySelectorAll(".pt-title, .kv > div, .sel, .mcard.static, .spark-box, .ticket"),140,35);if(ld)Motion.draw(p.querySelector(".spark"),{delay:320})}}

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
  function closeTxt(v){if(!v)return"";var p=v.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]),s=d.toLocaleDateString("en-US",{month:"short",day:"numeric"});return d.getFullYear()===new Date().getFullYear()?s:s+", "+d.getFullYear()}
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
      status:"Open",vol:0,liq:Math.max(0,num(c.liq)||0),close:closeTxt(c.date),isNew:id?Date.now():1};
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
      rows:[["Question",m.q,"tx-q"],["Category",m.cat],["Type",m.type],[m.outs?(m.type==="Multi-scalar"?"Ranges":"Outcomes"):m.scalar?"Range":"Condition",detail,"tx-q"],["Closes",m.close],
        ["Liquidity locked",W.money(liq)+" USDC","tx-tot"],["Network fee","Free in demo","tx-free"]],
      note:"The liquidity stays locked in the market until it resolves.",
      done:"“"+m.q+"” is open for trading. Its liquidity is locked in the market."})}
  function cmDraw(first){if(!cm)return;var body=cflow.step==="form"?cmForm():cflow.view();
    U.sheet({open:true,cls:"cm-sheet",label:"Create a market",title:"Create a market",kids:[h("div",{class:"cm-wrap","data-tx":"cm","data-key":"cm-wrap",style:cflow.style()},[body])],onClose:function(){cmClose(false)}})}
  function cmOpen(){cmFocus=document.activeElement;if(!cm)cm=fresh();cflow.reset();cmDraw(true)}
  /* closing: a market created in the sheet joins the explorer; "View in explorer" also takes you to it */
  function cmClose(view){cflow.reset();U.sheet({open:false,onClose:function(){}});
    if(!pending.length){if(cmFocus&&cmFocus.isConnected)cmFocus.focus();return}
    var add=pending.splice(0),first=add[0];add.slice().reverse().forEach(function(m){M.unshift(m)});
    if(!matches(first)){st.cat="All";st.type="";st.status="";st.q="";document.getElementById("q").value="";document.getElementById("status").value=""}
    stats();cats();types();
    var show=function(){render();var c=document.querySelector('#out [data-key="m'+first.id+'"], #out [data-key="r'+first.id+'"]');if(!c)return;
      if(window.Motion){Motion.anim(c,[{boxShadow:"0 0 0 2px var(--violet)"},{boxShadow:"0 0 0 2px transparent"}],{duration:1600,easing:Motion.E.standard,delay:420});Motion.pop(c.querySelectorAll(".badge.new"),260)}
      if(view)c.focus({preventScroll:true})};
    if(view){var y=document.getElementById("count").getBoundingClientRect().top+scrollY-(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0);
      y=Math.max(0,Math.min(y,document.documentElement.scrollHeight-innerHeight));
      if(window.Motion&&!Motion.reduced())Motion.scrollTo(y,show);else{scrollTo(0,y);show()}}
    else{show();if(cmFocus&&cmFocus.isConnected)cmFocus.focus()}}
  document.getElementById("create").onclick=cmOpen;

  /* the wallet changed (connected, disconnected, a balance after a trade): tickets and the form follow */
  W.subscribe(function(){if(redrawTicket)redrawTicket();if(cm&&document.querySelector("#sheet-root .cm-sheet"))cmDraw()});

  document.getElementById("q").oninput=function(e){st.q=e.target.value;render()};
  document.getElementById("cat-m").onchange=function(e){st.cat=e.target.value;cats();render()};
  document.getElementById("status").onchange=function(e){st.status=e.target.value;render()};
  document.getElementById("sort").onchange=function(e){st.sort=e.target.value;render()};
  function view(v){st.view=v;document.getElementById("vg").setAttribute("aria-pressed",String(v==="grid"));document.getElementById("vt").setAttribute("aria-pressed",String(v==="table"));render()}
  document.getElementById("vg").onclick=function(){view("grid")};document.getElementById("vt").onclick=function(){view("table")};
  stats();cats();types();render();
  if(window.Motion){Motion.ready();
    Motion.reveal("#stats > div",{onIn:Motion.dataIn});Motion.reveal("#cats, .toolbar, #types, #count",{rise:8});Motion.reveal("#out .mcard, #out tbody tr")}
})();
