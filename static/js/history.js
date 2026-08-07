(() => {
    "use strict";

    const ready = (callback) => {
        if (document.readyState === "loading") {
            document.addEventListener(
                "DOMContentLoaded",
                callback,
                { once: true }
            );
        } else {
            callback();
        }
    };

    ready(() => {
        const page = document.getElementById("historyPage");

        /*
         * Strong isolation:
         * this script does absolutely nothing outside the History page.
         */
        if (!page || page.dataset.historyReady === "true") {
            return;
        }

        page.dataset.historyReady = "true";

        const $ = (selector, root = document) =>
            root.querySelector(selector);

        const $$ = (selector, root = document) =>
            [...root.querySelectorAll(selector)];

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const elements = {
            clock: document.getElementById("historyLocalClock"),
            date: document.getElementById("historyLocalDate"),

            form: document.getElementById("historyFilterForm"),
            search: document.getElementById("historySearchInput"),
            risk: document.getElementById("historyRiskFilter"),

            status: document.getElementById(
                "historyAccessibilityStatus"
            ),

            ticker: document.getElementById(
                "historyIntelligenceTicker"
            ),

            meshCanvas: document.getElementById(
                "historyMeshCanvas"
            ),

            trafficCanvas: document.getElementById(
                "historyTrafficCanvas"
            ),

            cursorLight: document.getElementById(
                "historyCursorLight"
            ),

            modal: document.getElementById(
                "historyDeleteModal"
            ),

            modalFilename: document.getElementById(
                "historyDeleteFilename"
            ),

            closeModal: document.getElementById(
                "closeHistoryDeleteModal"
            ),

            cancelDelete: document.getElementById(
                "cancelHistoryDelete"
            ),

            confirmDelete: document.getElementById(
                "confirmHistoryDelete"
            ),

            toastRegion: document.getElementById(
                "historyToastRegion"
            )
        };

        const state = {
            activeModal: null,
            previousFocus: null,

            deleteUrl: "",
            deleteFilename: "",

            deleting: false,
            filtering: false,

            cursorFrame: null,
            cursorX: -1000,
            cursorY: -1000
        };

        const announce = (message) => {
            if (!elements.status) {
                return;
            }

            elements.status.textContent = "";

            window.setTimeout(() => {
                elements.status.textContent = message;
            }, 30);
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

            const icons = {
                info: "fa-circle-info",
                success: "fa-circle-check",
                warning: "fa-triangle-exclamation",
                error: "fa-circle-xmark"
            };

            const toast = document.createElement("article");

            toast.className =
                `histx-toast histx-toast--${type}`;

            toast.setAttribute(
                "role",
                type === "error" ? "alert" : "status"
            );

            const icon = document.createElement("span");

            icon.setAttribute(
                "aria-hidden",
                "true"
            );

            icon.innerHTML = `
                <i class="fa-solid ${icons[type] || icons.info}"></i>
            `;

            const content = document.createElement("div");

            const heading = document.createElement("strong");
            const paragraph = document.createElement("p");

            heading.textContent = title;
            paragraph.textContent = message;

            paragraph.style.margin = "2px 0 0";
            paragraph.style.color =
                "var(--histx-text-muted)";
            paragraph.style.fontSize = "9px";
            paragraph.style.lineHeight = "1.5";

            content.append(
                heading,
                paragraph
            );

            const close = document.createElement("button");

            close.type = "button";

            close.setAttribute(
                "aria-label",
                "Dismiss notification"
            );

            close.innerHTML =
                '<i class="fa-solid fa-xmark"></i>';

            close.style.cssText = [
                "width:28px",
                "height:28px",
                "padding:0",
                "border:1px solid var(--histx-border)",
                "border-radius:50%",
                "color:var(--histx-text-muted)",
                "background:rgba(255,255,255,.025)",
                "cursor:pointer"
            ].join(";");

            const removeToast = () => {
                if (!toast.isConnected) {
                    return;
                }

                toast.classList.add("is-leaving");

                window.setTimeout(() => {
                    toast.remove();
                }, 230);
            };

            close.addEventListener(
                "click",
                removeToast
            );

            toast.append(
                icon,
                content,
                close
            );

            elements.toastRegion.appendChild(toast);

            window.setTimeout(
                removeToast,
                duration
            );
        };

        /*
         * ================================================================
         * LIVE FORENSIC CLOCK
         * ================================================================
         */

        const updateClock = () => {
            const now = new Date();

            if (elements.clock) {
                elements.clock.textContent =
                    new Intl.DateTimeFormat(
                        undefined,
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false
                        }
                    ).format(now);
            }

            if (elements.date) {
                elements.date.textContent =
                    new Intl.DateTimeFormat(
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

        updateClock();

        window.setInterval(
            updateClock,
            1000
        );

        /*
         * ================================================================
         * FLASH MESSAGE DISMISSAL
         * ================================================================
         */

        $$(
            "[data-dismiss-history-alert]",
            page
        ).forEach((button) => {
            button.addEventListener("click", () => {
                const alert = button.closest(
                    "[data-history-alert]"
                );

                if (!alert) {
                    return;
                }

                alert.style.opacity = "0";
                alert.style.transform =
                    "translateY(-8px)";

                window.setTimeout(() => {
                    alert.remove();
                }, 200);

                announce(
                    "Notification dismissed."
                );
            });
        });

        /*
         * ================================================================
         * SERVER-SIDE SEARCH AND RISK FILTERING
         * ================================================================
         */

        const getSubmitButton = () =>
            $(
                '.histx-filter-button--primary[type="submit"]',
                elements.form || page
            );

        const setFiltering = (active) => {
            state.filtering = active;

            page.classList.toggle(
                "is-filtering",
                active
            );

            const button = getSubmitButton();

            if (!button) {
                return;
            }

            button.disabled = active;

            button.setAttribute(
                "aria-busy",
                String(active)
            );

            if (active) {
                if (!button.dataset.originalHtml) {
                    button.dataset.originalHtml =
                        button.innerHTML;
                }

                button.innerHTML = `
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    Applying Filters
                `;
            } else if (button.dataset.originalHtml) {
                button.innerHTML =
                    button.dataset.originalHtml;

                delete button.dataset.originalHtml;
            }
        };

        if (elements.form) {
            elements.form.addEventListener(
                "submit",
                () => {
                    if (state.filtering) {
                        return;
                    }

                    setFiltering(true);

                    announce(
                        "Applying scan-history filters."
                    );
                }
            );

            /*
             * Automatically submit when the risk filter changes.
             * It still uses the real Flask GET /history route.
             */
            elements.risk?.addEventListener(
                "change",
                () => {
                    if (state.filtering) {
                        return;
                    }

                    setFiltering(true);

                    window.setTimeout(() => {
                        if (
                            typeof elements.form
                                .requestSubmit === "function"
                        ) {
                            elements.form.requestSubmit();
                        } else {
                            elements.form.submit();
                        }
                    }, 100);
                }
            );
        }

        elements.search?.addEventListener(
            "keydown",
            (event) => {
                if (event.key !== "Escape") {
                    return;
                }

                if (elements.search.value) {
                    event.preventDefault();

                    elements.search.value = "";

                    announce(
                        "Filename search cleared."
                    );
                } else {
                    elements.search.blur();
                }
            }
        );

        /*
         * Reset loading state when navigating back through browser history.
         */
        window.addEventListener(
            "pageshow",
            () => {
                setFiltering(false);
            }
        );

        /*
         * ================================================================
         * RECORD DETAILS
         * ================================================================
         */

        const getDetailsForRow = (row) => {
            const nextRow =
                row?.nextElementSibling;

            return (
                nextRow?.querySelector(
                    ".histx-record-details"
                ) || null
            );
        };

        const getRowForDetails = (details) => {
            const detailRow = details?.closest(
                ".histx-detail-row"
            );

            const previousRow =
                detailRow?.previousElementSibling;

            return previousRow?.matches(
                "[data-history-row]"
            )
                ? previousRow
                : null;
        };

        const closeOtherDetails = (
            currentDetails
        ) => {
            $$(
                ".histx-record-details[open]",
                page
            ).forEach((details) => {
                if (details === currentDetails) {
                    return;
                }

                details.open = false;

                getRowForDetails(details)
                    ?.classList.remove(
                        "is-highlighted"
                    );
            });
        };

        const openDetails = (
            details,
            options = {}
        ) => {
            if (!details) {
                return;
            }

            const {
                scroll = true,
                updateHash = true
            } = options;

            closeOtherDetails(details);

            details.open = true;

            const row =
                getRowForDetails(details);

            row?.classList.add(
                "is-highlighted"
            );

            if (
                updateHash &&
                details.id &&
                window.history.replaceState
            ) {
                window.history.replaceState(
                    null,
                    "",
                    `#${details.id}`
                );
            }

            if (scroll) {
                window.setTimeout(() => {
                    (row || details).scrollIntoView({
                        behavior:
                            reduceMotion
                                ? "auto"
                                : "smooth",

                        block: "center"
                    });
                }, 60);
            }

            announce(
                `Intelligence record opened for ${
                    row?.dataset.filename ||
                    "the selected file"
                }.`
            );
        };

        $$(
            ".histx-row-action--inspect",
            page
        ).forEach((link) => {
            link.addEventListener(
                "click",
                (event) => {
                    const href =
                        link.getAttribute("href");

                    if (
                        !href ||
                        !href.startsWith("#")
                    ) {
                        return;
                    }

                    const details =
                        document.getElementById(
                            href.slice(1)
                        );

                    if (!details) {
                        return;
                    }

                    event.preventDefault();

                    openDetails(details);
                }
            );
        });

        $$(
            ".histx-record-details",
            page
        ).forEach((details) => {
            details.addEventListener(
                "toggle",
                () => {
                    const row =
                        getRowForDetails(details);

                    if (details.open) {
                        closeOtherDetails(details);

                        row?.classList.add(
                            "is-highlighted"
                        );
                    } else {
                        row?.classList.remove(
                            "is-highlighted"
                        );
                    }
                }
            );
        });

        /*
         * Keyboard support for complete table rows.
         */
        $$(
            "[data-history-row]",
            page
        ).forEach((row) => {
            row.tabIndex = 0;

            row.addEventListener(
                "keydown",
                (event) => {
                    if (
                        ![
                            "Enter",
                            " "
                        ].includes(event.key)
                    ) {
                        return;
                    }

                    if (
                        event.target.closest(
                            "a,button,input,select,summary"
                        )
                    ) {
                        return;
                    }

                    const details =
                        getDetailsForRow(row);

                    if (!details) {
                        return;
                    }

                    event.preventDefault();

                    if (details.open) {
                        details.open = false;

                        row.classList.remove(
                            "is-highlighted"
                        );
                    } else {
                        openDetails(details);
                    }
                }
            );
        });

        /*
         * Automatically open a specific record from:
         * /history#scan-details-15
         */
        if (
            window.location.hash.startsWith(
                "#scan-details-"
            )
        ) {
            const details =
                document.getElementById(
                    window.location.hash.slice(1)
                );

            if (details) {
                window.setTimeout(() => {
                    openDetails(
                        details,
                        {
                            updateHash: false
                        }
                    );
                }, 150);
            }
        }

        /*
         * ================================================================
         * COPY MD5 AND SHA-256
         * ================================================================
         */

        const fallbackCopy = (text) => {
            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value = text;
            textarea.readOnly = true;

            textarea.style.position = "fixed";
            textarea.style.top = "-1000px";
            textarea.style.opacity = "0";

            document.body.appendChild(
                textarea
            );

            textarea.select();

            let success = false;

            try {
                success =
                    document.execCommand("copy");
            } catch {
                success = false;
            }

            textarea.remove();

            return success;
        };

        const copyText = async (text) => {
            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {
                try {
                    await navigator.clipboard
                        .writeText(text);

                    return true;
                } catch {
                    return fallbackCopy(text);
                }
            }

            return fallbackCopy(text);
        };

        $$(
            "[data-copy-value]",
            page
        ).forEach((button) => {
            button.addEventListener(
                "click",
                async () => {
                    const value =
                        button.dataset.copyValue;

                    if (!value) {
                        showToast(
                            "Nothing to copy",
                            "No stored hash is available.",
                            "warning"
                        );

                        return;
                    }

                    const copied =
                        await copyText(value);

                    if (!copied) {
                        showToast(
                            "Copy failed",
                            "Clipboard access was blocked by the browser.",
                            "error"
                        );

                        return;
                    }

                    const original =
                        button.innerHTML;

                    button.classList.add(
                        "is-copied"
                    );

                    button.innerHTML =
                        '<i class="fa-solid fa-check"></i>';

                    window.setTimeout(() => {
                        button.classList.remove(
                            "is-copied"
                        );

                        button.innerHTML =
                            original;
                    }, 1400);

                    showToast(
                        "Hash copied",
                        "The cryptographic value was copied.",
                        "success"
                    );

                    announce(
                        "Cryptographic hash copied."
                    );
                }
            );
        });

        /*
         * ================================================================
         * DELETE CONFIRMATION MODAL
         * ================================================================
         */

        const getModalFocusableElements = () => {
            if (!elements.modal) {
                return [];
            }

            return $$(
                [
                    "a[href]",
                    "button:not([disabled])",
                    "input:not([disabled])",
                    "select:not([disabled])",
                    '[tabindex]:not([tabindex="-1"])'
                ].join(","),
                elements.modal
            ).filter((element) => {
                return (
                    window.getComputedStyle(element)
                        .display !== "none"
                );
            });
        };

        const setModalOpen = (open) => {
            if (!elements.modal) {
                return;
            }

            elements.modal.setAttribute(
                "aria-hidden",
                String(!open)
            );

            elements.modal.classList.toggle(
                "is-open",
                open
            );

            document.documentElement.style.overflow =
                open ? "hidden" : "";

            document.body.style.overflow =
                open ? "hidden" : "";

            state.activeModal =
                open ? elements.modal : null;
        };

        const openDeleteModal = (
            url,
            filename,
            trigger
        ) => {
            /*
             * Browser-confirm fallback if modal markup is unavailable.
             */
            if (
                !elements.modal ||
                !elements.confirmDelete
            ) {
                const approved =
                    window.confirm(
                        `Delete the scan record for "${filename}"?`
                    );

                if (approved) {
                    window.location.assign(url);
                }

                return;
            }

            state.deleteUrl = url;

            state.deleteFilename =
                filename || "this file";

            state.previousFocus =
                trigger ||
                document.activeElement;

            if (elements.modalFilename) {
                elements.modalFilename.textContent =
                    state.deleteFilename;
            }

            elements.confirmDelete.href = url;

            setModalOpen(true);

            window.setTimeout(() => {
                elements.cancelDelete?.focus();
            }, 50);

            announce(
                `Delete confirmation opened for ${state.deleteFilename}.`
            );
        };

        const closeDeleteModal = () => {
            if (state.deleting) {
                return;
            }

            setModalOpen(false);

            state.deleteUrl = "";
            state.deleteFilename = "";

            state.previousFocus?.focus?.();

            announce(
                "Delete confirmation closed."
            );
        };

        $$(
            "[data-delete-scan]",
            page
        ).forEach((link) => {
            link.addEventListener(
                "click",
                (event) => {
                    /*
                     * Preserve Command-click and open-in-new-tab behaviour.
                     */
                    if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey
                    ) {
                        return;
                    }

                    const url =
                        link.getAttribute("href");

                    if (!url) {
                        return;
                    }

                    event.preventDefault();

                    openDeleteModal(
                        url,
                        link.dataset.scanFilename ||
                            "this file",
                        link
                    );
                }
            );
        });

        elements.closeModal?.addEventListener(
            "click",
            closeDeleteModal
        );

        elements.cancelDelete?.addEventListener(
            "click",
            closeDeleteModal
        );

        $$(
            "[data-close-history-delete]",
            elements.modal || page
        ).forEach((backdrop) => {
            backdrop.addEventListener(
                "click",
                closeDeleteModal
            );
        });

        elements.confirmDelete?.addEventListener(
            "click",
            (event) => {
                if (
                    state.deleting ||
                    !state.deleteUrl
                ) {
                    event.preventDefault();
                    return;
                }

                event.preventDefault();

                state.deleting = true;

                elements.confirmDelete.setAttribute(
                    "aria-disabled",
                    "true"
                );

                elements.confirmDelete.innerHTML = `
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    Deleting Record
                `;

                announce(
                    `Deleting scan record for ${state.deleteFilename}.`
                );

                /*
                 * Uses the existing Flask delete route.
                 */
                window.setTimeout(() => {
                    window.location.assign(
                        state.deleteUrl
                    );
                }, reduceMotion ? 10 : 220);
            }
        );

        /*
         * ================================================================
         * GLOBAL HISTORY-PAGE KEYBOARD CONTROLS
         * ================================================================
         */

        document.addEventListener(
            "keydown",
            (event) => {
                /*
                 * Command + K on Mac
                 * Ctrl + K on Windows
                 */
                if (
                    (
                        event.metaKey ||
                        event.ctrlKey
                    ) &&
                    event.key.toLowerCase() === "k"
                ) {
                    event.preventDefault();

                    elements.search?.focus();
                    elements.search?.select();

                    announce(
                        "Filename history search focused."
                    );

                    return;
                }

                /*
                 * Escape closes the delete modal.
                 */
                if (
                    event.key === "Escape" &&
                    state.activeModal
                ) {
                    closeDeleteModal();
                    return;
                }

                /*
                 * Keyboard focus trap inside modal.
                 */
                if (
                    event.key !== "Tab" ||
                    !state.activeModal
                ) {
                    return;
                }

                const focusable =
                    getModalFocusableElements();

                if (!focusable.length) {
                    event.preventDefault();
                    return;
                }

                const first = focusable[0];

                const last =
                    focusable[
                        focusable.length - 1
                    ];

                if (
                    event.shiftKey &&
                    document.activeElement === first
                ) {
                    event.preventDefault();
                    last.focus();
                } else if (
                    !event.shiftKey &&
                    document.activeElement === last
                ) {
                    event.preventDefault();
                    first.focus();
                }
            }
        );

        /*
         * ================================================================
         * EXPORT BUTTON FEEDBACK
         * ================================================================
         */

        $$(
            '.histx-icon-button[href*="/export/"]',
            page
        ).forEach((link) => {
            link.addEventListener(
                "click",
                () => {
                    const href =
                        link.getAttribute("href") ||
                        "";

                    const format =
                        href.includes("/pdf")
                            ? "PDF"
                            : "CSV";

                    showToast(
                        `${format} export requested`,
                        "The server is preparing the complete scan-history report.",
                        "info",
                        3000
                    );
                }
            );
        });

        /*
         * ================================================================
         * CONTINUOUS INTELLIGENCE TICKER
         * ================================================================
         */

        if (
            elements.ticker &&
            elements.ticker.dataset.enhanced !==
                "true"
        ) {
            elements.ticker.dataset.enhanced =
                "true";

            [
                ...elements.ticker.children
            ].forEach((item) => {
                const clone =
                    item.cloneNode(true);

                clone.setAttribute(
                    "aria-hidden",
                    "true"
                );

                elements.ticker.appendChild(
                    clone
                );
            });
        }

        /*
         * ================================================================
         * CURSOR LIGHT
         * ================================================================
         */

        if (
            elements.cursorLight &&
            !reduceMotion &&
            window.matchMedia(
                "(pointer:fine)"
            ).matches
        ) {
            document.addEventListener(
                "pointermove",
                (event) => {
                    state.cursorX =
                        event.clientX;

                    state.cursorY =
                        event.clientY;

                    if (state.cursorFrame) {
                        return;
                    }

                    state.cursorFrame =
                        window.requestAnimationFrame(
                            () => {
                                state.cursorFrame =
                                    null;

                                elements.cursorLight
                                    .style.transform = `
                                        translate3d(
                                            ${state.cursorX - 260}px,
                                            ${state.cursorY - 260}px,
                                            0
                                        )
                                    `;
                            }
                        );
                },
                { passive: true }
            );
        }

        /*
         * ================================================================
         * CANVAS BACKGROUND ANIMATIONS
         * ================================================================
         */

        const createCanvasAnimation = (
            canvas,
            mode
        ) => {
            if (
                !canvas ||
                reduceMotion
            ) {
                return;
            }

            const context =
                canvas.getContext("2d");

            if (!context) {
                return;
            }

            let width = 1;
            let height = 1;
            let items = [];
            let frame = null;

            const resize = () => {
                const rectangle =
                    canvas.getBoundingClientRect();

                const ratio = Math.min(
                    window.devicePixelRatio || 1,
                    2
                );

                width = Math.max(
                    rectangle.width,
                    1
                );

                height = Math.max(
                    rectangle.height,
                    1
                );

                canvas.width =
                    Math.round(
                        width * ratio
                    );

                canvas.height =
                    Math.round(
                        height * ratio
                    );

                context.setTransform(
                    ratio,
                    0,
                    0,
                    ratio,
                    0,
                    0
                );

                if (mode === "mesh") {
                    const count =
                        width < 700
                            ? 18
                            : width < 1300
                                ? 30
                                : 44;

                    items = Array.from(
                        { length: count },
                        () => ({
                            x:
                                Math.random() *
                                width,

                            y:
                                Math.random() *
                                height,

                            velocityX:
                                (
                                    Math.random() -
                                    0.5
                                ) * 0.15,

                            velocityY:
                                (
                                    Math.random() -
                                    0.5
                                ) * 0.15,

                            radius:
                                0.7 +
                                Math.random()
                        })
                    );
                } else {
                    const count =
                        width < 700
                            ? 9
                            : 17;

                    items = Array.from(
                        { length: count },
                        () => ({
                            x:
                                Math.random() *
                                width,

                            y:
                                Math.random() *
                                height,

                            speed:
                                0.25 +
                                Math.random() *
                                0.55,

                            length:
                                25 +
                                Math.random() *
                                70,

                            opacity:
                                0.025 +
                                Math.random() *
                                0.05
                        })
                    );
                }
            };

            const drawMesh = () => {
                items.forEach((particle) => {
                    particle.x +=
                        particle.velocityX;

                    particle.y +=
                        particle.velocityY;

                    if (
                        particle.x < 0 ||
                        particle.x > width
                    ) {
                        particle.velocityX *= -1;
                    }

                    if (
                        particle.y < 0 ||
                        particle.y > height
                    ) {
                        particle.velocityY *= -1;
                    }

                    context.beginPath();

                    context.arc(
                        particle.x,
                        particle.y,
                        particle.radius,
                        0,
                        Math.PI * 2
                    );

                    context.fillStyle =
                        "rgba(74,215,230,.38)";

                    context.fill();
                });

                const maximumDistance =
                    width < 900
                        ? 90
                        : 125;

                for (
                    let first = 0;
                    first < items.length;
                    first += 1
                ) {
                    for (
                        let second = first + 1;
                        second < items.length;
                        second += 1
                    ) {
                        const distance =
                            Math.hypot(
                                items[first].x -
                                    items[second].x,

                                items[first].y -
                                    items[second].y
                            );

                        if (
                            distance >=
                            maximumDistance
                        ) {
                            continue;
                        }

                        context.beginPath();

                        context.moveTo(
                            items[first].x,
                            items[first].y
                        );

                        context.lineTo(
                            items[second].x,
                            items[second].y
                        );

                        context.strokeStyle = `
                            rgba(
                                74,
                                215,
                                230,
                                ${
                                    (
                                        1 -
                                        distance /
                                            maximumDistance
                                    ) * 0.07
                                }
                            )
                        `;

                        context.lineWidth = 0.7;
                        context.stroke();
                    }
                }
            };

            const drawTraffic = () => {
                items.forEach((packet) => {
                    packet.x += packet.speed;

                    if (
                        packet.x -
                            packet.length >
                        width
                    ) {
                        packet.x =
                            -packet.length;

                        packet.y =
                            Math.random() *
                            height;
                    }

                    const gradient =
                        context.createLinearGradient(
                            packet.x -
                                packet.length,

                            packet.y,

                            packet.x,

                            packet.y
                        );

                    gradient.addColorStop(
                        0,
                        "rgba(74,215,230,0)"
                    );

                    gradient.addColorStop(
                        1,
                        `rgba(
                            74,
                            215,
                            230,
                            ${packet.opacity}
                        )`
                    );

                    context.beginPath();

                    context.moveTo(
                        packet.x -
                            packet.length,

                        packet.y
                    );

                    context.lineTo(
                        packet.x,
                        packet.y
                    );

                    context.strokeStyle =
                        gradient;

                    context.lineWidth = 1;

                    context.stroke();
                });
            };

            const draw = () => {
                context.clearRect(
                    0,
                    0,
                    width,
                    height
                );

                if (mode === "mesh") {
                    drawMesh();
                } else {
                    drawTraffic();
                }

                frame =
                    window.requestAnimationFrame(
                        draw
                    );
            };

            resize();
            draw();

            if (
                "ResizeObserver" in window
            ) {
                const observer =
                    new ResizeObserver(resize);

                observer.observe(canvas);
            } else {
                window.addEventListener(
                    "resize",
                    resize
                );
            }

            /*
             * Pause animations when the browser tab is hidden.
             */
            document.addEventListener(
                "visibilitychange",
                () => {
                    if (
                        document.hidden &&
                        frame
                    ) {
                        window.cancelAnimationFrame(
                            frame
                        );

                        frame = null;
                    } else if (
                        !document.hidden &&
                        !frame
                    ) {
                        draw();
                    }
                }
            );
        };

        createCanvasAnimation(
            elements.meshCanvas,
            "mesh"
        );

        createCanvasAnimation(
            elements.trafficCanvas,
            "traffic"
        );

        /*
         * ================================================================
         * LEGACY CONFIDENCE DIAGNOSTIC
         * ================================================================
         */

        const invalidConfidenceCount =
            $$(
                ".histx-confidence-cell .histx-text-muted",
                page
            ).length;

        if (invalidConfidenceCount) {
            console.warn(
                `[History Workspace] ${invalidConfidenceCount} legacy confidence value(s) could not be converted to numeric percentages.`
            );
        }

        /*
         * ================================================================
         * COMPLETED
         * ================================================================
         */

        announce(
            `Scan history loaded. ${
                Number(
                    page.dataset.totalRecords
                ) || 0
            } total records.`
        );

        console.info(
            "[History Workspace] history.js initialized successfully."
        );
    });
})();