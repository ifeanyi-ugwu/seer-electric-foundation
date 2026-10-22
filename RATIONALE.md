# Design rationale and departures from the Electric Foundation kit

The contest brief says to use Electric Foundation (EF) as the starting point for all six interfaces, to adapt it where that improves the experience, and to explain any deliberate departures from the brand kit. This file lists the departures. How the interface behaves is in [BEHAVIOUR.md](BEHAVIOUR.md).

## Scope

This is a visual and interaction concept for the contest brief. It does not cover every control of the live products, and no behaviour of the live products is assumed. Outside the concept: the portfolio page, liquidity management, rewards payouts, watchlist alerts and the explorer link. Where a control of the live product would sit in the interface, a short concept note names it instead of leading nowhere. With a specification for the rest, the same tokens, shell and components extend to cover them.

All data is illustrative and labelled as such, once per page: the "Illustrative data" note in each tool's page head and the footer note on the landing page. Nothing claims real users, funding or partners.

## Approach

One token file (`css/tokens.css`) and one shell drive all six interfaces. Colours and radii come from the EF Figma kit, and spacing and type sizes come from one shared scale in the same file. Each product keeps the shell and adds one idea of its own.

The protocol sits underneath and the apps sit on top. The landing page applies the logo's shape to the page: a hard-edged violet base layer with the five apps stacked on it in diagonal-cut columns taken from the kit's FADES artwork.

Each product shows the part of its brief that a generic market grid would hide:

- Seer app: an explorer for every market type (categorical, multi-categorical, scalar and multi-scalar, with conditional markets built on any of them), in a grid or a table, with saved markets, a trade ticket and a leaderboard of traders.
- Futarchy: a pass-versus-fail forecast of the success metric. "The market's forecast" and "The DAO's decision" are separate panels, and the copy states that the vote decides.
- Deep: 100 outcomes as a dot field beside a sortable table with agent and human volume per outcome.
- Opportunity Markets: market signal beside the reviewers' decision, with the rows where they differ flagged.
- Risk Pricing: a protocol-by-horizon heatmap and a side-by-side chart, where a single yes/no price would have stood. Protocols are anonymised.

A page does not do the same job twice unless the second adds something: one thing, once. The rules are in [One thing, once](BEHAVIOUR.md#one-thing-once).

## Departures from the EF kit

Each row is a place where the built interface differs from what the kit specifies or shows.

### Colour

| Change | Reason |
|---|---|
| Muted text lightened from `#67676F` to `#8B8B95` (dark) and `#8E8E99` to `#5F5F6B` (light) | The kit values fall below 4.5:1 on the card colours. |
| Teal and amber pass-fail and gain-loss pair (`#2FD4B5`/`#FFB020` dark, `#00705F`/`#A15C00` light) | The kit has violet only. Futarchy and Risk need a second pair that is colour-blind safe. Each use also carries an arrow, a dashed line or a text label. |
| Second violet `#8F55F7`, taken from the kit's dot artwork, used for dot accents | The kit's dot artwork carries a second violet. It is used only in the hero dot-matrix. |
| Light-mode hero ground is a lavender mixed from the violet | It matches the light comp and keeps the white slabs visible. |
| Page-head ground is the kit's hero ink (`#0C0A16`) blended with the page, or light lavender in light mode | It is calmer than the landing and visibly the same family. |
| Kit swatches mislabelled in Figma ("Button Primary" labelled `67676F`, light "Nested Surface" labelled `1F1F24`) | The build uses the actual fills (`#7D33FF`, `#F1F1F4`), not the labels. |

### Type

| Change | Reason |
|---|---|
| Inter Tight as the fallback for PP Neue Montreal | PP Neue Montreal is a paid font. It sits first in the stack, so it applies if licensed. |
| Tabular numerals via a separate numeric font stack (`.num`) | Prices and percentages align in tables. |

### Components and shape

| Change | Reason |
|---|---|
| Selects drawn with a custom chevron 16px from the right edge, per theme | The native arrow sits against the edge and differs by browser. The control stays a native select for keyboard and screen readers. |
| Cut-corner KPI tiles and primary trade buttons | Carries the slab and base-block shape into the tools without touching the data. |
| Concept text has one look, `.cn` (block) and `.cn-i` (inline) in `css/components.css`: the site's numeric type at 12px, neutral ink (`--text-2`), a dashed 1px edge and a faint hatch at the slab angle (-20deg), with no new colour | Text that says a thing is a demo, illustrative or outside the concept is not product copy, and the kit has no marking for it. One recognisable look in neutral ink keeps it apart from the product and adds no colour. Where it is used is in [Concept notes](BEHAVIOUR.md#concept-notes). |

### Graphics and hero

| Change | Reason |
|---|---|
| Slabs redrawn as theme-coloured gradients instead of a 50% soft-light blend | The blend only reads over a dark ground and vanishes in light mode. |
| Hero card pair fixed dark and light in both themes, and the back card shows a second market | The kit comp shows one card in both themes. Here the back card carries a different market, so the pair reads as a deck of markets rather than one figure printed twice. |
| Hero shows two full market cards you can swap: tap the card behind and it springs forward, then replays its dots, climbing number and bar | The kit's hero has a mostly hidden back card. Two complete, interchangeable cards show that Seer carries many markets, and each card has its own moment. |
| The front card carries the full logo (mark and wordmark) at 40px wide in the second violet, where the header uses the white logo at full size | A card is one market, so the brand sits as a quiet label above the question. |
| FADES slabs reused at low opacity as a page-head band on the app pages, drawn inline and theme-aware | An image can't follow the theme or sit cleanly behind title text. It ties the tools to the landing hero. |
| The kit's purple portrait photography, a cinematic graphic style the kit lists, is not used | The kit's own web comps use none, and the Figma file has no exportable photos. |

### Layout and spacing

| Change | Reason |
|---|---|
| Landing buttons 44px tall, against the kit's small 28px chip | Touch-target size on a marketing page. The 28px chip stays in market rows. |
| Landing hero has one button ("Explore the apps"), not the comp's "Learn More" plus "Start Now"; the nav has "Launch App" and no "Start today!" | Three controls on one screen opened the same page. The nav button is the way into the app on every scroll position; the hero leads into the story. |
| Spacing on a 4px scale (4, 8, 12, 16, 24, 32, 48, 64, with 96 and 128 for landing sections) and a short type scale (11, 12, 13, 14, 15, 16, 20, 24, then display sizes) | The kit gives colours and radii but no spacing system. One scale keeps gaps consistent and proximity readable. |

### Content

| Change | Reason |
|---|---|
| One collateral, sDAI, in every market, ticket, review, activity row and wallet balance, and no chain is named | The live products use sDAI or sUSDS depending on the chain, and Deep uses sUSDS on other chains. The single unit is a stated simplification. |

## Beyond the kit

The kit does not specify the following, so the build adds it. These are additions, not departures.

- Spacing, type scale, control heights and the three layout ranges: [Layout: three ranges](BEHAVIOUR.md#layout-three-ranges). The 4px spacing scale is also a departure row under Layout and spacing.
- Page headers, pinned header behaviour, detail sheets and page-head marks: [Page headers and sheets](BEHAVIOUR.md#page-headers-and-sheets).
- Motion language, spring presets, tokens and reduced motion: [Motion](BEHAVIOUR.md#motion).
- Light and dark theme change: [Theme change](BEHAVIOUR.md#theme-change).
- Loading, error, empty and offline states, and the system pages: [Loading, errors and the assistant](BEHAVIOUR.md#loading-errors-and-the-assistant).
- Simulated wallet, positions, trades and redeem: [Wallet, positions and redeem](BEHAVIOUR.md#wallet-positions-and-redeem).
- Simulated data layer with delay, forced errors, offline and cache: [Loading, errors and the assistant](BEHAVIOUR.md#loading-errors-and-the-assistant).
- The assistant and the judge controls: [Loading, errors and the assistant](BEHAVIOUR.md#loading-errors-and-the-assistant).
- Explorer filters, URL state, saved markets and the leaderboard: [Explorer, markets and URL state](BEHAVIOUR.md#explorer-markets-and-url-state) and [Leaderboard](BEHAVIOUR.md#leaderboard).
- Concept notes for controls outside the brief: [Concept notes](BEHAVIOUR.md#concept-notes).

## Known gaps and accessibility

- Deliberate omissions: no per-digit odometer on figures (it would double the DOM of every number and complicate the morph for a small gain at these sizes); no scroll-velocity skew. The hero uses a climbing number, which suits a single prominent figure.
- Automated audit (axe-core 4.10, WCAG 2.0/2.1 A and AA plus best practice) run on all six pages at 1440, 768 and 390px, in dark and light, including open detail states and sheets: no violations. The violet hero headline is about 3.5:1, which passes as large text. The light-mode muted text and teal values in the colour table are the ones the audit passes.
