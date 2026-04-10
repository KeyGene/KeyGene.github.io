/* ===== KEYGENE SHARED JS ===== */

// ===== THEME TOGGLE =====
(function initTheme() {
  const MOON = '<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>';
  const SUN = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';

  function applyTheme(t) {
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.colorScheme = 'dark';
    }
    var icon = document.getElementById('themeIcon');
    if (icon) icon.innerHTML = t === 'light' ? SUN : MOON;
  }

  // Apply saved theme immediately (before DOM ready to avoid flash)
  var saved = localStorage.getItem('keygene_theme');
  applyTheme(saved || 'dark');

  // Bind toggle button after DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        var next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('keygene_theme', next);
        applyTheme(next);
      });
    }
    // Re-apply to make sure icon is set after DOM paint
    applyTheme(localStorage.getItem('keygene_theme') || 'dark');
  });
})();

// ===== LANGUAGE =====
var currentLang = 'en';

function initLanguage() {
  var saved = localStorage.getItem('keygene_lang');
  return saved || ((navigator.languages && navigator.languages[0] || navigator.language || 'en').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en');
}

// Generic function to apply language to data-key elements
// Each page defines its own `texts` object and calls this
function applyLanguageToDOM(lang, texts) {
  currentLang = lang;
  localStorage.setItem('keygene_lang', lang);
  var data = texts[lang];
  if (!data) return;
  document.querySelectorAll('[data-key]').forEach(function(el) {
    var key = el.getAttribute('data-key');
    if (!data[key]) return;
    if (data[key].indexOf('<') !== -1 && (data[key].indexOf('<br') !== -1 || data[key].indexOf('<span') !== -1 || data[key].indexOf('<strong') !== -1)) {
      el.innerHTML = data[key];
    } else {
      el.textContent = data[key];
    }
  });
  // Update placeholders
  document.querySelectorAll('[data-placeholder-zh]').forEach(function(el) {
    el.placeholder = lang === 'zh' ? el.dataset.placeholderZh : el.dataset.placeholderEn;
  });
}

function bindLangToggle(texts, afterSwitch) {
  document.addEventListener('DOMContentLoaded', function() {
    var lang = initLanguage();
    applyLanguageToDOM(lang, texts);
    if (afterSwitch) afterSwitch(lang);

    var btn = document.getElementById('langToggle');
    if (btn) {
      btn.addEventListener('click', function() {
        var next = currentLang === 'en' ? 'zh' : 'en';
        applyLanguageToDOM(next, texts);
        if (afterSwitch) afterSwitch(next);
      });
    }
  });
}

// Global helper used by inline onclick handlers
function closeMobileNav() {
  var mn = document.getElementById('mobileNav');
  if (mn) mn.classList.remove('open');
}

// ===== MOBILE NAV =====
document.addEventListener('DOMContentLoaded', function() {
  var hamburger = document.getElementById('hamburgerBtn');
  var mobileNav = document.getElementById('mobileNav');
  var closeBtn = document.getElementById('mobileNavClose');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function() {
      mobileNav.classList.add('open');
    });
  }
  if (closeBtn && mobileNav) {
    closeBtn.addEventListener('click', function() {
      mobileNav.classList.remove('open');
    });
  }
  // Close on link click
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        mobileNav.classList.remove('open');
      });
    });
  }
});

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}
