document.addEventListener('DOMContentLoaded', () => {
  const currentLang = localStorage.getItem('appLang') || 'en';
  loadLanguage(currentLang);

  window.toggleLanguage = () => {
    const current = document.documentElement.lang || 'en';
    const nextLang = current === 'en' ? 'th' : 'en';
    document.body.classList.add('i18n-loading');
    localStorage.setItem('appLang', nextLang);
    setTimeout(() => loadLanguage(nextLang), 250);
  };
});

function loadLanguage(lang) {
  const basePath = window.i18nBasePath || '';
  const cacheKey = `i18n_${lang}`;

  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const translations = JSON.parse(cached);
      window.currentTranslations = translations;
      applyTranslations(translations);
      document.documentElement.lang = lang;
      document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.body.classList.remove('i18n-loading');
      }));
      return;
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }

  fetch(`${basePath}assets/i18n/${lang}.json`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load translations');
      return response.json();
    })
    .then(translations => {
      sessionStorage.setItem(cacheKey, JSON.stringify(translations));
      window.currentTranslations = translations;
      applyTranslations(translations);
      document.documentElement.lang = lang;
      document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
      });
    })
    .catch(error => {
      console.error('Error loading language file:', error);
    })
    .finally(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.body.classList.remove('i18n-loading');
      }));
    });
}

function applyTranslations(translations) {
  const getNestedValue = (obj, path) =>
    path.split('.').reduce((acc, part) => acc && acc[part], obj);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const value = getNestedValue(translations, el.getAttribute('data-i18n'));
    if (value) el.innerHTML = value;
  });

  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const value = getNestedValue(translations, el.getAttribute('data-i18n-alt'));
    if (value) el.setAttribute('alt', value);
  });

  const titleValue = getNestedValue(translations, 'meta.title');
  if (titleValue) document.title = titleValue;

  const descValue = getNestedValue(translations, 'meta.description');
  if (descValue) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', descValue);
  }

  // Refresh AOS after translations are applied and element heights shift
  if (typeof AOS !== 'undefined' && typeof AOS.refresh === 'function') {
    AOS.refresh();
  }
}
