/* Shared settings + score storage for every page.
   Loaded in <head> so the theme is applied before the page paints.
   Everything is wrapped in try/catch: school browsers often block or wipe storage. */
(function () {
  var KEY = 'fg-settings';
  var defaults = { theme: 'auto', scale: '1', reduceMotion: false };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage blocked: settings just won't persist */ }
  }

  var settings = Object.assign({}, defaults, read(KEY, {}));
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function apply() {
    var root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.style.setProperty('--scale', settings.scale);
    var reduce = settings.reduceMotion || (motionQuery && motionQuery.matches);
    root.classList.toggle('reduce-motion', !!reduce);
    paletteCache = null;
  }

  var paletteCache = null;

  window.FG = {
    settings: settings,

    set: function (name, value) {
      settings[name] = value;
      write(KEY, settings);
      apply();
    },

    load: read,
    save: write,

    getBest: function (id) {
      var v = read('fg-best-' + id, null);
      return typeof v === 'number' ? v : null;
    },

    /* Returns true when value is a new record. */
    saveBest: function (id, value, lowerIsBetter) {
      var best = this.getBest(id);
      var better = best === null || (lowerIsBetter ? value < best : value > best);
      if (better) write('fg-best-' + id, value);
      return better;
    },

    reducedMotion: function () {
      return document.documentElement.classList.contains('reduce-motion');
    },

    /* Theme colours for <canvas> games, read from the CSS custom properties. */
    palette: function () {
      if (paletteCache) return paletteCache;
      var cs = getComputedStyle(document.documentElement);
      var names = ['bg', 'fg', 'panel', 'muted', 'border', 'accent', 'board', 'good', 'bad', 'warn'];
      paletteCache = {};
      names.forEach(function (n) {
        paletteCache[n] = cs.getPropertyValue('--' + n).trim();
      });
      return paletteCache;
    },

    /* Call fn whenever the student switches tabs or windows, so games pause themselves. */
    onLeave: function (fn) {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) fn();
      });
      window.addEventListener('blur', fn);
    }
  };

  if (window.matchMedia) {
    var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () { apply(); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onChange);
    if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener('change', onChange);
  }

  apply();
})();
