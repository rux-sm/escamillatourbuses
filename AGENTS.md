# AGENTS.md — the policy

The one instruction file for this repository; `CLAUDE.md` imports it.
`README.md` is what the site is and the commands.

## What this repository is

**Public, and the whole of Escamilla Tour Buses' website.** GitHub Pages
serves this tree, less its tools, at rux-sm.github.io/escamillatourbuses/, and
at escamillatourbuses.com once the domain moves. **A push to `main`
publishes**, after CI runs the check. There is no release and no build step.

It lives in its own repository because a custom domain takes a repository's
whole address. Its other half is **rux-sm.github.io**, cloned beside it:
Design, where `design/` here comes from; the Scheduler, where a quote request
lands; the `quote-request` function; and the site's plan,
`docs/plans/company-website.md`. Its `AGENTS.md` holds for work there.

## One session

A task edits every folder it touches, in both repositories, in one session.
A database change is SQL shown to rux and applied on his yes, as
rux-sm.github.io's `AGENTS.md` says, never by a deploy of this site.

## The commands

    npm run serve    the site at http://localhost:8645/
    npm run check    what CI runs before a deploy
    npm run sync     Design's committed build into design/

Publishing is `git push`. The pre-commit hook runs the check; arm it once per
clone: `git config core.hooksPath .githooks`. The site needs no log-in, so
the built-in browser pane can open it; close the tabs a session opened.

## What must not be invented

Every `rux--*` class comes from `design/css/rux.css`, Carbon compiled by
Design; the check fails on one that is not there. `design/` is never edited
here: a class or rule the site needs from Carbon is added to Design in
rux-sm.github.io, with Design's invented content, and synced.

**Where a change goes.** A colour goes in `theme.css` inside a `[data-theme]`
block. A rule on a Carbon component goes in `overrides.css` at Carbon's own
specificity, with no `!important`. A part Carbon lacks is the site's own, in
`app.css` under `website-`, every colour a `--rux-*` token. Carbon's header
takes icon actions and one text button, Request a quote, the site's main
action, shown at every width, as Quote or Cotizar on a phone.

## The facts on the pages

- No customer, driver or trip is named, and no price is shown.
- The fleet's facts come from the Scheduler's active units and the booking
  terms from rux-sm.github.io's `scheduler/docs/booking.md`.
- A change to one language is made to the other in the same commit.
- A photo of a coach shows one still in the fleet.

## Names

- **Pages** keep their file names in both languages, the Spanish under `es/`.
  A page's title is `Page — Escamilla Tour Buses`, and the home page's is the
  company's name alone. Names people read are sentence case.
- **Classes** of the site's own start `website-`.
- **Files** are lowercase, words joined by hyphens. A tool's name starts with
  its action, such as `check-` or `sync-`.

## Documents

Git history is the record. A commit message says what changed and why;
`README.md` and this file say only what is true now. Plans live in
rux-sm.github.io's `docs/plans/`. A code comment says what the code does and
why, in the present tense.

## Commits

`type(scope): Subject`, imperative, authored by rux alone with no AI
attribution. The scope is `site` for the pages and their styles and scripts,
`design` for a sync, and `tools` for the tools and CI.
