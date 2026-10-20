(function(){
SeerShell.mount({product:"risk",cta:"Connect wallet"});
var h=U.h,HZ=["30 days","90 days","180 days","12 months"],TYPES=[["exploit","Exploit or hack"],["depeg","Stablecoin depeg"],["oracle","Oracle failure"]];
var P=[["Protocol A","Lending"],["Protocol B","Lending"],["Protocol C","DEX"],["Protocol D","Bridge"],["Protocol E","Liquid staking"],["Protocol F","Yield vault"],["Protocol G","DEX"],["Protocol H","Bridge"]],
 base={exploit:[.8,1.4,.9,4.2,1.8,3.1,1.2,5.6],depeg:[.5,.9,.3,1.1,2.4,1.6,.4,1.9],oracle:[.7,1.1,.6,.9,.8,1.9,.5,1.4]};
var st={type:"exploit",sel:[0,3],sort:0};
function val(t,i,z){return +(base[t][i]*[.22,.55,.8,1.15][z]*(1+((i*7+z*3)%5-2)*.04)).toFixed(1)}
function draw(){var root=document.getElementById("root");U.clear(root);var t=st.type,all=[];P.forEach(function(_,i){HZ.forEach(function(_,z){all.push(val(t,i,z))})});var mx=Math.max.apply(null,all);
 root.appendChild(h("div",{class:"head",style:"margin:0 0 12px"},[h("div",{class:"seg",role:"group","aria-label":"Risk type"},TYPES.map(function(x){return h("button",{type:"button","aria-pressed":String(t===x[0]),text:x[1],onclick:function(){st.type=x[0];draw()}})})),
  h("span",{class:"muted",text:"Market-estimated probability of a loss event within each horizon"})]));
 var rows=P.map(function(p,i){return i}).sort(function(a,b){return val(t,b,st.sort)-val(t,a,st.sort)});
 var head=h("tr",{},[h("th",{scope:"col",text:"Protocol"}),h("th",{scope:"col",text:"Type"})].concat(HZ.map(function(z,k){return h("th",{scope:"col",class:"r","aria-sort":st.sort===k?"descending":"none"},[h("button",{type:"button",text:z+(st.sort===k?" ↓":""),onclick:function(){st.sort=k;draw()}})])}),[h("th",{scope:"col",text:"Compare"})]));
 var body=h("tbody");rows.forEach(function(i){var on=st.sel.indexOf(i)>=0;body.appendChild(h("tr",{},[h("td",{text:P[i][0]}),h("td",{class:"muted",text:P[i][1]})].concat(HZ.map(function(z,k){var v=val(t,i,k);return h("td",{class:"r num h",style:"background:color-mix(in srgb,var(--violet) "+Math.round(6+v/mx*44)+"%,transparent);--g:"+(v/mx).toFixed(2),text:v.toFixed(1)+"%"})}),[h("td",{},[h("button",{class:on?"btn":"btn soft",type:"button","aria-pressed":String(on),"aria-label":(on?"Remove ":"Add ")+P[i][0]+(on?" from":" to")+" comparison",text:on?"Comparing":"Add",onclick:function(){var k=st.sel.indexOf(i);if(k>=0)st.sel.splice(k,1);else{if(st.sel.length>=3)st.sel.shift();st.sel.push(i)}draw()}})])])))});
 root.appendChild(h("p",{class:"tbl-hint",text:"Scroll the table sideways for more horizons"}));
 root.appendChild(h("div",{class:"tbl heat"},[h("table",{},[h("thead",{},[head]),body])]));
 root.appendChild(h("p",{class:"note",style:"margin:8px 0 20px",text:"Darker cell = higher estimated risk. Every cell shows its number. Select up to three protocols to compare."}));
 /* compare chart */
 /* Drawn at the panel's pixel width (no viewBox scaling) so every label stays 11px. */
 var W=Math.max(300,root.clientWidth-32),H=W<520?220:260,L=44,B=30,T=18,s=U.svg("svg",{class:"chart",viewBox:"0 0 "+W+" "+H,width:W,height:H,role:"img","aria-label":"Grouped bars comparing selected protocols across horizons"}),mv=Math.max.apply(null,st.sel.map(function(i){return val(t,i,3)}).concat([1])),FILL=["var(--violet)","var(--violet-text)","var(--text-2)"],PAT=["none","6 3","2 2"];
 for(var g=0;g<4;g++){var gy=T+g*(H-T-B)/3;s.appendChild(U.svg("line",{x1:L,x2:W-8,y1:gy,y2:gy,stroke:"var(--line)"}));var tx=U.svg("text",{x:L-6,y:gy+4,"text-anchor":"end","font-size":"11",fill:"var(--muted)",class:"num"});tx.textContent=(mv*(1-g/3)).toFixed(1)+"%";s.appendChild(tx)}
 var gw=(W-L-8)/4;HZ.forEach(function(z,k){var bw=Math.min(40,(gw-16)/Math.max(1,st.sel.length));st.sel.forEach(function(i,j){var v=val(t,i,k),bh=v/mv*(H-T-B),x=L+k*gw+(gw-bw*st.sel.length)/2+j*bw;
  s.appendChild(U.svg("rect",{x:x,y:H-B-bh,width:bw-3,height:bh,fill:FILL[j],"fill-opacity":j===2?.6:1,stroke:"var(--bg)","stroke-dasharray":PAT[j]}));
  var v2=U.svg("text",{x:x+(bw-3)/2,y:H-B-bh-4,"text-anchor":"middle","font-size":"11",fill:"var(--text)",class:"num"});v2.textContent=v.toFixed(1);s.appendChild(v2)});
  var lb=U.svg("text",{x:L+k*gw+gw/2,y:H-10,"text-anchor":"middle","font-size":"12",fill:"var(--text-2)"});lb.textContent=z;s.appendChild(lb)});
 var leg=h("div",{class:"legend"},st.sel.map(function(i,j){return h("span",{},[h("i",{style:"width:12px;height:12px;display:inline-block;background:"+FILL[j]+(j===2?";opacity:.6":"")}),P[i][0]+" · "+P[i][1]])}));
 root.appendChild(h("div",{class:"panel-c"},[h("h2",{text:"Side-by-side: "+TYPES.filter(function(x){return x[0]===t})[0][1]}),st.sel.length?leg:h("p",{class:"note",text:"Pick protocols above to compare."}),st.sel.length?s:null,
  h("div",{class:"notice",style:"margin-top:12px",text:"These are market estimates, not guarantees or advice. A market price is one input to a risk decision."})]));}
draw();
var lw=document.getElementById("root").clientWidth,rt;
window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){var w=document.getElementById("root").clientWidth;if(w!==lw){lw=w;draw()}},150)});
})();
