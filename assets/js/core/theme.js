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
