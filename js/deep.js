(function(){
SeerShell.mount({product:"deep",cta:"Connect wallet"});
var h=U.h,r=U.rng(42),A=["Open","Modular","Private","Verifiable","Composable","Lightweight","Cross-chain","Community","Resilient","Adaptive"],N=["indexer","wallet kit","oracle feed","audit tooling","education hub","bridge monitor","data commons","rollup toolkit","identity layer","dev grants portal"];
var D=[];for(var i=0;i<100;i++){var sc=Math.min(9.6,Math.max(2.4,4+r()*4.5+(r()-.5)*2)),w=.5+r()*1.4,av=Math.round((5+r()*120)*1e3*(r()>.5?1.6:.5)),hv=Math.round((5+r()*70)*1e3*(r()>.5?1.5:.6));
 D.push({id:i+1,name:A[Math.floor(r()*A.length)]+" "+N[Math.floor(r()*N.length)],s:+sc.toFixed(1),lo:+Math.max(0,sc-w).toFixed(1),hi:+Math.min(10,sc+w).toFixed(1),av:av,hv:hv,at:Math.round(3+r()*40),ht:Math.round(2+r()*30),ch:+((r()-.5)*1.2).toFixed(1)})}
var st={q:"",f:"all",sort:"s",dir:-1,n:25,sel:null};
function ag(d){return d.av/(d.av+d.hv)}
function view(){var l=D.filter(function(d){return(!st.q||d.name.toLowerCase().indexOf(st.q.toLowerCase())>=0||String(d.id)===st.q)&&(st.f==="all"||(st.f==="agent"?ag(d)>=.5:ag(d)<.5))});
 var k=st.sort;l.sort(function(a,b){var x=k==="name"?a.name.localeCompare(b.name):k==="ag"?ag(a)-ag(b):a[k]-b[k];return x*st.dir});return l}
function dots(l){var s=U.svg("svg",{class:"dotfield",viewBox:"0 0 300 300",width:"100%",role:"group","aria-label":"Field of 100 proposals coloured by forecast score"});
 D.forEach(function(d,i){var c=U.svg("circle",{cx:15+(i%10)*30,cy:15+Math.floor(i/10)*30,r:4+d.s*.8,fill:"var(--violet)","fill-opacity":(.18+d.s/10*.82).toFixed(2),stroke:st.sel===d?"var(--text)":"none","stroke-width":st.sel===d?3:2,tabindex:"0",role:"button","aria-pressed":String(st.sel===d),"aria-label":"#"+d.id+" "+d.name+", forecast "+d.s});
  c.onclick=function(){choose(d)};c.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(d)}};s.appendChild(c)});return s}
/* selecting re-renders in place; the dot for the choice ripples so the eye finds it in the field */
function choose(d){st.sel=d;draw();if(window.Motion)Motion.ripple(document.querySelectorAll(".dotfield circle:not([data-m-keep])")[d.id-1])}
function split(d){var p=Math.round(ag(d)*100);return h("span",{class:"split","aria-label":p+"% agent volume"},[h("span",{class:"split-trk"},[h("i",{class:"mini",style:"width:"+p+"%;background:var(--violet)"}),h("i",{class:"mini",style:"width:"+(100-p)+"%;background:var(--text-2);opacity:.5"})]),h("span",{class:"num muted",style:"margin-left:8px",text:p+"% agents"})])}
function draw(){var target=document.getElementById("root"),root=h("div"),l=view();
 var tot=D.reduce(function(a,d){return{av:a.av+d.av,hv:a.hv+d.hv}},{av:0,hv:0});
 var top=h("div",{class:"cols2"},[
  h("div",{class:"panel-c"},[h("h2",{text:"Grant round · 100 proposals"}),dots(),h("p",{class:"note",text:"Bigger, brighter dot = higher forecast score. Select one."})]),
  h("div",{class:"stack"},[h("div",{class:"kpi top"},[h("div",{},[h("small",{text:"Outcomes"}),h("b",{class:"num",text:"100"})]),h("div",{},[h("small",{text:"Agent volume"}),h("b",{class:"num",text:U.money(tot.av)})]),h("div",{},[h("small",{text:"Human volume"}),h("b",{class:"num",text:U.money(tot.hv)})]),h("div",{},[h("small",{text:"Top forecast"}),h("b",{class:"num",text:D.slice().sort(function(a,b){return b.s-a.s})[0].s.toFixed(1)+" / 10"})])]),
   h("div",{class:"notice",text:"Each outcome is a proposal. The market forecasts the score human evaluators will give it. Evaluators still score the proposals; the market does not choose winners."}),
   st.sel?h("div",{class:"panel-c"},[h("div",{class:"line"},[h("h2",{text:"#"+st.sel.id+" "+st.sel.name}),h("button",{class:"btn soft",type:"button",text:"Clear",onclick:function(){st.sel=null;draw()}})]),
    h("div",{class:"kpi"},[h("div",{},[h("small",{text:"Forecast score"}),h("b",{class:"num",text:st.sel.s.toFixed(1)+" / 10"})]),h("div",{},[h("small",{text:"90% range"}),h("b",{class:"num",text:st.sel.lo+" – "+st.sel.hi})]),h("div",{},[h("small",{text:"Agent traders"}),h("b",{class:"num",text:String(st.sel.at)})]),h("div",{},[h("small",{text:"Human traders"}),h("b",{class:"num",text:String(st.sel.ht)})])])]):h("div",{class:"panel-c"},[h("h2",{text:"Select a proposal"}),h("p",{class:"note",text:"Pick a dot in the field or a proposal below to see its forecast score, 90% range and who is trading it."})])])]);
 var tb=h("div",{class:"head",style:"margin:0 0 12px"},[
  h("div",{style:"display:flex;gap:10px;flex-wrap:wrap"},[h("input",{class:"field",type:"search",placeholder:"Search proposals",value:st.q,"aria-label":"Search proposals",oninput:function(e){st.q=e.target.value;st.n=25;draw()}}),
   h("div",{class:"seg",role:"group","aria-label":"Participation"},[["all","All"],["agent","Agent-led"],["human","Human-led"]].map(function(f){return h("button",{type:"button","aria-pressed":String(st.f===f[0]),text:f[1],onclick:function(){st.f=f[0];st.n=25;draw()}})}))]),
  h("span",{class:"muted",role:"status",text:"Showing "+Math.min(st.n,l.length)+" of "+l.length})]);
 var cols=[["id","#"],["name","Proposal"],["s","Forecast score","r"],["lo","90% range","r"],["ag","Agent vs human volume"],["av","Agent vol.","r"],["hv","Human vol.","r"],["ch","7d change","r"]];
 var tr=h("tr");cols.forEach(function(c){var th=h("th",{scope:"col",class:c[2]||"","aria-sort":st.sort===c[0]?(st.dir>0?"ascending":"descending"):"none"},[h("button",{type:"button",text:c[1]+(st.sort===c[0]?(st.dir>0?" ↑":" ↓"):""),onclick:function(){if(st.sort===c[0])st.dir*=-1;else{st.sort=c[0];st.dir=c[0]==="name"||c[0]==="id"?1:-1}draw()}})]);tr.appendChild(th)});
 var body=h("tbody");l.slice(0,st.n).forEach(function(d){body.appendChild(h("tr",{tabindex:"0","data-key":"d"+d.id,class:st.sel===d?"is-sel":null,"aria-current":st.sel===d?"true":null,onclick:function(){choose(d)},onkeydown:function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(d)}}},[
  h("td",{class:"num muted c-id",text:String(d.id)}),h("td",{class:"c-n",text:d.name}),h("td",{class:"r num c-s","data-label":"Forecast",text:d.s.toFixed(1)}),h("td",{class:"r num muted c-r","data-label":"90% range",text:d.lo+"–"+d.hi}),h("td",{class:"c-ag"},[split(d)]),
  h("td",{class:"r num c-av","data-label":"Agent vol.",text:U.money(d.av)}),h("td",{class:"r num c-hv","data-label":"Human vol.",text:U.money(d.hv)}),
  h("td",{class:"r num c-ch "+(d.ch>=0?"pos":"neg"),"data-label":"7d",text:(d.ch>=0?"▲ +":"▼ ")+d.ch.toFixed(1)})]))});
 var tbl=h("div",{class:"tbl tall rtbl deep-tbl",tabindex:"0","aria-label":"Proposals table, scrollable"},[U.roles(h("table",{},[h("thead",{},[tr]),body]))]);
 /* phones: the column headers are hidden with the card layout, so the same sort state gets a select and an order toggle */
 var SORTS=[["s","Forecast score"],["ch","7d change"],["ag","Agent share of volume"],["av","Agent volume"],["hv","Human volume"],["lo","90% range, low end"],["name","Proposal name"],["id","Proposal number"]],
  ord=st.sort==="name"?(st.dir>0?"A to Z":"Z to A"):(st.dir>0?"Lowest first":"Highest first");
 var sb=h("div",{class:"sortbar m-only"},[h("label",{for:"deep-sort",text:"Sort by"}),
  h("select",{class:"field",id:"deep-sort",onchange:function(e){var k=e.target.value;st.sort=k;st.dir=k==="name"||k==="id"?1:-1;draw()}},SORTS.map(function(o){return h("option",{value:o[0],text:o[1],selected:st.sort===o[0]?"selected":null})})),
  h("button",{class:"btn soft",type:"button",onclick:function(){st.dir*=-1;draw()}},[h("span",{"aria-hidden":"true",text:st.dir>0?"↑ ":"↓ "}),ord])]);
 root.appendChild(top);root.appendChild(tb);root.appendChild(sb);root.appendChild(tbl);
 if(l.length>st.n)root.appendChild(h("button",{class:"btn lg",type:"button",style:"margin-top:12px",text:"Show 25 more",onclick:function(){st.n+=25;draw()}}));
 U.patch(target,root,{flip:"tbody tr"});
 var ss=document.getElementById("deep-sort");if(ss&&ss.value!==st.sort)ss.value=st.sort}
draw();
if(window.Motion){Motion.ready();
 Motion.reveal(".cols2 > .panel-c, .kpi.top > div, .cols2 .stack > .notice, .cols2 .stack > .panel-c, #root > .head",{onIn:Motion.dataIn});
 /* table rows: only the ones visible in the scroll box stagger in; the rest are simply there */
 var tb=document.querySelector(".tbl.tall");Motion.reveal([].slice.call(tb.querySelectorAll("tbody tr"),0,14),{rise:8,onIn:Motion.dataIn})}
})();
