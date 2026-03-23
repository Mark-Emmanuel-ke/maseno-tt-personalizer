window.APP_CONFIG = {
    // ===== ADMIN PASSCODE (Optional - Universal from admin-config.json) =====
    // If you set this, it will be used globally across all devices
    // Otherwise, the password from admin-config.json in the repo will be used
    // Generate hash in browser console:
    // await crypto.subtle.digest("SHA-256", new TextEncoder().encode("your-passcode"))
    // then convert to hex and paste below.
    adminPasscodeHash: ""
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
