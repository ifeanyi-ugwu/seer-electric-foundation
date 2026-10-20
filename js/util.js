window.U={
 h:function(tag,attrs,kids){var n=document.createElement(tag);for(var k in attrs||{}){if(attrs[k]==null)continue;if(k==="text")n.textContent=attrs[k];else if(k==="class")n.className=attrs[k];else if(k.slice(0,2)==="on")n[k]=attrs[k];else n.setAttribute(k,attrs[k])}
  (kids||[]).forEach(function(c){if(c!=null)n.appendChild(typeof c==="string"?document.createTextNode(c):c)});return n},
 svg:function(tag,attrs){var n=document.createElementNS("http://www.w3.org/2000/svg",tag);for(var k in attrs||{})n.setAttribute(k,attrs[k]);return n},
 rng:function(seed){return function(){seed=(seed*9301+49297)%233280;return seed/233280}},
 money:function(v){if(v>=1e6)return"$"+(v/1e6).toFixed(1).replace(/\.0$/,"")+"M";if(v>=1e3)return"$"+Math.round(v/1e3)+"K";return"$"+Math.round(v)},
 clear:function(n){while(n.firstChild)n.removeChild(n.firstChild)},
 /* Update a container from freshly built DOM. With js/motion.js this morphs in place (focus, caret and scroll survive,
    keyed items animate); without it, it falls back to a plain swap. */
 patch:function(root,next,o){if(window.Motion)return Motion.patch(root,next,o);while(root.firstChild)root.removeChild(root.firstChild);while(next.firstChild)root.appendChild(next.firstChild)}
};
