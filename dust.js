/* Dust in lamplight — ambient background motes.
   Cheap by design: 14–26 pre-rendered sprites on one fixed canvas,
   pauses when the tab is hidden, disabled under prefers-reduced-motion. */
(function () {
    "use strict";

    var canvas = document.getElementById("dust");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var motes = [];
    var rafId = null;
    var running = false;
    var last = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    /* One soft radial sprite per tint, rendered once. */
    function makeSprite(r, g, b) {
        var s = document.createElement("canvas");
        s.width = 64; s.height = 64;
        var c = s.getContext("2d");
        var grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",1)");
        grad.addColorStop(0.45, "rgba(" + r + "," + g + "," + b + ",0.32)");
        grad.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
        c.fillStyle = grad;
        c.fillRect(0, 0, 64, 64);
        return s;
    }

    var sepia = makeSprite(74, 56, 38);   /* warm ink dust */
    var amber = makeSprite(184, 115, 15); /* the few that catch the lamp */

    function spawn(anywhere) {
        var glint = Math.random() < 0.22;
        return {
            baseX: rand(-20, W + 20),
            y: anywhere ? rand(0, H) : H + 12,
            r: rand(0.8, 2.1),
            vy: -rand(3, 9),                       /* px per second, upward */
            drift: rand(-2.5, 2.5),
            sway: rand(4, 14),
            swayT: rand(0, Math.PI * 2),
            swayW: rand(0.05, 0.13) * Math.PI * 2,
            alpha: glint ? rand(0.10, 0.20) : rand(0.05, 0.12),
            twT: rand(0, Math.PI * 2),
            twW: rand(0.05, 0.15) * Math.PI * 2,
            sprite: glint ? amber : sepia
        };
    }

    function seed() {
        var n = Math.max(14, Math.min(26, Math.round((W * H) / 60000)));
        motes = [];
        for (var i = 0; i < n; i++) motes.push(spawn(true));
    }

    function size(reseed) {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (reseed) seed();
    }

    function frame(now) {
        rafId = requestAnimationFrame(frame);
        var dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < motes.length; i++) {
            var m = motes[i];
            m.y += m.vy * dt;
            m.baseX += m.drift * dt;
            m.swayT += m.swayW * dt;
            m.twT += m.twW * dt;
            if (m.y < -12) { motes[i] = m = spawn(false); }
            if (m.baseX < -30) { m.baseX = W + 28; }
            else if (m.baseX > W + 30) { m.baseX = -28; }
            var x = m.baseX + Math.sin(m.swayT) * m.sway;
            var a = m.alpha * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(m.twT)));
            var d = m.r * 7;
            ctx.globalAlpha = a;
            ctx.drawImage(m.sprite, x - d / 2, m.y - d / 2, d, d);
        }
        ctx.globalAlpha = 1;
    }

    function start() {
        if (running || reduce.matches || document.hidden) return;
        running = true;
        last = performance.now();
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
    }

    var lastW = window.innerWidth;
    window.addEventListener("resize", function () {
        var heightJump = Math.abs(window.innerHeight - H);
        var widthChanged = window.innerWidth !== lastW;
        lastW = window.innerWidth;
        /* Ignore mobile URL-bar height churn; reseed on real changes. */
        size(widthChanged || heightJump > 160);
    });

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) { stop(); } else { start(); }
    });

    function onReduceChange(e) {
        if (e.matches) { stop(); ctx.clearRect(0, 0, W, H); }
        else { size(true); start(); }
    }
    if (reduce.addEventListener) { reduce.addEventListener("change", onReduceChange); }
    else if (reduce.addListener) { reduce.addListener(onReduceChange); }

    size(true);
    start();
})();
