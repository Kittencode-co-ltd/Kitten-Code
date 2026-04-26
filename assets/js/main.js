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
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

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
  document.addEventListener('scroll', navmenuScrollspy);

})();

/**
 * Payment Section — switchPayment / toggleAccNo / copyAccount
 * Kept outside IIFE so inline onclick attributes in HTML can reach them.
 */
var methodColors = {
  kbank:  { border: '#00a651', bar: '#00a651', shadow: 'rgba(0,166,81,0.18)' },
  ktb:    { border: '#1565c0', bar: '#1565c0', shadow: 'rgba(21,101,192,0.18)' },
  alipay: { border: '#00a0e9', bar: '#00a0e9', shadow: 'rgba(0,160,233,0.18)' },
  paypal: { border: '#0070ba', bar: '#0070ba', shadow: 'rgba(0,112,186,0.18)' }
};

function switchPayment(method, el) {
  document.querySelectorAll('.payment-method-card').forEach(function(c) {
    c.style.border = '2px solid #e8ecf4';
    c.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
    var bar = c.querySelector('.method-bar');
    if (bar) bar.style.background = '#e8ecf4';
  });
  var col = methodColors[method];
  el.style.border = '2px solid ' + col.border;
  el.style.boxShadow = '0 4px 20px ' + col.shadow;
  var bar = el.querySelector('.method-bar');
  if (bar) bar.style.background = col.bar;
  document.querySelectorAll('.payment-panel').forEach(function(p) { p.style.display = 'none'; });
  document.getElementById('panel-' + method).style.display = 'block';
}

function toggleAccNo(bank) {
  var mask    = document.getElementById('acno-' + bank + '-mask');
  var reveal  = document.getElementById('acno-' + bank);
  var btn     = document.getElementById('btn-toggle-' + bank);
  var copyBtn = document.getElementById('btn-copy-' + bank);
  var shown   = reveal.style.display !== 'none';
  if (shown) {
    mask.style.display    = '';
    reveal.style.display  = 'none';
    btn.innerHTML         = '<i class="bi bi-eye" id="icon-toggle-' + bank + '"></i> Show';
    copyBtn.style.opacity       = '0.35';
    copyBtn.style.pointerEvents = 'none';
  } else {
    mask.style.display    = 'none';
    reveal.style.display  = '';
    btn.innerHTML         = '<i class="bi bi-eye-slash" id="icon-toggle-' + bank + '"></i> Hide';
    copyBtn.style.opacity       = '1';
    copyBtn.style.pointerEvents = 'auto';
  }
}

function copyAccount(elemId, msgId) {
  var text = document.getElementById(elemId).innerText;
  navigator.clipboard.writeText(text).then(function() {
    var msg = document.getElementById(msgId);
    msg.style.opacity = '1';
    setTimeout(function() { msg.style.opacity = '0'; }, 2500);
  });
}