window.APP_CONFIG = {
    // ===== ADMIN PASSCODE (Universal for all users) =====
    // Password: maseno2026
    // Generate this in browser console:
    // await crypto.subtle.digest("SHA-256", new TextEncoder().encode("your-passcode"))
    // then convert to hex and paste below.
    // If empty, the passcode stored in browser's first login will be used.
    adminPasscodeHash: "38138aabb374a15759165bba46bc7a2b0ae293e23bdae530b17c1641eb7c8dde"
};

/* 
 * ===== UNIVERSAL ADMIN TIMETABLE SETUP =====
 * 
 * The admin-timetable.json file makes the timetable universal - all visitors use the same default timetable.
 * 
 * SETUP STEPS:
 * 1. Click triple-click the copyright text to access admin panel
 * 2. Enter admin passcode
 * 3. Upload an Excel timetable file (.xlsx or .xls)
 * 4. Click "Export as JSON" button - this downloads admin-timetable.json
 * 5. Replace the admin-timetable.json file in your repo with the downloaded one
 * 6. Push to GitHub - all visitors will now use this timetable
 * 
 * STRUCTURE:
 * The admin-timetable.json contains:
 * {
 *   "uploadedAt": "ISO timestamp",
 *   "fullTT": [parsed timetable data array]
 * }
 * 
 * UPDATING:
 * - Simply repeat steps 1-6 with a new timetable file
 * - No backend needed - GitHub Pages serves the static JSON file
 */
