/* Snowfall — ambient background.
   Two depth layers of soft cool-white flakes sharing one slow wind,
   so the motion reads as weather. Pre-rendered sprites on one fixed
   canvas, pauses when the tab is hidden, off under reduced motion. */
(function () {
    "use strict";

    var canvas = document.getElementById("snow");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var flakes = [];
    var rafId = null;
    var running = false;
    var last = 0;
    var t = 0; /* global clock driving the wind */

    function rand(a, b) { return a + Math.random() * (b - a); }

    /* Soft sprite with a slight cool tint so white stays legible on warm cream. */
    function makeSprite(core) {
        var s = document.createElement("canvas");
        s.width = 64; s.height = 64;
        var c = s.getContext("2d");
        var g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255," + core + ")");
        g.addColorStop(0.4, "rgba(238,244,252,0.55)");
        g.addColorStop(1, "rgba(238,244,252,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, 64, 64);
        return s;
    }

    var near = makeSprite(1);
    var far = makeSprite(0.8);

    function spawn(anywhere) {
        var deep = Math.random() < 0.45;
        return {
            x: rand(-20, W + 20),
            y: anywhere ? rand(-20, H) : rand(-30, -10),
            r: deep ? rand(1.0, 1.9) : rand(2.0, 3.4),
            vy: deep ? rand(12, 22) : rand(26, 46),   /* px per second */
            depth: deep ? rand(0.35, 0.55) : rand(0.75, 1),
            sway: rand(3, 9),
            swayT: rand(0, Math.PI * 2),
            swayW: rand(0.10, 0.25) * Math.PI * 2,
            alpha: deep ? rand(0.35, 0.55) : rand(0.6, 0.9),
            sprite: deep ? far : near
        };
    }

    /* One wind for every flake: two slow sines, never quite repeating. */
    function wind(time) {
        return Math.sin(time * (Math.PI * 2 / 23)) * 9 +
               Math.sin(time * (Math.PI * 2 / 57)) * 6;
    }

    function seed() {
        var n = Math.round(Math.min(80, Math.max(26, (W * H) / 16000)));
        flakes = [];
        for (var i = 0; i < n; i++) flakes.push(spawn(true));
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
        t += dt;
        var w = wind(t);
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < flakes.length; i++) {
            var m = flakes[i];
            m.y += m.vy * dt;
            m.x += w * m.depth * dt;
            m.swayT += m.swayW * dt;
            if (m.y > H + 14) { flakes[i] = m = spawn(false); }
            if (m.x < -30) { m.x = W + 28; }
            else if (m.x > W + 30) { m.x = -28; }
            var dx = m.x + Math.sin(m.swayT) * m.sway;
            var d = m.r * 6;
            ctx.globalAlpha = m.alpha;
            ctx.drawImage(m.sprite, dx - d / 2, m.y - d / 2, d, d);
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
