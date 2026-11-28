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
    var items = langs.map(function (l) {
      return '<button type="button" class="lang-btn" role="menuitemradio" data-lang="' + l.code + '" data-label="' + l.label +
        '" lang="' + l.code + '" aria-pressed="false"><span class="lang-code">' + l.label + '</span><span class="lang-name">' +
        l.name + '</span></button>';
    }).join('');
    return '<div class="lang-dd">' +
      '<button type="button" class="lang-dd-toggle" aria-haspopup="true" aria-expanded="false" aria-label="Language / ภาษา">' +
      '<i class="bi bi-globe2" aria-hidden="true"></i><span class="lang-dd-current">TH</span>' +
      '<i class="bi bi-chevron-down lang-dd-chev" aria-hidden="true"></i></button>' +
      '<div class="lang-dd-menu" role="menu" aria-label="Language" hidden>' + items + '</div>' +
      '</div>';
  }

  /* Small screens: language and theme live inside the burger menu instead of the top bar */
  function mobileTools() {
    var langs = (window.KCi18n && window.KCi18n.LANGS) || [
      { code: 'th', label: 'TH', name: 'ไทย' }, { code: 'en', label: 'EN', name: 'English' },
      { code: 'zh', label: '中', name: '简体中文' }, { code: 'ja', label: '日', name: '日本語' },
      { code: 'ko', label: '한', name: '한국어' }
    ];
    var langBtns = langs.map(function (l) {
      return '<button type="button" class="lang-btn mnav-lang" data-lang="' + l.code + '" data-label="' + l.label +
        '" lang="' + l.code + '" aria-pressed="false" aria-label="' + l.name + '">' + l.name + '</button>';
    }).join('');
    return '<li class="mnav-tools">' +
      '<p class="mnav-label"><i class="bi bi-globe2" aria-hidden="true"></i> <span data-i18n="nav.language">Language</span></p>' +
      '<div class="mnav-langs" role="group" aria-label="Language">' + langBtns + '</div>' +
      '<button type="button" id="theme-toggle-mobile" class="mnav-theme">' +
      '<span class="mnav-theme-icon"><i class="bi bi-moon-fill theme-icon-dark" aria-hidden="true"></i>' +
      '<i class="bi bi-sun-fill theme-icon-light" aria-hidden="true"></i></span>' +
      '<span class="mnav-theme-text"><span class="when-light" data-i18n="nav.theme_dark">Dark mode</span>' +
      '<span class="when-dark" data-i18n="nav.theme_light">Light mode</span></span>' +
      '<span class="mnav-switch" aria-hidden="true"><span></span></span></button>' +
      '</li>';
  }

  function headerHtml(active) {
    var items = NAV.map(function (n) {
      var cls = n[0] === active ? ' class="active"' : '';
      return '<li><a href="' + section(n[1]) + '"' + cls + ' data-i18n="nav.' + n[0] + '">' + FALLBACK.nav[n[0]] + '</a></li>';
    }).join('') + mobileTools();

    return '' +
      '<header id="header" class="header d-flex align-items-center fixed-top">' +
      '<div class="container-fluid container-xl position-relative header-inner">' +
      '<a href="' + ROOT + 'index.html" class="logo d-flex align-items-center"><h1 class="sitename">KITTEN CODE</h1></a>' +
      '<nav id="navmenu" class="navmenu" aria-label="Main"><ul>' + items + '</ul></nav>' +
      '<div class="header-tools">' + langButtons() +
      '<button id="theme-toggle" class="theme-toggle-btn" type="button" aria-label="Toggle dark mode">' +
      '<i class="bi bi-moon-fill theme-icon-dark"></i><i class="bi bi-sun-fill theme-icon-light"></i></button>' +
      '<button type="button" class="mobile-nav-toggle d-xl-none bi bi-list" aria-label="Menu"></button>' +
      '</div>' +
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
      '<a href="#" id="scroll-top" class="scroll-top d-flex align-items-center justify-content-center" aria-label="Back to top">' +
      '<svg class="scroll-top-ring" viewBox="0 0 52 52" aria-hidden="true"><circle class="track" cx="26" cy="26" r="23"></circle>' +
      '<circle class="bar" cx="26" cy="26" r="23" pathLength="100"></circle></svg>' +
      '<i class="bi bi-arrow-up-short" aria-hidden="true"></i></a>' +
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

  /* ---------- Language dropdown ---------- */
  (function () {
    var dd = document.querySelector('.lang-dd');
    if (!dd) return;
    var toggle = dd.querySelector('.lang-dd-toggle');
    var menu = dd.querySelector('.lang-dd-menu');
    var current = dd.querySelector('.lang-dd-current');

    function setOpen(open) {
      menu.hidden = !open;
      dd.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function syncLabel(e) {
      var active = menu.querySelector('.lang-btn.active');
      if (active) current.textContent = active.getAttribute('data-label');
      if (e && e.type === 'kc:langchange') {
        dd.classList.remove('changed');
        void dd.offsetWidth;
        dd.classList.add('changed');
      }
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(menu.hidden);
      if (!menu.hidden) {
        var first = menu.querySelector('.lang-btn.active') || menu.querySelector('.lang-btn');
        if (first) first.focus();
      }
    });
    // Choosing a language: i18n.js does the switching; here we just update the label and close.
    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-btn');
      if (!btn) return;
      current.textContent = btn.getAttribute('data-label');
      setOpen(false);
      toggle.focus();
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('kc:langchange', syncLabel);
    document.addEventListener('DOMContentLoaded', function () { setTimeout(syncLabel, 0); });
  })();

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
