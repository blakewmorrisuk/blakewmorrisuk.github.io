(function () {
    "use strict";

    const canvas = document.getElementById("dino-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const W = canvas.width;
    const H = canvas.height;
    const GROUND_Y = H - 24;
    const GRAVITY = 0.55;
    const JUMP_V = -10.6;
    const START_SPEED = 6;
    const MAX_SPEED = 13;

    const INK = "#1a1612";
    const PAPER = "#faf6ec";
    const MUTED = "#8a8278";
    const AMBER = "#b8730f";

    const state = {
        phase: "idle",        // idle | running | dead
        dinoY: 0,             // 0 = on ground, negative = up
        dinoVy: 0,
        obstacles: [],        // { x, variant }
        clouds: [],           // { x, y }
        score: 0,
        hi: parseInt(localStorage.getItem("dino-hi-v1") || "0", 10),
        speed: START_SPEED,
        frame: 0,
        nextSpawn: 90,
        nextCloud: 40,
        flash: 0,             // brief flash on death
    };

    function reset() {
        state.dinoY = 0;
        state.dinoVy = 0;
        state.obstacles = [];
        state.clouds = [];
        state.score = 0;
        state.speed = START_SPEED;
        state.frame = 0;
        state.nextSpawn = 90;
        state.nextCloud = 40;
        state.flash = 0;
    }

    function jump() {
        if (state.phase === "idle") {
            state.phase = "running";
            return;
        }
        if (state.phase === "dead") {
            if (state.flash > 0) return;
            reset();
            state.phase = "running";
            return;
        }
        if (state.dinoY === 0) {
            state.dinoVy = JUMP_V;
        }
    }

    function update(dt) {
        if (state.phase === "running") {
            state.frame += dt;
            state.score = Math.floor(state.frame / 6);
            if (state.speed < MAX_SPEED) state.speed += 0.0025 * dt;

            // Dino physics
            state.dinoVy += GRAVITY * dt;
            state.dinoY += state.dinoVy * dt;
            if (state.dinoY > 0) {
                state.dinoY = 0;
                state.dinoVy = 0;
            }

            // Spawn obstacles
            state.nextSpawn -= dt;
            if (state.nextSpawn <= 0) {
                const variant = Math.floor(Math.random() * 4);
                state.obstacles.push({ x: W + 10, variant });
                state.nextSpawn = 55 + Math.random() * 75;
            }

            // Move obstacles
            for (const o of state.obstacles) o.x -= state.speed * dt;
            state.obstacles = state.obstacles.filter(o => o.x > -50);

            // Clouds
            state.nextCloud -= dt;
            if (state.nextCloud <= 0) {
                state.clouds.push({ x: W + 20, y: 20 + Math.random() * 40 });
                state.nextCloud = 80 + Math.random() * 120;
            }
            for (const c of state.clouds) c.x -= state.speed * 0.35 * dt;
            state.clouds = state.clouds.filter(c => c.x > -40);

            // Collision
            const db = dinoBox();
            for (const o of state.obstacles) {
                const cb = cactusBox(o);
                if (overlap(db, cb)) {
                    die();
                    break;
                }
            }
        } else if (state.phase === "dead" && state.flash > 0) {
            state.flash -= dt;
        }
    }

    function die() {
        state.phase = "dead";
        state.flash = 12;
        if (state.score > state.hi) {
            state.hi = state.score;
            localStorage.setItem("dino-hi-v1", String(state.hi));
        }
    }

    function dinoBox() {
        // Approximate bounding box of the dino, slightly inset for fair collision
        return {
            x: 30,
            y: GROUND_Y - 40 + state.dinoY + 4,
            w: 32,
            h: 36,
        };
    }

    function cactusBox(o) {
        const dims = cactusDims(o.variant);
        return {
            x: o.x + 1,
            y: GROUND_Y - dims.h,
            w: dims.w - 2,
            h: dims.h,
        };
    }

    function cactusDims(variant) {
        switch (variant) {
            case 0: return { w: 12, h: 24 };
            case 1: return { w: 14, h: 30 };
            case 2: return { w: 22, h: 24 };
            case 3: return { w: 28, h: 28 };
            default: return { w: 12, h: 24 };
        }
    }

    function overlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    // ---- Drawing ----------------------------------------------

    function draw() {
        ctx.fillStyle = PAPER;
        ctx.fillRect(0, 0, W, H);

        drawClouds();
        drawGround();
        drawObstacles();
        drawDino();
        drawHUD();
        drawOverlay();
    }

    function drawClouds() {
        ctx.fillStyle = "rgba(26, 22, 18, 0.18)";
        for (const c of state.clouds) {
            // Tiny pixel cloud: three blobs
            const x = Math.floor(c.x), y = Math.floor(c.y);
            ctx.fillRect(x + 4, y, 12, 3);
            ctx.fillRect(x, y + 3, 20, 3);
            ctx.fillRect(x + 4, y + 6, 14, 2);
        }
    }

    function drawGround() {
        ctx.fillStyle = INK;
        ctx.fillRect(0, GROUND_Y + 2, W, 1);
        // Speckle the ground a little to suggest motion
        ctx.fillStyle = "rgba(26, 22, 18, 0.55)";
        const offset = Math.floor(state.frame * state.speed) % 24;
        for (let x = -offset; x < W; x += 24) {
            ctx.fillRect(x + 3, GROUND_Y + 6, 2, 1);
            ctx.fillRect(x + 14, GROUND_Y + 9, 3, 1);
        }
    }

    function drawObstacles() {
        ctx.fillStyle = INK;
        for (const o of state.obstacles) drawCactus(o);
    }

    function drawCactus(o) {
        const x = Math.floor(o.x);
        const baseY = GROUND_Y;
        switch (o.variant) {
            case 0: // small single
                ctx.fillRect(x + 4, baseY - 24, 4, 24);
                ctx.fillRect(x,     baseY - 16, 4, 8);
                ctx.fillRect(x + 8, baseY - 18, 4, 10);
                ctx.fillRect(x,     baseY - 14, 12, 2);
                break;
            case 1: // tall single
                ctx.fillRect(x + 5, baseY - 30, 4, 30);
                ctx.fillRect(x,     baseY - 22, 4, 10);
                ctx.fillRect(x + 9, baseY - 24, 4, 12);
                ctx.fillRect(x,     baseY - 20, 13, 2);
                break;
            case 2: // double small
                ctx.fillRect(x + 3, baseY - 22, 4, 22);
                ctx.fillRect(x + 11, baseY - 20, 4, 20);
                ctx.fillRect(x,     baseY - 14, 4, 6);
                ctx.fillRect(x + 18, baseY - 12, 4, 5);
                break;
            case 3: // cluster
                ctx.fillRect(x + 2,  baseY - 24, 4, 24);
                ctx.fillRect(x + 10, baseY - 28, 4, 28);
                ctx.fillRect(x + 18, baseY - 22, 4, 22);
                ctx.fillRect(x,      baseY - 16, 4, 6);
                ctx.fillRect(x + 24, baseY - 14, 4, 6);
                break;
        }
    }

    function drawDino() {
        const x = 28;
        const y = GROUND_Y - 40 + Math.floor(state.dinoY);
        const dead = state.phase === "dead";
        const isJumping = state.dinoY < 0;
        const altLeg = Math.floor(state.frame / 5) % 2;

        ctx.fillStyle = INK;

        // Tail (left, tapering)
        ctx.fillRect(x - 6,  y + 22, 4, 6);
        ctx.fillRect(x - 2,  y + 18, 6, 12);

        // Body
        ctx.fillRect(x + 4,  y + 14, 22, 22);
        // back hump
        ctx.fillRect(x + 8,  y + 10, 14, 4);

        // Neck rising to head
        ctx.fillRect(x + 22, y + 4,  6, 14);
        // Head
        ctx.fillRect(x + 24, y,      16, 12);
        // Jaw shelf
        ctx.fillRect(x + 32, y + 10, 8, 3);

        // Eye socket (white) + pupil (dark)
        ctx.fillStyle = PAPER;
        ctx.fillRect(x + 34, y + 3, 3, 3);
        if (dead) {
            // X eye on death
            ctx.fillStyle = INK;
            ctx.fillRect(x + 34, y + 3, 1, 1);
            ctx.fillRect(x + 36, y + 3, 1, 1);
            ctx.fillRect(x + 35, y + 4, 1, 1);
            ctx.fillRect(x + 34, y + 5, 1, 1);
            ctx.fillRect(x + 36, y + 5, 1, 1);
        } else {
            ctx.fillStyle = INK;
            ctx.fillRect(x + 35, y + 4, 1, 1);
        }

        // Mouth notch
        ctx.fillStyle = PAPER;
        ctx.fillRect(x + 36, y + 9, 4, 1);

        ctx.fillStyle = INK;

        // Arms (tiny T-rex arms, classic)
        ctx.fillRect(x + 18, y + 18, 4, 2);
        ctx.fillRect(x + 20, y + 20, 2, 2);

        // Legs
        if (isJumping || dead) {
            ctx.fillRect(x + 8,  y + 36, 4, 4);
            ctx.fillRect(x + 18, y + 36, 4, 4);
            ctx.fillRect(x + 8,  y + 40, 6, 2);
            ctx.fillRect(x + 18, y + 40, 6, 2);
        } else if (state.phase === "idle") {
            ctx.fillRect(x + 8,  y + 36, 4, 6);
            ctx.fillRect(x + 18, y + 36, 4, 6);
            ctx.fillRect(x + 8,  y + 42, 6, 2);
            ctx.fillRect(x + 18, y + 42, 6, 2);
        } else if (altLeg === 0) {
            ctx.fillRect(x + 8,  y + 36, 4, 6);
            ctx.fillRect(x + 8,  y + 42, 6, 2);
            ctx.fillRect(x + 20, y + 36, 4, 3);
        } else {
            ctx.fillRect(x + 20, y + 36, 4, 6);
            ctx.fillRect(x + 18, y + 42, 6, 2);
            ctx.fillRect(x + 8,  y + 36, 4, 3);
        }
    }

    function drawHUD() {
        ctx.fillStyle = MUTED;
        ctx.font = "bold 14px ui-monospace, 'SF Mono', Menlo, monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        const scoreStr = String(state.score).padStart(5, "0");
        const hiStr = "HI " + String(state.hi).padStart(5, "0");
        ctx.fillText(hiStr + "   " + scoreStr, W - 14, 14);
    }

    function drawOverlay() {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (state.phase === "idle") {
            ctx.fillStyle = MUTED;
            ctx.font = "bold 11px ui-monospace, 'SF Mono', Menlo, monospace";
            ctx.fillText("CLICK OR PRESS SPACE TO PLAY", W / 2, 38);
        } else if (state.phase === "dead") {
            ctx.fillStyle = INK;
            ctx.font = "bold 18px ui-monospace, 'SF Mono', Menlo, monospace";
            ctx.fillText("G A M E   O V E R", W / 2, 44);
            ctx.fillStyle = AMBER;
            ctx.font = "bold 10px ui-monospace, 'SF Mono', Menlo, monospace";
            ctx.fillText("TAP OR PRESS SPACE TO TRY AGAIN", W / 2, 64);
        }
    }

    // ---- Loop -------------------------------------------------

    let lastTime = 0;
    function loop(now) {
        if (!lastTime) lastTime = now;
        const elapsed = now - lastTime;
        lastTime = now;
        // dt is in 60fps frames; clamp to avoid jumps on tab refocus
        const dt = Math.min(2.5, elapsed / 16.6667);
        update(dt);
        draw();
        requestAnimationFrame(loop);
    }

    // ---- Input ------------------------------------------------

    function isCanvasActive() {
        return document.activeElement === canvas;
    }

    canvas.addEventListener("mousedown", () => {
        canvas.focus({ preventScroll: true });
        jump();
    });

    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        canvas.focus({ preventScroll: true });
        jump();
    }, { passive: false });

    document.addEventListener("keydown", (e) => {
        if (!isCanvasActive()) return;
        if (e.key === " " || e.code === "Space" || e.key === "ArrowUp") {
            e.preventDefault();
            jump();
        }
    });

    // Pause via window blur — pause running game so unfocused tab doesn't drift
    window.addEventListener("blur", () => {
        if (state.phase === "running") {
            // softly pause by zeroing speed-impacting dt next frame via lastTime reset
            lastTime = 0;
        }
    });

    requestAnimationFrame(loop);
})();
