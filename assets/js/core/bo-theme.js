/**
 * Back-office user preferences:
 *  - Theme     : 'light' | 'dark'             (key: 'kittencode-theme')
 *  - Font Size : 'small' | 'normal' | 'large' (key: 'kittencode-fontsize')
 *  - Language  : 'th'    | 'en'               (key: 'kittencode-lang')
 *
 * Loaded in <head> on the shell (back-office.html) and every page inside it,
 * so preferences apply before first paint and stay synchronized across
 * parent shell <-> iframe and across tabs.
 */
(function () {
  'use strict';
  var THEME_KEY = 'kittencode-theme';
  var FONT_KEY = 'kittencode-fontsize';
  var LANG_KEY = 'kittencode-lang';

  var VALID_FONTS = { small: 1, normal: 1, large: 1 };
  var VALID_LANGS = { th: 1, en: 1 };

  function readTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) { /* storage blocked */ }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function readFontSize() {
    try {
      var saved = localStorage.getItem(FONT_KEY);
      if (saved && VALID_FONTS[saved]) return saved;
    } catch (e) { /* ignore */ }
    return 'normal';
  }

  function readLang() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved && VALID_LANGS[saved]) return saved;
    } catch (e) { /* ignore */ }
    return 'th';
  }

  function translateDOM(lang, doc) {
    var d = doc || document;
    if (!d || !d.querySelectorAll) return;
    var attr = lang === 'en' ? 'data-i18n-en' : 'data-i18n-th';
    var nodes = d.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var val = el.getAttribute(attr);
      if (val !== null) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', val);
        } else {
          el.textContent = val;
        }
      }
    }
    var phAttr = lang === 'en' ? 'data-i18n-ph-en' : 'data-i18n-ph-th';
    var phNodes = d.querySelectorAll('[' + phAttr + ']');
    for (var j = 0; j < phNodes.length; j++) {
      var pel = phNodes[j];
      var pval = pel.getAttribute(phAttr);
      if (pval !== null) pel.setAttribute('placeholder', pval);
    }
  }

  function applyAll(doc) {
    var d = doc || document;
    var root = d.documentElement;
    var theme = readTheme();
    var fontSize = readFontSize();
    var lang = readLang();

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
    root.setAttribute('data-fontsize', fontSize);
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);

    translateDOM(lang, d);
  }

  function notifyPeers(eventName, detail) {
    document.dispatchEvent(new CustomEvent(eventName, { detail: detail }));
    // Propagate to child iframe if we are the shell
    var frame = document.getElementById('contentFrame');
    try {
      if (frame && frame.contentWindow && frame.contentWindow.KCTheme) {
        frame.contentWindow.KCTheme.syncFromStorage(true);
      } else if (frame && frame.contentDocument) {
        applyAll(frame.contentDocument);
      }
    } catch (e) { /* ignore cross-origin */ }

    // Propagate to parent shell if we are inside the iframe
    try {
      if (window.parent && window.parent !== window && window.parent.KCTheme) {
        window.parent.KCTheme.syncFromStorage(true);
      }
    } catch (e) { /* ignore cross-origin */ }
  }

  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') theme = 'light';
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
    applyAll(document);
    notifyPeers('kc-theme-change', theme);
  }

  function setFontSize(size) {
    if (!VALID_FONTS[size]) size = 'normal';
    try { localStorage.setItem(FONT_KEY, size); } catch (e) { /* ignore */ }
    applyAll(document);
    notifyPeers('kc-fontsize-change', size);
  }

  function setLang(lang) {
    if (!VALID_LANGS[lang]) lang = 'th';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    applyAll(document);
    notifyPeers('kc-lang-change', lang);
  }

  function syncFromStorage(silentPeers) {
    applyAll(document);
    if (!silentPeers) {
      document.dispatchEvent(new CustomEvent('kc-theme-change', { detail: readTheme() }));
      document.dispatchEvent(new CustomEvent('kc-fontsize-change', { detail: readFontSize() }));
      document.dispatchEvent(new CustomEvent('kc-lang-change', { detail: readLang() }));
    } else {
      document.dispatchEvent(new CustomEvent('kc-theme-change', { detail: readTheme() }));
      document.dispatchEvent(new CustomEvent('kc-fontsize-change', { detail: readFontSize() }));
      document.dispatchEvent(new CustomEvent('kc-lang-change', { detail: readLang() }));
    }
  }

  applyAll(document);
  document.addEventListener('DOMContentLoaded', function () {
    applyAll(document);
  });

  window.addEventListener('storage', function (e) {
    if (e.key === THEME_KEY || e.key === FONT_KEY || e.key === LANG_KEY) {
      syncFromStorage(true);
    }
  });

  window.KCTheme = {
    get: function () { return document.documentElement.getAttribute('data-theme') || readTheme(); },
    set: setTheme,
    toggle: function () { setTheme(this.get() === 'dark' ? 'light' : 'dark'); },
    getFontSize: function () { return document.documentElement.getAttribute('data-fontsize') || readFontSize(); },
    setFontSize: setFontSize,
    getLang: function () { return document.documentElement.getAttribute('data-lang') || readLang(); },
    setLang: setLang,
    toggleLang: function () { setLang(this.getLang() === 'en' ? 'th' : 'en'); },
    translateDOM: function (doc) { translateDOM(this.getLang(), doc || document); },
    syncFromStorage: syncFromStorage
  };
})();
