# Maseno University Timetable Personalizer

A lightweight, responsive web application that helps Maseno University students create personalized timetables by selecting their registered units. The app displays a custom timetable based on the units you choose, making it easy to see your schedule at a glance.

## Features

✨ **Key Features:**
- **Personalized Timetables**: Select your units and get a custom timetable
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Automatic Saving**: Your selected units are saved automatically
- **Universal Timetable**: All students use the same base timetable (updated by admin)
- **No Backend Required**: Runs entirely on GitHub Pages - no server needed
- **Offline Support**: Once loaded, works without internet connection
- **Mobile-Friendly**: Easy to use on smartphones with optimized UI

## Deployment

This app is hosted on **GitHub Pages** - a free static hosting service. No backend server or database needed!

**Live Demo**: Check the GitHub Pages URL in your repository settings.

## How to Use (Student Guide)

See [USER_GUIDE.txt](USER_GUIDE.txt) for step-by-step instructions on how to use the app.

## For Administrators

### Setting Up the Admin Panel

1. **Access Admin**: Triple-click the copyright text at the bottom to access the admin panel
2. **Enter Password**: Enter the admin passcode when prompted

### Managing Timetables

- **Upload Timetable**: Upload an Excel file (.xlsx or .xls) with the base timetable
- **Export**: Click "Export TT as JSON" to download the updated file
- **Update Repository**: Replace `admin-timetable.json` in the repository and push to GitHub
- **Auto-Deploy**: All users will immediately see the new timetable

### Changing Admin Password

- **In Admin Panel**: Click "Change Admin Password" button
- **Enter New Password**: Create a secure password
- **Export**: Download the new `admin-config.json` file
- **Update Repository**: Replace the file in the repository and push to GitHub
- **Effective Immediately**: All devices will use the new password next visit

## Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Libraries**: XLSX.js for Excel parsing, Font Awesome for icons
- **Storage**: localStorage for user data, JSON files for universal data
- **Hosting**: GitHub Pages (static files only)

### Files
- `index.html` - Main page structure
- `script.js` - Application logic
- `index.css` - Styling and responsive design
- `admin-config.json` - Universal admin password (JSON)
- `admin-timetable.json` - Universal timetable (JSON)
- `config.js` - Optional configuration file

### Key Technologies
- **ES6 JavaScript** with async/await
- **CSS Media Queries** for responsive design (640px, 900px breakpoints)
- **Crypto.subtle API** for SHA-256 password hashing
- **Fetch API** for loading JSON files

## Development

### Project Structure
```
maseno-tt-personalizer/
├── index.html              # Main HTML file
├── script.js               # JavaScript logic (~800 lines)
├── index.css               # Styling (~375 lines)
├── admin-config.json       # Admin password (universal)
├── admin-timetable.json    # Timetable data (universal)
├── config.js              # Optional config
├── config.example.js      # Config template
├── README.md              # This file
└── USER_GUIDE.txt         # User instructions
```

### Key Functions

**User Functions:**
- `generateTable()` - Creates timetable from selected units
- `selectUnits()` - Add/remove units from selection
- `displayUnits()` - Shows selected units list

**Admin Functions:**
- `openAdminWithAuth()` - Admin panel access with password
- `changeAdminPassword()` - Update admin password globally
- `uploadAdminSourceTimetable()` - Upload new timetable
- `exportAdminTimetable()` - Download timetable as JSON

**Utility Functions:**
- `sha256()` - Hash passwords securely
- `loadAdminConfig()` - Load password from admin-config.json
- `loadAdminTimetable()` - Load timetable from admin-timetable.json
- `trackVisit()` - Log visitor IP and timestamp

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

**Units not saving?**
- Check if localStorage is enabled in your browser
- Try refreshing the page

**Timetable not showing?**
- Make sure a timetable has been uploaded by admin
- Clear browser cache and reload

**Admin panel not accessible?**
- Triple-click the copyright text at the bottom
- Check that admin password is set in `admin-config.json`

**Mobile issues?**
- Use a modern mobile browser (Chrome, Safari)
- Enable JavaScript in browser settings

## License

See [LICENSE](LICENSE) file for details.

## Developer

**Mark Emmanuel**
- 📧 Contact: +254769600012 / WhatsApp
- 🔗 LinkedIn: [mark-emmanuel-ke](https://www.linkedin.com/in/mark-emmanuel-ke/)
- 🐙 GitHub: [Mark-Emmanuel-ke](https://github.com/Mark-Emmanuel-ke)
- 👥 Facebook: [Profile](https://www.facebook.com/profile.php?id=100080116340109)

## Support

For issues, feature requests, or questions:
1. Check [USER_GUIDE.txt](USER_GUIDE.txt) first
2. Contact the developer using the links above

---

**Last Updated:** March 23, 2026  
**Version:** 2.0 (Universal Admin System)