/**
 * AI Threat Detection System
 * Security Tools Page Controller
 *
 * File: static/js/security_tools.js
 *
 * This script is intentionally page-scoped. It does nothing unless
 * #securityToolsPage exists.
 */
(() => {
    "use strict";

    const ready = (callback) => {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    };

    ready(() => {
        const page = document.getElementById("securityToolsPage");

        if (!page) {
            return;
        }

        if (page.dataset.securityToolsReady === "true") {
            return;
        }

        page.dataset.securityToolsReady = "true";

        const $ = (selector, root = page) => root.querySelector(selector);
        const $$ = (selector, root = page) => Array.from(root.querySelectorAll(selector));

        const elements = {
            clock: document.getElementById("securityLocalClock"),
            date: document.getElementById("securityLocalDate"),
            liveRegion: document.getElementById("securityToolsAccessibilityStatus"),

            workspace: document.getElementById("securityToolWorkspace"),
            ticker: document.getElementById("securityIntelligenceTicker"),

            overallChip: document.getElementById("overallStatusChip"),
            overallTitle: document.getElementById("toolStatus"),
            overallDetail: document.getElementById("toolStatusDetail"),

            nmapForm: document.getElementById("nmapForm"),
            target: document.getElementById("target"),
            nmapError: document.getElementById("nmapTargetError"),
            nmapCard: document.getElementById("nmapToolCard"),
            nmapCardStatus: document.getElementById("nmapCardStatus"),
            nmapChip: document.getElementById("nmapStatusChip"),
            nmapProgress: document.getElementById("nmapProgress"),
            nmapSubmit: document.getElementById("nmapSubmit"),
            nmapResult: document.getElementById("nmapResult"),
            nmapResultPanel: document.getElementById("nmapResultPanel"),

            pcapForm: document.getElementById("pcapForm"),
            pcapInput: document.getElementById("pcapFile"),
            pcapDropZone: document.getElementById("pcapDropZone"),
            pcapSelected: document.getElementById("pcapSelectedFile"),
            pcapName: document.getElementById("pcapSelectedFileName"),
            pcapMeta: document.getElementById("pcapSelectedFileMeta"),
            pcapRemove: document.getElementById("removePcapFile"),
            pcapError: document.getElementById("pcapFileError"),
            pcapCard: document.getElementById("pcapToolCard"),
            pcapCardStatus: document.getElementById("pcapCardStatus"),
            pcapChip: document.getElementById("pcapStatusChip"),
            pcapProgress: document.getElementById("pcapProgress"),
            pcapSubmit: document.getElementById("pcapSubmit"),
            pcapResult: document.getElementById("pcapResult"),
            pcapResultPanel: document.getElementById("pcapResultPanel"),

            penButton: document.getElementById("penTestButton"),
            penCard: document.getElementById("penToolCard"),
            penCardStatus: document.getElementById("penCardStatus"),
            penChip: document.getElementById("penStatusChip"),
            penProgress: document.getElementById("penProgress"),
            penResult: document.getElementById("penResult"),
            penResultPanel: document.getElementById("penResultPanel"),

            policyButton: document.getElementById("securityPolicyButton"),
            policyModal: document.getElementById("securityPolicyModal"),
            policyClose: document.getElementById("closeSecurityPolicyModal"),
            policyAcknowledge: document.getElementById("acknowledgeSecurityPolicy"),

            activityList: document.getElementById("securityActivityList"),
            activityStart: document.getElementById("securityActivityStartTime"),
            clearActivity: document.getElementById("clearSecurityActivity"),

            toastRegion: document.getElementById("securityToolsToastRegion"),
            cursorLight: document.getElementById("securityCursorLight"),
            networkCanvas: document.getElementById("securityNetworkCanvas"),
            packetCanvas: document.getElementById("securityPacketCanvas")
        };

        const endpoints = {
            nmap: page.dataset.nmapUrl || "/run_nmap",
            pcap: page.dataset.pcapUrl || "/read_pcap",
            pentest: page.dataset.pentestUrl || "/penetration_report"
        };

        const state = {
            busy: {
                nmap: false,
                pcap: false,
                pentest: false
            },
            modalOpen: false,
            previousFocus: null,
            cursorFrame: null,
            visible: !document.hidden
        };

        const originalButtonHtml = {
            nmap: elements.nmapSubmit ? elements.nmapSubmit.innerHTML : "",
            pcap: elements.pcapSubmit ? elements.pcapSubmit.innerHTML : "",
            pentest: elements.penButton ? elements.penButton.innerHTML : ""
        };

        const toolElements = {
            nmap: {
                card: elements.nmapCard,
                status: elements.nmapCardStatus,
                chip: elements.nmapChip,
                progress: elements.nmapProgress,
                button: elements.nmapSubmit
            },
            pcap: {
                card: elements.pcapCard,
                status: elements.pcapCardStatus,
                chip: elements.pcapChip,
                progress: elements.pcapProgress,
                button: elements.pcapSubmit
            },
            pentest: {
                card: elements.penCard,
                status: elements.penCardStatus,
                chip: elements.penChip,
                progress: elements.penProgress,
                button: elements.penButton
            }
        };

        const escapeHtml = (value) =>
            String(value ?? "")
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#039;");

        const text = (value) => String(value ?? "").trim();

        const announce = (message) => {
            if (!elements.liveRegion) {
                return;
            }

            elements.liveRegion.textContent = "";

            window.setTimeout(() => {
                elements.liveRegion.textContent = message;
            }, 20);
        };

        const formatBytes = (bytes) => {
            const value = Number(bytes);

            if (!Number.isFinite(value) || value < 0) {
                return "Unknown size";
            }

            if (value === 0) {
                return "0 B";
            }

            const units = ["B", "KB", "MB", "GB"];
            const index = Math.min(
                Math.floor(Math.log(value) / Math.log(1024)),
                units.length - 1
            );

            const converted = value / Math.pow(1024, index);

            return `${converted.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
        };

        const smoothScroll = (element) => {
            if (!element) {
                return;
            }

            const reducedMotion =
                window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            element.scrollIntoView({
                behavior: reducedMotion ? "auto" : "smooth",
                block: "start"
            });
        };

        const setOverall = (status, title, detail) => {
            if (elements.overallChip) {
                elements.overallChip.dataset.toolStatus = status;

                const labels = {
                    ready: "STANDBY",
                    running: "RUNNING",
                    success: "COMPLETE",
                    error: "FAILED"
                };

                elements.overallChip.textContent = labels[status] || "STANDBY";
            }

            if (elements.overallTitle) {
                elements.overallTitle.textContent = title;
            }

            if (elements.overallDetail) {
                elements.overallDetail.textContent = detail;
            }
        };

        const updatePageBusy = () => {
            const busy = Object.values(state.busy).some(Boolean);
            page.classList.toggle("is-busy", busy);
        };

        const setToolState = (toolName, status, label) => {
            const tool = toolElements[toolName];

            if (!tool) {
                return;
            }

            state.busy[toolName] = status === "running";
            updatePageBusy();

            if (tool.card) {
                tool.card.classList.remove("is-running", "is-success", "is-error");

                if (["running", "success", "error"].includes(status)) {
                    tool.card.classList.add(`is-${status}`);
                }
            }

            [tool.status, tool.chip].forEach((node) => {
                if (!node) {
                    return;
                }

                node.classList.remove("is-running", "is-success", "is-error");
                node.dataset.toolStatus = status;

                if (["running", "success", "error"].includes(status)) {
                    node.classList.add(`is-${status}`);
                }

                node.textContent = label;
            });

            if (tool.progress) {
                const active = status === "running";
                tool.progress.classList.toggle("is-active", active);
                tool.progress.setAttribute("aria-hidden", active ? "false" : "true");
            }
        };

        const setButtonBusy = (toolName, busy, title = "") => {
            const tool = toolElements[toolName];
            const button = tool?.button;

            if (!button) {
                return;
            }

            if (!busy) {
                button.removeAttribute("aria-busy");
                button.removeAttribute("aria-disabled");
                button.classList.remove("is-disabled");

                if (button.tagName === "BUTTON") {
                    button.disabled = false;
                }

                button.innerHTML = originalButtonHtml[toolName];
                return;
            }

            button.setAttribute("aria-busy", "true");
            button.setAttribute("aria-disabled", "true");
            button.classList.add("is-disabled");

            if (button.tagName === "BUTTON") {
                button.disabled = true;
            }

            button.innerHTML = `
                <span class="sectx-tool-submit__icon">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                </span>

                <span class="sectx-tool-submit__copy">
                    <strong>${escapeHtml(title)}</strong>
                    <small>Secure operation in progress</small>
                </span>

                <i class="fa-solid fa-hourglass-half"></i>
            `;
        };

        const showToast = (
            title,
            message,
            type = "info",
            duration = 3800
        ) => {
            if (!elements.toastRegion) {
                return;
            }

            const allowed = new Set(["info", "success", "warning", "error"]);
            const safeType = allowed.has(type) ? type : "info";

            const iconMap = {
                info: "fa-circle-info",
                success: "fa-circle-check",
                warning: "fa-triangle-exclamation",
                error: "fa-circle-xmark"
            };

            const toast = document.createElement("article");
            toast.className = `sectx-toast sectx-toast--${safeType}`;
            toast.setAttribute("role", safeType === "error" ? "alert" : "status");

            toast.innerHTML = `
                <span aria-hidden="true">
                    <i class="fa-solid ${iconMap[safeType]}"></i>
                </span>

                <div>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(message)}</p>
                </div>

                <button type="button" aria-label="Dismiss notification">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            const dismiss = () => {
                if (!toast.isConnected) {
                    return;
                }

                toast.classList.add("is-leaving");

                window.setTimeout(() => {
                    toast.remove();
                }, 230);
            };

            const closeButton = toast.querySelector("button");

            if (closeButton) {
                closeButton.addEventListener("click", dismiss);
            }

            elements.toastRegion.appendChild(toast);
            window.setTimeout(dismiss, duration);
        };

        const addActivity = (title, detail, type = "info") => {
            if (!elements.activityList) {
                return;
            }

            const iconMap = {
                info: "fa-circle-info",
                success: "fa-circle-check",
                warning: "fa-triangle-exclamation",
                error: "fa-circle-xmark",
                nmap: "fa-satellite-dish",
                pcap: "fa-file-waveform",
                pentest: "fa-shield-halved"
            };

            const safeType = iconMap[type] ? type : "info";
            const item = document.createElement("li");

            item.className = "sectx-activity-item";

            if (safeType === "success") {
                item.classList.add("is-success");
            }

            if (safeType === "error") {
                item.classList.add("is-error");
            }

            item.innerHTML = `
                <span class="sectx-activity-item__marker">
                    <i class="fa-solid ${iconMap[safeType]}"></i>
                </span>

                <div>
                    <strong>${escapeHtml(title)}</strong>
                    <span>${escapeHtml(detail)}</span>
                </div>

                <time>
                    ${new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                    })}
                </time>
            `;

            elements.activityList.prepend(item);

            while (elements.activityList.children.length > 25) {
                elements.activityList.lastElementChild?.remove();
            }
        };

        const updateClock = () => {
            const now = new Date();

            if (elements.clock) {
                elements.clock.textContent = now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false
                });
            }

            if (elements.date) {
                elements.date.textContent = now.toLocaleDateString([], {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });
            }
        };

        const isValidIpv4 = (value) => {
            const parts = value.split(".");

            if (parts.length !== 4) {
                return false;
            }

            return parts.every((part) => {
                if (!/^\d{1,3}$/.test(part)) {
                    return false;
                }

                const number = Number(part);

                return number >= 0 && number <= 255;
            });
        };

        const isValidIpv6 = (value) =>
            value.includes(":") &&
            /^[0-9a-fA-F:]+$/.test(value) &&
            value.length <= 45;

        const isValidHostname = (value) =>
            value.length <= 253 &&
            /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/.test(value);

        const validateTarget = (showMessage = false) => {
            if (!elements.target) {
                return false;
            }

            const value = text(elements.target.value);
            const valid =
                Boolean(value) &&
                (isValidIpv4(value) || isValidIpv6(value) || isValidHostname(value));

            const shell = elements.target.closest(".sectx-input-shell");

            shell?.classList.toggle("is-valid", valid);
            shell?.classList.toggle("is-invalid", Boolean(value) && !valid);

            elements.target.setAttribute("aria-invalid", valid ? "false" : "true");

            if (elements.nmapError) {
                if (!showMessage || valid) {
                    elements.nmapError.textContent = "";
                } else if (!value) {
                    elements.nmapError.textContent =
                        "An authorized IP address or hostname is required.";
                } else {
                    elements.nmapError.textContent =
                        "Enter a valid IP address or hostname.";
                }
            }

            return valid;
        };

        const parseResponse = async (response) => {
            const body = await response.text();
            const contentType = (response.headers.get("content-type") || "").toLowerCase();

            let json = null;

            if (contentType.includes("application/json")) {
                try {
                    json = JSON.parse(body);
                } catch {
                    json = null;
                }
            }

            return {
                response,
                body,
                json,
                contentType
            };
        };

        const getServerMessage = (payload, fallback) => {
            const serverMessage =
                payload?.json?.message ||
                payload?.json?.Error;

            if (text(serverMessage)) {
                return text(serverMessage);
            }

            if (payload?.response?.status === 401) {
                return "Your login session has expired.";
            }

            if (payload?.response?.status === 403) {
                return "Your account is not authorized for this operation.";
            }

            if (payload?.response?.status >= 500) {
                return "The security tool encountered a server error.";
            }

            return fallback;
        };

        const renderNmapResult = (data) => {
            if (!elements.nmapResult) {
                return;
            }

            if (text(data.raw_output)) {
                elements.nmapResult.textContent = text(data.raw_output);
                return;
            }

            const ports = Array.isArray(data.ports) ? data.ports : [];

            const lines = [
                `Target: ${text(data.target) || "Unknown"}`,
                `Open ports: ${Number(data.total_open_ports || ports.length || 0)}`,
                ""
            ];

            if (!ports.length) {
                lines.push("No open ports were reported.");
            } else {
                lines.push("PORT\tSTATE\tSERVICE");

                ports.forEach((port) => {
                    lines.push(
                        `${text(port.port)}\t${text(port.state)}\t${text(port.service)}`
                    );
                });
            }

            elements.nmapResult.textContent = lines.join("\n");
        };

        const runNmap = async (event) => {
            event.preventDefault();

            if (state.busy.nmap || !elements.nmapForm || !elements.target) {
                return;
            }

            if (!validateTarget(true)) {
                setToolState("nmap", "error", "INVALID");
                setOverall(
                    "error",
                    "Target validation failed",
                    "Enter a valid authorized IP address or hostname."
                );
                showToast(
                    "Invalid target",
                    "Enter a valid IP address or hostname.",
                    "warning"
                );
                addActivity(
                    "Network scan blocked",
                    "The target did not pass validation.",
                    "warning"
                );
                elements.target.focus();
                return;
            }

            const target = text(elements.target.value);
            const formData = new FormData(elements.nmapForm);

            setToolState("nmap", "running", "SCANNING");
            setButtonBusy("nmap", true, "Scanning Network");
            setOverall(
                "running",
                "Network scan running",
                `Reviewing ${target} for open services.`
            );

            if (elements.nmapResult) {
                elements.nmapResult.textContent =
                    `Initializing scan for ${target}...\n\nWaiting for the Nmap backend.`;
            }

            addActivity(
                "Network scan started",
                `Authorized target: ${target}`,
                "nmap"
            );

            announce(`Network scan started for ${target}.`);

            try {
                const response = await fetch(endpoints.nmap, {
                    method: "POST",
                    body: formData,
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                const payload = await parseResponse(response);

                if (!payload.json) {
                    throw new Error(
                        getServerMessage(
                            payload,
                            "The Nmap endpoint returned an unexpected response."
                        )
                    );
                }

                if (!response.ok || payload.json.status !== "success") {
                    throw new Error(
                        getServerMessage(payload, "Network scan failed.")
                    );
                }

                renderNmapResult(payload.json);

                const openPorts = Number(
                    payload.json.total_open_ports ||
                    payload.json.ports?.length ||
                    0
                );

                setToolState("nmap", "success", "COMPLETE");
                setOverall(
                    "success",
                    "Network scan completed",
                    `${openPorts} open service(s) were reported.`
                );

                showToast(
                    "Network scan completed",
                    `${openPorts} open service(s) were reported for ${target}.`,
                    "success"
                );

                addActivity(
                    "Network scan completed",
                    `${target} returned ${openPorts} open service(s).`,
                    "success"
                );

                announce("Network scan completed.");
                smoothScroll(elements.nmapResultPanel);
            } catch (error) {
                const message = text(error.message) || "Unable to run the network scan.";

                if (elements.nmapResult) {
                    elements.nmapResult.textContent = `SCAN ERROR\n\n${message}`;
                }

                setToolState("nmap", "error", "FAILED");
                setOverall("error", "Network scan failed", message);
                showToast("Network scan failed", message, "error", 5600);
                addActivity("Network scan failed", message, "error");
                announce("Network scan failed.");

                console.error("[Security Tools] Nmap error:", error);
            } finally {
                setButtonBusy("nmap", false);
                state.busy.nmap = false;
                updatePageBusy();
            }
        };

        const acceptedPcap = (file) => {
            if (!file) {
                return false;
            }

            const name = file.name.toLowerCase();

            return name.endsWith(".pcap") || name.endsWith(".pcapng");
        };

        const selectedPcap = () =>
            elements.pcapInput?.files?.length
                ? elements.pcapInput.files[0]
                : null;

        const clearPcapError = () => {
            if (elements.pcapError) {
                elements.pcapError.textContent = "";
            }

            elements.pcapDropZone?.classList.remove("is-invalid");
            elements.pcapInput?.setAttribute("aria-invalid", "false");
        };

        const setPcapError = (message) => {
            if (elements.pcapError) {
                elements.pcapError.textContent = message;
            }

            elements.pcapDropZone?.classList.add("is-invalid");
            elements.pcapInput?.setAttribute("aria-invalid", "true");
        };

        const updatePcapSelection = () => {
            const file = selectedPcap();

            if (!file) {
                if (elements.pcapSelected) {
                    elements.pcapSelected.hidden = true;
                }

                clearPcapError();
                return false;
            }

            if (!acceptedPcap(file)) {
                if (elements.pcapSelected) {
                    elements.pcapSelected.hidden = true;
                }

                setPcapError("Choose a .pcap or .pcapng capture file.");
                return false;
            }

            clearPcapError();

            if (elements.pcapSelected) {
                elements.pcapSelected.hidden = false;
            }

            if (elements.pcapName) {
                elements.pcapName.textContent = file.name;
            }

            if (elements.pcapMeta) {
                elements.pcapMeta.textContent =
                    `${formatBytes(file.size)} • ${file.type || "Packet capture"}`;
            }

            announce(`Packet capture selected: ${file.name}.`);
            return true;
        };

        const assignDroppedFile = (file) => {
            if (!elements.pcapInput || typeof DataTransfer === "undefined") {
                return false;
            }

            try {
                const transfer = new DataTransfer();
                transfer.items.add(file);
                elements.pcapInput.files = transfer.files;
                return true;
            } catch {
                return false;
            }
        };

        const sanitizeServerHtml = (html) => {
            const parser = new DOMParser();
            const documentResult = parser.parseFromString(html, "text/html");

            documentResult
                .querySelectorAll(
                    "script, style, link, meta, iframe, object, embed, form, input, button"
                )
                .forEach((node) => node.remove());

            documentResult.querySelectorAll("*").forEach((node) => {
                Array.from(node.attributes).forEach((attribute) => {
                    const name = attribute.name.toLowerCase();
                    const value = attribute.value.toLowerCase();

                    if (
                        name.startsWith("on") ||
                        name === "style" ||
                        ((name === "href" || name === "src") &&
                            value.startsWith("javascript:"))
                    ) {
                        node.removeAttribute(attribute.name);
                    }
                });
            });

            const candidate =
                documentResult.querySelector(
                    "[data-pcap-result], .pcap-result, .pcap-report, .report-box, .result-container, .result-card, main"
                ) || documentResult.body;

            const wrapper = document.createElement("div");
            wrapper.className = "sectx-report";

            if (candidate) {
                wrapper.innerHTML = candidate.innerHTML;
            } else {
                wrapper.textContent = "Packet analysis completed.";
            }

            return wrapper;
        };

        const renderPcapJson = (data) => {
            if (!elements.pcapResult) {
                return;
            }

            elements.pcapResult.classList.remove("sectx-result-console__empty");

            const protocols =
                data.Protocols && typeof data.Protocols === "object"
                    ? data.Protocols
                    : {};

            const sources =
                data["Top Source IPs"] &&
                typeof data["Top Source IPs"] === "object"
                    ? data["Top Source IPs"]
                    : {};

            const destinations =
                data["Top Destination IPs"] &&
                typeof data["Top Destination IPs"] === "object"
                    ? data["Top Destination IPs"]
                    : {};

            const recommendations = Array.isArray(data.Recommendations)
                ? data.Recommendations
                : [];

            const list = (object, emptyMessage) => {
                const entries = Object.entries(object);

                if (!entries.length) {
                    return `<li>${escapeHtml(emptyMessage)}</li>`;
                }

                return entries
                    .map(
                        ([key, value]) =>
                            `<li>${escapeHtml(key)}: ${escapeHtml(value)}</li>`
                    )
                    .join("");
            };

            elements.pcapResult.innerHTML = `
                <div class="sectx-report">
                    <h3>Packet Analysis Report</h3>

                    <p>
                        <strong>Total Packets:</strong>
                        ${escapeHtml(data["Total Packets"] || 0)}
                    </p>

                    <p>
                        <strong>Threat Level:</strong>
                        ${escapeHtml(data["Threat Level"] || "Unknown")}
                    </p>

                    <h4>Protocols</h4>
                    <ul>${list(protocols, "No protocol counts returned.")}</ul>

                    <h4>Top Source IPs</h4>
                    <ul>${list(sources, "No source endpoints returned.")}</ul>

                    <h4>Top Destination IPs</h4>
                    <ul>${list(destinations, "No destination endpoints returned.")}</ul>

                    <h4>Recommendations</h4>
                    <ul>
                        ${
                            recommendations.length
                                ? recommendations
                                      .map(
                                          (item) =>
                                              `<li>${escapeHtml(item)}</li>`
                                      )
                                      .join("")
                                : "<li>No recommendations returned.</li>"
                        }
                    </ul>
                </div>
            `;
        };

        const renderPcapHtml = (body) => {
            if (!elements.pcapResult) {
                return;
            }

            elements.pcapResult.classList.remove("sectx-result-console__empty");
            elements.pcapResult.replaceChildren(sanitizeServerHtml(body));
        };

        const runPcap = async (event) => {
            event.preventDefault();

            if (state.busy.pcap || !elements.pcapForm) {
                return;
            }

            const file = selectedPcap();

            if (!file) {
                setPcapError("Select a PCAP or PCAPNG file first.");
                setToolState("pcap", "error", "NO FILE");
                setOverall(
                    "error",
                    "Packet capture required",
                    "Choose an authorized PCAP or PCAPNG file."
                );
                showToast(
                    "No packet capture selected",
                    "Choose a PCAP or PCAPNG file before analysis.",
                    "warning"
                );
                elements.pcapInput?.focus();
                return;
            }

            if (!acceptedPcap(file)) {
                setPcapError("Only .pcap and .pcapng files are accepted.");
                showToast(
                    "Unsupported capture",
                    "Choose a PCAP or PCAPNG file.",
                    "warning"
                );
                return;
            }

            clearPcapError();

            const formData = new FormData(elements.pcapForm);
            formData.set("pcap_file", file);

            setToolState("pcap", "running", "ANALYZING");
            setButtonBusy("pcap", true, "Analyzing Capture");
            setOverall(
                "running",
                "Packet analysis running",
                `Processing ${file.name}.`
            );

            if (elements.pcapResult) {
                elements.pcapResult.classList.add("sectx-result-console__empty");
                elements.pcapResult.innerHTML = `
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <strong>Analyzing packet capture</strong>
                    <span>Reading protocols, endpoints and suspicious indicators.</span>
                `;
            }

            addActivity(
                "Packet analysis started",
                `${file.name} • ${formatBytes(file.size)}`,
                "pcap"
            );

            announce("Packet analysis started.");

            try {
                const response = await fetch(endpoints.pcap, {
                    method: "POST",
                    body: formData,
                    credentials: "same-origin",
                    headers: {
                        Accept: "text/html, application/json",
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                const payload = await parseResponse(response);

                if (
                    response.redirected &&
                    response.url.includes("/security_tools")
                ) {
                    throw new Error(
                        "The server rejected or could not parse this packet capture."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        getServerMessage(payload, "Packet analysis failed.")
                    );
                }

                if (payload.contentType.includes("application/json")) {
                    if (!payload.json || payload.json.status === "error") {
                        throw new Error(
                            getServerMessage(payload, "Packet analysis failed.")
                        );
                    }

                    renderPcapJson(payload.json);

                    setOverall(
                        "success",
                        "Packet analysis completed",
                        `${Number(payload.json["Total Packets"] || 0)} packet(s) processed.`
                    );
                } else {
                    renderPcapHtml(payload.body);

                    setOverall(
                        "success",
                        "Packet analysis completed",
                        "The server-rendered packet report is displayed below."
                    );
                }

                setToolState("pcap", "success", "COMPLETE");
                showToast(
                    "Packet analysis completed",
                    `${file.name} was processed successfully.`,
                    "success"
                );
                addActivity(
                    "Packet analysis completed",
                    `${file.name} was processed by the PCAP backend.`,
                    "success"
                );
                announce("Packet analysis completed.");
                smoothScroll(elements.pcapResultPanel);
            } catch (error) {
                const message =
                    text(error.message) || "Unable to analyze the packet capture.";

                if (elements.pcapResult) {
                    elements.pcapResult.classList.add("sectx-result-console__empty");
                    elements.pcapResult.innerHTML = `
                        <i class="fa-solid fa-circle-xmark"></i>
                        <strong>Packet analysis failed</strong>
                        <span>${escapeHtml(message)}</span>
                    `;
                }

                setToolState("pcap", "error", "FAILED");
                setOverall("error", "Packet analysis failed", message);
                showToast("Packet analysis failed", message, "error", 5600);
                addActivity("Packet analysis failed", message, "error");
                announce("Packet analysis failed.");

                console.error("[Security Tools] PCAP error:", error);
            } finally {
                setButtonBusy("pcap", false);
                state.busy.pcap = false;
                updatePageBusy();
            }
        };

        const renderPenReport = (data) => {
            if (!elements.penResult) {
                return;
            }

            elements.penResult.classList.remove("sectx-result-console__empty");

            const ports = Array.isArray(data["Open Ports"])
                ? data["Open Ports"]
                : [];

            const recommendations = Array.isArray(data.Recommendations)
                ? data.Recommendations
                : [];

            elements.penResult.innerHTML = `
                <div class="sectx-report">
                    <h3>Local Security Posture Report</h3>

                    <p>
                        <strong>Target:</strong>
                        ${escapeHtml(data.Target || "127.0.0.1")}
                    </p>

                    <h4>Risk Summary</h4>

                    <ul>
                        <li>Critical: ${escapeHtml(data.Critical || 0)}</li>
                        <li>High: ${escapeHtml(data.High || 0)}</li>
                        <li>Medium: ${escapeHtml(data.Medium || 0)}</li>
                        <li>Low: ${escapeHtml(data.Low || 0)}</li>
                    </ul>

                    <h4>Open Ports</h4>

                    <table>
                        <thead>
                            <tr>
                                <th>Port</th>
                                <th>State</th>
                                <th>Service</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${
                                ports.length
                                    ? ports
                                          .map(
                                              (port) => `
                                                  <tr>
                                                      <td>${escapeHtml(port.Port)}</td>
                                                      <td>${escapeHtml(port.State)}</td>
                                                      <td>${escapeHtml(port.Service)}</td>
                                                  </tr>
                                              `
                                          )
                                          .join("")
                                    : `
                                        <tr>
                                            <td colspan="3">
                                                No open services were reported.
                                            </td>
                                        </tr>
                                    `
                            }
                        </tbody>
                    </table>

                    <h4>Recommendations</h4>

                    <ul>
                        ${
                            recommendations.length
                                ? recommendations
                                      .map(
                                          (item) =>
                                              `<li>${escapeHtml(item)}</li>`
                                      )
                                      .join("")
                                : "<li>No recommendations returned.</li>"
                        }
                    </ul>
                </div>
            `;
        };

        const runPenTest = async (event) => {
            event?.preventDefault();

            if (state.busy.pentest || !elements.penButton) {
                return;
            }

            setToolState("pentest", "running", "ASSESSING");
            setButtonBusy("pentest", true, "Generating Report");
            setOverall(
                "running",
                "Local posture assessment running",
                "Reviewing service exposure on 127.0.0.1."
            );

            if (elements.penResult) {
                elements.penResult.classList.add("sectx-result-console__empty");
                elements.penResult.innerHTML = `
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <strong>Generating local report</strong>
                    <span>Reviewing service exposure on 127.0.0.1.</span>
                `;
            }

            addActivity(
                "Local posture assessment started",
                "Configured target: 127.0.0.1",
                "pentest"
            );

            announce("Local posture assessment started.");

            try {
                const response = await fetch(endpoints.pentest, {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                const payload = await parseResponse(response);

                if (!payload.json) {
                    throw new Error(
                        getServerMessage(
                            payload,
                            "The posture endpoint returned an unexpected response."
                        )
                    );
                }

                if (!response.ok || text(payload.json.Error)) {
                    throw new Error(
                        getServerMessage(payload, "Unable to generate the report.")
                    );
                }

                renderPenReport(payload.json);

                const total =
                    Number(payload.json.Critical || 0) +
                    Number(payload.json.High || 0) +
                    Number(payload.json.Medium || 0) +
                    Number(payload.json.Low || 0);

                setToolState("pentest", "success", "COMPLETE");
                setOverall(
                    "success",
                    "Local posture report completed",
                    `${total} service finding(s) were classified.`
                );
                showToast(
                    "Posture report completed",
                    `${total} service finding(s) were classified.`,
                    "success"
                );
                addActivity(
                    "Local posture assessment completed",
                    `${total} service finding(s) returned.`,
                    "success"
                );
                announce("Local posture report completed.");
                smoothScroll(elements.penResultPanel);
            } catch (error) {
                const message =
                    text(error.message) ||
                    "Unable to generate the local posture report.";

                if (elements.penResult) {
                    elements.penResult.classList.add("sectx-result-console__empty");
                    elements.penResult.innerHTML = `
                        <i class="fa-solid fa-circle-xmark"></i>
                        <strong>Posture report failed</strong>
                        <span>${escapeHtml(message)}</span>
                    `;
                }

                setToolState("pentest", "error", "FAILED");
                setOverall("error", "Posture report failed", message);
                showToast("Posture report failed", message, "error", 5600);
                addActivity("Local posture assessment failed", message, "error");
                announce("Local posture report failed.");

                console.error("[Security Tools] Posture error:", error);
            } finally {
                setButtonBusy("pentest", false);
                state.busy.pentest = false;
                updatePageBusy();
            }
        };

        const copyText = async (value) => {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(value);
                return true;
            }

            const area = document.createElement("textarea");
            area.value = value;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.top = "-1000px";
            area.style.opacity = "0";

            document.body.appendChild(area);
            area.select();

            let copied = false;

            try {
                copied = document.execCommand("copy");
            } catch {
                copied = false;
            }

            area.remove();
            return copied;
        };

        const resetResult = (toolName) => {
            if (toolName === "nmap" && elements.nmapResult) {
                elements.nmapResult.textContent =
                    "No network scan has been executed in this session.";
                setToolState("nmap", "ready", "READY");
            }

            if (toolName === "pcap" && elements.pcapResult) {
                elements.pcapResult.classList.add("sectx-result-console__empty");
                elements.pcapResult.innerHTML = `
                    <i class="fa-solid fa-chart-network"></i>
                    <strong>No capture analyzed</strong>
                    <span>
                        Select an authorized PCAP file to begin packet intelligence processing.
                    </span>
                `;
                setToolState("pcap", "ready", "READY");
            }

            if (toolName === "pentest" && elements.penResult) {
                elements.penResult.classList.add("sectx-result-console__empty");
                elements.penResult.innerHTML = `
                    <i class="fa-solid fa-shield-virus"></i>
                    <strong>No posture report generated</strong>
                    <span>
                        Run the authorized local-host review to inspect service exposure.
                    </span>
                `;
                setToolState("pentest", "ready", "READY");
            }

            setOverall(
                "ready",
                "Waiting for command",
                "Select one authorized security operation to begin."
            );

            addActivity(
                "Result console cleared",
                `${toolName} output was reset.`,
                "info"
            );
        };

        const openPolicy = () => {
            if (!elements.policyModal) {
                return;
            }

            state.modalOpen = true;
            state.previousFocus = document.activeElement;

            elements.policyModal.classList.add("is-open");
            elements.policyModal.setAttribute("aria-hidden", "false");

            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";

            window.setTimeout(() => {
                elements.policyClose?.focus();
            }, 30);
        };

        const closePolicy = () => {
            if (!elements.policyModal) {
                return;
            }

            state.modalOpen = false;

            elements.policyModal.classList.remove("is-open");
            elements.policyModal.setAttribute("aria-hidden", "true");

            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";

            if (state.previousFocus instanceof HTMLElement) {
                state.previousFocus.focus();
            }
        };

        const trapModalFocus = (event) => {
            if (!state.modalOpen || event.key !== "Tab" || !elements.policyModal) {
                return;
            }

            const focusable = Array.from(
                elements.policyModal.querySelectorAll(
                    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            ).filter((node) => !node.hidden);

            if (!focusable.length) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        const setupTicker = () => {
            if (!elements.ticker || elements.ticker.dataset.cloned === "true") {
                return;
            }

            elements.ticker.dataset.cloned = "true";

            Array.from(elements.ticker.children).forEach((item) => {
                const clone = item.cloneNode(true);
                clone.setAttribute("aria-hidden", "true");
                elements.ticker.appendChild(clone);
            });
        };

        const setupCursorLight = () => {
            if (!elements.cursorLight) {
                return;
            }

            const finePointer =
                window.matchMedia &&
                window.matchMedia("(pointer: fine)").matches;

            const reducedMotion =
                window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (!finePointer || reducedMotion) {
                return;
            }

            document.addEventListener(
                "pointermove",
                (event) => {
                    if (state.cursorFrame) {
                        return;
                    }

                    state.cursorFrame = window.requestAnimationFrame(() => {
                        state.cursorFrame = null;

                        elements.cursorLight.style.transform =
                            `translate3d(${event.clientX - 260}px, ${
                                event.clientY - 260
                            }px, 0)`;
                    });
                },
                { passive: true }
            );
        };

        const startSimpleCanvas = (canvas, packetMode = false) => {
            if (!canvas) {
                return;
            }

            const reducedMotion =
                window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (reducedMotion) {
                return;
            }

            const context = canvas.getContext("2d");

            if (!context) {
                return;
            }

            let width = 1;
            let height = 1;
            let items = [];
            let frame = null;

            const resize = () => {
                const rect = canvas.getBoundingClientRect();
                const ratio = Math.min(window.devicePixelRatio || 1, 2);

                width = Math.max(rect.width, 1);
                height = Math.max(rect.height, 1);

                canvas.width = Math.round(width * ratio);
                canvas.height = Math.round(height * ratio);

                context.setTransform(ratio, 0, 0, ratio, 0, 0);

                const count = packetMode
                    ? width < 700
                        ? 8
                        : 16
                    : width < 700
                    ? 18
                    : 34;

                items = Array.from({ length: count }, () =>
                    packetMode
                        ? {
                              x: Math.random() * width,
                              y: Math.random() * height,
                              speed: 0.25 + Math.random() * 0.45,
                              length: 30 + Math.random() * 60
                          }
                        : {
                              x: Math.random() * width,
                              y: Math.random() * height,
                              vx: (Math.random() - 0.5) * 0.14,
                              vy: (Math.random() - 0.5) * 0.14
                          }
                );
            };

            const draw = () => {
                if (!state.visible) {
                    frame = null;
                    return;
                }

                context.clearRect(0, 0, width, height);

                if (packetMode) {
                    items.forEach((item) => {
                        item.x += item.speed;

                        if (item.x - item.length > width) {
                            item.x = -item.length;
                            item.y = Math.random() * height;
                        }

                        const gradient = context.createLinearGradient(
                            item.x - item.length,
                            item.y,
                            item.x,
                            item.y
                        );

                        gradient.addColorStop(0, "rgba(77,221,233,0)");
                        gradient.addColorStop(1, "rgba(77,221,233,0.06)");

                        context.beginPath();
                        context.moveTo(item.x - item.length, item.y);
                        context.lineTo(item.x, item.y);
                        context.strokeStyle = gradient;
                        context.lineWidth = 1;
                        context.stroke();
                    });
                } else {
                    items.forEach((item) => {
                        item.x += item.vx;
                        item.y += item.vy;

                        if (item.x < 0 || item.x > width) {
                            item.vx *= -1;
                        }

                        if (item.y < 0 || item.y > height) {
                            item.vy *= -1;
                        }

                        context.beginPath();
                        context.arc(item.x, item.y, 1, 0, Math.PI * 2);
                        context.fillStyle = "rgba(77,221,233,0.40)";
                        context.fill();
                    });
                }

                frame = window.requestAnimationFrame(draw);
            };

            resize();
            draw();

            window.addEventListener("resize", resize, { passive: true });

            document.addEventListener("visibilitychange", () => {
                state.visible = !document.hidden;

                if (!state.visible && frame) {
                    window.cancelAnimationFrame(frame);
                    frame = null;
                } else if (state.visible && !frame) {
                    draw();
                }
            });
        };

        const initialize = () => {
            page.classList.add("has-js");

            updateClock();
            window.setInterval(updateClock, 1000);

            if (elements.activityStart) {
                elements.activityStart.textContent =
                    new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                    });
            }

            elements.target?.addEventListener("input", () => validateTarget(false));
            elements.target?.addEventListener("blur", () => validateTarget(true));
            elements.nmapForm?.addEventListener("submit", runNmap);

            elements.pcapInput?.addEventListener("change", () => {
                if (updatePcapSelection()) {
                    const file = selectedPcap();

                    if (file) {
                        addActivity(
                            "Packet capture selected",
                            `${file.name} • ${formatBytes(file.size)}`,
                            "pcap"
                        );
                    }
                }
            });

            elements.pcapRemove?.addEventListener("click", () => {
                if (elements.pcapInput) {
                    elements.pcapInput.value = "";
                }

                if (elements.pcapSelected) {
                    elements.pcapSelected.hidden = true;
                }

                clearPcapError();
                setToolState("pcap", "ready", "READY");
                announce("Packet capture selection cleared.");
            });

            ["dragenter", "dragover"].forEach((name) => {
                elements.pcapDropZone?.addEventListener(name, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    elements.pcapDropZone.classList.add("is-dragover");
                });
            });

            ["dragleave", "drop"].forEach((name) => {
                elements.pcapDropZone?.addEventListener(name, (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    elements.pcapDropZone.classList.remove("is-dragover");
                });
            });

            elements.pcapDropZone?.addEventListener("drop", (event) => {
                const file = event.dataTransfer?.files?.[0];

                if (!file) {
                    return;
                }

                if (!acceptedPcap(file)) {
                    setPcapError("Dropped file must be .pcap or .pcapng.");
                    showToast(
                        "Unsupported capture",
                        "Choose a PCAP or PCAPNG file.",
                        "warning"
                    );
                    return;
                }

                if (!assignDroppedFile(file)) {
                    showToast(
                        "Drop not available",
                        "Use Browse Capture to select this file.",
                        "warning"
                    );
                    return;
                }

                updatePcapSelection();
                addActivity(
                    "Packet capture selected",
                    `${file.name} • ${formatBytes(file.size)}`,
                    "pcap"
                );
            });

            elements.pcapForm?.addEventListener("submit", runPcap);
            elements.penButton?.addEventListener("click", runPenTest);

            $$("[data-copy-result]").forEach((button) => {
                button.addEventListener("click", async () => {
                    const targetId = button.dataset.copyResult;
                    const target = document.getElementById(targetId);
                    const value = text(target?.innerText || target?.textContent);

                    if (!value) {
                        showToast(
                            "Nothing to copy",
                            "Run the matching tool first.",
                            "warning"
                        );
                        return;
                    }

                    try {
                        const copied = await copyText(value);

                        if (!copied) {
                            throw new Error("Clipboard access was blocked.");
                        }

                        showToast(
                            "Result copied",
                            "The tool output was copied to the clipboard.",
                            "success"
                        );
                    } catch (error) {
                        showToast(
                            "Copy failed",
                            text(error.message) || "Clipboard access was blocked.",
                            "error"
                        );
                    }
                });
            });

            $$("[data-clear-result]").forEach((button) => {
                button.addEventListener("click", () => {
                    const toolName = button.dataset.clearResult;

                    if (state.busy[toolName]) {
                        showToast(
                            "Operation still running",
                            "Wait for the operation to finish before clearing.",
                            "warning"
                        );
                        return;
                    }

                    resetResult(toolName);
                });
            });

            $$("[data-dismiss-security-alert]").forEach((button) => {
                button.addEventListener("click", () => {
                    const alert = button.closest("[data-security-alert]");
                    alert?.remove();
                });
            });

            elements.clearActivity?.addEventListener("click", () => {
                if (!elements.activityList) {
                    return;
                }

                elements.activityList.innerHTML = "";

                addActivity(
                    "Activity log cleared",
                    "A fresh browser-session log has started.",
                    "info"
                );
            });

            elements.policyButton?.addEventListener("click", openPolicy);
            elements.policyClose?.addEventListener("click", closePolicy);
            elements.policyAcknowledge?.addEventListener("click", () => {
                closePolicy();

                showToast(
                    "Policy acknowledged",
                    "Continue only with authorized systems and captures.",
                    "success"
                );
            });

            $$("[data-close-security-policy]").forEach((node) => {
                node.addEventListener("click", closePolicy);
            });

            document.addEventListener("keydown", (event) => {
                trapModalFocus(event);

                if (event.key === "Escape" && state.modalOpen) {
                    closePolicy();
                    return;
                }

                if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key.toLowerCase() === "k"
                ) {
                    event.preventDefault();
                    smoothScroll(elements.workspace);
                    elements.target?.focus();
                }
            });

            const workspaceButton = $(
                '.sectx-primary-action[href="#securityToolWorkspace"]'
            );

            workspaceButton?.addEventListener("click", (event) => {
                event.preventDefault();
                smoothScroll(elements.workspace);
                window.setTimeout(() => elements.target?.focus(), 350);
            });

            setupTicker();
            setupCursorLight();
            startSimpleCanvas(elements.networkCanvas, false);
            startSimpleCanvas(elements.packetCanvas, true);

            setOverall(
                "ready",
                "Waiting for command",
                "Select one authorized security operation to begin."
            );

            announce(
                "Security Operations Toolkit loaded. All tools are ready."
            );

            console.info(
                "[Security Tools] security_tools.js initialized successfully."
            );
        };

        try {
            initialize();
        } catch (error) {
            console.error("[Security Tools] Initialization failed:", error);

            showToast(
                "Interface initialization failed",
                "Reload the Security Tools page and check the browser console.",
                "error",
                6500
            );
        }
    });
})();