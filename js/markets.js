/* Illustrative market data for the demo. Numbers are made up and shown with an "Illustrative data" label in the UI. */
window.MARKETS=[
 {id:1,q:"US announces end of Iranian blockade by…?",type:"Categorical",cat:"Politics",status:"Open",vol:170e3,liq:48e3,close:"Aug 15",outs:[["July 24",.12],["August 15",.36],["Later / never",.52]]},
 {id:2,q:"World Cup: Golden Boot winner",type:"Categorical",cat:"Sports",status:"Open",vol:60e6,liq:2.1e6,close:"Jul 19",outs:[["Kylian Mbappé",.35],["Lionel Messi",.35],["Harry Kane",.18],["Other",.12]]},
 {id:3,q:"Fed decision in July?",type:"Categorical",cat:"Business",status:"Open",vol:64e6,liq:3.4e6,close:"Jul 29",outs:[["No change",.95],["25 bps cut",.04],["50 bps cut",.01]]},
 {id:4,q:"Ballon d'Or winner 2026",type:"Categorical",cat:"Sports",status:"Open",vol:7e6,liq:410e3,close:"Oct 12",outs:[["Harry Kane",.46],["Lamine Yamal",.24],["Kylian Mbappé",.17],["Other",.13]]},
 {id:5,q:"BTC Up or Down 5m",type:"Categorical",cat:"Crypto",status:"Live",vol:1.2e6,liq:96e3,close:"5m",outs:[["Up",.51],["Down",.49]]},
 {id:6,q:"Elon Musk # tweets Jul 10 – Jul 17",type:"Multi-scalar",cat:"Pop Culture",status:"Open",vol:2e6,liq:150e3,close:"Jul 17",outs:[["140–159",.35],["160–179",.33],["180+",.22],["<140",.10]]},
 {id:7,q:"Democratic presidential nominee 2028",type:"Categorical",cat:"Elections",status:"Open",vol:1e9,liq:12e6,close:"Aug 2028",outs:[["Gavin Newsom",.20],["Alexandria Ocasio-Cortez",.14],["Other",.66]]},
 {id:8,q:"Crude oil price on Dec 31 ($/bbl)",type:"Scalar",cat:"Crude Oil",status:"Open",vol:3.3e6,liq:280e3,close:"Dec 31",scalar:{lo:40,hi:120,est:78,unit:"$"}},
 {id:9,q:"Global temperature anomaly, July (°C)",type:"Scalar",cat:"Weather",status:"Open",vol:410e3,liq:60e3,close:"Aug 10",scalar:{lo:.6,hi:1.6,est:1.12,unit:"°C"}},
 {id:10,q:"Which of these will ship in Q3? (select all that apply)",type:"Multi-categorical",cat:"Science",status:"Open",vol:880e3,liq:75e3,close:"Sep 30",outs:[["Reusable orbital refuel",.22],["Open-weights frontier model",.58],["Fusion net-gain repeat",.09]]},
 {id:11,q:"ETH and BTC price on Dec 31 (two ranges)",type:"Multi-scalar",cat:"Crypto",status:"Open",vol:5.2e6,liq:520e3,close:"Dec 31",outs:[["ETH ≥ $5k & BTC ≥ $120k",.18],["ETH ≥ $5k only",.11],["BTC ≥ $120k only",.21],["Neither",.50]]},
 {id:12,q:"Protocol upgrade passes: DAO token price in 30 days ($)",type:"Conditional",cat:"AI",status:"Open",vol:760e3,liq:90e3,close:"30 days",cond:{if:"Proposal passes",a:4.12,b:3.38,unit:"$"}},
 {id:13,q:"Grant #14 funded: monthly active users in 90 days",type:"Conditional",cat:"AI",status:"Open",vol:240e3,liq:41e3,close:"90 days",cond:{if:"Grant #14 funded",a:12400,b:9100,unit:""}},
 {id:14,q:"MLB All-Star Game: winning league",type:"Categorical",cat:"MLB ASG",status:"Resolved",vol:1.4e6,liq:0,close:"Jul 15",outs:[["American League",1],["National League",0]]},
 {id:15,q:"Clacton by-election: winning party",type:"Categorical",cat:"Clacton",status:"Closed",vol:920e3,liq:0,close:"Jul 4",outs:[["Reform",.81],["Conservative",.14],["Labour",.05]]},
 {id:16,q:"NBA offseason: top free-agent destination",type:"Categorical",cat:"NBA Offseason",status:"Open",vol:2.9e6,liq:210e3,close:"Jul 1",outs:[["New York",.31],["Los Angeles",.27],["Miami",.17],["Other",.25]]}
];
