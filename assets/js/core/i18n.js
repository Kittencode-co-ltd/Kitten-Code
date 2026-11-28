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
  var CACHE_VERSION = 'v6'; // bump whenever assets/i18n/*.json changes

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
    return fetch(basePath() + 'assets/i18n/' + lang + '.json?v=' + CACHE_VERSION)
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

    var root = document.documentElement;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Modern browsers: old text fades up and away, new text rises in (View Transitions).
    if (document.startViewTransition && !reduce) {
      // Fetch first so the page never freezes on a slow network inside the transition.
      Promise.all([fetchDict(lang), lang !== 'en' ? fetchDict('en') : null]).then(function () {
        root.classList.add('vt-lang');
        var tr = document.startViewTransition(function () { return load(lang); });
        tr.finished.finally(function () { root.classList.remove('vt-lang'); });
      }).catch(function () { load(lang); });
      return;
    }

    // Fallback: soft blur-out / blur-in of the content.
    document.body.classList.add('i18n-loading');
    setTimeout(function () { load(lang); }, 220);
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
