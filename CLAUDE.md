@AGENTS.md

# Working on this repo as a team

`AGENTS.md` (imported above) is the technical source of truth: stack, commands,
project map, design system and performance rules. This file adds how the Mango
team (Jason, Tristan, the dev team, and Claude sessions working for any of them)
collaborates. Several people and sessions may be working at once.

## Commits and pushes

- **For now, commit straight to `main`** (Jason, 30 Oct 2026). Pull requests come back once the
  site is more established. Every push to `main` deploys to
  https://mangochutney.com.au/, so check it after you push.
- Iterate locally and push only what is settled. Experiments and design trials stay on a local
  branch that is never pushed.
- One focused change per commit, with a message that says what and why. Squash trial-and-undo
  churn before pushing.
- Never rewrite history on `main` or push to someone else's branch without being asked.
- Leave out stray files and dead code: no commented-out experiments, debug output, screenshots
  or one-off scripts.

## Before pushing

- `npm run verify` passes (format, types, content schemas, build).
- For layout, image, font or script changes, run `npm run lighthouse` and keep the budgets green.
- Look at the change at 1440 and 390 wide before calling it done.

## Brand and copy rules

These are settled design decisions; follow them in code, content and commit messages alike.

- **Type is Figtree**, everywhere (SemiBold 600 for display, headings and labels; Regular 400 for
  body). The design side settled on Figtree on 27 Oct 2026 and the Figma file uses it throughout.
  Don't swap in Roobert, Host Grotesk or any other face unless Tristan asks.
- **Words to avoid:** never "ship" (use release, launch, go live, deliver) and never "squad".
  Say "team" in headlines; "pod" is the product name (Core Pod, Growth Pod, System Pod).
- Hero H1: "Design and engineering, embedded." Primary CTA everywhere: "Start a project".
- Name the company in full as "Mango Chutney" in the footer wordmark and copyright.
- Sentence case. No black panels or black text; no drop shadows; no gradient scrims over images.
- Metrics, quotes and client names are labelled placeholders until the client approves them.
  Never invent numbers.
- Copy source of truth: `docs/design/messaging.md`. Design decisions around the Figma values:
  `docs/design/README.md`. Ask Tristan before changing headline copy.

## Design system pointers

- Code tokens: `src/styles/tokens.css`, mirrored from the Figma variables (see `AGENTS.md`).
- Figma: "Mango Website 2026". Change Figma variables first, then update `tokens.css`; never
  hard-code values in components.
- Signature effect: the "Mango Hedgehog" (sliced-mango three.js field) in
  `src/scripts/hedgehog-footer.ts`. It must stay lazy-loaded and respect reduced motion.

## Claude cloud sessions

`.claude/hooks/session-start.sh` runs at the start of every Claude Code cloud session (it does
nothing locally). When the image's Node is older than the `engines` minimum in `package.json`
(Astro refuses to run otherwise), it downloads exactly that Node version, checks it against
nodejs.org's SHASUMS256, and puts it on `PATH`. It then runs `npm ci` whenever `package.json`,
the lockfile, the hook or the Node version has changed, so `npm run build` works straight away.

## Skills to use

Claude sessions for this repo should use the Claude Code skills that fit the task, when the
session has them, and say in the commit message which ones ran. Not every teammate's Claude has every
skill; skip the ones you don't have.

| Task                                                                             | Skills                                                                                                                           |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Before pushing                                                                   | `code-review` (on your diff), then `simplify` for cleanups                                                                       |
| Hooks, scripts, forms, headers, third-party embeds, anything touching user input | `security-review`                                                                                                                |
| Building a template or component from Figma                                      | `figma-design-to-code` (Figma plugin), `design:design-handoff` for the spec, `design:design-system` to check tokens and variants |
| Changing tokens or adding a component                                            | `design:design-system` (audit or extend), keep `tokens.css` in step with Figma                                                   |
| Any visual or interactive change                                                 | `design:accessibility-review` (WCAG 2.1 AA) and `run` to see it at 1440 and 390                                                  |
| Copy, labels, error and empty states                                             | `design:ux-copy`, within the brand and copy rules above                                                                          |
| Reviewing a screen or prototype                                                  | `design:design-critique`                                                                                                         |
| Updating this file or the hook                                                   | `init`, `session-start-hook`                                                                                                     |

`run` picks up the project skill in `.claude/skills/preview-site/`, which builds the site, serves
it and takes the 1440 and 390 screenshots for any visual change.
