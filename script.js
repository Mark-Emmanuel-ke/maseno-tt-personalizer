const STORAGE_KEYS = {
    units: "units",
    savedTimetable: "saved",
    visitLogs: "site_visit_logs",
    adminPasscodeHash: "admin_passcode_hash",
    adminTimetable: "admin_uploaded_timetable"
};

const units = JSON.parse(localStorage.getItem(STORAGE_KEYS.units)) || [];
let myUnits = JSON.parse(localStorage.getItem(STORAGE_KEYS.savedTimetable)) || [];

const add = document.querySelector("#add");
const unitCode = document.querySelector("#code");
const unitName = document.querySelector("#name");
const generate = document.querySelector(".generate");
const fileInput = document.querySelector("#file");
const outputTT = document.querySelector(".output");
const outputActions = document.querySelector(".outputActions");

const adminPanel = document.querySelector("#adminPanel");
const adminStats = document.querySelector(".admin-stats");
const adminControls = document.querySelector(".admin-controls");
const adminLogs = document.querySelector(".admin-logs");

if (myUnits.length > 0) {
    generateTable(myUnits);
}

displayUnits();
trackVisit();

if (window.location.hash.toLowerCase() === "#admin") {
    openAdminWithAuth();
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeAdminPanel();
    }

    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        openAdminWithAuth();
    }
});

unitCode.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        selectUnits();
    }
});

add.addEventListener("click", selectUnits);

generate.addEventListener("click", () => {
    if (units.length <= 0) {
        alert("You have to select your registered units");
        return;
    }

    const file = fileInput.files[0];
    if (!file && !localStorage.getItem(STORAGE_KEYS.adminTimetable)) {
        alert("No source timetable found. Upload one or ask admin to upload a default timetable.");
        return;
    }

    const processWithFullTT = (fullTT) => {
        try {
            const result = buildPersonalizedTT(fullTT, units);

            myUnits = result.personalized;
            localStorage.setItem(STORAGE_KEYS.savedTimetable, JSON.stringify(myUnits));
            generateTable(myUnits);

            if (result.notFound > 0) {
                alert(`${result.notFound} unit(s) not found. Double-check unit codes and generate again.`);
            }
        } catch (error) {
            alert("Failed to generate timetable. Make sure the source file has the expected format.");
            console.error(error);
        }
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const fullTT = parseWorkbookToFullTT(data);
                processWithFullTT(fullTT);
            } catch (error) {
                alert("Failed to read the selected timetable file.");
                console.error(error);
            }
        };

        reader.readAsArrayBuffer(file);
        return;
    };

    const storedAdminTT = JSON.parse(localStorage.getItem(STORAGE_KEYS.adminTimetable) || "{}");
    processWithFullTT(Array.isArray(storedAdminTT.fullTT) ? storedAdminTT.fullTT : []);
});

function selectUnits() {
    const code = unitCode.value.trim().toUpperCase();
    const name = unitName.value.trim();

    if (!code) {
        alert("Unit Code Cannot be empty");
        return;
    }

    const alreadyAdded = units.some((u) => u.code.toUpperCase() === code);
    if (alreadyAdded) {
        alert("Unit code already added");
        return;
    }

    units.push({ code, name });
    localStorage.setItem(STORAGE_KEYS.units, JSON.stringify(units));

    unitCode.value = "";
    unitName.value = "";
    displayUnits();
}

function displayUnits() {
    const unitsTable = document.querySelector(".units");

    if (!units.length) {
        unitsTable.innerHTML = "<p>No units added yet.</p>";
        return;
    }

    let text = "<table><tr><th>#</th><th>Code</th><th>Name</th><th>Edit</th></tr>";
    units.forEach((value, index) => {
        text += `<tr><td>${index + 1}</td><td>${value.code}</td><td>${value.name || "-"}</td><td><button index="${index}" class="edit">Remove</button></td></tr>`;
    });
    text += "</table>";
    unitsTable.innerHTML = text;

    const remove = document.querySelectorAll(".edit");
    remove.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = Number(e.target.getAttribute("index"));
            units.splice(index, 1);
            localStorage.setItem(STORAGE_KEYS.units, JSON.stringify(units));
            displayUnits();
        });
    });
}

function generateTable(entries) {
    const table1 = renderSlotTable(entries, "unit1", "Session 1 (7:00 AM - 9:00 AM)");
    const table2 = renderSlotTable(entries, "unit2", "Session 2 (10:00 AM - 12:00 PM)");
    const table3 = renderSlotTable(entries, "unit3", "Session 3 (2:00 PM - 4:00 PM)");

    outputTT.innerHTML = table1 + table2 + table3;
    outputActions.innerHTML = entries.length
        ? "<button class='download action-btn'>Save Timetable</button>"
        : "";

    const downloadBtn = document.querySelector(".download");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            localStorage.setItem(STORAGE_KEYS.savedTimetable, JSON.stringify(myUnits));
            alert("TimeTable Saved Successfully");
        });
    }
}

function renderSlotTable(entries, slotKey, title) {
    if (!entries.length) {
        return "";
    }

    let html = `<h3>${title}</h3><table>`;
    let hasRows = false;

    entries.forEach((entry) => {
        const slotUnits = entry[slotKey];
        if (!slotUnits.length) {
            return;
        }

        hasRows = true;
        if (slotUnits.length > 0) {
            html += `<tr><th rowspan="${slotUnits.length + 1}">${formatDay(entry.day)}</th></tr><tr>`;
        }
        for (let i = 0; i < slotUnits.length; i++) {
            const venue = Array.isArray(slotUnits[i].venue) ? slotUnits[i].venue : slotUnits[i].hall;
            html += `<td>${slotUnits[i].name}</td><td>${(venue || []).join(", ")}</td></tr><tr>`;
        }
        html += `</tr>`;
    });

    html += hasRows ? "</table>" : "<tr><td>No units in this session</td></tr></table>";
    return html;
}

function parseWorkbookToFullTT(data) {
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
    return normalizeSourceRows(jsonData);
}

function formatDay(serialDate) {
    if (!serialDate && serialDate !== 0) {
        return "";
    }

    if (Number(serialDate)) {
        const baseDate = new Date(1899, 11, 30);
        const convertedDate = new Date(baseDate.getTime() + Number(serialDate) * 24 * 60 * 60 * 1000);
        return convertedDate.toLocaleString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    return String(serialDate || "").trim();
}

function normalizeSourceRows(jsonData) {
    const raw = jsonData
        .map((row) => ({
            day: row[" MASENO UNIVERSITY"] || row["MASENO UNIVERSITY"] || "",
            unit1: row["__EMPTY"] || "",
            venue1: row["__EMPTY_2"] || "",
            unit2: row["__EMPTY_3"] || "",
            venue2: row["__EMPTY_5"] || "",
            unit3: row["__EMPTY_6"] || "",
            venue3: row["__EMPTY_8"] || ""
        }))
        .filter((r) => r.day || r.unit1 || r.unit2 || r.unit3);

    let currentDay = "";
    const normalized = raw.map((row) => {
        if (row.day) {
            currentDay = row.day;
        }

        return {
            ...row,
            day: currentDay
        };
    });

    const byDay = new Map();
    normalized.forEach((row) => {
        if (!row.day) {
            return;
        }

        if (!byDay.has(row.day)) {
            byDay.set(row.day, {
                day: row.day,
                unit1: new Map(),
                unit2: new Map(),
                unit3: new Map()
            });
        }

        const dayEntry = byDay.get(row.day);
        addUnitToSlot(dayEntry.unit1, row.unit1, row.venue1);
        addUnitToSlot(dayEntry.unit2, row.unit2, row.venue2);
        addUnitToSlot(dayEntry.unit3, row.unit3, row.venue3);
    });

    return Array.from(byDay.values()).map((entry) => ({
        day: entry.day,
        unit1: mapToUnitsArray(entry.unit1),
        unit2: mapToUnitsArray(entry.unit2),
        unit3: mapToUnitsArray(entry.unit3)
    }));
}

function addUnitToSlot(slotMap, unitName, hall) {
    const cleanName = String(unitName || "").trim();
    const cleanHall = String(hall || "").trim();
    if (!cleanName) {
        return;
    }

    if (!slotMap.has(cleanName)) {
        slotMap.set(cleanName, new Set());
    }

    if (cleanHall) {
        slotMap.get(cleanName).add(cleanHall);
    }
}

function mapToUnitsArray(slotMap) {
    return Array.from(slotMap.entries()).map(([name, halls]) => ({
        name,
        venue: Array.from(halls)
    }));
}

function buildPersonalizedTT(fullTT, selectedUnits) {
    const selectedCodes = selectedUnits
        .map((unit) => unit.code.trim().toUpperCase())
        .filter(Boolean);

    const foundCodes = new Set();
    const personalized = fullTT
        .map((dayEntry) => {
            const format = {
                day: dayEntry.day,
                unit1: filterSlot(dayEntry.unit1, selectedCodes, foundCodes),
                unit2: filterSlot(dayEntry.unit2, selectedCodes, foundCodes),
                unit3: filterSlot(dayEntry.unit3, selectedCodes, foundCodes)
            };

            return format;
        })
        .filter((entry) => entry.unit1.length || entry.unit2.length || entry.unit3.length);

    return {
        personalized,
        notFound: Math.max(selectedCodes.length - foundCodes.size, 0)
    };
}

function filterSlot(slotEntries, selectedCodes, foundCodes) {
    return slotEntries.filter((unit) => {
        const upperName = unit.name.toUpperCase();
        const match = selectedCodes.find((code) => upperName.startsWith(code));
        if (match) {
            foundCodes.add(match);
            return true;
        }

        return false;
    });
}

async function trackVisit() {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.visitLogs)) || [];
    const log = {
        at: new Date().toISOString(),
        ip: await getVisitorIp(),
        userAgent: navigator.userAgent
    };

    logs.push(log);
    localStorage.setItem(STORAGE_KEYS.visitLogs, JSON.stringify(logs.slice(-500)));
    renderAdminDashboard();
}

async function getVisitorIp() {
    try {
        const response = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
        if (!response.ok) {
            return "Unavailable";
        }

        const data = await response.json();
        return data.ip || "Unavailable";
    } catch (error) {
        return "Unavailable";
    }
}

async function openAdminWithAuth() {
    const configuredHash = await getConfiguredAdminPasscodeHash();
    if (!configuredHash) {
        const shouldSetup = confirm("Admin passcode is not configured. Set it now?");
        if (!shouldSetup) {
            return;
        }

        const first = prompt("Create new admin passcode");
        if (!first) {
            return;
        }

        const second = prompt("Confirm new admin passcode");
        if (first !== second) {
            alert("Passcodes do not match");
            return;
        }

        const hash = await sha256(first);
        localStorage.setItem(STORAGE_KEYS.adminPasscodeHash, hash);
        alert("Admin passcode saved in this browser.");
    }

    const code = prompt("Enter admin passcode");
    if (!code) {
        return;
    }

    const savedPasscodeHash = await getConfiguredAdminPasscodeHash();
    const enteredHash = await sha256(code);

    if (enteredHash !== savedPasscodeHash) {
        alert("Access denied");
        return;
    }

    renderAdminDashboard();
    adminPanel.classList.remove("hidden");
    adminPanel.setAttribute("aria-hidden", "false");
}

function closeAdminPanel() {
    adminPanel.classList.add("hidden");
    adminPanel.setAttribute("aria-hidden", "true");
}

function renderAdminDashboard() {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.visitLogs)) || [];
    const uniqueIps = new Set(logs.map((log) => log.ip).filter((ip) => ip && ip !== "Unavailable")).size;
    const adminTimetable = JSON.parse(localStorage.getItem(STORAGE_KEYS.adminTimetable));

    adminStats.innerHTML = `
        <p><strong>Total Visits:</strong> ${logs.length}</p>
        <p><strong>Unique IPs:</strong> ${uniqueIps}</p>
        <p><strong>Latest Visit:</strong> ${logs.length ? new Date(logs[logs.length - 1].at).toLocaleString() : "-"}</p>
        <p><strong>Default Timetable:</strong> ${adminTimetable ? `Uploaded (${new Date(adminTimetable.at).toLocaleString()})` : "Not uploaded"}</p>
    `;

    adminControls.innerHTML = `
        <div class="admin-source-tools">
            <input id="adminTtFile" type="file" accept=".xlsx,.xls">
            <button class='upload-source'>Upload Default TT</button>
            <button class='clear-source'>Remove Default TT</button>
            <button class='clear-logs'>Clear Logs</button>
        </div>
    `;

    const uploadSourceBtn = adminControls.querySelector(".upload-source");
    uploadSourceBtn.addEventListener("click", uploadAdminSourceTimetable);

    const clearSourceBtn = adminControls.querySelector(".clear-source");
    clearSourceBtn.addEventListener("click", () => {
        const okay = confirm("Remove uploaded default timetable?");
        if (!okay) {
            return;
        }

        localStorage.removeItem(STORAGE_KEYS.adminTimetable);
        renderAdminDashboard();
    });

    const clearLogsBtn = adminControls.querySelector(".clear-logs");
    clearLogsBtn.addEventListener("click", () => {
        const okay = confirm("Clear all locally stored visit logs?");
        if (!okay) {
            return;
        }

        localStorage.setItem(STORAGE_KEYS.visitLogs, JSON.stringify([]));
        renderAdminDashboard();
    });

    const recent = logs.slice(-25).reverse();
    let rows = "<table><tr><th>#</th><th>Time</th><th>IP</th></tr>";
    recent.forEach((log, index) => {
        rows += `<tr><td>${index + 1}</td><td>${new Date(log.at).toLocaleString()}</td><td>${log.ip}</td></tr>`;
    });
    rows += "</table>";

    adminLogs.innerHTML = `<h4>Recent Visits</h4>${rows}`;
}

async function uploadAdminSourceTimetable() {
    const adminFileInput = document.querySelector("#adminTtFile");
    const file = adminFileInput.files[0];
    if (!file) {
        alert("Choose a timetable file first");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const fullTT = parseWorkbookToFullTT(data);
            localStorage.setItem(STORAGE_KEYS.adminTimetable, JSON.stringify({
                at: new Date().toISOString(),
                fullTT
            }));
            alert("Default timetable uploaded successfully");
            renderAdminDashboard();
        } catch (error) {
            alert("Failed to upload default timetable");
            console.error(error);
        }
    };

    reader.readAsArrayBuffer(file);
}

async function sha256(value) {
    const encoded = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getConfiguredAdminPasscodeHash() {
    const externalHash = window.APP_CONFIG && window.APP_CONFIG.adminPasscodeHash;
    if (externalHash) {
        return String(externalHash).trim();
    }

    const localHash = localStorage.getItem(STORAGE_KEYS.adminPasscodeHash) || "";
    return localHash.trim();
}