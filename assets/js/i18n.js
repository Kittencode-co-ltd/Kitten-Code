document.addEventListener('DOMContentLoaded', () => {
  const currentLang = localStorage.getItem('appLang') || 'en';
  
  // Initialize the language loading
  loadLanguage(currentLang);

  // Expose function globally so we can switch languages via buttons
  window.switchLanguage = (lang) => {
    // Add loading class to fade out/hide content before switching
    document.body.classList.add('i18n-loading');
    
    // Save to local storage
    localStorage.setItem('appLang', lang);
    
    // Fetch and apply new language
    setTimeout(() => {
      loadLanguage(lang);
    }, 300); // give fade-out time to complete
  };
});

function loadLanguage(lang) {
  fetch(`assets/i18n/${lang}.json`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load translations');
      }
      return response.json();
    })
    .then(translations => {
      window.currentTranslations = translations;
      applyTranslations(translations);
      
      // Update HTML lang attribute
      document.documentElement.lang = lang;
      
      // Update active state of language switcher buttons if any exist
      document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lang) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    })
    .catch(error => {
      console.error('Error loading language file:', error);
    })
    .finally(() => {
      // Remove loading class to reveal content
      document.body.classList.remove('i18n-loading');
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
    if (value) {
      // Use innerHTML in case we have formatting (like <br> or <span> inside text)
      el.innerHTML = value;
    }
  });

  // 2. Update image alt attributes
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const key = el.getAttribute('data-i18n-alt');
    const value = getNestedValue(translations, key);
    if (value) {
      el.setAttribute('alt', value);
    }
  });

  // 3. Update SEO Meta Data
  const titleValue = getNestedValue(translations, 'meta.title');
  if (titleValue) {
    document.title = titleValue;
  }

  const descValue = getNestedValue(translations, 'meta.description');
  if (descValue) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', descValue);
    }
  }
}
