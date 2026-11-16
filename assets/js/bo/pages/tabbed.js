// Tabs that swap the page shown in the inner frame. ?type=<key> picks the first tab.
(function () {
    var frame = document.getElementById('contentFrame');
    var tabs = document.querySelectorAll('.tabbed-bar [data-key]');
    function go(key) {
        var btn = null;
        tabs.forEach(function (t) { var on = t.dataset.key === key; t.classList.toggle('active', on); if (on) btn = t; });
        if (!btn) { btn = tabs[0]; btn.classList.add('active'); }
        var src = btn.dataset.src;
        if (frame.getAttribute('src') !== src) { frame.setAttribute('src', src); }
    }
    document.querySelector('.tabbed-bar').addEventListener('click', function (e) {
        var b = e.target.closest('[data-key]'); if (b) go(b.dataset.key);
    });
    window.KCTabs = { go: go };
    go(new URLSearchParams(location.search).get('type') || tabs[0].dataset.key);
})();
