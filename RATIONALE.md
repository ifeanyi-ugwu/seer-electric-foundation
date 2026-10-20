# Seer × Electric Foundation: design rationale

One token file (`css/tokens.css`) and one shell drive all six interfaces. Every colour, radius and spacing value comes from the Electric Foundation (EF) Figma kit. Each product keeps the same shell and adds one idea of its own.

## Approach

- **Protocol underneath, apps on top.** The homepage builds the logo's own idea into the page: a hard-edged violet base layer, with the five apps stacked on it in diagonal-cut columns taken from the kit's FADES artwork.
- **One shell, five products.** Every app page shares the same header and product switcher. Switching products changes the content, not the interface.
- **Each product shows the hard part of its brief**, not a generic market grid:
  - **Seer app:** a general explorer for every market type (categorical, multi-categorical, scalar, multi-scalar, conditional), grid or table, with a trade ticket. Seer's Etherscan.
  - **Futarchy:** a pass-versus-fail forecast of the success metric. "The market's forecast" and "The DAO's decision" are separate panels, and the copy says the vote decides.
  - **Deep:** 100 outcomes as a dot field plus a sortable table with agent versus human volume per outcome.
  - **Opportunity Markets:** market signal beside the reviewers' decision, with rows where they differ flagged.
  - **Risk Pricing:** a protocol-by-horizon comparison heatmap and a side-by-side chart, in place of a single yes/no price. Protocols are anonymised.
- All data is illustrative and labelled as such. Nothing claims real users, funding or partners.

## Departures from the EF kit

| Change | Reason |
|---|---|
| Muted text lightened from `#67676F` to `#8B8B95` (dark) and `#8E8E99` to `#6F6F7A` (light) | The kit values fall below 4.5:1 on the card colours. |
| Added teal/amber pass-fail and gain-loss pair (`#2FD4B5`/`#FFB020` dark, `#007F6B`/`#A15C00` light) | The kit has violet only. Futarchy and Risk need a second pair that is colour-blind safe. Always paired with an arrow, a dashed line or a text label. |
| Tabular numerals via a separate numeric font stack (`.num`) | Prices and percentages must align in tables. |
| Inter Tight as the fallback for PP Neue Montreal | PP Neue Montreal is a paid font. It sits first in the stack, so it applies if licensed. |
| Kit swatches mislabelled in Figma ("Button Primary" labelled `67676F`, light "Nested Surface" labelled `1F1F24`) | Used the actual fills (`#7D33FF`, `#F1F1F4`), not the labels. |
| Slabs redrawn as theme-coloured gradients instead of a 50% soft-light blend | The blend only reads over a dark ground and vanishes in light mode. |
| Hero card pair fixed dark and light in both themes | Matches the kit comp. It keeps the same contrast in both modes. |
| Light-mode hero ground is a lavender mixed from the violet | Matches the light comp and keeps the white slabs visible. |
| Landing buttons 44px tall, against the kit's small 28px chip | Touch-target size on a marketing page. The 28px chip stays in market rows. |
| Second violet `#8F55F7`, taken from the kit's dot artwork, used for dot accents | Used only in the hero dot-matrix. |
| Front-card logo shown as a small violet "seer" wordmark | The full logo is too small to read at card scale. |
| FADES slabs reused at low opacity as a page-head band on the app pages, drawn inline and theme-aware | An image can't follow the theme or sit cleanly behind title text. It ties the tools to the landing hero. |
| Page-head ground is the kit's hero ink (`#0C0A16`) blended with the page, or light lavender in light mode | Calmer than the landing, but visibly the same family. |
| Cut-corner KPI tiles and primary trade buttons | Carries the slab and base-block shape into the tools without touching the data. |
| Active nav link is a soft violet fill with a 2px violet underline | Matches the landing's hard-edged violet base, and the text keeps body-text contrast. |
| Violet table-scroll shadows on mobile | A neutral shadow doesn't show on the dark card colour, so there'd be no scroll cue. |
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
- Motion was checked in headless Chromium with frame captures and long-task timing. Smoothness on real devices, and Safari and Firefox fallbacks, are not verified.
- Automated audit (axe-core 4.10, WCAG 2.0/2.1 A and AA plus best practice) run on all six pages, in dark, light and 390px mobile, including open detail states: no violations. The violet hero headline is about 3.5:1, which passes as large text. Contrast fixes made from the audit: light-mode muted text darkened to `#5F5F6B` and light-mode teal to `#00705F`.
- The kit lists cinematic purple portrait photography as a graphic style. It is not used: the kit's own web comps use none, and the Figma file has no exportable photos.
