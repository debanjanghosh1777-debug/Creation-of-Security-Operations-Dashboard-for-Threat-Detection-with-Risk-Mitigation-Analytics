// @ts-nocheck
/* eslint-env browser */
/* eslint-disable no-console */

(() => {
  "use strict";

  const initialiseUploadWorkspace = () => {
    const page = document.getElementById("uplxPage");

    if (!page || page.dataset.uploadReady === "1") {
      return;
    }

    page.dataset.uploadReady = "1";

    const $ = (selector, root = document) =>
      root.querySelector(selector);

    const $$ = (selector, root = document) =>
      [...root.querySelectorAll(selector)];

    const sleep = (milliseconds) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds);
      });

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const elements = {
      page,

      form: $("#uploadScanForm"),
      input: $("#fileInput"),
      dropzone: $("#uploadDropzone"),

      browseButton: $("#browseFileButton"),
      replaceButton: $("#replaceSelectedFile"),
      removeButton: $("#removeSelectedFile"),

      emptyState: $("#uploadEmptyState"),
      selectedState: $("#uploadSelectedState"),

      selectedFileName: $("#selectedFileName"),
      selectedFileIcon: $("#selectedFileIcon"),
      selectedFileType: $("#selectedFileType"),
      selectedFileModified: $("#selectedFileModified"),

      compatibilityFileName: $("#fileName"),
      fileSize: $("#fileSize"),

      intelligencePanel: $("#fileIntelligencePreview"),
      intelligenceFileName: $("#intelligenceFileName"),
      intelligenceExtension: $("#intelligenceExtension"),
      intelligenceFileSize: $("#intelligenceFileSize"),
      intelligenceFingerprint: $("#intelligenceFingerprint"),

      validationSummary: $("#validationSummary"),
      localValidationState: $("#localValidationState"),

      consent: $("#analysisConsent"),
      scanButton: $("#scanFileButton"),
      submitProgressText: $("#submitProgressText"),

      progressPanel: $("#uploadProgressPanel"),
      progressTitle: $("#uploadProgressTitle"),
      progressPercentage: $("#uploadProgressPercentage"),
      progressTrack: $("#uploadProgressTrack"),
      progressBar: $("#progressBar"),
      progressStatus: $("#uploadProgressStatus"),
      progressSpeed: $("#uploadProgressSpeed"),

      scannerStage: $("#uploadScannerStage"),
      scannerReactor: $("#uploadScannerReactor"),
      scannerState: $(".uplx-scanner-state"),

      toastRegion: $("#uploadToastRegion"),
      accessibilityStatus: $("#uploadAccessibilityStatus"),

      confirmationModal: $("#uploadConfirmationModal"),
      confirmationFileName: $("#confirmationFileName"),
      confirmationFileSize: $("#confirmationFileSize"),

      soundButton: $("#uploadSoundToggle"),
      focusButton: $("#uploadFocusModeToggle"),

      localClock: $("#uploadLocalClock"),
      localDate: $("#uploadLocalDate"),
      engineLatency: $("#uploadEngineLatency"),
      sessionIdentifier: $("#uploadSessionIdentifier"),
      copyrightYear: $("#uploadCopyrightYear"),

      engineGauge: $("#uploadEngineGauge"),

      bootSequence: $("#uploadBootSequence"),
      bootBar: $("#uploadBootBar"),
      bootPercentage: $("#uploadBootPercentage"),
    };

    if (!elements.form || !elements.input) {
      console.error(
        "[Upload Workspace] Required form or file input is missing.",
      );
      return;
    }

    const state = {
      file: null,
      submitting: false,
      hashRequest: 0,
      dragDepth: 0,
      activeModal: null,
      previousFocus: null,
      soundEnabled: false,
      focusEnabled: false,
    };

    const allowedExtensions = new Set([
      "exe",
      "dll",
      "sys",
      "drv",
      "com",
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "zip",
      "rar",
      "7z",
      "tar",
      "gz",
      "csv",
      "json",
      "txt",
      "pcap",
      "pcapng",
      "png",
      "xml",
      "sql",
      "jpg",
      "jpeg",
      "gif",
    ]);

    const clamp = (number, minimum, maximum) =>
      Math.min(
        Math.max(Number(number) || 0, minimum),
        maximum,
      );

    const announce = (message) => {
      if (!elements.accessibilityStatus) {
        return;
      }

      elements.accessibilityStatus.textContent = "";

      window.setTimeout(() => {
        elements.accessibilityStatus.textContent = message;
      }, 30);
    };

    const formatFileSize = (bytes) => {
      if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
      }

      const units = ["B", "KB", "MB", "GB", "TB"];
      const unitIndex = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
      );

      const value = bytes / 1024 ** unitIndex;

      const decimals =
        unitIndex === 0
          ? 0
          : value >= 100
            ? 0
            : value >= 10
              ? 1
              : 2;

      return `${value.toFixed(decimals)} ${units[unitIndex]}`;
    };

    const getExtension = (filename = "") => {
      const finalDot = filename.lastIndexOf(".");

      if (
        finalDot <= 0 ||
        finalDot === filename.length - 1
      ) {
        return "";
      }

      return filename
        .slice(finalDot + 1)
        .trim()
        .toLowerCase();
    };

    const getFileCategory = (file) => {
      const extension = getExtension(file?.name);

      const categories = {
        executable: [
          "exe",
          "dll",
          "sys",
          "drv",
          "com",
          "msi",
          "bat",
          "cmd",
          "scr",
        ],

        archive: [
          "zip",
          "rar",
          "7z",
          "tar",
          "gz",
        ],

        document: [
          "pdf",
          "doc",
          "docx",
          "rtf",
          "odt",
        ],

        spreadsheet: [
          "xls",
          "xlsx",
          "csv",
          "ods",
        ],

        presentation: [
          "ppt",
          "pptx",
          "odp",
        ],

        image: [
          "png",
          "jpg",
          "jpeg",
          "gif",
          "bmp",
          "webp",
          "svg",
        ],

        code: [
          "py",
          "js",
          "ts",
          "java",
          "c",
          "cpp",
          "cs",
          "php",
          "rb",
          "go",
          "rs",
          "sql",
        ],

        text: [
          "txt",
          "log",
          "md",
          "json",
          "xml",
          "yaml",
          "yml",
        ],

        packet: [
          "pcap",
          "pcapng",
        ],
      };

      for (const [category, extensions] of Object.entries(
        categories,
      )) {
        if (extensions.includes(extension)) {
          return category;
        }
      }

      const mimeType = file?.type || "";

      if (mimeType.startsWith("image/")) {
        return "image";
      }

      if (mimeType.startsWith("text/")) {
        return "text";
      }

      return "generic";
    };

    const getFileIcon = (file) => {
      const iconByCategory = {
        executable: "fa-gears",
        archive: "fa-file-zipper",
        document: "fa-file-lines",
        spreadsheet: "fa-file-excel",
        presentation: "fa-file-powerpoint",
        image: "fa-file-image",
        code: "fa-file-code",
        text: "fa-file-lines",
        packet: "fa-network-wired",
        generic: "fa-file-shield",
      };

      return (
        iconByCategory[getFileCategory(file)] ||
        iconByCategory.generic
      );
    };

    const showToast = (
      title,
      message,
      type = "info",
      duration = 4000,
    ) => {
      if (!elements.toastRegion) {
        console.log(`${title}: ${message}`);
        return;
      }

      const iconByType = {
        info: "fa-circle-info",
        success: "fa-circle-check",
        warning: "fa-triangle-exclamation",
        error: "fa-circle-xmark",
      };

      const toast = document.createElement("article");

      toast.className = `uplx-toast uplx-toast--${type}`;

      toast.innerHTML = `
        <span class="uplx-toast__icon">
          <i class="fa-solid ${
            iconByType[type] || iconByType.info
          }"></i>
        </span>

        <div class="uplx-toast__content">
          <strong></strong>
          <span></span>
        </div>

        <button
          class="uplx-toast__close"
          type="button"
          aria-label="Dismiss notification"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      const titleElement = $("strong", toast);
      const messageElement = $(
        ".uplx-toast__content span",
        toast,
      );
      const closeButton = $("button", toast);

      if (titleElement) {
        titleElement.textContent = title;
      }

      if (messageElement) {
        messageElement.textContent = message;
      }

      const removeToast = () => {
        if (!toast.isConnected) {
          return;
        }

        toast.classList.add("is-leaving");

        window.setTimeout(() => {
          toast.remove();
        }, 240);
      };

      closeButton?.addEventListener(
        "click",
        removeToast,
      );

      elements.toastRegion.appendChild(toast);

      window.setTimeout(removeToast, duration);
    };

    const setValidationItem = (
      key,
      status,
      label,
      description,
    ) => {
      const item = document.querySelector(
        `[data-validation="${key}"]`,
      );

      if (!item) {
        return;
      }

      item.dataset.state = status;

      item.classList.toggle(
        "is-valid",
        status === "valid",
      );

      item.classList.toggle(
        "is-error",
        status === "error",
      );

      const stateLabel = $(
        ".uplx-validation-item__state",
        item,
      );

      const descriptionElement = $("small", item);

      if (stateLabel) {
        stateLabel.textContent = label;
      }

      if (descriptionElement && description) {
        descriptionElement.textContent = description;
      }
    };

    const validateFile = (file) => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        extension: "",
        category: "generic",
      };

      if (!file) {
        result.valid = false;
        result.errors.push("No file was selected.");
        return result;
      }

      result.extension = getExtension(file.name);
      result.category = getFileCategory(file);

      if (!file.name || !file.name.trim()) {
        result.valid = false;
        result.errors.push("The file name is invalid.");
      }

      if (file.size <= 0) {
        result.valid = false;
        result.errors.push("The selected file is empty.");
      }

      if (!result.extension) {
        result.valid = false;
        result.errors.push(
          "The selected file has no extension.",
        );
      } else if (
        !allowedExtensions.has(result.extension)
      ) {
        result.valid = false;
        result.errors.push(
          `.${result.extension} is not supported by the backend.`,
        );
      }

      if (file.size > 500 * 1024 * 1024) {
        result.valid = false;
        result.errors.push(
          "The selected file is larger than 500 MB.",
        );
      }

      if (file.name.length > 240) {
        result.warnings.push(
          "The file name is unusually long.",
        );
      }

      return result;
    };

    const updateValidationDisplay = (
      file,
      validation,
    ) => {
      if (!file) {
        setValidationItem(
          "file-selected",
          "pending",
          "Pending",
          "A local file must be attached.",
        );

        setValidationItem(
          "file-name",
          "pending",
          "Pending",
          "Filename is checked before submission.",
        );

        setValidationItem(
          "file-size",
          "pending",
          "Pending",
          "Size is displayed for analyst review.",
        );

        setValidationItem(
          "file-type",
          "pending",
          "Pending",
          "Final acceptance is verified by the server.",
        );

        if (elements.validationSummary) {
          elements.validationSummary.textContent =
            "Waiting for file";
        }

        return;
      }

      setValidationItem(
        "file-selected",
        "valid",
        "Ready",
        "One local file is attached.",
      );

      setValidationItem(
        "file-name",
        file.name.trim() ? "valid" : "error",
        file.name.trim() ? "Valid" : "Invalid",
        "Filename is ready for server processing.",
      );

      setValidationItem(
        "file-size",
        file.size > 0 ? "valid" : "error",
        file.size > 0
          ? formatFileSize(file.size)
          : "Empty",
        "File size was read successfully.",
      );

      setValidationItem(
        "file-type",
        validation.valid ? "valid" : "error",
        validation.extension
          ? validation.extension.toUpperCase()
          : "Invalid",
        validation.valid
          ? `${validation.category} file detected locally.`
          : "This format is not accepted by the backend.",
      );

      if (elements.validationSummary) {
        if (!validation.valid) {
          elements.validationSummary.textContent =
            `${validation.errors.length} issue(s) found`;
        } else if (validation.warnings.length) {
          elements.validationSummary.textContent =
            `${validation.warnings.length} advisory note(s)`;
        } else {
          elements.validationSummary.textContent =
            "File ready";
        }
      }
    };

    const setPipelineStatus = (
      stepNumber,
      status,
    ) => {
      const pipelineStep = document.querySelector(
        `[data-pipeline-step="${stepNumber}"]`,
      );

      if (!pipelineStep) {
        return;
      }

      pipelineStep.classList.remove(
        "is-active",
        "is-complete",
        "is-error",
      );

      if (status === "active") {
        pipelineStep.classList.add("is-active");
      }

      if (status === "complete") {
        pipelineStep.classList.add("is-complete");
      }

      if (status === "error") {
        pipelineStep.classList.add("is-error");
      }

      const stateElement = $(
        ".uplx-pipeline-step__state",
        pipelineStep,
      );

      if (stateElement) {
        const labels = {
          active: "Processing",
          complete: "Complete",
          error: "Error",
          standby: "Standby",
        };

        stateElement.textContent =
          labels[status] || labels.standby;
      }
    };

    const resetPipeline = () => {
      for (let step = 1; step <= 5; step += 1) {
        setPipelineStatus(
          step,
          step === 1 ? "active" : "standby",
        );
      }
    };

    const setProgress = (
      value,
      title,
      status,
      speed,
    ) => {
      const percentage = clamp(value, 0, 100);

      if (elements.progressBar) {
        elements.progressBar.style.width =
          `${percentage}%`;
      }

      if (elements.progressPercentage) {
        elements.progressPercentage.textContent =
          `${Math.round(percentage)}%`;
      }

      if (elements.progressTrack) {
        elements.progressTrack.setAttribute(
          "aria-valuenow",
          String(Math.round(percentage)),
        );
      }

      if (elements.progressTitle && title) {
        elements.progressTitle.textContent = title;
      }

      if (elements.progressStatus && status) {
        elements.progressStatus.textContent = status;
      }

      if (elements.progressSpeed && speed) {
        elements.progressSpeed.textContent = speed;
      }

      if (elements.submitProgressText && status) {
        elements.submitProgressText.textContent =
          status;
      }
    };

    const setScannerState = (
      message,
      type = "ready",
    ) => {
      if (!elements.scannerState) {
        return;
      }

      if (type === "error") {
        elements.scannerState.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation"></i>
          ${message}
        `;
      } else {
        elements.scannerState.innerHTML = `
          <span class="uplx-live-dot"></span>
          ${message}
        `;
      }
    };

    const calculateFingerprint = async (
      file,
      requestNumber,
    ) => {
      if (!elements.intelligenceFingerprint) {
        return;
      }

      elements.intelligenceFingerprint.textContent =
        "Calculating…";

      try {
        if (!window.crypto?.subtle) {
          throw new Error(
            "Web Crypto API is unavailable.",
          );
        }

        const maximumFullHashSize =
          32 * 1024 * 1024;

        let buffer;
        let prefix = "SHA-256";

        if (file.size <= maximumFullHashSize) {
          buffer = await file.arrayBuffer();
        } else {
          const chunkSize = 2 * 1024 * 1024;

          const firstChunk = await file
            .slice(0, chunkSize)
            .arrayBuffer();

          const lastChunk = await file
            .slice(
              Math.max(
                file.size - chunkSize,
                0,
              ),
            )
            .arrayBuffer();

          const metadata = new TextEncoder().encode(
            [
              file.name,
              file.size,
              file.lastModified,
              file.type,
            ].join("|"),
          );

          const combined = new Uint8Array(
            firstChunk.byteLength +
              lastChunk.byteLength +
              metadata.byteLength,
          );

          combined.set(
            new Uint8Array(firstChunk),
            0,
          );

          combined.set(
            new Uint8Array(lastChunk),
            firstChunk.byteLength,
          );

          combined.set(
            metadata,
            firstChunk.byteLength +
              lastChunk.byteLength,
          );

          buffer = combined.buffer;
          prefix = "SAMPLE SHA-256";
        }

        const digest =
          await window.crypto.subtle.digest(
            "SHA-256",
            buffer,
          );

        if (
          requestNumber !== state.hashRequest
        ) {
          return;
        }

        const hexadecimal = [
          ...new Uint8Array(digest),
        ]
          .map((byte) =>
            byte
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")
          .toUpperCase();

        elements.intelligenceFingerprint.textContent =
          `${prefix} ${hexadecimal.slice(
            0,
            12,
          )}…${hexadecimal.slice(-8)}`;

        elements.intelligenceFingerprint.title =
          hexadecimal;
      } catch (error) {
        console.warn(
          "Fingerprint generation failed:",
          error,
        );

        if (
          requestNumber === state.hashRequest
        ) {
          elements.intelligenceFingerprint.textContent =
            "Fingerprint unavailable";
        }
      }
    };

    const updateReadyState = () => {
      const validation = validateFile(state.file);

      const ready = Boolean(
        state.file &&
          validation.valid &&
          !state.submitting,
      );

      if (elements.scanButton) {
        elements.scanButton.disabled = !ready;
      }

      page.classList.toggle(
        "has-valid-file",
        Boolean(state.file && validation.valid),
      );

      page.classList.toggle(
        "has-validation-error",
        Boolean(
          state.file && !validation.valid,
        ),
      );

      return {
        ready,
        validation,
      };
    };

    const renderSelectedFile = async (file) => {
      state.file = file;

      const validation = validateFile(file);
      const hashRequest = ++state.hashRequest;

      if (elements.emptyState) {
        elements.emptyState.hidden = true;
      }

      if (elements.selectedState) {
        elements.selectedState.hidden = false;
      }

      if (elements.intelligencePanel) {
        elements.intelligencePanel.hidden = false;
      }

      if (elements.selectedFileName) {
        elements.selectedFileName.textContent =
          file.name;

        elements.selectedFileName.title =
          file.name;
      }

      if (elements.compatibilityFileName) {
        elements.compatibilityFileName.textContent =
          file.name;
      }

      if (elements.fileSize) {
        elements.fileSize.textContent =
          formatFileSize(file.size);
      }

      if (elements.selectedFileType) {
        elements.selectedFileType.textContent =
          file.type ||
          validation.extension.toUpperCase();
      }

      if (elements.selectedFileModified) {
        elements.selectedFileModified.textContent =
          new Intl.DateTimeFormat(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(
            new Date(file.lastModified),
          );
      }

      if (elements.intelligenceFileName) {
        elements.intelligenceFileName.textContent =
          file.name;

        elements.intelligenceFileName.title =
          file.name;
      }

      if (elements.intelligenceExtension) {
        elements.intelligenceExtension.textContent =
          validation.extension
            ? validation.extension.toUpperCase()
            : "NO EXT";
      }

      if (elements.intelligenceFileSize) {
        elements.intelligenceFileSize.textContent =
          formatFileSize(file.size);
      }

      const icon = elements.selectedFileIcon
        ? $("i", elements.selectedFileIcon)
        : null;

      if (icon) {
        icon.className =
          `fa-solid ${getFileIcon(file)}`;
      }

      updateValidationDisplay(
        file,
        validation,
      );

      if (elements.localValidationState) {
        elements.localValidationState.className =
          "uplx-status-chip";

        if (validation.valid) {
          elements.localValidationState.textContent =
            "Ready";

          elements.localValidationState.classList.add(
            "uplx-status-chip--safe",
          );
        } else {
          elements.localValidationState.textContent =
            "Invalid";
        }
      }

      if (elements.dropzone) {
        elements.dropzone.dataset.uploadState =
          validation.valid
            ? "valid"
            : "invalid";

        elements.dropzone.classList.toggle(
          "is-valid",
          validation.valid,
        );

        elements.dropzone.classList.toggle(
          "is-invalid",
          !validation.valid,
        );
      }

      if (validation.valid) {
        setScannerState("FILE READY");

        showToast(
          "File accepted",
          `${file.name} is ready for AI analysis.`,
          "success",
        );
      } else {
        setScannerState(
          "FILE REJECTED",
          "error",
        );

        showToast(
          "File cannot be scanned",
          validation.errors.join(" "),
          "error",
          6000,
        );
      }

      if (elements.consent) {
        /*
         * The file selection itself is treated as the user's
         * authorisation to submit it for scanning.
         */
        elements.consent.checked =
          validation.valid;
      }

      updateReadyState();

      announce(
        `${file.name} selected. File size ${formatFileSize(
          file.size,
        )}.`,
      );

      await calculateFingerprint(
        file,
        hashRequest,
      );

      return validation;
    };

    const clearSelectedFile = () => {
      if (state.submitting) {
        return;
      }

      state.file = null;
      state.hashRequest += 1;

      elements.input.value = "";

      if (elements.emptyState) {
        elements.emptyState.hidden = false;
      }

      if (elements.selectedState) {
        elements.selectedState.hidden = true;
      }

      if (elements.intelligencePanel) {
        elements.intelligencePanel.hidden = true;
      }

      if (elements.selectedFileName) {
        elements.selectedFileName.textContent =
          "No file selected";

        elements.selectedFileName.title =
          "No file selected";
      }

      if (elements.compatibilityFileName) {
        elements.compatibilityFileName.textContent =
          "No file selected";
      }

      if (elements.fileSize) {
        elements.fileSize.textContent = "—";
      }

      if (elements.selectedFileType) {
        elements.selectedFileType.textContent =
          "—";
      }

      if (elements.selectedFileModified) {
        elements.selectedFileModified.textContent =
          "—";
      }

      if (elements.intelligenceFileName) {
        elements.intelligenceFileName.textContent =
          "—";
      }

      if (elements.intelligenceExtension) {
        elements.intelligenceExtension.textContent =
          "—";
      }

      if (elements.intelligenceFileSize) {
        elements.intelligenceFileSize.textContent =
          "—";
      }

      if (elements.intelligenceFingerprint) {
        elements.intelligenceFingerprint.textContent =
          "Generated after selection";

        elements.intelligenceFingerprint.removeAttribute(
          "title",
        );
      }

      if (elements.localValidationState) {
        elements.localValidationState.textContent =
          "Pending";

        elements.localValidationState.className =
          "uplx-status-chip";
      }

      if (elements.consent) {
        elements.consent.checked = false;
      }

      if (elements.dropzone) {
        elements.dropzone.dataset.uploadState =
          "empty";

        elements.dropzone.classList.remove(
          "is-valid",
          "is-invalid",
          "is-dragover",
          "is-uploading",
        );
      }

      if (elements.progressPanel) {
        elements.progressPanel.hidden = true;
      }

      setProgress(
        0,
        "Preparing file submission",
        "Waiting for file",
        "Waiting",
      );

      setScannerState("AWAITING FILE");

      updateValidationDisplay(
        null,
        validateFile(null),
      );

      resetPipeline();
      updateReadyState();

      announce("Selected file removed.");
    };

    const openFileBrowser = () => {
      if (state.submitting) {
        return;
      }

      elements.input.click();
    };

    const assignDroppedFile = (file) => {
      try {
        const dataTransfer =
          new DataTransfer();

        dataTransfer.items.add(file);

        elements.input.files =
          dataTransfer.files;

        return (
          elements.input.files.length === 1
        );
      } catch (error) {
        console.warn(
          "Unable to assign dropped file:",
          error,
        );

        return false;
      }
    };

    const submitToFlask = async () => {
      if (
        state.submitting ||
        !state.file
      ) {
        return;
      }

      const {
        ready,
        validation,
      } = updateReadyState();

      if (!ready) {
        showToast(
          "Unable to begin analysis",
          validation.errors.join(" ") ||
            "Select a valid file.",
          "error",
          6000,
        );

        return;
      }

      state.submitting = true;

      page.classList.add("is-submitting");

      if (elements.scanButton) {
        elements.scanButton.disabled = true;
        elements.scanButton.classList.add(
          "is-loading",
        );
        elements.scanButton.setAttribute(
          "aria-busy",
          "true",
        );
      }

      if (elements.dropzone) {
        elements.dropzone.dataset.uploadState =
          "uploading";

        elements.dropzone.classList.add(
          "is-uploading",
        );
      }

      if (elements.progressPanel) {
        elements.progressPanel.hidden = false;
      }

      setScannerState("SCANNING FILE");

      setPipelineStatus(1, "active");

      announce(
        "Uploading the selected file for AI threat analysis.",
      );

      const stages = [
        {
          progress: 10,
          pipeline: 1,
          title: "Preparing secure upload",
          status: "Validating selected file",
          speed: "Local validation",
          delay: 160,
        },
        {
          progress: 28,
          pipeline: 1,
          title: "Uploading selected file",
          status: "Sending file to Flask",
          speed: "Secure transfer",
          delay: 180,
        },
        {
          progress: 46,
          pipeline: 2,
          title: "Starting feature extraction",
          status: "Preparing static attributes",
          speed: "Feature engine",
          delay: 180,
        },
        {
          progress: 64,
          pipeline: 3,
          title: "Starting AI inference",
          status: "Loading XGBoost classification",
          speed: "AI model",
          delay: 180,
        },
        {
          progress: 82,
          pipeline: 4,
          title: "Preparing risk assessment",
          status: "Calculating confidence and severity",
          speed: "Risk engine",
          delay: 180,
        },
        {
          progress: 95,
          pipeline: 5,
          title: "Submitting analysis request",
          status: "Waiting for the Flask result page",
          speed: "Server processing",
          delay: 140,
        },
      ];

      let previousPipeline = 0;

      for (const stage of stages) {
        if (
          previousPipeline &&
          previousPipeline !== stage.pipeline
        ) {
          setPipelineStatus(
            previousPipeline,
            "complete",
          );
        }

        setPipelineStatus(
          stage.pipeline,
          "active",
        );

        previousPipeline =
          stage.pipeline;

        setProgress(
          stage.progress,
          stage.title,
          stage.status,
          stage.speed,
        );

        await sleep(
          reducedMotion
            ? 10
            : stage.delay,
        );
      }

      /*
       * This submits the original multipart form to:
       *
       * POST /upload
       *
       * Flask saves the file and redirects to:
       *
       * GET /scan/<filename>
       *
       * The existing backend then performs feature extraction,
       * prediction, database storage and result rendering.
       */
      try {
        HTMLFormElement.prototype.submit.call(
          elements.form,
        );
      } catch (error) {
        console.error(
          "Form submission failed:",
          error,
        );

        state.submitting = false;

        page.classList.remove(
          "is-submitting",
        );

        if (elements.scanButton) {
          elements.scanButton.disabled = false;
          elements.scanButton.classList.remove(
            "is-loading",
          );
          elements.scanButton.removeAttribute(
            "aria-busy",
          );
        }

        setScannerState(
          "SUBMISSION FAILED",
          "error",
        );

        setPipelineStatus(1, "error");

        showToast(
          "Submission failed",
          error?.message ||
            "The file could not be sent to Flask.",
          "error",
          7000,
        );
      }
    };

    const selectAndAutomaticallyScan = async (
      file,
    ) => {
      if (!file || state.submitting) {
        return;
      }

      const validation =
        await renderSelectedFile(file);

      if (!validation.valid) {
        return;
      }

      /*
       * Give the browser enough time to display the filename,
       * validation cards and fingerprint before navigation.
       */
      await sleep(
        reducedMotion ? 0 : 180,
      );

      await submitToFlask();
    };

    const openModal = (modal) => {
      if (!modal) {
        return;
      }

      state.previousFocus =
        document.activeElement;

      state.activeModal = modal;

      modal.classList.add("is-open");
      modal.setAttribute(
        "aria-hidden",
        "false",
      );

      document.body.classList.add(
        "uplx-overlay-open",
      );

      const firstFocusable = modal.querySelector(
        "button, a[href], input, [tabindex]:not([tabindex='-1'])",
      );

      window.setTimeout(() => {
        firstFocusable?.focus();
      }, 50);
    };

    const closeModal = (modal) => {
      if (!modal) {
        return;
      }

      modal.classList.remove("is-open");
      modal.setAttribute(
        "aria-hidden",
        "true",
      );

      if (state.activeModal === modal) {
        state.activeModal = null;
      }

      if (!state.activeModal) {
        document.body.classList.remove(
          "uplx-overlay-open",
        );
      }

      state.previousFocus?.focus?.();
    };

    const bindModal = (
      openSelector,
      modalSelector,
      closeSelectors,
      backdropSelector,
    ) => {
      const modal = $(modalSelector);

      $(openSelector)?.addEventListener(
        "click",
        () => {
          openModal(modal);
        },
      );

      closeSelectors.forEach(
        (selector) => {
          $(selector)?.addEventListener(
            "click",
            () => {
              closeModal(modal);
            },
          );
        },
      );

      $$(backdropSelector).forEach(
        (backdrop) => {
          backdrop.addEventListener(
            "click",
            () => {
              closeModal(modal);
            },
          );
        },
      );
    };

    const updateClock = () => {
      const now = new Date();

      if (elements.localClock) {
        elements.localClock.textContent =
          new Intl.DateTimeFormat(
            undefined,
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            },
          ).format(now);
      }

      if (elements.localDate) {
        elements.localDate.textContent =
          new Intl.DateTimeFormat(
            undefined,
            {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            },
          ).format(now);
      }
    };

    const initialiseTelemetry = () => {
      updateClock();

      window.setInterval(
        updateClock,
        1000,
      );

      const updateLatency = () => {
        if (elements.engineLatency) {
          elements.engineLatency.textContent =
            `${Math.floor(
              8 + Math.random() * 14,
            )} ms`;
        }
      };

      updateLatency();

      window.setInterval(
        updateLatency,
        4500,
      );

      if (elements.sessionIdentifier) {
        elements.sessionIdentifier.textContent =
          `FILE-${Date.now()
            .toString(36)
            .toUpperCase()}-${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`;
      }

      if (elements.copyrightYear) {
        elements.copyrightYear.textContent =
          String(
            new Date().getFullYear(),
          );
      }

      if (elements.engineGauge) {
        const score = clamp(
          elements.engineGauge.dataset.score ||
            100,
          0,
          100,
        );

        elements.engineGauge.style.setProperty(
          "--uplx-gauge-angle",
          `${score * 3.6}deg`,
        );
      }
    };

    const runBootSequence = () => {
      if (!elements.bootSequence) {
        page.classList.add("is-ready");
        return;
      }

      let bootCompleted = false;

      try {
        bootCompleted =
          window.sessionStorage.getItem(
            "uplxBootDone",
          ) === "true";
      } catch {
        bootCompleted = false;
      }

      if (
        bootCompleted ||
        reducedMotion
      ) {
        elements.bootSequence.hidden = true;
        page.classList.add("is-ready");
        return;
      }

      elements.bootSequence.hidden = false;
      elements.bootSequence.setAttribute(
        "aria-hidden",
        "false",
      );

      page.classList.add("is-booting");

      let progress = 0;

      const timer =
        window.setInterval(() => {
          progress = Math.min(
            100,
            progress +
              Math.floor(
                8 + Math.random() * 14,
              ),
          );

          if (elements.bootBar) {
            elements.bootBar.style.width =
              `${progress}%`;
          }

          if (elements.bootPercentage) {
            elements.bootPercentage.textContent =
              `${progress}%`;
          }

          if (progress >= 100) {
            window.clearInterval(timer);

            window.setTimeout(() => {
              page.classList.remove(
                "is-booting",
              );

              page.classList.add(
                "is-ready",
              );

              elements.bootSequence.setAttribute(
                "aria-hidden",
                "true",
              );

              window.setTimeout(() => {
                elements.bootSequence.hidden =
                  true;
              }, 400);

              try {
                window.sessionStorage.setItem(
                  "uplxBootDone",
                  "true",
                );
              } catch {
                // Session storage is optional.
              }
            }, 180);
          }
        }, 70);
    };

    bindModal(
      "#openUploadHelp",
      "#uploadHelpModal",
      [
        "#closeUploadHelp",
        "#dismissUploadHelp",
      ],
      "[data-close-upload-help]",
    );

    bindModal(
      "#openFormatGuide",
      "#formatGuideModal",
      [
        "#closeFormatGuide",
        "#acknowledgeFormatGuide",
      ],
      "[data-close-format-guide]",
    );

    bindModal(
      "#openSecurityPolicy",
      "#securityPolicyModal",
      [
        "#closeSecurityPolicy",
        "#acknowledgeSecurityPolicy",
      ],
      "[data-close-security-policy]",
    );

    $("#helpChooseFile")?.addEventListener(
      "click",
      () => {
        closeModal(
          $("#uploadHelpModal"),
        );

        window.setTimeout(
          openFileBrowser,
          100,
        );
      },
    );

    $("#cancelUploadConfirmation")?.addEventListener(
      "click",
      () => {
        closeModal(
          elements.confirmationModal,
        );
      },
    );

    $$(
      "[data-cancel-upload-confirmation]",
    ).forEach((backdrop) => {
      backdrop.addEventListener(
        "click",
        () => {
          closeModal(
            elements.confirmationModal,
          );
        },
      );
    });

    $("#confirmUploadSubmission")?.addEventListener(
      "click",
      submitToFlask,
    );

    elements.browseButton?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        openFileBrowser();
      },
    );

    elements.replaceButton?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        openFileBrowser();
      },
    );

    elements.removeButton?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        clearSelectedFile();

        showToast(
          "File removed",
          "The selected file was cleared.",
          "info",
        );
      },
    );

    elements.input.addEventListener(
      "change",
      async () => {
        const selectedFile =
          elements.input.files?.[0];

        if (!selectedFile) {
          return;
        }

        await selectAndAutomaticallyScan(
          selectedFile,
        );
      },
    );

    elements.dropzone?.addEventListener(
      "click",
      (event) => {
        if (
          !event.target.closest(
            "button, a, input, label",
          )
        ) {
          openFileBrowser();
        }
      },
    );

    elements.dropzone?.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openFileBrowser();
        }
      },
    );

    ["dragenter", "dragover"].forEach(
      (eventName) => {
        elements.dropzone?.addEventListener(
          eventName,
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (state.submitting) {
              return;
            }

            if (
              eventName === "dragenter"
            ) {
              state.dragDepth += 1;
            }

            elements.dropzone.classList.add(
              "is-dragover",
            );

            elements.dropzone.dataset.uploadState =
              "dragover";

            if (event.dataTransfer) {
              event.dataTransfer.dropEffect =
                "copy";
            }
          },
        );
      },
    );

    elements.dropzone?.addEventListener(
      "dragleave",
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        state.dragDepth = Math.max(
          0,
          state.dragDepth - 1,
        );

        if (state.dragDepth === 0) {
          elements.dropzone.classList.remove(
            "is-dragover",
          );

          elements.dropzone.dataset.uploadState =
            state.file
              ? "valid"
              : "empty";
        }
      },
    );

    elements.dropzone?.addEventListener(
      "drop",
      async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (state.submitting) {
          return;
        }

        state.dragDepth = 0;

        elements.dropzone.classList.remove(
          "is-dragover",
        );

        const droppedFiles = [
          ...(event.dataTransfer?.files ||
            []),
        ];

        if (!droppedFiles.length) {
          showToast(
            "No file detected",
            "Drop one file inside the upload area.",
            "warning",
          );

          return;
        }

        if (droppedFiles.length > 1) {
          showToast(
            "Single-file analysis",
            "Only the first dropped file will be scanned.",
            "warning",
          );
        }

        const file = droppedFiles[0];

        if (!assignDroppedFile(file)) {
          showToast(
            "Browser limitation",
            "Use the Browse local files button.",
            "warning",
          );

          openFileBrowser();
          return;
        }

        await selectAndAutomaticallyScan(
          file,
        );
      },
    );

    /*
     * The button remains functional as a manual fallback.
     */
    elements.form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (state.submitting) {
          return;
        }

        await submitToFlask();
      },
    );

    /*
     * The checkbox is no longer allowed to block scanning.
     * Selecting a valid file checks it automatically.
     */
    elements.consent?.addEventListener(
      "change",
      () => {
        if (
          state.file &&
          validateFile(state.file).valid
        ) {
          elements.consent.checked = true;
        }

        updateReadyState();
      },
    );

    elements.soundButton?.addEventListener(
      "click",
      () => {
        state.soundEnabled =
          !state.soundEnabled;

        elements.soundButton.setAttribute(
          "aria-pressed",
          String(state.soundEnabled),
        );

        elements.soundButton.classList.toggle(
          "is-active",
          state.soundEnabled,
        );

        const icon = $(
          "i",
          elements.soundButton,
        );

        if (icon) {
          icon.className =
            state.soundEnabled
              ? "fa-solid fa-volume-high"
              : "fa-solid fa-volume-xmark";
        }

        showToast(
          "Interface sound",
          state.soundEnabled
            ? "Workspace sound is enabled."
            : "Workspace sound is disabled.",
          "info",
        );
      },
    );

    elements.focusButton?.addEventListener(
      "click",
      () => {
        state.focusEnabled =
          !state.focusEnabled;

        page.classList.toggle(
          "is-focus-mode",
          state.focusEnabled,
        );

        elements.focusButton.setAttribute(
          "aria-pressed",
          String(state.focusEnabled),
        );

        elements.focusButton.classList.toggle(
          "is-active",
          state.focusEnabled,
        );

        const icon = $(
          "i",
          elements.focusButton,
        );

        if (icon) {
          icon.className =
            state.focusEnabled
              ? "fa-solid fa-compress"
              : "fa-solid fa-expand";
        }
      },
    );

    $$(
      "[data-dismiss-server-alert]",
      page,
    ).forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const alert = button.closest(
            "[data-server-alert]",
          );

          if (!alert) {
            return;
          }

          alert.style.opacity = "0";
          alert.style.transform =
            "translateY(-8px)";

          window.setTimeout(() => {
            alert.remove();
          }, 220);
        },
      );
    });

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape" &&
          state.activeModal &&
          !state.submitting
        ) {
          closeModal(
            state.activeModal,
          );
        }

        if (
          (event.metaKey ||
            event.ctrlKey) &&
          event.key.toLowerCase() === "u"
        ) {
          const activeTag =
            document.activeElement?.tagName?.toLowerCase();

          if (
            ![
              "input",
              "textarea",
            ].includes(activeTag)
          ) {
            event.preventDefault();
            openFileBrowser();
          }
        }
      },
    );

    /*
     * Prevent the browser from opening dropped files outside
     * the application dropzone.
     */
    ["dragover", "drop"].forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          (event) => {
            if (
              !elements.dropzone?.contains(
                event.target,
              )
            ) {
              event.preventDefault();
            }
          },
        );
      },
    );

    runBootSequence();
    initialiseTelemetry();
    clearSelectedFile();

    page.classList.add("has-js");

    console.info(
      "[Upload Workspace] Fixed automatic scanning upload.js loaded.",
    );
  };

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialiseUploadWorkspace,
      {
        once: true,
      },
    );
  } else {
    initialiseUploadWorkspace();
  }
})();