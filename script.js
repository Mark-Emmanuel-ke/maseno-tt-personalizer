const STORAGE_KEYS = {
    units: "units",
    savedTimetable: "saved",
    visitLogs: "site_visit_logs",
    adminPasscodeHash: "admin_passcode_hash",
    adminTimetable: "admin_uploaded_timetable"
};

// Admin timetable URL - points to the repo's JSON file
const ADMIN_TIMETABLE_URL = "./admin-timetable.json";

const units = JSON.parse(localStorage.getItem(STORAGE_KEYS.units)) || [];
let myUnits = JSON.parse(localStorage.getItem(STORAGE_KEYS.savedTimetable)) || [];
let globalAdminTimetable = null; // Universal timetable for all users

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

// Load admin timetable from JSON file on startup
async function loadAdminTimetable() {
    try {
        const response = await fetch(ADMIN_TIMETABLE_URL);
        const data = await response.json();
        if (data.fullTT && Array.isArray(data.fullTT) && data.fullTT.length > 0) {
            globalAdminTimetable = data;
        }
    } catch (error) {
        console.log("No admin timetable found or error loading:", error);
    }
}

// Initialize app
(async () => {
    await loadAdminTimetable();
    if (myUnits.length > 0) {
        generateTable(myUnits);
    }
    displayUnits();
    trackVisit();
})();

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

// Triple-click copyright for admin access
const footerCredit = document.querySelector(".footer-credit");
let creditClickCount = 0;
let creditClickTimeout;

if (footerCredit) {
    footerCredit.addEventListener("click", () => {
        creditClickCount++;
        clearTimeout(creditClickTimeout);
        
        if (creditClickCount === 3) {
            openAdminWithAuth();
            creditClickCount = 0;
        }
        
        creditClickTimeout = setTimeout(() => {
            creditClickCount = 0;
        }, 500);
    });
}

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
    if (!file && !globalAdminTimetable) {
        alert("No source timetable found. Upload one or ask admin to upload a default timetable.");
        return;
    }

    const processFile = (data) => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const tempTT = {
            day: "",
            unit1: "",
            venue1: "",
            unit2: "",
            venue2: "",
            unit3: "",
            venue3: ""
        };
        const TT = [];
        jsonData.forEach(value => {
            const keys = Object.keys(value);
            keys.forEach(key => {
                const match = [" MASENO UNIVERSITY", "__EMPTY", "__EMPTY_2", "__EMPTY_3", "__EMPTY_5", "__EMPTY_6", "__EMPTY_8"];
                for (let i = 0; i < match.length; i++) {
                    if (match[i] == key) {
                        if (i == 0) {
                            tempTT["day"] = value[match[i]];
                        } else if (i == 1) {
                            tempTT["unit1"] = value[match[i]];
                        } else if (i == 2) {
                            tempTT["venue1"] = value[match[i]];
                        } else if (i == 3) {
                            tempTT["unit2"] = value[match[i]];
                        } else if (i == 4) {
                            tempTT["venue2"] = value[match[i]];
                        } else if (i == 5) {
                            tempTT["unit3"] = value[match[i]];
                        } else if (i == 6) {
                            tempTT["venue3"] = value[match[i]];
                        }
                    }
                }
            });
            TT.push({ ...tempTT });
        });

        const wholeTT = [];
        let found = 0;

        TT.forEach((obj, index) => {
            const format = {
                day: obj.day || "",
                unit1: [],
                unit2: [],
                unit3: []
            };

            if (!obj["unit1"]) {
                return;
            } else if (index == 2) {
                format.day = obj.day;
                format.unit1.push({ name: obj.unit1, hall: [obj.venue1] });
                format.unit2.push({ name: obj.unit2, hall: [obj.venue2] });
                format.unit3.push({ name: obj.unit3, hall: [obj.venue3] });
                wholeTT.push({ ...format });
            } else {
                if (obj["day"] === wholeTT[wholeTT.length - 1].day) {
                    let lastEntry = wholeTT[wholeTT.length - 1];

                    let unit1 = lastEntry.unit1.find(value => value.name === obj.unit1);
                    if (unit1) {
                        if (!unit1.hall.includes(obj.venue1)) {
                            unit1.hall.push(obj.venue1);
                        }
                    } else {
                        lastEntry.unit1.push({ name: obj.unit1, hall: [obj.venue1] });
                    }

                    let unit2 = lastEntry.unit2.find(value => value.name === obj.unit2);
                    if (unit2) {
                        if (!unit2.hall.includes(obj.venue2)) {
                            unit2.hall.push(obj.venue2);
                        }
                    } else {
                        lastEntry.unit2.push({ name: obj.unit2, hall: [obj.venue2] });
                    }

                    let unit3 = lastEntry.unit3.find(value => value.name === obj.unit3);
                    if (unit3) {
                        if (!unit3.hall.includes(obj.venue3)) {
                            unit3.hall.push(obj.venue3);
                        }
                    } else {
                        lastEntry.unit3.push({ name: obj.unit3, hall: [obj.venue3] });
                    }
                } else {
                    format.day = obj.day;
                    format.unit1.push({ name: obj.unit1, hall: [obj.venue1] });
                    format.unit2.push({ name: obj.unit2, hall: [obj.venue2] });
                    format.unit3.push({ name: obj.unit3, hall: [obj.venue3] });
                    wholeTT.push({ ...format });
                }
            }
        });

        const regex = new RegExp(`^(${units.map(unit => unit.code).join("|")})`, "i");
        myUnits = [];
        myUnits.push(wholeTT[0]);

        wholeTT.forEach(each => {
            each.unit1.forEach(n => {
                if (regex.test(n.name)) {
                    found++;
                    const format = {
                        day: "",
                        unit1: [],
                        unit2: [],
                        unit3: []
                    };
                    format.day = each.day;
                    format.unit1.push({ name: n.name, hall: [...n.hall] });
                    myUnits.push({ ...format });
                }
            });

            each.unit2.forEach(n => {
                if (regex.test(n.name)) {
                    found++;
                    const format = {
                        day: "",
                        unit1: [],
                        unit2: [],
                        unit3: []
                    };
                    format.day = each.day;
                    format.unit2.push({ name: n.name, hall: [...n.hall] });
                    myUnits.push({ ...format });
                }
            });

            each.unit3.forEach(n => {
                if (regex.test(n.name)) {
                    found++;
                    const format = {
                        day: "",
                        unit1: [],
                        unit2: [],
                        unit3: []
                    };
                    format.day = each.day;
                    format.unit3.push({ name: n.name, hall: [...n.hall] });
                    myUnits.push({ ...format });
                }
            });
        });

        generateTable(myUnits);
        const notFound = units.length - found;
        if (notFound > 0) {
            alert(`${notFound} unit(s) not found,\nDouble check the unit codes and generate again`);
        }
        localStorage.setItem(STORAGE_KEYS.savedTimetable, JSON.stringify(myUnits));
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                processFile(data);
            } catch (error) {
                alert("Failed to read the selected timetable file.");
                console.error(error);
            }
        };
        reader.readAsArrayBuffer(file);
        return;
    }

    // Use global admin timetable or fallback to stored one
    if (globalAdminTimetable && Array.isArray(globalAdminTimetable.fullTT)) {
        processFile(globalAdminTimetable.fullTT);
    }
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

function generateTable(any) {
    let table1 = `<table style="width: 66vw">`;
    let table2 = `<table style="width: 66vw">`;
    let table3 = `<table style="width: 66vw">`;
    let firstUnit1 = true;
    let firstUnit2 = true;
    let firstUnit3 = true;

    any.forEach(entry => {
        if (entry.unit1.length > 0) {
            table1 += `<tr><th rowspan="${entry.unit1.length + 1}">${formatDay(entry['day'])}</th></tr><tr>`;
        }
        for (let i = 0; i < entry.unit1.length; i++) {
            const isFirst = firstUnit1;
            if (isFirst) firstUnit1 = false;
            const cellType = isFirst ? "th" : "td";
            table1 += `<${cellType}>${entry.unit1[i].name}</${cellType}><${cellType}>${entry.unit1[i].hall}</${cellType}></tr><tr>`;
        }
        table1 += `</tr>`;

        if (entry.unit2.length > 0) {
            table2 += `<tr><th rowspan="${entry.unit2.length + 1}">${formatDay(entry['day'])}</th></tr><tr>`;
        }
        for (let i = 0; i < entry.unit2.length; i++) {
            const isFirst = firstUnit2;
            if (isFirst) firstUnit2 = false;
            const cellType = isFirst ? "th" : "td";
            table2 += `<${cellType}>${entry.unit2[i].name}</${cellType}><${cellType}>${entry.unit2[i].hall}</${cellType}></tr><tr>`;
        }
        table2 += `</tr>`;

        if (entry.unit3.length > 0) {
            table3 += `<tr><th rowspan="${entry.unit3.length + 1}">${formatDay(entry['day'])}</th></tr><tr>`;
        }
        for (let i = 0; i < entry.unit3.length; i++) {
            const isFirst = firstUnit3;
            if (isFirst) firstUnit3 = false;
            const cellType = isFirst ? "th" : "td";
            table3 += `<${cellType}>${entry.unit3[i].name}</${cellType}><${cellType}>${entry.unit3[i].hall}</${cellType}></tr><tr>`;
        }
        table3 += `</tr>`;
    });

    table1 += `</table><br/>`;
    table2 += `</table><br/>`;
    table3 += `</table>`;

    const outputTT = document.querySelector('.output');
    outputActions.innerHTML = any.length ? "<button class='download action-btn'>Save Timetable</button>" : "";
    outputTT.innerHTML = table1 + table2 + table3;

    const downloadBtn = document.querySelector(".download");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            localStorage.setItem(STORAGE_KEYS.savedTimetable, JSON.stringify(myUnits));
            alert("TimeTable Saved Successfully");
        });
    }
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

    const ttStatus = globalAdminTimetable 
        ? `Loaded (Universal - shared with all users)`
        : "Not uploaded";

    adminStats.innerHTML = `
        <p><strong>Total Visits:</strong> ${logs.length}</p>
        <p><strong>Unique IPs:</strong> ${uniqueIps}</p>
        <p><strong>Latest Visit:</strong> ${logs.length ? new Date(logs[logs.length - 1].at).toLocaleString() : "-"}</p>
        <p><strong>Default Timetable:</strong> ${ttStatus}</p>
    `;

    adminControls.innerHTML = `
        <div class="admin-source-tools">
            <input id="adminTtFile" type="file" accept=".xlsx,.xls">
            <button class='upload-source'>Upload Default TT</button>
            <button class='export-source' ${!globalAdminTimetable ? 'disabled' : ''}>Export as JSON</button>
            <button class='clear-logs'>Clear Logs</button>
        </div>
        <p style="font-size: 0.85rem; color: #999; margin-top: 10px;">
            📌 <strong>Setup:</strong> After uploading, export as JSON and save the contents to <code>admin-timetable.json</code> in the repo root.
        </p>
    `;

    const uploadSourceBtn = adminControls.querySelector(".upload-source");
    uploadSourceBtn.addEventListener("click", uploadAdminSourceTimetable);

    const exportSourceBtn = adminControls.querySelector(".export-source");
    if (exportSourceBtn && globalAdminTimetable) {
        exportSourceBtn.addEventListener("click", exportAdminTimetable);
    }

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
            globalAdminTimetable = {
                uploadedAt: new Date().toISOString(),
                fullTT
            };
            alert("✅ Default timetable loaded. Now export it as JSON and update admin-timetable.json in the repo.");
            renderAdminDashboard();
        } catch (error) {
            alert("Failed to upload default timetable");
            console.error(error);
        }
    };

    reader.readAsArrayBuffer(file);
}

function exportAdminTimetable() {
    if (!globalAdminTimetable) {
        alert("No timetable to export");
        return;
    }

    const jsonString = JSON.stringify(globalAdminTimetable, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-timetable.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("📥 Downloaded admin-timetable.json. Replace the file in your repo with this and push to GitHub.");
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