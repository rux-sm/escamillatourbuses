/* ==========================================================================
   Website — THE HEADER OVER THE HERO
   --------------------------------------------------------------------------
   index.html and es/index.html. The header is see-through while the home
   page's hero is under it, and solid charcoal once the page scrolls past:
   `website-header--clear` is on while any of the hero shows below the 64px
   header. Without a hero or without the observer the header stays solid,
   which is every other page.
   ========================================================================== */
(() => {
  'use strict';

  const header = document.querySelector('.rux--header');
  const hero = document.querySelector('.website-band--lead');
  if (!header || !hero || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(([entry]) => {
    header.classList.toggle('website-header--clear', entry.isIntersecting);
  }, { rootMargin: '-64px 0px 0px 0px' }).observe(hero);
})();

/* ==========================================================================
   Website — THE QUOTE FORM
   --------------------------------------------------------------------------
   quote.html and es/quote.html. Checks each field the office quotes from and
   says what is wrong beside it, in the page's language, the way Carbon marks
   a field invalid: `data-invalid` on the field's wrapper, the input's
   `--invalid` class and its warning icon, and the words in the
   `form-requirement` under it. A one-way trip hides and skips the return.

   NOTHING TYPED IS LOST BEFORE THE REQUEST LANDS. Every change is kept in
   this tab's sessionStorage and put back when the page opens again, and only
   a request that lands clears it. Storage can be refused, as in a private
   window, and then the form simply starts empty.

   A FORM THAT PASSES IS SENT to the scheduler's `quote-request` function,
   behind Cloudflare's Turnstile, and the thank-you page its `data-thanks`
   names opens with the request's number, which this file, loaded there too,
   puts in its words. A send that fails says why beside the button.

   A BLANK SITE KEY SENDS NOTHING, as in the preview: a form that passes opens
   the thank-you page with no number, which says a request reaches the office
   once the site is live.
   ========================================================================== */
(() => {
  'use strict';

  // THE THANK-YOU PAGE says the request's number, which its address carries,
  // and with it what happens next in place of the preview's words.
  const number = new URLSearchParams(location.search).get('request');
  if (/^\d{1,9}$/.test(number ?? '')) {
    for (const el of document.querySelectorAll('[data-request-number]')) el.textContent = number;
    for (const el of document.querySelectorAll('[data-request]')) el.hidden = false;
    for (const el of document.querySelectorAll('[data-no-request]')) el.hidden = true;
  }

  const form = document.getElementById('quote-form');
  if (!form) return;

  const es = document.documentElement.lang === 'es';
  const SAY = es ? {
    first: 'Escriba su nombre.',
    last: 'Escriba su apellido.',
    phone: 'Escriba un teléfono con su código de área.',
    email: 'Escriba un correo electrónico, como nombre@ejemplo.com.',
    from: 'Escriba dónde pasa el autobús por ustedes.',
    to: 'Escriba a dónde van.',
    leave_date: 'Elija el día de salida.',
    past: 'Elija un día a partir de hoy.',
    return_date: 'Elija el día de regreso.',
    before: 'Elija un día igual o posterior al de salida.',
    earlier: 'Elija una hora de regreso después de la hora de salida.',
    people: 'Escriba cuántas personas viajan, con número.',
  } : {
    first: 'Enter your first name.',
    last: 'Enter your last name.',
    phone: 'Enter a phone number with its area code.',
    email: 'Enter an email address, like name@example.com.',
    from: 'Enter where the bus picks you up.',
    to: 'Enter where you’re going.',
    leave_date: 'Pick the day you leave.',
    past: 'Pick a day from today on.',
    return_date: 'Pick the day you come back.',
    before: 'Pick a day on or after the day you leave.',
    earlier: 'Pick a time back after the time you leave.',
    people: 'Enter how many are going, as a number.',
  };

  const field = name => form.elements.namedItem(name);
  const value = name => String(field(name)?.value ?? '').trim();
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // -- marking a field --------------------------------------------------------
  function mark(input, words) {
    const wrapper = input.closest('.rux--text-input__field-wrapper');
    const said = document.getElementById(`${input.id}-error`);
    if (!wrapper || !said) return;
    wrapper.setAttribute('data-invalid', '');
    input.classList.add('rux--text-input--invalid');
    input.setAttribute('aria-invalid', 'true');
    if (!wrapper.querySelector('.rux--text-input__invalid-icon')) {
      wrapper.insertAdjacentHTML('afterbegin',
        '<svg class="rux--text-input__invalid-icon" width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><use href="#i-warning--filled"/></svg>');
    }
    said.textContent = words;
  }
  function unmark(input) {
    const wrapper = input.closest('.rux--text-input__field-wrapper');
    const said = document.getElementById(`${input.id}-error`);
    if (!wrapper || !said) return;
    wrapper.removeAttribute('data-invalid');
    input.classList.remove('rux--text-input--invalid');
    input.removeAttribute('aria-invalid');
    wrapper.querySelector('.rux--text-input__invalid-icon')?.remove();
    said.textContent = '';
  }

  // -- the return, for a round trip only ---------------------------------------
  const ret = document.getElementById('q-return');
  const oneWay = () => form.querySelector('input[name="trip"]:checked')?.value === 'oneway';
  function showReturn() {
    const hide = oneWay();
    ret.hidden = hide;
    field('return_date').required = !hide;
    if (hide) { unmark(field('return_date')); unmark(field('return_time')); }
  }

  // The earliest day each date may take: today, and the day the trip leaves.
  function bound() {
    field('leave_date').min = today();
    field('return_date').min = value('leave_date') || today();
  }

  // -- the rules ----------------------------------------------------------------
  // Each returns the words for what is wrong, or '' when the field is right.
  const RULES = {
    first: () => (value('first') ? '' : SAY.first),
    last: () => (value('last') ? '' : SAY.last),
    phone: () => (value('phone').replace(/\D/g, '').length >= 10 ? '' : SAY.phone),
    email: () => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email')) ? '' : SAY.email),
    from: () => (value('from') ? '' : SAY.from),
    to: () => (value('to') ? '' : SAY.to),
    leave_date: () => {
      const v = value('leave_date');
      if (!v) return SAY.leave_date;
      return v < today() ? SAY.past : '';
    },
    return_date: () => {
      if (oneWay()) return '';
      const v = value('return_date');
      if (!v) return SAY.return_date;
      return v < value('leave_date') ? SAY.before : '';
    },
    // A trip back the same day it leaves is back after it leaves, when both
    // times are given; a later day may be back at any hour.
    return_time: () => {
      if (oneWay()) return '';
      const leave = value('leave_time'), back = value('return_time');
      if (!leave || !back || value('return_date') !== value('leave_date')) return '';
      return back > leave ? '' : SAY.earlier;
    },
    people: () => {
      const n = Number(value('people'));
      return /^\d+$/.test(value('people')) && n >= 1 && n <= 1000 ? '' : SAY.people;
    },
  };
  function check(name) {
    const words = RULES[name]();
    if (words) mark(field(name), words); else unmark(field(name));
    return !words;
  }

  // -- the draft ---------------------------------------------------------------
  const KEY = 'website.quote-draft';
  function keep() {
    const draft = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'radio') { if (el.checked) draft[el.name] = el.value; }
      else if (el.type === 'checkbox') draft[el.name] = el.checked;
      else draft[el.name] = el.value;
    }
    try { sessionStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* storage refused */ }
  }
  function restore() {
    let draft = null;
    try { draft = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { draft = null; }
    if (!draft || typeof draft !== 'object') return;
    for (const el of form.elements) {
      if (!el.name || !(el.name in draft)) continue;
      if (el.type === 'radio') el.checked = el.value === draft[el.name];
      else if (el.type === 'checkbox') el.checked = draft[el.name] === true;
      else el.value = String(draft[el.name] ?? '');
    }
  }
  function forget() {
    try { sessionStorage.removeItem(KEY); } catch { /* storage refused */ }
  }

  // -- wiring ------------------------------------------------------------------
  restore();
  showReturn();
  bound();

  form.addEventListener('input', event => {
    const name = event.target.name;
    if (name in RULES && event.target.getAttribute('aria-invalid') === 'true') check(name);
    if (['leave_date', 'leave_time', 'return_date'].includes(name) && field('return_time').getAttribute('aria-invalid') === 'true') check('return_time');
    if (name === 'leave_date') bound();
    keep();
  });
  form.addEventListener('change', event => {
    if (event.target.name === 'trip') showReturn();
    keep();
  });

  // -- sending -----------------------------------------------------------------
  /* The request goes to the scheduler's quote-request function, which stores
     it and puts a New quote on the office's Tasks, and answers with its
     number. Turnstile's widget is the site's own, and its key is not a secret. */
  const ENDPOINT = 'https://udnmqhayzhrbltxzzhjw.supabase.co/functions/v1/quote-request';
  const TURNSTILE_SITE_KEY = '';
  const CALL = '(956) 994-1169';
  const FAILED = es ? {
    down: `No pudimos enviarla, y lo que escribió sigue aquí. Inténtelo de nuevo, o llame al ${CALL}.`,
    captcha: `No se pudo confirmar que la envía una persona. Inténtelo de nuevo, o llame al ${CALL}.`,
    limit: `Ya recibimos varias solicitudes suyas en esta hora. Llame al ${CALL} y con gusto le ayudamos.`,
    fields: 'Revise los campos marcados.',
    field: 'Revise esta respuesta.',
  } : {
    down: `We could not send it, and what you typed is still here. Try again, or call ${CALL}.`,
    captcha: `We could not confirm a person is sending it. Try again, or call ${CALL}.`,
    limit: `We already have several requests from you this hour. Call ${CALL} and we’ll help.`,
    fields: 'Check the marked fields.',
    field: 'Check this answer.',
  };
  const failed = document.getElementById('q-failed');
  const failedWords = document.getElementById('q-failed-words');
  const sayFailed = words => {
    failedWords.textContent = words;
    failed.hidden = false;
  };

  /* One Turnstile token for one send, rendered into `host`, as the log-in
     asks for one. A token works once, so each send replaces the widget. Every
     way the check can end without a token resolves null, so a challenge left
     unsolved or a dropped network hands the button back. */
  let widget = null;
  const captchaToken = host => new Promise(resolve => {
    let tries = 0;
    const attempt = () => {
      if (!window.turnstile) {
        if (++tries > 50) return resolve(null);
        return setTimeout(attempt, 200);
      }
      try {
        if (widget !== null) window.turnstile.remove(widget);
        widget = window.turnstile.render(host, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: 'interaction-only',
          language: es ? 'es' : 'en',
          callback: token => resolve(token),
          'error-callback': () => resolve(null),
          'expired-callback': () => resolve(null),
          'timeout-callback': () => resolve(null),
          'unsupported-callback': () => resolve(null),
        });
      } catch { resolve(null); }
    };
    attempt();
  });

  // What the form says, as the function reads it.
  function fields() {
    const out = { lang: es ? 'es' : 'en' };
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else if (el.type === 'checkbox') out[el.name] = el.checked ? el.value : '';
      else out[el.name] = el.value;
    }
    return out;
  }

  async function send(button) {
    button.disabled = true;
    failed.hidden = true;
    try {
      const token = await captchaToken(document.getElementById('q-captcha'));
      if (!token) { sayFailed(FAILED.captcha); return; }
      let res;
      try {
        res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...fields(), token }),
        });
      } catch {
        sayFailed(FAILED.down);
        return;
      }
      const answer = await res.json().catch(() => ({}));
      if (res.ok) {
        forget();
        location.href = answer.number ? `${form.dataset.thanks}?request=${answer.number}` : form.dataset.thanks;
        return;
      }
      if (answer.error === 'fields' && Array.isArray(answer.fields)) {
        // A field the page passed and the function did not is marked with the
        // page's own words where it has them.
        for (const name of answer.fields) {
          const input = field(name);
          if (input && input.type !== 'radio') mark(input, RULES[name]?.() || FAILED.field);
        }
        const first = answer.fields.map(field).find(input => input && input.type !== 'radio');
        if (first) first.focus();
      }
      sayFailed(FAILED[answer.error] ?? FAILED.down);
    } finally {
      button.disabled = false;
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    // Every field is checked, and the reader is taken to the first wrong one
    // in the order the form shows them.
    const order = [...new Set([...form.elements].map(el => el.name))].filter(name => name in RULES);
    const wrong = order.filter(name => !check(name));
    if (wrong.length) {
      field(wrong[0]).focus();
      return;
    }
    if (!TURNSTILE_SITE_KEY) {
      forget();
      location.href = form.dataset.thanks;
      return;
    }
    send(event.submitter ?? form.querySelector('[type="submit"]'));
  });
})();
