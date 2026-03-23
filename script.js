const STORAGE_KEYS = {
    units: "units",
    savedTimetable: "saved",
    visitLogs: "site_visit_logs",
    adminPasscode: "admin_passcode"
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

if (!localStorage.getItem(STORAGE_KEYS.adminPasscode)) {
    localStorage.setItem(STORAGE_KEYS.adminPasscode, "maseno2026");
}

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
    if (!file) {
        alert("You haven't selected a source TimeTable");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            const fullTT = normalizeSourceRows(jsonData);
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

    reader.readAsArrayBuffer(file);
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
    const table1 = renderSlotTable(entries, "unit1", "Session 1");
    const table2 = renderSlotTable(entries, "unit2", "Session 2");
    const table3 = renderSlotTable(entries, "unit3", "Session 3");

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

    let html = `<h3>${title}</h3><table><tr><th>Day</th><th>Unit</th><th>Venue</th></tr>`;
    let hasRows = false;

    entries.forEach((entry) => {
        entry[slotKey].forEach((unit) => {
            hasRows = true;
            html += `<tr><td>${formatDay(entry.day)}</td><td>${unit.name}</td><td>${unit.hall.join(", ")}</td></tr>`;
        });
    });

    html += hasRows ? "</table>" : "<tr><td colspan='3'>No units in this session</td></tr></table>";
    return html;
}

function formatDay(serialDate) {
    if (Number(serialDate)) {
        const baseDate = new Date(1899, 11, 30);
        const convertedDate = new Date(baseDate.getTime() + Number(serialDate) * 24 * 60 * 60 * 1000);
        const day = convertedDate.toLocaleString("en-US", { weekday: "long" });
        const formattedDate = convertedDate.toLocaleDateString("en-GB");
        return `${day}, ${formattedDate}`;
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
        hall: Array.from(halls)
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

function openAdminWithAuth() {
    const code = prompt("Enter admin passcode");
    const savedPasscode = localStorage.getItem(STORAGE_KEYS.adminPasscode) || "";

    if (code !== savedPasscode) {
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

    adminStats.innerHTML = `
        <p><strong>Total Visits:</strong> ${logs.length}</p>
        <p><strong>Unique IPs:</strong> ${uniqueIps}</p>
        <p><strong>Latest Visit:</strong> ${logs.length ? new Date(logs[logs.length - 1].at).toLocaleString() : "-"}</p>
    `;

    adminControls.innerHTML = "<button class='clear-logs'>Clear Logs</button>";
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