/**
 * Back-office light/dark theme.
 * Load in <head> (classic script, not deferred) on the shell and every page
 * inside it, so the saved theme applies before first paint.
 * The shell calls KCTheme.set(); pages inside the iframe follow through the
 * `storage` event and a direct update from the shell.
 */
(function () {
  'use strict';
  var KEY = 'kittencode-theme';

  function read() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) { /* storage blocked */ }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme, doc) {
    var root = (doc || document).documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme); // Bootstrap pages (users, profile)
  }

  function set(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) { /* ignore */ }
    apply(theme);
    // Update the open page in the iframe right away.
    var frame = document.getElementById('contentFrame');
    try { if (frame && frame.contentDocument) apply(theme, frame.contentDocument); } catch (e) { /* cross-origin */ }
    document.dispatchEvent(new CustomEvent('kc-theme-change', { detail: theme }));
  }

  apply(read());
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(read()); });

  window.KCTheme = {
    get: function () { return document.documentElement.getAttribute('data-theme') || 'light'; },
    set: set,
    toggle: function () { set(this.get() === 'dark' ? 'light' : 'dark'); }
  };
})();
