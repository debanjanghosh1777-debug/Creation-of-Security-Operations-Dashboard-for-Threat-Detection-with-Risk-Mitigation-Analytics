/**
 * AI Threat Detection System
 * Users Page Controller
 *
 * Save this file as:
 * static/js/users.js
 *
 * This script runs only on #usersPage.
 */

(function () {
    "use strict";

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener(
                "DOMContentLoaded",
                callback,
                { once: true }
            );
        } else {
            callback();
        }
    }

    ready(function () {
        var page = document.getElementById(
            "usersPage"
        );

        if (!page) {
            return;
        }

        if (
            page.getAttribute(
                "data-users-js-ready"
            ) === "true"
        ) {
            return;
        }

        page.setAttribute(
            "data-users-js-ready",
            "true"
        );

        function one(selector, root) {
            return (
                root || document
            ).querySelector(selector);
        }

        function all(selector, root) {
            return Array.prototype.slice.call(
                (
                    root || document
                ).querySelectorAll(selector)
            );
        }

        function clean(value) {
            return String(
                value == null ? "" : value
            ).trim();
        }

        function lower(value) {
            return clean(value).toLowerCase();
        }

        function announce(message) {
            var status =
                document.getElementById(
                    "usersAccessibilityStatus"
                );

            if (!status) {
                return;
            }

            status.textContent = "";

            window.setTimeout(function () {
                status.textContent = message;
            }, 30);
        }

        function prefersReducedMotion() {
            return Boolean(
                window.matchMedia &&
                window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches
            );
        }

        var elements = {
            clock:
                document.getElementById(
                    "usersLocalClock"
                ),

            date:
                document.getElementById(
                    "usersLocalDate"
                ),

            filterForm:
                document.getElementById(
                    "usersFilterForm"
                ),

            searchInput:
                document.getElementById(
                    "usersSearchInput"
                ),

            roleFilter:
                document.getElementById(
                    "usersRoleFilter"
                ),

            protectionFilter:
                document.getElementById(
                    "usersProtectionFilter"
                ),

            resetFilters:
                document.getElementById(
                    "resetUsersFilters"
                ),

            clearEmpty:
                document.getElementById(
                    "clearUsersFilterEmpty"
                ),

            visibleCount:
                document.getElementById(
                    "usersVisibleCount"
                ),

            filterState:
                one(
                    ".usrx-filter-state",
                    page
                ),

            filterEmpty:
                document.getElementById(
                    "usersFilterEmpty"
                ),

            table:
                document.getElementById(
                    "usersTable"
                ),

            tableBody:
                document.getElementById(
                    "usersTableBody"
                ),

            tableScroll:
                one(
                    ".usrx-table-scroll",
                    page
                ),

            directoryFooter:
                one(
                    ".usrx-directory-footer",
                    page
                ),

            drawer:
                document.getElementById(
                    "usersInspectionDrawer"
                ),

            drawerBackdrop:
                document.getElementById(
                    "usersDrawerBackdrop"
                ),

            closeDrawer:
                document.getElementById(
                    "closeUsersInspection"
                ),

            inspectAvatar:
                document.getElementById(
                    "usersInspectionAvatar"
                ),

            inspectUsername:
                document.getElementById(
                    "usersInspectionUsername"
                ),

            inspectEmail:
                document.getElementById(
                    "usersInspectionEmail"
                ),

            inspectId:
                document.getElementById(
                    "usersInspectionId"
                ),

            inspectRole:
                document.getElementById(
                    "usersInspectionRole"
                ),

            inspectState:
                document.getElementById(
                    "usersInspectionState"
                ),

            inspectProtection:
                document.getElementById(
                    "usersInspectionProtection"
                ),

            inspectCreated:
                document.getElementById(
                    "usersInspectionCreated"
                ),

            securityButton:
                document.getElementById(
                    "usersSecurityOverviewButton"
                ),

            securityModal:
                document.getElementById(
                    "usersSecurityModal"
                ),

            closeSecurityModal:
                document.getElementById(
                    "closeUsersSecurityModal"
                ),

            deleteModal:
                document.getElementById(
                    "usersDeleteModal"
                ),

            deleteUsername:
                document.getElementById(
                    "usersDeleteUsername"
                ),

            deleteId:
                document.getElementById(
                    "usersDeleteId"
                ),

            deleteRole:
                document.getElementById(
                    "usersDeleteRole"
                ),

            closeDeleteModal:
                document.getElementById(
                    "closeUsersDeleteModal"
                ),

            cancelDelete:
                document.getElementById(
                    "cancelUsersDelete"
                ),

            confirmDelete:
                document.getElementById(
                    "confirmUsersDelete"
                ),

            ticker:
                document.getElementById(
                    "usersIntelligenceTicker"
                ),

            cursorLight:
                document.getElementById(
                    "usersCursorLight"
                ),

            identityCanvas:
                document.getElementById(
                    "usersIdentityCanvas"
                ),

            accessCanvas:
                document.getElementById(
                    "usersAccessCanvas"
                ),

            toastRegion:
                document.getElementById(
                    "usersToastRegion"
                )
        };

        var state = {
            activeLayer: null,
            previousFocus: null,

            deleteUrl: "",
            deleteBusy: false,

            searchTimer: null,

            sortKey: "",
            sortDirection: "asc",

            cursorFrame: null,
            cursorX: -1000,
            cursorY: -1000
        };

        /* ==========================================
           CLOCK
        ========================================== */

        function updateClock() {
            var now = new Date();

            if (elements.clock) {
                elements.clock.textContent =
                    now.toLocaleTimeString(
                        [],
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false
                        }
                    );
            }

            if (elements.date) {
                elements.date.textContent =
                    now.toLocaleDateString(
                        [],
                        {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    );
            }
        }

        updateClock();

        window.setInterval(
            updateClock,
            1000
        );

        /* ==========================================
           TOAST NOTIFICATIONS
        ========================================== */

        function showToast(
            title,
            message,
            type
        ) {
            if (!elements.toastRegion) {
                return;
            }

            var icons = {
                info: "fa-circle-info",
                success: "fa-circle-check",
                warning:
                    "fa-triangle-exclamation",
                error: "fa-circle-xmark"
            };

            var safeType =
                icons[type] ? type : "info";

            var toast =
                document.createElement(
                    "article"
                );

            var icon =
                document.createElement(
                    "span"
                );

            var content =
                document.createElement(
                    "div"
                );

            var heading =
                document.createElement(
                    "strong"
                );

            var paragraph =
                document.createElement(
                    "p"
                );

            var close =
                document.createElement(
                    "button"
                );

            toast.className =
                "usrx-toast usrx-toast--" +
                safeType;

            toast.setAttribute(
                "role",
                safeType === "error"
                    ? "alert"
                    : "status"
            );

            icon.innerHTML =
                '<i class="fa-solid ' +
                icons[safeType] +
                '"></i>';

            heading.textContent = title;
            heading.style.display = "block";
            heading.style.fontSize = "11px";

            paragraph.textContent = message;
            paragraph.style.margin =
                "2px 0 0";
            paragraph.style.fontSize =
                "9px";
            paragraph.style.lineHeight =
                "1.5";
            paragraph.style.color =
                "var(--usrx-text-muted)";

            content.appendChild(heading);
            content.appendChild(paragraph);

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
                "border:1px solid var(--usrx-border)",
                "border-radius:50%",
                "background:rgba(255,255,255,.025)",
                "color:var(--usrx-text-muted)",
                "cursor:pointer"
            ].join(";");

            function removeToast() {
                if (!toast.parentNode) {
                    return;
                }

                toast.classList.add(
                    "is-leaving"
                );

                window.setTimeout(
                    function () {
                        if (
                            toast.parentNode
                        ) {
                            toast.parentNode
                                .removeChild(
                                    toast
                                );
                        }
                    },
                    220
                );
            }

            close.addEventListener(
                "click",
                removeToast
            );

            toast.appendChild(icon);
            toast.appendChild(content);
            toast.appendChild(close);

            elements.toastRegion.appendChild(
                toast
            );

            window.setTimeout(
                removeToast,
                3600
            );
        }

        /* ==========================================
           FLASH ALERTS
        ========================================== */

        all(
            "[data-dismiss-users-alert]",
            page
        ).forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    var alertBox =
                        button.closest(
                            "[data-users-alert]"
                        );

                    if (!alertBox) {
                        return;
                    }

                    alertBox.style.opacity =
                        "0";

                    alertBox.style.transform =
                        "translateY(-8px)";

                    window.setTimeout(
                        function () {
                            if (
                                alertBox.parentNode
                            ) {
                                alertBox.parentNode
                                    .removeChild(
                                        alertBox
                                    );
                            }
                        },
                        200
                    );

                    announce(
                        "Notification dismissed."
                    );
                }
            );
        });

        /* ==========================================
           USER DATA
        ========================================== */

        function getRows() {
            return all(
                "[data-user-row]",
                elements.tableBody || page
            );
        }

        function getRowData(row) {
            return {
                id:
                    row.getAttribute(
                        "data-user-id"
                    ) || "—",

                username:
                    row.getAttribute(
                        "data-username"
                    ) || "Unknown user",

                email:
                    row.getAttribute(
                        "data-email"
                    ) ||
                    "Email not recorded",

                role:
                    row.getAttribute(
                        "data-role"
                    ) || "member",

                roleLabel:
                    row.getAttribute(
                        "data-role-label"
                    ) ||
                    "Standard User",

                protection:
                    row.getAttribute(
                        "data-protection"
                    ) ||
                    "manageable",

                createdAt:
                    row.getAttribute(
                        "data-created-at"
                    ) ||
                    "Not recorded",

                searchText:
                    row.getAttribute(
                        "data-search-text"
                    ) || ""
            };
        }

        /* ==========================================
           FILTERS
        ========================================== */

        function getFilters() {
            return {
                search: lower(
                    elements.searchInput
                        ? elements.searchInput
                            .value
                        : ""
                ),

                role:
                    elements.roleFilter
                        ? elements.roleFilter
                            .value
                        : "all",

                protection:
                    elements.protectionFilter
                        ? elements
                            .protectionFilter
                            .value
                        : "all"
            };
        }

        function rowMatches(
            row,
            filters
        ) {
            var data = getRowData(row);

            var searchMatch =
                !filters.search ||
                lower(
                    data.searchText
                ).indexOf(
                    filters.search
                ) !== -1;

            var roleMatch =
                filters.role === "all" ||
                data.role ===
                    filters.role;

            var protectionMatch =
                filters.protection ===
                    "all" ||
                data.protection ===
                    filters.protection;

            return (
                searchMatch &&
                roleMatch &&
                protectionMatch
            );
        }

        function updateFilterDisplay(
            visible,
            total,
            filters
        ) {
            var filtersActive =
                Boolean(filters.search) ||
                filters.role !== "all" ||
                filters.protection !==
                    "all";

            if (elements.visibleCount) {
                elements.visibleCount
                    .textContent =
                    String(visible);
            }

            if (elements.filterState) {
                elements.filterState
                    .innerHTML =
                    '<span class="usrx-live-dot"></span>' +
                    (
                        filtersActive
                            ? visible +
                                " MATCHING"
                            : "ALL IDENTITIES"
                    );
            }

            if (elements.tableScroll) {
                elements.tableScroll.hidden =
                    visible === 0;
            }

            if (
                elements.directoryFooter
            ) {
                elements.directoryFooter
                    .hidden =
                    visible === 0;
            }

            if (elements.filterEmpty) {
                elements.filterEmpty.hidden =
                    visible !== 0 ||
                    total === 0;
            }
        }

        function applyFilters(
            shouldAnnounce
        ) {
            var rows = getRows();
            var filters = getFilters();
            var visible = 0;

            rows.forEach(
                function (row) {
                    var matches =
                        rowMatches(
                            row,
                            filters
                        );

                    row.hidden = !matches;

                    row.setAttribute(
                        "aria-hidden",
                        matches
                            ? "false"
                            : "true"
                    );

                    if (matches) {
                        visible += 1;
                    }
                }
            );

            updateFilterDisplay(
                visible,
                rows.length,
                filters
            );

            if (
                shouldAnnounce !== false
            ) {
                announce(
                    visible +
                        " of " +
                        rows.length +
                        " user identities are visible."
                );
            }
        }

        function resetFilters() {
            if (elements.searchInput) {
                elements.searchInput.value =
                    "";
            }

            if (elements.roleFilter) {
                elements.roleFilter.value =
                    "all";
            }

            if (
                elements.protectionFilter
            ) {
                elements.protectionFilter
                    .value =
                    "all";
            }

            applyFilters(true);
        }

        if (elements.filterForm) {
            elements.filterForm
                .addEventListener(
                    "submit",
                    function (event) {
                        event.preventDefault();
                        applyFilters(true);
                    }
                );

            elements.filterForm
                .addEventListener(
                    "reset",
                    function (event) {
                        event.preventDefault();
                        resetFilters();
                    }
                );
        }

        if (elements.searchInput) {
            elements.searchInput
                .addEventListener(
                    "input",
                    function () {
                        window.clearTimeout(
                            state.searchTimer
                        );

                        state.searchTimer =
                            window.setTimeout(
                                function () {
                                    applyFilters(
                                        false
                                    );
                                },
                                140
                            );
                    }
                );

            elements.searchInput
                .addEventListener(
                    "keydown",
                    function (event) {
                        if (
                            event.key !==
                            "Escape"
                        ) {
                            return;
                        }

                        if (
                            elements.searchInput
                                .value
                        ) {
                            elements.searchInput
                                .value =
                                "";

                            applyFilters(true);
                        } else {
                            elements.searchInput
                                .blur();
                        }
                    }
                );
        }

        if (elements.roleFilter) {
            elements.roleFilter
                .addEventListener(
                    "change",
                    function () {
                        applyFilters(true);
                    }
                );
        }

        if (
            elements.protectionFilter
        ) {
            elements.protectionFilter
                .addEventListener(
                    "change",
                    function () {
                        applyFilters(true);
                    }
                );
        }

        if (elements.clearEmpty) {
            elements.clearEmpty
                .addEventListener(
                    "click",
                    function () {
                        resetFilters();

                        if (
                            elements.searchInput
                        ) {
                            elements.searchInput
                                .focus();
                        }
                    }
                );
        }

        applyFilters(false);

        /* ==========================================
           TABLE SORTING
        ========================================== */

        var sortableColumns = [
            {
                index: 0,
                key: "username",
                label: "Identity"
            },
            {
                index: 1,
                key: "id",
                label: "Identifier"
            },
            {
                index: 2,
                key: "roleLabel",
                label: "Role"
            },
            {
                index: 4,
                key: "createdAt",
                label: "Registered"
            }
        ];

        function compareValues(
            first,
            second,
            key
        ) {
            if (key === "id") {
                return (
                    Number(first) -
                    Number(second)
                );
            }

            if (
                key === "createdAt"
            ) {
                var firstDate =
                    Date.parse(first);

                var secondDate =
                    Date.parse(second);

                if (
                    !isNaN(firstDate) &&
                    !isNaN(secondDate)
                ) {
                    return (
                        firstDate -
                        secondDate
                    );
                }
            }

            return String(first)
                .localeCompare(
                    String(second),
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                );
        }

        function sortRows(
            key,
            label
        ) {
            if (!elements.tableBody) {
                return;
            }

            var direction =
                state.sortKey === key &&
                state.sortDirection ===
                    "asc"
                    ? "desc"
                    : "asc";

            var rows = getRows();

            rows.sort(
                function (
                    firstRow,
                    secondRow
                ) {
                    var first =
                        getRowData(
                            firstRow
                        )[key];

                    var second =
                        getRowData(
                            secondRow
                        )[key];

                    var result =
                        compareValues(
                            first,
                            second,
                            key
                        );

                    return (
                        direction ===
                        "desc"
                            ? -result
                            : result
                    );
                }
            );

            var fragment =
                document
                    .createDocumentFragment();

            rows.forEach(
                function (row) {
                    fragment.appendChild(
                        row
                    );
                }
            );

            elements.tableBody
                .appendChild(fragment);

            state.sortKey = key;
            state.sortDirection =
                direction;

            if (
                elements.table &&
                elements.table.tHead
            ) {
                all(
                    "th",
                    elements.table.tHead
                ).forEach(
                    function (header) {
                        header
                            .removeAttribute(
                                "aria-sort"
                            );
                    }
                );
            }

            sortableColumns.forEach(
                function (definition) {
                    if (
                        definition.key ===
                            key &&
                        elements.table &&
                        elements.table.tHead &&
                        elements.table
                            .tHead.rows[0]
                    ) {
                        var header =
                            elements.table
                                .tHead.rows[0]
                                .cells[
                                    definition
                                        .index
                                ];

                        if (header) {
                            header.setAttribute(
                                "aria-sort",
                                direction ===
                                    "asc"
                                    ? "ascending"
                                    : "descending"
                            );
                        }
                    }
                }
            );

            applyFilters(false);

            announce(
                "Directory sorted by " +
                    label +
                    " " +
                    (
                        direction ===
                        "asc"
                            ? "ascending."
                            : "descending."
                    )
            );
        }

        if (
            elements.table &&
            elements.table.tHead &&
            elements.table
                .tHead.rows[0]
        ) {
            sortableColumns.forEach(
                function (definition) {
                    var header =
                        elements.table
                            .tHead.rows[0]
                            .cells[
                                definition.index
                            ];

                    if (!header) {
                        return;
                    }

                    header.tabIndex = 0;

                    header.setAttribute(
                        "role",
                        "button"
                    );

                    header.setAttribute(
                        "aria-label",
                        "Sort by " +
                            definition.label
                    );

                    header.style.cursor =
                        "pointer";

                    function activateSort() {
                        sortRows(
                            definition.key,
                            definition.label
                        );
                    }

                    header.addEventListener(
                        "click",
                        activateSort
                    );

                    header.addEventListener(
                        "keydown",
                        function (event) {
                            if (
                                event.key !==
                                    "Enter" &&
                                event.key !==
                                    " "
                            ) {
                                return;
                            }

                            event.preventDefault();
                            activateSort();
                        }
                    );
                }
            );
        }

        /* ==========================================
           MODAL AND DRAWER HELPERS
        ========================================== */

        function getFocusable(
            container
        ) {
            if (!container) {
                return [];
            }

            return all(
                [
                    "a[href]",
                    "button:not([disabled])",
                    "input:not([disabled])",
                    "select:not([disabled])",
                    "textarea:not([disabled])",
                    '[tabindex]:not([tabindex="-1"])'
                ].join(","),
                container
            ).filter(
                function (element) {
                    var style =
                        window
                            .getComputedStyle(
                                element
                            );

                    return (
                        !element.hidden &&
                        style.display !==
                            "none" &&
                        style.visibility !==
                            "hidden"
                    );
                }
            );
        }

        function lockScroll(locked) {
            document.documentElement
                .style.overflow =
                locked ? "hidden" : "";

            document.body.style.overflow =
                locked ? "hidden" : "";
        }

        function openLayer(
            layer,
            focusTarget,
            trigger
        ) {
            if (!layer) {
                return;
            }

            closeActiveLayer(false);

            state.activeLayer = layer;

            state.previousFocus =
                trigger ||
                document.activeElement;

            layer.setAttribute(
                "aria-hidden",
                "false"
            );

            layer.classList.add(
                "is-open"
            );

            lockScroll(true);

            window.setTimeout(
                function () {
                    if (
                        focusTarget &&
                        typeof focusTarget
                            .focus ===
                            "function"
                    ) {
                        focusTarget.focus();
                    }
                },
                50
            );
        }

        function closeLayer(
            layer,
            restoreFocus
        ) {
            if (!layer) {
                return;
            }

            layer.setAttribute(
                "aria-hidden",
                "true"
            );

            layer.classList.remove(
                "is-open"
            );

            if (
                state.activeLayer ===
                layer
            ) {
                state.activeLayer = null;
            }

            lockScroll(false);

            if (
                restoreFocus !== false &&
                state.previousFocus &&
                typeof state.previousFocus
                    .focus === "function"
            ) {
                state.previousFocus.focus();
            }
        }

        function trapFocus(event) {
            if (
                event.key !== "Tab" ||
                !state.activeLayer
            ) {
                return;
            }

            var focusable =
                getFocusable(
                    state.activeLayer
                );

            if (!focusable.length) {
                event.preventDefault();
                return;
            }

            var first = focusable[0];

            var last =
                focusable[
                    focusable.length - 1
                ];

            if (
                event.shiftKey &&
                document.activeElement ===
                    first
            ) {
                event.preventDefault();
                last.focus();
                return;
            }

            if (
                !event.shiftKey &&
                document.activeElement ===
                    last
            ) {
                event.preventDefault();
                first.focus();
            }
        }

        /* ==========================================
           INSPECTION DRAWER
        ========================================== */

        function populateInspection(
            row
        ) {
            var data =
                getRowData(row);

            if (
                elements.inspectAvatar
            ) {
                elements.inspectAvatar
                    .textContent =
                    data.username
                        .charAt(0)
                        .toUpperCase() ||
                    "U";
            }

            if (
                elements.inspectUsername
            ) {
                elements.inspectUsername
                    .textContent =
                    data.username;
            }

            if (
                elements.inspectEmail
            ) {
                elements.inspectEmail
                    .textContent =
                    data.email ||
                    "Email not recorded";
            }

            if (elements.inspectId) {
                elements.inspectId
                    .textContent =
                    data.id;
            }

            if (
                elements.inspectRole
            ) {
                elements.inspectRole
                    .textContent =
                    data.roleLabel;
            }

            if (
                elements.inspectState
            ) {
                elements.inspectState
                    .textContent =
                    "Registered";
            }

            if (
                elements
                    .inspectProtection
            ) {
                elements
                    .inspectProtection
                    .textContent =
                    data.protection ===
                        "protected"
                        ? "Protected"
                        : "Manageable";
            }

            if (
                elements.inspectCreated
            ) {
                elements.inspectCreated
                    .textContent =
                    data.createdAt ||
                    "Not recorded";
            }

            return data;
        }

        function openInspectionDrawer(
            row,
            trigger
        ) {
            if (!elements.drawer) {
                return;
            }

            var data =
                populateInspection(row);

            elements.drawer.setAttribute(
                "data-active-user-id",
                data.id
            );

            row.classList.add(
                "is-highlighted"
            );

            if (
                elements.drawerBackdrop
            ) {
                elements.drawerBackdrop
                    .setAttribute(
                        "aria-hidden",
                        "false"
                    );

                elements.drawerBackdrop
                    .classList.add(
                        "is-open"
                    );
            }

            openLayer(
                elements.drawer,
                elements.closeDrawer,
                trigger
            );

            announce(
                "Account details opened for " +
                    data.username +
                    "."
            );
        }

        function closeInspectionDrawer(
            restoreFocus
        ) {
            if (!elements.drawer) {
                return;
            }

            var activeId =
                elements.drawer
                    .getAttribute(
                        "data-active-user-id"
                    );

            getRows().forEach(
                function (row) {
                    if (
                        row.getAttribute(
                            "data-user-id"
                        ) === activeId
                    ) {
                        row.classList.remove(
                            "is-highlighted"
                        );
                    }
                }
            );

            elements.drawer.removeAttribute(
                "data-active-user-id"
            );

            elements.drawer.setAttribute(
                "aria-hidden",
                "true"
            );

            elements.drawer.classList.remove(
                "is-open"
            );

            if (
                elements.drawerBackdrop
            ) {
                elements.drawerBackdrop
                    .setAttribute(
                        "aria-hidden",
                        "true"
                    );

                elements.drawerBackdrop
                    .classList.remove(
                        "is-open"
                    );
            }

            if (
                state.activeLayer ===
                elements.drawer
            ) {
                state.activeLayer = null;
            }

            lockScroll(false);

            if (
                restoreFocus !== false &&
                state.previousFocus &&
                typeof state.previousFocus
                    .focus === "function"
            ) {
                state.previousFocus.focus();
            }

            announce(
                "Account details closed."
            );
        }

        all(
            "[data-inspect-user]",
            page
        ).forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    var row =
                        button.closest(
                            "[data-user-row]"
                        );

                    if (row) {
                        openInspectionDrawer(
                            row,
                            button
                        );
                    }
                }
            );
        });

        if (elements.closeDrawer) {
            elements.closeDrawer
                .addEventListener(
                    "click",
                    function () {
                        closeInspectionDrawer(
                            true
                        );
                    }
                );
        }

        if (
            elements.drawerBackdrop
        ) {
            elements.drawerBackdrop
                .addEventListener(
                    "click",
                    function () {
                        closeInspectionDrawer(
                            true
                        );
                    }
                );
        }

        getRows().forEach(
            function (row) {
                row.tabIndex = 0;

                row.addEventListener(
                    "dblclick",
                    function (event) {
                        if (
                            event.target.closest(
                                "a,button,input,select"
                            )
                        ) {
                            return;
                        }

                        openInspectionDrawer(
                            row,
                            row
                        );
                    }
                );

                row.addEventListener(
                    "keydown",
                    function (event) {
                        if (
                            event.key !==
                                "Enter" &&
                            event.key !==
                                " "
                        ) {
                            return;
                        }

                        if (
                            event.target.closest(
                                "a,button,input,select"
                            )
                        ) {
                            return;
                        }

                        event.preventDefault();

                        openInspectionDrawer(
                            row,
                            row
                        );
                    }
                );
            }
        );

        /* ==========================================
           DELETE CONFIRMATION
        ========================================== */

        function openDeleteModal(
            link
        ) {
            var url =
                link.getAttribute(
                    "href"
                );

            var username =
                link.getAttribute(
                    "data-username"
                ) ||
                "this user";

            var userId =
                link.getAttribute(
                    "data-user-id"
                ) ||
                "—";

            var role =
                link.getAttribute(
                    "data-role"
                ) ||
                "Unknown";

            if (!url) {
                return;
            }

            if (
                !elements.deleteModal ||
                !elements.confirmDelete
            ) {
                if (
                    window.confirm(
                        'Delete the account for "' +
                            username +
                            '"?'
                    )
                ) {
                    window.location.assign(
                        url
                    );
                }

                return;
            }

            state.deleteUrl = url;

            if (
                elements.deleteUsername
            ) {
                elements.deleteUsername
                    .textContent =
                    username;
            }

            if (elements.deleteId) {
                elements.deleteId
                    .textContent =
                    userId;
            }

            if (elements.deleteRole) {
                elements.deleteRole
                    .textContent =
                    role;
            }

            elements.confirmDelete
                .setAttribute(
                    "href",
                    url
                );

            openLayer(
                elements.deleteModal,
                elements.cancelDelete,
                link
            );

            announce(
                "Delete confirmation opened for " +
                    username +
                    "."
            );
        }

        function closeDeleteModal() {
            if (state.deleteBusy) {
                return;
            }

            closeLayer(
                elements.deleteModal,
                true
            );

            state.deleteUrl = "";

            announce(
                "Delete confirmation closed."
            );
        }

        all(
            "[data-delete-user]",
            page
        ).forEach(function (link) {
            link.addEventListener(
                "click",
                function (event) {
                    if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey
                    ) {
                        return;
                    }

                    event.preventDefault();

                    openDeleteModal(link);
                }
            );
        });

        if (
            elements.closeDeleteModal
        ) {
            elements.closeDeleteModal
                .addEventListener(
                    "click",
                    closeDeleteModal
                );
        }

        if (elements.cancelDelete) {
            elements.cancelDelete
                .addEventListener(
                    "click",
                    closeDeleteModal
                );
        }

        all(
            "[data-close-users-delete]",
            elements.deleteModal ||
                page
        ).forEach(
            function (backdrop) {
                backdrop.addEventListener(
                    "click",
                    closeDeleteModal
                );
            }
        );

        if (
            elements.confirmDelete
        ) {
            elements.confirmDelete
                .addEventListener(
                    "click",
                    function (event) {
                        if (
                            state.deleteBusy ||
                            !state.deleteUrl
                        ) {
                            event.preventDefault();
                            return;
                        }

                        event.preventDefault();

                        state.deleteBusy =
                            true;

                        elements.confirmDelete
                            .setAttribute(
                                "aria-disabled",
                                "true"
                            );

                        elements.confirmDelete
                            .innerHTML =
                            '<i class="fa-solid fa-circle-notch fa-spin"></i> ' +
                            "Deleting Account";

                        announce(
                            "Deleting user account."
                        );

                        window.setTimeout(
                            function () {
                                window.location
                                    .assign(
                                        state
                                            .deleteUrl
                                    );
                            },
                            prefersReducedMotion()
                                ? 10
                                : 220
                        );
                    }
                );
        }

        /* ==========================================
           SECURITY OVERVIEW
        ========================================== */

        function openSecurityModal() {
            if (
                !elements.securityModal
            ) {
                return;
            }

            openLayer(
                elements.securityModal,
                elements
                    .closeSecurityModal,
                elements.securityButton
            );

            announce(
                "Identity security overview opened."
            );
        }

        function closeSecurityModal() {
            closeLayer(
                elements.securityModal,
                true
            );

            announce(
                "Identity security overview closed."
            );
        }

        if (
            elements.securityButton
        ) {
            elements.securityButton
                .addEventListener(
                    "click",
                    openSecurityModal
                );
        }

        if (
            elements.closeSecurityModal
        ) {
            elements.closeSecurityModal
                .addEventListener(
                    "click",
                    closeSecurityModal
                );
        }

        all(
            "[data-close-users-security]",
            elements.securityModal ||
                page
        ).forEach(
            function (backdrop) {
                backdrop.addEventListener(
                    "click",
                    closeSecurityModal
                );
            }
        );

        /* ==========================================
           ACTIVE LAYER CLOSING
        ========================================== */

        function closeActiveLayer(
            restoreFocus
        ) {
            if (!state.activeLayer) {
                return;
            }

            if (
                state.activeLayer ===
                    elements.deleteModal &&
                state.deleteBusy
            ) {
                return;
            }

            if (
                state.activeLayer ===
                elements.drawer
            ) {
                closeInspectionDrawer(
                    restoreFocus
                );

                return;
            }

            if (
                state.activeLayer ===
                elements.securityModal
            ) {
                closeLayer(
                    elements.securityModal,
                    restoreFocus
                );

                return;
            }

            if (
                state.activeLayer ===
                elements.deleteModal
            ) {
                closeLayer(
                    elements.deleteModal,
                    restoreFocus
                );
            }
        }

        /* ==========================================
           KEYBOARD CONTROLS
        ========================================== */

        document.addEventListener(
            "keydown",
            function (event) {
                trapFocus(event);

                if (
                    (
                        event.metaKey ||
                        event.ctrlKey
                    ) &&
                    event.key
                        .toLowerCase() ===
                        "k"
                ) {
                    event.preventDefault();

                    if (
                        elements.searchInput
                    ) {
                        elements.searchInput
                            .focus();

                        elements.searchInput
                            .select();
                    }

                    announce(
                        "User directory search focused."
                    );

                    return;
                }

                if (
                    event.key ===
                        "Escape" &&
                    state.activeLayer
                ) {
                    closeActiveLayer(
                        true
                    );
                }
            }
        );

        /* ==========================================
           INTELLIGENCE TICKER
        ========================================== */

        if (
            elements.ticker &&
            elements.ticker
                .getAttribute(
                    "data-users-ticker-ready"
                ) !== "true"
        ) {
            elements.ticker.setAttribute(
                "data-users-ticker-ready",
                "true"
            );

            Array.prototype.slice
                .call(
                    elements.ticker
                        .children
                )
                .forEach(
                    function (item) {
                        var clone =
                            item.cloneNode(
                                true
                            );

                        clone.setAttribute(
                            "aria-hidden",
                            "true"
                        );

                        elements.ticker
                            .appendChild(
                                clone
                            );
                    }
                );
        }

        /* ==========================================
           CURSOR LIGHT
        ========================================== */

        if (
            elements.cursorLight &&
            window.matchMedia &&
            window.matchMedia(
                "(pointer: fine)"
            ).matches &&
            !prefersReducedMotion()
        ) {
            document.addEventListener(
                "pointermove",
                function (event) {
                    state.cursorX =
                        event.clientX;

                    state.cursorY =
                        event.clientY;

                    if (
                        state.cursorFrame
                    ) {
                        return;
                    }

                    state.cursorFrame =
                        window
                            .requestAnimationFrame(
                                function () {
                                    state.cursorFrame =
                                        null;

                                    elements
                                        .cursorLight
                                        .style
                                        .transform =
                                        "translate3d(" +
                                        (
                                            state
                                                .cursorX -
                                            260
                                        ) +
                                        "px," +
                                        (
                                            state
                                                .cursorY -
                                            260
                                        ) +
                                        "px,0)";
                                }
                            );
                },
                { passive: true }
            );
        }

        /* ==========================================
           CANVAS EFFECTS
        ========================================== */

        function startCanvas(
            canvas,
            mode
        ) {
            if (
                !canvas ||
                prefersReducedMotion()
            ) {
                return;
            }

            var context =
                canvas.getContext("2d");

            if (!context) {
                return;
            }

            var width = 1;
            var height = 1;
            var items = [];
            var frame = null;

            function resize() {
                var rectangle =
                    canvas
                        .getBoundingClientRect();

                var ratio = Math.min(
                    window.devicePixelRatio ||
                        1,
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

                var count =
                    mode === "nodes"
                        ? width < 700
                            ? 18
                            : 36
                        : width < 700
                        ? 8
                        : 16;

                items = [];

                for (
                    var index = 0;
                    index < count;
                    index += 1
                ) {
                    if (
                        mode === "nodes"
                    ) {
                        items.push({
                            x:
                                Math.random() *
                                width,

                            y:
                                Math.random() *
                                height,

                            vx:
                                (
                                    Math.random() -
                                    0.5
                                ) *
                                0.14,

                            vy:
                                (
                                    Math.random() -
                                    0.5
                                ) *
                                0.14,

                            radius:
                                0.8 +
                                Math.random()
                        });
                    } else {
                        items.push({
                            x:
                                Math.random() *
                                width,

                            y:
                                Math.random() *
                                height,

                            speed:
                                0.25 +
                                Math.random() *
                                0.5,

                            length:
                                25 +
                                Math.random() *
                                70
                        });
                    }
                }
            }

            function drawNodes() {
                items.forEach(
                    function (item) {
                        item.x += item.vx;
                        item.y += item.vy;

                        if (
                            item.x < 0 ||
                            item.x > width
                        ) {
                            item.vx *= -1;
                        }

                        if (
                            item.y < 0 ||
                            item.y > height
                        ) {
                            item.vy *= -1;
                        }

                        context.beginPath();

                        context.arc(
                            item.x,
                            item.y,
                            item.radius,
                            0,
                            Math.PI * 2
                        );

                        context.fillStyle =
                            "rgba(82,220,233,.38)";

                        context.fill();
                    }
                );

                for (
                    var first = 0;
                    first <
                    items.length;
                    first += 1
                ) {
                    for (
                        var second =
                            first + 1;
                        second <
                        items.length;
                        second += 1
                    ) {
                        var distance =
                            Math.hypot(
                                items[first].x -
                                    items[second]
                                        .x,

                                items[first].y -
                                    items[second]
                                        .y
                            );

                        if (
                            distance > 120
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

                        context.strokeStyle =
                            "rgba(82,220,233," +
                            (
                                (
                                    1 -
                                    distance /
                                        120
                                ) *
                                0.07
                            ) +
                            ")";

                        context.lineWidth =
                            0.7;

                        context.stroke();
                    }
                }
            }

            function drawStreams() {
                items.forEach(
                    function (item) {
                        item.x +=
                            item.speed;

                        if (
                            item.x -
                                item.length >
                            width
                        ) {
                            item.x =
                                -item.length;

                            item.y =
                                Math.random() *
                                height;
                        }

                        var gradient =
                            context
                                .createLinearGradient(
                                    item.x -
                                        item.length,
                                    item.y,
                                    item.x,
                                    item.y
                                );

                        gradient
                            .addColorStop(
                                0,
                                "rgba(82,220,233,0)"
                            );

                        gradient
                            .addColorStop(
                                1,
                                "rgba(82,220,233,.05)"
                            );

                        context.beginPath();

                        context.moveTo(
                            item.x -
                                item.length,
                            item.y
                        );

                        context.lineTo(
                            item.x,
                            item.y
                        );

                        context.strokeStyle =
                            gradient;

                        context.lineWidth =
                            1;

                        context.stroke();
                    }
                );
            }

            function draw() {
                context.clearRect(
                    0,
                    0,
                    width,
                    height
                );

                if (
                    mode === "nodes"
                ) {
                    drawNodes();
                } else {
                    drawStreams();
                }

                frame =
                    window
                        .requestAnimationFrame(
                            draw
                        );
            }

            resize();
            draw();

            window.addEventListener(
                "resize",
                resize
            );

            document.addEventListener(
                "visibilitychange",
                function () {
                    if (
                        document.hidden &&
                        frame
                    ) {
                        window
                            .cancelAnimationFrame(
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
        }

        startCanvas(
            elements.identityCanvas,
            "nodes"
        );

        startCanvas(
            elements.accessCanvas,
            "streams"
        );

        /* ==========================================
           NATIVE LINKS
        ========================================== */

        var refreshLink = one(
            ".usrx-command-header__controls a.usrx-icon-button",
            page
        );

        if (refreshLink) {
            refreshLink
                .addEventListener(
                    "click",
                    function () {
                        var icon =
                            refreshLink
                                .querySelector(
                                    "i"
                                );

                        if (icon) {
                            icon.classList.add(
                                "fa-spin"
                            );
                        }

                        showToast(
                            "Refreshing directory",
                            "Loading the latest registered users.",
                            "info"
                        );
                    }
                );
        }

        var registerLink = one(
            'a.usrx-primary-action[href*="signup"]',
            page
        );

        if (registerLink) {
            registerLink
                .addEventListener(
                    "click",
                    function () {
                        showToast(
                            "Opening registration",
                            "Preparing the secure user-registration page.",
                            "info"
                        );
                    }
                );
        }

        /* ==========================================
           COMPLETE
        ========================================== */

        announce(
            "User directory loaded. " +
                getRows().length +
                " registered users."
        );

        console.info(
            "[Users Workspace] users.js initialized successfully."
        );
    });
})();