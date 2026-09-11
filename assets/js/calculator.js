/* ==========================================================================
   MERIDIAN & VALE — Retirement projection tool
   Client-side only. Every output is an illustrative estimate; see the
   disclaimer rendered beneath the chart in index.html.
   ========================================================================== */

(() => {
  'use strict';

  const form = document.getElementById('plannerForm');
  if (!form) return;

  /* ── Element handles ── */
  const el = {
    ageNow:   document.getElementById('pAgeNow'),
    ageEnd:   document.getElementById('pAgeEnd'),
    assets:   document.getElementById('pAssets'),
    monthly:  document.getElementById('pMonthly'),
    rate:     document.getElementById('pReturn'),
    total:    document.getElementById('pResultTotal'),
    caption:  document.getElementById('pResultCaption'),
    paid:     document.getElementById('pResultPaid'),
    growth:   document.getElementById('pResultGrowth'),
    income:   document.getElementById('pResultIncome'),
    plot:     document.getElementById('chartPlot'),
    tip:      document.getElementById('chartTip'),
    toggle:   document.getElementById('chartToggle'),
    table:    document.getElementById('chartTable'),
    tbody:    document.getElementById('chartTableBody'),
    reset:    document.getElementById('plannerReset')
  };

  /* ── Input rules: [min, max, label, allowDecimal] ── */
  const RULES = {
    pAgeNow:  { min: 18, max: 75,       label: 'Current age',           step: 1 },
    pAgeEnd:  { min: 40, max: 85,       label: 'Retirement age',        step: 1 },
    pAssets:  { min: 0,  max: 25000000, label: 'Invested assets',       step: 1 },
    pMonthly: { min: 0,  max: 100000,   label: 'Monthly contribution',  step: 1 },
    pReturn:  { min: 0,  max: 12,       label: 'Assumed return',        step: 0.1 }
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  });

  /* Compact axis/tooltip labels: $1.8M, $640K, $0 */
  const compact = (n) => {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + Math.round(n);
  };

  /* ── Validation ─────────────────────────────────────────────────────── */
  /* `silent` runs the same checks without painting success/error state — used for
     the projection drawn on first load, before the visitor has touched anything. */
  let silent = true;

  function setState(input, ok, message) {
    if (silent) return;
    const field = input.closest('.field');
    const msg = document.getElementById(input.id + 'Msg');
    field.classList.toggle('is-error', !ok);
    field.classList.toggle('is-valid', ok && input.value !== '');
    if (msg) msg.textContent = message || '';
  }

  function validateOne(input) {
    const rule = RULES[input.id];
    const raw = input.value.trim();

    if (raw === '') { setState(input, false, rule.label + ' is required.'); return null; }
    if (!/^-?\d*\.?\d+$/.test(raw)) { setState(input, false, 'Enter numbers only.'); return null; }

    const value = parseFloat(raw);
    if (Number.isNaN(value)) { setState(input, false, 'Enter a valid number.'); return null; }
    if (value < rule.min || value > rule.max) {
      setState(input, false, `Enter a value between ${rule.min.toLocaleString('en-US')} and ${rule.max.toLocaleString('en-US')}.`);
      return null;
    }
    setState(input, true, '');
    return value;
  }

  function readInputs() {
    const v = {
      ageNow:  validateOne(el.ageNow),
      ageEnd:  validateOne(el.ageEnd),
      assets:  validateOne(el.assets),
      monthly: validateOne(el.monthly),
      rate:    validateOne(el.rate)
    };
    if (Object.values(v).some((x) => x === null)) return null;

    if (v.ageEnd <= v.ageNow) {
      setState(el.ageEnd, false, 'Retirement age must be later than your current age.');
      return null;
    }
    return v;
  }

  /* ── Projection maths ───────────────────────────────────────────────── */
  /* Future value with monthly compounding and monthly contributions. */
  function futureValue(principal, monthly, annualRate, years) {
    const r = annualRate / 100 / 12;
    const n = Math.round(years * 12);
    if (r === 0) return principal + monthly * n;
    const growthFactor = Math.pow(1 + r, n);
    return principal * growthFactor + monthly * ((growthFactor - 1) / r);
  }

  /* Choose ~8 evenly spaced milestone years, always including the final year. */
  function milestones(totalYears) {
    const step = Math.max(1, Math.ceil(totalYears / 8));
    const years = [];
    for (let y = 0; y <= totalYears; y += step) years.push(y);
    if (years[years.length - 1] !== totalYears) years.push(totalYears);
    return years;
  }

  function buildSeries(v) {
    const span = v.ageEnd - v.ageNow;
    const startYear = new Date().getFullYear();
    return milestones(span).map((y) => ({
      year: startYear + y,
      age: v.ageNow + y,
      offset: y,
      paid: v.monthly * y * 12,
      balance: futureValue(v.assets, v.monthly, v.rate, y)
    }));
  }

  /* ── Chart rendering ────────────────────────────────────────────────── */
  const niceCeil = (n) => {
    if (n <= 0) return 1000;
    const mag = Math.pow(10, Math.floor(Math.log10(n)));
    return Math.ceil(n / (mag / 2)) * (mag / 2);
  };

  /* Column with a 4px rounded cap, square at the baseline. */
  function columnPath(x, y, w, h) {
    const r = Math.min(4, w / 2, h);
    return `M${x},${y + h} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h} Z`;
  }

  function node(name, attrs, text) {
    const n = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k, val]) => n.setAttribute(k, val));
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderChart(series) {
    const W = 700, H = 300;
    const m = { top: 28, right: 12, bottom: 38, left: 54 };
    const plotW = W - m.left - m.right;
    const plotH = H - m.top - m.bottom;
    const max = niceCeil(series[series.length - 1].balance);
    const band = plotW / series.length;
    const barW = Math.min(24, band * 0.52);
    const yOf = (val) => m.top + plotH - (val / max) * plotH;

    const svg = node('svg', {
      viewBox: `0 0 ${W} ${H}`,
      role: 'img',
      'aria-label': `Column chart of estimated portfolio balance, rising from ${money.format(series[0].balance)} today to ${money.format(series[series.length - 1].balance)} at age ${series[series.length - 1].age}. The same figures are available in the table view.`
    });

    /* Gridlines — solid hairlines, one step off the surface */
    [0, 0.5, 1].forEach((t) => {
      const val = max * t;
      const y = yOf(val);
      svg.appendChild(node('line', { x1: m.left, y1: y, x2: W - m.right, y2: y, class: 'chart__grid' }));
      svg.appendChild(node('text', {
        x: m.left - 10, y: y + 4, 'text-anchor': 'end', class: 'chart__axis'
      }, compact(val)));
    });

    const last = series.length - 1;

    series.forEach((d, i) => {
      const x = m.left + band * i + (band - barW) / 2;
      const h = Math.max(2, plotH - (yOf(d.balance) - m.top));
      const y = m.top + plotH - h;

      const bar = node('path', { d: columnPath(x, y, barW, h), class: 'chart__bar' });

      /* Hover/focus target, generously larger than the mark itself */
      const hit = node('rect', {
        x: m.left + band * i, y: m.top, width: band, height: plotH,
        class: 'chart__hit', tabindex: '0', role: 'button',
        'aria-label': `${d.year}, age ${d.age}: ${money.format(d.balance)}`
      });

      const show = () => {
        bar.classList.add('is-hot');
        showTip(d, x + barW / 2, y, W, H);
      };
      const hide = () => { bar.classList.remove('is-hot'); hideTip(); };

      hit.addEventListener('mouseenter', show);
      hit.addEventListener('mouseleave', hide);
      hit.addEventListener('focus', show);
      hit.addEventListener('blur', hide);

      svg.appendChild(hit);
      svg.appendChild(bar);

      /* Year label under every column; the value is direct-labelled once, at the end */
      svg.appendChild(node('text', {
        x: m.left + band * i + band / 2, y: H - m.bottom + 20,
        'text-anchor': 'middle', class: 'chart__axis'
      }, i === 0 ? 'Today' : String(d.year)));

      if (i === last) {
        svg.appendChild(node('text', {
          x: Math.min(x + barW / 2, W - m.right - 4), y: y - 10,
          'text-anchor': 'end', class: 'chart__value'
        }, compact(d.balance)));
      }
    });

    /* Baseline */
    svg.appendChild(node('line', {
      x1: m.left, y1: m.top + plotH, x2: W - m.right, y2: m.top + plotH, class: 'chart__grid'
    }));

    const old = el.plot.querySelector('svg');
    if (old) old.remove();
    el.plot.insertBefore(svg, el.tip);
  }

  /* Tooltip positioning: SVG user units → container pixels */
  function showTip(d, svgX, svgY, W, H) {
    const svg = el.plot.querySelector('svg');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const scaleX = box.width / W;
    const scaleY = box.height / H;
    el.tip.innerHTML =
      `<strong>${money.format(d.balance)}</strong>${d.offset === 0 ? 'Today' : d.year} · age ${d.age}`;
    el.tip.hidden = false;
    el.tip.style.left = `${svgX * scaleX}px`;
    el.tip.style.top = `${svgY * scaleY - 10}px`;
  }

  function hideTip() { el.tip.hidden = true; }

  /* ── Table view (accessible fallback for the chart) ── */
  function renderTable(series) {
    el.tbody.replaceChildren();
    series.forEach((d) => {
      const tr = document.createElement('tr');
      [
        d.offset === 0 ? 'Today' : String(d.year),
        String(d.age),
        money.format(d.paid),
        money.format(d.balance)
      ].forEach((text, i) => {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) cell.setAttribute('scope', 'row');
        cell.textContent = text;
        tr.appendChild(cell);
      });
      el.tbody.appendChild(tr);
    });
  }

  /* ── Orchestration ──────────────────────────────────────────────────── */
  function update() {
    const v = readInputs();
    if (!v) return false;

    const series = buildSeries(v);
    const end = series[series.length - 1];
    const contributed = v.assets + v.monthly * (v.ageEnd - v.ageNow) * 12;

    el.total.textContent = money.format(end.balance);
    el.caption.textContent = `In ${v.ageEnd - v.ageNow} years, at age ${v.ageEnd}.`;
    el.paid.textContent = money.format(contributed);
    el.growth.textContent = money.format(Math.max(0, end.balance - contributed));
    el.income.textContent = money.format(end.balance * 0.04);

    renderChart(series);
    renderTable(series);
    hideTip();
    return true;
  }

  /* ── Events ── */
  form.addEventListener('submit', (e) => { e.preventDefault(); update(); });

  Object.keys(RULES).forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => { validateOne(input); update(); });
    input.addEventListener('blur', () => validateOne(input));
  });

  el.reset.addEventListener('click', (e) => {
    e.preventDefault();
    const defaults = { pAgeNow: '38', pAgeEnd: '65', pAssets: '325000', pMonthly: '2500', pReturn: '6.5' };
    Object.entries(defaults).forEach(([id, val]) => {
      const input = document.getElementById(id);
      input.value = val;
      input.closest('.field').classList.remove('is-error', 'is-valid');
      const msg = document.getElementById(id + 'Msg');
      if (msg) msg.textContent = '';
    });
    silent = true;          // back to the untouched state
    update();
    silent = false;
  });

  el.toggle.addEventListener('click', () => {
    const open = el.table.hidden;
    el.table.hidden = !open;
    el.toggle.setAttribute('aria-expanded', String(open));
    el.toggle.innerHTML = open
      ? '<i class="ph ph-chart-bar" aria-hidden="true"></i> Hide table'
      : '<i class="ph ph-table" aria-hidden="true"></i> View as table';
  });

  /* Re-render on resize so the tooltip scale and label widths stay correct */
  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => { hideTip(); }, 150);
  });

  update();       // draw the default projection without marking the fields
  silent = false; // from here on, every check paints its state
})();
