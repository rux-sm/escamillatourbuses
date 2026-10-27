# Escamilla Tour Buses

The company's public website, in English and Spanish, served by GitHub Pages
at **rux-sm.github.io/escamillatourbuses/** as a preview beside the company's
current site. `docs/plans/company-website.md` in rux-sm.github.io is how it
takes escamillatourbuses.com once the manager approves it. `AGENTS.md` is the
rules.

## What it is

Seven pages in each language, plain HTML with no build step:

| Page | English | Spanish |
| :--- | :--- | :--- |
| Home | `index.html` | `es/index.html` |
| Fleet | `buses.html` | `es/buses.html` |
| Services | `services.html` | `es/services.html` |
| About us, with Drive with us | `about.html` | `es/about.html` |
| Contact, with common questions | `contact.html` | `es/contact.html` |
| Request a quote | `quote.html` | `es/quote.html` |
| Thank you | `thanks.html` | `es/thanks.html` |

`404.html` answers any address with no page, in both languages. Every other
page links its other language at the same place, in the header and the
footer, and names it in an `hreflang` link.

## A preview, until it takes the address

- Every page asks search engines not to list it, with `robots` `noindex`.
- No page carries a preview notice; the pages read as the finished site.
- The quote form sends nothing while `app.js` has no Turnstile site key: it
  opens the thank-you page, which says a request reaches the office once the
  site is live. With the key, it sends a request that passes its checks to
  the scheduler's `quote-request` function, and the thank-you page gives the
  request's number and what happens next.

## Its parts

- `design/` is Design's built stylesheets, fonts and the scripts the header's
  menu and the FAQ need, copied from rux-sm.github.io by `npm run sync` and
  never edited here. `design/SOURCE` names the commit they came from.
- Every page is on Design's `apple-dark` theme, which `theme.css` takes
  to near black with brighter type: tiles a step lighter, fields black
  inside a line, rounded corners and the device's own typeface. It also
  makes every primary button the logo's blue made vivid, keeps Apple's
  light blue for links, and greys the footer's links.
  Each page's `main` carries Carbon's large layout size, so its buttons,
  fields and FAQ rows are 48px tall.
- `app.css` holds the parts Carbon has no component for, under `website-`:
  the header's quote button, the bands, the hero and its reasons to book, the page's
  opening heading, section heads, rows of tiles, plain icons, lists of linked
  rows, photo cards,
  the steps, a note under a row of tiles, the common questions' width, the
  features, photos and the gallery's links to them at full size, the calls
  to action, the form's pairs and headings, the quote page's What happens
  next box and the phone under its opening, and the footer. The home page's
  hero runs under the header, and a strip under it gives five short facts,
  the first the company's federal safety rating; every other page opens on
  its heading. Five pages close on a photo band holding the call to action:
  Home and Fleet on the same coach, since Fleet's gallery holds every other
  photo, and Services, About and Contact each on their own.
- `overrides.css` sets the header at 64px, inset 8px at each end with its
  menu and call buttons in its middle, a small quote button beside the call
  on a phone, charcoal with a hairline under it and
  see-through over the home page's hero, sets the phone's menu at 16px in
  48px rows, narrows the page's inset on a
  phone, keeps a stacked tile's gaps, gives a row's tiles and the What
  happens next box more room inside and a photo card none, sets the quote
  form's typing at 16px and its labels at 14px, shows a wrong field's error
  in place of its help, keeps a date's box level with its time's, widens its
  text area, rings
  its unchosen radios and checkbox, lets a call to action fill a phone's
  width, gives every button a 6px corner and sets a page's headline at
  medium weight.
- `app.js` turns the header see-through while the home page's hero is under
  it, and is the quote form: its checks and their words in both languages,
  the first wrong field in the form's order, the return that a one-way trip
  hides, the draft kept in the tab's session storage until a request lands,
  the send, with a field only a bot fills and why a send failed, and the
  number on the thank-you page. The form asks for the trip first, then its
  needs, then who is asking.
- `brand/` holds the logo, `logo-on-dark.svg`, the same with its grey
  lightened for the dark header and footer, `logo-wordmark.svg`, the logo
  without TOUR BUSES, `favicon.svg`, the company's bus, for a customer's
  tab, `apple-touch-icon.png`, the same bus in white on the company's blue
  for a phone's home screen, and `share.jpg`, the picture a shared link
  shows.
- `photos/` holds each photo as WebP at two widths, the larger and a
  `-small` copy at half its width, without their metadata. A photo shows
  whole, except a tall one beside words, cut to 4:3 from its foot, or from
  its middle where the coach stands there.

## The facts on the pages

The fleet is the Scheduler's: the vehicle types, seats, lifts and sleeper
berths of the active units. The booking terms are rux-sm.github.io's
`scheduler/docs/booking.md`. The rest is the company's current site and how
the office answers customers. No customer, driver or trip is named, and no
price is shown.

## Run and check it

Clone it beside rux-sm.github.io, then arm the hook once:

    git config core.hooksPath .githooks

The commands, with no install step:

    npm run serve    the site at http://localhost:8645/, loopback only
    npm run check    classes, tokens, files, links, ids and every page's titles and languages
    npm run sync     copy Design's committed build into design/ and refresh each page's icons

Open it at a phone's width and a wide screen's, in both languages. A push to
`main` publishes, after CI runs the check.
