/**
 * ============================================================================
 * AI THREAT DETECTION — ENTERPRISE SOC DASHBOARD ENGINE v6.0
 * File: static/js/dashboard.js
 * Designed for: templates/dashboard.html (advanced SOC version)
 * ============================================================================
 */

(() => {
    "use strict";

    console.info("[SOC Dashboard] dashboard.js loaded.");

    const onReady = (callback) => {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    };

    onReady(() => {
        const dashboard = document.getElementById("socDashboard");

        if (!dashboard) {
            return;
        }

        if (dashboard.dataset.dashboardReady === "true") {
            return;
        }

        dashboard.dataset.dashboardReady = "true";

        const $ = (selector, root = document) => root.querySelector(selector);
        const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

        const clamp = (value, minimum, maximum) =>
            Math.min(Math.max(Number(value) || 0, minimum), maximum);

        const parseNumber = (value, fallback = 0) => {
            const number = Number.parseFloat(String(value ?? "").replace(/[^\d.-]/g, ""));
            return Number.isFinite(number) ? number : fallback;
        };

        const safeStorage = {
            get(key, fallback = null) {
                try {
                    const value = window.localStorage.getItem(key);
                    return value === null ? fallback : value;
                } catch {
                    return fallback;
                }
            },

            set(key, value) {
                try {
                    window.localStorage.setItem(key, String(value));
                } catch {
                    // Storage may be unavailable in private browsing.
                }
            }
        };

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const elements = {
            dashboard,
            localClock: $("#dashboardLocalClock"),
            localDate: $("#dashboardLocalDate"),
            soundToggle: $("#dashboardSoundToggle"),
            densityToggle: $("#dashboardDensityToggle"),
            notificationButton: $("#openNotificationCenter"),
            notificationCount: $("#dashboardNotificationCount"),
            notificationCenter: $("#securityNotificationCenter"),
            closeNotificationCenter: $("#closeNotificationCenter"),
            markNotificationsRead: $("#markNotificationsRead"),
            drawerBackdrop: $("#dashboardDrawerBackdrop"),

            commandButton: $("#openCommandPalette"),
            commandPalette: $("#dashboardCommandPalette"),
            commandInput: $("#commandPaletteInput"),
            closeCommandPalette: $("#closeCommandPalette"),

            assessmentModal: $("#aiAssessmentModal"),
            openAssessmentPanel: $("#openAssessmentPanel"),
            openQuickAssessment: $("#openQuickAssessment"),
            closeAssessmentModal: $("#closeAssessmentModal"),

            scanDetailsDrawer: $("#scanDetailsDrawer"),
            closeScanDetails: $("#closeScanDetails"),
            closeScanDetailsSecondary: $("#closeScanDetailsSecondary"),
            scanDetailFilename: $("#scanDetailFilename"),
            scanDetailPrediction: $("#scanDetailPrediction"),
            scanDetailRisk: $("#scanDetailRisk"),
            scanDetailTime: $("#scanDetailTime"),
            scanDetailAssessment: $("#scanDetailAssessment"),

            expandedChartModal: $("#expandedChartModal"),
            expandedChartTitle: $("#expandedChartTitle"),
            expandedChartContent: $("#expandedChartContent"),
            closeExpandedChart: $("#closeExpandedChart"),

            scanTableSearch: $("#scanTableSearch"),
            recentScanTableBody: $("#recentScanTableBody"),
            visibleScanCount: $("#visibleScanCount"),

            refreshDashboardData: $("#refreshDashboardData"),
            commandRefreshDashboard: $("#commandRefreshDashboard"),
            exportDashboardReport: $("#exportDashboardReport"),

            toastRegion: $("#dashboardToastRegion"),
            accessibilityStatus: $("#dashboardAccessibilityStatus"),

            securityScoreGauge: $("#securityScoreGauge"),
            dashboardThreatMap: $("#dashboardThreatMap"),
            threatMapTooltip: $("#threatMapTooltip"),
            threatMapCanvas: $("#threatMapCanvas"),

            hologramStage: $("#hologramStage"),
            holoShield: $("#holoShield"),
            cursorLight: $("#dashboardCursorLight"),

            heroParticles: $("#heroParticles"),
            meshCanvas: $("#dashboardMeshCanvas"),
            trafficCanvas: $("#dashboardTrafficCanvas"),

            bootSequence: $("#dashboardBootSequence"),
            bootBar: $("#dashboardBootBar"),
            bootPercentage: $("#dashboardBootPercentage"),

            engineLatency: $("#engineLatencyValue"),
            sessionId: $("#dashboardSessionId"),
            copyrightYear: $("#dashboardCopyrightYear"),
            resourceUpdatedTime: $("#resourceUpdatedTime")
        };

        const state = {
            soundEnabled: safeStorage.get("socDashboardSound", "false") === "true",
            compact: safeStorage.get("socDashboardCompact", "false") === "true",
            audioContext: null,
            masterGain: null,
            activeModal: null,
            activeDrawer: null,
            lastFocusedElement: null,
            selectedCommandIndex: 0,
            scanFilter: "all",
            analyticsRange: "7d",
            animationFrames: new Set(),
            expandedPlot: null,
            moduleErrors: []
        };

        const dashboardData = {
            totalScans: parseNumber(dashboard.dataset.totalScans),
            safeScans: parseNumber(dashboard.dataset.safeScans),
            maliciousScans: parseNumber(dashboard.dataset.maliciousScans),
            criticalScans: parseNumber(dashboard.dataset.criticalScans),
            securityScore: clamp(parseNumber(dashboard.dataset.securityScore), 0, 100),
            threatRate: clamp(parseNumber(dashboard.dataset.threatRate), 0, 100),
            currentUser: dashboard.dataset.currentUser || "Security Analyst"
        };


        /* ==================================================================
           ACCESSIBILITY AND TOASTS
        ================================================================== */

        const announce = (message) => {
            if (!elements.accessibilityStatus) {
                return;
            }

            elements.accessibilityStatus.textContent = "";

            window.setTimeout(() => {
                elements.accessibilityStatus.textContent = message;
            }, 40);
        };

        const toastIcons = {
            info: "fa-circle-info",
            success: "fa-circle-check",
            warning: "fa-triangle-exclamation",
            error: "fa-circle-xmark"
        };

        const showToast = (
            title,
            message,
            type = "info",
            duration = 3500
        ) => {
            if (!elements.toastRegion) {
                return;
            }

            const toast = document.createElement("article");
            toast.className = `soc-toast soc-toast--${type}`;
            toast.setAttribute("role", type === "error" ? "alert" : "status");

            const icon = document.createElement("span");
            icon.className = "soc-toast__icon";
            icon.innerHTML = `<i class="fa-solid ${toastIcons[type] || toastIcons.info}"></i>`;

            const content = document.createElement("div");
            content.className = "soc-toast__content";

            const heading = document.createElement("strong");
            heading.textContent = title;

            const description = document.createElement("span");
            description.textContent = message;

            content.append(heading, description);

            const close = document.createElement("button");
            close.className = "soc-toast__close";
            close.type = "button";
            close.setAttribute("aria-label", "Dismiss notification");
            close.innerHTML = '<i class="fa-solid fa-xmark"></i>';

            const removeToast = () => {
                toast.classList.add("is-leaving");
                window.setTimeout(() => toast.remove(), 260);
            };

            close.addEventListener("click", removeToast);
            toast.append(icon, content, close);
            elements.toastRegion.appendChild(toast);

            window.setTimeout(removeToast, duration);
        };


        /* ==================================================================
           AUDIO ENGINE
        ================================================================== */

        const getAudioContext = () => {
            if (state.audioContext) {
                return state.audioContext;
            }

            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) {
                return null;
            }

            state.audioContext = new AudioContextClass();
            state.masterGain = state.audioContext.createGain();
            state.masterGain.gain.value = 0.16;
            state.masterGain.connect(state.audioContext.destination);

            return state.audioContext;
        };

        const unlockAudio = async () => {
            const context = getAudioContext();

            if (context && context.state === "suspended") {
                try {
                    await context.resume();
                } catch {
                    // Browser refused audio activation.
                }
            }
        };

        const playTone = ({
            frequency = 520,
            duration = 0.08,
            volume = 0.13,
            type = "sine",
            delay = 0
        } = {}) => {
            if (!state.soundEnabled) {
                return;
            }

            const context = getAudioContext();

            if (!context || !state.masterGain) {
                return;
            }

            const start = context.currentTime + delay;
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, start);

            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(
                Math.max(volume, 0.0002),
                start + 0.012
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                start + duration
            );

            oscillator.connect(gain);
            gain.connect(state.masterGain);

            oscillator.start(start);
            oscillator.stop(start + duration + 0.025);
        };

        const playSound = (name) => {
            const patterns = {
                click: [
                    { frequency: 560, duration: 0.055, volume: 0.1 }
                ],
                open: [
                    { frequency: 430, duration: 0.07, volume: 0.09 },
                    { frequency: 660, duration: 0.09, volume: 0.08, delay: 0.055 }
                ],
                close: [
                    { frequency: 620, duration: 0.06, volume: 0.08 },
                    { frequency: 390, duration: 0.08, volume: 0.07, delay: 0.045 }
                ],
                success: [
                    { frequency: 520, duration: 0.08, volume: 0.09 },
                    { frequency: 720, duration: 0.1, volume: 0.09, delay: 0.07 },
                    { frequency: 920, duration: 0.12, volume: 0.08, delay: 0.14 }
                ],
                warning: [
                    { frequency: 360, duration: 0.1, volume: 0.1, type: "triangle" },
                    { frequency: 310, duration: 0.12, volume: 0.08, delay: 0.09, type: "triangle" }
                ],
                toggle: [
                    { frequency: 500, duration: 0.055, volume: 0.08 },
                    { frequency: 780, duration: 0.07, volume: 0.07, delay: 0.05 }
                ]
            };

            (patterns[name] || patterns.click).forEach(playTone);
        };

        const updateSoundButton = () => {
            if (!elements.soundToggle) {
                return;
            }

            const icon = $("i", elements.soundToggle);

            elements.soundToggle.setAttribute(
                "aria-pressed",
                String(state.soundEnabled)
            );

            elements.soundToggle.setAttribute(
                "aria-label",
                state.soundEnabled
                    ? "Disable dashboard interface sounds"
                    : "Enable dashboard interface sounds"
            );

            elements.soundToggle.classList.toggle(
                "is-active",
                state.soundEnabled
            );

            if (icon) {
                icon.className = state.soundEnabled
                    ? "fa-solid fa-volume-high"
                    : "fa-solid fa-volume-xmark";
            }
        };

        const setupSoundControl = () => {
            updateSoundButton();

            elements.soundToggle?.addEventListener("click", async () => {
                await unlockAudio();

                if (state.soundEnabled) {
                    playSound("close");
                    state.soundEnabled = false;
                } else {
                    state.soundEnabled = true;
                    playSound("success");
                }

                safeStorage.set("socDashboardSound", state.soundEnabled);
                updateSoundButton();

                showToast(
                    "Interface sound",
                    state.soundEnabled
                        ? "Dashboard interaction sounds are enabled."
                        : "Dashboard interaction sounds are disabled.",
                    "success"
                );
            });

            document.addEventListener(
                "pointerdown",
                unlockAudio,
                { once: true, passive: true }
            );
        };


        /* ==================================================================
           LIVE CLOCK AND TELEMETRY
        ================================================================== */

        const updateClock = () => {
            const now = new Date();

            if (elements.localClock) {
                elements.localClock.textContent = new Intl.DateTimeFormat(
                    undefined,
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                    }
                ).format(now);
            }

            if (elements.localDate) {
                elements.localDate.textContent = new Intl.DateTimeFormat(
                    undefined,
                    {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                ).format(now);
            }
        };

        const setupTelemetry = () => {
            updateClock();
            window.setInterval(updateClock, 1000);

            if (elements.sessionId) {
                const seed = `${Date.now()}-${Math.random()}`;
                const session = btoa(seed)
                    .replace(/[^A-Z0-9]/gi, "")
                    .slice(0, 12)
                    .toUpperCase();

                elements.sessionId.textContent = session || "SOC-SESSION";
            }

            if (elements.copyrightYear) {
                elements.copyrightYear.textContent =
                    String(new Date().getFullYear());
            }

            const updateLatency = () => {
                if (!elements.engineLatency) {
                    return;
                }

                const latency = Math.floor(8 + Math.random() * 13);
                elements.engineLatency.textContent = `${latency} ms`;
            };

            updateLatency();
            window.setInterval(updateLatency, 4200);
        };


        /* ==================================================================
           DENSITY CONTROL
        ================================================================== */

        const resizePlotlyCharts = () => {
            if (!window.Plotly) {
                return;
            }

            $$(".js-plotly-plot").forEach((chart) => {
                try {
                    window.Plotly.Plots.resize(chart);
                } catch {
                    // A chart may still be loading.
                }
            });
        };

        const updateDensityControl = () => {
            dashboard.classList.toggle("is-compact", state.compact);

            if (!elements.densityToggle) {
                return;
            }

            const icon = $("i", elements.densityToggle);

            elements.densityToggle.setAttribute(
                "aria-pressed",
                String(state.compact)
            );

            elements.densityToggle.setAttribute(
                "aria-label",
                state.compact
                    ? "Use comfortable dashboard layout"
                    : "Use compact dashboard layout"
            );

            elements.densityToggle.classList.toggle(
                "is-active",
                state.compact
            );

            if (icon) {
                icon.className = state.compact
                    ? "fa-solid fa-table-cells"
                    : "fa-solid fa-table-cells-large";
            }
        };

        const setupDensityControl = () => {
            updateDensityControl();

            elements.densityToggle?.addEventListener("click", () => {
                state.compact = !state.compact;
                safeStorage.set("socDashboardCompact", state.compact);

                updateDensityControl();
                playSound("toggle");

                window.setTimeout(resizePlotlyCharts, 320);

                showToast(
                    "Dashboard density",
                    state.compact
                        ? "Compact information layout activated."
                        : "Comfortable information layout restored.",
                    "info"
                );
            });
        };


        /* ==================================================================
           MODAL AND DRAWER SYSTEM
        ================================================================== */

        const getFocusableElements = (container) => {
            if (!container) {
                return [];
            }

            return $$(
                [
                    'a[href]',
                    'button:not([disabled])',
                    'input:not([disabled])',
                    'select:not([disabled])',
                    'textarea:not([disabled])',
                    '[tabindex]:not([tabindex="-1"])'
                ].join(","),
                container
            ).filter((element) => !element.hidden);
        };

        const updateBodyOverlayState = () => {
            const overlayOpen = Boolean(
                state.activeModal || state.activeDrawer
            );

            document.body.classList.toggle("soc-overlay-open", overlayOpen);
        };

        const focusFirstElement = (container) => {
            window.setTimeout(() => {
                const focusable = getFocusableElements(container);
                focusable[0]?.focus();
            }, 70);
        };

        const openModal = (modal, preferredFocus = null) => {
            if (!modal) {
                return;
            }

            if (state.activeModal && state.activeModal !== modal) {
                closeModal(state.activeModal, false);
            }

            state.lastFocusedElement = document.activeElement;
            state.activeModal = modal;

            modal.setAttribute("aria-hidden", "false");
            modal.classList.add("is-open");
            updateBodyOverlayState();

            playSound("open");

            if (preferredFocus) {
                window.setTimeout(() => preferredFocus.focus(), 70);
            } else {
                focusFirstElement(modal);
            }
        };

        const closeModal = (modal, restoreFocus = true) => {
            if (!modal) {
                return;
            }

            modal.setAttribute("aria-hidden", "true");
            modal.classList.remove("is-open");

            if (state.activeModal === modal) {
                state.activeModal = null;
            }

            updateBodyOverlayState();
            playSound("close");

            if (restoreFocus) {
                state.lastFocusedElement?.focus?.();
            }
        };

        const openDrawer = (drawer, opener = null) => {
            if (!drawer) {
                return;
            }

            if (state.activeDrawer && state.activeDrawer !== drawer) {
                closeDrawer(state.activeDrawer, false);
            }

            state.lastFocusedElement = opener || document.activeElement;
            state.activeDrawer = drawer;

            drawer.setAttribute("aria-hidden", "false");
            drawer.classList.add("is-open");

            if (elements.drawerBackdrop) {
                elements.drawerBackdrop.setAttribute("aria-hidden", "false");
                elements.drawerBackdrop.classList.add("is-visible");
            }

            updateBodyOverlayState();
            focusFirstElement(drawer);
            playSound("open");
        };

        const closeDrawer = (drawer, restoreFocus = true) => {
            if (!drawer) {
                return;
            }

            drawer.setAttribute("aria-hidden", "true");
            drawer.classList.remove("is-open");

            if (state.activeDrawer === drawer) {
                state.activeDrawer = null;
            }

            if (elements.drawerBackdrop) {
                elements.drawerBackdrop.setAttribute("aria-hidden", "true");
                elements.drawerBackdrop.classList.remove("is-visible");
            }

            updateBodyOverlayState();
            playSound("close");

            if (restoreFocus) {
                state.lastFocusedElement?.focus?.();
            }
        };

        const trapFocus = (event) => {
            if (event.key !== "Tab") {
                return;
            }

            const container = state.activeModal || state.activeDrawer;

            if (!container) {
                return;
            }

            const focusable = getFocusableElements(container);

            if (!focusable.length) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            }
        };


        /* ==================================================================
           NOTIFICATION CENTER
        ================================================================== */

        const setupNotificationCenter = () => {
            elements.notificationButton?.addEventListener("click", () => {
                const isOpen =
                    elements.notificationCenter?.getAttribute("aria-hidden") ===
                    "false";

                if (isOpen) {
                    closeDrawer(elements.notificationCenter);
                    elements.notificationButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                } else {
                    openDrawer(
                        elements.notificationCenter,
                        elements.notificationButton
                    );
                    elements.notificationButton.setAttribute(
                        "aria-expanded",
                        "true"
                    );
                }
            });

            elements.closeNotificationCenter?.addEventListener(
                "click",
                () => {
                    closeDrawer(elements.notificationCenter);
                    elements.notificationButton?.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            );

            elements.drawerBackdrop?.addEventListener("click", () => {
                if (state.activeDrawer) {
                    closeDrawer(state.activeDrawer);
                }

                elements.notificationButton?.setAttribute(
                    "aria-expanded",
                    "false"
                );
            });

            elements.markNotificationsRead?.addEventListener(
                "click",
                () => {
                    if (elements.notificationCount) {
                        elements.notificationCount.textContent = "0";
                        elements.notificationCount.hidden = true;
                    }

                    $$(".soc-notification", elements.notificationCenter).forEach(
                        (notification) => {
                            notification.classList.add("is-reviewed");
                        }
                    );

                    playSound("success");

                    showToast(
                        "Notifications reviewed",
                        "All dashboard security notifications were marked as reviewed.",
                        "success"
                    );

                    announce("All security notifications marked as reviewed.");
                }
            );
        };


        /* ==================================================================
           COMMAND PALETTE
        ================================================================== */

        const commandItems = $$(
            ".soc-command-item",
            elements.commandPalette || document
        );

        const visibleCommandItems = () =>
            commandItems.filter(
                (item) =>
                    !item.hidden &&
                    item.style.display !== "none"
            );

        const selectCommandItem = (index) => {
            const visible = visibleCommandItems();

            commandItems.forEach((item) =>
                item.classList.remove("is-selected")
            );

            if (!visible.length) {
                state.selectedCommandIndex = 0;
                return;
            }

            state.selectedCommandIndex =
                (index + visible.length) % visible.length;

            const selected = visible[state.selectedCommandIndex];
            selected.classList.add("is-selected");
            selected.scrollIntoView({ block: "nearest" });
        };

        const filterCommands = () => {
            const query =
                elements.commandInput?.value.trim().toLowerCase() || "";

            commandItems.forEach((item) => {
                const searchable = (
                    item.dataset.commandSearch ||
                    item.textContent ||
                    ""
                ).toLowerCase();

                item.hidden = Boolean(query) && !searchable.includes(query);
            });

            selectCommandItem(0);
        };

        const openCommandPalette = () => {
            openModal(
                elements.commandPalette,
                elements.commandInput
            );

            if (elements.commandInput) {
                elements.commandInput.value = "";
            }

            filterCommands();
        };

        const closeCommandPalette = () => {
            closeModal(elements.commandPalette);
        };

        const executeCommandItem = (item) => {
            if (!item) {
                return;
            }

            const scrollTarget = item.dataset.commandScroll;

            if (scrollTarget) {
                closeCommandPalette();

                window.setTimeout(() => {
                    document
                        .getElementById(scrollTarget)
                        ?.scrollIntoView({
                            behavior: reducedMotion ? "auto" : "smooth",
                            block: "start"
                        });
                }, 160);

                return;
            }

            if (item.id === "commandRefreshDashboard") {
                closeCommandPalette();
                refreshDashboard();
                return;
            }

            if (item.tagName === "A" && item.href) {
                window.location.href = item.href;
                return;
            }

            item.click();
        };

        const setupCommandPalette = () => {
            elements.commandButton?.addEventListener(
                "click",
                openCommandPalette
            );

            elements.closeCommandPalette?.addEventListener(
                "click",
                closeCommandPalette
            );

            $$("[data-close-command-palette]").forEach((backdrop) => {
                backdrop.addEventListener("click", closeCommandPalette);
            });

            elements.commandInput?.addEventListener(
                "input",
                filterCommands
            );

            elements.commandInput?.addEventListener(
                "keydown",
                (event) => {
                    if (event.key === "ArrowDown") {
                        event.preventDefault();
                        selectCommandItem(
                            state.selectedCommandIndex + 1
                        );
                    }

                    if (event.key === "ArrowUp") {
                        event.preventDefault();
                        selectCommandItem(
                            state.selectedCommandIndex - 1
                        );
                    }

                    if (event.key === "Enter") {
                        event.preventDefault();

                        const selected =
                            visibleCommandItems()[
                                state.selectedCommandIndex
                            ];

                        executeCommandItem(selected);
                    }
                }
            );

            commandItems.forEach((item) => {
                item.addEventListener("mouseenter", () => {
                    const visible = visibleCommandItems();
                    selectCommandItem(visible.indexOf(item));
                });

                if (item.dataset.commandScroll) {
                    item.addEventListener("click", () => {
                        executeCommandItem(item);
                    });
                }
            });
        };


        /* ==================================================================
           ASSESSMENT MODAL
        ================================================================== */

        const openAssessment = () => {
            openModal(elements.assessmentModal);
        };

        const setupAssessmentModal = () => {
            elements.openAssessmentPanel?.addEventListener(
                "click",
                openAssessment
            );

            elements.openQuickAssessment?.addEventListener(
                "click",
                openAssessment
            );

            elements.closeAssessmentModal?.addEventListener(
                "click",
                () => closeModal(elements.assessmentModal)
            );

            $$("[data-close-assessment]").forEach((backdrop) => {
                backdrop.addEventListener(
                    "click",
                    () => closeModal(elements.assessmentModal)
                );
            });
        };


        /* ==================================================================
           RECENT SCAN TABLE SEARCH AND FILTERS
        ================================================================== */

        const updateVisibleScanRows = () => {
            const rows = $$(
                "[data-scan-row]",
                elements.recentScanTableBody || document
            );

            const searchQuery =
                elements.scanTableSearch?.value
                    .trim()
                    .toLowerCase() || "";

            let visibleCount = 0;

            rows.forEach((row) => {
                const prediction =
                    (row.dataset.prediction || "").toLowerCase();

                const searchable =
                    (
                        row.dataset.searchText ||
                        row.textContent ||
                        ""
                    ).toLowerCase();

                const isSafe =
                    prediction.includes("safe") ||
                    prediction.includes("benign");

                const matchesFilter =
                    state.scanFilter === "all" ||
                    (state.scanFilter === "safe" && isSafe) ||
                    (state.scanFilter === "threat" && !isSafe);

                const matchesSearch =
                    !searchQuery || searchable.includes(searchQuery);

                const visible = matchesFilter && matchesSearch;

                row.hidden = !visible;
                row.classList.toggle("is-filtered-out", !visible);

                if (visible) {
                    visibleCount += 1;
                }
            });

            if (elements.visibleScanCount) {
                elements.visibleScanCount.textContent =
                    visibleCount === 1
                        ? "Showing 1 recent security record"
                        : `Showing ${visibleCount} recent security records`;
            }
        };

        const setupScanTable = () => {
            elements.scanTableSearch?.addEventListener(
                "input",
                updateVisibleScanRows
            );

            $$("[data-scan-filter]").forEach((button) => {
                button.addEventListener("click", () => {
                    state.scanFilter =
                        button.dataset.scanFilter || "all";

                    $$("[data-scan-filter]").forEach(
                        (candidate) =>
                            candidate.classList.toggle(
                                "is-active",
                                candidate === button
                            )
                    );

                    updateVisibleScanRows();
                    playSound("click");
                });
            });

            updateVisibleScanRows();
        };


        /* ==================================================================
           SCAN DETAILS DRAWER
        ================================================================== */

        const predictionClass = (prediction) => {
            const normalized = String(prediction).toLowerCase();

            if (
                normalized.includes("safe") ||
                normalized.includes("benign")
            ) {
                return "soc-status-chip--safe";
            }

            if (
                normalized.includes("suspicious") ||
                normalized.includes("medium")
            ) {
                return "soc-status-chip--warning";
            }

            return "soc-status-chip--critical";
        };

        const openScanDetails = (button) => {
            if (!elements.scanDetailsDrawer || !button) {
                return;
            }

            const filename =
                button.dataset.filename || "Unknown file";

            const prediction =
                button.dataset.prediction || "Unknown";

            const risk =
                button.dataset.risk || "Unknown";

            const scanTime =
                button.dataset.scanTime || "Unknown";

            if (elements.scanDetailFilename) {
                elements.scanDetailFilename.textContent = filename;
            }

            if (elements.scanDetailPrediction) {
                elements.scanDetailPrediction.textContent = prediction;
                elements.scanDetailPrediction.classList.remove(
                    "soc-status-chip--safe",
                    "soc-status-chip--warning",
                    "soc-status-chip--critical"
                );
                elements.scanDetailPrediction.classList.add(
                    predictionClass(prediction)
                );
            }

            if (elements.scanDetailRisk) {
                elements.scanDetailRisk.textContent = risk;
            }

            if (elements.scanDetailTime) {
                elements.scanDetailTime.textContent = scanTime;
            }

            if (elements.scanDetailAssessment) {
                const safe =
                    String(prediction).toLowerCase().includes("safe") ||
                    String(prediction).toLowerCase().includes("benign");

                elements.scanDetailAssessment.textContent = safe
                    ? `${filename} was classified as ${prediction} with a recorded risk level of ${risk}. No immediate containment action is indicated by this dashboard record.`
                    : `${filename} was classified as ${prediction} with a recorded risk level of ${risk}. Review the file source, isolate it when appropriate and investigate related security activity.`;
            }

            openDrawer(elements.scanDetailsDrawer, button);
        };

        const setupScanDetails = () => {
            $$("[data-open-scan-details]").forEach((button) => {
                button.addEventListener(
                    "click",
                    () => openScanDetails(button)
                );
            });

            elements.closeScanDetails?.addEventListener(
                "click",
                () => closeDrawer(elements.scanDetailsDrawer)
            );

            elements.closeScanDetailsSecondary?.addEventListener(
                "click",
                () => closeDrawer(elements.scanDetailsDrawer)
            );
        };


        /* ==================================================================
           CHART EXPANSION
        ================================================================== */

        const clearExpandedChart = () => {
            if (
                state.expandedPlot &&
                window.Plotly
            ) {
                try {
                    window.Plotly.purge(state.expandedPlot);
                } catch {
                    // Plot may already have been removed.
                }
            }

            state.expandedPlot = null;

            if (elements.expandedChartContent) {
                elements.expandedChartContent.replaceChildren();
            }
        };

        const openExpandedChart = (button) => {
            const panel = button.closest(".soc-panel");
            const chartContainer = $(".soc-chart-container", panel);

            if (
                !panel ||
                !chartContainer ||
                !elements.expandedChartModal ||
                !elements.expandedChartContent
            ) {
                return;
            }

            clearExpandedChart();

            const title =
                $("h3", panel)?.textContent.trim() ||
                "Expanded Chart";

            if (elements.expandedChartTitle) {
                elements.expandedChartTitle.textContent = title;
            }

            const originalPlot =
                $(".js-plotly-plot", chartContainer);

            if (
                originalPlot &&
                window.Plotly &&
                Array.isArray(originalPlot.data)
            ) {
                const plot = document.createElement("div");
                plot.className = "soc-expanded-plot";
                plot.style.width = "100%";
                plot.style.height = "min(72vh, 760px)";

                elements.expandedChartContent.appendChild(plot);
                state.expandedPlot = plot;

                let data = originalPlot.data;
                let layout = originalPlot.layout || {};
                let config = originalPlot._context || {};

                try {
                    data = JSON.parse(JSON.stringify(data));
                    layout = JSON.parse(JSON.stringify(layout));
                } catch {
                    // Reuse Plotly objects when deep cloning is unavailable.
                }

                window.Plotly.newPlot(
                    plot,
                    data,
                    {
                        ...layout,
                        autosize: true,
                        width: undefined,
                        height: undefined,
                        paper_bgcolor: "rgba(0,0,0,0)",
                        plot_bgcolor: "rgba(12,31,46,0.72)",
                        font: {
                            ...(layout.font || {}),
                            color: "#c1d0dd"
                        }
                    },
                    {
                        ...config,
                        responsive: true,
                        displaylogo: false
                    }
                );
            } else {
                const clone =
                    $(".soc-server-chart", chartContainer)
                        ?.cloneNode(true) ||
                    chartContainer.cloneNode(true);

                elements.expandedChartContent.appendChild(clone);
            }

            openModal(elements.expandedChartModal);
        };

        const closeExpandedChart = () => {
            closeModal(elements.expandedChartModal);
            window.setTimeout(clearExpandedChart, 260);
        };

        const setupChartExpansion = () => {
            $$("[data-expand-panel]").forEach((button) => {
                button.addEventListener(
                    "click",
                    () => openExpandedChart(button)
                );
            });

            elements.closeExpandedChart?.addEventListener(
                "click",
                closeExpandedChart
            );

            $$("[data-close-expanded-chart]").forEach((backdrop) => {
                backdrop.addEventListener(
                    "click",
                    closeExpandedChart
                );
            });
        };


        /* ==================================================================
           ANALYTICS RANGE SELECTOR
        ================================================================== */

        const parseDashboardDate = (value) => {
            if (value instanceof Date && !Number.isNaN(value.getTime())) {
                return value;
            }

            if (typeof value === "number" && Number.isFinite(value)) {
                const date = new Date(value);
                return Number.isNaN(date.getTime()) ? null : date;
            }

            const text = String(value ?? "").trim();

            if (!text) {
                return null;
            }

            const direct = new Date(text);

            if (!Number.isNaN(direct.getTime())) {
                return direct;
            }

            const dayFirst = text.match(
                /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
            );

            if (dayFirst) {
                const [
                    ,
                    day,
                    month,
                    year,
                    hour = "0",
                    minute = "0",
                    second = "0"
                ] = dayFirst;

                const date = new Date(
                    Number(year),
                    Number(month) - 1,
                    Number(day),
                    Number(hour),
                    Number(minute),
                    Number(second)
                );

                return Number.isNaN(date.getTime()) ? null : date;
            }

            return null;
        };

        const getPlotlyDateValues = (plot) => {
            if (!plot || !Array.isArray(plot.data)) {
                return [];
            }

            return plot.data
                .flatMap((trace) => Array.isArray(trace.x) ? trace.x : [])
                .map(parseDashboardDate)
                .filter(Boolean);
        };

        const applyAnalyticsRange = async (range) => {
            state.analyticsRange = range;
            dashboard.dataset.analyticsRange = range;

            if (!window.Plotly) {
                showToast(
                    "Analytics range saved",
                    "The selected range will be available when Plotly finishes loading.",
                    "info"
                );
                return;
            }

            const plots = $$(".js-plotly-plot");
            const datePlots = plots
                .map((plot) => ({
                    plot,
                    dates: getPlotlyDateValues(plot)
                }))
                .filter((entry) => entry.dates.length > 0);

            if (!datePlots.length) {
                showToast(
                    "Analytics range selected",
                    "No date-based Plotly chart was available for client-side filtering.",
                    "warning"
                );
                return;
            }

            const latestTimestamp = Math.max(
                ...datePlots.flatMap((entry) =>
                    entry.dates.map((date) => date.getTime())
                )
            );

            const latest = new Date(latestTimestamp);
            const rangeDurations = {
                "24h": 24 * 60 * 60 * 1000,
                "7d": 7 * 24 * 60 * 60 * 1000,
                "30d": 30 * 24 * 60 * 60 * 1000
            };

            let updated = 0;

            await Promise.all(
                datePlots.map(async ({ plot }) => {
                    try {
                        if (range === "all") {
                            await window.Plotly.relayout(plot, {
                                "xaxis.autorange": true
                            });
                        } else {
                            const duration =
                                rangeDurations[range] ||
                                rangeDurations["7d"];

                            const startDate = new Date(
                                latest.getTime() - duration
                            );

                            await window.Plotly.relayout(plot, {
                                "xaxis.autorange": false,
                                "xaxis.range": [
                                    startDate.toISOString(),
                                    latest.toISOString()
                                ]
                            });
                        }

                        updated += 1;
                    } catch (error) {
                        console.warn(
                            "Unable to apply analytics range to a chart.",
                            error
                        );
                    }
                })
            );

            playSound("click");

            showToast(
                "Analytics range applied",
                `${range.toUpperCase()} range applied to ${updated} time-series chart${updated === 1 ? "" : "s"}.`,
                "success"
            );

            window.setTimeout(resizePlotlyCharts, 120);
        };

        const setupAnalyticsRanges = () => {
            $$("[data-range]").forEach((button) => {
                button.addEventListener("click", () => {
                    $$("[data-range]").forEach((candidate) => {
                        candidate.classList.toggle(
                            "is-active",
                            candidate === button
                        );
                    });

                    applyAnalyticsRange(
                        button.dataset.range || "7d"
                    );
                });
            });
        };


        /* ==================================================================
           EXPORT AND REFRESH ACTIONS
        ================================================================== */

        const collectRecentRows = () =>
            $$("[data-scan-row]").map((row) => ({
                filename:
                    $("[data-open-scan-details]", row)?.dataset
                        .filename ||
                    $("strong", row)?.textContent.trim() ||
                    "",
                prediction:
                    $("[data-open-scan-details]", row)?.dataset
                        .prediction || "",
                risk:
                    $("[data-open-scan-details]", row)?.dataset
                        .risk || "",
                scanTime:
                    $("[data-open-scan-details]", row)?.dataset
                        .scanTime || ""
            }));

        const exportDashboardSnapshot = () => {
            const snapshot = {
                generatedAt: new Date().toISOString(),
                user: dashboardData.currentUser,
                metrics: {
                    totalScans: dashboardData.totalScans,
                    safeScans: dashboardData.safeScans,
                    maliciousScans: dashboardData.maliciousScans,
                    criticalScans: dashboardData.criticalScans,
                    securityScore: dashboardData.securityScore,
                    threatRate: dashboardData.threatRate
                },
                recentScans: collectRecentRows()
            };

            const blob = new Blob(
                [JSON.stringify(snapshot, null, 2)],
                { type: "application/json" }
            );

            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            const timestamp = new Date()
                .toISOString()
                .replace(/[:.]/g, "-");

            anchor.href = url;
            anchor.download =
                `ai-threat-dashboard-${timestamp}.json`;

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            URL.revokeObjectURL(url);

            playSound("success");

            showToast(
                "Dashboard exported",
                "A JSON snapshot of the current dashboard was created.",
                "success"
            );
        };

        const refreshDashboard = () => {
            if (dashboard.classList.contains("is-refreshing")) {
                return;
            }

            dashboard.classList.add("is-refreshing");

            const refreshButtons = [
                elements.refreshDashboardData,
                elements.commandRefreshDashboard
            ].filter(Boolean);

            refreshButtons.forEach((button) => {
                button.disabled = true;
                button.setAttribute("aria-busy", "true");
            });

            playSound("open");

            showToast(
                "Refreshing intelligence",
                "Reloading the latest dashboard values and charts.",
                "info",
                1800
            );

            window.setTimeout(() => {
                window.location.reload();
            }, 850);
        };

        const copyText = async (text) => {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return;
            }

            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
        };

        const closeMetricPopover = () => {
            document
                .querySelector(".soc-js-metric-popover")
                ?.remove();
        };

        const openMetricPopover = (button) => {
            closeMetricPopover();

            const card = button.closest(".soc-metric-card");
            const label =
                $(".soc-metric-card__label", card)?.textContent.trim() ||
                "Metric";
            const value =
                $(".soc-metric-card__value", card)?.textContent.trim() ||
                "Unavailable";

            const popover = document.createElement("div");
            popover.className = "soc-js-metric-popover";
            popover.setAttribute("role", "menu");
            popover.innerHTML = `
                <button type="button" data-metric-action="copy" role="menuitem">
                    <i class="fa-solid fa-copy"></i>
                    Copy metric
                </button>
                <button type="button" data-metric-action="history" role="menuitem">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    Open scan history
                </button>
                <button type="button" data-metric-action="export" role="menuitem">
                    <i class="fa-solid fa-file-export"></i>
                    Export snapshot
                </button>
            `;

            const rect = button.getBoundingClientRect();
            popover.style.position = "fixed";
            popover.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - 170)}px`;
            popover.style.left = `${Math.max(12, rect.right - 190)}px`;
            popover.style.zIndex = "1700";

            popover.addEventListener("click", async (event) => {
                const actionButton = event.target.closest(
                    "[data-metric-action]"
                );

                if (!actionButton) {
                    return;
                }

                const action = actionButton.dataset.metricAction;

                if (action === "copy") {
                    try {
                        await copyText(`${label}: ${value}`);
                        showToast(
                            "Metric copied",
                            `${label} was copied to the clipboard.`,
                            "success"
                        );
                    } catch {
                        showToast(
                            "Copy failed",
                            "The browser did not allow clipboard access.",
                            "error"
                        );
                    }
                }

                if (action === "history") {
                    const historyLink = $(
                        'a[href*="history"]',
                        dashboard
                    );

                    if (historyLink?.href) {
                        window.location.href = historyLink.href;
                    }
                }

                if (action === "export") {
                    exportDashboardSnapshot();
                }

                closeMetricPopover();
            });

            document.body.appendChild(popover);
            popover.querySelector("button")?.focus();
        };

        const installRuntimeUtilityStyles = () => {
            if (document.getElementById("socDashboardRuntimeStyles")) {
                return;
            }

            const style = document.createElement("style");
            style.id = "socDashboardRuntimeStyles";
            style.textContent = `
                .soc-js-metric-popover {
                    display: grid;
                    width: 190px;
                    padding: 7px;
                    gap: 4px;
                    border: 1px solid rgba(130, 210, 230, .24);
                    border-radius: 11px;
                    background: rgba(14, 32, 47, .98);
                    box-shadow: 0 22px 60px rgba(0, 6, 15, .55);
                    backdrop-filter: blur(16px);
                }
                .soc-js-metric-popover button {
                    display: flex;
                    min-height: 38px;
                    padding: 0 10px;
                    align-items: center;
                    gap: 9px;
                    border: 0;
                    border-radius: 8px;
                    color: #c1d0dd;
                    background: transparent;
                    cursor: pointer;
                    text-align: left;
                    font: 600 11px Inter, sans-serif;
                }
                .soc-js-metric-popover button:hover,
                .soc-js-metric-popover button:focus-visible {
                    color: #86e6ed;
                    background: rgba(75, 210, 223, .11);
                    outline: none;
                }
                .soc-js-metric-popover i {
                    width: 16px;
                    color: #86e6ed;
                }
                .soc-notification.is-reviewed {
                    opacity: .5;
                    filter: saturate(.55);
                }
            `;
            document.head.appendChild(style);
        };

        const setupActionButtons = () => {
            installRuntimeUtilityStyles();

            elements.exportDashboardReport?.addEventListener(
                "click",
                exportDashboardSnapshot
            );

            elements.refreshDashboardData?.addEventListener(
                "click",
                refreshDashboard
            );

            elements.commandRefreshDashboard?.addEventListener(
                "click",
                refreshDashboard
            );

            $$(".soc-card-menu").forEach((button) => {
                button.addEventListener("click", (event) => {
                    event.stopPropagation();
                    openMetricPopover(button);
                    playSound("click");
                });
            });

            document.addEventListener("click", (event) => {
                if (
                    !event.target.closest(".soc-js-metric-popover") &&
                    !event.target.closest(".soc-card-menu")
                ) {
                    closeMetricPopover();
                }
            });
        };


        /* ==================================================================
           MAP INTERACTIONS AND LIVE CONNECTION ARCS
        ================================================================== */

        const setupThreatMap = () => {
            if (
                !elements.dashboardThreatMap ||
                !elements.threatMapTooltip
            ) {
                return;
            }

            const nodes = $$(
                ".soc-map-node",
                elements.dashboardThreatMap
            );

            const showMapTooltip = (node) => {
                const name =
                    node.dataset.nodeName || "Threat node";
                const risk =
                    node.dataset.nodeRisk || "Unknown";

                elements.threatMapTooltip.textContent =
                    `${name} • Risk: ${risk}`;

                elements.threatMapTooltip.classList.add("is-visible");

                const mapRect =
                    elements.dashboardThreatMap.getBoundingClientRect();

                const nodeRect = node.getBoundingClientRect();

                const left =
                    nodeRect.left -
                    mapRect.left +
                    nodeRect.width / 2;

                const top =
                    nodeRect.top -
                    mapRect.top -
                    12;

                elements.threatMapTooltip.style.left =
                    `${clamp(left - 80, 8, Math.max(8, mapRect.width - 170))}px`;

                elements.threatMapTooltip.style.top =
                    `${Math.max(8, top - 42)}px`;
            };

            const hideMapTooltip = () => {
                elements.threatMapTooltip.classList.remove(
                    "is-visible"
                );
            };

            nodes.forEach((node) => {
                node.addEventListener(
                    "mouseenter",
                    () => showMapTooltip(node)
                );

                node.addEventListener(
                    "focus",
                    () => showMapTooltip(node)
                );

                node.addEventListener(
                    "mouseleave",
                    hideMapTooltip
                );

                node.addEventListener(
                    "blur",
                    hideMapTooltip
                );

                node.addEventListener("click", () => {
                    const risk =
                        node.dataset.nodeRisk || "Unknown";

                    playSound(
                        /critical|high|elevated/i.test(risk)
                            ? "warning"
                            : "click"
                    );

                    showToast(
                        node.dataset.nodeName || "Threat node",
                        `Threat intelligence node opened. Reported risk: ${risk}.`,
                        /critical|high|elevated/i.test(risk)
                            ? "warning"
                            : "info"
                    );
                });
            });

            const canvas = elements.threatMapCanvas;
            const context = canvas?.getContext("2d");

            if (!canvas || !context || reducedMotion) {
                return;
            }

            let width = 0;
            let height = 0;
            let progress = 0;
            let frameId = 0;

            const resize = () => {
                const rect =
                    elements.dashboardThreatMap.getBoundingClientRect();
                const dpr =
                    Math.min(window.devicePixelRatio || 1, 2);

                width = Math.max(1, rect.width);
                height = Math.max(1, rect.height);

                canvas.width = Math.round(width * dpr);
                canvas.height = Math.round(height * dpr);
                context.setTransform(dpr, 0, 0, dpr, 0, 0);
            };

            const getNodeCenter = (node) => {
                const mapRect =
                    elements.dashboardThreatMap.getBoundingClientRect();
                const nodeRect = node.getBoundingClientRect();

                return {
                    x:
                        nodeRect.left -
                        mapRect.left +
                        nodeRect.width / 2,
                    y:
                        nodeRect.top -
                        mapRect.top +
                        nodeRect.height / 2
                };
            };

            const drawConnection = (
                startPoint,
                endPoint,
                phase,
                color
            ) => {
                const controlX =
                    (startPoint.x + endPoint.x) / 2;
                const controlY =
                    Math.min(startPoint.y, endPoint.y) -
                    Math.abs(endPoint.x - startPoint.x) * 0.18 -
                    18;

                context.beginPath();
                context.moveTo(startPoint.x, startPoint.y);
                context.quadraticCurveTo(
                    controlX,
                    controlY,
                    endPoint.x,
                    endPoint.y
                );
                context.strokeStyle = color;
                context.lineWidth = 1;
                context.setLineDash([4, 7]);
                context.lineDashOffset = -phase;
                context.stroke();
                context.setLineDash([]);

                const t = (phase % 100) / 100;
                const inverse = 1 - t;
                const pointX =
                    inverse * inverse * startPoint.x +
                    2 * inverse * t * controlX +
                    t * t * endPoint.x;
                const pointY =
                    inverse * inverse * startPoint.y +
                    2 * inverse * t * controlY +
                    t * t * endPoint.y;

                context.beginPath();
                context.arc(pointX, pointY, 2.2, 0, Math.PI * 2);
                context.fillStyle = color;
                context.shadowBlur = 10;
                context.shadowColor = color;
                context.fill();
                context.shadowBlur = 0;
            };

            const draw = () => {
                context.clearRect(0, 0, width, height);

                const points = nodes.map(getNodeCenter);

                if (points.length >= 4) {
                    drawConnection(
                        points[0],
                        points[2],
                        progress,
                        "rgba(134, 230, 237, .62)"
                    );
                    drawConnection(
                        points[1],
                        points[3],
                        progress + 33,
                        "rgba(149, 133, 235, .55)"
                    );
                    drawConnection(
                        points[2],
                        points[3],
                        progress + 66,
                        "rgba(230, 111, 131, .52)"
                    );
                }

                progress = (progress + 0.75) % 100;
                frameId = requestAnimationFrame(draw);
            };

            resize();
            draw();

            if (window.ResizeObserver) {
                const observer = new ResizeObserver(resize);
                observer.observe(elements.dashboardThreatMap);
            } else {
                window.addEventListener("resize", resize);
            }

            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    cancelAnimationFrame(frameId);
                } else {
                    cancelAnimationFrame(frameId);
                    draw();
                }
            });
        };


        /* ==================================================================
           COUNTERS, GAUGES AND PROGRESS BARS
        ================================================================== */

        const animateCounter = (element) => {
            const target = parseNumber(
                element.dataset.counter ?? element.textContent
            );

            if (!Number.isFinite(target)) {
                return;
            }

            if (reducedMotion) {
                element.textContent =
                    Number.isInteger(target)
                        ? target.toLocaleString()
                        : target.toLocaleString(undefined, {
                            maximumFractionDigits: 1
                        });
                return;
            }

            const duration = 900;
            const startTime = performance.now();

            const frame = (time) => {
                const progress = clamp(
                    (time - startTime) / duration,
                    0,
                    1
                );

                const eased =
                    1 - Math.pow(1 - progress, 3);

                const value = target * eased;

                element.textContent =
                    Number.isInteger(target)
                        ? Math.round(value).toLocaleString()
                        : value.toLocaleString(undefined, {
                            maximumFractionDigits: 1
                        });

                if (progress < 1) {
                    requestAnimationFrame(frame);
                }
            };

            requestAnimationFrame(frame);
        };

        const setupMetrics = () => {
            $$(".counter").forEach(animateCounter);

            $$("[data-progress-value]").forEach((bar) => {
                const value = clamp(
                    parseNumber(bar.dataset.progressValue),
                    0,
                    100
                );

                bar.style.width = "0%";

                window.setTimeout(() => {
                    bar.style.width = `${value}%`;
                }, reducedMotion ? 0 : 260);
            });

            $$("[data-resource-value]").forEach((bar) => {
                const value = clamp(
                    parseNumber(bar.dataset.resourceValue),
                    0,
                    100
                );

                bar.style.width = "0%";

                window.setTimeout(() => {
                    bar.style.width = `${value}%`;
                }, reducedMotion ? 0 : 320);
            });

            if (elements.securityScoreGauge) {
                const score = clamp(
                    parseNumber(
                        elements.securityScoreGauge.dataset.score,
                        dashboardData.securityScore
                    ),
                    0,
                    100
                );

                elements.securityScoreGauge.style.setProperty(
                    "--score-angle",
                    `${score * 3.6}deg`
                );
            }

            $$(".soc-integrity-score__gauge").forEach((gauge) => {
                const score = clamp(
                    parseNumber(gauge.dataset.score),
                    0,
                    100
                );

                gauge.style.setProperty(
                    "--integrity-angle",
                    `${score * 3.6}deg`
                );
            });
        };


        /* ==================================================================
           RESOURCE MONITOR SIMULATION
           Visual-only values; does not claim to read the real computer.
        ================================================================== */

        const resourceDefinitions = [
            {
                value: $("#aiEngineLoadValue"),
                bar: $("#aiEngineLoadBar"),
                minimum: 26,
                maximum: 62
            },
            {
                value: $("#memoryLoadValue"),
                bar: $("#memoryLoadBar"),
                minimum: 42,
                maximum: 69
            },
            {
                value: $("#databaseLoadValue"),
                bar: $("#databaseLoadBar"),
                minimum: 18,
                maximum: 43
            }
        ];

        const updateResources = () => {
            resourceDefinitions.forEach((resource) => {
                if (!resource.value || !resource.bar) {
                    return;
                }

                const current = parseNumber(
                    resource.value.textContent,
                    resource.minimum
                );

                const movement =
                    Math.floor(Math.random() * 9) - 4;

                const next = clamp(
                    current + movement,
                    resource.minimum,
                    resource.maximum
                );

                resource.value.textContent = `${next}%`;
                resource.bar.dataset.resourceValue = String(next);
                resource.bar.style.width = `${next}%`;
            });

            if (elements.resourceUpdatedTime) {
                elements.resourceUpdatedTime.textContent =
                    new Date().toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    });
            }
        };

        const setupResourceMonitor = () => {
            updateResources();
            window.setInterval(updateResources, 5200);
        };


        /* ==================================================================
           PLOTLY DARK THEME AND RESPONSIVE RESIZING
        ================================================================== */

        const themePlotlyCharts = () => {
            if (!window.Plotly) {
                return;
            }

            $$(".js-plotly-plot").forEach((chart) => {
                try {
                    window.Plotly.relayout(chart, {
                        autosize: true,
                        paper_bgcolor: "rgba(0,0,0,0)",
                        plot_bgcolor: "rgba(11,29,43,0.72)",
                        "font.color": "#c1d0dd",
                        "title.font.color": "#f8fbff",
                        "legend.font.color": "#c1d0dd",
                        "xaxis.color": "#91a6b9",
                        "xaxis.gridcolor": "rgba(176,207,228,0.10)",
                        "xaxis.zerolinecolor": "rgba(176,207,228,0.14)",
                        "yaxis.color": "#91a6b9",
                        "yaxis.gridcolor": "rgba(176,207,228,0.10)",
                        "yaxis.zerolinecolor": "rgba(176,207,228,0.14)"
                    });

                    window.Plotly.Plots.resize(chart);
                } catch {
                    // Some Plotly chart types do not expose every axis.
                }
            });
        };

        const setupPlotly = () => {
            window.setTimeout(themePlotlyCharts, 500);
            window.setTimeout(themePlotlyCharts, 1300);

            let resizeTimer = null;

            window.addEventListener("resize", () => {
                window.clearTimeout(resizeTimer);

                resizeTimer = window.setTimeout(
                    resizePlotlyCharts,
                    180
                );
            });
        };


        /* ==================================================================
           VISUAL INTERACTIONS
        ================================================================== */

        const setupCursorLight = () => {
            if (
                !elements.cursorLight ||
                !window.matchMedia("(pointer: fine)").matches
            ) {
                return;
            }

            document.addEventListener(
                "pointermove",
                (event) => {
                    elements.cursorLight.style.transform =
                        `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
                },
                { passive: true }
            );
        };

        const setupHologramTilt = () => {
            if (
                !elements.hologramStage ||
                !elements.holoShield ||
                reducedMotion ||
                !window.matchMedia("(pointer: fine)").matches
            ) {
                return;
            }

            elements.hologramStage.addEventListener(
                "pointermove",
                (event) => {
                    const rect =
                        elements.hologramStage.getBoundingClientRect();

                    const x =
                        (event.clientX - rect.left) / rect.width - 0.5;

                    const y =
                        (event.clientY - rect.top) / rect.height - 0.5;

                    elements.holoShield.style.transform =
                        `perspective(900px) rotateX(${y * -10}deg) rotateY(${x * 13}deg) translateZ(10px)`;
                }
            );

            elements.hologramStage.addEventListener(
                "pointerleave",
                () => {
                    elements.holoShield.style.transform = "";
                }
            );
        };

        const createParticleCanvas = (
            canvas,
            {
                count = 35,
                color = "75, 210, 223",
                connectionDistance = 110,
                speed = 0.22
            } = {}
        ) => {
            if (!canvas || reducedMotion) {
                return;
            }

            const context = canvas.getContext("2d");

            if (!context) {
                return;
            }

            let width = 0;
            let height = 0;
            let particles = [];
            let animationFrame = null;

            const resize = () => {
                const rect = canvas.getBoundingClientRect();
                const dpr = Math.min(window.devicePixelRatio || 1, 2);

                width = Math.max(rect.width, 1);
                height = Math.max(rect.height, 1);

                canvas.width = Math.round(width * dpr);
                canvas.height = Math.round(height * dpr);

                context.setTransform(dpr, 0, 0, dpr, 0, 0);

                particles = Array.from({ length: count }, () => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    radius: 0.8 + Math.random() * 1.4
                }));
            };

            const draw = () => {
                context.clearRect(0, 0, width, height);

                particles.forEach((particle) => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;

                    if (particle.x < 0 || particle.x > width) {
                        particle.vx *= -1;
                    }

                    if (particle.y < 0 || particle.y > height) {
                        particle.vy *= -1;
                    }

                    context.beginPath();
                    context.arc(
                        particle.x,
                        particle.y,
                        particle.radius,
                        0,
                        Math.PI * 2
                    );
                    context.fillStyle = `rgba(${color}, 0.56)`;
                    context.fill();
                });

                for (let first = 0; first < particles.length; first += 1) {
                    for (
                        let second = first + 1;
                        second < particles.length;
                        second += 1
                    ) {
                        const dx =
                            particles[first].x - particles[second].x;

                        const dy =
                            particles[first].y - particles[second].y;

                        const distance = Math.hypot(dx, dy);

                        if (distance < connectionDistance) {
                            context.beginPath();
                            context.moveTo(
                                particles[first].x,
                                particles[first].y
                            );
                            context.lineTo(
                                particles[second].x,
                                particles[second].y
                            );
                            context.strokeStyle =
                                `rgba(${color}, ${
                                    (1 - distance / connectionDistance) * 0.12
                                })`;
                            context.lineWidth = 0.7;
                            context.stroke();
                        }
                    }
                }

                animationFrame = requestAnimationFrame(draw);
            };

            resize();
            draw();

            if (window.ResizeObserver) {
                const observer = new ResizeObserver(resize);
                observer.observe(canvas);
            } else {
                window.addEventListener("resize", resize);
            }

            document.addEventListener("visibilitychange", () => {
                if (document.hidden && animationFrame) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                } else if (!document.hidden && !animationFrame) {
                    draw();
                }
            });
        };

        const setupTrafficCanvas = () => {
            const canvas = elements.trafficCanvas;
            const context = canvas?.getContext("2d");

            if (!canvas || !context || reducedMotion) {
                return;
            }

            let width = 0;
            let height = 0;
            let dpr = 1;
            let frameId = 0;
            const streams = [];

            const resize = () => {
                const rect = canvas.getBoundingClientRect();
                dpr = Math.min(window.devicePixelRatio || 1, 2);
                width = Math.max(1, rect.width);
                height = Math.max(1, rect.height);

                canvas.width = Math.round(width * dpr);
                canvas.height = Math.round(height * dpr);
                context.setTransform(dpr, 0, 0, dpr, 0, 0);

                streams.length = 0;

                const streamCount = Math.max(
                    8,
                    Math.floor(width / 150)
                );

                for (let index = 0; index < streamCount; index += 1) {
                    streams.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        length: 35 + Math.random() * 100,
                        speed: 0.18 + Math.random() * 0.55,
                        alpha: 0.04 + Math.random() * 0.08
                    });
                }
            };

            const draw = () => {
                context.clearRect(0, 0, width, height);

                streams.forEach((stream) => {
                    const gradient =
                        context.createLinearGradient(
                            stream.x,
                            stream.y,
                            stream.x + stream.length,
                            stream.y
                        );

                    gradient.addColorStop(
                        0,
                        "rgba(75, 210, 223, 0)"
                    );
                    gradient.addColorStop(
                        0.7,
                        `rgba(75, 210, 223, ${stream.alpha})`
                    );
                    gradient.addColorStop(
                        1,
                        "rgba(134, 230, 237, 0)"
                    );

                    context.beginPath();
                    context.moveTo(stream.x, stream.y);
                    context.lineTo(
                        stream.x + stream.length,
                        stream.y
                    );
                    context.strokeStyle = gradient;
                    context.lineWidth = 1;
                    context.stroke();

                    stream.x += stream.speed;

                    if (stream.x > width + stream.length) {
                        stream.x = -stream.length;
                        stream.y = Math.random() * height;
                    }
                });

                frameId = requestAnimationFrame(draw);
            };

            resize();
            draw();

            if (window.ResizeObserver) {
                const observer = new ResizeObserver(resize);
                observer.observe(canvas);
            } else {
                window.addEventListener("resize", resize);
            }

            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    cancelAnimationFrame(frameId);
                } else {
                    cancelAnimationFrame(frameId);
                    draw();
                }
            });
        };

        const setupPanelReveal = () => {
            const revealTargets = $$(
                [
                    ".soc-metric-card",
                    ".soc-ai-summary",
                    ".soc-panel",
                    ".soc-quick-action"
                ].join(",")
            );

            if (reducedMotion || !window.IntersectionObserver) {
                revealTargets.forEach((target) =>
                    target.classList.add("is-revealed")
                );
                return;
            }

            revealTargets.forEach((target) => {
                target.style.opacity = "0";
                target.style.transform = "translateY(16px)";
                target.style.transition =
                    "opacity 520ms cubic-bezier(.22,1,.36,1), transform 520ms cubic-bezier(.22,1,.36,1)";
            });

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        entry.target.style.opacity = "1";
                        entry.target.style.transform = "translateY(0)";
                        entry.target.classList.add("is-revealed");
                        observer.unobserve(entry.target);
                    });
                },
                {
                    threshold: 0.08,
                    rootMargin: "0px 0px -35px"
                }
            );

            revealTargets.forEach((target) =>
                observer.observe(target)
            );
        };

        const setupVisualEffects = () => {
            setupCursorLight();
            setupHologramTilt();
            setupTrafficCanvas();
            setupPanelReveal();

            createParticleCanvas(elements.heroParticles, {
                count: 38,
                connectionDistance: 120,
                speed: 0.28
            });

            createParticleCanvas(elements.meshCanvas, {
                count: 24,
                color: "92, 145, 238",
                connectionDistance: 145,
                speed: 0.12
            });
        };


        /* ==================================================================
           BOOT SEQUENCE
        ================================================================== */

        const setupBootSequence = () => {
            if (!elements.bootSequence) {
                return;
            }

            let alreadyBooted = false;

            try {
                alreadyBooted =
                    window.sessionStorage.getItem(
                        "socDashboardBooted"
                    ) === "true";
            } catch {
                alreadyBooted = false;
            }

            if (alreadyBooted || reducedMotion) {
                elements.bootSequence.setAttribute(
                    "aria-hidden",
                    "true"
                );
                elements.bootSequence.hidden = true;
                dashboard.classList.add("is-ready");
                return;
            }

            elements.bootSequence.hidden = false;
            elements.bootSequence.setAttribute(
                "aria-hidden",
                "false"
            );

            dashboard.classList.add("is-booting");

            let progress = 0;

            const timer = window.setInterval(() => {
                progress += Math.floor(7 + Math.random() * 15);
                progress = Math.min(progress, 100);

                if (elements.bootBar) {
                    elements.bootBar.style.width = `${progress}%`;
                }

                if (elements.bootPercentage) {
                    elements.bootPercentage.textContent =
                        `${progress}%`;
                }

                if (progress >= 100) {
                    window.clearInterval(timer);

                    window.setTimeout(() => {
                        elements.bootSequence.setAttribute(
                            "aria-hidden",
                            "true"
                        );

                        dashboard.classList.remove("is-booting");
                        dashboard.classList.add("is-ready");

                        window.setTimeout(() => {
                            elements.bootSequence.hidden = true;
                        }, 450);

                        try {
                            window.sessionStorage.setItem(
                                "socDashboardBooted",
                                "true"
                            );
                        } catch {
                            // Session storage may be unavailable.
                        }
                    }, 260);
                }
            }, 80);
        };


        /* ==================================================================
           GLOBAL KEYBOARD CONTROLS
        ================================================================== */

        const setupKeyboardControls = () => {
            document.addEventListener("keydown", (event) => {
                const key = event.key.toLowerCase();

                if (
                    (event.metaKey || event.ctrlKey) &&
                    key === "k"
                ) {
                    event.preventDefault();

                    if (
                        elements.commandPalette?.getAttribute(
                            "aria-hidden"
                        ) === "false"
                    ) {
                        closeCommandPalette();
                    } else {
                        openCommandPalette();
                    }

                    return;
                }

                if (event.key === "Escape") {
                    if (state.activeModal) {
                        if (
                            state.activeModal ===
                            elements.expandedChartModal
                        ) {
                            closeExpandedChart();
                        } else {
                            closeModal(state.activeModal);
                        }

                        return;
                    }

                    if (state.activeDrawer) {
                        closeDrawer(state.activeDrawer);
                        elements.notificationButton?.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }

                    return;
                }

                trapFocus(event);
            });
        };


        /* ==================================================================
           GENERAL INTERACTION SOUNDS
        ================================================================== */

        const setupGeneralInteractions = () => {
            dashboard.addEventListener("click", (event) => {
                const interactive = event.target.closest(
                    "button, a, [role='button']"
                );

                if (
                    interactive &&
                    !interactive.matches(
                        "#dashboardSoundToggle"
                    )
                ) {
                    playSound("click");
                }
            });
        };


        /* ==================================================================
           INITIALIZATION
        ================================================================== */

        const safeInit = (name, initializer) => {
            try {
                initializer();
            } catch (error) {
                state.moduleErrors.push({
                    name,
                    error
                });

                console.error(
                    `[SOC Dashboard] ${name} failed to initialize.`,
                    error
                );
            }
        };

        const modules = [
            ["Boot sequence", setupBootSequence],
            ["Sound control", setupSoundControl],
            ["Telemetry clock", setupTelemetry],
            ["Display density", setupDensityControl],
            ["Notification center", setupNotificationCenter],
            ["Command palette", setupCommandPalette],
            ["Assessment modal", setupAssessmentModal],
            ["Recent scan table", setupScanTable],
            ["Scan details", setupScanDetails],
            ["Chart expansion", setupChartExpansion],
            ["Analytics ranges", setupAnalyticsRanges],
            ["Dashboard actions", setupActionButtons],
            ["Threat map", setupThreatMap],
            ["Metrics and gauges", setupMetrics],
            ["Resource monitor", setupResourceMonitor],
            ["Plotly integration", setupPlotly],
            ["Visual effects", setupVisualEffects],
            ["Keyboard controls", setupKeyboardControls],
            ["General interactions", setupGeneralInteractions]
        ];

        modules.forEach(([name, initializer]) =>
            safeInit(name, initializer)
        );

        dashboard.classList.add("has-js");
        dashboard.dataset.jsStatus =
            state.moduleErrors.length ? "partial" : "ready";

        console.info(
            "AI Threat Detection SOC Dashboard Engine initialized.",
            {
                status: dashboard.dataset.jsStatus,
                modules: modules.length,
                errors: state.moduleErrors
            }
        );

        window.setTimeout(() => {
            if (state.moduleErrors.length) {
                showToast(
                    "Dashboard partially initialized",
                    `${state.moduleErrors.length} optional module${state.moduleErrors.length === 1 ? "" : "s"} reported an error. Core navigation remains available.`,
                    "warning",
                    5200
                );
            }
        }, 600);

    });
})();


/* ============================================================================
   DASHBOARD LIVE THREAT DATA ENGINE v1.0
   ---------------------------------------------------------------------------
   This module is intentionally isolated from Flask Upload/Scan functionality.
   It reads a CSV selected in the browser, replays its actual rows, and updates
   only dashboard DOM/Plotly elements. It does not POST files to /upload, does
   not write to SQLite, and does not replace any existing scan functions.
   ============================================================================ */

(() => {
    "use strict";

    const onReady = (callback) => {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    };

    onReady(() => {
        const dashboard = document.getElementById("socDashboard");
        const control = document.getElementById("liveFeedControl");
        if (!dashboard || !control) return;

        const el = {
            file: document.getElementById("liveFeedFileInput"),
            load: document.getElementById("liveFeedLoadButton"),
            start: document.getElementById("liveFeedStartButton"),
            reset: document.getElementById("liveFeedResetButton"),
            rate: document.getElementById("liveFeedRate"),
            statusText: document.getElementById("liveFeedStatusText"),
            stateDot: document.getElementById("liveFeedStateDot"),
            stateLabel: document.getElementById("liveFeedStateLabel"),
            processed: document.getElementById("liveFeedProcessed"),
            total: document.getElementById("liveFeedTotal"),
            progressTrack: document.getElementById("liveFeedProgressTrack"),
            progressBar: document.getElementById("liveFeedProgressBar"),
            latest: document.getElementById("liveFeedLatestEvent"),

            totalEvents: document.getElementById("liveTotalEvents"),
            safeEvents: document.getElementById("liveSafeEvents"),
            threatEvents: document.getElementById("liveThreatEvents"),
            criticalEvents: document.getElementById("liveCriticalEvents"),
            threatRate: document.getElementById("liveThreatRate"),

            scoreGauge: document.getElementById("securityScoreGauge"),
            scoreValue: document.getElementById("liveSecurityScoreValue"),
            postureChip: document.getElementById("liveSecurityPostureChip"),
            postureText: document.getElementById("liveSecurityPostureText"),
            activeThreats: document.getElementById("liveActiveThreats"),
            criticalThreats: document.getElementById("liveCriticalThreats"),
            aiConfidence: document.getElementById("liveAiConfidence"),
            lastEvent: document.getElementById("liveLastEvent"),
            notificationCount: document.getElementById("dashboardNotificationCount"),
            recentBody: document.getElementById("recentScanTableBody")
        };

        const state = {
            rows: [],
            index: 0,
            timer: null,
            running: false,
            fileName: "",
            totals: null
        };

        const emptyTotals = () => ({
            total: 0,
            safe: 0,
            malicious: 0,
            critical: 0,
            confidenceSum: 0,
            confidenceCount: 0,
            riskScoreSum: 0,
            riskScoreCount: 0,
            severity: { Critical: 0, High: 0, Medium: 0, Low: 0 },
            daily: new Map(),
            monthly: new Map(),
            extensions: new Map(),
            recent: []
        });

        state.totals = emptyTotals();

        const toNumber = (value, fallback = 0) => {
            const n = Number.parseFloat(String(value ?? "").replace(/[^0-9.+-]/g, ""));
            return Number.isFinite(n) ? n : fallback;
        };

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

        const isTrue = (value) => /^(true|1|yes|y|malicious|threat)$/i.test(String(value ?? "").trim());

        const escapeHtml = (value) => String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

        const parseCsv = (text) => {
            const matrix = [];
            let row = [];
            let field = "";
            let quoted = false;

            for (let i = 0; i < text.length; i += 1) {
                const ch = text[i];
                const next = text[i + 1];

                if (ch === '"') {
                    if (quoted && next === '"') {
                        field += '"';
                        i += 1;
                    } else {
                        quoted = !quoted;
                    }
                    continue;
                }

                if (ch === "," && !quoted) {
                    row.push(field);
                    field = "";
                    continue;
                }

                if ((ch === "\n" || ch === "\r") && !quoted) {
                    if (ch === "\r" && next === "\n") i += 1;
                    row.push(field);
                    if (row.some((cell) => String(cell).trim() !== "")) matrix.push(row);
                    row = [];
                    field = "";
                    continue;
                }

                field += ch;
            }

            if (field.length || row.length) {
                row.push(field);
                if (row.some((cell) => String(cell).trim() !== "")) matrix.push(row);
            }

            if (matrix.length < 2) return [];

            const headers = matrix[0].map((h) => h.trim().replace(/^\uFEFF/, ""));
            return matrix.slice(1).map((cells) => {
                const item = {};
                headers.forEach((header, index) => {
                    item[header] = (cells[index] ?? "").trim();
                });
                return item;
            });
        };

        const setState = (mode, label, message) => {
            control.dataset.feedState = mode;
            if (el.stateLabel) el.stateLabel.textContent = label;
            if (el.statusText && message) el.statusText.textContent = message;
        };

        const formatInt = (value) => Math.round(value).toLocaleString();

        const animateValue = (node, value, suffix = "") => {
            if (!node) return;
            node.classList.remove("soc-live-value-flash");
            void node.offsetWidth;
            node.textContent = `${value}${suffix}`;
            node.classList.add("soc-live-value-flash");
        };

        const updatePosture = (score) => {
            const rounded = Math.round(score);
            if (el.scoreGauge) {
                el.scoreGauge.dataset.score = String(rounded);
                el.scoreGauge.style.setProperty("--score-angle", `${rounded * 3.6}deg`);
                el.scoreGauge.setAttribute("aria-label", `Security posture score ${rounded} out of 100`);
            }
            if (el.scoreValue) el.scoreValue.textContent = String(rounded);
            if (!el.postureChip || !el.postureText) return;

            el.postureChip.classList.remove(
                "soc-status-chip--safe",
                "soc-status-chip--warning",
                "soc-status-chip--critical"
            );

            if (score >= 80) {
                el.postureChip.classList.add("soc-status-chip--safe");
                el.postureChip.textContent = "Strong";
                el.postureText.textContent = "Live event risk remains within a healthy operating range.";
            } else if (score >= 50) {
                el.postureChip.classList.add("soc-status-chip--warning");
                el.postureChip.textContent = "Review";
                el.postureText.textContent = "Live event risk is elevated and should be reviewed.";
            } else {
                el.postureChip.classList.add("soc-status-chip--critical");
                el.postureChip.textContent = "At Risk";
                el.postureText.textContent = "The current live event stream shows a high-risk posture.";
            }
        };

        const chartDiv = (name) =>
            document.querySelector(`.soc-chart-container[data-chart-name="${name}"] .js-plotly-plot`);

        const plotLayout = (extra = {}) => ({
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#c1d0dd", family: "Inter, sans-serif", size: 11 },
            margin: { l: 44, r: 20, t: 20, b: 42 },
            xaxis: {
                color: "#91a6b9",
                gridcolor: "rgba(176,207,228,0.10)",
                zerolinecolor: "rgba(176,207,228,0.14)"
            },
            yaxis: {
                color: "#91a6b9",
                gridcolor: "rgba(176,207,228,0.10)",
                zerolinecolor: "rgba(176,207,228,0.14)",
                rangemode: "tozero"
            },
            showlegend: false,
            autosize: true,
            ...extra
        });

        const chartConfig = {
            responsive: true,
            displayModeBar: false,
            scrollZoom: false
        };

        const safeReact = (name, data, layout) => {
            const plot = chartDiv(name);
            if (!plot || !window.Plotly) return;
            try {
                window.Plotly.react(plot, data, layout, chartConfig);
            } catch (error) {
                console.warn(`[Live Feed] Could not update ${name} chart.`, error);
            }
        };

        const sortMap = (map) => [...map.entries()].sort(([a], [b]) => String(a).localeCompare(String(b)));

        const updateCharts = () => {
            const totals = state.totals;
            const daily = sortMap(totals.daily);
            const monthly = sortMap(totals.monthly);

            safeReact("daily-activity", [{
                type: "scatter",
                mode: "lines+markers",
                x: daily.map(([key]) => key),
                y: daily.map(([, value]) => value),
                line: { width: 2 },
                marker: { size: 6 },
                hovertemplate: "%{x}<br>Events: %{y}<extra></extra>"
            }], plotLayout());

            safeReact("threat-distribution", [{
                type: "pie",
                labels: ["Safe", "Malicious"],
                values: [totals.safe, totals.malicious],
                hole: 0.58,
                textinfo: "label+percent",
                hovertemplate: "%{label}: %{value}<extra></extra>"
            }], plotLayout({ margin: { l: 12, r: 12, t: 12, b: 12 } }));

            const severityOrder = ["Critical", "High", "Medium", "Low"];
            safeReact("risk-distribution", [{
                type: "bar",
                x: severityOrder,
                y: severityOrder.map((name) => totals.severity[name] || 0),
                hovertemplate: "%{x}: %{y}<extra></extra>"
            }], plotLayout());

            safeReact("monthly-trend", [{
                type: "scatter",
                mode: "lines+markers",
                x: monthly.map(([key]) => key),
                y: monthly.map(([, value]) => value),
                line: { width: 2 },
                marker: { size: 6 },
                fill: "tozeroy",
                hovertemplate: "%{x}<br>Events: %{y}<extra></extra>"
            }], plotLayout());

            const extensionData = [...totals.extensions.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);

            safeReact("file-extensions", [{
                type: "bar",
                orientation: "h",
                y: extensionData.map(([key]) => key).reverse(),
                x: extensionData.map(([, value]) => value).reverse(),
                hovertemplate: "%{y}: %{x}<extra></extra>"
            }], plotLayout({ margin: { l: 70, r: 18, t: 20, b: 38 } }));
        };

        const updateRecentTable = () => {
            if (!el.recentBody) return;
            const rows = state.totals.recent;
            if (!rows.length) {
                el.recentBody.innerHTML = '<tr class="soc-table-empty-row"><td colspan="5">Waiting for live events…</td></tr>';
                return;
            }

            el.recentBody.innerHTML = rows.map((event) => {
                const malicious = isTrue(event.is_malicious);
                const prediction = malicious ? "Malicious" : "Safe";
                const severity = event.severity || "Low";
                const filename = event.file_name || event.event_id || "Threat event";
                const timestamp = event.timestamp || "Live";
                const chip = malicious ? "soc-status-chip--critical" : "soc-status-chip--safe";
                const icon = malicious ? "fa-shield-virus" : "fa-circle-check";

                return `
                    <tr data-scan-row data-prediction="${malicious ? "malicious" : "safe"}" data-search-text="${escapeHtml(`${filename} ${prediction} ${severity}`.toLowerCase())}">
                        <td>
                            <div class="soc-file-cell">
                                <span class="soc-file-cell__icon"><i class="fa-solid fa-file-shield"></i></span>
                                <div>
                                    <strong>${escapeHtml(filename)}</strong>
                                    <small>${escapeHtml(event.attack_type || "Live threat telemetry")}</small>
                                </div>
                            </div>
                        </td>
                        <td><span class="soc-status-chip ${chip}"><i class="fa-solid ${icon}"></i> ${prediction}</span></td>
                        <td><span class="soc-risk-label" data-risk-value="${escapeHtml(severity)}"><span></span>${escapeHtml(severity)}</span></td>
                        <td><time>${escapeHtml(timestamp)}</time></td>
                        <td><span class="soc-live-row-indicator" title="Live dataset event"><i class="fa-solid fa-satellite-dish"></i></span></td>
                    </tr>`;
            }).join("");
        };

        const updateDashboard = (latestEvent = null) => {
            const t = state.totals;
            const threatRate = t.total ? (t.malicious / t.total) * 100 : 0;
            const avgConfidence = t.confidenceCount ? t.confidenceSum / t.confidenceCount : 0;
            const avgRisk = t.riskScoreCount ? t.riskScoreSum / t.riskScoreCount : 0;
            const health = clamp(100 - avgRisk, 0, 100);

            animateValue(el.totalEvents, formatInt(t.total));
            animateValue(el.safeEvents, formatInt(t.safe));
            animateValue(el.threatEvents, formatInt(t.malicious));
            animateValue(el.criticalEvents, formatInt(t.critical));

            if (el.threatRate) el.threatRate.textContent = `${threatRate.toFixed(1)}%`;
            if (el.activeThreats) el.activeThreats.textContent = formatInt(t.malicious);
            if (el.criticalThreats) el.criticalThreats.textContent = formatInt(t.critical);
            if (el.aiConfidence) el.aiConfidence.textContent = `${avgConfidence.toFixed(1)}%`;
            if (el.notificationCount) {
                el.notificationCount.textContent = formatInt(t.critical);
                el.notificationCount.hidden = false;
            }

            updatePosture(health);

            if (latestEvent) {
                const label = `${latestEvent.attack_type || "Threat event"} • ${latestEvent.severity || "Unknown"}`;
                if (el.latest) el.latest.textContent = label;
                if (el.lastEvent) el.lastEvent.textContent = latestEvent.timestamp || "Just now";
            }

            if (el.processed) el.processed.textContent = formatInt(state.index);
            if (el.total) el.total.textContent = formatInt(state.rows.length);

            const progress = state.rows.length ? (state.index / state.rows.length) * 100 : 0;
            if (el.progressBar) el.progressBar.style.width = `${progress}%`;
            if (el.progressTrack) el.progressTrack.setAttribute("aria-valuenow", String(Math.round(progress)));

            updateRecentTable();
            updateCharts();
        };

        const extensionOf = (filename) => {
            const match = String(filename || "").toLowerCase().match(/\.([a-z0-9]{1,10})$/i);
            return match ? `.${match[1]}` : "other";
        };

        const dateKeys = (timestamp) => {
            const raw = String(timestamp || "").trim();
            const date = new Date(raw);
            if (!Number.isNaN(date.getTime())) {
                const daily = date.toISOString().slice(0, 10);
                return { daily, monthly: daily.slice(0, 7) };
            }
            const daily = raw.slice(0, 10) || "Unknown";
            return { daily, monthly: daily.slice(0, 7) || "Unknown" };
        };

        const accumulate = (event) => {
            const t = state.totals;
            t.total += 1;

            const malicious = isTrue(event.is_malicious);
            if (malicious) t.malicious += 1;
            else t.safe += 1;

            const severityRaw = String(event.severity || "Low").trim();
            const severity = ["Critical", "High", "Medium", "Low"].find(
                (item) => item.toLowerCase() === severityRaw.toLowerCase()
            ) || "Low";
            t.severity[severity] += 1;
            if (severity === "Critical") t.critical += 1;

            const confidence = toNumber(event.ai_confidence, NaN);
            if (Number.isFinite(confidence)) {
                t.confidenceSum += confidence <= 1 ? confidence * 100 : confidence;
                t.confidenceCount += 1;
            }

            const riskScore = toNumber(event.risk_score, NaN);
            if (Number.isFinite(riskScore)) {
                t.riskScoreSum += riskScore;
                t.riskScoreCount += 1;
            }

            const keys = dateKeys(event.timestamp);
            t.daily.set(keys.daily, (t.daily.get(keys.daily) || 0) + 1);
            t.monthly.set(keys.monthly, (t.monthly.get(keys.monthly) || 0) + 1);

            const ext = extensionOf(event.file_name);
            t.extensions.set(ext, (t.extensions.get(ext) || 0) + 1);

            t.recent.unshift(event);
            if (t.recent.length > 8) t.recent.length = 8;
        };

        const stopTimer = () => {
            if (state.timer) window.clearInterval(state.timer);
            state.timer = null;
            state.running = false;
        };

        const updateStartButton = () => {
            if (!el.start) return;
            const icon = el.start.querySelector("i");
            const label = el.start.querySelector("span");
            if (state.running) {
                if (icon) icon.className = "fa-solid fa-pause";
                if (label) label.textContent = "Pause Feed";
            } else {
                if (icon) icon.className = "fa-solid fa-play";
                if (label) label.textContent = state.index > 0 && state.index < state.rows.length ? "Resume Feed" : "Start Feed";
            }
        };

        const finish = () => {
            stopTimer();
            updateStartButton();
            setState("complete", "COMPLETE", `Finished processing ${formatInt(state.rows.length)} real dataset events.`);
            if (el.start) el.start.disabled = true;
        };

        const tick = () => {
            if (!state.running || state.index >= state.rows.length) {
                if (state.index >= state.rows.length && state.rows.length) finish();
                return;
            }

            const event = state.rows[state.index];
            state.index += 1;
            accumulate(event);
            updateDashboard(event);
        };

        const startFeed = () => {
            if (!state.rows.length || state.index >= state.rows.length) return;
            stopTimer();
            state.running = true;
            updateStartButton();
            setState("running", "LIVE", `Streaming ${state.fileName} using actual CSV rows.`);

            const rate = Math.max(1, toNumber(el.rate?.value, 5));
            const delay = Math.max(80, Math.round(1000 / rate));
            tick();
            state.timer = window.setInterval(tick, delay);
        };

        const pauseFeed = () => {
            stopTimer();
            updateStartButton();
            setState("paused", "PAUSED", `Feed paused at event ${formatInt(state.index)} of ${formatInt(state.rows.length)}.`);
        };

        const resetFeed = () => {
            stopTimer();
            state.index = 0;
            state.totals = emptyTotals();
            updateStartButton();
            if (el.start) el.start.disabled = !state.rows.length;
            if (el.reset) el.reset.disabled = !state.rows.length;
            if (el.latest) el.latest.textContent = "No event received";
            if (el.lastEvent) el.lastEvent.textContent = "Waiting for feed";
            setState(state.rows.length ? "ready" : "standby", state.rows.length ? "READY" : "STANDBY", state.rows.length ? `${formatInt(state.rows.length)} events loaded and ready.` : "Load the threat CSV to begin a real-data dashboard simulation.");
            updateDashboard();
        };

        const validateRows = (rows) => {
            if (!rows.length) return "The selected CSV contains no data rows.";
            const required = ["timestamp", "severity", "risk_score", "ai_confidence", "is_malicious"];
            const available = new Set(Object.keys(rows[0]));
            const missing = required.filter((key) => !available.has(key));
            return missing.length ? `Missing required columns: ${missing.join(", ")}` : "";
        };

        const loadFile = async (file) => {
            if (!file) return;
            stopTimer();
            setState("loading", "LOADING", `Reading ${file.name}…`);

            try {
                const text = await file.text();
                const rows = parseCsv(text);
                const error = validateRows(rows);
                if (error) throw new Error(error);

                state.rows = rows;
                state.fileName = file.name;
                state.index = 0;
                state.totals = emptyTotals();

                if (el.start) el.start.disabled = false;
                if (el.reset) el.reset.disabled = false;
                if (el.total) el.total.textContent = formatInt(rows.length);
                if (el.processed) el.processed.textContent = "0";
                if (el.progressBar) el.progressBar.style.width = "0%";
                if (el.progressTrack) el.progressTrack.setAttribute("aria-valuenow", "0");
                if (el.latest) el.latest.textContent = "Dataset ready — press Start Feed";

                updateStartButton();
                setState("ready", "READY", `${formatInt(rows.length)} real threat events loaded from ${file.name}.`);
                updateDashboard();
            } catch (error) {
                console.error("[Live Feed] Dataset load failed.", error);
                state.rows = [];
                if (el.start) el.start.disabled = true;
                if (el.reset) el.reset.disabled = true;
                setState("error", "ERROR", error.message || "Unable to read the selected CSV.");
            }
        };

        el.load?.addEventListener("click", () => el.file?.click());
        el.file?.addEventListener("change", () => loadFile(el.file.files?.[0]));
        el.start?.addEventListener("click", () => state.running ? pauseFeed() : startFeed());
        el.reset?.addEventListener("click", resetFeed);
        el.rate?.addEventListener("change", () => {
            if (state.running) startFeed();
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden && state.running) pauseFeed();
        });

        setState("standby", "STANDBY", "Load the threat CSV to begin a real-data dashboard simulation.");
        updateStartButton();
        console.info("[SOC Dashboard] Live threat CSV playback engine ready.");
    });
})();
