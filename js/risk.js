(function(){
SeerShell.mount({product:"risk",cta:"Connect wallet"});
var h=U.h,HZ=["30 days","90 days","180 days","12 months"],HS=["30d","90d","180d","12m"],TYPES=[["exploit","Exploit or hack","Hack"],["depeg","Stablecoin depeg","Depeg"],["oracle","Oracle failure","Oracle"]];
var P=[["Protocol A","Lending"],["Protocol B","Lending"],["Protocol C","DEX"],["Protocol D","Bridge"],["Protocol E","Liquid staking"],["Protocol F","Yield vault"],["Protocol G","DEX"],["Protocol H","Bridge"]],
 base={exploit:[.8,1.4,.9,4.2,1.8,3.1,1.2,5.6],depeg:[.5,.9,.3,1.1,2.4,1.6,.4,1.9],oracle:[.7,1.1,.6,.9,.8,1.9,.5,1.4]};
var st={type:"exploit",sel:[0,3],sort:0},phone=matchMedia("(max-width:600px)");
function val(t,i,z){return +(base[t][i]*[.22,.55,.8,1.15][z]*(1+((i*7+z*3)%5-2)*.04)).toFixed(1)}
function draw(animate){var target=document.getElementById("root"),root=h("div"),t=st.type,all=[],ph=phone.matches,sec=h("section",{class:"stack","aria-label":"Risk by protocol and horizon"});P.forEach(function(_,i){HZ.forEach(function(_,z){all.push(val(t,i,z))})});var mx=Math.max.apply(null,all);
 sec.appendChild(h("div",{class:"head"},[h("div",{class:"seg",role:"group","aria-label":"Risk type"},TYPES.map(function(x){return h("button",{type:"button","aria-pressed":String(t===x[0]),onclick:function(){st.type=x[0];draw()}},[h("span",{class:"rlabel",text:x[1]}),h("span",{class:"rlabel-s",text:x[2]})])})),
  h("span",{class:"muted",text:"Market-estimated probability of a loss event within each horizon"})]));
 var rows=P.map(function(p,i){return i}).sort(function(a,b){return val(t,b,st.sort)-val(t,a,st.sort)});
 var head=h("tr",{},[h("th",{scope:"col",text:"Protocol"})].concat(HZ.map(function(z,k){return h("th",{scope:"col",class:"r","aria-sort":st.sort===k?"descending":"none"},[h("button",{type:"button",text:z+(st.sort===k?" ↓":""),onclick:function(){st.sort=k;draw()}})])}),[h("th",{scope:"col",class:"r",text:"Compare"})]));
 var body=h("tbody");rows.forEach(function(i){var on=st.sel.indexOf(i)>=0;body.appendChild(h("tr",{"data-key":"p"+i,class:on?"is-cmp":null},[h("td",{class:"c-p"},[h("b",{text:P[i][0]}),h("span",{class:"muted",text:P[i][1]})])].concat(HZ.map(function(z,k){var v=val(t,i,k);return h("td",{class:"r num h","data-label":HS[k],style:"background:color-mix(in srgb,var(--violet) "+Math.round(6+v/mx*44)+"%,transparent);--g:"+(v/mx).toFixed(2),text:v.toFixed(1)+"%"})}),[h("td",{class:"c-c"},[h("button",{class:on?"btn":"btn soft",type:"button","aria-pressed":String(on),"aria-label":(on?"Remove ":"Add ")+P[i][0]+(on?" from":" to")+" comparison",text:on?"Comparing":"Add",onclick:function(){var k=st.sel.indexOf(i);if(k>=0)st.sel.splice(k,1);else{if(st.sel.length>=3)st.sel.shift();st.sel.push(i)}draw()}})])])))});
 /* phones: the horizon headers are hidden with the card layout, so the same sort state gets a select.
    From 601px the heatmap stays a table: reading down a column is the comparison. */
 if(ph)sec.appendChild(h("div",{class:"sortbar narrow-only","data-key":"sortbar"},[h("label",{for:"risk-sort",text:"Sort by risk at"}),
  h("select",{class:"field",id:"risk-sort",onchange:function(e){st.sort=+e.target.value;draw()}},HZ.map(function(z,k){return h("option",{value:String(k),text:z,selected:st.sort===k?"selected":null})}))]));
 sec.appendChild(h("div",{class:"tbl heat"+(ph?" rtbl":""),"data-key":"heat"},[U.roles(h("table",{},[h("thead",{},[head]),body]))]));
 sec.appendChild(h("p",{class:"note",text:"Darker cell = higher estimated risk. Compare up to three protocols."}));
 root.appendChild(sec);
 /* compare chart */
 /* Drawn at the panel's pixel width (no viewBox scaling) so every label stays 11px. */
 var W=Math.max(240,chartW()),nar=W<420,H=W<520?220:260,L=nar?34:44,B=30,T=18,s=U.svg("svg",{class:"chart",viewBox:"0 0 "+W+" "+H,width:W,height:H,role:"img","aria-label":"Grouped bars comparing selected protocols across horizons"}),mv=Math.max.apply(null,st.sel.map(function(i){return val(t,i,3)}).concat([1])),FILL=["var(--violet)","var(--violet-text)","var(--text-2)"],PAT=["none","6 3","2 2"];
 for(var g=0;g<4;g++){var gy=T+g*(H-T-B)/3;s.appendChild(U.svg("line",{x1:L,x2:W-8,y1:gy,y2:gy,stroke:"var(--line)"}));var tx=U.svg("text",{x:L-6,y:gy+4,"text-anchor":"end","font-size":"11",fill:"var(--muted)",class:"num"});tx.textContent=(mv*(1-g/3)).toFixed(1)+"%";s.appendChild(tx)}
 var gw=(W-L-8)/4;HZ.forEach(function(z,k){var bw=Math.min(40,(gw-(nar?6:16))/Math.max(1,st.sel.length));st.sel.forEach(function(i,j){var v=val(t,i,k),bh=v/mv*(H-T-B),x=L+k*gw+(gw-bw*st.sel.length)/2+j*bw;
  s.appendChild(U.svg("rect",{"data-key":"b"+k+"-"+i,"data-tween":"x y width height",x:x,y:H-B-bh,width:bw-3,height:bh,fill:FILL[j],"fill-opacity":j===2?.6:1,stroke:"var(--bg)","stroke-dasharray":PAT[j]}));
  var v2=U.svg("text",{"data-key":"t"+k+"-"+i,"data-tween":"x y",x:x+(bw-3)/2,y:H-B-bh-4,"text-anchor":"middle","font-size":"11",fill:"var(--text)",class:"num"});v2.textContent=v.toFixed(1);s.appendChild(v2)});
  var lb=U.svg("text",{"data-key":"z"+k,x:L+k*gw+gw/2,y:H-10,"text-anchor":"middle","font-size":"12",fill:"var(--text-2)"});lb.textContent=nar?HS[k]:z;s.appendChild(lb)});
 var leg=h("div",{class:"legend"},st.sel.map(function(i,j){return h("span",{"data-key":"l"+i},[h("i",{style:"width:12px;height:12px;display:inline-block;background:"+FILL[j]+(j===2?";opacity:.6":"")}),P[i][0]])}));
 root.appendChild(h("div",{class:"panel-c chart-panel"},[h("h2",{text:"Side by side: "+TYPES.filter(function(x){return x[0]===t})[0][1]}),st.sel.length?leg:h("p",{class:"note",text:"Pick protocols above to compare."}),st.sel.length?s:null,
  h("div",{class:"notice",text:"These are market estimates, not guarantees or advice. A market price is one input to a risk decision."})]));
 U.patch(target,root,{flip:".heat tbody tr",animate:animate!==false});
 var ss=document.getElementById("risk-sort");if(ss&&ss.value!==String(st.sort))ss.value=String(st.sort)}
/* the chart is drawn at its panel's content width (no viewBox scaling) so every label stays 11px */
/* the panel padding token is read once per width range (reading a computed style forces a style recalc) */
var padK=null,pad=16;
function chartW(){var w=document.getElementById("root").clientWidth,k=U.narrow.matches+":"+phone.matches;
 if(k!==padK){padK=k;pad=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pad-panel"))||16}return w-2*pad}
draw();
phone.addEventListener("change",function(){draw(false)});
if(window.Motion){Motion.ready();Motion.reveal("#root .head, #root > .panel-c",{onIn:Motion.dataIn});Motion.reveal(".heat tbody tr",{rise:8,onIn:Motion.dataIn})}
var lw=document.getElementById("root").clientWidth,rt;
window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){var w=document.getElementById("root").clientWidth;if(w!==lw){lw=w;draw(false)}},150)});
})();
