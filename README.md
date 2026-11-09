# Mango Chutney coming soon page

A one-page site that stands in for mangochutney.com.au for about a month while the full site
in `jasondibenedetto/mango-website` is finished. It is a trimmed copy of that repo: the same
tokens, Figtree type, client logo grid, contact form (posting to the same `/api/contact`
Worker) and the "let's mango." hedgehog footer, with the nav, sub-pages and content
collections removed.

- `npm run dev` starts the local preview.
- `npm run verify` checks formatting and types, then builds.
- `npm run lighthouse` asserts the performance budgets.

Every build is noindex unless `PUBLIC_INDEXABLE=true`, which only the production deploy sets.
