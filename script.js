/* =========================================================
   STUDY NEST
   Complete Offline Study Application
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const CONFIG = {

    DB_NAME: "StudyNestOfflineDB",

    DB_VERSION: 1,

    AI_URL: "http://127.0.0.1:11434/api/chat",

    /*
       Change this to the local Ollama model you install.

       Examples:
       qwen2.5:3b
       qwen2.5:1.5b
       llama3.2:3b
    */
    AI_MODEL: "qwen2.5:3b",

    MAX_CONTEXT_CHARS: 24000

};


/* =========================================================
   STATE
   ========================================================= */

const state = {

    page: "dashboardPage",

    resources: [],

    reminders: [],

    timetable: [],

    chat: [],

    resourceFilter: "all",

    librarySubject: "all",

    resourceType: "note",

    resourceSource: "local",

    selectedFile: null,

    aiBusy: false,

    db: null

};


/* =========================================================
   DOM
   ========================================================= */

const $ = id => document.getElementById(id);

const $$ = selector =>
    Array.from(document.querySelectorAll(selector));


/* =========================================================
   DATABASE
   ========================================================= */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            CONFIG.DB_NAME,
            CONFIG.DB_VERSION
        );

        request.onupgradeneeded = event => {

            const db = event.target.result;

            if (!db.objectStoreNames.contains("resources")) {

                db.createObjectStore(
                    "resources",
                    {
                        keyPath: "id"
                    }
                );

            }

            if (!db.objectStoreNames.contains("reminders")) {

                db.createObjectStore(
                    "reminders",
                    {
                        keyPath: "id"
                    }
                );

            }

            if (!db.objectStoreNames.contains("timetable")) {

                db.createObjectStore(
                    "timetable",
                    {
                        keyPath: "id"
                    }
                );

            }

        };

        request.onsuccess = event => {

            state.db = event.target.result;

            resolve(state.db);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}


function dbPut(store, item) {

    return new Promise((resolve, reject) => {

        const transaction =
            state.db.transaction(store, "readwrite");

        const objectStore =
            transaction.objectStore(store);

        const request =
            objectStore.put(item);

        request.onsuccess = () => resolve();

        request.onerror = () => reject(request.error);

    });

}


function dbGetAll(store) {

    return new Promise((resolve, reject) => {

        const transaction =
            state.db.transaction(store, "readonly");

        const objectStore =
            transaction.objectStore(store);

        const request =
            objectStore.getAll();

        request.onsuccess = () =>
            resolve(request.result || []);

        request.onerror = () =>
            reject(request.error);

    });

}


function dbDelete(store, id) {

    return new Promise((resolve, reject) => {

        const transaction =
            state.db.transaction(store, "readwrite");

        const request =
            transaction.objectStore(store).delete(id);

        request.onsuccess = () => resolve();

        request.onerror = () => reject(request.error);

    });

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function init() {

    try {

        await openDatabase();

        await loadEverything();

        createBuiltInResources();

        bindEvents();

        renderEverything();

        updateConnection();

    } catch (error) {

        console.error(error);

        alert(
            "Study Nest could not initialize correctly. " +
            "Please open the browser console for details."
        );

    }

}


async function loadEverything() {

    state.resources =
        await dbGetAll("resources");

    state.reminders =
        await dbGetAll("reminders");

    state.timetable =
        await dbGetAll("timetable");

    try {

        state.chat =
            JSON.parse(
                localStorage.getItem("studynest_chat") || "[]"
            );

    } catch {

        state.chat = [];

    }

}


/* =========================================================
   BUILT-IN RESOURCES
   ========================================================= */

function createBuiltInResources() {

    if (localStorage.getItem("studynest_builtin_v1")) {

        return;

    }

    const builtIns = [

        {
            id: "builtin-english-nouns",
            name: "English Grammar — Nouns",
            subject: "English",
            type: "note",
            builtIn: true,
            description: "Important noun definitions and examples.",
            content: `
NOUN

A noun is a word used to name a person, place, animal, thing, or idea.

Examples:
Person: Ali, teacher, doctor
Place: school, Pakistan, market
Animal: cat, horse, bird
Thing: book, computer, table
Idea: honesty, happiness, freedom

COMMON NOUN:
A general name for a person, place, animal or thing.

Examples:
boy, city, school, teacher

PROPER NOUN:
The special name of a particular person, place or thing.

Examples:
Ali, Pakistan, Islamabad, Monday

COUNTABLE NOUN:
A noun that can be counted.

Examples:
book, apple, student

UNCOUNTABLE NOUN:
A noun that is normally not counted individually.

Examples:
water, milk, information

SINGULAR NOUN:
Names one person, place, animal or thing.

Example:
book

PLURAL NOUN:
Names more than one.

Example:
books

IMPORTANT:
A proper noun normally begins with a capital letter.
            `.trim()
        },

        {
            id: "builtin-english-tenses",
            name: "English Grammar — Tenses",
            subject: "English",
            type: "note",
            builtIn: true,
            description: "Basic English tenses with examples.",
            content: `
ENGLISH TENSES

Tense tells us about the time of an action.

PRESENT SIMPLE:
Used for habits, routines and general facts.

Example:
I study every day.

PRESENT CONTINUOUS:
Used for an action happening now.

Example:
I am studying now.

PAST SIMPLE:
Used for an action completed in the past.

Example:
I studied yesterday.

PAST CONTINUOUS:
Used for an action that was continuing at a particular time in the past.

Example:
I was studying at 8 PM.

FUTURE SIMPLE:
Used for an action expected in the future.

Example:
I will study tomorrow.

IMPORTANT:
Always look at the time and meaning of the sentence when identifying a tense.
            `.trim()
        },

        {
            id: "builtin-math-algebra",
            name: "Mathematics — Basic Algebra",
            subject: "Mathematics",
            type: "note",
            builtIn: true,
            description: "Variables, equations and basic algebra.",
            content: `
BASIC ALGEBRA

A variable is a letter or symbol used to represent an unknown value.

Example:
x + 5 = 10

Here x is the variable.

To find x:
x = 10 - 5
x = 5

COEFFICIENT:
A number multiplied by a variable.

Example:
5x

The coefficient is 5.

CONSTANT:
A number without a variable.

Example:
x + 7

The constant is 7.

LINEAR EQUATION:
An equation where the highest power of the variable is 1.

Example:
2x + 4 = 10

Solution:
2x = 6
x = 3

ALGEBRAIC EXPRESSION:
A combination of numbers, variables and mathematical operations.

Example:
3x + 2
            `.trim()
        },

        {
            id: "builtin-math-fractions",
            name: "Mathematics — Fractions",
            subject: "Mathematics",
            type: "note",
            builtIn: true,
            description: "Numerator, denominator and fraction operations.",
            content: `
FRACTIONS

A fraction represents a part of a whole.

Example:
3/4

3 is the numerator.
4 is the denominator.

PROPER FRACTION:
Numerator is smaller than denominator.

Example:
2/5

IMPROPER FRACTION:
Numerator is equal to or greater than denominator.

Example:
7/4

ADDING FRACTIONS:
For fractions with the same denominator, add the numerators.

Example:
2/7 + 3/7 = 5/7

EQUIVALENT FRACTIONS:
Fractions that have the same value.

Example:
1/2 = 2/4 = 3/6
            `.trim()
        },

        {
            id: "builtin-chem-periodic",
            name: "Chemistry — Periodic Table",
            subject: "Chemistry",
            type: "note",
            builtIn: true,
            description: "Basic periodic table concepts.",
            content: `
PERIODIC TABLE

The periodic table organizes chemical elements according to their atomic number and repeating chemical properties.

ELEMENT:
A pure substance made of atoms with the same atomic number.

Examples:
Hydrogen, Oxygen, Carbon, Iron

ATOMIC NUMBER:
The number of protons in the nucleus of an atom.

SYMBOL:
A short representation of an element.

Examples:
H = Hydrogen
O = Oxygen
C = Carbon
Na = Sodium
Cl = Chlorine

GROUP:
A vertical column in the periodic table.

PERIOD:
A horizontal row in the periodic table.

METALS:
Many metals are shiny, good conductors and can be shaped.

NON-METALS:
Non-metals generally have different physical properties from metals and are often poor electrical conductors.

NOBLE GASES:
Elements in Group 18, such as helium, neon and argon.
            `.trim()
        },

        {
            id: "builtin-chem-atoms",
            name: "Chemistry — Atoms",
            subject: "Chemistry",
            type: "note",
            builtIn: true,
            description: "Protons, neutrons and electrons.",
            content: `
ATOMS

An atom is the basic unit of an element.

An atom contains:

PROTON:
A positively charged particle found in the nucleus.

NEUTRON:
A particle with no electrical charge found in the nucleus.

ELECTRON:
A negatively charged particle found around the nucleus.

NUCLEUS:
The central part of an atom containing protons and neutrons.

ATOMIC NUMBER:
Number of protons.

MASS NUMBER:
Number of protons plus number of neutrons.

For a neutral atom:
Number of protons = number of electrons.
            `.trim()
        }

    ];

    for (const resource of builtIns) {

        dbPut("resources", resource)
            .then(() => {

                if (!state.resources.some(r => r.id === resource.id)) {

                    state.resources.push(resource);

                }

                renderEverything();

            });

    }

    localStorage.setItem(
        "studynest_builtin_v1",
        "true"
    );

}


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {


    /* Navigation */

    $$(".nav-btn[data-page]").forEach(button => {

        button.addEventListener("click", () => {

            navigate(button.dataset.page);

        });

    });


    $$("[data-page-target]").forEach(button => {

        button.addEventListener("click", () => {

            navigate(button.dataset.pageTarget);

        });

    });


    /* Mobile menu */

    $("mobileMenuBtn").addEventListener(
        "click",
        () => {

            $("sidebar").classList.toggle("open");

        }
    );


    /* Theme */

    $("themeBtn").addEventListener(
        "click",
        toggleTheme
    );


    /* Search */

    $("resourceSearch").addEventListener(
        "input",
        renderResources
    );

    $("librarySearch").addEventListener(
        "input",
        renderLibrary
    );


    /* Resource filters */

    $$("[data-resource-filter]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                state.resourceFilter =
                    button.dataset.resourceFilter;

                $$(".filter-btn").forEach(btn =>
                    btn.classList.remove("active")
                );

                button.classList.add("active");

                renderResources();

            }
        );

    });


    /* Library subjects */

    $$(".subject-tab").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                state.librarySubject =
                    button.dataset.subject;

                $$(".subject-tab").forEach(btn =>
                    btn.classList.remove("active")
                );

                button.classList.add("active");

                renderLibrary();

            }
        );

    });


    /* Add resource source */

    $("localResourceOption").addEventListener(
        "click",
        () => {

            state.resourceSource = "local";

            $("localResourceOption")
                .classList.add("active");

            $("onlineResourceOption")
                .classList.remove("active");

            updateResourceForm();

        }
    );


    $("onlineResourceOption").addEventListener(
        "click",
        () => {

            state.resourceSource = "online";

            $("onlineResourceOption")
                .classList.add("active");

            $("localResourceOption")
                .classList.remove("active");

            state.resourceType = "link";

            $$(".type-tab").forEach(btn =>
                btn.classList.remove("active")
            );

            document
                .querySelector('[data-resource-type="link"]')
                .classList.add("active");

            updateResourceForm();

        }
    );


    /* Resource type */

    $$("[data-resource-type]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                state.resourceType =
                    button.dataset.resourceType;

                $$(".type-tab").forEach(btn =>
                    btn.classList.remove("active")
                );

                button.classList.add("active");

                updateResourceForm();

            }
        );

    });


    /* File */

    $("resourceFile").addEventListener(
        "change",
        handleFileSelection
    );


    /* Save resource */

    $("saveResourceBtn").addEventListener(
        "click",
        saveResource
    );


    $("cancelResourceBtn").addEventListener(
        "click",
        () => {

            clearResourceForm();

            navigate("resourcesPage");

        }
    );


    /* AI */

    

    $("clearChatBtn").addEventListener(
        "click",
        clearChat
    );
    $("aiSettingsBtn").addEventListener(
        "click",
        showAISettings
    );


    $$(".suggestion-btn").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                $("aiQuestion").value =
                    button.dataset.question;
            }
        );

    });


    /* Timetable */

    $("addTimetableBtn").addEventListener(
        "click",
        addTimetableSlot
    );


    /* Reminders */

    $("addReminderBtn").addEventListener(
        "click",
        addReminder
    );


    /* Notifications */

    $("notificationBtn").addEventListener(
        "click",
        () => {

            navigate("remindersPage");

        }
    );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function navigate(page) {

    state.page = page;

    $$(".page").forEach(section => {

        section.classList.remove("active");

    });

    const target = $(page);

    if (target) {

        target.classList.add("active");

    }


    $$(".nav-btn[data-page]").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === page
        );

    });


    const titles = {

        dashboardPage: [
            "Dashboard",
            "Your learning space"
        ],

        resourcesPage: [
            "Resources",
            "Your saved study material"
        ],

        aiTutorPage: [
            "AI Tutor",
            "Your local study assistant"
        ],

        libraryPage: [
            "Study Library",
            "Subjects and learning material"
        ],

        timetablePage: [
            "Timetable",
            "Organize your study time"
        ],

        remindersPage: [
            "Reminders",
            "Stay on track"
        ],

        addResourcePage: [
            "Add Resource",
            "Build your personal knowledge base"
        ]

    };

    const title = titles[page] || titles.dashboardPage;

    $("pageTitle").textContent = title[0];

    $("pageSubtitle").textContent = title[1];

    $("sidebar").classList.remove("open");

    renderEverything();

}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "studynest_dark",
        document.body.classList.contains("dark")
            ? "1"
            : "0"
    );

}


function loadTheme() {

    if (
        localStorage.getItem("studynest_dark") === "1"
    ) {

        document.body.classList.add("dark");

    }

}


/* =========================================================
   CONNECTION
   ========================================================= */

function updateConnection() {

    const online = navigator.onLine;

    $("onlineStatus").textContent =
        online ? "Internet Available" : "Offline";

    $("onlineDot").style.background =
        online ? "var(--green)" : "var(--orange)";

    $("connectionText").textContent =
        online
            ? "Local + internet available"
            : "Local storage active";

}


/* =========================================================
   RESOURCE FORM
   ========================================================= */

function updateResourceForm() {

    const type = state.resourceType;

    $("contentField").classList.toggle(
        "hidden",
        !(type === "note" || type === "link")
    );

    $("fileField").classList.toggle(
        "hidden",
        !(type === "pdf" || type === "video")
    );

    $("urlField").classList.toggle(
        "hidden",
        type !== "link"
    );


    if (type === "link") {

        $("contentField").classList.add("hidden");

    }


    if (state.resourceSource === "online") {

        $("fileField").classList.add("hidden");

        $("urlField").classList.remove("hidden");

    }

}


/* =========================================================
   FILE SELECTION
   ========================================================= */

function handleFileSelection(event) {

    const file =
        event.target.files[0];

    if (!file) {

        state.selectedFile = null;

        $("selectedFileName").textContent =
            "PDF, video or text file";

        return;

    }

    state.selectedFile = file;

    $("selectedFileName").textContent =
        `${file.name} — ${formatBytes(file.size)}`;

}


/* =========================================================
   SAVE RESOURCE
   ========================================================= */

async function saveResource() {

    const name =
        $("resourceName").value.trim();

    const subject =
        $("resourceSubject").value;

    const description =
        $("resourceDescription").value.trim();

    const content =
        $("resourceContent").value.trim();

    const url =
        $("resourceURL").value.trim();


    if (!name) {

        alert("Please enter a resource name.");

        return;

    }


    $("saveProgress").textContent =
        "Preparing resource...";


    const resource = {

        id: crypto.randomUUID(),

        name,

        subject,

        description,

        type: state.resourceType,

        createdAt: Date.now(),

        builtIn: false,

        source:
            state.resourceSource

    };


    try {


        /* NOTE */

        if (state.resourceType === "note") {

            if (!content) {

                alert("Please enter note content.");

                $("saveProgress").textContent = "";

                return;

            }

            resource.content = content;

        }


        /* LINK */

        if (state.resourceType === "link") {

            if (!url) {

                alert("Please enter a URL.");

                $("saveProgress").textContent = "";

                return;

            }

            resource.url = url;

            resource.content =
                content || "";

        }


        /* PDF / FILE */

        if (
            state.resourceType === "pdf" ||
            state.resourceType === "video"
        ) {

            const file =
                state.selectedFile;

            if (!file) {

                alert("Please choose a file.");

                $("saveProgress").textContent = "";

                return;

            }


            resource.fileName =
                file.name;

            resource.fileType =
                file.type;

            resource.fileSize =
                file.size;


            /*
               Store the actual file in IndexedDB.
               This means videos and PDFs remain local.
            */

            resource.fileData =
                await file.arrayBuffer();


            /* PDF TEXT EXTRACTION */

            if (
                state.resourceType === "pdf" ||
                file.type === "application/pdf" ||
                file.name.toLowerCase().endsWith(".pdf")
            ) {

                $("saveProgress").textContent =
                    "Reading PDF pages...";

                const extracted =
                    await extractPDFText(file);

                resource.content =
                    extracted.text;

                resource.pages =
                    extracted.pages;

                resource.pageCount =
                    extracted.pageCount;

                resource.contentSource =
                    extracted.text
                        ? "pdf-text-extracted"
                        : "image-only-pdf";

            }


            /* TEXT FILE */

            else if (
                file.type.startsWith("text/") ||
                /\.(txt|md|csv|json)$/i.test(file.name)
            ) {

                $("saveProgress").textContent =
                    "Reading text file...";

                resource.content =
                    await file.text();

                resource.contentSource =
                    "text-file";

            }


            /* VIDEO */

            else if (
                state.resourceType === "video" ||
                file.type.startsWith("video/")
            ) {

                resource.contentSource =
                    "video-file";

            }

        }


        await dbPut(
            "resources",
            resource
        );


        state.resources.push(resource);


        $("saveProgress").textContent =
            "✓ Resource saved successfully.";


        clearResourceForm();


        setTimeout(() => {

            $("saveProgress").textContent = "";

            navigate("resourcesPage");

        }, 600);


    } catch (error) {

        console.error(error);

        $("saveProgress").textContent = "";

        alert(
            "Could not save this resource: " +
            error.message
        );

    }

}


/* =========================================================
   PDF EXTRACTION
   ========================================================= */

async function extractPDFText(file) {

    if (!window.pdfjsLib) {

        throw new Error(
            "PDF.js was not found. Put pdf.min.js and pdf.worker.min.js inside the libs folder."
        );

    }


    const buffer =
        await file.arrayBuffer();


    const pdf =
        await pdfjsLib.getDocument({
            data: buffer
        }).promise;


    const pages = [];

    let fullText = "";


    for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
    ) {

        const page =
            await pdf.getPage(pageNumber);


        const textContent =
            await page.getTextContent();


        const pageText =
            textContent.items
                .map(item => item.str)
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();


        pages.push({
            page: pageNumber,
            text: pageText
        });


        if (pageText) {

            fullText +=
                `\n\n--- Page ${pageNumber} ---\n\n` +
                pageText;

        }


        $("saveProgress").textContent =
            `Reading PDF page ${pageNumber} of ${pdf.numPages}...`;

    }


    return {

        text: fullText.trim(),

        pages,

        pageCount: pdf.numPages

    };

}


/* =========================================================
   RESOURCE OPENING
   ========================================================= */

function openResource(id) {

    const resource =
        state.resources.find(
            item => item.id === id
        );

    if (!resource) return;


    /* ONLINE LINK */

    if (
        resource.type === "link" &&
        resource.url
    ) {

        window.open(
            resource.url,
            "_blank",
            "noopener"
        );

        return;

    }


    /* VIDEO */

    if (
        resource.type === "video" &&
        resource.fileData
    ) {

        openVideoResource(resource);

        return;

    }


    /* PDF / FILE */

    if (
        resource.fileData &&
        (
            resource.type === "pdf" ||
            resource.fileType === "application/pdf"
        )
    ) {

        openPDFResource(resource);

        return;

    }


    /* TEXT */

    openReader(resource);

}


/* =========================================================
   TEXT READER
   ========================================================= */

function openReader(resource) {

    const content =
        resource.content?.trim();


    if (!content) {

        showModal(`
            <button class="modal-close" onclick="closeModal()">×</button>

            <h2>${escapeHTML(resource.name)}</h2>

            <p style="margin-top:20px">
                This resource does not contain readable text.
            </p>
        `);

        return;

    }


    showModal(`

        <button class="modal-close"
            onclick="closeModal()">×</button>

        <span class="eyebrow">
            ${escapeHTML(resource.subject)}
        </span>

        <h2 style="margin-top:5px">
            ${escapeHTML(resource.name)}
        </h2>

        <p>
            ${escapeHTML(resource.description || "")}
        </p>

        <div class="reader-content">
            ${escapeHTML(content)}
        </div>

    `);

}


/* =========================================================
   PDF OPEN
   ========================================================= */

function openPDFResource(resource) {

    const blob =
        new Blob(
            [resource.fileData],
            {
                type:
                    resource.fileType ||
                    "application/pdf"
            }
        );


    const url =
        URL.createObjectURL(blob);


    showModal(`

        <button class="modal-close"
            onclick="closeModal(); URL.window.URL.revokeObjectURL('${url}')">
            ×
        </button>

        <span class="eyebrow">
            PDF DOCUMENT
        </span>

        <h2 style="margin-top:5px">
            ${escapeHTML(resource.name)}
        </h2>

        <p>
            ${resource.pageCount || 0} pages
            ${
                resource.content
                    ? " • Text extracted successfully"
                    : " • No selectable text found"
            }
        </p>

        <iframe
            src="${url}"
            style="
                width:100%;
                height:500px;
                border:0;
                border-radius:14px;
                margin-top:18px;
                background:white;
            "
        ></iframe>

        ${
            resource.content
                ? `
                    <button
                        class="primary-btn"
                        style="margin-top:15px"
                        onclick="openReaderById('${resource.id}')">
                        📖 Read Extracted Text
                    </button>
                  `
                : `
                    <p style="margin-top:15px">
                        This appears to be an image/scanned PDF.
                        Text extraction requires OCR.
                    </p>
                  `
        }

    `);

}


/* =========================================================
   VIDEO OPEN
   ========================================================= */

function openVideoResource(resource) {

    const blob =
        new Blob(
            [resource.fileData],
            {
                type:
                    resource.fileType ||
                    "video/mp4"
            }
        );


    const url =
        URL.createObjectURL(blob);


    showModal(`

        <button class="modal-close"
            onclick="closeModal(); URL.window.URL.revokeObjectURL('${url}')">
            ×
        </button>

        <span class="eyebrow">
            VIDEO LESSON
        </span>

        <h2 style="margin-top:5px">
            ${escapeHTML(resource.name)}
        </h2>

        <video
            class="video-player"
            controls
            playsinline
            src="${url}">
        </video>

        <p style="margin-top:12px">
            ${escapeHTML(resource.description || "")}
        </p>

    `);

}


/* =========================================================
   RESOURCE BUTTON HELPERS
   ========================================================= */

function openReaderById(id) {

    closeModal();

    openReader(
        state.resources.find(
            r => r.id === id
        )
    );

}


async function deleteResource(id) {

    const resource =
        state.resources.find(
            r => r.id === id
        );

    if (!resource) return;


    if (
        !confirm(
            `Delete "${resource.name}"?`
        )
    ) return;


    await dbDelete(
        "resources",
        id
    );


    state.resources =
        state.resources.filter(
            r => r.id !== id
        );


    renderEverything();

}


/* =========================================================
   RESOURCE DOWNLOAD
   ========================================================= */

function downloadResource(id) {

    const resource =
        state.resources.find(
            r => r.id === id
        );

    if (!resource) return;


    if (resource.fileData) {

        const blob =
            new Blob(
                [resource.fileData],
                {
                    type:
                        resource.fileType ||
                        "application/octet-stream"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const a =
            document.createElement("a");

        a.href = url;

        a.download =
            resource.fileName ||
            resource.name;

        a.click();

        setTimeout(
            () => URL.window.URL.revokeObjectURL(url),
            1000
        );

        return;

    }


    const blob =
        new Blob(
            [resource.content || ""],
            {
                type: "text/plain"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        `${resource.name}.txt`;

    a.click();

    setTimeout(
        () => URL.window.URL.revokeObjectURL(url),
        1000
    );

}


/* =========================================================
   RENDER RESOURCES
   ========================================================= */

function renderResources() {

    const grid =
        $("resourceGrid");

    const search =
        $("resourceSearch")
            .value
            .toLowerCase()
            .trim();


    let resources =
        [...state.resources];


    if (state.resourceFilter !== "all") {

        resources =
            resources.filter(
                resource =>
                    resource.type ===
                    state.resourceFilter
            );

    }


    if (search) {

        resources =
            resources.filter(resource =>

                `${resource.name}
                 ${resource.description}
                 ${resource.subject}
                 ${resource.content || ""}`
                    .toLowerCase()
                    .includes(search)

            );

    }


    grid.innerHTML = "";


    $("resourceEmpty")
        .classList.toggle(
            "hidden",
            resources.length > 0
        );


    resources.forEach(resource => {

        grid.appendChild(
            createResourceCard(resource)
        );

    });

}


function createResourceCard(resource) {

    const card =
        document.createElement("div");

    card.className =
        "resource-card";


    const icon =
        resource.type === "pdf"
            ? "📄"
            : resource.type === "video"
                ? "🎥"
                : resource.type === "link"
                    ? "🔗"
                    : "📝";


    card.innerHTML = `

        <div class="resource-icon">
            ${icon}
        </div>

        <h3>
            ${escapeHTML(resource.name)}
        </h3>

        <p>
            ${escapeHTML(
                resource.description ||
                resource.content?.slice(0,150) ||
                "Study resource"
            )}
        </p>

        <div class="resource-meta">

            <span>
                ${escapeHTML(resource.subject || "General")}
            </span>

            <span>
                ${resource.builtIn ? "Built-in" : "Local"}
            </span>

        </div>

        <div class="card-actions">

            <button onclick="openResource('${resource.id}')">
                Open
            </button>

            ${
                resource.fileData || resource.content
                    ? `
                        <button onclick="downloadResource('${resource.id}')">
                            ↓
                        </button>
                      `
                    : ""
            }

            ${
                !resource.builtIn
                    ? `
                        <button
                            class="delete-action"
                            onclick="deleteResource('${resource.id}')">
                            🗑
                        </button>
                      `
                    : ""
            }

        </div>

    `;

    return card;

}


/* =========================================================
   LIBRARY
   ========================================================= */

function renderLibrary() {

    const grid =
        $("libraryGrid");

    const search =
        $("librarySearch")
            .value
            .toLowerCase()
            .trim();


    let resources =
        state.resources.filter(
            resource =>
                resource.type === "note" ||
                resource.type === "pdf" ||
                resource.type === "video"
        );


    if (state.librarySubject !== "all") {

        resources =
            resources.filter(
                resource =>
                    resource.subject ===
                    state.librarySubject
            );

    }


    if (search) {

        resources =
            resources.filter(
                resource =>
                    `${resource.name}
                     ${resource.description}
                     ${resource.content || ""}`
                        .toLowerCase()
                        .includes(search)
            );

    }


    $("libraryCount").textContent =
        resources.length;


    grid.innerHTML = "";


    resources.forEach(resource => {

        const card =
            document.createElement("div");

        card.className =
            "library-card";


        const icon =
            resource.type === "pdf"
                ? "📄"
                : resource.type === "video"
                    ? "🎥"
                    : "📘";


        card.innerHTML = `

            <div class="resource-icon">
                ${icon}
            </div>

            <h3>
                ${escapeHTML(resource.name)}
            </h3>

            <p>
                ${escapeHTML(
                    resource.description ||
                    "Study material"
                )}
            </p>

            <div class="resource-meta">
                <span>
                    ${escapeHTML(resource.subject)}
                </span>
                <span>
                    ${resource.type.toUpperCase()}
                </span>
            </div>

            <div class="card-actions">

                <button
                    onclick="openResource('${resource.id}')">
                    Open
                </button>

                <button
                    onclick="askAboutResource('${resource.id}')">
                    ✦ AI
                </button>

            </div>

        `;

        grid.appendChild(card);

    });

}


/* =========================================================
   ASK ABOUT RESOURCE
   ========================================================= */

function askAboutResource(id) {

    const resource =
        state.resources.find(
            r => r.id === id
        );

    if (!resource) return;


    navigate("aiTutorPage");


    $("aiQuestion").value =
        `Explain "${resource.name}" to me in simple words.`;


    askAI();

}


/* =========================================================
   AI CONTEXT
   ========================================================= */

function buildResourceContext(question) {

    const q =
        question.toLowerCase();


    const words =
        q
            .replace(/[^\w\s]/g, " ")
            .split(/\s+/)
            .filter(word => word.length > 2);


    const scored =
        state.resources
            .filter(resource =>
                resource.content &&
                resource.content.trim()
            )
            .map(resource => {

                const text =
                    `${resource.name}
                     ${resource.subject}
                     ${resource.description}
                     ${resource.content}`
                        .toLowerCase();

                let score = 0;

                for (const word of words) {

                    if (text.includes(word)) {

                        score++;

                    }

                }

                return {
                    resource,
                    score
                };

            })
            .sort(
                (a,b) =>
                    b.score - a.score
            );


    const selected =
        scored
            .filter(item => item.score > 0)
            .slice(0, 5);


    let context = "";


    for (const item of selected) {

        context += `

RESOURCE:
${item.resource.name}

SUBJECT:
${item.resource.subject}

CONTENT:
${item.resource.content.slice(
            0,
            CONFIG.MAX_CONTEXT_CHARS
        )}

-------------------------
`;

    }


    return context;

}


/* =========================================================
   AI
   ========================================================= */


        /*
           Include recent conversation.
        */

        for (
            const message of
            state.chat.slice(-2)
        ) {

            messages.push({

                role:
                    message.role === "user"
                        ? "user"
                        : "assistant",

                content:
                    message.content

            });

        }
    state.aiBusy = false;

    saveChat();

    updateAIQuestionCount();
/* =========================================================
   CHAT
   ========================================================= */

function addChatMessage(
    role,
    content
) {

    const id =
        crypto.randomUUID();


    state.chat.push({

        id,

        role,

        content,

        createdAt: Date.now()

    });


    renderChat();


    return id;

}


function replaceChatMessage(
    id,
    content
) {

    const message =
        state.chat.find(
            item => item.id === id
        );

    if (!message) return;

    message.content = content;

    renderChat();

    saveChat();

}


function renderChat() {

    const windowEl =
        $("chatWindow");


    if (!state.chat.length) {

        windowEl.innerHTML = `

            <div class="welcome-chat">

                <div class="big-ai-icon">
                    ✦
                </div>

                <h2>
                    How can I help you study?
                </h2>

                <p>
                    Ask your tutor naturally.
                    Your saved study resources can
                    provide context to the local AI.
                </p>

            </div>

        `;

        return;

    }


    windowEl.innerHTML = "";


    state.chat.forEach(message => {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            `message ${message.role === "user" ? "user" : "ai"}`;


        wrapper.innerHTML = `

            <div class="message-avatar">
                ${message.role === "user" ? "🙂" : "✦"}
            </div>

            <div class="message-bubble">
                ${message.content === "Thinking..." ? '<span class="typing-dots"><span></span><span></span><span></span></span>' : escapeHTML(message.content)}
            </div>

        `;


        windowEl.appendChild(wrapper);

    });


    windowEl.scrollTop =
        windowEl.scrollHeight;

}


function saveChat() {

    localStorage.setItem(
        "studynest_chat",
        JSON.stringify(
            state.chat.slice(-30)
        )
    );

}


function clearChat() {

    if (
        !confirm("Clear the AI conversation?")
    ) return;

    state.chat = [];

    saveChat();

    renderChat();

}
/* =========================================================
   AI SETTINGS
   ========================================================= */

function showAISettings() {

    showModal(`

        <button
            class="modal-close"
            onclick="closeModal()">
            ×
        </button>

        <span class="eyebrow">
            LOCAL AI
        </span>

        <h2 style="margin-top:5px">
            AI Settings
        </h2>

        <p>
            Study Nest uses a local Ollama model.
            Nothing needs to be sent to a cloud AI service.
        </p>

        <div style="margin-top:20px">

            <label style="
                display:block;
                font-size:12px;
                color:var(--muted);
                font-weight:700;
            ">
                Local model
            </label>

            <input
                id="modelSetting"
                value="${escapeAttribute(CONFIG.AI_MODEL)}"
                style="
                    width:100%;
                    margin-top:7px;
                    padding:12px;
                    border:1px solid var(--border);
                    border-radius:10px;
                    background:var(--bg);
                    color:var(--text);
                "
            >

        </div>

        <div style="
            display:flex;
            gap:8px;
            margin-top:20px;
        ">

            <button
                class="primary-btn"
                onclick="saveAIModel()">
                Save
            </button>

            <button
                class="secondary-btn"
                onclick="closeModal()">
                Cancel
            </button>

        </div>

    `);

}


function saveAIModel() {

    const model =
        $("modelSetting")
            .value
            .trim();

    if (!model) return;


    CONFIG.AI_MODEL =
        model;


    localStorage.setItem(
        "studynest_ai_model",
        model
    );


    closeModal();
}


/* =========================================================
   TIMETABLE
   ========================================================= */

async function addTimetableSlot() {

    const day =
        prompt(
            "Day (Monday-Sunday):",
            "Monday"
        );

    if (!day) return;


    const time =
        prompt(
            "Time:",
            "16:00"
        );

    if (!time) return;


    const subject =
        prompt(
            "Subject:",
            "English"
        );

    if (!subject) return;


    const topic =
        prompt(
            "Topic:",
            "Grammar"
        );


    const item = {

        id: crypto.randomUUID(),

        day,

        time,

        subject,

        topic:

            topic ||
            "",

        createdAt:
            Date.now()

    };


    await dbPut(
        "timetable",
        item
    );


    state.timetable.push(item);


    renderEverything();

}


async function deleteTimetable(id) {

    await dbDelete(
        "timetable",
        id
    );


    state.timetable =
        state.timetable.filter(
            item => item.id !== id
        );


    renderEverything();

}


function renderTimetable() {

    const grid =
        $("timetableGrid");


    const mobile =
        $("mobileTimetable");


    /* Header already exists */

    grid.querySelectorAll(
        ".slot-cell"
    ).forEach(cell =>
        cell.remove()
    );


    const days = [

        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"

    ];


    /*
       Create a simple set of study rows.
    */

    const times =
        [
            "08:00",
            "10:00",
            "12:00",
            "14:00",
            "16:00",
            "18:00",
            "20:00"
        ];


    for (const time of times) {

        const timeCell =
            document.createElement("div");

        timeCell.className =
            "slot-cell";

        timeCell.innerHTML =
            `<strong>${time}</strong>`;

        grid.appendChild(timeCell);


        for (const day of days) {

            const cell =
                document.createElement("div");

            cell.className =
                "slot-cell";


            const slots =
                state.timetable.filter(
                    item =>
                        item.day.toLowerCase() ===
                        day.toLowerCase() &&
                        item.time === time
                );


            slots.forEach(slot => {

                const div =
                    document.createElement("div");

                div.className =
                    "study-slot";

                div.innerHTML = `

                    <strong>
                        ${escapeHTML(slot.subject)}
                    </strong>

                    <small>
                        ${escapeHTML(slot.topic || "")}
                    </small>

                    <span
                        onclick="deleteTimetable('${slot.id}')"
                        style="
                            float:right;
                            cursor:pointer;
                            margin-top:4px;
                        ">
                        ×
                    </span>

                `;

                cell.appendChild(div);

            });


            grid.appendChild(cell);

        }

    }


    mobile.innerHTML = "";


    for (const day of days) {

        const daySlots =
            state.timetable
                .filter(
                    item =>
                        item.day.toLowerCase() ===
                        day.toLowerCase()
                )
                .sort(
                    (a,b) =>
                        a.time.localeCompare(b.time)
                );


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "mobile-day";


        wrapper.innerHTML = `
            <div class="mobile-day-title">
                ${day}
            </div>
        `;


        if (!daySlots.length) {

            wrapper.innerHTML += `
                <div class="mobile-slot">
                    <span style="color:var(--muted)">
                        No study slot
                    </span>
                </div>
            `;

        }


        daySlots.forEach(slot => {

            wrapper.innerHTML += `

                <div class="mobile-slot">

                    <strong>
                        ${escapeHTML(slot.time)}
                    </strong>

                    <div>
                        <b>
                            ${escapeHTML(slot.subject)}
                        </b>

                        <small>
                            ${escapeHTML(slot.topic || "")}
                        </small>
                    </div>

                    <button
                        class="delete-btn"
                        onclick="deleteTimetable('${slot.id}')">
                        ×
                    </button>

                </div>

            `;

        });


        mobile.appendChild(wrapper);

    }

}


/* =========================================================
   REMINDERS
   ========================================================= */

async function addReminder() {

    const title =
        prompt(
            "Reminder:",
            "Study English"
        );

    if (!title) return;


    const date =
        prompt(
            "Date and time:",
            getLocalDateTime()
        );

    if (!date) return;


    const item = {

        id: crypto.randomUUID(),

        title,

        date,

        completed: false,

        createdAt:
            Date.now()

    };


    await dbPut(
        "reminders",
        item
    );


    state.reminders.push(item);


    renderEverything();

}


async function toggleReminder(id) {

    const reminder =
        state.reminders.find(
            item => item.id === id
        );

    if (!reminder) return;


    reminder.completed =
        !reminder.completed;


    await dbPut(
        "reminders",
        reminder
    );


    renderEverything();

}


async function deleteReminder(id) {

    await dbDelete(
        "reminders",
        id
    );


    state.reminders =
        state.reminders.filter(
            item =>
                item.id !== id
        );


    renderEverything();

}


function renderReminders() {

    const list =
        $("reminderList");


    list.innerHTML = "";


    const sorted =
        [...state.reminders]
            .sort(
                (a,b) =>
                    String(a.date)
                        .localeCompare(
                            String(b.date)
                        )
            );


    sorted.forEach(reminder => {

        const item =
            document.createElement("div");

        item.className =
            `reminder-item ${
                reminder.completed
                    ? "completed"
                    : ""
            }`;


        item.innerHTML = `

            <button
                class="reminder-check"
                onclick="toggleReminder('${reminder.id}')">
                ${reminder.completed ? "✓" : ""}
            </button>

            <div class="reminder-content">

                <div class="reminder-title">
                    ${escapeHTML(reminder.title)}
                </div>

                <div class="reminder-date">
                    ${escapeHTML(reminder.date)}
                </div>

            </div>

            <button
                class="delete-btn"
                onclick="deleteReminder('${reminder.id}')">
                🗑
            </button>

        `;


        list.appendChild(item);

    });


    if (!sorted.length) {

        list.innerHTML = `

            <div class="empty-state">

                <div>◷</div>

                <h2>No reminders</h2>

                <p>
                    Add a reminder for your next study session.
                </p>

            </div>

        `;

    }


    const today =
        new Date()
            .toISOString()
            .slice(0,10);


    const total =
        state.reminders.length;


    const todayCount =
        state.reminders.filter(
            item =>
                String(item.date)
                    .startsWith(today)
        ).length;


    const upcoming =
        state.reminders.filter(
            item =>
                !item.completed &&
                String(item.date) >= today
        ).length;


    $("totalReminders").textContent =
        total;

    $("todayReminders").textContent =
        todayCount;

    $("upcomingReminders").textContent =
        upcoming;

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

    $("dashResources").textContent =
        state.resources.length;


    $("dashReminders").textContent =
        state.reminders.filter(
            r => !r.completed
        ).length;


    $("dashQuestions").textContent =
        state.chat.filter(
            m => m.role === "user"
        ).length;


    const subjects =
        new Set(
            state.resources
                .map(r => r.subject)
                .filter(Boolean)
        );


    $("dashSubjects").textContent =
        Math.max(subjects.size, 3);


    $("aiResourceCount").textContent =
        state.resources.filter(
            r => r.content
        ).length;


    const quick =
        $("dashboardResources");


    quick.innerHTML = "";


    state.resources
        .slice(0, 4)
        .forEach(resource => {

            const card =
                document.createElement("div");

            card.className =
                "quick-card";


            card.innerHTML = `

                <div class="resource-icon">
                    ${
                        resource.type === "pdf"
                            ? "📄"
                            : resource.type === "video"
                                ? "🎥"
                                : "📘"
                    }
                </div>

                <h3>
                    ${escapeHTML(resource.name)}
                </h3>

                <p>
                    ${escapeHTML(
                        resource.description ||
                        "Study resource"
                    )}
                </p>

                <button
                    class="text-btn"
                    style="margin-top:12px"
                    onclick="openResource('${resource.id}')">
                    Open →
                </button>

            `;


            quick.appendChild(card);

        });


    if (!state.resources.length) {

        quick.innerHTML = `
            <div class="quick-card">
                <h3>Your library is ready</h3>
                <p>
                    Add your first study resource.
                </p>
            </div>
        `;

    }


    renderDashboardPlan();

}


function renderDashboardPlan() {

    const container =
        $("dashboardPlan");


    container.innerHTML = "";


    const upcoming =
        state.reminders
            .filter(
                item =>
                    !item.completed
            )
            .slice(0, 4);


    upcoming.forEach(reminder => {

        const div =
            document.createElement("div");

        div.className =
            "plan-item";


        div.innerHTML = `

            <div class="plan-time">
                ◷
            </div>

            <div>
                <strong>
                    ${escapeHTML(reminder.title)}
                </strong>

                <small>
                    ${escapeHTML(reminder.date)}
                </small>
            </div>

        `;


        container.appendChild(div);

    });


    if (!upcoming.length) {

        container.innerHTML = `

            <div class="plan-item">

                <div class="plan-time">
                    ✓
                </div>

                <div>
                    <strong>
                        No upcoming reminders
                    </strong>

                    <small>
                        Your schedule is clear.
                    </small>
                </div>

            </div>

        `;

    }

}


/* =========================================================
   FORM RESET
   ========================================================= */

function clearResourceForm() {

    $("resourceName").value = "";

    $("resourceDescription").value = "";

    $("resourceContent").value = "";

    $("resourceURL").value = "";

    $("resourceFile").value = "";

    $("selectedFileName").textContent =
        "PDF, video or text file";

    $("saveProgress").textContent = "";

    state.selectedFile = null;

    state.resourceType = "note";

    state.resourceSource = "local";


    $$(".type-tab").forEach(
        button =>
            button.classList.remove("active")
    );


    document
        .querySelector(
            '[data-resource-type="note"]'
        )
        .classList.add("active");


    $("localResourceOption")
        .classList.add("active");

    $("onlineResourceOption")
        .classList.remove("active");


    updateResourceForm();

}


/* =========================================================
   MODAL
   ========================================================= */

function showModal(html) {

    $("modalContent").innerHTML =
        html;

    $("modalOverlay")
        .classList.remove("hidden");

}


function closeModal() {

    $("modalOverlay")
        .classList.add("hidden");

    $("modalContent").innerHTML =
        "";

}


$("modalOverlay").addEventListener(
    "click",
    event => {

        if (
            event.target ===
            $("modalOverlay")
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


function formatBytes(bytes) {

    if (!bytes) return "0 B";

    const units =
        ["B","KB","MB","GB"];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    return (
        bytes /
        Math.pow(1024,index)
    ).toFixed(1)
    + " "
    + units[index];

}


function getLocalDateTime() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2,"0");

    const day =
        String(
            now.getDate()
        ).padStart(2,"0");

    const hours =
        String(
            now.getHours()
        ).padStart(2,"0");

    const minutes =
        String(
            now.getMinutes()
        ).padStart(2,"0");


    return `${year}-${month}-${day} ${hours}:${minutes}`;

}


function updateAIQuestionCount() {

    $("dashQuestions").textContent =
        state.chat.filter(
            item =>
                item.role === "user"
        ).length;

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {

    renderDashboard();

    renderResources();

    renderLibrary();

    renderTimetable();

    renderReminders();

    renderChat();

    updateResourceForm();

}


/* =========================================================
   LOAD SAVED SETTINGS
   ========================================================= */

function loadSettings() {

    const savedModel =
        localStorage.getItem(
            "studynest_ai_model"
        );


    if (savedModel) {

        CONFIG.AI_MODEL =
            savedModel;

    }

}


/* =========================================================
   START
   ========================================================= */

loadTheme();

loadSettings();

init();


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.navigate = navigate;

window.openResource = openResource;

window.openReaderById = openReaderById;

window.downloadResource = downloadResource;

window.deleteResource = deleteResource;

window.askAboutResource = askAboutResource;

window.closeModal = closeModal;

window.saveAIModel = saveAIModel;

window.toggleReminder = toggleReminder;

window.deleteReminder = deleteReminder;

window.deleteTimetable = deleteTimetable;