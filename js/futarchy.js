(function(){
SeerShell.mount({product:"futarchy",cta:"Connect wallet"});
var h=U.h,P=[
 {id:14,t:"Fund a liquidity programme",dao:"Example DAO",metric:"Token price in 90 days",unit:"$",dec:2,pass:1.24,fail:1.09,better:"higher",vote:{f:62,a:38,end:"3 days"},vol:182e3},
 {id:15,t:"Raise protocol fee to 0.30%",dao:"Example DAO",metric:"Protocol revenue, next 30 days",unit:"$K",dec:0,pass:412,fail:388,better:"higher",vote:{f:48,a:52,end:"5 days"},vol:96e3},
 {id:16,t:"Hire a dedicated security lead",dao:"Example DAO",metric:"Critical audit findings in 6 months",unit:"",dec:1,pass:2.1,fail:3.4,better:"lower",vote:{f:81,a:19,end:"1 day"},vol:41e3},
 {id:17,t:"Diversify 20% of treasury into stables",dao:"Example DAO",metric:"Treasury value in 180 days",unit:"$M",dec:1,pass:18.2,fail:18.9,better:"higher",vote:{f:57,a:43,end:"4 days"},vol:128e3}];
var sel=P[0],range=60,branch="pass",amt=100;
function fmt(p,v){return(p.unit==="$"?"$":"")+v.toFixed(p.dec)+(p.unit&&p.unit!=="$"?" "+p.unit.replace("$",""):"")}
function series(p,key,n){var r=U.rng(p.id*7+(key==="pass"?1:2)),end=p[key],start=(p.pass+p.fail)/2,v=start,out=[];
 for(var i=0;i<n;i++){v+=(r()-.5)*Math.abs(end-start)*.9+(end-v)*(.05+i/n*.08);out.push(v)}out[n-1]=end;return out}
function chart(p,cw){
 /* Drawn at the container's pixel width so labels stay 11px at every size. */
 var W=Math.max(280,Math.round(cw)),H=W<520?200:240,L=44,B=24,T=12,R=12,a=series(p,"pass",range),b=series(p,"fail",range),all=a.concat(b),mn=Math.min.apply(null,all),mx=Math.max.apply(null,all),pad=(mx-mn)*.15||1;mn-=pad;mx+=pad;
 var X=function(i){return L+i/(range-1)*(W-L-R)},Y=function(v){return T+(1-(v-mn)/(mx-mn))*(H-T-B)};
 var s=U.svg("svg",{class:"chart",viewBox:"0 0 "+W+" "+H,width:W,height:H,role:"img","aria-label":"Forecast of "+p.metric+" if the proposal passes ("+fmt(p,p.pass)+") versus if it fails ("+fmt(p,p.fail)+")"});
 for(var g=0;g<5;g++){var gy=T+g*(H-T-B)/4,gv=mx-g*(mx-mn)/4;s.appendChild(U.svg("line",{x1:L,x2:W-R,y1:gy,y2:gy,stroke:"var(--line)"}));var t=U.svg("text",{x:L-8,y:gy+4,"text-anchor":"end","font-size":"11",fill:"var(--muted)",class:"num"});t.textContent=gv.toFixed(p.dec);s.appendChild(t)}
 var lab=[["Start",0],["Now",range-1]];lab.forEach(function(l,k){var tx=U.svg("text",{x:X(l[1]),y:H-6,"text-anchor":k?"end":"start","font-size":"11",fill:"var(--muted)"});tx.textContent=l[0];s.appendChild(tx)});
 function path(arr,col,dash){var d=arr.map(function(v,i){return(i?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1)}).join(" ");s.appendChild(U.svg("path",{d:d,fill:"none",stroke:col,"stroke-width":"2.5","stroke-dasharray":dash||"","stroke-linejoin":"round"}))}
 path(a,"var(--pos)");path(b,"var(--neg)","7 5");
 s.appendChild(U.svg("circle",{cx:X(range-1),cy:Y(a[range-1]),r:5,fill:"var(--pos)"}));
 s.appendChild(U.svg("rect",{x:X(range-1)-5,y:Y(b[range-1])-5,width:10,height:10,fill:"var(--neg)"}));
 return s}
function delta(p){var d=(p.pass-p.fail)/p.fail*100,good=(p.better==="higher")===(d>0);
 return{pct:d,good:good,text:(d>0?"+":"")+d.toFixed(1)+"% under pass",msg:"The market expects "+p.metric.toLowerCase()+" to be "+(d>0?"higher":"lower")+" if the proposal passes — "+(good?"better":"worse")+" for the DAO's stated goal."}}
function list(){var el=document.getElementById("list");U.clear(el);
 el.appendChild(h("div",{class:"muted list-label",text:"Active proposals · "+P.length}));
 P.forEach(function(p){var d=delta(p);el.appendChild(h("button",{class:"pick",type:"button","aria-pressed":String(p===sel),onclick:function(){sel=p;list();detail()}},[
  h("b",{text:"#"+p.id+" "+p.t}),h("span",{class:"muted",text:p.metric}),
  h("div",{class:"line",style:"margin-top:8px"},[h("span",{class:"num "+(d.good?"pos":"neg"),text:(d.pct>0?"▲ ":"▼ ")+d.text+(d.good?" · better":" · worse")}),h("span",{class:"muted num",text:"vote ends "+p.vote.end})])]))})}
function detail(){var p=sel,d=delta(p),el=document.getElementById("detail");U.clear(el);
 var head=h("div",{class:"panel-c"},[h("span",{class:"badge",text:"Conditional market · Proposal #"+p.id}),h("h2",{style:"font-size:20px;margin:10px 0 4px",text:p.t}),
  h("p",{class:"note",text:"Success metric: "+p.metric+". Two markets trade the metric: one pays out only if the proposal passes, the other only if it fails. The branch that does not happen is refunded."})]);
 var rg=h("div",{class:"seg",role:"group","aria-label":"Time range"},[["7 days",20],["30 days",40],["All",60]].map(function(r){return h("button",{type:"button","aria-pressed":String(range===r[1]),text:r[0],onclick:function(){range=r[1];detail()}})}));
 var ch=h("div",{class:"panel-c"},[h("div",{class:"line"},[h("h2",{text:"Market forecast of the success metric"}),rg]),
  h("div",{class:"legend"},[h("span",{},[h("i",{class:"sw",style:"border-color:var(--pos)"}),"If it passes · "+fmt(p,p.pass)]),h("span",{},[h("i",{class:"sw",style:"border-color:var(--neg);border-top-style:dashed"}),"If it fails · "+fmt(p,p.fail)])])]);
 var cw=(el.clientWidth||600)-32;ch.appendChild(chart(p,cw));
 ch.appendChild(h("div",{class:"notice",style:"margin-top:12px"},[h("b",{class:d.good?"pos":"neg",text:(d.pct>0?"\u25B2 ":"\u25BC ")+d.text+". "}),d.msg]));
 /* The fork: one metric, two conditional branches (same circle / square markers as the chart). */
 var fork=U.svg("svg",{class:"fork-lines",viewBox:"0 0 200 40",preserveAspectRatio:"none","aria-hidden":"true"});
 fork.appendChild(U.svg("path",{d:"M100 0V12C100 24 50 22 50 40",stroke:"var(--pos)","vector-effect":"non-scaling-stroke"}));
 fork.appendChild(U.svg("path",{d:"M100 0V12C100 24 150 22 150 40",stroke:"var(--neg)","stroke-dasharray":"5 4","vector-effect":"non-scaling-stroke"}));
 var sig=h("div",{class:"panel-c"},[h("h2",{text:"The market's forecast"}),
   h("div",{class:"fork-metric",text:p.metric}),fork,
   h("div",{class:"fork-legs"},[h("div",{class:"leg"},[h("small",{},[h("i",{class:"mk pass"}),"If it passes"]),h("b",{class:"num",text:fmt(p,p.pass)})]),
     h("div",{class:"leg"},[h("small",{},[h("i",{class:"mk fail"}),"If it fails"]),h("b",{class:"num",text:fmt(p,p.fail)})])]),
   h("div",{class:"fork-meta"},[h("div",{},[h("span",{text:"Gap"}),h("span",{class:"num",text:fmt(p,Math.abs(p.pass-p.fail))})]),h("div",{},[h("span",{text:"Market volume"}),h("span",{class:"num",text:U.money(p.vol)})])]),
   h("p",{class:"note",style:"margin-top:12px",text:"A signal for voters. It does not execute anything."})]);
 var dao=h("div",{class:"panel-c"},[h("h2",{text:"The DAO's decision"}),h("div",{class:"line"},[h("span",{text:"Voting open"}),h("span",{class:"muted num",text:"ends in "+p.vote.end})]),
   h("div",{style:"margin-top:12px;display:grid;gap:12px"},[["For",p.vote.f],["Against",p.vote.a]].map(function(v){return h("div",{},[h("div",{class:"line"},[h("span",{text:v[0]}),h("span",{class:"num",text:v[1]+"%"})]),h("div",{class:"vote-bar"},[h("i",{style:"width:"+v[1]+"%"})])])})),
   h("p",{class:"note",style:"margin-top:12px",text:"Token holders decide. The outcome is binding; the market forecast is not."})]);
 var two=h("div",{class:"two"},[sig,dao]);
 var pr=branch==="pass"?p.pass:p.fail,t=h("div",{class:"panel-c ticket"});
 t.appendChild(h("h2",{text:"Trade a branch"}));
 t.appendChild(h("div",{class:"seg",role:"group","aria-label":"Branch"},[["pass","If it passes"],["fail","If it fails"]].map(function(b){return h("button",{type:"button","aria-pressed":String(branch===b[0]),text:b[1],onclick:function(){branch=b[0];detail()}})})));
 t.appendChild(h("div",{class:"line"},[h("span",{text:"Current forecast"}),h("b",{class:"num",text:fmt(p,pr)})]));
 var inp=h("input",{class:"field",type:"number",min:"1",value:String(amt),id:"amt",oninput:function(){amt=Math.max(0,+inp.value||0)}});
 t.appendChild(h("label",{for:"amt",text:"Amount (USDC)"}));t.appendChild(inp);
 t.appendChild(h("button",{class:"btn lg",type:"button",text:"Connect wallet to trade"}));t.appendChild(h("p",{class:"note",text:"Demo only. If the other branch happens, this trade is refunded."}));
 [head,ch,two,t].forEach(function(n){el.appendChild(n)})}
list();detail();
var lw=document.getElementById("detail").clientWidth,rt;
window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){var w=document.getElementById("detail").clientWidth;if(w!==lw){lw=w;detail()}},150)});
})();
