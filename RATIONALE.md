# Design rationale: Seer in the Electric Foundation kit

One token file (`css/tokens.css`) and one shell drive all six interfaces. Every colour and radius comes from the Electric Foundation (EF) Figma kit. Spacing and type sizes come from one shared scale in the same file. Each product keeps the shell and adds one idea of its own.

## Scope

This is a visual and interaction concept for the contest brief. It does not cover every control of the live products, and no behaviour of the live products is assumed. Outside the concept: the portfolio page, liquidity management, rewards payouts, watchlist alerts and the explorer link. Where a control of the live product would sit in the interface, a short concept note names it instead of leading nowhere. With a specification for the rest, the same tokens, shell and components extend to cover them.

All data is illustrative and labelled as such, once per page: the "Illustrative data" badge in each tool's page head and the footer note on the landing page. Nothing claims real users, funding or partners.

## Approach

The landing page applies the logo's shape to the page: a hard-edged violet base layer with the five apps stacked on it in diagonal-cut columns taken from the kit's FADES artwork.

Every app page shares one header and product switcher. Switching products changes the content and leaves the interface in place.

Each product shows the part of its brief that a generic market grid would hide:

- Seer app: an explorer for every market type (categorical, multi-categorical, scalar, multi-scalar, conditional), in a grid or a table, with a trade ticket.
- Futarchy: a pass-versus-fail forecast of the success metric. "The market's forecast" and "The DAO's decision" are separate panels, and the copy states that the vote decides.
- Deep: 100 outcomes as a dot field beside a sortable table with agent and human volume per outcome.
- Opportunity Markets: market signal beside the reviewers' decision, with the rows where they differ flagged.
- Risk Pricing: a protocol-by-horizon heatmap and a side-by-side chart, where a single yes/no price would have stood. Protocols are anonymised.

## One thing, once

A page does not do the same job twice unless the second adds something. A percentage next to its bar adds the exact value to the form. Two theme toggles, one figure printed in four places and a column of "Consistent" add nothing.

- Each page has one theme toggle, in the header. It reports its state with `aria-pressed` and shows the right state after toggling and after a reload.
- Each page has one wallet control, in the header. Until a wallet is connected, trade tickets end in a "Place trade" button that reads as unavailable, with one hint line holding an inline "Connect wallet" text button. Once connected, the same button runs review, signing and result inside the ticket. "Demo only" appears once, in the connect sheet.
- Each figure has one home. In Futarchy, pass and fail values live in the fork. The change under pass lives in the fork and in the proposal list, which is how proposals are compared. The reading lives in the notice and the branch price in the ticket. The chart legend carries line style only. In the explorer, the market count lives in the results line, not in a tile or the "All types" chip.
- Opportunity shows a "Differs from the market" flag inside the decision cell only where reviewers and market disagree. There is no "Signal vs decision" column, because it would print "Consistent" on most rows. The KPI tile keeps the count and the filter shows those rows.
- Page-level actions sit with the page. "Create market" is in the explorer's page head, and the header holds the global actions: wallet and theme.

## Layout: three ranges

| Range | Layout |
|---|---|
| Phone, up to 600px (checked from 280px folded covers) | Single column. Tables become cut-corner cards. Detail opens in a bottom sheet. Controls are 44px, and small chips and segment buttons keep a 44px hit area. Product nav sits on its own row. |
| Tablet and unfolded foldables, 601 to 1100px | Explorer, Deep and Opportunity rows become cards in two columns. The Risk heatmap stays a table, compacted to fit, because reading down a column is the comparison. Futarchy's proposal column becomes a row of cards above the detail. Detail opens in a side sheet. Category tabs become a select. The header is one row from 801px and two rows below. |
| Desktop, 1101px and up | Full tables, side columns, inline detail. Content measure is 1440px with 40px gutters, and prose holds to about 68 characters. |

No table or toolbar scrolls sideways at any width. The header stays pinned at every width from 280px, in portrait and landscape, on all nine pages. On two-row widths its second row tucks away while scrolling down, which keeps the bar at 52 to 60px on a landscape phone or a 280px cover screen. Gutters, the header and sheets respect safe-area insets.

## Departures from the EF kit

| Change | Reason |
|---|---|
| Muted text lightened from `#67676F` to `#8B8B95` (dark) and `#8E8E99` to `#6F6F7A` (light) | The kit values fall below 4.5:1 on the card colours. |
| Added teal/amber pass-fail and gain-loss pair (`#2FD4B5`/`#FFB020` dark, `#007F6B`/`#A15C00` light) | The kit has violet only. Futarchy and Risk need a second pair that is colour-blind safe. Always paired with an arrow, a dashed line or a text label. |
| Tabular numerals via a separate numeric font stack (`.num`) | Prices and percentages must align in tables. |
| Inter Tight as the fallback for PP Neue Montreal | PP Neue Montreal is a paid font. It sits first in the stack, so it applies if licensed. |
| Kit swatches mislabelled in Figma ("Button Primary" labelled `67676F`, light "Nested Surface" labelled `1F1F24`) | Used the actual fills (`#7D33FF`, `#F1F1F4`), not the labels. |
| Slabs redrawn as theme-coloured gradients instead of a 50% soft-light blend | The blend only reads over a dark ground and vanishes in light mode. |
| Hero card pair fixed dark and light in both themes, and the back card shows a second market | The kit comp shows one card in both themes. Here the back card carries a different market, so the pair reads as a deck of markets rather than one figure printed twice. |
| Light-mode hero ground is a lavender mixed from the violet | Matches the light comp and keeps the white slabs visible. |
| Landing buttons 44px tall, against the kit's small 28px chip | Touch-target size on a marketing page. The 28px chip stays in market rows. |
| Landing hero has one button ("Explore the apps"), not the comp's "Learn More" plus "Start Now"; the nav has "Launch App" and no "Start today!" | Three controls on one screen opened the same page. The nav button is the way into the app on every scroll position; the hero leads into the story. |
| Spacing on a 4px scale (4, 8, 12, 16, 24, 32, 48, 64, with 96 and 128 for landing sections) and a short type scale (11, 12, 13, 14, 15, 16, 20, 24, then display sizes) | The kit gives colours and radii but no spacing system. One scale keeps gaps consistent and proximity readable. |
| Controls share two heights: 40px (32px small) on desktop with a mouse, 44px (36px small, 44px hit area) on touch and below 1101px | Inputs, selects, segmented controls and chips line up in every toolbar. |
| Selects drawn with a custom chevron 16px from the right edge, per theme | The native arrow sat against the edge and differed by browser. The control stays a native select for keyboard and screen readers. |
| Second violet `#8F55F7`, taken from the kit's dot artwork, used for dot accents | Used only in the hero dot-matrix. |
| The front card carries the full logo (mark and wordmark) at 40px wide in the second violet, where the header uses the white logo at full size | A card is one market, so the brand sits as a quiet label above the question. |
| Hero shows two full market cards you can swap: tap the card behind and it springs forward, then replays its dots, climbing number and bar | The kit's hero has a mostly hidden back card. Making both cards complete and interchangeable shows that Seer carries many markets, and gives each card its own moment. |
| Hero stack is scaled as one unit from a fixed design size | Offsets and type keep their proportions at every width. |
| The back card recedes under a 0.26 layer of the ground colour | It reads as further away in both themes. |
| Dots pop by growing their radius in one JS loop, not one CSS animation per dot | A replay would otherwise cost about 110ms of style work at 4x CPU. |
| A single "Next market" chip marks the back card and is retired after the first swap | One affordance, no repeated instructions. |
| Light hero card meta text is `#44444E` | Keeps 4.5:1 under the dim layer. |
| Theme change: light leads. Going to light, light radiates out of the toggle; going to dark, the light is withdrawn into the toggle and the dark is what is left behind | Going to dark withdraws the light, so no dark is shone into the page. The toggle reads as where the light lives. A one-line switch (`LIGHT_LEADS` in `js/motion.js`) sets the direction. Browsers without view transitions get a short cross-fade, and reduced motion is instant. |
| The emerging hero card keeps its shadow off until it has cleared the front card | The shadow would otherwise leak around the front card in light mode. |
| Detail sheets pin their top bar (handle, badge, title, Close) while the body scrolls; a hairline and shadow fade in on scroll, and after 24px it condenses by transform only | Close and the title stay reachable, and nothing below the bar moves. |
| On phones the sheet's violet tick is centred and serves as the grab handle; a drag from the bar always moves the sheet, and a drag in the body moves it only when pulling down from the top | Dragging never fights scrolling the sheet body. |
| The dropdown chevron turns 180 degrees while a menu is open, on the snappy spring, via a wrapper drawn by `js/motion.js`, CSS `:open` with a JS fallback, and the native select kept | The arrow shows state, and keyboard and screen-reader behaviour stay native. |
| The assistant's replies are laid out in full from the first frame and each word fades in on its own delay, with the follow-up chips' space held while the reply streams | Rewriting the text as it streams makes the bubble grow, re-wrap line by line and re-scroll on every tick. Here only opacity changes, and the chat area keeps one size for the whole reply. |
| Focus returns to the opener 300ms after a sheet starts to close, not at the start of the exit | Returning focus to the pinned header pill (or a card) at the start makes the browser restyle it mid-slide and drop a frame. A small gain on its own. |
| A sheet that is leaving is marked `m-ghost`, and no CSS animation may run inside it | The exit moves the sheet into its own layer, and moving a node restarts its CSS animations. Without the rule the wallet steps would replay their entrance (a 16px jump to the right and back) and the assistant every message rise as the sheet closes. Only the exit runs. |
| Every programmatic focus return (closing a sheet, the wallet sheet back to the header pill) uses `preventScroll` | Some browsers scroll the page to reveal a focused control in the pinned header. Closing a sheet never moves the page. |
| A sheet leaving keeps its scroll position | Re-parenting a sheet into the exit layer resets every scroller inside it, so a long chat would jump to the top just before it closed. Scroll offsets are captured and restored around the move. |
| A list item only exits in place while its container is unchanged | When a grid becomes a table, or a list becomes an empty state, the container is reused with a different layout, so a card leaving "in place" would be drawn at the page corner for a frame. Those swaps skip the in-place exit. |
| Going Back to a page restores it with its exit undone | Browsers without cross-document view transitions (Firefox) fade `<main>` out before leaving; Back restores the page from cache, and `pageshow` removes the fade, which would otherwise leave only the header, hero and footer. |
| The sheet's grid rows are `minmax(min-content, auto)` | A ticket held at its previous height (inline `min-height`) would size its grid row to that height whenever the sheet is shorter than its content, and the review and result steps would spill out of their card. Min-content rows size to the content. |
| Sheet bottom inset is a trailing box, not padding | Firefox drops a scroll container's end padding, so the last control would sit on the sheet edge. A `::after` box carries the inset in every browser. |
| A select shows its focus ring on any focus | Firefox does not treat a click on a select as keyboard focus, so the ring and the gliding follower ring would not appear there. Selects qualify on any focus. |
| A clicked Deep dot shows no browser ring | Edge and Chrome draw their default ring on a clicked SVG dot. The ring is kept for keyboard focus, where the stroke already marks it. |
| The tool-page sun turns a full 360 degrees; the landing half-disc turns 180 | An eight-ray sun looks the same every 45 degrees, so a short turn is only visible mid-motion. A full turn reads clearly, while the half-disc flips its fill at 180. |
| The theme toggle rides above both themes during the change, in the colours of the closing view, and its icon turns with a small spring as that view closes into it | The icon would otherwise be hidden under the retreating dark layer. |
| System states (404, error, loading) share one layout: hero ground and slabs, a minimal header with the one theme toggle, copy beside one motif, and one primary action each | A visitor who hits a failure still sees the same product. The motifs are a dot-matrix 404, a violet cut-corner error block, and the mark drawing itself above skeleton cards. |
| The 404 page works out the site root at runtime and writes its base, styles and script from a head script | GitHub Pages serves 404.html at whatever URL was requested, so static relative links would break at depth. |
| The error page's variant comes from a fixed map, never from query text, and "Try again" makes a fresh request | Nothing from the URL is written to the page, and a failed page is never restored from the back-forward cache. |
| The loading page only follows a `?next` value from an allowlist, after a minimum 1.6s | Prevents it being used as an open redirect. Under reduced motion its progress steps in quarters. |
| A reusable `.sk` skeleton pattern in `css/states.css`, shaped like the explorer card | Placeholders keep the layout stable while content loads. |
| FADES slabs reused at low opacity as a page-head band on the app pages, drawn inline and theme-aware | An image can't follow the theme or sit cleanly behind title text. It ties the tools to the landing hero. |
| Page-head ground is the kit's hero ink (`#0C0A16`) blended with the page, or light lavender in light mode | Calmer than the landing, but visibly the same family. |
| Cut-corner KPI tiles and primary trade buttons | Carries the slab and base-block shape into the tools without touching the data. |
| Active nav link is a soft violet fill with a 2px violet underline | Matches the landing's hard-edged violet base, and the text keeps body-text contrast. |
| Up to 1100px, Explorer, Deep and Opportunity tables reflow into cut-corner cards from the same table markup (two columns on tablets), with explicit ARIA table roles and per-cell labels; Risk does so on phones only | No table scrolls sideways at any width. The scroll-shadow affordance is no longer needed and was removed. |
| Wherever the column headers are hidden, column sorting moves to a "Sort by" select; category tabs become a select up to 1100px | Nothing may scroll sideways, and every sort stays reachable. |
| Deep's table scrolls with the page on desktop, with sticky column headers, instead of inside a fixed-height box | The page has one scroll. |
| Detail opens in a sheet on tablets and phones (side sheet, then bottom sheet) for the Explorer, Deep and Opportunity | A side column below a long list was off screen when a row was chosen. |
| Risk compare chart uses short horizon labels (30d, 90d, 180d, 12m) on narrow screens | Keeps 11 to 12px text at 360px. |
| A small decorative glyph per product (fork, dot field, signal bars, graded bars, slab columns) | Gives each product its own mark. Hidden from screen readers. |
| Charts drawn at their real width and redrawn on resize | Keeps chart text at 11 to 12px on every screen. |
| A simulated wallet (`js/wallet.js`, `css/wallet.css`): the header control opens a pinned-header sheet with four generic ways to connect (browser, mobile with QR, hardware, email or social), a short connecting state with Cancel, a "Connection cancelled" retry state, then a connected pill with a short address and a balance that counts in | A judge can click through the whole product. One source of truth in sessionStorage, read before the first paint, so every tool page shows the same wallet with no flicker. "Demo only: no wallet is contacted and no funds move" appears once, in the connect sheet, and nowhere else. |
| The connected pill opens "Your wallet": full address with Copy (a visible "Copied"), balance, the last three demo transactions (rejected ones included, marked) and Disconnect | Everything about the wallet lives behind the one header control, so there is still exactly one wallet control per page. |
| Tickets keep their disabled "Place trade" until a wallet is connected; the single hint carries an inline "Connect wallet" text button, not a second primary button | One primary action per ticket. Connecting opens the wallet sheet above the ticket's own sheet; Escape and Tab belong to the top sheet only, and focus lands on the now active "Place trade". |
| Trades and market creation run review, signature (with Reject), rejected (Try again) and result inside the same ticket or sheet, with the ticket's height held while the flow runs | Nothing jumps to a new surface and a short step never makes a sheet shrink. Steps slide in along x on the settle spring; success draws a tick in a cut-corner violet tile, failure an outlined tile with a cross; no confetti. Focus moves to each step's heading or primary control, and connecting, signing, success and errors are announced. |
| Amount errors are live for "more than your balance" and for a negative amount, and on submit for an empty amount, wired with aria-invalid and aria-describedby. While a wallet is connected, a "Max" text button at the end of the label fills the balance rounded down to cents | The constraint is known as you type; an empty field is not scolded before you try. |
| Every ticket offers the sides its market has: Buy Yes or Buy No, Long or Short for a scalar, "If ..." or "If not" for a conditional market. A two-outcome market has no side control, because its outcome rows are the choice. The Yes and No chips on a card open the ticket on that outcome and side | A control that looks like a choice has to act as one. |
| "Create market" opens a wider sheet with the form beside a live preview drawn by the explorer's own card (one column on phones); fields follow the market type; an error summary takes focus on submit and links to each field | The preview is the real card, so what you make is what the explorer shows. Disconnected, the action reads "Connect wallet to create" and the form keeps its values while you connect. |
| A created market joins the explorer data, leads the grid and table with a "New" badge in every sort, enters with the list's own motion and a fading violet ring, and is counted by tiles, chips, tabs and filters; it can be opened and traded | It flows through the same render paths as every other market and is kept for the session. Leading in every sort is an exception, so a new market stays visible. |
| Market close times are held as days from today and a UTC hour, and `closeOf()` in `js/app.js` turns them into dates when the page loads. Cards and rows read "Closes 14 Nov" (with the year when it is not this year); the detail sheet reads "14 Nov 2026, 17:00 UTC" with a relative line below it. Dates run day, month, year everywhere | A fixed date goes stale, and open markets would show closing dates in the past. Computing them from today keeps every open market in the future, and a market made in a session uses the same helper. |
| Dollar figures come from one formatter, `U.money`: sign first with a true minus, then B, M or K, whole dollars from $1 and two decimals below it. Plain numbers use `U.num`, and shares show two decimals below 10 | One formatter keeps large and negative values readable ("$9.9B", "−$5K") on every page. |
| Every market sheet carries a "Rules and resolution" section after the tiles: a native `details` (open from 1101px) with who resolves it (Reality.eth, with Kleros arbitration if disputed), the close time, the answer or "Not reported yet", a demo market address with Copy, and the rules sentence ending in what happens if the question cannot be answered. Its Copy button is the wallet sheet's own (`W.copyBtn`, shared clipboard code and classes). The address is worked out from the market id (`U.addr`) and is not on a chain | The landing page names resolution as a step, so the sheet shows where an answer comes from and what stage it is at. A native `details` keeps keyboard and screen-reader behaviour with no script. |
| The explorer's status filter reads Open, Live, Awaiting result, In dispute and Resolved. A market that has closed without a reported answer is "Awaiting result", and one whose answer was challenged is "In dispute" | A plain "Closed" says nothing about what comes next. The words follow the stages of the oracle process. |
| A resolved market's sheet shows its outcomes as plain rows with "Won" on the winner, "Winner" in the chart head and a "Result" tile in place of Liquidity (a resolved market holds none) | Rows that look pressable but cannot be traded are a false control. |
| A conditional or scalar sheet shows the question once, in the bar; the embedded block holds only the figures | The card's head and foot would repeat the title, volume, close and type. |
| Choosing a Futarchy proposal on a tablet or phone scrolls the detail heading to just below the pinned header and moves focus to it | The detail sits under the list there, so nothing visible changed on a tap. Focus lands once the new proposal has drawn. |
| The wallet keeps positions: each trade adds its shares to a row for that product, market, outcome and side. "Your positions" in the wallet sheet lists up to four rows (market, shares and side, value at the current price, status word) with "Show all (n)" for the rest, and an open ticket says "You hold 21.05 Yes shares" above its amount field | A trade that leaves no trace reads as unfinished. The list sits in the one wallet control, so there is still no portfolio page. Prices in the demo do not move, so the current price is the one stored with the trade. Held shares always show two decimals, where a trade's own summary rounds above 10 |
| A resolved market's ticket offers "Redeem N USDC" when the wallet holds the winning outcome. It runs review, signature and result in the ticket, pays the balance, logs "Redeem" as Confirmed with a plus sign and removes the position. With no winning shares it says so. A wallet that is not connected is asked to connect first | The landing page lists Redeem as the last step. A decided Opportunity submission uses the same block for a wallet that holds the side the reviewers' decision matched, which the demo only reaches through a saved wallet that holds one |
| A wallet holds 10 shares of the resolved MLB market (American League, cost 6.20) from the first time it connects | Nothing in the demo resolves while you watch, so without it the Redeem step could not be reached. It is added once and costs no balance |
| "No markets match these filters." carries a "Clear filters" text button, and focus moves to the results line after it is used | An empty result in the place people search from needs a way out. |
| Names in Futarchy's list, Opportunity's rows, Risk's protocol cells and the detail heading wrap anywhere in a cell | A name that is a URL or an address has no break points and widened the page at 390px. |
| The index page has no wallet control | The landing page is outside the tool shell; its "Launch App" leads to the explorer, where the wallet lives. |
| The page header is pinned on all nine pages at every size, fixed to the viewport over a spacer of the same height (reserved in CSS, safe-area inset included, kept exact by JS) | A sticky header scrolls away wherever an ancestor or a breakpoint gets in the way (280px, landscape, the system pages), and a sticky bar inside the scroll-padding band makes the browser scroll the page when one of its controls takes focus. Fixed over a spacer has neither problem and causes no layout shift. |
| Page headers condense like the sheet bar: hairline and shadow fade in as soon as the page moves; past 24px (back below 12px) the ground rises by a measured amount, the content by up to 10px and the logo settles to .85, all transforms on the settle spring | One header language on the landing, the five tools and the system pages, and the same one as the sheets. The layout box never changes, so nothing below moves. |
| On two-row headers (the product nav on phones and small tablets, the landing's Documents and Blog row) the second row tucks under the core row while scrolling down past the header, and returns after 12px of scrolling up, at the top, or when it takes keyboard focus | The core row (logo, wallet or Launch App, theme) is always pinned, but the bar never holds more than 52 to 60px of a short screen. The row rolls up under an edge that travels with the ground, by transform and clip only. |
| Sticky table heads, anchors and keyboard focus stop below the pinned header: `--hdr-h` holds its visible height as it condenses or tucks, and `scroll-padding-top` the condensed height with the second row showing | Nothing lands under the header, whichever state it is in. |
| A concept note, `U.concept(text, opener)` in `js/util.js`, answers a control that exists in the live product and is outside the brief. It is used twice: "View rewards" in the wallet sheet and "View on explorer" in a market sheet's menu. The text names the live control in one literal line ("Not part of this concept. In the product this opens the market on the chain explorer.") | A control that does nothing reads as broken, and a control that is left out reads as a gap. The note says which it is. It is a cut-corner block at the foot of the screen above any sheet, one at a time, announced once through the page's polite live region, closed after 5 seconds, on Escape or with its Close button. It never takes focus, and Close returns focus to the control that opened it. Up to 760px an open sheet is lifted by the note's height (`--cn-h`), so the note sits below the sheet and covers none of it; from 761px the note stays left of the side sheet |
| "Rules and resolution" has a read-only "Collateral" row, "USDC", before "Market address" | Every market in the demo settles in USDC, and the wallet shows balances in USDC. The row states it once where a person reads how a market resolves. No network or chain name appears anywhere |
| The wallet sheet has a "Rewards" row below "Your positions" with a "View rewards" text button that shows the concept note ("In the product this lists trading and liquidity rewards.") | Rewards belong to the live product and are outside the brief. The row keeps the place the control would have, inside the one wallet control, and adds no second one |

## Motion

Every element that appears, changes, is touched or leaves has one behaviour, and that behaviour is the same on all six pages. Slabs slide along their cut angle, violet blocks wipe in along the 45-degree diagonal, indicators snap with a crisp spring, and cards and sheets settle without bounce.

### Physics

`js/spring.js` is a spring engine: a closed-form damped spring on one `requestAnimationFrame` loop, paused in hidden tabs. It has five presets:

| Preset | Constants | Overshoot and time | Used for |
|---|---|---|---|
| `press` | k 1400, c 62 | 1%, 260ms | press and release |
| `snappy` | k 900, c 46 | 2.4%, 310ms | toggles, indicators, the theme icon |
| `settle` | k 520, c 42 | none visible, 330ms | hover lift, tilt, list moves |
| `gentle` | k 260, critically damped | 580ms | entrances, sheets, the header |
| `glide` | k 150, critically damped | 760ms | count-ups, anchor scrolling |

Every spring is interruptible. A new target keeps the current position and velocity, so a tap during a release, a re-sort mid-glide or a sheet closed while opening continues the motion and does not restart it. The same curves are exported as CSS `linear()` tokens in `css/motion.css` where CSS handles the motion alone.

### Tokens

Durations are 120, 200, 320, 520 and 900ms. Stagger is 40ms, up to 8 steps. Distances are 8, 12 and 16px, lift is 2 to 3px and tilt is 4deg. Entrances decelerate and finish within about 750ms per surface, and the landing hero is the one longer sequence. Exits accelerate and take 60 to 70% of the entrance time.

### Entrance and exit

Page heads: slabs slide in along their cut, then the kicker, title, lede and action rise in turn, and the tag and primary button wipe in diagonally. Tiles, controls, cards, rows and chart parts reveal once as they enter the viewport. Figures count up on a decelerating curve, bars grow and lines draw. Items that leave after a filter fade out in place as ghosts. Sorted rows glide on springs, and a row that moved far gets a brief violet wash. Sheets spring in, from the side on tablet and desktop and from the bottom on phones, while the page behind recedes to 98.5%. They leave faster than they came.

### Hover, press and focus

Press is a spring on scale with a small overshoot on release. It starts on pointer down, so touch responds at once, and also runs on keyboard activation. Hover lift, card tilt toward the pointer, a specular highlight and inner parallax of the icon and badge exist for fine pointers only. Nothing hovers on touch. Row hover sweeps in from the edge the pointer entered. Segmented indicators travel on two springs with the leading edge stiffer, so the pill stretches and squashes. Links draw their underline in from the left and out to the right. The focus ring grows out from the control, and a follower ring glides from the previously focused control to the next.

### Data

Numbers count on a critically damped curve and keep their own format. Changed values get a soft violet wash. Charts interpolate between states, and endpoints pop and pulse once when they settle. The Futarchy chart has a pointer readout that follows with damping.

### Ambient

Ambient motion is slow, small and phase-offset: the hero slabs breathe over 14s, the dot matrix shimmers over 7s, the hero cards tilt over 13s and the LIVE marker pulses over 2.4s. All of it pauses offscreen and in hidden tabs, and none of it runs under reduced motion.

### Scroll

The landing page has three depth layers (slabs, cards, copy). The back card fans away and the app columns settle onto the protocol base. Scroll timelines drive these where supported, with a JS fallback. The progress line follows the scroll with a little inertia. In-page anchors glide on a spring and hand control back on the first wheel, touch or key.

### Constraints

Only transform, opacity, clip-path and mask animate, with four documented exceptions: colour cross-fades, the indicator's width, the row sweep and value washes. `will-change` is added while a spring runs and removed after. At most 60 rows glide at once, and the rows staying on screen go first. Re-renders morph the existing DOM, and motion state (classes and inline variables prefixed `m-`) survives the morph. Page changes use cross-document view transitions with only `<main>` moving. Browsers without them run an explicit exit of `<main>` before the link is followed.

### Reduced motion and no JavaScript

Under reduced motion every state change is instant: no springs, no loops, no parallax, no transitions. Content is visible without JavaScript. No information is carried by motion alone, and focus order and semantics do not change. Every page header reserves its height, so there is no layout shift, and it stays pinned and condensed under reduced motion with the changes made instantly.

## Known gaps

- Deliberate omissions: no per-digit odometer on figures (it would double the DOM of every number and complicate the morph for a small gain at these sizes); no scroll-velocity skew. The hero uses a climbing number, which suits a single prominent figure.
- Automated audit (axe-core 4.10, WCAG 2.0/2.1 A and AA plus best practice) run on all six pages at 1440, 768 and 390px, in dark and light, including open detail states and sheets: no violations. The violet hero headline is about 3.5:1, which passes as large text. Contrast fixes made from the audit: light-mode muted text darkened to `#5F5F6B` and light-mode teal to `#00705F`.
- The kit lists cinematic purple portrait photography as a graphic style. It is not used: the kit's own web comps use none, and the Figma file has no exportable photos.

## Loading, errors and the assistant

| Change | Reason |
|---|---|
| Every tool page loads its data through one simulated layer (`js/demo.js`, `window.SeerDemo`): delay, forced errors by scope (page data, details, transactions), offline and a cache, kept in sessionStorage for the tab and read before the first paint | Judges can see how the product behaves on a slow, failing or offline network. With the defaults a load resolves in the same frame, so a visitor who never opens the controls sees no skeleton flash. |
| Skeletons are the real layout with placeholder values: tiles keep their labels and keys and morph into figures that count up, cards and rows cross-fade (the skeleton lifts out of the flow and fades while the content enters beneath it) | No layout shift and no blank frame. Shown at once on a first load that will wait, otherwise only after 120ms, and held at least 350ms once shown, so nothing flickers. One sweep per element, staggered, static under reduced motion. |
| In-page reloads (a Futarchy proposal or range, the Risk type, an explorer filter) keep what is on screen, dimmed under a sweep, with the control that started them at full strength | The region never goes blank, the person keeps their place, and a newer request always wins over a slower older one. |
| One inline state for errors and empty results, in error.html's language: cut-corner block with the icon, kicker, title, one sentence, Try again (or the way back for not found), reference code with Copy | Page-level states are alerts and take focus; panel and sheet states are statuses and leave focus where it is. Empty ("No markets yet", "Create a market") is outlined, not filled, so it never reads as a failure, and is distinct from "No markets match these filters". |
| Offline is a slim bar at the foot of the screen; regions that failed for the network retry by themselves when it comes back | The person does not have to find each failed panel. A cached load says "Showing saved data" and then "Updated just now" in a small note at the bottom left. |
| Trades and market creation end in "Transaction failed" with the reason, Try again and Back, and wallet connect can time out, all in the existing step styles | Failures look like the rest of the flow; nothing is spent and the attempt is logged as Failed in the wallet's activity. |
| A floating assistant ball (`js/assistant.js`): production role, a scripted chat ("Ask") with page-aware suggestions; demo role, the judges' controls ("Demo") | It adds no second theme or wallet control. It steps away while any sheet is open, carries a small "Demo" tag while an override is on, and its panel is the same pinned-header sheet as every other (popover above the ball from 601px, bottom sheet on phones). "Scripted preview" and the one line about the demo controls are each said once. |
| The first visit in a tab shows a small callout above the ball, 1.5 seconds after load: "Demo controls: slow loads, errors, offline", with Open (which opens the panel on the Demo tab) and a Close icon. It is shown once per tab (`seer-as-hint` in `sessionStorage`), steps away with the ball while any sheet is open, and is retired when the panel opens. `#demo` on any page opens the Demo tab directly | The ball has no label and opens on Ask, so the demo controls were two steps from view. The callout is only a way in: what the controls do is stated once, in the Demo pane. It is a labelled `aside`, so screen readers announce it politely and it is in the tab order next to the ball. |
