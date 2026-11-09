# Mango Chutney coming soon page

A one-page stand-in for the full site (see README.md). The rules below come from the main
repo; sections about pages, content collections and the nav do not apply here.

Static Astro 7 site with Tailwind CSS v4 and content as Markdown. These rules apply to every person and agent working in this repo. Follow them over your own defaults.

## Principles

1. **Minimal.** Write the least code that does the job. No abstractions, props, options or helpers until a second real use needs them. Delete code rather than leave it unused.
2. **Fast.** Performance is a feature. Every change must keep the Lighthouse budgets in `lighthouserc.json` green: 95+ in every category, LCP under 2s, CLS under 0.05, under 50KB of JS.
3. **Findable.** Follow the SEO rules below on every page.
4. **Accessible.** WCAG 2.2 AA is the floor.
5. **Consistent.** Match the patterns already here. Reuse a component before writing new markup.

## Commands

- `npm run dev` starts the dev server. In agent sessions use `npx astro dev --background` and manage it with `astro dev stop|status|logs`.
- `npm run verify` checks formatting, types and content, then builds. **Run it before calling any change done.**
- `npm run format` formats with Prettier and sorts Tailwind classes.
- `npm run lighthouse` builds in production mode and asserts the Lighthouse budgets. Run it for any change to layout, components, images, fonts or scripts.

In CI or agent shells, run `astro check` with `CI=1` and `</dev/null` so it can't hang on a prompt.

## Project map

- `src/styles/tokens.css` holds the design tokens, mirrored from Figma. It is the only place to restyle the site.
- `src/styles/global.css` holds base styles and the utilities `container-site`, `section-lazy`, `prose-story` and `prose-content`.
- `src/content.config.ts` defines the content schemas. The build fails if content doesn't match.
- `src/content/` holds the content: `work/*.md`, `pages/*.md`, `team.yaml`, `roles.yaml`.
- `src/lib/content.ts` is the only place pages read content from. Don't import `astro:content` in pages.
- `src/lib/site.ts` holds site settings, nav, footer links and the `indexable` launch switch.
- `src/components/` holds `.astro` components. `src/layouts/BaseLayout.astro` is the document shell.
- `src/assets/` holds images that Astro optimises. Never put content images in `public/`.

## Code style

- Astro components (`.astro`) for everything. Add a UI framework only for real interactivity, and justify it in the PR.
- Tailwind utilities in markup, using design tokens only. No hard-coded colours, sizes or spacing. If a value is missing, add a token to `tokens.css`.
- Scoped `<style>` only for what utilities can't express.
- TypeScript strict. Type component props with an `interface Props`.
- Name things plainly: components in PascalCase, files match the component, props in camelCase.
- **Comments:** none by default. Make the code explain itself with clear names first. Add a comment only for a why the code can't show, such as a browser quirk or a business rule. Keep it to one short plain sentence, with no em or en dashes and no semicolons. Mark placeholders `TODO:` with a few words. One style per kind of comment: `//` for a single line, `/** … */` for anything longer and for docs on props and exports, `/* … */` in CSS and `{/* … */}` in Astro markup.
- Prettier is the formatter. Don't hand-format.

### Scripts and TypeScript

- **`const` by default.** Use `let` only when the value is reassigned, and never `var`.
- **camelCase for constants too.** Write `const budgets = […]`, not `const BUDGETS = […]`. Capitals are only for names set outside the code, such as env vars and secrets (`POSTMARK_TOKEN`).
- **Always use curly braces** on `if`, `else`, `for` and `while`, even for a single-line body. Write `if (!form) { return; }` over `if (!form) return;`.
- **Nested functions are `const` arrows.** Inside another function, write `const check = (el) => { … }`, not `function check(el) { … }`. Top-level functions can stay `function` declarations.
- **Array methods over loops.** Prefer `map`, `filter`, `find`, `some` and `every` to `for` or `while` loops that push into a mutable array. For side effects, prefer `forEach` too. Use `for…of` when the loop needs `break` or `await`, when the collection has no `forEach` (such as `attributes`), or in per-frame animation code.
- **Blank lines between steps.** Separate each stage of the logic (read input, validate, act, respond) with a blank line. Give guard clauses and error handling their own block so they stand out from the happy path. Put a blank line before every `if`, `for`, `while`, `switch`, `try` and `return`, unless it's the first line of its block. `else` stays on the closing brace (`} else {`).

## Design system

The design comes from the Figma file "Mango Website 2026" (file key `L5wXgxDWbLaH2QmUYFrWOn`). `tokens.css` mirrors its variables. Change the Figma variables first, then the tokens.

- **Breakpoints:** values step at the Figma modes, which are also the Tailwind breakpoints: `sm` 390, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1440, `3xl` 1920. Nothing grows past 3xl. Page content stops at `content-max` (1760px), centred, while backgrounds stay full width.
- **Type:** Figtree. `text-display-xl|l|m`, `text-heading-l|m|s`, `text-body-l|m|s`, `text-label`, `text-caption`, `text-signoff`, with size, line height, tracking and weight included. Weights are `font-regular` 400, `font-medium` 500 for nav items and `font-semibold` 600. Sentence case, except group labels and eyebrows, which are Title Case.
- **Grid:** `container-site` sets the page margin and the content cap. `grid-site` is the Figma layout grid (4 columns, 8 from `md`, 12 from `lg`) for `col-span-*`.
- **Spacing:** `inline-s|m|l`, `stack-s|m|l|xl`, `section`, `hero-top`, `margin` (page margin), `gutter` (grid gap for text layouts), `gutter-tight` (half the gutter, a quarter from lg, for card, tile, image and logo grids), `tap` (44px), `tile`. Use them as `p-stack-m`, `gap-gutter`, `py-section`, `px-margin`.
- **Measures and radii:** `max-w-measure`, `max-w-measure-hero`, `max-w-measure-display`, `rounded-s|m|l|pill`.
- **Colour:** semantic and theme driven. Wrap sections in `<Section theme="…">` (light, grey, orange, yellow, blue, green, aqua, pink, ultraviolet, hedgehog) and use `bg-bg`, `bg-card`, `bg-placeholder`, `text-fg`, `text-fg-muted`, `bg-action`, `text-action-fg`, `bg-accent`, `border-border`, `border-field-stroke`. Pages open in their colour, break to white once and close in colour with the footer.
- **Components:** `Section`, `SectionHeading`, `Button`, `Tag`, `Icon`, `Logo`, `Media`, `WorkTile`, `ReleaseLog`, `IndustryTile`, `IndexList`, `CtaBand`, `ContactPanel`, `Nav`, `Footer`.
- **Tilt:** add `data-tilt` to any card to make it pivot in 3D toward the pointer with a soft grainy glow in the opposite corner (`src/scripts/tilt.ts`, styles in `global.css`). Tune it per card with `--tilt-max`, `--tilt-perspective`, `--tilt-shine` and `--tilt-glare` (`-1` opposite the pointer, `1` under it). Fine pointers only, off for reduced motion. The nav section cards use it.
- **Templates built:** Home, Work, Case study, About. Still to build from Figma: Solutions, Embedded Product Pods, Shopify Performance & CRO, AI capabilities, Approach, Start, Industry pages, Insights, Privacy, Accessibility.
- Code generated from Figma (often React and Tailwind) is a reference. Rebuild it with these components and tokens. Never paste it in.

## Performance

- **No client JavaScript by default.** Prefer HTML and CSS (`<details>`, popover, `:has()`). If JS is needed, use a component `<script>`. Load heavy libraries with a dynamic `import()` only when needed, never globally.
- **Images:** always `Media` or `<Image>`/`<Picture>` from `astro:assets`, with real `alt` text and a `sizes` that matches the layout. Exactly one `priority` image per page, the LCP image.
- **Fonts:** only through the Fonts API in `astro.config.mjs`. Never link to a font CDN. Keep weights and subsets to what's used.
- **Motion:** animate `transform` and `opacity` only, and respect `prefers-reduced-motion`.
- **Third-party scripts** (analytics, chat, embeds) need sign-off. Load them on interaction or idle, and put embeds behind a facade.
- Use `lazy` on below-the-fold sections. Reserve space for anything injected so nothing shifts.

## SEO

- Every page passes a unique `title` (under 60 characters) and `description` (under 160) to `BaseLayout`. Titles render as `Page | Mango Chutney`.
- Exactly one `<h1>` per page. Headings in order. Descriptive link text. No text baked into images.
- Page-specific structured data goes in the `schema` prop as JSON-LD: Organization and WebSite on home, BreadcrumbList on case studies. Articles set `type="article"` and pass their image.
- New routes are added to the sitemap automatically. Never block them in `robots.txt`.
- Every build is noindex with a disallow-all `robots.txt` unless `PUBLIC_INDEXABLE=true`. Only the production deploy sets it.

## Accessibility

Semantic HTML, labelled form fields, visible focus (styled globally), AA colour contrast, `aria-current` on the active nav link, keyboard access for anything interactive, and a 44px minimum tap target.

## Editing content

Content is edited by people across the agency, often through Claude.

- **Case studies** live at `src/content/work/<slug>.md`, and the filename is the URL. The body is the story: `## Heading` then paragraphs. `ezlicence.md` is the complete example. `featured: true` puts a project in the Work menu. Cover images go in `src/assets/work/`.
- **Other content:** team in `team.yaml`, roles in `roles.yaml`, About copy in `pages/about.md`. Any other `pages/<slug>.md` becomes `/<slug>`.
- Follow the schema exactly. Set `draft: true` to hide an entry from production.
- Never invent metrics, quotes or client names. They need client approval.
- For a content request, edit only content files.

## Git

- For now, commit straight to `main`. Pull requests come back once the site is more established. Every push to `main` deploys to https://mango-website.mango-chutney.workers.dev/.
- `npm run verify` must pass before you commit. Run `npm run lighthouse` too when the change can affect performance.
- One focused change per commit, with a message that says what and why.
- Never commit `.env` files, build output or secrets.

## Moving to a CMS later

Swap a collection's `loader` in `src/content.config.ts` for a CMS loader that returns the same shape. Pages stay unchanged.

## Documentation

Astro docs: https://docs.astro.build. Read the relevant guide before working on routing, components, content collections, styling, images or fonts.
