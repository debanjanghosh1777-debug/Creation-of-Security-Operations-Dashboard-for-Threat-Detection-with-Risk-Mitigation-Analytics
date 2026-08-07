/* =========================================================
   AI THREAT DETECTION
   ADVANCED LOGIN INTERFACE
   File location: static/js/login.js
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       01. GLOBAL CONFIGURATION
    ===================================================== */

    const CONFIG = {
        preloaderMinimumTime: 1150,
        authenticationDuration: 1450,
        biometricDuration: 3600,
        toastDuration: 5000,

        neuralNetwork: {
            desktopParticleLimit: 115,
            mobileParticleLimit: 62,
            connectionDistance: 145,
            pointerDistance: 175
        },

        matrix: {
            fontSize: 14,
            frameRate: 28
        }
    };

    const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const finePointerQuery = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );

    const state = {
        reducedMotion: reducedMotionQuery.matches,
        finePointer: finePointerQuery.matches,
        soundEnabled: false,
        audioContext: null,
        submitting: false,
        activeModal: null,
        lastFocusedElement: null,
        biometricTimer: null
    };


    /* =====================================================
       02. DOM REFERENCES
    ===================================================== */

    const elements = {
        body: document.body,

        preloader: document.getElementById("pagePreloader"),
        preloaderProgress: document.getElementById("preloaderProgress"),
        preloaderPercentage:
            document.getElementById("preloaderPercentage"),

        neuralCanvas: document.getElementById("neuralCanvas"),
        matrixCanvas: document.getElementById("matrixCanvas"),
        cursorLight: document.getElementById("cursorLight"),

        systemClock: document.getElementById("systemClock"),
        engineStatus: document.getElementById("engineStatus"),
        networkStatus: document.getElementById("networkStatus"),
        currentYear: document.getElementById("currentYear"),
        sessionIdentifier:
            document.getElementById("sessionIdentifier"),

        soundControl: document.getElementById("soundControl"),

        accessCard: document.querySelector(".access-card"),

        loginForm: document.getElementById("loginForm"),
        loginButton: document.getElementById("loginButton"),

        usernameInput: document.getElementById("username"),
        passwordInput: document.getElementById("password"),

        usernameField: document.getElementById("usernameField"),
        passwordField: document.getElementById("passwordField"),

        usernameError: document.getElementById("usernameError"),
        passwordError: document.getElementById("passwordError"),

        passwordToggle: document.getElementById("passwordToggle"),

        authenticationProgress:
            document.getElementById("authenticationProgress"),

        authenticationMessage:
            document.getElementById("authenticationMessage"),

        authenticationPercentage:
            document.getElementById("authenticationPercentage"),

        authenticationBar:
            document.getElementById("authenticationBar"),

        openRecovery: document.getElementById("openRecovery"),
        recoveryModal: document.getElementById("recoveryModal"),
        closeRecovery: document.getElementById("closeRecovery"),

        acknowledgeRecovery:
            document.getElementById("acknowledgeRecovery"),

        biometricButton: document.getElementById("biometricButton"),
        biometricOverlay:
            document.getElementById("biometricOverlay"),

        closeBiometric: document.getElementById("closeBiometric"),

        biometricStatus:
            document.getElementById("biometricStatus"),

        biometricProgress:
            document.getElementById("biometricProgress"),

        biometricPercentage:
            document.getElementById("biometricPercentage"),

        toastRegion: document.getElementById("toastRegion"),

        accessibilityStatus:
            document.getElementById("accessibilityStatus")
    };


    /* =====================================================
       03. UTILITY FUNCTIONS
    ===================================================== */

    const clamp = (value, minimum, maximum) => {
        return Math.min(Math.max(value, minimum), maximum);
    };


    const randomBetween = (minimum, maximum) => {
        return Math.random() * (maximum - minimum) + minimum;
    };


    const debounce = (callback, delay = 150) => {
        let timer;

        return (...argumentsList) => {
            clearTimeout(timer);

            timer = setTimeout(() => {
                callback(...argumentsList);
            }, delay);
        };
    };


    const announce = (message) => {
        if (!elements.accessibilityStatus) {
            return;
        }

        elements.accessibilityStatus.textContent = "";

        window.setTimeout(() => {
            elements.accessibilityStatus.textContent = message;
        }, 50);
    };


    const generateSessionIdentifier = () => {
        let identifier;

        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {
            identifier = window.crypto
                .randomUUID()
                .replaceAll("-", "")
                .slice(0, 12)
                .toUpperCase();
        } else {
            identifier = Math.random()
                .toString(36)
                .slice(2, 14)
                .toUpperCase();
        }

        return `SESSION // ${identifier}`;
    };


    const safelyFocus = (element) => {
        if (!element || typeof element.focus !== "function") {
            return;
        }

        element.focus({
            preventScroll: true
        });
    };


    
/* =====================================================
   04. PROFESSIONAL INTERACTIVE SOUND SYSTEM
===================================================== */

/*
    All sounds are generated through the Web Audio API.

    No MP3 or WAV files are needed.

    Sound remains disabled until the user presses the
    speaker button. This respects browser autoplay rules.
*/


const SOUND_SETTINGS = {
    masterVolume: 0.28,
    hoverThrottle: 90,
    keyThrottle: 48
};


let lastHoverSoundTime = 0;
let lastKeyboardSoundTime = 0;


/* -----------------------------------------------------
   Create the audio processing system
----------------------------------------------------- */

const getAudioContext = () => {
    if (state.audioContext) {
        return state.audioContext;
    }

    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContextClass) {
        return null;
    }

    const audioContext =
        new AudioContextClass();

    const masterGain =
        audioContext.createGain();

    const compressor =
        audioContext.createDynamicsCompressor();


    /*
        Compressor prevents different sounds from becoming
        unexpectedly loud when played together.
    */

    compressor.threshold.setValueAtTime(
        -22,
        audioContext.currentTime
    );

    compressor.knee.setValueAtTime(
        20,
        audioContext.currentTime
    );

    compressor.ratio.setValueAtTime(
        6,
        audioContext.currentTime
    );

    compressor.attack.setValueAtTime(
        0.003,
        audioContext.currentTime
    );

    compressor.release.setValueAtTime(
        0.18,
        audioContext.currentTime
    );


    masterGain.gain.setValueAtTime(
        SOUND_SETTINGS.masterVolume,
        audioContext.currentTime
    );


    masterGain.connect(compressor);
    compressor.connect(audioContext.destination);


    state.audioContext = audioContext;
    state.audioMasterGain = masterGain;
    state.audioCompressor = compressor;

    return audioContext;
};


/* -----------------------------------------------------
   Unlock audio after a user gesture
----------------------------------------------------- */

const unlockAudio = async () => {
    const audioContext =
        getAudioContext();

    if (!audioContext) {
        return false;
    }

    if (audioContext.state === "suspended") {
        try {
            await audioContext.resume();
        } catch (error) {
            console.warn(
                "Audio permission was not granted:",
                error
            );

            return false;
        }
    }

    return true;
};


/* -----------------------------------------------------
   Generate a clean synthesized tone
----------------------------------------------------- */

const createTone = ({
    frequency = 520,
    endFrequency = null,
    duration = 0.08,
    volume = 0.02,
    type = "sine",
    delay = 0,
    attack = 0.008,
    release = 0.06,
    detune = 0
} = {}) => {
    if (!state.soundEnabled) {
        return;
    }

    const audioContext =
        getAudioContext();

    if (
        !audioContext ||
        !state.audioMasterGain
    ) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gainNode =
        audioContext.createGain();

    const startTime =
        audioContext.currentTime + delay;

    const endTime =
        startTime + duration;


    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
        Math.max(frequency, 1),
        startTime
    );

    oscillator.detune.setValueAtTime(
        detune,
        startTime
    );


    if (
        endFrequency !== null &&
        Number.isFinite(endFrequency)
    ) {
        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(endFrequency, 1),
            endTime
        );
    }


    gainNode.gain.setValueAtTime(
        0.0001,
        startTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
        Math.max(volume, 0.0001),
        startTime + attack
    );

    gainNode.gain.setValueAtTime(
        Math.max(volume, 0.0001),
        Math.max(
            startTime + attack,
            endTime - release
        )
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        endTime
    );


    oscillator.connect(gainNode);
    gainNode.connect(state.audioMasterGain);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.03);
};


/* -----------------------------------------------------
   Generate a short digital noise effect
----------------------------------------------------- */

const createNoiseBurst = ({
    duration = 0.035,
    volume = 0.008,
    delay = 0,
    filterFrequency = 1400
} = {}) => {
    if (!state.soundEnabled) {
        return;
    }

    const audioContext =
        getAudioContext();

    if (
        !audioContext ||
        !state.audioMasterGain
    ) {
        return;
    }

    const sampleCount =
        Math.max(
            1,
            Math.floor(
                audioContext.sampleRate *
                duration
            )
        );

    const noiseBuffer =
        audioContext.createBuffer(
            1,
            sampleCount,
            audioContext.sampleRate
        );

    const channelData =
        noiseBuffer.getChannelData(0);


    for (
        let index = 0;
        index < sampleCount;
        index += 1
    ) {
        const progress =
            index / sampleCount;

        const fade =
            1 - progress;

        channelData[index] =
            (Math.random() * 2 - 1) *
            fade;
    }


    const noiseSource =
        audioContext.createBufferSource();

    const filter =
        audioContext.createBiquadFilter();

    const gainNode =
        audioContext.createGain();

    const startTime =
        audioContext.currentTime + delay;


    noiseSource.buffer = noiseBuffer;

    filter.type = "highpass";

    filter.frequency.setValueAtTime(
        filterFrequency,
        startTime
    );

    gainNode.gain.setValueAtTime(
        volume,
        startTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duration
    );


    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(state.audioMasterGain);

    noiseSource.start(startTime);
};


/* -----------------------------------------------------
   Backward-compatible playTone function

   Your existing login.js already calls playTone().
   Keeping this function means those calls will continue
   to work without breaking the page.
----------------------------------------------------- */

const playTone = ({
    frequency = 520,
    endFrequency = null,
    duration = 0.08,
    volume = 0.02,
    type = "sine",
    delay = 0
} = {}) => {
    createTone({
        frequency,
        endFrequency,
        duration,
        volume,
        type,
        delay
    });
};


/* -----------------------------------------------------
   Named professional interface sounds
----------------------------------------------------- */

const playSound = (soundName) => {
    if (!state.soundEnabled) {
        return;
    }

    switch (soundName) {

        /* Very subtle hover feedback */

        case "hover": {
            const currentTime =
                performance.now();

            if (
                currentTime -
                lastHoverSoundTime <
                SOUND_SETTINGS.hoverThrottle
            ) {
                return;
            }

            lastHoverSoundTime =
                currentTime;

            createTone({
                frequency: 680,
                endFrequency: 720,
                duration: 0.032,
                volume: 0.006,
                type: "sine"
            });

            break;
        }


        /* Input field focus */

        case "focus":
            createTone({
                frequency: 390,
                endFrequency: 540,
                duration: 0.065,
                volume: 0.012,
                type: "triangle"
            });

            break;


        /* Soft keyboard terminal sound */

        case "key": {
            const currentTime =
                performance.now();

            if (
                currentTime -
                lastKeyboardSoundTime <
                SOUND_SETTINGS.keyThrottle
            ) {
                return;
            }

            lastKeyboardSoundTime =
                currentTime;

            createTone({
                frequency:
                    720 + Math.random() * 80,
                duration: 0.018,
                volume: 0.0035,
                type: "sine"
            });

            break;
        }


        /* General button click */

        case "click":
            createNoiseBurst({
                duration: 0.024,
                volume: 0.005
            });

            createTone({
                frequency: 470,
                endFrequency: 560,
                duration: 0.045,
                volume: 0.011,
                type: "triangle"
            });

            break;


        /* Login submission */

        case "submit":
            createTone({
                frequency: 320,
                endFrequency: 610,
                duration: 0.13,
                volume: 0.018,
                type: "sine"
            });

            createTone({
                frequency: 790,
                duration: 0.08,
                volume: 0.013,
                type: "triangle",
                delay: 0.09
            });

            break;


        /* Successful operation */

        case "success":
            createTone({
                frequency: 520,
                duration: 0.12,
                volume: 0.016,
                type: "sine"
            });

            createTone({
                frequency: 660,
                duration: 0.13,
                volume: 0.016,
                type: "sine",
                delay: 0.1
            });

            createTone({
                frequency: 880,
                duration: 0.19,
                volume: 0.018,
                type: "sine",
                delay: 0.2
            });

            break;


        /* Error or rejected operation */

        case "error":
            createTone({
                frequency: 235,
                endFrequency: 190,
                duration: 0.15,
                volume: 0.014,
                type: "sawtooth"
            });

            createTone({
                frequency: 175,
                duration: 0.17,
                volume: 0.012,
                type: "triangle",
                delay: 0.13
            });

            break;


        /* Modal opening */

        case "modalOpen":
            createTone({
                frequency: 340,
                endFrequency: 590,
                duration: 0.14,
                volume: 0.014,
                type: "sine"
            });

            createTone({
                frequency: 760,
                duration: 0.07,
                volume: 0.008,
                type: "triangle",
                delay: 0.08
            });

            break;


        /* Modal closing */

        case "modalClose":
            createTone({
                frequency: 560,
                endFrequency: 320,
                duration: 0.11,
                volume: 0.012,
                type: "sine"
            });

            break;


        /* Biometric scanning pulse */

        case "scanPulse":
            createTone({
                frequency: 690,
                endFrequency: 930,
                duration: 0.05,
                volume: 0.008,
                type: "sine"
            });

            break;


        /* Sound system enabled */

        case "toggleOn":
            createTone({
                frequency: 430,
                duration: 0.07,
                volume: 0.013,
                type: "triangle"
            });

            createTone({
                frequency: 650,
                duration: 0.1,
                volume: 0.015,
                type: "sine",
                delay: 0.07
            });

            break;


        /* Sound system disabled */

        case "toggleOff":
            createTone({
                frequency: 560,
                endFrequency: 300,
                duration: 0.1,
                volume: 0.012,
                type: "triangle"
            });

            break;


        default:
            createTone({
                frequency: 500,
                duration: 0.05,
                volume: 0.009
            });
    }
};


/* -----------------------------------------------------
   Compatibility functions used elsewhere in login.js
----------------------------------------------------- */

const playSuccessSequence = () => {
    playSound("success");
};


const playErrorSequence = () => {
    playSound("error");
};


/* -----------------------------------------------------
   Sound control button
----------------------------------------------------- */

const initializeSoundControl = () => {
    if (!elements.soundControl) {
        return;
    }

    const updateSoundButton = () => {
        elements.soundControl.setAttribute(
            "aria-pressed",
            String(state.soundEnabled)
        );

        elements.soundControl.setAttribute(
            "aria-label",
            state.soundEnabled
                ? "Disable interface sound"
                : "Enable interface sound"
        );

        const icon =
            elements.soundControl.querySelector("i");

        if (icon) {
            icon.className =
                state.soundEnabled
                    ? "fa-solid fa-volume-high"
                    : "fa-solid fa-volume-xmark";
        }
    };


    updateSoundButton();


    elements.soundControl.addEventListener(
        "click",
        async () => {
            if (!state.soundEnabled) {
                state.soundEnabled = true;

                const audioAvailable =
                    await unlockAudio();

                if (!audioAvailable) {
                    state.soundEnabled = false;
                    updateSoundButton();

                    showToast({
                        title:
                            "Audio Unavailable",

                        message:
                            "This browser could not activate interface audio.",

                        type: "error",

                        icon:
                            "fa-solid fa-volume-xmark"
                    });

                    return;
                }

                updateSoundButton();
                playSound("toggleOn");

                showToast({
                    title:
                        "Interface Audio Enabled",

                    message:
                        "Professional security interface sounds are now active.",

                    type: "success",

                    icon:
                        "fa-solid fa-volume-high"
                });

                announce(
                    "Interface sounds enabled."
                );

                return;
            }


            /*
                Play the shutdown sound before disabling
                the sound engine.
            */

            playSound("toggleOff");

            state.soundEnabled = false;

            updateSoundButton();

            showToast({
                title:
                    "Interface Audio Disabled",

                message:
                    "The interface will continue silently.",

                type: "information",

                icon:
                    "fa-solid fa-volume-xmark"
            });

            announce(
                "Interface sounds disabled."
            );
        }
    );
};

    /* =====================================================
       05. TOAST NOTIFICATION SYSTEM
    ===================================================== */

    const showToast = ({
        title,
        message,
        type = "information",
        icon = "fa-solid fa-circle-info",
        duration = CONFIG.toastDuration
    }) => {
        if (!elements.toastRegion) {
            return;
        }

        const toast = document.createElement("div");

        toast.className = `toast toast--${type}`;
        toast.setAttribute("role", "status");

        const iconContainer =
            document.createElement("span");

        iconContainer.className = "toast__icon";

        const iconElement =
            document.createElement("i");

        iconElement.className = icon;

        iconContainer.appendChild(iconElement);


        const content =
            document.createElement("div");

        content.className = "toast__content";


        const heading =
            document.createElement("strong");

        heading.textContent = title;


        const description =
            document.createElement("span");

        description.textContent = message;

        content.append(heading, description);


        const closeButton =
            document.createElement("button");

        closeButton.type = "button";
        closeButton.className = "toast__close";
        closeButton.setAttribute(
            "aria-label",
            "Dismiss notification"
        );

        const closeIcon =
            document.createElement("i");

        closeIcon.className = "fa-solid fa-xmark";

        closeButton.appendChild(closeIcon);

        toast.append(
            iconContainer,
            content,
            closeButton
        );

        elements.toastRegion.appendChild(toast);


        const removeToast = () => {
            if (!toast.isConnected) {
                return;
            }

            toast.classList.add("is-leaving");

            window.setTimeout(() => {
                toast.remove();
            }, 320);
        };


        closeButton.addEventListener(
            "click",
            removeToast
        );

        window.setTimeout(
            removeToast,
            duration
        );
    };


    /* =====================================================
       06. PRELOADER
    ===================================================== */

    const initializePreloader = () => {
        if (
            !elements.preloader ||
            !elements.preloaderProgress ||
            !elements.preloaderPercentage
        ) {
            return;
        }

        elements.body.classList.add("is-loading");

        let progress = 0;
        const startTime = performance.now();

        const loadingInterval = window.setInterval(() => {
            const increment =
                progress < 40
                    ? randomBetween(5, 11)
                    : progress < 75
                        ? randomBetween(2.5, 7)
                        : randomBetween(1, 3.5);

            progress = Math.min(
                progress + increment,
                96
            );

            const roundedProgress =
                Math.floor(progress);

            elements.preloaderProgress.style.width =
                `${roundedProgress}%`;

            elements.preloaderPercentage.textContent =
                `${roundedProgress}%`;
        }, state.reducedMotion ? 40 : 85);


        const completePreloader = () => {
            const elapsedTime =
                performance.now() - startTime;

            const remainingTime =
                Math.max(
                    0,
                    CONFIG.preloaderMinimumTime - elapsedTime
                );

            window.setTimeout(() => {
                window.clearInterval(loadingInterval);

                elements.preloaderProgress.style.width =
                    "100%";

                elements.preloaderPercentage.textContent =
                    "100%";

                window.setTimeout(() => {
                    elements.body.classList.remove(
                        "is-loading"
                    );

                    announce(
                        "AI Threat Detection login interface ready."
                    );

                    playTone({
                        frequency: 620,
                        duration: 0.08
                    });
                }, state.reducedMotion ? 50 : 260);
            }, remainingTime);
        };


        if (document.readyState === "complete") {
            completePreloader();
        } else {
            window.addEventListener(
                "load",
                completePreloader,
                {
                    once: true
                }
            );
        }
    };


    /* =====================================================
       07. SYSTEM CLOCK AND STATUS
    ===================================================== */

    const updateSystemClock = () => {
        if (!elements.systemClock) {
            return;
        }

        const currentTime = new Date();

        elements.systemClock.textContent =
            new Intl.DateTimeFormat("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }).format(currentTime);
    };


    const updateNetworkStatus = () => {
        if (!elements.networkStatus) {
            return;
        }

        const isOnline = navigator.onLine;

        elements.networkStatus.textContent =
            isOnline ? "SECURE" : "OFFLINE";

        elements.networkStatus.style.color =
            isOnline
                ? "var(--cyan-light)"
                : "var(--red)";

        if (elements.engineStatus) {
            elements.engineStatus.textContent =
                isOnline ? "ONLINE" : "LOCAL";

            elements.engineStatus.style.color =
                isOnline
                    ? "var(--green)"
                    : "var(--yellow)";
        }
    };


    const initializeSystemInformation = () => {
        updateSystemClock();
        updateNetworkStatus();

        window.setInterval(
            updateSystemClock,
            1000
        );

        window.addEventListener(
            "online",
            () => {
                updateNetworkStatus();

                showToast({
                    title: "Network Restored",
                    message:
                        "The security gateway is connected again.",
                    type: "success",
                    icon: "fa-solid fa-wifi"
                });
            }
        );

        window.addEventListener(
            "offline",
            () => {
                updateNetworkStatus();

                showToast({
                    title: "Network Offline",
                    message:
                        "Authentication may be unavailable until connectivity returns.",
                    type: "error",
                    icon: "fa-solid fa-triangle-exclamation"
                });
            }
        );

        if (elements.currentYear) {
            elements.currentYear.textContent =
                String(new Date().getFullYear());
        }

        if (elements.sessionIdentifier) {
            elements.sessionIdentifier.textContent =
                generateSessionIdentifier();
        }
    };


    /* =====================================================
       08. CURSOR LIGHT
    ===================================================== */

    const initializeCursorLight = () => {
        if (
            !elements.cursorLight ||
            !state.finePointer ||
            state.reducedMotion
        ) {
            if (elements.cursorLight) {
                elements.cursorLight.style.display = "none";
            }

            return;
        }

        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight / 2;

        let currentX = targetX;
        let currentY = targetY;

        let animationFrame = null;


        const render = () => {
            currentX += (targetX - currentX) * 0.12;
            currentY += (targetY - currentY) * 0.12;

            elements.cursorLight.style.transform =
                `translate3d(${currentX - 260}px, ` +
                `${currentY - 260}px, 0)`;

            animationFrame =
                window.requestAnimationFrame(render);
        };


        window.addEventListener(
            "pointermove",
            (event) => {
                targetX = event.clientX;
                targetY = event.clientY;
                elements.cursorLight.style.opacity = "0.55";
            },
            {
                passive: true
            }
        );


        document.documentElement.addEventListener(
            "mouseleave",
            () => {
                elements.cursorLight.style.opacity = "0";
            }
        );


        document.documentElement.addEventListener(
            "mouseenter",
            () => {
                elements.cursorLight.style.opacity = "0.55";
            }
        );


        render();


        window.addEventListener(
            "pagehide",
            () => {
                if (animationFrame) {
                    window.cancelAnimationFrame(
                        animationFrame
                    );
                }
            },
            {
                once: true
            }
        );
    };


    /* =====================================================
       09. ACCESS CARD 3D TILT
    ===================================================== */

    const initializeCardTilt = () => {
        if (
            !elements.accessCard ||
            !state.finePointer ||
            state.reducedMotion
        ) {
            return;
        }

        const maximumRotation = 4.5;


        elements.accessCard.addEventListener(
            "pointermove",
            (event) => {
                const rectangle =
                    elements.accessCard.getBoundingClientRect();

                const x =
                    event.clientX - rectangle.left;

                const y =
                    event.clientY - rectangle.top;

                const normalizedX =
                    x / rectangle.width - 0.5;

                const normalizedY =
                    y / rectangle.height - 0.5;

                const rotateY =
                    normalizedX * maximumRotation * 2;

                const rotateX =
                    normalizedY * maximumRotation * -2;

                elements.accessCard.style.transform =
                    `perspective(1100px) ` +
                    `rotateX(${rotateX}deg) ` +
                    `rotateY(${rotateY}deg) ` +
                    `translateZ(4px)`;
            }
        );


        elements.accessCard.addEventListener(
            "pointerleave",
            () => {
                elements.accessCard.style.transform =
                    "perspective(1100px) " +
                    "rotateX(0deg) rotateY(0deg) " +
                    "translateZ(0)";
            }
        );
    };


    /* =====================================================
       10. NEURAL PARTICLE NETWORK
    ===================================================== */

    class NeuralNetworkBackground {
        constructor(canvas) {
            this.canvas = canvas;
            this.context = canvas.getContext(
                "2d",
                {
                    alpha: true
                }
            );

            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.devicePixelRatio = 1;

            this.particles = [];
            this.animationFrame = null;

            this.pointer = {
                x: null,
                y: null,
                active: false
            };

            this.resize = this.resize.bind(this);
            this.animate = this.animate.bind(this);

            this.initialize();
        }


        initialize() {
            this.resize();

            window.addEventListener(
                "resize",
                debounce(this.resize, 180)
            );

            window.addEventListener(
                "pointermove",
                (event) => {
                    this.pointer.x = event.clientX;
                    this.pointer.y = event.clientY;
                    this.pointer.active = true;
                },
                {
                    passive: true
                }
            );

            document.documentElement.addEventListener(
                "mouseleave",
                () => {
                    this.pointer.active = false;
                    this.pointer.x = null;
                    this.pointer.y = null;
                }
            );

            this.animate();
        }


        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            this.devicePixelRatio = Math.min(
                window.devicePixelRatio || 1,
                1.75
            );

            this.canvas.width =
                Math.floor(
                    this.width * this.devicePixelRatio
                );

            this.canvas.height =
                Math.floor(
                    this.height * this.devicePixelRatio
                );

            this.canvas.style.width =
                `${this.width}px`;

            this.canvas.style.height =
                `${this.height}px`;

            this.context.setTransform(
                this.devicePixelRatio,
                0,
                0,
                this.devicePixelRatio,
                0,
                0
            );

            this.createParticles();
        }


        createParticles() {
            this.particles = [];

            const screenArea =
                this.width * this.height;

            const hardwareLimit =
                navigator.hardwareConcurrency &&
                navigator.hardwareConcurrency <= 4
                    ? 75
                    : CONFIG.neuralNetwork.desktopParticleLimit;

            const maximumParticles =
                this.width < 760
                    ? CONFIG.neuralNetwork.mobileParticleLimit
                    : hardwareLimit;

            const calculatedAmount =
                Math.floor(screenArea / 15000);

            const particleAmount = clamp(
                calculatedAmount,
                34,
                maximumParticles
            );

            for (
                let index = 0;
                index < particleAmount;
                index += 1
            ) {
                this.particles.push(
                    this.createParticle()
                );
            }
        }


        createParticle() {
            return {
                x: randomBetween(0, this.width),
                y: randomBetween(0, this.height),

                velocityX:
                    randomBetween(-0.22, 0.22),

                velocityY:
                    randomBetween(-0.22, 0.22),

                radius:
                    randomBetween(0.8, 2.1),

                opacity:
                    randomBetween(0.3, 0.95),

                pulseOffset:
                    randomBetween(0, Math.PI * 2),

                tone:
                    Math.random() > 0.78
                        ? "violet"
                        : "cyan"
            };
        }


        updateParticle(particle) {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;

            if (particle.x < -10) {
                particle.x = this.width + 10;
            }

            if (particle.x > this.width + 10) {
                particle.x = -10;
            }

            if (particle.y < -10) {
                particle.y = this.height + 10;
            }

            if (particle.y > this.height + 10) {
                particle.y = -10;
            }

            if (
                this.pointer.active &&
                this.pointer.x !== null &&
                this.pointer.y !== null
            ) {
                const deltaX =
                    particle.x - this.pointer.x;

                const deltaY =
                    particle.y - this.pointer.y;

                const distanceSquared =
                    deltaX * deltaX +
                    deltaY * deltaY;

                const pointerDistance =
                    CONFIG.neuralNetwork.pointerDistance;

                if (
                    distanceSquared <
                    pointerDistance * pointerDistance
                ) {
                    const distance =
                        Math.sqrt(distanceSquared) || 1;

                    const force =
                        1 - distance / pointerDistance;

                    particle.x +=
                        (deltaX / distance) *
                        force *
                        1.2;

                    particle.y +=
                        (deltaY / distance) *
                        force *
                        1.2;
                }
            }
        }


        drawParticle(particle, time) {
            const pulse =
                Math.sin(
                    time * 0.0015 +
                    particle.pulseOffset
                ) * 0.22 + 0.78;

            const alpha =
                particle.opacity * pulse;

            const color =
                particle.tone === "violet"
                    ? `rgba(137, 85, 255, ${alpha})`
                    : `rgba(0, 234, 255, ${alpha})`;

            this.context.beginPath();

            this.context.arc(
                particle.x,
                particle.y,
                particle.radius * pulse,
                0,
                Math.PI * 2
            );

            this.context.fillStyle = color;

            this.context.shadowBlur =
                particle.radius > 1.4 ? 13 : 7;

            this.context.shadowColor = color;

            this.context.fill();

            this.context.shadowBlur = 0;
        }


        drawConnections() {
            const connectionDistance =
                CONFIG.neuralNetwork.connectionDistance;

            const maximumDistanceSquared =
                connectionDistance *
                connectionDistance;

            for (
                let firstIndex = 0;
                firstIndex < this.particles.length;
                firstIndex += 1
            ) {
                const firstParticle =
                    this.particles[firstIndex];

                for (
                    let secondIndex = firstIndex + 1;
                    secondIndex < this.particles.length;
                    secondIndex += 1
                ) {
                    const secondParticle =
                        this.particles[secondIndex];

                    const deltaX =
                        firstParticle.x -
                        secondParticle.x;

                    const deltaY =
                        firstParticle.y -
                        secondParticle.y;

                    const distanceSquared =
                        deltaX * deltaX +
                        deltaY * deltaY;

                    if (
                        distanceSquared >
                        maximumDistanceSquared
                    ) {
                        continue;
                    }

                    const distance =
                        Math.sqrt(distanceSquared);

                    const opacity =
                        (1 -
                            distance /
                            connectionDistance) *
                        0.23;

                    const gradient =
                        this.context.createLinearGradient(
                            firstParticle.x,
                            firstParticle.y,
                            secondParticle.x,
                            secondParticle.y
                        );

                    gradient.addColorStop(
                        0,
                        `rgba(0, 234, 255, ${opacity})`
                    );

                    gradient.addColorStop(
                        1,
                        `rgba(60, 91, 255, ${opacity * 0.8})`
                    );

                    this.context.beginPath();

                    this.context.moveTo(
                        firstParticle.x,
                        firstParticle.y
                    );

                    this.context.lineTo(
                        secondParticle.x,
                        secondParticle.y
                    );

                    this.context.strokeStyle = gradient;
                    this.context.lineWidth = 0.7;
                    this.context.stroke();
                }
            }
        }


        drawPointerConnections() {
            if (
                !this.pointer.active ||
                this.pointer.x === null ||
                this.pointer.y === null
            ) {
                return;
            }

            const maximumDistance = 190;

            this.particles.forEach((particle) => {
                const deltaX =
                    particle.x - this.pointer.x;

                const deltaY =
                    particle.y - this.pointer.y;

                const distance =
                    Math.sqrt(
                        deltaX * deltaX +
                        deltaY * deltaY
                    );

                if (distance >= maximumDistance) {
                    return;
                }

                const opacity =
                    (1 - distance / maximumDistance) *
                    0.18;

                this.context.beginPath();

                this.context.moveTo(
                    this.pointer.x,
                    this.pointer.y
                );

                this.context.lineTo(
                    particle.x,
                    particle.y
                );

                this.context.strokeStyle =
                    `rgba(0, 234, 255, ${opacity})`;

                this.context.lineWidth = 0.8;
                this.context.stroke();
            });
        }


        animate(time = 0) {
            this.animationFrame =
                window.requestAnimationFrame(
                    this.animate
                );

            if (
                document.hidden ||
                state.reducedMotion
            ) {
                return;
            }

            this.context.clearRect(
                0,
                0,
                this.width,
                this.height
            );

            this.particles.forEach((particle) => {
                this.updateParticle(particle);
                this.drawParticle(particle, time);
            });

            this.drawConnections();
            this.drawPointerConnections();
        }
    }


    /* =====================================================
       11. DIGITAL MATRIX BACKGROUND
    ===================================================== */

    class MatrixBackground {
        constructor(canvas) {
            this.canvas = canvas;

            this.context = canvas.getContext(
                "2d",
                {
                    alpha: true
                }
            );

            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.devicePixelRatio = 1;

            this.fontSize =
                CONFIG.matrix.fontSize;

            this.columns = 0;
            this.drops = [];
            this.animationFrame = null;
            this.lastFrameTime = 0;

            this.characters =
                "01アイウエオカキクケコ" +
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
                "0123456789<>/{}[]$#@";

            this.resize = this.resize.bind(this);
            this.animate = this.animate.bind(this);

            this.initialize();
        }


        initialize() {
            this.resize();

            window.addEventListener(
                "resize",
                debounce(this.resize, 200)
            );

            this.animate();
        }


        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            this.devicePixelRatio = Math.min(
                window.devicePixelRatio || 1,
                1.5
            );

            this.canvas.width =
                Math.floor(
                    this.width * this.devicePixelRatio
                );

            this.canvas.height =
                Math.floor(
                    this.height * this.devicePixelRatio
                );

            this.canvas.style.width =
                `${this.width}px`;

            this.canvas.style.height =
                `${this.height}px`;

            this.context.setTransform(
                this.devicePixelRatio,
                0,
                0,
                this.devicePixelRatio,
                0,
                0
            );

            this.columns =
                Math.ceil(
                    this.width / this.fontSize
                );

            this.drops = Array.from(
                {
                    length: this.columns
                },
                () => randomBetween(
                    -this.height / this.fontSize,
                    1
                )
            );
        }


        draw() {
            this.context.fillStyle =
                "rgba(2, 6, 13, 0.11)";

            this.context.fillRect(
                0,
                0,
                this.width,
                this.height
            );

            this.context.font =
                `${this.fontSize}px "JetBrains Mono", monospace`;

            for (
                let column = 0;
                column < this.drops.length;
                column += 1
            ) {
                const character =
                    this.characters[
                        Math.floor(
                            Math.random() *
                            this.characters.length
                        )
                    ];

                const x =
                    column * this.fontSize;

                const y =
                    this.drops[column] *
                    this.fontSize;

                const isBrightCharacter =
                    Math.random() > 0.965;

                this.context.fillStyle =
                    isBrightCharacter
                        ? "rgba(180, 250, 255, 0.65)"
                        : "rgba(0, 222, 255, 0.24)";

                this.context.fillText(
                    character,
                    x,
                    y
                );

                if (
                    y > this.height &&
                    Math.random() > 0.975
                ) {
                    this.drops[column] =
                        randomBetween(-20, 0);
                }

                this.drops[column] +=
                    randomBetween(0.55, 1.15);
            }
        }


        animate(time = 0) {
            this.animationFrame =
                window.requestAnimationFrame(
                    this.animate
                );

            if (
                document.hidden ||
                state.reducedMotion
            ) {
                return;
            }

            const frameInterval =
                1000 / CONFIG.matrix.frameRate;

            if (
                time - this.lastFrameTime <
                frameInterval
            ) {
                return;
            }

            this.lastFrameTime = time;
            this.draw();
        }
    }


    const initializeBackgroundCanvases = () => {
        if (
            elements.neuralCanvas &&
            !state.reducedMotion
        ) {
            new NeuralNetworkBackground(
                elements.neuralCanvas
            );
        }

        if (
            elements.matrixCanvas &&
            !state.reducedMotion
        ) {
            new MatrixBackground(
                elements.matrixCanvas
            );
        }
    };


    /* =====================================================
       12. ANIMATED STATISTIC COUNTERS
    ===================================================== */

    const animateCounter = (element) => {
        const targetValue =
            Number(element.dataset.counter);

        if (!Number.isFinite(targetValue)) {
            return;
        }

        const duration =
            state.reducedMotion ? 1 : 1600;

        const startTime = performance.now();

        const formatter =
            new Intl.NumberFormat("en-IN");


        const update = (currentTime) => {
            const elapsedTime =
                currentTime - startTime;

            const progress =
                clamp(
                    elapsedTime / duration,
                    0,
                    1
                );

            const easedProgress =
                1 - Math.pow(1 - progress, 4);

            const currentValue =
                Math.floor(
                    targetValue * easedProgress
                );

            element.textContent =
                formatter.format(currentValue);

            if (progress < 1) {
                window.requestAnimationFrame(update);
            } else {
                element.textContent =
                    formatter.format(targetValue);
            }
        };

        window.requestAnimationFrame(update);
    };


    const initializeCounters = () => {
        const counters =
            document.querySelectorAll(
                "[data-counter]"
            );

        if (!counters.length) {
            return;
        }

        if (!("IntersectionObserver" in window)) {
            counters.forEach(animateCounter);
            return;
        }

        const observer =
            new IntersectionObserver(
                (entries, currentObserver) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        animateCounter(entry.target);

                        currentObserver.unobserve(
                            entry.target
                        );
                    });
                },
                {
                    threshold: 0.35
                }
            );

        counters.forEach((counter) => {
            observer.observe(counter);
        });
    };


    /* =====================================================
       13. FORM FIELD VALIDATION
    ===================================================== */

    const clearFieldState = (
        field,
        errorElement
    ) => {
        if (field) {
            field.classList.remove(
                "is-valid",
                "is-invalid"
            );
        }

        if (errorElement) {
            errorElement.textContent = "";
        }
    };


    const setFieldValid = (
        field,
        errorElement
    ) => {
        if (!field) {
            return;
        }

        field.classList.remove("is-invalid");
        field.classList.add("is-valid");

        if (errorElement) {
            errorElement.textContent = "";
        }
    };


    const setFieldInvalid = (
        field,
        errorElement,
        message
    ) => {
        if (!field) {
            return;
        }

        field.classList.remove("is-valid");
        field.classList.add("is-invalid");

        if (errorElement) {
            errorElement.textContent = message;
        }
    };


    const validateUsername = () => {
        if (!elements.usernameInput) {
            return true;
        }

        const username =
            elements.usernameInput.value.trim();

        if (!username) {
            setFieldInvalid(
                elements.usernameField,
                elements.usernameError,
                "Username is required"
            );

            return false;
        }

        if (username.length < 2) {
            setFieldInvalid(
                elements.usernameField,
                elements.usernameError,
                "Enter a valid username"
            );

            return false;
        }

        setFieldValid(
            elements.usernameField,
            elements.usernameError
        );

        return true;
    };


    const validatePassword = () => {
        if (!elements.passwordInput) {
            return true;
        }

        const password =
            elements.passwordInput.value;

        if (!password) {
            setFieldInvalid(
                elements.passwordField,
                elements.passwordError,
                "Password is required"
            );

            return false;
        }

        setFieldValid(
            elements.passwordField,
            elements.passwordError
        );

        return true;
    };


    const validateForm = () => {
        const usernameValid =
            validateUsername();

        const passwordValid =
            validatePassword();

        return usernameValid && passwordValid;
    };


    const initializeLiveValidation = () => {
        if (elements.usernameInput) {
            elements.usernameInput.addEventListener(
                "input",
                () => {
                    const username =
                        elements.usernameInput.value.trim();

                    if (!username) {
                        clearFieldState(
                            elements.usernameField,
                            elements.usernameError
                        );

                        return;
                    }

                    if (username.length >= 2) {
                        setFieldValid(
                            elements.usernameField,
                            elements.usernameError
                        );
                    }
                }
            );

            elements.usernameInput.addEventListener(
                "blur",
                validateUsername
            );
        }


        if (elements.passwordInput) {
            elements.passwordInput.addEventListener(
                "input",
                () => {
                    if (!elements.passwordInput.value) {
                        clearFieldState(
                            elements.passwordField,
                            elements.passwordError
                        );

                        return;
                    }

                    setFieldValid(
                        elements.passwordField,
                        elements.passwordError
                    );
                }
            );

            elements.passwordInput.addEventListener(
                "blur",
                validatePassword
            );
        }
    };


    /* =====================================================
       14. PASSWORD VISIBILITY
    ===================================================== */

    const initializePasswordToggle = () => {
        if (
            !elements.passwordToggle ||
            !elements.passwordInput
        ) {
            return;
        }

        elements.passwordToggle.addEventListener(
            "click",
            () => {
                const isPasswordVisible =
                    elements.passwordInput.type === "text";

                elements.passwordInput.type =
                    isPasswordVisible
                        ? "password"
                        : "text";

                elements.passwordToggle.setAttribute(
                    "aria-pressed",
                    String(!isPasswordVisible)
                );

                elements.passwordToggle.setAttribute(
                    "aria-label",
                    isPasswordVisible
                        ? "Show password"
                        : "Hide password"
                );

                const icon =
                    elements.passwordToggle.querySelector("i");

                if (icon) {
                    icon.className =
                        isPasswordVisible
                            ? "fa-solid fa-eye"
                            : "fa-solid fa-eye-slash";
                }

                playTone({
                    frequency:
                        isPasswordVisible ? 430 : 570,
                    duration: 0.055
                });

                safelyFocus(
                    elements.passwordInput
                );
            }
        );
    };


    /* =====================================================
       15. SECURE LOGIN SUBMISSION ANIMATION
    ===================================================== */

    const resetAuthenticationProgress = () => {
        if (elements.authenticationProgress) {
            elements.authenticationProgress.classList.remove(
                "is-visible"
            );

            elements.authenticationProgress.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        if (elements.authenticationBar) {
            elements.authenticationBar.style.width = "0%";
        }

        if (elements.authenticationPercentage) {
            elements.authenticationPercentage.textContent =
                "0%";
        }

        if (elements.authenticationMessage) {
            elements.authenticationMessage.textContent =
                "Verifying security credentials";
        }
    };


    const runAuthenticationAnimation = () => {
        return new Promise((resolve) => {
            if (
                !elements.authenticationProgress ||
                !elements.authenticationBar ||
                !elements.authenticationPercentage ||
                !elements.authenticationMessage
            ) {
                resolve();
                return;
            }

            const stages = [
                {
                    progress: 0,
                    message:
                        "Encrypting credential payload"
                },
                {
                    progress: 25,
                    message:
                        "Verifying operator identity"
                },
                {
                    progress: 52,
                    message:
                        "Checking security gateway"
                },
                {
                    progress: 76,
                    message:
                        "Establishing secure session"
                },
                {
                    progress: 94,
                    message:
                        "Awaiting server authorization"
                }
            ];

            elements.authenticationProgress.classList.add(
                "is-visible"
            );

            elements.authenticationProgress.setAttribute(
                "aria-hidden",
                "false"
            );

            const startTime = performance.now();

            const duration =
                state.reducedMotion
                    ? 120
                    : CONFIG.authenticationDuration;


            const updateProgress = (currentTime) => {
                const elapsedTime =
                    currentTime - startTime;

                const progress =
                    clamp(
                        elapsedTime / duration,
                        0,
                        1
                    );

                const easedProgress =
                    1 - Math.pow(1 - progress, 3);

                const percentage =
                    Math.floor(
                        easedProgress * 100
                    );

                elements.authenticationBar.style.width =
                    `${percentage}%`;

                elements.authenticationPercentage.textContent =
                    `${percentage}%`;

                let activeStage = stages[0];

                stages.forEach((stage) => {
                    if (
                        percentage >=
                        stage.progress
                    ) {
                        activeStage = stage;
                    }
                });

                elements.authenticationMessage.textContent =
                    activeStage.message;

                if (progress < 1) {
                    window.requestAnimationFrame(
                        updateProgress
                    );
                    return;
                }

                elements.authenticationMessage.textContent =
                    "Transferring request to secure server";

                resolve();
            };

            window.requestAnimationFrame(
                updateProgress
            );
        });
    };


    const initializeLoginForm = () => {
        if (!elements.loginForm) {
            return;
        }

        elements.loginForm.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                if (state.submitting) {
                    return;
                }

                const isFormValid =
                    validateForm();

                if (!isFormValid) {
                    playErrorSequence();

                    showToast({
                        title: "Credentials Required",
                        message:
                            "Enter your username and password before continuing.",
                        type: "error",
                        icon:
                            "fa-solid fa-triangle-exclamation"
                    });

                    const firstInvalidInput =
                        elements.loginForm.querySelector(
                            ".form-field.is-invalid input"
                        );

                    safelyFocus(firstInvalidInput);

                    announce(
                        "Login form contains incomplete information."
                    );

                    return;
                }

                state.submitting = true;

                elements.loginForm.classList.add(
                    "is-submitting"
                );

                if (elements.loginButton) {
                    elements.loginButton.disabled = true;
                    elements.loginButton.setAttribute(
                        "aria-busy",
                        "true"
                    );
                }

                announce(
                    "Secure authentication process started."
                );

                playTone({
                    frequency: 480,
                    duration: 0.08
                });

                try {
                    await runAuthenticationAnimation();

                    playTone({
                        frequency: 720,
                        duration: 0.09
                    });

                    /*
                     Native form submission is used here so the
                     Flask POST request is not intercepted again.
                    */

                    HTMLFormElement.prototype.submit.call(
                        elements.loginForm
                    );
                } catch (error) {
                    console.error(
                        "Authentication animation failed:",
                        error
                    );

                    state.submitting = false;

                    elements.loginForm.classList.remove(
                        "is-submitting"
                    );

                    if (elements.loginButton) {
                        elements.loginButton.disabled = false;
                        elements.loginButton.removeAttribute(
                            "aria-busy"
                        );
                    }

                    resetAuthenticationProgress();

                    showToast({
                        title: "Interface Error",
                        message:
                            "The login request could not be initialized. Please try again.",
                        type: "error",
                        icon:
                            "fa-solid fa-circle-exclamation"
                    });
                }
            }
        );
    };


    /* =====================================================
       16. FLASH ALERT DISMISSAL
    ===================================================== */

    const initializeFlashAlerts = () => {
        const alerts =
            document.querySelectorAll(
                ".system-alert"
            );

        alerts.forEach((alert) => {
            const closeButton =
                alert.querySelector(
                    ".system-alert__close"
                );

            const removeAlert = () => {
                if (
                    typeof alert.animate === "function" &&
                    !state.reducedMotion
                ) {
                    const animation = alert.animate(
                        [
                            {
                                opacity: 1,
                                transform:
                                    "translateX(0)"
                            },
                            {
                                opacity: 0,
                                transform:
                                    "translateX(25px)"
                            }
                        ],
                        {
                            duration: 260,
                            easing: "ease",
                            fill: "forwards"
                        }
                    );

                    animation.addEventListener(
                        "finish",
                        () => {
                            alert.remove();
                        },
                        {
                            once: true
                        }
                    );
                } else {
                    alert.remove();
                }
            };

            if (closeButton) {
                closeButton.addEventListener(
                    "click",
                    removeAlert
                );
            }

            window.setTimeout(
                removeAlert,
                9000
            );
        });

        if (alerts.length > 0) {
    const successAlert =
        document.querySelector(
            ".system-alert--success"
        );

    const warningAlert =
        document.querySelector(
            ".system-alert--warning"
        );

    const errorAlert =
        document.querySelector(
            ".system-alert:not(.system-alert--success):not(.system-alert--warning)"
        );


    if (successAlert) {
        window.setTimeout(
            playSuccessSequence,
            450
        );
    } else if (errorAlert) {
        window.setTimeout(
            playErrorSequence,
            450
        );
    } else if (warningAlert) {
        window.setTimeout(
            () => {
                playTone({
                    frequency: 430,
                    endFrequency: 390,
                    duration: 0.13,
                    volume: 0.012,
                    type: "triangle"
                });
            },
            450
        );
    }
}
    };


    /* =====================================================
       17. MODAL ACCESSIBILITY HELPERS
    ===================================================== */

    const getFocusableElements = (container) => {
        if (!container) {
            return [];
        }

        return Array.from(
            container.querySelectorAll(
                [
                    "button:not([disabled])",
                    "a[href]",
                    "input:not([disabled])",
                    "select:not([disabled])",
                    "textarea:not([disabled])",
                    "[tabindex]:not([tabindex='-1'])"
                ].join(",")
            )
        ).filter((element) => {
            return (
                element.offsetWidth > 0 ||
                element.offsetHeight > 0
            );
        });
    };


    const handleFocusTrap = (event) => {
        if (
            event.key !== "Tab" ||
            !state.activeModal
        ) {
            return;
        }

        const focusableElements =
            getFocusableElements(
                state.activeModal
            );

        if (!focusableElements.length) {
            event.preventDefault();
            return;
        }

        const firstElement =
            focusableElements[0];

        const lastElement =
            focusableElements[
                focusableElements.length - 1
            ];

        if (
            event.shiftKey &&
            document.activeElement === firstElement
        ) {
            event.preventDefault();
            safelyFocus(lastElement);
        } else if (
            !event.shiftKey &&
            document.activeElement === lastElement
        ) {
            event.preventDefault();
            safelyFocus(firstElement);
        }
    };


    const openOverlay = (
        overlay,
        focusTarget = null
    ) => {
        if (!overlay) {
            return;
        }
    playSound("modalOpen");
        state.lastFocusedElement =
            document.activeElement;

        state.activeModal = overlay;

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        elements.body.style.overflow = "hidden";

        document.addEventListener(
            "keydown",
            handleFocusTrap
        );

        window.setTimeout(() => {
            const firstFocusable =
                focusTarget ||
                getFocusableElements(overlay)[0];

            safelyFocus(firstFocusable);
        }, 80);
    };


    const closeOverlay = (overlay) => {
        if (!overlay) {
            return;
        }
    playSound("modalClose");
        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        state.activeModal = null;

        elements.body.style.overflow = "";

        document.removeEventListener(
            "keydown",
            handleFocusTrap
        );

        safelyFocus(
            state.lastFocusedElement
        );
    };


    /* =====================================================
       18. RECOVERY MODAL
    ===================================================== */

    const initializeRecoveryModal = () => {
        if (
            !elements.recoveryModal ||
            !elements.openRecovery
        ) {
            return;
        }

        elements.openRecovery.addEventListener(
            "click",
            () => {
                openOverlay(
                    elements.recoveryModal,
                    elements.closeRecovery
                );
playSound("submit");
playTone({
    frequency: 720,
    endFrequency: 840,
    duration: 0.09,
    volume: 0.01,
    type: "sine"
});
            }
        );


        if (elements.closeRecovery) {
            elements.closeRecovery.addEventListener(
                "click",
                () => {
                    closeOverlay(
                        elements.recoveryModal
                    );
                }
            );
        }


        if (elements.acknowledgeRecovery) {
            elements.acknowledgeRecovery.addEventListener(
                "click",
                () => {
                    closeOverlay(
                        elements.recoveryModal
                    );

                    showToast({
                        title: "Recovery Information",
                        message:
                            "Contact the system administrator for account recovery assistance.",
                        type: "information",
                        icon:
                            "fa-solid fa-user-lock"
                    });
                }
            );
        }


        elements.recoveryModal
            .querySelectorAll("[data-close-modal]")
            .forEach((backdrop) => {
                backdrop.addEventListener(
                    "click",
                    () => {
                        closeOverlay(
                            elements.recoveryModal
                        );
                    }
                );
            });
    };


    /* =====================================================
       19. BIOMETRIC DEMONSTRATION
    ===================================================== */

    const resetBiometricInterface = () => {
        window.clearInterval(
            state.biometricTimer
        );

        state.biometricTimer = null;

        if (elements.biometricProgress) {
            elements.biometricProgress.style.width =
                "0%";
        }

        if (elements.biometricPercentage) {
            elements.biometricPercentage.textContent =
                "0%";
        }

        if (elements.biometricStatus) {
            elements.biometricStatus.textContent =
                "Place authorized identity on the scanner";
        }
    };


    const closeBiometricOverlay = () => {
        resetBiometricInterface();

        closeOverlay(
            elements.biometricOverlay
        );
    };


    const runBiometricDemonstration = () => {
        if (
            !elements.biometricProgress ||
            !elements.biometricPercentage ||
            !elements.biometricStatus
        ) {
            return;
        }

        resetBiometricInterface();

        let progress = 0;
let lastSoundStage = -1;
        const intervalTime =
            state.reducedMotion ? 25 : 90;

        state.biometricTimer =
            window.setInterval(() => {
                progress += randomBetween(1.8, 5.2);
                progress = Math.min(progress, 100);

                const roundedProgress =
                    Math.floor(progress);

                elements.biometricProgress.style.width =
                    `${roundedProgress}%`;

                elements.biometricPercentage.textContent =
                    `${roundedProgress}%`;

                if (roundedProgress < 24) {
                    elements.biometricStatus.textContent =
                        "Scanning identity characteristics";
                } else if (roundedProgress < 52) {
                    elements.biometricStatus.textContent =
                        "Mapping biometric reference points";
                } else if (roundedProgress < 78) {
                    elements.biometricStatus.textContent =
                        "Comparing encrypted identity signature";
                } else if (roundedProgress < 100) {
                    elements.biometricStatus.textContent =
                        "Completing demonstration scan";
                }

                if (progress < 100) {
                    playTone({
                        frequency:
                            320 + roundedProgress * 2,
                        duration: 0.025,
                        volume: 0.008
                    });

                    return;
                }

                window.clearInterval(
                    state.biometricTimer
                );

                state.biometricTimer = null;

                elements.biometricStatus.textContent =
                    "Demonstration scan completed";

                playSuccessSequence();

                announce(
                    "Biometric demonstration completed."
                );

                window.setTimeout(() => {
                    closeBiometricOverlay();

                    showToast({
                        title: "Biometric Demonstration Complete",
                        message:
                            "This scanner is a visual demonstration. Use your username and password for actual authentication.",
                        type: "success",
                        icon:
                            "fa-solid fa-fingerprint",
                        duration: 6500
                    });
                }, state.reducedMotion ? 150 : 1050);
            }, intervalTime);
    };


    const initializeBiometricInterface = () => {
        if (
            !elements.biometricButton ||
            !elements.biometricOverlay
        ) {
            return;
        }

        elements.biometricButton.addEventListener(
            "click",
            () => {
                openOverlay(
                    elements.biometricOverlay,
                    elements.closeBiometric
                );

                runBiometricDemonstration();
            }
        );


        if (elements.closeBiometric) {
            elements.closeBiometric.addEventListener(
                "click",
                closeBiometricOverlay
            );
        }


        elements.biometricOverlay.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    elements.biometricOverlay
                ) {
                    closeBiometricOverlay();
                }
            }
        );
    };


    /* =====================================================
       20. GLOBAL KEYBOARD CONTROLS
    ===================================================== */

    const initializeKeyboardControls = () => {
        document.addEventListener(
            "keydown",
            (event) => {
                if (event.key !== "Escape") {
                    return;
                }

                if (
                    elements.recoveryModal &&
                    elements.recoveryModal.getAttribute(
                        "aria-hidden"
                    ) === "false"
                ) {
                    closeOverlay(
                        elements.recoveryModal
                    );

                    return;
                }

                if (
                    elements.biometricOverlay &&
                    elements.biometricOverlay.getAttribute(
                        "aria-hidden"
                    ) === "false"
                ) {
                    closeBiometricOverlay();
                }
            }
        );
    };

/* =====================================================
   21. PROFESSIONAL INTERACTION SOUND BINDINGS
===================================================== */

const initializeInputSounds = () => {

    /* -------------------------------------------------
       Hover sounds
    ------------------------------------------------- */

    const hoverElements =
        document.querySelectorAll(
            [
                ".login-button",
                ".biometric-button",
                ".password-toggle",
                ".recovery-link",
                ".signup-link",
                ".sound-control",
                ".modal-action-button",
                ".system-alert__close",
                ".toast__close"
            ].join(",")
        );


    if (state.finePointer) {
        hoverElements.forEach((element) => {
            element.addEventListener(
                "pointerenter",
                () => {
                    playSound("hover");
                }
            );
        });
    }


    /* -------------------------------------------------
       Input focus and keyboard feedback
    ------------------------------------------------- */

    document
        .querySelectorAll(".form-field__input")
        .forEach((input) => {

            input.addEventListener(
                "focus",
                () => {
                    playSound("focus");
                }
            );


            input.addEventListener(
                "keydown",
                (event) => {
                    /*
                        Ignore modifier keys and navigation keys.
                    */

                    const ignoredKeys = [
                        "Shift",
                        "Control",
                        "Alt",
                        "Meta",
                        "CapsLock",
                        "Tab",
                        "Escape",
                        "ArrowUp",
                        "ArrowDown",
                        "ArrowLeft",
                        "ArrowRight",
                        "Home",
                        "End",
                        "PageUp",
                        "PageDown"
                    ];

                    if (
                        ignoredKeys.includes(event.key)
                    ) {
                        return;
                    }

                    playSound("key");
                }
            );
        });


    /* -------------------------------------------------
       Checkbox feedback
    ------------------------------------------------- */

    document
        .querySelectorAll(
            ".secure-checkbox input"
        )
        .forEach((checkbox) => {

            checkbox.addEventListener(
                "change",
                () => {
                    playSound(
                        checkbox.checked
                            ? "toggleOn"
                            : "toggleOff"
                    );
                }
            );
        });


    /* -------------------------------------------------
       General clickable controls
    ------------------------------------------------- */

    document.addEventListener(
        "click",
        (event) => {
            const clickedElement =
                event.target.closest(
                    [
                        ".signup-link",
                        ".modal-action-button",
                        ".system-alert__close",
                        ".toast__close"
                    ].join(",")
                );

            if (!clickedElement) {
                return;
            }

            playSound("click");
        }
    );
};


    /* =====================================================
       22. DYNAMIC PAGE TITLE
    ===================================================== */

    const initializeVisibilityBehaviour = () => {
        const normalTitle =
            document.title;

        document.addEventListener(
            "visibilitychange",
            () => {
                if (document.hidden) {
                    document.title =
                        "Security Session Paused | AI Threat Detection";
                } else {
                    document.title =
                        normalTitle;
                }
            }
        );
    };


    /* =====================================================
       23. REDUCED MOTION CHANGES
    ===================================================== */

    const initializePreferenceListeners = () => {
        reducedMotionQuery.addEventListener?.(
            "change",
            (event) => {
                state.reducedMotion =
                    event.matches;
            }
        );

        finePointerQuery.addEventListener?.(
            "change",
            (event) => {
                state.finePointer =
                    event.matches;
            }
        );
    };


    /* =====================================================
       24. INITIALIZATION
    ===================================================== */

    const initializeApplication = () => {
        initializePreloader();
        initializeSystemInformation();

        initializeSoundControl();
        initializeCursorLight();
        initializeCardTilt();

        initializeBackgroundCanvases();
        initializeCounters();

        initializeLiveValidation();
        initializePasswordToggle();
        initializeLoginForm();

        initializeFlashAlerts();
        initializeRecoveryModal();
        initializeBiometricInterface();

        initializeKeyboardControls();
        initializeInputSounds();
        initializeVisibilityBehaviour();
        initializePreferenceListeners();
    };


    /*
     Because the script uses the defer attribute, the document
     will normally already be parsed. The check below also makes
     the file safe if defer is accidentally removed.
    */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeApplication,
            {
                once: true
            }
        );
    } else {
        initializeApplication();
    }

})();