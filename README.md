# Meridian &amp; Vale — Financial Advisory (single-page)

A premium, production-ready **single-page** marketing site for a fee-only financial
advisory practice. Built in plain HTML / CSS / JavaScript — no build step, no
frameworks, no dependencies beyond two CDN links (Google Fonts + Phosphor Icons).

**Route count: exactly 1.** Everything lives in `index.html` and is reached by
smooth-scrolling anchors. There is no login, no register, no 404 page, and no
client-side router.

---

## Quick start

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .          # or: python -m http.server 8000
```

An internet connection is needed on first load for the Google Fonts stylesheet,
the Phosphor icon stylesheet, and the Unsplash imagery.

---

## File structure

```
financial-advisory/
├── index.html                  ← the entire site: all 9 sections + detail modal
├── assets/
│   ├── css/
│   │   └── style.css           ← every style, design tokens, dark-mode overrides
│   └── js/
│       ├── main.js             ← theme, drawer, scroll-spy, reveals, services,
│       │                          detail modal, booking calendar, validation
│       └── calculator.js       ← retirement projection maths + SVG chart
└── README.md
```

---

## Page anatomy

| # | Section | `id` | Type |
|---|---|---|---|
| 1 | Hero + trust strip | `home` | fixed |
| 2 | Offering highlights — the four-part engagement | `approach` | fixed |
| 3 | Advisory services — filterable grid + detail modal | `services` | **flexible** |
| 4 | Retirement projection calculator + chart | `planner` | **flexible** |
| 5 | Book a call — inline date & time picker | `booking` | **flexible** |
| 6 | About / story, milestones, team | `about` | fixed |
| 7 | Trust &amp; safeguards + testimonials | `trust` | fixed |
| 8 | Contact — form, details, map placeholder | `contact` | fixed |
| 9 | Footer — mirrored anchors, disclosure line | — | fixed |

**Navbar anchors:** Home · Services · Book a Call · About · Trust · Contact
**Primary CTA:** “Book a Call” → `#booking` (also focuses the first field on arrival)

`#approach` and `#planner` have no nav item of their own; the scroll-spy maps them
onto Home and Services respectively so the active link is never stale.

---

## Design system

| Token | Value |
|---|---|
| Primary | `#14322B` deep forest ink |
| Secondary | `#7C8B84` muted stone sage |
| Accent | `#B5813C` brass (`#D2A05C` on the dark surface) |
| Display type | Fraunces (headings, 300–560) |
| Body type | Karla (400–500) |
| Spacing | 8px base scale, `--s-1` … `--s-9` |
| Radius | `4px`, one value globally |
| Shadow | one `--shadow` token, used everywhere |
| Icons | Phosphor Icons (regular) |

All tokens live in `:root` in `style.css`; dark mode redefines only the colour
tokens under `[data-theme="dark"]`. To rebrand, change the three brand colours and
the two font families — nothing else is hard-coded.

---

## Behaviour notes

- **Breakpoints.** Above 1024px: full horizontal nav with the theme toggle beside
  the CTA. At 1024px and below: hamburger → right slide-drawer containing the
  anchors, the theme toggle and the CTA. There is no in-between state.
- **Theme.** Defaults to `prefers-color-scheme`, persists in `localStorage`
  (`mv-theme`), and follows the OS only until the visitor chooses explicitly.
- **Scroll-spy.** A rAF-throttled scroll handler sets `.is-active` and
  `aria-current="true"` on the matching nav link.
- **Reveals.** One `IntersectionObserver` adds `.is-in` to `.reveal` elements;
  staggering comes from `data-delay="1…6"`. All motion is disabled under
  `prefers-reduced-motion`.
- **Detail views.** Service details open in a focus-trapped modal (`Esc` to close,
  Tab wraps, focus returns to the trigger). The modal CTA closes the modal,
  scrolls to `#booking` and preselects the matching service. It is never a route.
- **Chart.** Single-series column chart drawn as inline SVG: ≤24px columns with a
  4px rounded cap on a square baseline, hairline solid gridlines, one direct
  end-label, per-column hover *and* keyboard-focus tooltips, and a “View as table”
  fallback. Dark mode uses its own lighter brass step rather than an automatic flip.
- **Single-route guard.** An unrecognised `#hash` on load is stripped with
  `history.replaceState` and the page returns to the top.

---

## Forms

Every form validates client-side before submit, shows a red border with an inline
message on error and a green border on success, blocks submission until any
consent checkbox is ticked, and renders an inline success message with no reload.

| Form | Fields | Notes |
|---|---|---|
| Book a call | name, email, phone (optional), service, date, time, consent | Custom inline calendar: weekdays only, tomorrow → +90 days |
| Contact | name, email, subject, message, consent | Message requires ≥12 characters |
| Projection calculator | 5 numeric inputs | Range-checked and non-numeric input rejected inline |
| Newsletter | email | Regex validation |

No data is transmitted anywhere — every submission is handled locally.

---

## Integration placeholders

Swap these before launch:

| Integration | Where |
|---|---|
| Contact form endpoint | `#contactForm` comment — Formspree `action` or `data-netlify` |
| Booking form endpoint | `#bookingForm` comment |
| Newsletter | Mailchimp comment above `#newsForm` in the footer |
| Google Maps | `.map` placeholder in `#contact` — replace with your `<iframe>` |
| Payments | Stripe / PayPal comment inside `#bookingForm` (retainers, deposits) |
| Analytics | `<!-- GA_TAG -->` comment in `<head>` |
| Secure session notice | “🔒 Secure connection” badges — visual only, no backend implied |

If you move this to a stack with a real backend (Node, PHP, Django, Rails), point
the two form `action` attributes at your endpoints and keep the client-side
validation as the first gate.

---

## Accessibility

WCAG 2.1 AA targeted: landmark roles, one `<h1>`, `aria-current` on the active nav
link, 44px minimum touch targets, visible focus rings, a skip link, alt text on
every image, `aria-label` on every icon-only control, a focus-trapped modal, a
keyboard-reachable chart with a table alternative, and full
`prefers-reduced-motion` support.

---

## ⚠️ Disclaimer

**Meridian &amp; Vale is a placeholder brand created for demonstration purposes.**
It is not a real financial institution or registered investment adviser. All
figures, credentials, testimonials, sample outcomes, pricing and calculator
outputs are illustrative estimates and are **not** investment, tax or legal
advice. The projection tool assumes a constant rate of return and ignores
inflation, taxes, fees and sequence-of-returns risk.
# financial-advisory
