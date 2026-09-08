(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scroll progress bar
    var bar = document.createElement('div');
    bar.className = 'ent-progress';
    document.body.appendChild(bar);

    // Back to top
    var top = document.createElement('button');
    top.className = 'ent-top';
    top.setAttribute('aria-label', 'Retour en haut');
    top.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(top);
    top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    var header = document.querySelector('.ent-header');
    function onScroll() {
        var y = window.pageYOffset || document.documentElement.scrollTop;
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? (y / h * 100) : 0) + '%';
        if (header) header.classList.toggle('scrolled', y > 40);
        top.classList.toggle('show', y > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Animated counters
    var stats = document.querySelectorAll('.ent-stat .big');
    if (stats.length && 'IntersectionObserver' in window) {
        var co = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                co.unobserve(e.target);
                var el = e.target, m = el.textContent.trim().match(/^(\D*)(\d+)(.*)$/);
                if (!m) return;
                var pre = m[1], target = parseInt(m[2], 10), suf = m[3];
                if (reduce || target === 0) { el.textContent = pre + target + suf; return; }
                var start = null, dur = 1200;
                function step(ts) {
                    if (!start) start = ts;
                    var p = Math.min((ts - start) / dur, 1);
                    var val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
                    el.textContent = pre + val + suf;
                    if (p < 1) requestAnimationFrame(step); else el.textContent = pre + target + suf;
                }
                requestAnimationFrame(step);
            });
        }, { threshold: 0.4 });
        stats.forEach(function (s) { co.observe(s); });
    }

    // Sectors marquee
    var sectors = document.querySelector('.ent-sectors');
    if (sectors && !reduce) {
        var track = document.createElement('div');
        track.className = 'ent-marquee-track';
        track.innerHTML = sectors.innerHTML + sectors.innerHTML;
        sectors.innerHTML = '';
        sectors.appendChild(track);
        sectors.classList.add('is-marquee');
    }

    // Magnetic primary CTAs (prominent ones, fine pointer only)
    if (!reduce && window.matchMedia('(pointer:fine)').matches) {
        document.querySelectorAll('.ent-hero .btn-primary, .ent-actions .btn-primary, .ent-cta .btn-primary').forEach(function (b) {
            b.addEventListener('mousemove', function (e) {
                var r = b.getBoundingClientRect();
                var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
                b.style.transform = 'translate(' + (x * 0.15) + 'px,' + (y * 0.28) + 'px)';
            });
            b.addEventListener('mouseleave', function () { b.style.transform = ''; });
        });
    }

    // Margin simulator
    var range = document.getElementById('simRange');
    if (range) {
        var per = 171;
        function fmt(n) { return n.toLocaleString('fr-FR'); }
        function updSim() {
            var n = +range.value;
            document.getElementById('simClients').textContent = n;
            document.getElementById('simMargin').innerHTML = '+' + fmt(n * per) + '€<small> /mois</small>';
            document.getElementById('simYear').textContent = fmt(n * per * 12) + '€';
        }
        range.addEventListener('input', updSim);
        updSim();
    }
})();


/* price-toggle */
(function () {
  var toggles = document.querySelectorAll('.price-toggle');
  Array.prototype.forEach.call(toggles, function (tg) {
    var card = tg.parentNode;
    var price = card.querySelector('.ent-price');
    var big = price ? price.querySelector('b') : null;
    var hint = card.querySelector('.pt-hint');
    if (!price || !big) return;
    Array.prototype.forEach.call(tg.querySelectorAll('.pt-btn'), function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(tg.querySelectorAll('.pt-btn'), function (b) {
          b.classList.remove('active'); b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
        var year = btn.getAttribute('data-plan') === 'year';
        var val = year ? price.getAttribute('data-year') : price.getAttribute('data-month');
        if (val) big.textContent = val;
        if (hint) hint.hidden = !year;
      });
    });
  });
})();
