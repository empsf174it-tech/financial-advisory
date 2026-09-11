/* ==========================================================================
   MERIDIAN & VALE — single-page behaviour
   1. Theme        4. Scroll-spy & reveals   7. Booking (calendar + slots)
   2. Navbar       5. Services + modal       8. Contact & newsletter
   3. Drawer       6. Smooth anchor scroll   9. Misc
   ========================================================================== */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  /* ═══════════ 1. THEME ═══════════ */
  const root = document.documentElement;
  const themeButtons = [$('#themeToggleDesktop'), $('#themeToggleMobile')].filter(Boolean);
  const themeState = $('#themeStateLabel');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    const dark = theme === 'dark';
    themeButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
    if (themeState) themeState.textContent = dark ? 'Dark' : 'Light';
  }

  const stored = localStorage.getItem('mv-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  applyTheme(stored || (prefersDark.matches ? 'dark' : 'light'));

  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('mv-theme')) applyTheme(e.matches ? 'dark' : 'light');
  });

  themeButtons.forEach((btn) => btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mv-theme', next);
    applyTheme(next);
  }));

  /* ═══════════ 2. NAVBAR ═══════════ */
  const nav = $('#nav');
  const navHeight = () => nav.offsetHeight;

  /* ═══════════ 3. DRAWER (≤1024px) ═══════════ */
  const drawer   = $('#drawer');
  const backdrop = $('#drawerBackdrop');
  const burger   = $('#burger');
  const drawerClose = $('#drawerClose');

  function openDrawer() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    drawerClose.focus();
  }

  function closeDrawer(returnFocus = false) {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('is-open');
    window.setTimeout(() => { backdrop.hidden = true; }, 350);
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    if (returnFocus) burger.focus();
  }

  burger.addEventListener('click', openDrawer);
  drawerClose.addEventListener('click', () => closeDrawer(true));
  backdrop.addEventListener('click', () => closeDrawer());
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => {
    if (e.matches) closeDrawer();
  });

  /* ═══════════ 6. SMOOTH ANCHOR SCROLL (+ purposeful CTA focus) ═══════════ */
  function scrollToSection(hash, focusId) {
    const target = document.querySelector(hash);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focusId) {
      window.setTimeout(() => {
        const field = document.getElementById(focusId);
        if (field) field.focus({ preventScroll: true });
      }, 700);
    }
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.classList.contains('skip-link')) return;   // skip link must move focus natively
    const hash = link.getAttribute('href');
    if (hash === '#' || !document.querySelector(hash)) return;

    e.preventDefault();
    const focusId = link.dataset.ctaFocus;
    const inDrawer = link.closest('.drawer');

    if (inDrawer) {
      closeDrawer();
      window.setTimeout(() => scrollToSection(hash, focusId), 320);
    } else {
      scrollToSection(hash, focusId);
    }
    history.replaceState(null, '', hash);
  });

  /* ═══════════ 4. SCROLL-SPY & REVEALS ═══════════ */
  /* Sections without their own nav item borrow the link above them. */
  const SPY = [
    ['home', '#home'], ['approach', '#home'],
    ['services', '#services'], ['planner', '#services'],
    ['booking', '#booking'], ['about', '#about'],
    ['trust', '#trust'], ['contact', '#contact']
  ].map(([id, link]) => ({ el: document.getElementById(id), link })).filter((s) => s.el);

  const navLinks = $$('.nav__link');
  const drawerLinks = $$('.drawer__link');
  const backToTop = $('#backToTop');
  let ticking = false;

  function syncActiveLink() {
    const line = window.scrollY + navHeight() + 24;
    let current = SPY[0].link;

    SPY.forEach((s) => { if (s.el.offsetTop <= line) current = s.link; });

    /* Bottom of the page resolves to the last section — but only when the page
       actually scrolls, so a viewport taller than the document stays on Home. */
    const scrollable = document.body.scrollHeight - window.innerHeight;
    if (scrollable > 8 && window.scrollY >= scrollable - 4) {
      current = SPY[SPY.length - 1].link;
    }

    navLinks.forEach((a) => {
      const on = a.getAttribute('href') === current;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    drawerLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === current));

    nav.classList.toggle('is-stuck', window.scrollY > 8);
    if (backToTop) {
      backToTop.classList.toggle('is-visible', window.scrollY > 350);
    }
    ticking = false;
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(syncActiveLink); }
  }, { passive: true });
  window.addEventListener('resize', syncActiveLink);
  syncActiveLink();

  /* Scroll-triggered reveals — one calm motion, shared by every section */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function observeReveals(scope = document) { $$('.reveal', scope).forEach((n) => revealObserver.observe(n)); }
  observeReveals();

  /* ═══════════ 5. SERVICES + DETAIL MODAL ═══════════ */
  const SERVICES = [
    {
      cat: 'retirement', tag: 'Retirement', icon: 'ph-hourglass-medium',
      img: 'retirement-income-01.jpg',
      imgAlt: 'A multi-generational family standing together on a beach at sunset',
      title: 'Retirement Income Design',
      blurb: 'Turning a lifetime of accumulated assets into a paycheque that survives a thirty-year retirement.',
      lede: 'The hardest problem in personal finance is not growing a portfolio — it is spending one down without running out. We design the sequence.',
      approach: [
        'Model spending needs in today’s dollars, then stress the plan against historic sequences of returns',
        'Build a two-to-three year cash reserve so no withdrawal is ever forced into a falling market',
        'Coordinate Social Security timing, pension elections and annuitisation choices as one decision'
      ],
      lead: 'Elena Vale, CFP®, CFA — Managing Partner. Twenty-three years designing income plans through four market cycles.',
      outcome: 'A recently retired couple restructured withdrawals across taxable, tax-deferred and Roth accounts, extending the plan’s modelled duration by nine years without changing their spending.',
      pricing: 'Included in ongoing advisory at 0.65% of assets, or a standalone engagement from $4,500.'
    },
    {
      cat: 'investing', tag: 'Investing', icon: 'ph-chart-line-up',
      img: 'portfolio-construction-01.jpg',
      imgAlt: 'A laptop displaying a portfolio performance dashboard',
      title: 'Portfolio Construction & Rebalancing',
      blurb: 'Low-cost, globally diversified portfolios built around your capacity for risk — not your appetite for it.',
      lede: 'We build portfolios you can hold through the worst quarter of the decade, because a plan you abandon returns nothing.',
      approach: [
        'Set an allocation from required return, time horizon and demonstrated behaviour under loss',
        'Implement with broad, low-cost funds; total portfolio expense typically stays under 0.10%',
        'Rebalance on tolerance bands rather than the calendar, harvesting losses where they are useful'
      ],
      lead: 'Elena Vale, CFP®, CFA, with the investment committee, which meets quarterly and publishes its minutes to clients.',
      outcome: 'A household consolidating nine legacy accounts moved to a single allocation, cutting annual fund costs by an estimated 0.54% a year.',
      pricing: 'Included in ongoing advisory at 0.65% of assets, tapering above $5M.'
    },
    {
      cat: 'tax', tag: 'Tax', icon: 'ph-receipt',
      img: 'tax-withdrawal-01.jpg',
      imgAlt: 'Tax forms and a calculator laid out on a desk',
      title: 'Tax-Aware Withdrawal Sequencing',
      blurb: 'Deciding which account to draw from, in which year, so the tax bill is managed across decades rather than filings.',
      lede: 'Most households pay more tax in retirement than they need to, because withdrawals are decided one year at a time.',
      approach: [
        'Map marginal rates across every remaining year, including future required minimum distributions',
        'Fill low-rate years with deliberate Roth conversions where the arithmetic supports it',
        'Coordinate capital gains realisation with the rest of the household return, not in isolation'
      ],
      lead: 'Marcus Aldridge, CPA, CFP® — Partner, Head of Tax Strategy. Former Big Four private client practice.',
      outcome: 'A pre-retiree used three low-income years between redundancy and Social Security to convert at a lower rate, reducing modelled lifetime tax by a meaningful margin.',
      pricing: 'Flat engagement from $3,500, or included in ongoing advisory.'
    },
    {
      cat: 'estate', tag: 'Estate', icon: 'ph-tree-structure',
      img: 'estate-planning-01.jpg',
      imgAlt: 'A person signing a printed document with a fountain pen',
      title: 'Estate & Legacy Planning',
      blurb: 'Titling, beneficiaries and trust structures aligned with the outcome you actually want for the next generation.',
      lede: 'An estate plan fails quietly. We find the mismatches — a stale beneficiary, an untitled account — before they matter.',
      approach: [
        'Audit every account title, beneficiary designation and transfer-on-death instruction',
        'Coordinate revocable, irrevocable and charitable structures with your attorney',
        'Prepare the next generation with a family meeting and a written letter of intent'
      ],
      lead: 'Priya Raman, JD, CFP® — Director, Legacy. Works alongside your existing estate attorney rather than replacing them.',
      outcome: 'A blended family corrected beneficiary designations that would have directed a retirement account away from the intended heirs entirely.',
      pricing: 'Flat engagement from $5,000, or included in ongoing advisory above $2M.'
    },
    {
      cat: 'education', tag: 'Education', icon: 'ph-graduation-cap',
      img: 'education-funding-01.jpg',
      imgAlt: 'Students working together over books in a college library',
      title: 'Education Funding',
      blurb: '529 plans, financial-aid positioning and the honest question of how much to fund without compromising retirement.',
      lede: 'Education funding is a trade-off, not a target. We size it against the retirement plan it competes with.',
      approach: [
        'Project realistic net cost by institution type, not sticker price',
        'Select and fund the right 529 plan, superfunding where gift-tax rules allow',
        'Position assets ahead of aid formulas and coordinate with grandparent contributions'
      ],
      lead: 'Elena Vale, CFP®, CFA, with Marcus Aldridge on the gift and state-tax treatment.',
      outcome: 'A family redirected over-funding from a taxable account into two 529s, capturing a state deduction they had not claimed in six years.',
      pricing: 'Flat engagement from $2,500, or included in ongoing advisory.'
    },
    {
      cat: 'investing', tag: 'Investing', icon: 'ph-chart-pie-slice',
      img: 'equity-compensation-01.jpg',
      imgAlt: 'A company team working through a planning session around a boardroom table',
      title: 'Equity Compensation & RSUs',
      blurb: 'Vesting schedules, concentration risk and the tax consequences of every exercise decision, modelled before you act.',
      lede: 'Concentrated stock builds wealth and then, occasionally, removes it. We plan the diversification in advance.',
      approach: [
        'Model ISO, NSO, RSU and ESPP outcomes side by side, including AMT exposure',
        'Set a written diversification schedule and, where appropriate, a 10b5-1 plan',
        'Time exercises against liquidity events, blackout windows and your wider tax year'
      ],
      lead: 'Marcus Aldridge, CPA, CFP®, with a second reviewer on every AMT calculation.',
      outcome: 'A senior engineer at a pre-IPO company staged exercises across two tax years, materially reducing exposure to a single-year AMT charge.',
      pricing: 'Flat engagement from $4,000, or included in ongoing advisory.'
    },
    {
      cat: 'tax', tag: 'Tax', icon: 'ph-hand-heart',
      img: 'charitable-giving-01.jpg',
      imgAlt: 'Children from a community programme smiling towards the camera',
      title: 'Charitable Giving',
      blurb: 'Donor-advised funds, appreciated-security gifts and bunching strategies that make generosity more efficient.',
      lede: 'Giving cash is rarely the most effective way to give. There is usually a better asset and a better year.',
      approach: [
        'Gift long-held appreciated securities rather than cash wherever possible',
        'Bunch several years of giving into one to clear the standard deduction',
        'Use a donor-advised fund to separate the deduction year from the granting year'
      ],
      lead: 'Priya Raman, JD, CFP®, with Marcus Aldridge on deduction limits and carry-forwards.',
      outcome: 'A donor bunched three years of intended giving into a single high-income year, converting a deduction they could not previously use.',
      pricing: 'Included in ongoing advisory; standalone reviews from $2,000.'
    },
    {
      cat: 'retirement', tag: 'Retirement', icon: 'ph-briefcase',
      img: 'business-exit-01.jpg',
      imgAlt: 'Corporate towers seen looking up from street level',
      title: 'Business Exit Planning',
      blurb: 'Preparing a company — and its owner — for a sale that funds everything the next chapter requires.',
      lede: 'The years before a sale decide the outcome far more than the negotiation does. We start early.',
      approach: [
        'Establish the number the household actually needs from the transaction, net of tax',
        'Structure entity, basis and pre-sale gifting well ahead of a letter of intent',
        'Prepare the liquidity plan for the day the proceeds land, before they land'
      ],
      lead: 'Marcus Aldridge, CPA, CFP®, and Elena Vale, CFP®, CFA, jointly on every exit engagement.',
      outcome: 'A founder began planning twenty-two months before close; pre-sale gifting and entity work were complete before diligence opened.',
      pricing: 'Project engagement from $12,000, scoped after the first call.'
    }
  ];

  const grid  = $('#serviceGrid');
  const empty = $('#serviceEmpty');
  const IMG_BASE = 'assets/images/';

  function renderServices() {
    const fragment = document.createDocumentFragment();

    SERVICES.forEach((svc, i) => {
      const li = document.createElement('li');
      li.className = 'svc-card reveal';
      li.dataset.cat = svc.cat;
      li.dataset.index = String(i);
      li.setAttribute('data-delay', String((i % 4) + 1));
      li.innerHTML = `
        <figure class="svc-card__media">
          <img src="${IMG_BASE}${svc.img}" alt="${svc.imgAlt}"
               width="600" height="340" loading="lazy" decoding="async">
        </figure>
        <span class="svc-card__icon"><i class="ph ${svc.icon}" aria-hidden="true"></i></span>
        <div class="svc-card__body">
          <p class="svc-card__tag">${svc.tag}</p>
          <h3 class="svc-card__title">${svc.title}</h3>
          <p class="svc-card__text">${svc.blurb}</p>
          <button class="svc-card__btn" type="button" data-open="${i}">
            View details<i class="ph ph-arrow-right" aria-hidden="true"></i>
          </button>
        </div>`;
      fragment.appendChild(li);
    });

    grid.appendChild(fragment);
    observeReveals(grid);
  }
  renderServices();

  $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
    const cat = btn.dataset.filter;
    $$('.filter').forEach((b) => b.classList.toggle('is-active', b === btn));

    let visible = 0;
    $$('.svc-card', grid).forEach((card) => {
      const show = cat === 'all' || card.dataset.cat === cat;
      card.classList.toggle('is-hidden', !show);
      if (show) visible += 1;
    });
    empty.hidden = visible > 0;
  }));

  /* — Detail modal — */
  const modal = $('#serviceModal');
  const modalEls = {
    cat: $('#modalCat'), title: $('#modalTitle'), lede: $('#modalLede'),
    approach: $('#modalApproach'), lead: $('#modalLead'),
    outcome: $('#modalOutcome'), pricing: $('#modalPricing'),
    cta: $('#modalCta'), close: $('#modalClose'), img: $('#modalImg'),
    panel: $('.modal__panel', $('#serviceModal'))
  };
  let lastFocused = null;
  let activeService = null;

  function openModal(index) {
    const svc = SERVICES[index];
    if (!svc) return;
    activeService = svc;
    lastFocused = document.activeElement;

    modalEls.img.src = `${IMG_BASE}${svc.img}`;
    modalEls.img.alt = svc.imgAlt;
    modalEls.cat.textContent = svc.tag;
    modalEls.title.textContent = svc.title;
    modalEls.lede.textContent = svc.lede;
    modalEls.lead.textContent = svc.lead;
    modalEls.outcome.textContent = svc.outcome;
    modalEls.pricing.textContent = svc.pricing;
    modalEls.approach.replaceChildren();
    svc.approach.forEach((point) => {
      const li = document.createElement('li');
      li.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i>';
      li.appendChild(document.createTextNode(point));
      modalEls.approach.appendChild(li);
    });

    modal.hidden = false;
    document.body.classList.add('is-locked');
    modalEls.panel.scrollTop = 0;
    modalEls.close.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocused) lastFocused.focus();
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open]');
    if (btn) openModal(Number(btn.dataset.open));
  });

  $$('[data-modal-close]').forEach((n) => n.addEventListener('click', closeModal));
  modalEls.close.addEventListener('click', closeModal);

  /* Modal CTA → close, scroll to booking, preselect the matching service */
  modalEls.cta.addEventListener('click', () => {
    const service = activeService;
    closeModal();
    if (service) {
      const select = $('#bookService');
      const match = Array.from(select.options).find((o) => o.text === service.title);
      if (match) { select.value = match.value; mark(select, true, ''); }
    }
    window.setTimeout(() => scrollToSection('#booking', 'bookName'), 120);
  });

  /* Esc closes the modal, then the drawer. Tab is trapped inside the modal. */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!modal.hidden) { closeModal(); return; }
      closeDrawer(true);
      return;
    }
    if (e.key !== 'Tab' || modal.hidden) return;

    const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modalEls.panel)
      .filter((n) => !n.disabled && n.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ═══════════ SHARED VALIDATION ═══════════ */
  function mark(input, ok, message) {
    const field = input.closest('.field');
    const msg = document.getElementById(input.id + 'Msg');
    if (field) {
      field.classList.toggle('is-error', !ok);
      field.classList.toggle('is-valid', ok);
    }
    if (msg) msg.textContent = message || '';
    return ok;
  }

  const checkText = (input, min, label) => {
    const v = input.value.trim();
    if (!v) return mark(input, false, `${label} is required.`);
    if (v.length < min) return mark(input, false, `Please enter at least ${min} characters.`);
    return mark(input, true, '');
  };

  const checkEmail = (input) => {
    const v = input.value.trim();
    if (!v) return mark(input, false, 'Email is required.');
    if (!EMAIL_RE.test(v)) return mark(input, false, 'Enter a valid email address, e.g. you@example.com.');
    return mark(input, true, '');
  };

  const checkSelect = (input, label) =>
    input.value ? mark(input, true, '') : mark(input, false, `Please choose ${label}.`);

  const checkConsent = (input, message) => {
    const field = input.closest('.field');
    const msg = document.getElementById(input.id + 'Msg');
    const ok = input.checked;
    field.classList.toggle('is-error', !ok);
    if (msg) msg.textContent = ok ? '' : message;
    return ok;
  };

  /* ═══════════ 7. BOOKING ═══════════ */
  const calGrid  = $('#calGrid');
  const calMonth = $('#calMonth');
  const calPrev  = $('#calPrev');
  const calNext  = $('#calNext');
  const dateInput = $('#bookDate');
  const timeInput = $('#bookTime');

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const minDate = (() => { const d = startOfDay(new Date()); d.setDate(d.getDate() + 1); return d; })();
  const maxDate = (() => { const d = startOfDay(new Date()); d.setDate(d.getDate() + 90); return d; })();

  let viewMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  let selectedDate = null;

  const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
  const longFmt  = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  function renderCalendar() {
    calMonth.textContent = monthFmt.format(viewMonth);
    calGrid.replaceChildren();

    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;   // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDow; i += 1) {
      const filler = document.createElement('span');
      filler.className = 'cal__day is-empty';
      filler.setAttribute('aria-hidden', 'true');
      calGrid.appendChild(filler);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      const outOfRange = date < minDate || date > maxDate;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal__day';
      btn.textContent = String(day);

      if (weekend || outOfRange) {
        btn.disabled = true;
        btn.setAttribute('aria-label', `${longFmt.format(date)} — unavailable`);
      } else {
        btn.setAttribute('aria-label', longFmt.format(date));
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => selectDate(date, btn));
      }

      if (selectedDate && date.getTime() === selectedDate.getTime()) {
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
      }
      calGrid.appendChild(btn);
    }

    calPrev.disabled = new Date(year, month, 1) <= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    calNext.disabled = new Date(year, month, 1) >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  }

  function selectDate(date, btn) {
    selectedDate = date;
    dateInput.value = longFmt.format(date);
    $$('.cal__day', calGrid).forEach((d) => { d.classList.remove('is-selected'); d.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('is-selected');
    btn.setAttribute('aria-pressed', 'true');
    $('#bookDateMsg').textContent = '';
    $('#bookDateMsg').closest('.field').classList.remove('is-error');
  }

  calPrev.addEventListener('click', () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  calNext.addEventListener('click', () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  renderCalendar();

  $$('.slot').forEach((slot) => slot.addEventListener('click', () => {
    $$('.slot').forEach((s) => { s.classList.remove('is-selected'); s.setAttribute('aria-pressed', 'false'); });
    slot.classList.add('is-selected');
    slot.setAttribute('aria-pressed', 'true');
    timeInput.value = slot.dataset.time;
    $('#bookTimeMsg').textContent = '';
    $('#bookTimeMsg').closest('.field').classList.remove('is-error');
  }));
  $$('.slot').forEach((s) => s.setAttribute('aria-pressed', 'false'));

  const bookingForm = $('#bookingForm');
  const bookingSuccess = $('#bookingSuccess');
  const bookingSuccessText = $('#bookingSuccessText');

  const bookPhone = $('#bookPhone');
  const checkPhone = () => {
    const v = bookPhone.value.trim();
    if (!v) { mark(bookPhone, true, ''); bookPhone.closest('.field').classList.remove('is-valid'); return true; }
    if (!/^[+()\d][\d\s().-]{6,}$/.test(v)) return mark(bookPhone, false, 'Enter a valid phone number, or leave this blank.');
    return mark(bookPhone, true, '');
  };

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    bookingSuccess.hidden = true;

    const results = [
      checkText($('#bookName'), 2, 'Full name'),
      checkEmail($('#bookEmail')),
      checkPhone(),
      checkSelect($('#bookService'), 'a planning area')
    ];

    const dateOk = Boolean(dateInput.value);
    $('#bookDateMsg').textContent = dateOk ? '' : 'Please choose a date.';
    $('#bookDateMsg').closest('.field').classList.toggle('is-error', !dateOk);

    const timeOk = Boolean(timeInput.value);
    $('#bookTimeMsg').textContent = timeOk ? '' : 'Please choose a time.';
    $('#bookTimeMsg').closest('.field').classList.toggle('is-error', !timeOk);

    const consentOk = checkConsent($('#bookConsent'), 'Please accept the terms to continue.');

    if (!results.every(Boolean) || !dateOk || !timeOk || !consentOk) {
      const firstControl = bookingForm.querySelector('.is-error input:not([type="hidden"]), .is-error select, .is-error textarea');
      if (firstControl) firstControl.focus();
      else {
        const firstField = bookingForm.querySelector('.is-error');
        if (firstField) firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    bookingSuccessText.textContent =
      `Request received — ${dateInput.value} at ${timeInput.value} (PT). We will confirm by email within one business day. This demonstration form does not send data anywhere.`;
    bookingSuccess.hidden = false;

    bookingForm.reset();
    selectedDate = null;
    dateInput.value = '';
    timeInput.value = '';
    $$('.slot').forEach((s) => { s.classList.remove('is-selected'); s.setAttribute('aria-pressed', 'false'); });
    $$('.field', bookingForm).forEach((f) => f.classList.remove('is-valid', 'is-error'));
    $$('.field__msg', bookingForm).forEach((m) => { m.textContent = ''; });
    renderCalendar();
  });

  $('#bookName').addEventListener('blur', (e) => checkText(e.target, 2, 'Full name'));
  $('#bookEmail').addEventListener('blur', (e) => checkEmail(e.target));
  bookPhone.addEventListener('blur', checkPhone);
  $('#bookService').addEventListener('change', (e) => checkSelect(e.target, 'a planning area'));
  $('#bookConsent').addEventListener('change', (e) => checkConsent(e.target, 'Please accept the terms to continue.'));

  /* ═══════════ 8. CONTACT & NEWSLETTER ═══════════ */
  const contactForm = $('#contactForm');
  const contactSuccess = $('#contactSuccess');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    contactSuccess.hidden = true;

    const ok = [
      checkText($('#cName'), 2, 'Full name'),
      checkEmail($('#cEmail')),
      checkSelect($('#cSubject'), 'a subject'),
      checkText($('#cMessage'), 12, 'Message'),
      checkConsent($('#cConsent'), 'Please confirm your consent so we can reply.')
    ].every(Boolean);

    if (!ok) {
      const firstError = contactForm.querySelector('.is-error input, .is-error select, .is-error textarea');
      if (firstError) firstError.focus();
      return;
    }

    contactSuccess.hidden = false;
    contactForm.reset();
    $$('.field', contactForm).forEach((f) => f.classList.remove('is-valid', 'is-error'));
    $$('.field__msg', contactForm).forEach((m) => { m.textContent = ''; });
  });

  $('#cName').addEventListener('blur', (e) => checkText(e.target, 2, 'Full name'));
  $('#cEmail').addEventListener('blur', (e) => checkEmail(e.target));
  $('#cSubject').addEventListener('change', (e) => checkSelect(e.target, 'a subject'));
  $('#cMessage').addEventListener('blur', (e) => checkText(e.target, 12, 'Message'));
  $('#cConsent').addEventListener('change', (e) => checkConsent(e.target, 'Please confirm your consent so we can reply.'));

  const newsForm = $('#newsForm');
  const newsMsg = $('#newsMsg');

  newsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#newsEmail');
    const valid = EMAIL_RE.test(input.value.trim());
    newsForm.classList.toggle('is-error', !valid);
    newsMsg.textContent = valid
      ? 'Thank you — you are subscribed to the quarterly letter.'
      : 'Enter a valid email address.';
    newsMsg.classList.toggle('is-ok', valid);
    newsMsg.classList.toggle('is-bad', !valid);
    if (valid) newsForm.reset();
  });

  /* ═══════════ 9. MISC ═══════════ */
  $('#year').textContent = String(new Date().getFullYear());

  /* Single-route guard: an unknown deep link resolves back to the page root. */
  const knownIds = SPY.map((s) => s.el.id);
  if (location.hash && !knownIds.includes(location.hash.slice(1))) {
    history.replaceState(null, '', location.pathname);
    window.scrollTo(0, 0);
  }
})();
