# Layouts

Every public page has `<div data-kc-header data-active="…">` and `<div data-kc-footer>` placeholders; `assets/js/core/layout.js` renders header (logo, 6 nav links, 5-language switch, dark-mode toggle), footer (contact, useful links, 11 service links, admin login via Firebase Auth, legal line), scroll-top and preloader.

### `assets/js/core/layout.js`

```js
/**
 * Kitten Code — shared page frame for the public site.
 *
 * Renders the header (nav, language and theme switches), the footer, the
 * scroll-to-top button and the preloader, so every public page shares one copy.
 *
 * Usage (load with `defer` BEFORE main.js and i18n.js):
 *   <div data-kc-header data-active="services"></div>
 *   ...page content...
 *   <div data-kc-footer></div>
 *   <script src="<root>/assets/js/core/layout.js" defer></script>
 *
 * data-active: home | about | services | portfolio | team | contact
 *
 * The footer admin links follow the real Firebase Auth session: "Login" when
 * signed out, "Back Office" + "Logout" when signed in. Firebase is only loaded
 * when this browser has used Firebase Auth before, so first-time visitors don't
 * download the SDK.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  // layout.js lives in <root>/assets/js/core/
  var ROOT = new URL('../../../', script ? script.src : location.href).href;
  var isHome = document.body.classList.contains('index-page');

  var NAV = [
    ['home', 'hero'], ['about', 'about'], ['services', 'services'],
    ['portfolio', 'portfolio'], ['team', 'team'], ['contact', 'contact']
  ];

  var SERVICES = [
    ['web_app', 'web-app'], ['mobile_app', 'mobile-app'], ['chatbot', 'chatbot'],
    ['ai_training', 'ai-training'], ['erp', 'erp'], ['system_analysis', 'system-analysis'],
    ['data_analysis', 'data-analysis'], ['multimedia_production', 'multimedia-production'],
    ['consult', 'consult'], ['workshops', 'workshops'], ['rnd', 'rnd']
  ];

  var FALLBACK = {
    nav: { home: 'Home', about: 'About', services: 'Services', portfolio: 'Portfolio', team: 'Team', contact: 'Contact' },
    services: {
      web_app: 'Web Application', mobile_app: 'Mobile Application', chatbot: 'Chatbot Development',
      ai_training: 'AI Training', erp: 'ERP / CRM / POS System', system_analysis: 'System Analysis',
      data_analysis: 'Data Analysis &amp; Prediction', multimedia_production: 'Multimedia &amp; Production',
      consult: 'Consult', workshops: 'Workshops', rnd: 'Research &amp; Development'
    }
  };

  function section(id) {
    return isHome ? '#' + id : ROOT + 'index.html#' + id;
  }

  function langButtons() {
    var langs = (window.KCi18n && window.KCi18n.LANGS) || [
      { code: 'th', label: 'TH', name: 'ไทย' }, { code: 'en', label: 'EN', name: 'English' },
      { code: 'zh', label: '中', name: '简体中文' }, { code: 'ja', label: '日', name: '日本語' },
      { code: 'ko', label: '한', name: '한국어' }
    ];
    return langs.map(function (l) {
      return '<button type="button" class="lang-btn" data-lang="' + l.code + '" lang="' + l.code +
        '" title="' + l.name + '" aria-label="' + l.name + '" aria-pressed="false">' + l.label + '</button>';
    }).join('');
  }

  function headerHtml(active) {
    var items = NAV.map(function (n) {
      var cls = n[0] === active ? ' class="active"' : '';
      return '<li><a href="' + section(n[1]) + '"' + cls + ' data-i18n="nav.' + n[0] + '">' + FALLBACK.nav[n[0]] + '</a></li>';
    }).join('');

    return '' +
      '<header id="header" class="header d-flex align-items-center fixed-top">' +
      '<div class="container-fluid container-xl position-relative d-flex align-items-center">' +
      '<a href="' + ROOT + 'index.html" class="logo d-flex align-items-center me-auto"><h1 class="sitename">KITTEN CODE</h1></a>' +
      '<nav id="navmenu" class="navmenu"><ul>' + items +
      '<li class="lang-toggle-wrapper"><div class="lang-toggle" role="group" aria-label="Language">' + langButtons() + '</div></li>' +
      '<li class="theme-toggle-wrapper"><button id="theme-toggle" class="theme-toggle-btn" type="button" aria-label="Toggle dark mode">' +
      '<i class="bi bi-moon-fill theme-icon-dark"></i><i class="bi bi-sun-fill theme-icon-light"></i></button></li>' +
      '</ul><i class="mobile-nav-toggle d-xl-none bi bi-list"></i></nav>' +
      '</div></header>';
  }

  function serviceLink(s) {
    return '<li><i class="bi bi-chevron-right"></i> <a href="' + ROOT + 'services/service-' + s[1] + '.html" data-i18n="services.list.' +
      s[0] + '.title">' + FALLBACK.services[s[0]] + '</a></li>';
  }

  function footerHtml() {
    var useful = NAV.map(function (n) {
      return '<li><i class="bi bi-chevron-right"></i> <a href="' + section(n[1]) + '" data-i18n="nav.' + n[0] + '">' + FALLBACK.nav[n[0]] + '</a></li>';
    }).join('')
    useful += '<li><i class="bi bi-chevron-right"></i> <a href="' + ROOT + 'trust.html" data-i18n="footer.trust">Trust &amp; data care</a></li>';

    return '' +
      '<footer id="footer" class="footer dark-background"><div class="container footer-top"><div class="row gy-4">' +

      '<div class="col-lg-3 col-md-6 footer-about">' +
      '<a href="' + ROOT + 'index.html" class="logo d-flex align-items-center"><span class="sitename">KITTEN CODE</span></a>' +
      '<div class="footer-contact pt-3">' +
      '<p>347/11 M.3 THAPHO</p><p>PHITSANULOK 65000</p>' +
      '<p class="mt-3"><strong data-i18n="footer.phone">Phone</strong>: <a href="tel:+66808850555">+66 8 0885 0555</a></p>' +
      '<p><strong data-i18n="footer.email">Email</strong>: <a href="mailto:kittencode.co.ltd@gmail.com">kittencode.co.ltd@gmail.com</a></p>' +
      '</div>' +
      '<div class="social-links d-flex pt-3">' +
      '<a href="https://www.facebook.com/people/Kitten-Code/61578657051567/" target="_blank" rel="noopener" aria-label="Facebook"><i class="bi bi-facebook"></i></a>' +
      '<a href="https://www.instagram.com/kitten.code/" target="_blank" rel="noopener" aria-label="Instagram"><i class="bi bi-instagram"></i></a>' +
      '</div></div>' +

      '<div class="col-lg-2 col-md-3 footer-links"><h4 data-i18n="footer.useful_links">Useful Links</h4><ul>' + useful + '</ul></div>' +

      '<div class="col-lg-2 col-md-3 footer-links"><h4 data-i18n="footer.our_services">Our Services</h4><ul>' +
      SERVICES.slice(0, 6).map(serviceLink).join('') + '</ul></div>' +

      '<div class="col-lg-3 col-md-6 footer-links"><h4 class="d-none d-lg-block">&nbsp;</h4><ul>' +
      SERVICES.slice(6).map(serviceLink).join('') + '</ul></div>' +

      '<div class="col-lg-2 col-md-6 footer-links"><h4 data-i18n="footer.admin">Admin</h4><ul id="adminLinks">' +
      adminLinks(false) + '</ul></div>' +

      '</div></div>' +
      '<div class="container copyright text-center mt-4"><p>© <span data-i18n="footer.copyright">Copyright</span> ' +
      '<strong class="px-1 sitename">KITTEN CODE Co., Ltd.</strong></p>' +
      '<p class="footer-legal">บริษัท คิทเท่น โค้ด จำกัด · <span data-i18n="legal.reg">Juristic person registration no.</span> 0655569001411</p></div>' +
      '</footer>' +
      '<a href="#" id="scroll-top" class="scroll-top d-flex align-items-center justify-content-center" aria-label="Back to top"><i class="bi bi-arrow-up-short"></i></a>' +
      '<div id="preloader"></div>';
  }

  function adminLinks(signedIn) {
    if (signedIn) {
      return '<li><i class="bi bi-chevron-right"></i> <a href="' + ROOT + 'back-office/back-office.html" data-i18n="footer.back_office">Back Office</a></li>' +
        '<li><i class="bi bi-chevron-right"></i> <a href="#" data-kc-logout data-i18n="footer.logout">Logout</a></li>';
    }
    return '<li><i class="bi bi-chevron-right"></i> <a href="' + ROOT + 'back-office/login.html" data-i18n="footer.login">Login</a></li>';
  }

  function replace(el, html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    el.replaceWith(tpl.content);
  }

  var headerSlot = document.querySelector('[data-kc-header]');
  if (headerSlot) replace(headerSlot, headerHtml(headerSlot.getAttribute('data-active') || ''));

  var footerSlot = document.querySelector('[data-kc-footer]');
  if (footerSlot) replace(footerSlot, footerHtml());

  // Old flag from the previous footer; it never reflected the real session.
  try { localStorage.removeItem('isLoggedIn'); } catch (e) { }

  /* ---------- Real auth state in the footer ---------- */

  function hasFirebaseSession() {
    try {
      for (var i = 0; i < sessionStorage.length; i++) {
        if (String(sessionStorage.key(i)).indexOf('firebase:authUser:') === 0) return Promise.resolve(true);
      }
    } catch (e) { }
    if (!window.indexedDB) return Promise.resolve(false);
    if (typeof indexedDB.databases !== 'function') return Promise.resolve(true); // can't tell: check properly
    return indexedDB.databases().then(function (dbs) {
      return dbs.some(function (d) { return d.name === 'firebaseLocalStorageDb'; });
    }).catch(function () { return true; });
  }

  function renderAdmin(signedIn) {
    var ul = document.getElementById('adminLinks');
    if (!ul) return;
    ul.innerHTML = adminLinks(signedIn);
    if (window.KCi18n && window.KCi18n.lang) window.KCi18n.apply();
  }

  function watchAuth() {
    hasFirebaseSession().then(function (maybe) {
      if (!maybe) return;
      import(ROOT + 'assets/js/bo/core/firebase-config.js').then(function (fb) {
        fb.onAuthStateChanged(fb.auth, function (user) { renderAdmin(!!user); });
        document.addEventListener('click', function (e) {
          var a = e.target.closest && e.target.closest('[data-kc-logout]');
          if (!a) return;
          e.preventDefault();
          fb.signOut(fb.auth).catch(function (err) { console.error('Logout failed:', err); });
        });
      }).catch(function (err) { console.warn('Auth check skipped:', err); });
    });
  }

  window.addEventListener('load', function () {
    (window.requestIdleCallback || function (fn) { setTimeout(fn, 300); })(watchAuth);
  });
})();

```

### `assets/js/core/theme.js`

```js
/**
 * Kitten Code — Dark Mode Theme System
 * Handles toggle, localStorage persistence, and system preference detection.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'kittencode-theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  /** Read saved preference, fallback to 'light' (the default look) */
  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY) || LIGHT;
  }

  /** Apply theme attribute to <html> and update toggle icon */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
  }

  /** Swap the visible icon inside the toggle button */
  function updateToggleIcon(theme) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var iconDark = btn.querySelector('.theme-icon-dark');
    var iconLight = btn.querySelector('.theme-icon-light');
    if (iconDark && iconLight) {
      // Show moon in light mode (click → go dark), show sun in dark mode (click → go light)
      iconDark.style.display = theme === LIGHT ? 'inline-block' : 'none';
      iconLight.style.display = theme === DARK ? 'inline-block' : 'none';
    }
  }

  /** Toggle between dark and light */
  function toggle() {
    var current = document.documentElement.getAttribute('data-theme') || LIGHT;
    applyTheme(current === DARK ? LIGHT : DARK);
  }

  /** Init on DOMContentLoaded */
  document.addEventListener('DOMContentLoaded', function () {
    var theme = getSavedTheme();
    applyTheme(theme);

    // Bind all toggle buttons (main nav + mobile)
    document.querySelectorAll('#theme-toggle, #theme-toggle-mobile').forEach(function (btn) {
      btn.addEventListener('click', toggle);
    });
  });
})();

```

### `assets/js/core/i18n.js`

```js
/**
 * Kitten Code — public site i18n
 *
 * Languages: th, en, zh (Simplified Chinese), ja, ko.
 * Strings live in assets/i18n/<lang>.json. Any key missing from a language
 * falls back to English, then to the text already written in the HTML.
 *
 * Markup:
 *   data-i18n="a.b.c"        → element.innerHTML
 *   data-i18n-alt="a.b"      → alt attribute
 *   data-i18n-list="a.b"     → <ul>/<ol> rebuilt from a string array
 *                               (optional data-i18n-icon="bi-check-circle" adds <i> per item)
 *
 * API: window.KCi18n = { lang, t(key), setLanguage(lang), LANGS }
 * Event: document 'kc:langchange' (detail.lang) fires after every apply.
 */
(function () {
  'use strict';

  var LANGS = [
    { code: 'th', label: 'TH', name: 'ไทย', html: 'th' },
    { code: 'en', label: 'EN', name: 'English', html: 'en' },
    { code: 'zh', label: '中', name: '简体中文', html: 'zh-Hans' },
    { code: 'ja', label: '日', name: '日本語', html: 'ja' },
    { code: 'ko', label: '한', name: '한국어', html: 'ko' }
  ];
  var CODES = LANGS.map(function (l) { return l.code; });
  var STORAGE_KEY = 'appLang';
  var CACHE_VERSION = 'v3'; // bump whenever assets/i18n/*.json changes

  function store(kind, key, value) {
    try { (kind === 'local' ? localStorage : sessionStorage).setItem(key, value); } catch (e) { }
  }
  function read(kind, key) {
    try { return (kind === 'local' ? localStorage : sessionStorage).getItem(key); } catch (e) { return null; }
  }

  function detectLanguage() {
    var saved = read('local', STORAGE_KEY);
    if (saved && CODES.indexOf(saved) !== -1) return saved;
    var prefs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < prefs.length; i++) {
      var p = String(prefs[i] || '').toLowerCase().slice(0, 2);
      if (CODES.indexOf(p) !== -1) return p;
    }
    return 'en';
  }

  // i18n.js lives in <root>/assets/js/core/, so the site root is three levels up.
  var ROOT = document.currentScript ? new URL('../../../', document.currentScript.src).href : (window.i18nBasePath || '');
  function basePath() {
    return ROOT;
  }

  function fetchDict(lang) {
    var key = 'i18n_' + CACHE_VERSION + '_' + lang;
    var cached = read('session', key);
    if (cached) {
      try { return Promise.resolve(JSON.parse(cached)); } catch (e) { }
    }
    return fetch(basePath() + 'assets/i18n/' + lang + '.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load ' + lang + '.json');
        return r.json();
      })
      .then(function (d) { store('session', key, JSON.stringify(d)); return d; });
  }

  function get(obj, path) {
    return String(path).split('.').reduce(function (acc, part) {
      return acc != null ? acc[part] : undefined;
    }, obj);
  }

  var dict = {};
  var fallback = {};

  function t(key) {
    var v = get(dict, key);
    if (v == null || v === '') v = get(fallback, key);
    return v;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (typeof v === 'string' && v) el.innerHTML = v;
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-alt'));
      if (typeof v === 'string' && v) el.setAttribute('alt', v);
    });

    document.querySelectorAll('[data-i18n-list]').forEach(function (el) {
      var items = t(el.getAttribute('data-i18n-list'));
      if (!Array.isArray(items) || !items.length) return;
      var icon = el.getAttribute('data-i18n-icon');
      el.innerHTML = items.map(function (item) {
        return '<li>' + (icon ? '<i class="bi ' + escapeHtml(icon) + '"></i> ' : '') + escapeHtml(item) + '</li>';
      }).join('');
    });

    // Page title: a page can name its own key with <body data-i18n-title="...">
    var titleKey = document.body.getAttribute('data-i18n-title');
    var title = titleKey ? t(titleKey) : t('meta.title');
    if (typeof title === 'string' && title) {
      document.title = titleKey ? title + ' — KITTEN CODE' : title;
    }

    var desc = t('meta.description');
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && typeof desc === 'string' && desc) metaDesc.setAttribute('content', desc);

    if (typeof AOS !== 'undefined' && typeof AOS.refresh === 'function') AOS.refresh();
  }

  function markActive(lang) {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      var on = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function htmlLang(lang) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === lang) return LANGS[i].html;
    return lang;
  }

  function reveal() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { document.body.classList.remove('i18n-loading'); });
    });
  }

  function load(lang) {
    var jobs = [fetchDict(lang)];
    if (lang !== 'en') jobs.push(fetchDict('en'));
    return Promise.all(jobs)
      .then(function (res) {
        dict = res[0];
        fallback = res[1] || res[0];
        api.lang = lang;
        document.documentElement.lang = htmlLang(lang);
        markActive(lang);
        applyTranslations();
        document.dispatchEvent(new CustomEvent('kc:langchange', { detail: { lang: lang } }));
      })
      .catch(function (err) { console.error('i18n:', err); })
      .finally(reveal);
  }

  function setLanguage(lang) {
    if (CODES.indexOf(lang) === -1 || lang === api.lang) return;
    store('local', STORAGE_KEY, lang);
    markActive(lang);
    document.body.classList.add('i18n-loading');
    setTimeout(function () { load(lang); }, 200);
  }

  var api = { lang: null, t: t, setLanguage: setLanguage, LANGS: LANGS, apply: applyTranslations };
  window.KCi18n = api;

  // Clicks on any .lang-btn[data-lang] (rendered by layout.js) switch language.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.lang-btn[data-lang]');
    if (!btn) return;
    e.preventDefault();
    setLanguage(btn.getAttribute('data-lang'));
  });

  function init() {
    var lang = detectLanguage();
    markActive(lang);
    load(lang);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

```

