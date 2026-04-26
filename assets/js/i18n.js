document.addEventListener('DOMContentLoaded', () => {
  const currentLang = localStorage.getItem('appLang') || 'en';

  // Initialize the language loading (no animation on first load)
  loadLanguage(currentLang);

  // Expose function globally so we can toggle language
  window.toggleLanguage = () => {
    // Determine the next language to switch to
    const current = document.documentElement.lang || 'en';
    const nextLang = current === 'en' ? 'th' : 'en';

    // Blur out main content
    document.body.classList.add('i18n-loading');

    // Save to local storage
    localStorage.setItem('appLang', nextLang);

    // Wait for blur-out (250ms) then swap translations
    setTimeout(() => {
      loadLanguage(nextLang);
    }, 250);
  };
});

function loadLanguage(lang) {
  fetch(`assets/i18n/${lang}.json`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load translations');
      return response.json();
    })
    .then(translations => {
      window.currentTranslations = translations;
      applyTranslations(translations);

      // Update HTML lang attribute
      document.documentElement.lang = lang;

      // Update active state of language switcher buttons
      document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
      });
    })
    .catch(error => {
      console.error('Error loading language file:', error);
    })
    .finally(() => {
      // Paint translated content first, then unblur
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.body.classList.remove('i18n-loading');
        });
      });
    });
}

function applyTranslations(translations) {
  // Utility to resolve nested keys like "services.list.web_app.title"
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // 1. Update text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = getNestedValue(translations, key);
    if (value) el.innerHTML = value;
  });

  // 2. Update image alt attributes
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const key = el.getAttribute('data-i18n-alt');
    const value = getNestedValue(translations, key);
    if (value) el.setAttribute('alt', value);
  });

  // 3. Update SEO meta title
  const titleValue = getNestedValue(translations, 'meta.title');
  if (titleValue) document.title = titleValue;

  // 4. Update SEO meta description
  const descValue = getNestedValue(translations, 'meta.description');
  if (descValue) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', descValue);
  }
}
