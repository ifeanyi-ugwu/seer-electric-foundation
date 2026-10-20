// Seer EF landing: theme toggle (default dark, choice remembered when storage is available).
(function () {
  var root = document.documentElement;
  var KEY = 'seer-theme';

  function current() { return root.dataset.theme === 'light' ? 'light' : 'dark'; }

  function sync() {
    var light = current() === 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(light));
      b.setAttribute('title', light ? 'Light theme on' : 'Light theme off');
    });
  }

  function set(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch (e) { /* storage unavailable: theme still applies for this visit */ }
    sync();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]');
    if (!b) return;
    var next = current() === 'light' ? 'dark' : 'light', go = function () { set(next); };
    if (window.Motion) Motion.theme(go, b); else go();
  });

  sync();
})();
