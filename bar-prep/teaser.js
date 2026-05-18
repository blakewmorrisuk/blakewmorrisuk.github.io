(function () {
    "use strict";

    const EXAM_DATE = new Date("2026-07-28T09:00:00-04:00");
    const QUOTES = [
        { body: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { body: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
        { body: "The best way out is always through.", author: "Robert Frost" },
        { body: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    ];

    const SUBJECT_COLORS = {
        "Civ Pro":      "#4d8cf2",
        "Torts":        "#f2804d",
        "Crim Law":     "#d94d59",
        "Crim Pro":     "#f27490",
        "Evidence":     "#8d66d8",
        "Con Law":      "#33b38c",
        "Contracts":    "#4dc2d8",
        "Real Property":"#8dc24d",
        "Adaptibar":    "#8d8d8d",
        "MPT":          "#7f80f2",
        "Practice":     "#f24d4d",
        "Review":       "#8d8d8d",
    };

    const SAMPLE_WEEK = [
        {
            day: "Mon", date: "May 18",
            tasks: [
                { id: 1, subject: "Civ Pro",   text: "Lecture 7: Personal jurisdiction (Pennoyer → World-Wide Volkswagen)", done: true },
                { id: 2, subject: "Civ Pro",   text: "Adaptibar 25Q: Civ Pro mixed set", done: true },
                { id: 3, subject: "Adaptibar", text: "Review missed questions from yesterday", done: false },
            ],
        },
        {
            day: "Tue", date: "May 19", isToday: true,
            tasks: [
                { id: 4, subject: "Torts",     text: "Lecture 8: Negligence II — proximate cause", done: false },
                { id: 5, subject: "Torts",     text: "PMBR multiple choice set, Q1–30", done: false },
                { id: 6, subject: "Adaptibar", text: "Mixed MBE 25Q set", done: false },
                { id: 7, subject: "Review",    text: "Flashcards: jurisdiction (15 cards)", done: false },
            ],
        },
        {
            day: "Wed", date: "May 20",
            tasks: [
                { id: 8, subject: "Contracts", text: "Lecture 9: UCC Article 2 — formation & terms", done: false },
                { id: 9, subject: "Contracts", text: "Practice essay: hybrid goods/services K", done: false },
            ],
        },
        {
            day: "Thu", date: "May 21",
            tasks: [
                { id: 10, subject: "Real Property", text: "Lecture 10: Estates & future interests", done: false },
                { id: 11, subject: "Real Property", text: "Adaptibar 25Q: RP mixed set", done: false },
            ],
        },
        {
            day: "Fri", date: "May 22",
            tasks: [
                { id: 12, subject: "Evidence", text: "Lecture 11: Hearsay & exceptions", done: false },
                { id: 13, subject: "Evidence", text: "PMBR multiple choice set, Q31–60", done: false },
            ],
        },
        {
            day: "Sat", date: "May 23",
            tasks: [
                { id: 14, subject: "MPT",      text: "Timed MPT practice (90 min)", done: false },
                { id: 15, subject: "Practice", text: "Adaptibar 100Q simulated exam", done: false },
            ],
        },
        {
            day: "Sun", date: "May 24",
            tasks: [
                { id: 16, subject: "Review",   text: "Subject of the week recap: Civ Pro flashcards", done: false },
            ],
        },
    ];

    const SAMPLE_CARDS = [
        {
            subject: "Civ Pro",
            front: "What is the test for personal jurisdiction?",
            back: "Minimum contacts with the forum state such that exercising jurisdiction does not offend traditional notions of fair play and substantial justice. International Shoe v. Washington (1945).",
        },
        {
            subject: "Torts",
            front: "Elements of negligence?",
            back: "Duty, breach, causation (factual + proximate), damages.",
        },
        {
            subject: "Contracts",
            front: "When does the UCC apply instead of common law?",
            back: "Contracts predominantly for the sale of goods (movable tangible things). Use the predominant purpose test for hybrid contracts.",
        },
        {
            subject: "Real Property",
            front: "Rule against perpetuities, in plain English.",
            back: "No interest is valid unless it must vest, if at all, within 21 years after the death of some life in being at the creation of the interest.",
        },
        {
            subject: "Evidence",
            front: "Hearsay definition (FRE 801(c))?",
            back: "An out-of-court statement offered to prove the truth of the matter asserted. Includes verbal, written, and assertive non-verbal conduct.",
        },
    ];

    const state = {
        screen: "splash",
        tab: "plan",
        cardIdx: 0,
        cardFlipped: false,
        tasks: cloneTasks(),
        quoteIdx: Math.floor(Math.random() * QUOTES.length),
    };

    function cloneTasks() {
        return SAMPLE_WEEK.map(day => ({
            ...day,
            tasks: day.tasks.map(t => ({ ...t })),
        }));
    }

    function daysToExam() {
        const now = new Date();
        const diffMs = EXAM_DATE.getTime() - now.getTime();
        return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    function currentTime() {
        const d = new Date();
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    function el(tag, attrs, children) {
        const node = document.createElement(tag);
        if (attrs) {
            for (const k in attrs) {
                if (k === "class") node.className = attrs[k];
                else if (k === "html") node.innerHTML = attrs[k];
                else if (k.startsWith("data-")) node.setAttribute(k, attrs[k]);
                else if (k === "style") node.setAttribute("style", attrs[k]);
                else node.setAttribute(k, attrs[k]);
            }
        }
        if (children) {
            const arr = Array.isArray(children) ? children : [children];
            arr.forEach(c => {
                if (c == null) return;
                if (typeof c === "string") node.appendChild(document.createTextNode(c));
                else node.appendChild(c);
            });
        }
        return node;
    }

    function render() {
        const content = document.querySelector(".phone-content");
        const tabBar  = document.querySelector(".tab-bar");
        const status  = document.querySelector(".phone-status-time");
        if (!content || !tabBar) return;

        content.innerHTML = "";
        if (status) status.textContent = currentTime();

        if (state.screen === "splash") {
            content.appendChild(renderSplash());
            tabBar.style.display = "none";
        } else {
            tabBar.style.display = "flex";
            if      (state.tab === "plan")  content.appendChild(renderPlan());
            else if (state.tab === "today") content.appendChild(renderToday());
            else if (state.tab === "cards") content.appendChild(renderCards());
            updateTabBar();
        }
    }

    function updateTabBar() {
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === state.tab);
        });
    }

    function renderSplash() {
        const days = String(daysToExam()).padStart(3, "0");
        const q = QUOTES[state.quoteIdx];

        return el("div", { class: "splash" }, [
            el("div", { class: "splash-top" }, [
                el("span", { class: "splash-dot" }),
                "UBE · Kentucky · 2026",
            ]),
            el("div", { class: "splash-rule" }),
            el("div", { class: "splash-hero" }, [
                el("div", { class: "splash-tminus" }, "T-Minus"),
                el("div", { class: "splash-digits" }, days),
                el("div", { class: "splash-rule-small" }),
                el("div", { class: "splash-caption" }, "Days until the"),
                el("div", { class: "splash-caption-big" }, "Uniform Bar Examination"),
            ]),
            el("div", { class: "splash-bottom" }, [
                el("div", { class: "splash-quote" }, [
                    "“" + q.body + "”",
                    el("div", { class: "splash-quote-author" }, "— " + q.author),
                ]),
                el("button", { class: "splash-enter", "data-action": "enter" }, [
                    "Enter",
                    el("span", { class: "splash-enter-arrow" }, " →"),
                ]),
            ]),
        ]);
    }

    function renderPlan() {
        const totalTasks = state.tasks.reduce((sum, d) => sum + d.tasks.length, 0);
        const doneTasks  = state.tasks.reduce((sum, d) => sum + d.tasks.filter(t => t.done).length, 0);

        const screen = el("div", null, [
            el("div", { class: "screen-header" }, [
                el("div", { class: "plan-nav" }, [
                    el("button", { class: "plan-nav-arrow", type: "button" }, "‹"),
                    el("div", { class: "plan-nav-week" }, [
                        el("div", { class: "plan-nav-week-label" }, "Week of May 18"),
                        el("div", { class: "plan-nav-week-meta" }, doneTasks + " / " + totalTasks + " this week"),
                    ]),
                    el("button", { class: "plan-nav-arrow", type: "button" }, "›"),
                ]),
            ]),
            el("div", { class: "screen-body" }, state.tasks.map(renderDayCard)),
        ]);
        return screen;
    }

    function renderDayCard(day) {
        const doneCount = day.tasks.filter(t => t.done).length;
        const card = el("div", {
            class: "day-card" + (day.isToday ? " is-today" : ""),
            "data-day": day.day,
        });
        const header = el("div", { class: "day-header" }, [
            el("div", { class: "day-spine" }),
            el("div", null, [
                el("div", null, [
                    el("span", { class: "day-name" }, day.day),
                    day.isToday ? el("span", { class: "day-today-tag" }, "TODAY") : null,
                ]),
                el("div", { class: "day-date" }, day.date),
            ]),
            el("div", { class: "day-count" }, doneCount + "/" + day.tasks.length),
        ]);
        card.appendChild(header);
        const tasks = el("div", { class: "day-tasks" });
        day.tasks.forEach(t => tasks.appendChild(renderTaskRow(t)));
        card.appendChild(tasks);
        return card;
    }

    function renderTaskRow(task) {
        const color = SUBJECT_COLORS[task.subject] || "#888";
        const row = el("div", {
            class: "task-row" + (task.done ? " done" : ""),
            "data-id": String(task.id),
            "data-action": "toggle-task",
            style: "--task-color: " + color + ";",
        }, [
            el("div", { class: "task-checkbox" }, [
                el("span", { class: "task-checkbox-check" }, "✓"),
            ]),
            el("div", { class: "task-body" }, [
                el("div", { class: "task-text" }, task.text),
                el("div", { class: "task-meta" }, [
                    el("span", { class: "task-dot" }),
                    task.subject,
                ]),
            ]),
        ]);
        return row;
    }

    function renderToday() {
        const todayData = state.tasks.find(d => d.isToday) || state.tasks[0];
        const tasks = todayData.tasks;
        const doneCount = tasks.filter(t => t.done).length;

        return el("div", null, [
            el("div", { class: "screen-header" }, [
                el("div", { class: "screen-header-title" }, "Today  ·  Tuesday, May 19"),
                el("div", { class: "screen-header-sub" }, doneCount + " of " + tasks.length + " tasks  ·  T-" + daysToExam() + " to bar"),
            ]),
            el("div", { class: "screen-body" }, [
                el("div", { class: "today-section-header" }, "Assigned"),
                el("div", { class: "today-card" }, tasks.map(renderTaskRow)),
            ]),
        ]);
    }

    function renderCards() {
        const card = SAMPLE_CARDS[state.cardIdx];
        const color = SUBJECT_COLORS[card.subject] || "#888";

        const flashCard = el("div", {
            class: "flash-card" + (state.cardFlipped ? " flipped" : ""),
            "data-action": "flip-card",
            style: "--card-color: " + color + ";",
        }, [
            el("div", { class: "flash-face flash-face-front" }, [
                el("div", { class: "flash-face-eyebrow" }, [
                    el("span", { class: "flash-face-eyebrow-dot" }),
                    card.subject,
                ]),
                el("div", { class: "flash-face-text" }, card.front),
                el("div", { class: "flash-face-label" }, "FRONT  ·  TAP TO FLIP"),
            ]),
            el("div", { class: "flash-face flash-face-back" }, [
                el("div", { class: "flash-face-eyebrow" }, [
                    el("span", { class: "flash-face-eyebrow-dot" }),
                    card.subject,
                ]),
                el("div", { class: "flash-face-text" }, card.back),
                el("div", { class: "flash-face-label" }, "BACK  ·  TAP TO FLIP"),
            ]),
        ]);

        return el("div", null, [
            el("div", { class: "cards-meta" }, [
                el("span", null, "Flash Cards"),
                el("span", { class: "cards-meta-count" }, (state.cardIdx + 1) + " / " + SAMPLE_CARDS.length),
            ]),
            el("div", { class: "card-stage" }, [flashCard]),
            el("div", { class: "cards-nav" }, [
                el("button", { class: "cards-nav-btn", "data-action": "prev-card", type: "button" }, "‹"),
                el("span", { class: "cards-nav-hint" }, "tap card to flip"),
                el("button", { class: "cards-nav-btn", "data-action": "next-card", type: "button" }, "›"),
            ]),
        ]);
    }

    function toggleTask(id) {
        state.tasks.forEach(day => {
            day.tasks.forEach(t => {
                if (t.id === id) t.done = !t.done;
            });
        });
    }

    function isTaskDone(id) {
        for (const day of state.tasks) {
            for (const t of day.tasks) {
                if (t.id === id) return t.done;
            }
        }
        return false;
    }

    function findDayContainingTask(id) {
        for (const day of state.tasks) {
            if (day.tasks.some(t => t.id === id)) return day;
        }
        return null;
    }

    // ---- Celebration: confetti + hype banner ------------------

    const HYPE_PHRASES = [
        "DAY DONE", "LOCK IN", "BOOM", "GO BLAKE GO", "CLEAN",
        "HANDLED", "MONEY", "DIALED", "NICE", "ANOTHER ONE",
        "SHIP IT", "EASY",
    ];
    const PARTICLE_COLORS = [
        "#e8a64a", "#fb8d4e", "#f25d6b", "#5fc8e8",
        "#8d66d8", "#33b38c", "#f2c94c", "#b8730f",
    ];
    const FX_GRAVITY = 0.32;

    let fxCanvas = null;
    let fxCtx = null;
    let hypeBanner = null;
    let hypeText = null;
    let particles = [];
    let hypeTimeout = null;

    function setupFx() {
        fxCanvas = document.querySelector(".fx-canvas");
        hypeBanner = document.querySelector(".hype-banner");
        hypeText = hypeBanner ? hypeBanner.querySelector(".hype-banner-text") : null;
        if (!fxCanvas) return;
        fxCtx = fxCanvas.getContext("2d");
        window.addEventListener("resize", resizeFx);
        // Defer first sizing to after the layout has settled — otherwise the
        // canvas can come up 0x0 on first paint and silently swallow particles.
        requestAnimationFrame(() => {
            resizeFx();
            requestAnimationFrame(tickFx);
        });
    }

    function resizeFx() {
        if (!fxCanvas || !fxCtx) return;
        const rect = fxCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        fxCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
        fxCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
        fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function burst(x, y, magnitude) {
        if (!fxCanvas) return;
        const count = magnitude === "day" ? 70 : 22;
        const baseSpeed = magnitude === "day" ? 8.5 : 5.5;
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
            const speed = 1.5 + Math.random() * baseSpeed;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.45,
                size: 3 + Math.random() * 4,
                color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
                shape: Math.random() < 0.5 ? "rect" : "circle",
                life: 0,
                maxLife: 50 + Math.random() * 30,
            });
        }
    }

    function tickFx() {
        if (fxCanvas && fxCtx) {
            const rect = fxCanvas.getBoundingClientRect();
            // Safety net: if the canvas buffer no longer matches the CSS size
            // (initial 0x0, orientation change, etc.), reconcile and keep going.
            const dpr = window.devicePixelRatio || 1;
            const targetW = Math.max(1, Math.floor(rect.width * dpr));
            if (rect.width > 0 && fxCanvas.width !== targetW) {
                resizeFx();
            }
            fxCtx.clearRect(0, 0, rect.width, rect.height);
            const next = [];
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += FX_GRAVITY;
                p.rot += p.vrot;
                p.life++;
                if (p.life < p.maxLife && p.y < rect.height + 40) {
                    next.push(p);
                }
            }
            particles = next;
            for (const p of particles) {
                const alpha = Math.max(0, 1 - p.life / p.maxLife);
                fxCtx.save();
                fxCtx.translate(p.x, p.y);
                fxCtx.rotate(p.rot);
                fxCtx.globalAlpha = alpha;
                fxCtx.fillStyle = p.color;
                if (p.shape === "rect") {
                    fxCtx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.6);
                } else {
                    fxCtx.beginPath();
                    fxCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    fxCtx.fill();
                }
                fxCtx.restore();
            }
        }
        requestAnimationFrame(tickFx);
    }

    function showHype() {
        if (!hypeBanner || !hypeText) return;
        const phrase = HYPE_PHRASES[Math.floor(Math.random() * HYPE_PHRASES.length)];
        hypeText.textContent = phrase;
        hypeBanner.classList.remove("show");
        // Restart transition
        void hypeBanner.offsetWidth;
        hypeBanner.classList.add("show");
        if (hypeTimeout) clearTimeout(hypeTimeout);
        hypeTimeout = setTimeout(() => {
            hypeBanner.classList.remove("show");
        }, 1500);
    }

    function rowBurstOrigin(rowEl) {
        if (!fxCanvas) return null;
        const r = rowEl.getBoundingClientRect();
        const f = fxCanvas.getBoundingClientRect();
        return {
            x: r.left - f.left + 22,
            y: r.top - f.top + r.height / 2,
        };
    }

    document.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.getAttribute("data-action");

        if (action === "enter") {
            state.screen = "app";
            render();
        } else if (action === "tab") {
            state.tab = actionEl.getAttribute("data-tab");
            render();
        } else if (action === "toggle-task") {
            const id = parseInt(actionEl.getAttribute("data-id"), 10);
            const wasDone = isTaskDone(id);
            toggleTask(id);
            if (!wasDone) {
                const origin = rowBurstOrigin(actionEl);
                if (origin) burst(origin.x, origin.y, "task");
                const completedDay = findDayContainingTask(id);
                if (completedDay && completedDay.tasks.length > 0 && completedDay.tasks.every(t => t.done)) {
                    showHype();
                    if (fxCanvas) {
                        const f = fxCanvas.getBoundingClientRect();
                        burst(f.width / 2, f.height * 0.62, "day");
                    }
                }
            }
            render();
        } else if (action === "flip-card") {
            state.cardFlipped = !state.cardFlipped;
            render();
        } else if (action === "prev-card") {
            state.cardIdx = (state.cardIdx - 1 + SAMPLE_CARDS.length) % SAMPLE_CARDS.length;
            state.cardFlipped = false;
            render();
        } else if (action === "next-card") {
            state.cardIdx = (state.cardIdx + 1) % SAMPLE_CARDS.length;
            state.cardFlipped = false;
            render();
        }
    });

    setInterval(() => {
        const t = document.querySelector(".phone-status-time");
        if (t) t.textContent = currentTime();
    }, 30000);

    function init() {
        setupFx();
        render();
    }
    document.addEventListener("DOMContentLoaded", init);
    if (document.readyState !== "loading") init();
})();
