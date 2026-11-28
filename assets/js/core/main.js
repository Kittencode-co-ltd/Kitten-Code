/**
* Template Name: Dewi
* Template URL: https://bootstrapmade.com/dewi-free-multi-purpose-html-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', () => {
    aosInit();
    // Listen for image load events in capture phase to refresh AOS when lazy-loaded images load
    document.body.addEventListener('load', (e) => {
      if (e && e.target && e.target.tagName === 'IMG') {
        if (typeof AOS !== 'undefined') {
          AOS.refresh();
        }
      }
    }, true);
  });

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Initiate Pure Counter
   * data-kc-since="2019" keeps a "years since" counter current without editing the page.
   */
  document.querySelectorAll('[data-kc-since]').forEach(function(el) {
    var years = new Date().getFullYear() - parseInt(el.getAttribute('data-kc-since'), 10);
    if (years > 0) el.setAttribute('data-purecounter-end', String(years));
  });
  new PureCounter();

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      if (swiperElement.swiper) return;

      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  window.addEventListener("load", initSwiper);

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    // Items marked .portfolio-hidden stay collapsed until "Load More" is clicked
    let withHidden = function(f) {
      return isotopeItem.querySelector('.isotope-item.portfolio-hidden') ? f + ':not(.portfolio-hidden)' : f;
    };

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: withHidden(filter),
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: withHidden(this.getAttribute('data-filter'))
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

    let loadMoreBtn = isotopeItem.parentElement.querySelector('.portfolio-load-more');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function() {
        isotopeItem.querySelectorAll('.isotope-item.portfolio-hidden').forEach(function(item) {
          item.classList.remove('portfolio-hidden');
        });
        let activeFilter = isotopeItem.querySelector('.isotope-filters .filter-active');
        initIsotope.arrange({
          filter: activeFilter ? activeFilter.getAttribute('data-filter') : '*'
        });
        loadMoreBtn.parentElement.remove();
      });
    }

  });

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a:not(.lang-btn)');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active:not(.lang-btn)').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);

  /**
   * Horizontal timeline: drop the edge fade once scrolled to the end
   */
  document.querySelectorAll('.timeline-scroll').forEach(function(box) {
    function check() {
      box.classList.toggle('at-end', box.scrollLeft + box.clientWidth >= box.scrollWidth - 4);
    }
    box.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
  });
  document.addEventListener('scroll', navmenuScrollspy);

})();

/**
 * Payment Section
 *  [data-pay-method]  switches the visible panel (#panel-<method>)
 *  [data-acno-toggle] shows / hides the full account number
 *  [data-acno-copy]   copies the account number (enabled only while shown)
 * Brand colours come from the .brand-<method> classes in main.css.
 */
(function() {
  "use strict";

  function t(key, fallback) {
    var v = window.KCi18n && window.KCi18n.t(key);
    return typeof v === 'string' && v ? v : fallback;
  }

  function setToggleLabel(btn, shown) {
    btn.setAttribute('aria-pressed', shown ? 'true' : 'false');
    btn.querySelector('i').className = shown ? 'bi bi-eye-slash' : 'bi bi-eye';
    var label = btn.querySelector('span');
    label.setAttribute('data-i18n', shown ? 'payment.hide' : 'payment.show');
    label.textContent = shown ? t('payment.hide', 'Hide') : t('payment.show', 'Show');
  }

  document.addEventListener('click', function(e) {
    var method = e.target.closest('[data-pay-method]');
    if (method) {
      var code = method.getAttribute('data-pay-method');
      document.querySelectorAll('[data-pay-method]').forEach(function(c) {
        var on = c === method;
        c.classList.toggle('active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      document.querySelectorAll('.payment-panel').forEach(function(p) {
        p.hidden = p.id !== 'panel-' + code;
      });
      return;
    }

    var toggle = e.target.closest('[data-acno-toggle]');
    if (toggle) {
      var panel = toggle.closest('.payment-panel');
      var full = panel.querySelector('[data-acno-full]');
      var show = full.hidden;
      full.hidden = !show;
      panel.querySelector('[data-acno-mask]').hidden = show;
      panel.querySelector('[data-acno-copy]').disabled = !show;
      setToggleLabel(toggle, show);
      return;
    }

    var copy = e.target.closest('[data-acno-copy]');
    if (copy) {
      var box = copy.closest('.payment-panel');
      var text = box.querySelector('[data-acno-full]').textContent.trim();
      navigator.clipboard.writeText(text).then(function() {
        var msg = box.querySelector('[data-acno-msg]');
        msg.classList.add('show');
        clearTimeout(msg._t);
        msg._t = setTimeout(function() { msg.classList.remove('show'); }, 2500);
      });
    }
  });
})();
