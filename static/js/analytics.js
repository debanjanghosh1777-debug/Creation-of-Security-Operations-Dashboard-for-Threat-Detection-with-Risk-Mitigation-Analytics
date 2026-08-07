/**
 * =============================================================================
 * CYBERSHIELD AI — THREAT ANALYTICS LAB
 * Advanced Interactive Analytics Controller
 *
 * File:
 * static/js/analytics.js
 *
 * Works with:
 * templates/analytics.html
 * static/css/analytics.css
 *
 * IMPORTANT:
 * - Runs ONLY when #analyticsPage exists.
 * - Does not modify the database.
 * - Does not modify scan records.
 * - Does not modify Flask routes.
 * - Does not affect Dashboard, Upload, History, Users or Chatbot.
 * =============================================================================
 */

(() => {

    "use strict";


    /* =========================================================================
       01. PAGE GUARD
       ========================================================================= */

    const page = document.getElementById("analyticsPage");

    if (!page) {
        return;
    }


    /* =========================================================================
       02. ENVIRONMENT
       ========================================================================= */

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    ).matches;


    /* =========================================================================
       03. HELPERS
       ========================================================================= */

    const qs = (selector, root = document) => {

        return root.querySelector(selector);

    };


    const qsa = (selector, root = document) => {

        return Array.from(
            root.querySelectorAll(selector)
        );

    };


    const clamp = (value, min, max) => {

        return Math.min(
            Math.max(value, min),
            max
        );

    };


    const number = (value, fallback = 0) => {

        const parsed = Number(value);

        return Number.isFinite(parsed)
            ? parsed
            : fallback;

    };


    const round = (value, decimals = 1) => {

        const factor = 10 ** decimals;

        return Math.round(
            (value + Number.EPSILON) * factor
        ) / factor;

    };


    const wait = (ms) => {

        return new Promise(resolve => {

            window.setTimeout(resolve, ms);

        });

    };


    const cssVariable = (name, fallback) => {

        const value = getComputedStyle(page)
            .getPropertyValue(name)
            .trim();

        return value || fallback;

    };


    const formatNumber = (
        value,
        decimals = 0
    ) => {

        return Number(value).toLocaleString(
            undefined,
            {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }
        );

    };


    const isEditableElement = element => {

        if (!element) {
            return false;
        }

        const tag =
            element.tagName?.toLowerCase();

        return (
            tag === "input" ||
            tag === "textarea" ||
            tag === "select" ||
            element.isContentEditable
        );

    };


    /* =========================================================================
       04. REAL ANALYTICS DATA FROM HTML
       ========================================================================= */

    const analytics = Object.freeze({

        total: number(
            page.dataset.totalScans
        ),

        safe: number(
            page.dataset.safeFiles
        ),

        malicious: number(
            page.dataset.maliciousFiles
        ),

        critical: number(
            page.dataset.criticalThreats
        ),

        noncritical: number(
            page.dataset.noncriticalThreats
        ),

        score: clamp(
            number(
                page.dataset.securityScore
            ),
            0,
            100
        ),

        safePercentage: clamp(
            number(
                page.dataset.safePercentage
            ),
            0,
            100
        ),

        threatPercentage: clamp(
            number(
                page.dataset.threatPercentage
            ),
            0,
            100
        ),

        criticalPercentage: clamp(
            number(
                page.dataset.criticalPercentage
            ),
            0,
            100
        ),

        criticalShare: clamp(
            number(
                page.dataset.criticalShare
            ),
            0,
            100
        ),

        operator:
            page.dataset.operator ||
            "Operator"

    });


    /* =========================================================================
       05. ELEMENT REGISTRY
       ========================================================================= */

    const elements = {

        clock:
            document.getElementById(
                "analyticsLocalClock"
            ),

        date:
            document.getElementById(
                "analyticsLocalDate"
            ),

        accessibility:
            document.getElementById(
                "analyticsAccessibilityStatus"
            ),

        toastRegion:
            document.getElementById(
                "analyticsToastRegion"
            ),

        meshCanvas:
            document.getElementById(
                "analyticsMeshCanvas"
            ),

        signalCanvas:
            document.getElementById(
                "analyticsSignalCanvas"
            ),

        cursorLight:
            document.getElementById(
                "analyticsCursorLight"
            ),

        scoreCore:
            qs(
                ".anlx-decision-core",
                page
            ),

        scoreNumber:
            qs(
                ".anlx-decision-core__center > strong",
                page
            ),

        ticker:
            document.getElementById(
                "analyticsTicker"
            ),

        planner:
            document.getElementById(
                "responsePlanner"
            ),

        plannerForm:
            document.getElementById(
                "analyticsPlannerForm"
            ),

        analystCount:
            document.getElementById(
                "analyticsAnalystCount"
            ),

        analystCountValue:
            document.getElementById(
                "analyticsAnalystCountValue"
            ),

        threatMinutes:
            document.getElementById(
                "analyticsThreatMinutes"
            ),

        threatMinutesValue:
            document.getElementById(
                "analyticsThreatMinutesValue"
            ),

        criticalMinutes:
            document.getElementById(
                "analyticsCriticalMinutes"
            ),

        criticalMinutesValue:
            document.getElementById(
                "analyticsCriticalMinutesValue"
            ),

        dailyCapacity:
            document.getElementById(
                "analyticsDailyCapacity"
            ),

        dailyCapacityValue:
            document.getElementById(
                "analyticsDailyCapacityValue"
            ),

        plannerReset:
            document.getElementById(
                "analyticsPlannerReset"
            ),

        estimatedHours:
            document.getElementById(
                "analyticsEstimatedHours"
            ),

        estimatedDays:
            document.getElementById(
                "analyticsEstimatedDays"
            ),

        recordsPerAnalyst:
            document.getElementById(
                "analyticsRecordsPerAnalyst"
            ),

        projectedClearance:
            document.getElementById(
                "analyticsProjectedClearance"
            )

    };


    /* =========================================================================
       06. ACCESSIBILITY ANNOUNCEMENT SYSTEM
       ========================================================================= */

    let announcementTimer = null;


    function announce(message) {

        if (
            !elements.accessibility ||
            !message
        ) {
            return;
        }

        window.clearTimeout(
            announcementTimer
        );

        elements.accessibility.textContent =
            "";

        announcementTimer =
            window.setTimeout(
                () => {

                    elements.accessibility
                        .textContent =
                        message;

                },
                50
            );

    }


    /* =========================================================================
       07. ADVANCED TOAST SYSTEM
       ========================================================================= */

    function showToast(
        message,
        options = {}
    ) {

        if (
            !elements.toastRegion ||
            !message
        ) {
            return;
        }


        const {

            title =
                "Threat Analytics Lab",

            tone =
                "info",

            timeout =
                3200

        } = options;


        const palette = {

            info: {
                accent:
                    cssVariable(
                        "--anlx-cyan",
                        "#59d8df"
                    ),
                border:
                    "rgba(89,216,223,.32)"
            },

            success: {
                accent:
                    cssVariable(
                        "--anlx-teal",
                        "#62d9b0"
                    ),
                border:
                    "rgba(98,217,176,.32)"
            },

            warning: {
                accent:
                    cssVariable(
                        "--anlx-amber",
                        "#ffc86d"
                    ),
                border:
                    "rgba(255,200,109,.34)"
            },

            critical: {
                accent:
                    cssVariable(
                        "--anlx-critical",
                        "#ff4f6f"
                    ),
                border:
                    "rgba(255,79,111,.40)"
            }

        };


        const color =
            palette[tone] ||
            palette.info;


        const toast =
            document.createElement(
                "article"
            );


        toast.setAttribute(
            "role",
            "status"
        );


        Object.assign(
            toast.style,
            {

                position:
                    "relative",

                display:
                    "grid",

                gridTemplateColumns:
                    "auto minmax(0,1fr) auto",

                alignItems:
                    "center",

                gap:
                    "11px",

                padding:
                    "12px 14px",

                border:
                    `1px solid ${color.border}`,

                borderRadius:
                    "14px",

                color:
                    cssVariable(
                        "--anlx-text",
                        "#d9ebf0"
                    ),

                background:
                    "linear-gradient(145deg,rgba(8,31,42,.97),rgba(2,13,21,.99))",

                boxShadow:
                    "0 20px 55px rgba(0,0,0,.46)",

                backdropFilter:
                    "blur(18px)",

                WebkitBackdropFilter:
                    "blur(18px)",

                overflow:
                    "hidden",

                pointerEvents:
                    "auto"

            }
        );


        const accent =
            document.createElement(
                "span"
            );


        Object.assign(
            accent.style,
            {

                position:
                    "absolute",

                top:
                    "0",

                bottom:
                    "0",

                left:
                    "0",

                width:
                    "2px",

                background:
                    color.accent,

                boxShadow:
                    `0 0 18px ${color.accent}`

            }
        );


        const icon =
            document.createElement(
                "span"
            );


        icon.innerHTML =
            '<i class="fa-solid fa-wave-square"></i>';


        Object.assign(
            icon.style,
            {

                display:
                    "grid",

                width:
                    "31px",

                height:
                    "31px",

                placeItems:
                    "center",

                border:
                    `1px solid ${color.border}`,

                borderRadius:
                    "9px",

                color:
                    color.accent,

                background:
                    "rgba(255,255,255,.025)"

            }
        );


        const copy =
            document.createElement(
                "div"
            );


        const strong =
            document.createElement(
                "strong"
            );


        strong.textContent =
            title;


        Object.assign(
            strong.style,
            {

                display:
                    "block",

                color:
                    cssVariable(
                        "--anlx-white",
                        "#f5ffff"
                    ),

                fontSize:
                    "9px",

                fontWeight:
                    "800"

            }
        );


        const paragraph =
            document.createElement(
                "p"
            );


        paragraph.textContent =
            message;


        Object.assign(
            paragraph.style,
            {

                margin:
                    "3px 0 0",

                color:
                    cssVariable(
                        "--anlx-text-muted",
                        "#8eadb7"
                    ),

                fontSize:
                    "8px",

                lineHeight:
                    "1.5"

            }
        );


        copy.append(
            strong,
            paragraph
        );


        const close =
            document.createElement(
                "button"
            );


        close.type =
            "button";


        close.setAttribute(
            "aria-label",
            "Dismiss notification"
        );


        close.innerHTML =
            '<i class="fa-solid fa-xmark"></i>';


        Object.assign(
            close.style,
            {

                display:
                    "grid",

                width:
                    "27px",

                height:
                    "27px",

                padding:
                    "0",

                placeItems:
                    "center",

                border:
                    "1px solid rgba(255,255,255,.09)",

                borderRadius:
                    "8px",

                color:
                    "#8eadb7",

                background:
                    "rgba(255,255,255,.025)",

                cursor:
                    "pointer"

            }
        );


        toast.append(
            accent,
            icon,
            copy,
            close
        );


        elements.toastRegion
            .appendChild(
                toast
            );


        if (
            !reducedMotion &&
            toast.animate
        ) {

            toast.animate(
                [

                    {
                        opacity:
                            0,

                        transform:
                            "translateX(30px) scale(.96)"
                    },

                    {
                        opacity:
                            1,

                        transform:
                            "translateX(0) scale(1)"
                    }

                ],
                {

                    duration:
                        330,

                    easing:
                        "cubic-bezier(.16,1,.3,1)"

                }
            );

        }


        async function removeToast() {

            if (
                !toast.isConnected
            ) {
                return;
            }


            if (
                !reducedMotion &&
                toast.animate
            ) {

                const animation =
                    toast.animate(
                        [

                            {
                                opacity:
                                    1,

                                transform:
                                    "translateX(0)"
                            },

                            {
                                opacity:
                                    0,

                                transform:
                                    "translateX(24px)"
                            }

                        ],
                        {

                            duration:
                                200,

                            easing:
                                "ease",

                            fill:
                                "forwards"

                        }
                    );


                try {

                    await animation.finished;

                } catch {

                }

            }


            toast.remove();

        }


        close.addEventListener(
            "click",
            removeToast
        );


        if (
            timeout > 0
        ) {

            window.setTimeout(
                removeToast,
                timeout
            );

        }


        announce(
            `${title}. ${message}`
        );

    }


    /* =========================================================================
       08. LIVE CLOCK
       ========================================================================= */

    let clockTimer = null;


    const timeFormatter =
        new Intl.DateTimeFormat(
            undefined,
            {

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    false

            }
        );


    const dateFormatter =
        new Intl.DateTimeFormat(
            undefined,
            {

                weekday:
                    "short",

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"

            }
        );


    function updateClock() {

        const now =
            new Date();


        if (
            elements.clock
        ) {

            elements.clock.textContent =
                timeFormatter.format(
                    now
                );

        }


        if (
            elements.date
        ) {

            elements.date.textContent =
                dateFormatter.format(
                    now
                );

        }

    }


    function startClock() {

        updateClock();


        window.clearInterval(
            clockTimer
        );


        clockTimer =
            window.setInterval(
                updateClock,
                1000
            );

    }


    /* =========================================================================
       09. GENERIC NUMBER ANIMATOR
       ========================================================================= */

    function animateValue(
        node,
        target,
        options = {}
    ) {

        if (!node) {
            return;
        }


        const {

            decimals = 0,

            suffix = "",

            prefix = "",

            duration = 900

        } = options;


        const finalValue =
            number(target);


        if (
            reducedMotion ||
            duration <= 0
        ) {

            node.textContent =
                `${prefix}${formatNumber(
                    finalValue,
                    decimals
                )}${suffix}`;

            return;

        }


        const start =
            performance.now();


        function frame(now) {

            const progress =
                clamp(
                    (now - start) /
                    duration,
                    0,
                    1
                );


            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    4
                );


            const current =
                finalValue *
                eased;


            node.textContent =
                `${prefix}${formatNumber(
                    current,
                    decimals
                )}${suffix}`;


            if (
                progress < 1
            ) {

                requestAnimationFrame(
                    frame
                );

            } else {

                node.textContent =
                    `${prefix}${formatNumber(
                        finalValue,
                        decimals
                    )}${suffix}`;

            }

        }


        requestAnimationFrame(
            frame
        );

    }


    /* =========================================================================
       10. SECURITY SCORE ANIMATION
       ========================================================================= */

    function animateSecurityScore() {

        const score =
            elements.scoreNumber;


        if (!score) {
            return;
        }


        const textNode =
            Array.from(
                score.childNodes
            ).find(
                node =>
                    node.nodeType ===
                    Node.TEXT_NODE
            );


        if (!textNode) {
            return;
        }


        const target =
            Math.round(
                analytics.score
            );


        if (
            reducedMotion
        ) {

            textNode.nodeValue =
                `${target} `;

            return;

        }


        const start =
            performance.now();


        function frame(now) {

            const progress =
                clamp(
                    (now - start) /
                    1100,
                    0,
                    1
                );


            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    4
                );


            const current =
                Math.round(
                    target *
                    eased
                );


            textNode.nodeValue =
                `${current} `;


            if (
                progress < 1
            ) {

                requestAnimationFrame(
                    frame
                );

            } else {

                textNode.nodeValue =
                    `${target} `;

            }

        }


        requestAnimationFrame(
            frame
        );

    }


    /* =========================================================================
       11. ANALYTICS COUNTERS
       ========================================================================= */

    function animateAnalyticsCounters() {

        qsa(
            "[data-counter-decimal]",
            page
        ).forEach(
            counter => {

                const target =
                    number(
                        counter.dataset
                            .counterDecimal
                    );


                animateValue(
                    counter,
                    target,
                    {

                        decimals:
                            Number.isInteger(
                                target
                            )
                                ? 0
                                : 1,

                        suffix:
                            "%",

                        duration:
                            950

                    }
                );

            }
        );


        const evidence =
            qs(
                ".anlx-ratio-card--evidence .anlx-ratio-card__value",
                page
            );


        animateValue(
            evidence,
            analytics.total,
            {
                duration:
                    850
            }
        );


        const funnelValues = {

            total:
                analytics.total,

            malicious:
                analytics.malicious,

            critical:
                analytics.critical

        };


        qsa(
            "[data-funnel-stage]",
            page
        ).forEach(
            stage => {

                const key =
                    stage.dataset
                        .funnelStage;


                const count =
                    qs(
                        ".anlx-funnel-stage__content > strong",
                        stage
                    );


                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            funnelValues,
                            key
                        )
                ) {

                    animateValue(
                        count,
                        funnelValues[key],
                        {
                            duration:
                                900
                        }
                    );

                }

            }
        );


        const queueValues = {

            "1":
                analytics.critical,

            "2":
                analytics.noncritical,

            "3":
                analytics.safe

        };


        qsa(
            "[data-queue-priority]",
            page
        ).forEach(
            card => {

                const key =
                    card.dataset
                        .queuePriority;


                const count =
                    qs(
                        ".anlx-queue-card__content > strong",
                        card
                    );


                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            queueValues,
                            key
                        )
                ) {

                    animateValue(
                        count,
                        queueValues[key],
                        {
                            duration:
                                900
                        }
                    );

                }

            }
        );


        animateSecurityScore();

    }


    /* =========================================================================
       12. QUEUE PROGRESS ANIMATION
       ========================================================================= */

    function animateProgressBars() {

        qsa(
            ".anlx-queue-summary progress",
            page
        ).forEach(
            progress => {

                const target =
                    number(
                        progress.getAttribute(
                            "value"
                        )
                    );


                if (
                    reducedMotion
                ) {

                    progress.value =
                        target;

                    return;

                }


                progress.value =
                    0;


                const start =
                    performance.now();


                function frame(now) {

                    const percent =
                        clamp(
                            (now - start) /
                            900,
                            0,
                            1
                        );


                    const eased =
                        1 -
                        Math.pow(
                            1 - percent,
                            3
                        );


                    progress.value =
                        target *
                        eased;


                    if (
                        percent < 1
                    ) {

                        requestAnimationFrame(
                            frame
                        );

                    } else {

                        progress.value =
                            target;

                    }

                }


                requestAnimationFrame(
                    frame
                );

            }
        );

    }


    /* =========================================================================
       13. SECTION REVEALS
       ========================================================================= */

    function setupSectionAnimations() {

        const sections =
            qsa(
                [
                    ".anlx-hero",
                    ".anlx-section",
                    ".anlx-footer"
                ].join(","),
                page
            );


        if (
            reducedMotion ||
            !(
                "IntersectionObserver"
                in window
            )
        ) {

            return;

        }


        sections
            .slice(1)
            .forEach(
                section => {

                    section.style.opacity =
                        "0";

                    section.style.transform =
                        "translateY(14px)";

                    section.style.transition =
                        "opacity 520ms ease, transform 650ms cubic-bezier(.16,1,.3,1)";

                }
            );


        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(
                        entry => {

                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }


                            entry.target
                                .style.opacity =
                                "1";


                            entry.target
                                .style.transform =
                                "translateY(0)";


                            observer.unobserve(
                                entry.target
                            );

                        }
                    );

                },
                {

                    threshold:
                        0.08,

                    rootMargin:
                        "0px 0px -7% 0px"

                }
            );


        sections
            .slice(1)
            .forEach(
                section => {

                    observer.observe(
                        section
                    );

                }
            );

    }


    /* =========================================================================
       14. SMOOTH INTERNAL NAVIGATION
       ========================================================================= */

    function setupSmoothNavigation() {

        qsa(
            'a[href^="#"]',
            page
        ).forEach(
            link => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !href ||
                    href === "#"
                ) {
                    return;
                }


                link.addEventListener(
                    "click",
                    event => {

                        const target =
                            document.querySelector(
                                href
                            );


                        if (!target) {
                            return;
                        }


                        event.preventDefault();


                        target.scrollIntoView(
                            {

                                behavior:
                                    reducedMotion
                                        ? "auto"
                                        : "smooth",

                                block:
                                    "start"

                            }
                        );


                        window.setTimeout(
                            () => {

                                target.setAttribute(
                                    "tabindex",
                                    "-1"
                                );


                                target.focus(
                                    {
                                        preventScroll:
                                            true
                                    }
                                );


                                window.setTimeout(
                                    () => {

                                        target.removeAttribute(
                                            "tabindex"
                                        );

                                    },
                                    800
                                );

                            },
                            reducedMotion
                                ? 0
                                : 400
                        );


                        const heading =
                            qs(
                                "h2",
                                target
                            );


                        announce(
                            heading
                                ?.textContent
                                ?.trim() ||
                            "Analytics section opened"
                        );

                    }
                );

            }
        );

    }


    /* =========================================================================
       15. SERVER ALERT DISMISS
       ========================================================================= */

    function setupAlerts() {

        qsa(
            "[data-dismiss-analytics-alert]",
            page
        ).forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const alert =
                            button.closest(
                                "[data-analytics-alert]"
                            );


                        if (!alert) {
                            return;
                        }


                        if (
                            !reducedMotion &&
                            alert.animate
                        ) {

                            const animation =
                                alert.animate(
                                    [

                                        {
                                            opacity:
                                                1,

                                            transform:
                                                "translateX(0)"
                                        },

                                        {
                                            opacity:
                                                0,

                                            transform:
                                                "translateX(25px)"
                                        }

                                    ],
                                    {

                                        duration:
                                            250,

                                        easing:
                                            "ease",

                                        fill:
                                            "forwards"

                                    }
                                );


                            try {

                                await animation.finished;

                            } catch {

                            }

                        }


                        alert.remove();


                        announce(
                            "Analytics notification dismissed."
                        );

                    }
                );

            }
        );

    }


    /* =========================================================================
       16. REFRESH ANALYTICS BUTTON
       ========================================================================= */

    function setupRefreshButton() {

        const refresh =
            qs(
                'a[aria-label="Refresh analytics"]',
                page
            );


        if (!refresh) {
            return;
        }


        refresh.addEventListener(
            "click",
            async event => {

                event.preventDefault();


                if (
                    refresh.getAttribute(
                        "aria-busy"
                    ) === "true"
                ) {
                    return;
                }


                refresh.setAttribute(
                    "aria-busy",
                    "true"
                );


                const icon =
                    qs(
                        "i",
                        refresh
                    );


                if (
                    icon &&
                    icon.animate &&
                    !reducedMotion
                ) {

                    icon.animate(
                        [

                            {
                                transform:
                                    "rotate(0deg)"
                            },

                            {
                                transform:
                                    "rotate(360deg)"
                            }

                        ],
                        {

                            duration:
                                550,

                            iterations:
                                Infinity,

                            easing:
                                "linear"

                        }
                    );

                }


                showToast(
                    "Synchronizing the latest stored scan evidence.",
                    {

                        title:
                            "Refreshing analytics",

                        tone:
                            "info",

                        timeout:
                            1500

                    }
                );


                await wait(
                    reducedMotion
                        ? 50
                        : 350
                );


                window.location.assign(
                    refresh.href
                );

            }
        );

    }


    /* =========================================================================
       17. ACTION LINK FEEDBACK
       ========================================================================= */

    function setupNavigationFeedback() {

        qsa(
            'a[href*="history"]',
            page
        ).forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        showToast(
                            "Opening stored scan evidence for detailed investigation.",
                            {

                                title:
                                    "Scan History",

                                tone:
                                    "info",

                                timeout:
                                    900

                            }
                        );

                    }
                );

            }
        );


        qsa(
            'a[href*="upload"]',
            page
        ).forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        showToast(
                            "Opening the AI file-analysis workspace.",
                            {

                                title:
                                    "New Analysis",

                                tone:
                                    "success",

                                timeout:
                                    900

                            }
                        );

                    }
                );

            }
        );


        qsa(
            ".anlx-export-card",
            page
        ).forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        const name =
                            qs(
                                "strong",
                                link
                            )
                                ?.textContent
                                ?.trim() ||
                            "Report export";


                        showToast(
                            `${name} request started.`,
                            {

                                title:
                                    "Reporting Center",

                                tone:
                                    "success",

                                timeout:
                                    1700

                            }
                        );

                    }
                );

            }
        );

    }


    /* =========================================================================
       18. RESPONSE PLANNER CONFIGURATION
       ========================================================================= */

    const PLANNER_STORAGE =
        "cybershield_analytics_planner_v1";


    const plannerDefaults =
        Object.freeze(
            {

                analysts:
                    2,

                threatMinutes:
                    20,

                criticalMinutes:
                    45,

                dailyHours:
                    8

            }
        );


    function plannerExists() {

        return Boolean(

            elements.analystCount &&

            elements.threatMinutes &&

            elements.criticalMinutes &&

            elements.dailyCapacity &&

            elements.estimatedHours &&

            elements.estimatedDays &&

            elements.recordsPerAnalyst &&

            elements.projectedClearance

        );

    }


    function readPlanner() {

        if (
            !plannerExists()
        ) {

            return {
                ...plannerDefaults
            };

        }


        return {

            analysts:
                clamp(
                    number(
                        elements
                            .analystCount
                            .value,
                        2
                    ),
                    1,
                    20
                ),

            threatMinutes:
                clamp(
                    number(
                        elements
                            .threatMinutes
                            .value,
                        20
                    ),
                    5,
                    120
                ),

            criticalMinutes:
                clamp(
                    number(
                        elements
                            .criticalMinutes
                            .value,
                        45
                    ),
                    15,
                    240
                ),

            dailyHours:
                clamp(
                    number(
                        elements
                            .dailyCapacity
                            .value,
                        8
                    ),
                    1,
                    12
                )

        };

    }


    function savePlanner(
        values
    ) {

        try {

            sessionStorage.setItem(
                PLANNER_STORAGE,
                JSON.stringify(
                    values
                )
            );

        } catch {

        }

    }


    function restorePlanner() {

        if (
            !plannerExists()
        ) {
            return;
        }


        let saved =
            null;


        try {

            saved =
                JSON.parse(
                    sessionStorage.getItem(
                        PLANNER_STORAGE
                    )
                );

        } catch {

            saved =
                null;

        }


        const values =
            {

                ...plannerDefaults,

                ...(
                    saved &&
                    typeof saved ===
                        "object"
                        ? saved
                        : {}
                )

            };


        elements.analystCount.value =
            clamp(
                number(
                    values.analysts,
                    2
                ),
                1,
                20
            );


        elements.threatMinutes.value =
            clamp(
                number(
                    values.threatMinutes,
                    20
                ),
                5,
                120
            );


        elements.criticalMinutes.value =
            clamp(
                number(
                    values.criticalMinutes,
                    45
                ),
                15,
                240
            );


        elements.dailyCapacity.value =
            clamp(
                number(
                    values.dailyHours,
                    8
                ),
                1,
                12
            );

    }


    /* =========================================================================
       19. RANGE VISUALS
       ========================================================================= */

    function updateRange(
        input,
        output
    ) {

        if (
            !input ||
            !output
        ) {
            return;
        }


        output.textContent =
            input.value;


        const min =
            number(
                input.min
            );


        const max =
            number(
                input.max,
                100
            );


        const value =
            number(
                input.value
            );


        const percentage =
            max > min
                ? (
                    (
                        value -
                        min
                    ) /
                    (
                        max -
                        min
                    )
                ) * 100
                : 0;


        input.style.setProperty(
            "--anlx-range-progress",
            `${clamp(
                percentage,
                0,
                100
            )}%`
        );


        input.setAttribute(
            "aria-valuetext",
            String(value)
        );

    }


    /* =========================================================================
       20. BUSINESS DAY CALCULATOR
       ========================================================================= */

    function addBusinessDays(
        date,
        days
    ) {

        const result =
            new Date(date);


        let remaining =
            Math.max(
                0,
                Math.ceil(days)
            );


        while (
            remaining > 0
        ) {

            result.setDate(
                result.getDate() +
                1
            );


            const day =
                result.getDay();


            if (
                day !== 0 &&
                day !== 6
            ) {

                remaining--;

            }

        }


        return result;

    }


    function formatClearanceDate(
        date
    ) {

        return new Intl.DateTimeFormat(
            undefined,
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"

            }
        ).format(
            date
        );

    }


    /* =========================================================================
       21. PLANNER RESULTS ANIMATION
       ========================================================================= */

    function animatePlannerResults() {

        if (
            reducedMotion
        ) {
            return;
        }


        qsa(
            ".anlx-planner-results article",
            page
        ).forEach(
            (card, index) => {

                if (
                    !card.animate
                ) {
                    return;
                }


                card.animate(
                    [

                        {
                            opacity:
                                0.7,

                            transform:
                                "translateY(4px) scale(.99)"
                        },

                        {
                            opacity:
                                1,

                            transform:
                                "translateY(0) scale(1)"
                        }

                    ],
                    {

                        duration:
                            280,

                        delay:
                            index * 30,

                        easing:
                            "cubic-bezier(.16,1,.3,1)"

                    }
                );

            }
        );

    }


    /* =========================================================================
       22. RESPONSE PLANNER CALCULATION
       ========================================================================= */

    function calculatePlanner(
        options = {}
    ) {

        if (
            !plannerExists()
        ) {
            return;
        }


        const {

            announceResult =
                false,

            animate =
                true

        } = options;


        const values =
            readPlanner();


        updateRange(
            elements.analystCount,
            elements.analystCountValue
        );


        updateRange(
            elements.threatMinutes,
            elements.threatMinutesValue
        );


        updateRange(
            elements.criticalMinutes,
            elements.criticalMinutesValue
        );


        updateRange(
            elements.dailyCapacity,
            elements.dailyCapacityValue
        );


        const standardMinutes =

            analytics.noncritical *

            values.threatMinutes;


        const criticalMinutes =

            analytics.critical *

            values.criticalMinutes;


        const totalMinutes =

            standardMinutes +

            criticalMinutes;


        const reviewHours =

            totalMinutes /
            60;


        const teamDailyHours =

            values.analysts *

            values.dailyHours;


        const workdays =

            teamDailyHours > 0

                ? reviewHours /
                    teamDailyHours

                : 0;


        const recordsPerAnalyst =

            values.analysts > 0

                ? analytics.malicious /
                    values.analysts

                : 0;


        let clearanceDate =
            null;


        if (
            analytics.malicious > 0
        ) {

            clearanceDate =
                addBusinessDays(
                    new Date(),
                    Math.max(
                        1,
                        Math.ceil(
                            workdays
                        )
                    )
                );

        }


        elements.estimatedHours
            .textContent =

            analytics.malicious > 0

                ? `${formatNumber(
                    reviewHours,
                    1
                )} h`

                : "0.0 h";


        elements.estimatedDays
            .textContent =

            analytics.malicious > 0

                ? `${formatNumber(
                    workdays,
                    1
                )} day${
                    round(
                        workdays,
                        1
                    ) === 1
                        ? ""
                        : "s"
                }`

                : "0.0 days";


        elements.recordsPerAnalyst
            .textContent =

            analytics.malicious > 0

                ? `${formatNumber(
                    recordsPerAnalyst,
                    1
                )} avg`

                : "0";


        elements.projectedClearance
            .textContent =

            clearanceDate

                ? formatClearanceDate(
                    clearanceDate
                )

                : "Queue clear";


        elements.estimatedHours.title =

            `${analytics.noncritical} standard reviews × ` +

            `${values.threatMinutes} min + ` +

            `${analytics.critical} critical reviews × ` +

            `${values.criticalMinutes} min`;


        elements.estimatedDays.title =

            `${values.analysts} analyst(s) × ` +

            `${values.dailyHours} working hours/day`;


        savePlanner(
            values
        );


        if (
            animate
        ) {

            animatePlannerResults();

        }


        if (
            announceResult
        ) {

            announce(

                `Response planner updated. ` +

                `Estimated review time ` +

                `${formatNumber(
                    reviewHours,
                    1
                )} hours and ` +

                `${formatNumber(
                    workdays,
                    1
                )} workdays.`

            );

        }

    }


    /* =========================================================================
       23. RESPONSE PLANNER EVENTS
       ========================================================================= */

    function setupPlanner() {

        if (
            !plannerExists()
        ) {
            return;
        }


        restorePlanner();


        const inputs = [

            elements.analystCount,

            elements.threatMinutes,

            elements.criticalMinutes,

            elements.dailyCapacity

        ];


        inputs.forEach(
            input => {

                input.addEventListener(
                    "input",
                    () => {

                        calculatePlanner(
                            {

                                announceResult:
                                    false,

                                animate:
                                    false

                            }
                        );

                    }
                );


                input.addEventListener(
                    "change",
                    () => {

                        calculatePlanner(
                            {

                                announceResult:
                                    true,

                                animate:
                                    true

                            }
                        );

                    }
                );

            }
        );


        if (
            elements.plannerReset
        ) {

            elements.plannerReset
                .addEventListener(
                    "click",
                    () => {

                        elements
                            .analystCount
                            .value =

                            plannerDefaults
                                .analysts;


                        elements
                            .threatMinutes
                            .value =

                            plannerDefaults
                                .threatMinutes;


                        elements
                            .criticalMinutes
                            .value =

                            plannerDefaults
                                .criticalMinutes;


                        elements
                            .dailyCapacity
                            .value =

                            plannerDefaults
                                .dailyHours;


                        try {

                            sessionStorage
                                .removeItem(
                                    PLANNER_STORAGE
                                );

                        } catch {

                        }


                        calculatePlanner(
                            {

                                announceResult:
                                    true,

                                animate:
                                    true

                            }
                        );


                        showToast(
                            "Response-planning assumptions restored to their default values.",
                            {

                                title:
                                    "Response Planner",

                                tone:
                                    "success"

                            }
                        );

                    }
                );

        }


        calculatePlanner(
            {

                announceResult:
                    false,

                animate:
                    false

            }
        );

    }


    /* =========================================================================
       24. INTERACTIVE CARD DEPTH
       ========================================================================= */

    function setupCardDepth() {

        if (
            reducedMotion ||
            !finePointer
        ) {
            return;
        }


        const cards =
            qsa(
                [

                    ".anlx-ratio-card",

                    ".anlx-decision-card",

                    ".anlx-recommendation-card"

                ].join(","),
                page
            );


        cards.forEach(
            card => {

                let frame =
                    null;


                card.addEventListener(
                    "pointermove",
                    event => {

                        if (
                            frame
                        ) {
                            return;
                        }


                        frame =
                            requestAnimationFrame(
                                () => {

                                    frame =
                                        null;


                                    const rect =
                                        card
                                            .getBoundingClientRect();


                                    const x =
                                        (
                                            event.clientX -
                                            rect.left
                                        ) /
                                        rect.width -
                                        0.5;


                                    const y =
                                        (
                                            event.clientY -
                                            rect.top
                                        ) /
                                        rect.height -
                                        0.5;


                                    const rotateY =
                                        clamp(
                                            x * 5,
                                            -2.5,
                                            2.5
                                        );


                                    const rotateX =
                                        clamp(
                                            y * -5,
                                            -2.5,
                                            2.5
                                        );


                                    card.style
                                        .transform =

                                        `perspective(1000px) ` +

                                        `rotateX(${rotateX}deg) ` +

                                        `rotateY(${rotateY}deg) ` +

                                        `translateY(-2px)`;


                                    card.style
                                        .transformStyle =

                                        "preserve-3d";

                                }
                            );

                    },
                    {
                        passive:
                            true
                    }
                );


                card.addEventListener(
                    "pointerleave",
                    () => {

                        card.style
                            .transform =
                            "";


                        card.style
                            .transformStyle =
                            "";

                    }
                );

            }
        );

    }


    /* =========================================================================
       25. SECURITY SCORE CORE DEPTH
       ========================================================================= */

    function setupScoreCore() {

        const core =
            elements.scoreCore;


        if (!core) {
            return;
        }


        core.style.setProperty(
            "--anlx-security-score",
            String(
                analytics.score
            )
        );


        core.dataset.score =
            String(
                analytics.score
            );


        if (
            reducedMotion ||
            !finePointer
        ) {
            return;
        }


        core.addEventListener(
            "pointermove",
            event => {

                const rect =
                    core.getBoundingClientRect();


                const x =
                    (
                        event.clientX -
                        rect.left
                    ) /
                    rect.width -
                    0.5;


                const y =
                    (
                        event.clientY -
                        rect.top
                    ) /
                    rect.height -
                    0.5;


                const rotateX =
                    clamp(
                        y * -5,
                        -2.5,
                        2.5
                    );


                const rotateY =
                    clamp(
                        x * 5,
                        -2.5,
                        2.5
                    );


                core.style.transform =

                    `perspective(1100px) ` +

                    `rotateX(${rotateX}deg) ` +

                    `rotateY(${rotateY}deg)`;

            },
            {
                passive:
                    true
            }
        );


        core.addEventListener(
            "pointerleave",
            () => {

                core.style.transform =
                    "";

            }
        );

    }


    /* =========================================================================
       26. CURSOR LIGHT
       ========================================================================= */

    function setupCursorLight() {

        const cursor =
            elements.cursorLight;


        if (
            !cursor ||
            reducedMotion ||
            !finePointer
        ) {
            return;
        }


        document.addEventListener(
            "pointermove",
            event => {

                cursor.style.left =
                    `${event.clientX}px`;


                cursor.style.top =
                    `${event.clientY}px`;


                cursor.style.opacity =
                    "1";

            },
            {
                passive:
                    true
            }
        );


        document.addEventListener(
            "pointerleave",
            () => {

                cursor.style.opacity =
                    "0";

            }
        );

    }


    /* =========================================================================
       27. FORENSIC NETWORK MESH CANVAS
       ========================================================================= */

    function createMeshCanvas(
        canvas
    ) {

        if (
            !canvas ||
            reducedMotion
        ) {
            return;
        }


        const context =
            canvas.getContext(
                "2d"
            );


        if (!context) {
            return;
        }


        let width =
            0;


        let height =
            0;


        let nodes =
            [];


        function random(
            min,
            max
        ) {

            return (
                min +
                Math.random() *
                (
                    max -
                    min
                )
            );

        }


        function resize() {

            const rect =
                canvas
                    .getBoundingClientRect();


            width =
                Math.max(
                    1,
                    rect.width
                );


            height =
                Math.max(
                    1,
                    rect.height
                );


            const dpr =
                Math.min(
                    window.devicePixelRatio ||
                    1,
                    1.4
                );


            canvas.width =
                width *
                dpr;


            canvas.height =
                height *
                dpr;


            context.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );


            const count =
                clamp(
                    Math.round(
                        (
                            width *
                            height
                        ) /
                        110000
                    ),
                    22,
                    64
                );


            nodes =
                Array.from(
                    {
                        length:
                            count
                    },
                    () => ({

                        x:
                            random(
                                0,
                                width
                            ),

                        y:
                            random(
                                0,
                                height
                            ),

                        radius:
                            random(
                                0.7,
                                1.6
                            )

                    })
                );


            draw();

        }


        function draw() {

            context.clearRect(
                0,
                0,
                width,
                height
            );


            const maxDistance =
                width < 800
                    ? 115
                    : 165;


            for (
                let i = 0;
                i < nodes.length;
                i++
            ) {

                const a =
                    nodes[i];


                for (
                    let j =
                        i + 1;

                    j <
                    nodes.length;

                    j++
                ) {

                    const b =
                        nodes[j];


                    const dx =
                        a.x -
                        b.x;


                    const dy =
                        a.y -
                        b.y;


                    const distance =
                        Math.hypot(
                            dx,
                            dy
                        );


                    if (
                        distance >
                        maxDistance
                    ) {
                        continue;
                    }


                    const alpha =
                        (
                            1 -
                            distance /
                            maxDistance
                        ) *
                        0.06;


                    context.beginPath();


                    context.moveTo(
                        a.x,
                        a.y
                    );


                    context.lineTo(
                        b.x,
                        b.y
                    );


                    context.strokeStyle =
                        `rgba(89,216,223,${alpha})`;


                    context.lineWidth =
                        0.7;


                    context.stroke();

                }


                context.beginPath();


                context.arc(
                    a.x,
                    a.y,
                    a.radius,
                    0,
                    Math.PI * 2
                );


                context.fillStyle =
                    "rgba(150,245,246,.15)";


                context.fill();

            }

        }


        resize();


        if (
            "ResizeObserver"
            in window
        ) {

            const observer =
                new ResizeObserver(
                    resize
                );


            observer.observe(
                canvas
            );

        } else {

            window.addEventListener(
                "resize",
                resize
            );

        }

    }


    /* =========================================================================
       28. MOVING SIGNAL CANVAS
       ========================================================================= */

    function createSignalCanvas(
        canvas
    ) {

        if (
            !canvas ||
            reducedMotion
        ) {
            return;
        }


        const context =
            canvas.getContext(
                "2d"
            );


        if (!context) {
            return;
        }


        let width =
            0;


        let height =
            0;


        let signals =
            [];


        let animationId =
            null;


        let running =
            true;


        let lastFrame =
            0;


        function random(
            min,
            max
        ) {

            return (
                min +
                Math.random() *
                (
                    max -
                    min
                )
            );

        }


        function resize() {

            const rect =
                canvas
                    .getBoundingClientRect();


            width =
                Math.max(
                    1,
                    rect.width
                );


            height =
                Math.max(
                    1,
                    rect.height
                );


            const dpr =
                Math.min(
                    window.devicePixelRatio ||
                    1,
                    1.4
                );


            canvas.width =
                width *
                dpr;


            canvas.height =
                height *
                dpr;


            context.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );


            signals =
                Array.from(
                    {
                        length:
                            16
                    },
                    () => ({

                        x:
                            random(
                                0,
                                width
                            ),

                        y:
                            random(
                                -height,
                                height
                            ),

                        length:
                            random(
                                40,
                                130
                            ),

                        speed:
                            random(
                                10,
                                27
                            ),

                        opacity:
                            random(
                                0.05,
                                0.15
                            )

                    })
                );

        }


        function draw(
            now
        ) {

            if (
                !running
            ) {
                return;
            }


            animationId =
                requestAnimationFrame(
                    draw
                );


            if (
                now -
                lastFrame <
                44
            ) {
                return;
            }


            lastFrame =
                now;


            context.clearRect(
                0,
                0,
                width,
                height
            );


            signals.forEach(
                signal => {

                    signal.y +=
                        signal.speed /
                        22;


                    if (
                        signal.y -
                        signal.length >
                        height
                    ) {

                        signal.y =
                            -signal.length;


                        signal.x =
                            random(
                                0,
                                width
                            );

                    }


                    const gradient =
                        context
                            .createLinearGradient(
                                signal.x,
                                signal.y -
                                signal.length,
                                signal.x,
                                signal.y
                            );


                    gradient.addColorStop(
                        0,
                        "rgba(89,216,223,0)"
                    );


                    gradient.addColorStop(
                        0.8,
                        `rgba(89,216,223,${
                            signal.opacity *
                            0.55
                        })`
                    );


                    gradient.addColorStop(
                        1,
                        `rgba(150,255,240,${
                            signal.opacity
                        })`
                    );


                    context.beginPath();


                    context.moveTo(
                        signal.x,
                        signal.y -
                        signal.length
                    );


                    context.lineTo(
                        signal.x,
                        signal.y
                    );


                    context.strokeStyle =
                        gradient;


                    context.lineWidth =
                        0.8;


                    context.stroke();


                    context.beginPath();


                    context.arc(
                        signal.x,
                        signal.y,
                        1.3,
                        0,
                        Math.PI * 2
                    );


                    context.fillStyle =
                        "rgba(180,255,255,.3)";


                    context.fill();

                }
            );

        }


        function pause() {

            running =
                false;


            if (
                animationId
            ) {

                cancelAnimationFrame(
                    animationId
                );

            }

        }


        function resume() {

            if (
                running
            ) {
                return;
            }


            running =
                true;


            animationId =
                requestAnimationFrame(
                    draw
                );

        }


        resize();


        animationId =
            requestAnimationFrame(
                draw
            );


        if (
            "ResizeObserver"
            in window
        ) {

            const observer =
                new ResizeObserver(
                    resize
                );


            observer.observe(
                canvas
            );

        }


        document.addEventListener(
            "visibilitychange",
            () => {

                if (
                    document.hidden
                ) {

                    pause();

                } else {

                    resume();

                }

            }
        );

    }


    /* =========================================================================
       29. ANALYTICS AMBIENT GRAPHICS
       ========================================================================= */

    function setupAmbientGraphics() {

        createMeshCanvas(
            elements.meshCanvas
        );


        createSignalCanvas(
            elements.signalCanvas
        );

    }


    /* =========================================================================
       30. BUTTON PRESS EFFECT
       ========================================================================= */

    function setupButtonFeedback() {

        page.addEventListener(
            "click",
            event => {

                const control =
                    event.target.closest(
                        "button, a"
                    );


                if (
                    !control ||
                    reducedMotion ||
                    !control.animate
                ) {
                    return;
                }


                control.animate(
                    [

                        {
                            transform:
                                "scale(1)"
                        },

                        {
                            transform:
                                "scale(.975)"
                        },

                        {
                            transform:
                                "scale(1)"
                        }

                    ],
                    {

                        duration:
                            150,

                        easing:
                            "ease-out"

                    }
                );

            }
        );

    }


    /* =========================================================================
       31. KEYBOARD SHORTCUTS
       Option/Alt + T = Triage Queue
       Option/Alt + P = Response Planner
       Option/Alt + N = New Analysis
       ========================================================================= */

    function setupKeyboardShortcuts() {

        document.addEventListener(
            "keydown",
            event => {

                if (
                    !event.altKey ||
                    isEditableElement(
                        document.activeElement
                    )
                ) {
                    return;
                }


                const key =
                    event.key
                        .toLowerCase();


                if (
                    key === "t"
                ) {

                    const target =
                        document.getElementById(
                            "investigationQueue"
                        );


                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    target.scrollIntoView(
                        {

                            behavior:
                                reducedMotion
                                    ? "auto"
                                    : "smooth",

                            block:
                                "start"

                        }
                    );


                    showToast(
                        "Investigation queue focused.",
                        {

                            title:
                                "Keyboard Shortcut",

                            tone:
                                "info",

                            timeout:
                                1300

                        }
                    );

                }


                if (
                    key === "p"
                ) {

                    const target =
                        document.getElementById(
                            "responsePlanner"
                        );


                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    target.scrollIntoView(
                        {

                            behavior:
                                reducedMotion
                                    ? "auto"
                                    : "smooth",

                            block:
                                "start"

                        }
                    );


                    showToast(
                        "Response planner focused.",
                        {

                            title:
                                "Keyboard Shortcut",

                            tone:
                                "info",

                            timeout:
                                1300

                        }
                    );

                }


                if (
                    key === "n"
                ) {

                    const link =
                        qs(
                            ".anlx-primary-action",
                            page
                        );


                    if (!link) {
                        return;
                    }


                    event.preventDefault();


                    window.location.assign(
                        link.href
                    );

                }

            }
        );

    }


    /* =========================================================================
       32. INITIAL INTELLIGENCE MESSAGE
       ========================================================================= */

    function showInitialState() {

        let message =
            "";


        let tone =
            "info";


        if (
            analytics.critical > 0
        ) {

            message =

                `${analytics.critical} critical finding${

                    analytics.critical === 1

                        ? ""

                        : "s"

                } require immediate review.`;


            tone =
                "critical";

        }

        else if (
            analytics.malicious > 0
        ) {

            message =

                `${analytics.malicious} threat record${

                    analytics.malicious === 1

                        ? ""

                        : "s"

                } are waiting for analyst validation.`;


            tone =
                "warning";

        }

        else if (
            analytics.total > 0
        ) {

            message =

                "No malicious records are currently present in the stored scan portfolio.";


            tone =
                "success";

        }

        else {

            message =

                "Run a new file analysis to build the analytics evidence base.";


            tone =
                "info";

        }


        window.setTimeout(
            () => {

                showToast(
                    message,
                    {

                        title:
                            "Analytics synchronized",

                        tone,

                        timeout:
                            3600

                    }
                );

            },
            reducedMotion
                ? 100
                : 650
        );

    }


    /* =========================================================================
       33. PAGE STARTUP STATE
       ========================================================================= */

    function activatePage() {

        requestAnimationFrame(
            () => {

                page.classList.add(
                    "is-js-ready"
                );

            }
        );

    }


    /* =========================================================================
       34. MAIN BOOT PROCESS
       ========================================================================= */

    function bootAnalytics() {

        activatePage();


        startClock();


        setupSectionAnimations();


        setupSmoothNavigation();


        setupAlerts();


        setupRefreshButton();


        setupNavigationFeedback();


        setupPlanner();


        setupCardDepth();


        setupScoreCore();


        setupCursorLight();


        setupAmbientGraphics();


        setupButtonFeedback();


        setupKeyboardShortcuts();


        window.setTimeout(
            () => {

                animateAnalyticsCounters();


                animateProgressBars();

            },
            reducedMotion
                ? 0
                : 160
        );


        showInitialState();


        announce(

            `Threat Analytics Lab ready. ` +

            `${analytics.total} total scans. ` +

            `${analytics.malicious} malicious detections. ` +

            `${analytics.critical} critical findings.`

        );


        console.info(
            "[CyberShield Analytics] Ready",
            {

                total:
                    analytics.total,

                safe:
                    analytics.safe,

                malicious:
                    analytics.malicious,

                critical:
                    analytics.critical,

                securityScore:
                    analytics.score

            }
        );

    }


    /* =========================================================================
       35. START SAFELY
       ========================================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            bootAnalytics,
            {
                once:
                    true
            }
        );

    } else {

        bootAnalytics();

    }


})();