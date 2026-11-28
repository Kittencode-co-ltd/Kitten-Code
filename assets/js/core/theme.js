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

  /**
   * Toggle between dark and light.
   * Where the browser supports View Transitions, the new theme grows out of the button as a circle;
   * elsewhere (or with "reduce motion") colours simply cross-fade.
   */
  function toggle(e) {
    var root = document.documentElement;
    var next = (root.getAttribute('data-theme') || LIGHT) === DARK ? LIGHT : DARK;
    var btn = e && e.currentTarget;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (btn) {
      // icon spins in, and an orange ripple bursts out of the button
      btn.classList.remove('theme-spin', 'theme-burst');
      void btn.offsetWidth;
      btn.classList.add('theme-spin', 'theme-burst');
      setTimeout(function () { btn.classList.remove('theme-burst'); }, 800);
    }

    if (reduce) {
      applyTheme(next);
      return;
    }

    // Older browsers: every colour fades smoothly instead of snapping.
    if (!document.startViewTransition) {
      root.classList.add('theme-fade');
      applyTheme(next);
      setTimeout(function () { root.classList.remove('theme-fade'); }, 650);
      return;
    }

    var r = btn ? btn.getBoundingClientRect() : { left: window.innerWidth, top: 0, width: 0, height: 0 };
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    var small = 'circle(0px at ' + x + 'px ' + y + 'px)';
    var full = 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)';
    var goingDark = next === DARK;

    // Light → dark: darkness spreads out from the button.
    // Dark → light: the darkness shrinks back into the button, like switching a lamp on.
    root.classList.add('vt-theme');
    root.classList.toggle('vt-theme-in', !goingDark);
    var transition = document.startViewTransition(function () { applyTheme(next); });
    var reveal = null;
    transition.ready.then(function () {
      reveal = root.animate(
        { clipPath: goingDark ? [small, full] : [full, small] },
        {
          duration: goingDark ? 850 : 750,
          easing: goingDark ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'cubic-bezier(0.64, 0, 0.78, 0)',
          fill: 'both',
          pseudoElement: goingDark ? '::view-transition-new(root)' : '::view-transition-old(root)'
        }
      );
    });
    transition.finished.finally(function () {
      if (reveal) reveal.cancel(); // don't leave the clip-path animation hanging around for the next switch
      root.classList.remove('vt-theme', 'vt-theme-in');
    });
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
