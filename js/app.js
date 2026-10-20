(function(){
  SeerShell.mount({product:"app",cta:"Create Market"});
  var M=window.MARKETS,TYPES=["Categorical","Multi-categorical","Scalar","Multi-scalar","Conditional"];
  var st={cat:"All",type:"",status:"",q:"",sort:"vol",view:"grid"};
  function h(tag,attrs,kids){var n=document.createElement(tag);for(var k in attrs||{}){if(k==="text")n.textContent=attrs[k];else if(k==="class")n.className=attrs[k];else if(k.slice(0,2)==="on")n[k]=attrs[k];else n.setAttribute(k,attrs[k])}
    (kids||[]).forEach(function(c){if(c!=null)n.appendChild(typeof c==="string"?document.createTextNode(c):c)});return n}
  function money(v){if(v>=1e9)return"$"+(v/1e9).toFixed(1)+"B";if(v>=1e6)return"$"+(v/1e6).toFixed(v>=1e8?0:1).replace(/\.0$/,"")+"M";if(v>=1e3)return"$"+Math.round(v/1e3)+"K";return"$"+v}
  function pc(p){return Math.round(p*100)+"%"}
  function lead(m){if(!m.outs)return null;return m.outs.slice().sort(function(a,b){return b[1]-a[1]})[0]}
  function matches(m){
    if(st.cat!=="All"&&m.cat!==st.cat)return false;if(st.type&&m.type!==st.type)return false;if(st.status&&m.status!==st.status)return false;
    if(st.q){var s=(m.q+" "+m.cat+" "+m.type+" "+(m.outs||[]).map(function(o){return o[0]}).join(" ")).toLowerCase();if(s.indexOf(st.q.toLowerCase())<0)return false}return true}
  /* Re-renders morph into the existing DOM (js/motion.js) so focus, caret and scroll never reset. */
  function patch(el,next,o){if(window.Motion)return Motion.patch(el,next,o);el.textContent="";while(next.firstChild)el.appendChild(next.firstChild)}
  function sorted(l){return l.sort(function(a,b){return st.sort==="name"?a.q.localeCompare(b.q):b[st.sort]-a[st.sort]})}

  function stats(){var open=M.filter(function(m){return m.status==="Open"||m.status==="Live"}).length;
    var vol=M.reduce(function(a,m){return a+m.vol},0);var liq=M.reduce(function(a,m){return a+m.liq},0);
    var el=document.getElementById("stats");el.textContent="";
    [["Markets listed",String(M.length)],["Open or live",String(open)],["Total volume",money(vol)],["Liquidity",money(liq)]].forEach(function(s){
      el.appendChild(h("div",{class:"stat"},[h("span",{text:s[0]}),h("b",{class:"num",text:s[1]})]))})}

  function cats(){var el=document.getElementById("cats"),f=h("div"),sel=document.getElementById("cat-m"),all=["All"].concat(M.map(function(m){return m.cat}).filter(function(c,i,a){return a.indexOf(c)===i}));
    all.forEach(function(c){
      f.appendChild(h("button",{class:"tab",type:"button","data-key":c,"aria-pressed":String(st.cat===c),text:c,onclick:function(){st.cat=c;cats();render()}}))});patch(el,f);
    /* phones: the same category state as a select, so the long tab row never scrolls sideways */
    if(sel){if(!sel.options.length)all.forEach(function(c){sel.appendChild(h("option",{value:c,text:c==="All"?"All categories":c}))});if(sel.value!==st.cat)sel.value=st.cat}}
  function types(){var el=document.getElementById("types"),f=h("div");
    [""].concat(TYPES).forEach(function(t){var n=M.filter(function(m){return!t||m.type===t}).length;
      f.appendChild(h("button",{class:"chip",type:"button","data-key":t||"all","aria-pressed":String(st.type===t),text:(t||"All types")+" · "+n,onclick:function(){st.type=t;types();render()}}))});patch(el,f)}

  function card(m){
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
      if(m.outs.length>3)body.push(h("span",{class:"note",text:"+ "+(m.outs.length-3)+" more outcomes"}))}
    else if(m.scalar){var s=m.scalar,p=(s.est-s.lo)/(s.hi-s.lo)*100;
      body.push(h("div",{},[h("div",{class:"range"},[h("b",{class:"num",text:s.unit==="$"?"$"+s.est:s.est+s.unit,style:"left:"+p+"%"}),h("i",{style:"left:"+p+"%"})]),h("div",{class:"rl num"},[h("span",{text:String(s.lo)}),h("span",{text:"Market estimate"}),h("span",{text:String(s.hi)})])]))}
    else if(m.cond){var c=m.cond,f=function(v){return(c.unit==="$"?"$":"")+v.toLocaleString("en-US")};
      body.push(h("div",{class:"cond"},[h("div",{},[h("small",{text:"If "+c.if.toLowerCase()}),h("b",{class:"num",text:f(c.a)})]),h("div",{},[h("small",{text:"If not"}),h("b",{class:"num",text:f(c.b)})])]))}
    var live=m.status==="Live";
    return h("button",{class:"mcard",type:"button","data-key":"m"+m.id,onclick:function(){openPanel(m)},"aria-label":m.q+", "+m.type},[
      h("div",{class:"q"},[h("div",{class:"pfp",text:m.q.charAt(0)}),h("span",{text:m.q})])].concat(body,[
      h("div",{class:"foot"},[h("div",{class:"meta"},[h("span",{class:"num",text:money(m.vol)+" Vol."}),h("i"),h("span",{text:live?"LIVE":m.status==="Open"?"Closes "+m.close:m.status,class:live?"status-live":""})]),h("span",{class:"badge",text:m.type})])]))}

  /* explicit table roles: on phones the table is laid out as cards, which drops the native semantics (see shell.css) */
  function roles(t){t.setAttribute("role","table");Array.prototype.forEach.call(t.querySelectorAll("thead,tbody,tr,th,td"),function(n){n.setAttribute("role",{THEAD:"rowgroup",TBODY:"rowgroup",TR:"row",TH:"columnheader",TD:"cell"}[n.tagName])});return t}
  function table(list){var w=h("div",{class:"tbl-wrap rtbl app-tbl"}),t=h("table"),hd=h("tr"),f=document.createDocumentFragment();
    f.appendChild(w);
    [["Market",""],["Type",""],["Leading outcome",""],["Volume","r"],["Liquidity","r"],["Closes",""],["Status",""]].forEach(function(c){hd.appendChild(h("th",{class:c[1],scope:"col",text:c[0]}))});
    t.appendChild(h("thead",{},[hd]));var tb=h("tbody");
    list.forEach(function(m){var l=lead(m),lt=l?l[0]+" · "+pc(l[1]):m.scalar?"Estimate "+m.scalar.est+(m.scalar.unit==="$"?" $/bbl":m.scalar.unit):"Pass "+m.cond.a.toLocaleString("en-US")+" / fail "+m.cond.b.toLocaleString("en-US");
      var r=h("tr",{tabindex:"0","data-key":"r"+m.id,onclick:function(){openPanel(m)},onkeydown:function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openPanel(m)}}},[
        h("td",{class:"mq c-q",text:m.q}),h("td",{class:"c-ty"},[h("span",{class:"badge",text:m.type})]),h("td",{class:"num c-lo","data-label":"Leading outcome",text:lt}),h("td",{class:"r num c-vo","data-label":"Volume",text:money(m.vol)}),
        h("td",{class:"r num c-li","data-label":"Liquidity",text:money(m.liq)}),h("td",{class:"c-cl","data-label":"Closes",text:m.close}),h("td",{class:"c-st","data-status":m.status,text:m.status})]);tb.appendChild(r)});
    t.appendChild(tb);w.appendChild(roles(t));return f}

  function render(){var list=sorted(M.filter(matches)),out=document.getElementById("out"),f=h("div");
    document.getElementById("count").textContent=list.length+" of "+M.length+" markets";
    if(!list.length)f.appendChild(h("div",{class:"empty",text:"No markets match these filters."}));
    else if(st.view==="table")f.appendChild(table(list));else{var g=h("div",{class:"mgrid"});list.forEach(function(m){g.appendChild(card(m))});f.appendChild(g)}
    patch(out,f,{flip:".mcard, tbody tr"})}

  /* detail panel + trade ticket */
  var lastFocus=null;
  function closePanel(){var r=document.getElementById("panel-root"),p=r.querySelector(".panel"),s=r.querySelector(".scrim");document.removeEventListener("keydown",esc);
    var clear=function(){if(!p||p.isConnected)r.textContent=""};
    if(window.Motion&&p)Motion.exit([p,s],clear);else clear();if(lastFocus)lastFocus.focus()}
  function esc(e){if(e.key==="Escape")closePanel()}
  function spark(seed,end){var pts=[],v=Math.max(.05,end-.18),n=24,i;for(i=0;i<n;i++){seed=(seed*9301+49297)%233280;v+= (seed/233280-.5)*.06+(end-v)*.08;pts.push(Math.min(.97,Math.max(.03,v)))}
    pts[n-1]=end;var lo=Math.min.apply(null,pts),hi=Math.max.apply(null,pts),pad=Math.max(.02,(hi-lo)*.12);lo-=pad;hi+=pad;
    var Y=function(p){return((hi-p)/(hi-lo)*64).toFixed(1)},d=pts.map(function(p,i){return(i?"L":"M")+(i/(n-1)*300).toFixed(1)+" "+Y(p)}).join(" ");
    var NS="http://www.w3.org/2000/svg",s=document.createElementNS(NS,"svg");s.setAttribute("viewBox","0 0 300 64");s.setAttribute("preserveAspectRatio","none");s.setAttribute("class","spark");s.setAttribute("role","img");
    s.setAttribute("aria-label","Illustrative price history, ending at "+pc(end));
    var a=document.createElementNS(NS,"path");a.setAttribute("class","m-area");a.setAttribute("d",d+" L300 64 L0 64 Z");a.setAttribute("fill","var(--violet)");a.setAttribute("fill-opacity",".12");s.appendChild(a);
    var p=document.createElementNS(NS,"path");p.setAttribute("class","m-line");p.setAttribute("d",d);p.setAttribute("fill","none");p.setAttribute("stroke","var(--violet)");p.setAttribute("stroke-width","2");p.setAttribute("vector-effect","non-scaling-stroke");s.appendChild(p);
    var box=h("div",{class:"spark-box"},[h("div",{class:"spark-head"},[h("span",{text:"Price history · leading outcome"}),h("span",{class:"num",text:pc(end)})]),s,h("div",{class:"note",text:"Illustrative price history"})]);return box}
  function openPanel(m){lastFocus=document.activeElement;var root=document.getElementById("panel-root");root.textContent="";
    var pick=0,side="Yes",amt=50;
    var price=function(){return m.outs?(side==="Yes"?m.outs[pick][1]:1-m.outs[pick][1]):.5};
    var tk=h("div",{class:"ticket"}),
    drawTicket=function(){var p=Math.min(.99,Math.max(.01,price())),f=h("div");
      if(m.status!=="Open"&&m.status!=="Live"){f.appendChild(h("div",{text:"Trading is closed for this market.",class:"note"}));patch(tk,f);return}
      var tk0=tk;tk=f;
      if(m.outs){tk.appendChild(h("div",{class:"seg",role:"group","aria-label":"Side"},["Yes","No"].map(function(s){return h("button",{type:"button","aria-pressed":String(side===s),text:"Buy "+s,onclick:function(){side=s;drawTicket()}})})))}
      else tk.appendChild(h("div",{class:"note",text:m.scalar?"Scalar markets trade a long/short position on the value.":"Conditional markets trade each branch separately."}));
      var inp=h("input",{class:"field",type:"number",min:"1",value:String(amt),id:"amt","aria-label":"Amount in USDC",oninput:function(e){amt=Math.max(0,Number(e.target.value)||0);upd(true)}});
      tk.appendChild(h("label",{for:"amt",text:"Amount (USDC)"}));tk.appendChild(inp);
      var l1=h("span",{class:"num","data-k":"price"}),l2=h("span",{class:"num","data-k":"shares"}),l3=h("span",{class:"num","data-k":"payout"});
      tk.appendChild(h("div",{class:"line"},[h("span",{text:"Price per share"}),l1]));tk.appendChild(h("div",{class:"line"},[h("span",{text:"Shares"}),l2]));tk.appendChild(h("div",{class:"line"},[h("span",{text:"Payout if correct"}),l3]));
      /* live: values tick to the new amount; the spans are looked up because a morph keeps the on-screen nodes */
      function upd(live){var s=amt/p,v=[["price","$"+p.toFixed(2)],["shares",s.toFixed(1)],["payout","$"+s.toFixed(2)]];
        v.forEach(function(x){var n=live?tk0.querySelector('[data-k="'+x[0]+'"]'):[l1,l2,l3][["price","shares","payout"].indexOf(x[0])];if(!n)return;
          if(live&&window.Motion)Motion.num(n,x[1]);else n.textContent=x[1]})}upd();
      tk.appendChild(h("button",{class:"btn lg",type:"button",text:"Connect wallet to trade"}));
      tk.appendChild(h("div",{class:"note",text:"Demo only. No wallet or funds involved."}));tk=tk0;patch(tk,f)};
    var list=null;
    if(m.outs){list=h("div",{style:"display:grid;gap:8px"},[]);var draw=function(){var f=h("div");m.outs.forEach(function(o,i){f.appendChild(h("button",{type:"button",class:"orow sel","data-key":"o"+i,"aria-pressed":String(pick===i),onclick:function(){pick=i;draw();drawTicket()}},[h("span",{text:o[0]}),h("span",{class:"num",text:pc(o[1])})]))});patch(list,f)};draw()}
    else{var c=card(m);list=h("div",{class:"mcard static"});while(c.firstChild)list.appendChild(c.firstChild)}
    var end=(lead(m)||[0,.5])[1];
    var p=h("div",{class:"panel",role:"dialog","aria-modal":"true","aria-label":m.q},[
      h("div",{class:"panel-top"},[h("span",{class:"badge",text:m.type}),h("button",{class:"btn soft",type:"button",text:"Close",onclick:closePanel})]),h("h2",{text:m.q}),
      h("div",{class:"kv"},[h("div",{},[h("small",{text:"Volume"}),h("b",{class:"num",text:money(m.vol)})]),h("div",{},[h("small",{text:"Liquidity"}),h("b",{class:"num",text:money(m.liq)})]),h("div",{},[h("small",{text:"Closes"}),h("b",{text:m.close})]),h("div",{},[h("small",{text:"Status"}),h("b",{text:m.status})])]),
      list,spark(m.id*37,end),tk]);
    drawTicket();
    root.appendChild(h("div",{class:"scrim",onclick:closePanel}));root.appendChild(p);document.addEventListener("keydown",esc);p.querySelector(".panel-top button").focus();
    if(window.Motion){Motion.scan(p);Motion.stagger(p.querySelectorAll(".kv > div, .sel, .mcard.static, .spark-box, .ticket"),140,35);Motion.draw(p.querySelector(".spark"),{delay:320})}}

  document.getElementById("q").oninput=function(e){st.q=e.target.value;render()};
  document.getElementById("cat-m").onchange=function(e){st.cat=e.target.value;cats();render()};
  document.getElementById("status").onchange=function(e){st.status=e.target.value;render()};
  document.getElementById("sort").onchange=function(e){st.sort=e.target.value;render()};
  function view(v){st.view=v;document.getElementById("vg").setAttribute("aria-pressed",String(v==="grid"));document.getElementById("vt").setAttribute("aria-pressed",String(v==="table"));render()}
  document.getElementById("vg").onclick=function(){view("grid")};document.getElementById("vt").onclick=function(){view("table")};
  stats();cats();types();render();
  if(window.Motion){Motion.ready();
    Motion.reveal(".stats .stat",{onIn:Motion.dataIn});Motion.reveal("#cats, .toolbar, #types, #count",{rise:8});Motion.reveal("#out .mcard, #out tbody tr")}
})();
