/* Illustrative market data for the demo. Numbers are made up and shown with an "Illustrative data" label in the UI.
   Markets created in the App during a session are added in front of these (js/app.js) and flow through the same renders.
   Close times are relative: closeIn is days from today and closeAt the UTC hour, turned into a date by closeOf() in js/app.js,
   so the open markets never go stale. close is a plain label for a market with no date (BTC, 5m). */
window.MARKETS=[
 {id:1,q:"US announces end of Iranian blockade by…?",type:"Categorical",cat:"Politics",status:"Open",vol:170e3,liq:48e3,closeIn:71,closeAt:17,outs:[["30 Nov",.12],["31 Dec",.36],["Later / never",.52]]},
 {id:2,q:"World Cup 2030: Golden Boot winner",type:"Categorical",cat:"Sports",status:"Open",vol:60e6,liq:2.1e6,closeIn:1370,closeAt:20,outs:[["Kylian Mbappé",.35],["Lionel Messi",.35],["Harry Kane",.18],["Other",.12]]},
 {id:3,q:"Fed decision in December?",type:"Categorical",cat:"Business",status:"Open",vol:64e6,liq:3.4e6,closeIn:49,closeAt:19,outs:[["No change",.95],["25 bps cut",.04],["50 bps cut",.01]]},
 {id:4,q:"Ballon d'Or winner 2027",type:"Categorical",cat:"Sports",status:"Open",vol:7e6,liq:410e3,closeIn:360,closeAt:18,outs:[["Harry Kane",.46],["Lamine Yamal",.24],["Kylian Mbappé",.17],["Other",.13]]},
 {id:5,q:"BTC Up or Down 5m",type:"Categorical",cat:"Crypto",status:"Live",vol:1.2e6,liq:96e3,close:"5m",outs:[["Up",.51],["Down",.49]]},
 {id:6,q:"Elon Musk # tweets, 3 to 9 Nov",type:"Multi-scalar",cat:"Pop Culture",status:"Open",vol:2e6,liq:150e3,closeIn:19,closeAt:16,outs:[["140 to 159",.35],["160 to 179",.33],["180+",.22],["<140",.10]]},
 {id:7,q:"Democratic presidential nominee 2028",type:"Categorical",cat:"Elections",status:"Open",vol:1e9,liq:12e6,closeIn:655,closeAt:12,outs:[["Gavin Newsom",.20],["Alexandria Ocasio-Cortez",.14],["Other",.66]]},
 {id:8,q:"Crude oil price on 31 Dec ($/bbl)",type:"Scalar",cat:"Crude Oil",status:"Open",vol:3.3e6,liq:280e3,closeIn:71,closeAt:17,scalar:{lo:40,hi:120,est:78,unit:"$",per:"$/bbl"}},
 {id:9,q:"Global temperature anomaly, October (°C)",type:"Scalar",cat:"Weather",status:"Open",vol:410e3,liq:60e3,closeIn:24,closeAt:12,scalar:{lo:.6,hi:1.6,est:1.12,unit:"°C"}},
 {id:10,q:"Which of these will ship in Q4? (select all that apply)",type:"Multi-categorical",cat:"Science",status:"Open",vol:880e3,liq:75e3,closeIn:71,closeAt:23,outs:[["Reusable orbital refuel",.22],["Open-weights frontier model",.58],["Fusion net-gain repeat",.09]]},
 {id:11,q:"ETH and BTC price on 31 Dec (two ranges)",type:"Multi-scalar",cat:"Crypto",status:"Open",vol:5.2e6,liq:520e3,closeIn:71,closeAt:21,outs:[["ETH ≥ $5k & BTC ≥ $120k",.18],["ETH ≥ $5k only",.11],["BTC ≥ $120k only",.21],["Neither",.50]]},
 {id:12,q:"Protocol upgrade passes: DAO token price in 30 days ($)",type:"Conditional",cat:"AI",status:"Open",vol:760e3,liq:90e3,closeIn:30,closeAt:17,cond:{if:"Proposal passes",a:4.12,b:3.38,unit:"$"}},
 {id:13,q:"Grant #14 funded: monthly active users in 90 days",type:"Conditional",cat:"AI",status:"Open",vol:240e3,liq:41e3,closeIn:90,closeAt:17,cond:{if:"Grant #14 funded",a:12400,b:9100,unit:""}},
 {id:14,q:"MLB All-Star Game: winning league",type:"Categorical",cat:"MLB ASG",status:"Resolved",vol:1.4e6,liq:0,closeIn:-98,closeAt:19,outs:[["American League",1],["National League",0]]},
 {id:15,q:"Clacton by-election: winning party",type:"Categorical",cat:"Clacton",status:"Closed",vol:920e3,liq:0,closeIn:-109,closeAt:22,outs:[["Reform",.81],["Conservative",.14],["Labour",.05]]},
 {id:16,q:"NBA 2027 offseason: top free-agent destination",type:"Categorical",cat:"NBA Offseason",status:"Open",vol:2.9e6,liq:210e3,closeIn:250,closeAt:16,outs:[["New York",.31],["Los Angeles",.27],["Miami",.17],["Other",.25]]}
];
