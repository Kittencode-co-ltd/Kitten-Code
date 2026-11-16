(function () {
    var tabs = document.getElementById('hb-tabs'), search = document.getElementById('hb-search'), none = document.getElementById('hb-none');
    var role = 'staff';
    function apply() {
        var q = search.value.trim().toLowerCase(), shown = 0;
        document.querySelectorAll('[data-role-pane]').forEach(function (p) { p.hidden = p.dataset.rolePane !== role; });
        document.querySelectorAll('[data-role-pane="' + role + '"] .hb-item').forEach(function (d) {
            var hit = !q || d.textContent.toLowerCase().indexOf(q) !== -1;
            d.hidden = !hit; if (hit) { shown++; d.open = !!q; }
        });
        none.hidden = shown > 0;
    }
    tabs.addEventListener('click', function (e) {
        var b = e.target.closest('.tab'); if (!b) return;
        role = b.dataset.role;
        tabs.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t === b); });
        apply();
    });
    search.addEventListener('input', apply);
})();
