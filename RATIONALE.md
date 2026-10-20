# Seer × Electric Foundation: design rationale

One token file (`css/tokens.css`) and one shell drive all six interfaces. Every colour and radius comes from the Electric Foundation (EF) Figma kit; spacing and type sizes come from one shared scale in the same file. Each product keeps the same shell and adds one idea of its own.

## Approach

- **Protocol underneath, apps on top.** The homepage builds the logo's own idea into the page: a hard-edged violet base layer, with the five apps stacked on it in diagonal-cut columns taken from the kit's FADES artwork.
- **One shell, five products.** Every app page shares the same header and product switcher. Switching products changes the content, not the interface.
- **Each product shows the hard part of its brief**, not a generic market grid:
  - **Seer app:** a general explorer for every market type (categorical, multi-categorical, scalar, multi-scalar, conditional), grid or table, with a trade ticket. Seer's Etherscan.
  - **Futarchy:** a pass-versus-fail forecast of the success metric. "The market's forecast" and "The DAO's decision" are separate panels, and the copy says the vote decides.
  - **Deep:** 100 outcomes as a dot field plus a sortable table with agent versus human volume per outcome.
  - **Opportunity Markets:** market signal beside the reviewers' decision, with rows where they differ flagged.
  - **Risk Pricing:** a protocol-by-horizon comparison heatmap and a side-by-side chart, in place of a single yes/no price. Protocols are anonymised.
- All data is illustrative and labelled as such, once per page: the "Illustrative data" badge in each tool's page head, and the footer note on the landing page. Nothing claims real users, funding or partners.

## One thing, once

Nothing on a page does the same job twice unless the second adds something. A percentage next to its bar is fine (form and exact value); two theme toggles, one figure printed in four places, or a column of "Consistent" are not.

- **One theme toggle per page**, in the header. It reports its state (`aria-pressed`) and is correct after toggling and after a reload.
- **One wallet control per page**, in the header. Trade tickets end in a "Place trade" button that reads as unavailable, with one hint line: connect a wallet first; demo only.
- **Each figure has one home.** Futarchy: pass and fail values live in the fork, the change under pass in the fork and in the proposal list (the list is how you compare proposals), the reading in the notice, the branch price in the ticket. The chart legend carries line style only. Explorer: the market count lives in the results line, not in a tile or the "All types" chip.
- **Exceptions, not non-events.** Opportunity shows a "Differs from the market" flag inside the decision cell only where reviewers and market disagree; the "Signal vs decision" column that printed "Consistent" on most rows is gone. The KPI tile keeps the count, and the filter shows just those rows.
- **Page-level actions sit with the page.** "Create market" moved from the header into the explorer's page head; the header holds the global actions (wallet, theme).

## Layout: three ranges

| Range | Layout |
|---|---|
| Phone, up to 600px (checked from 280px folded covers) | Single column. Tables become cut-corner cards. Detail opens in a bottom sheet. Controls are 44px; small chips and segment buttons keep a 44px hit area. Product nav sits on its own row. |
| Tablet and unfolded foldables, 601 to 1100px | Explorer, Deep and Opportunity rows become cards in two columns; the Risk heatmap stays a table (reading down a column is the comparison), compacted to fit. Futarchy's proposal column becomes a row of cards above the detail. Detail opens in a side sheet. Category tabs become a select. The header is one row from 801px and two rows below. |
| Desktop, 1101px and up | Full tables, side columns, inline detail. Content measure is 1440px with 40px gutters; prose holds to about 68 characters. |

No table or toolbar scrolls sideways at any width. Short landscape phones get a header that scrolls away; gutters and sheets respect safe-area insets.

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
| Landing hero has one button ("Explore the apps"), not the comp's "Learn More" plus "Start Now"; the nav keeps "Launch App" and drops "Start today!" | Three controls on one screen opened the same page. The nav button is the way into the app on every scroll position; the hero leads into the story. |
| Spacing on a 4px scale (4, 8, 12, 16, 24, 32, 48, 64, with 96 and 128 for landing sections) and a short type scale (11, 12, 13, 14, 15, 16, 20, 24, then display sizes) | The kit gives colours and radii but no spacing system. One scale keeps gaps consistent and proximity readable. |
| Controls share two heights: 40px (32px small) on desktop with a mouse, 44px (36px small, 44px hit area) on touch and below 1101px | Inputs, selects, segmented controls and chips line up in every toolbar. |
| Selects drawn with a custom chevron 16px from the right edge, per theme | The native arrow sat against the edge and differed by browser. The control stays a native select for keyboard and screen readers. |
| Second violet `#8F55F7`, taken from the kit's dot artwork, used for dot accents | Used only in the hero dot-matrix. |
| Front-card logo shown as a small violet "seer" wordmark | The full logo is too small to read at card scale. |
| FADES slabs reused at low opacity as a page-head band on the app pages, drawn inline and theme-aware | An image can't follow the theme or sit cleanly behind title text. It ties the tools to the landing hero. |
| Page-head ground is the kit's hero ink (`#0C0A16`) blended with the page, or light lavender in light mode | Calmer than the landing, but visibly the same family. |
| Cut-corner KPI tiles and primary trade buttons | Carries the slab and base-block shape into the tools without touching the data. |
| Active nav link is a soft violet fill with a 2px violet underline | Matches the landing's hard-edged violet base, and the text keeps body-text contrast. |
| Up to 1100px, Explorer, Deep and Opportunity tables reflow into cut-corner cards from the same table markup (two columns on tablets), with explicit ARIA table roles and per-cell labels; Risk does so on phones only | No table scrolls sideways at any width. The scroll-shadow affordance is no longer needed and was removed. |
| Wherever the column headers are hidden, column sorting moves to a "Sort by" select; category tabs become a select up to 1100px | Nothing may scroll sideways, and every sort stays reachable. |
| Deep's table scrolls with the page on desktop, with sticky column headers, instead of inside a fixed-height box | One scroll, not two. |
| Detail opens in a sheet on tablets and phones (side sheet, then bottom sheet) for the Explorer, Deep and Opportunity | A side column below a long list was off screen when a row was chosen. |
| Risk compare chart uses short horizon labels (30d, 90d, 180d, 12m) on narrow screens | Keeps 11 to 12px text at 360px. |
| A small decorative glyph per product (fork, dot field, signal bars, graded bars, slab columns) | Gives each product its own mark. Hidden from screen readers. |
| Charts drawn at their real width and redrawn on resize | Keeps chart text at 11 to 12px on every screen. |

## Motion principles

- One language across all six pages: five durations and four easings live in `css/motion.css`, and every transition uses them.
- Decelerate in, quick out. Distances are 8 to 16px. Stagger is 40 to 50ms, capped near 400ms.
- Motion shows what changed and where it went: lists glide to their new positions, charts redraw between states, numbers tick to new values.
- Re-renders morph the existing DOM instead of rebuilding it, so scroll position, focus and the text caret survive.
- Page changes use cross-document view transitions. Only `<main>` is animated, so the header holds still.
- Reduced motion means instant state. Content is visible without JavaScript.
- The tool-page header is a sticky wrapper with its height reserved, so there is no layout shift (CLS 0).

## Known gaps

- (resolved) Documents and Blog now link to Seer's GitBook docs and Medium blog.
- Layout was checked in headless Chromium at 280 to 2560px, in both themes, including landscape phones (844x390, 740x360). Container queries and `:has()` need current browsers (Safari 16+, Firefox 121+); older ones get a usable but less tuned layout. Real devices, Safari and Firefox are not verified.
- Motion was checked in headless Chromium with frame captures and long-task timing. Smoothness on real devices, and Safari and Firefox fallbacks, are not verified.
- Automated audit (axe-core 4.10, WCAG 2.0/2.1 A and AA plus best practice) run on all six pages at 1440, 768 and 390px, in dark and light, including open detail states and sheets: no violations. The violet hero headline is about 3.5:1, which passes as large text. Contrast fixes made from the audit: light-mode muted text darkened to `#5F5F6B` and light-mode teal to `#00705F`.
- The kit lists cinematic purple portrait photography as a graphic style. It is not used: the kit's own web comps use none, and the Figma file has no exportable photos.
