window.APP_CONFIG = {
    // Admin passcode hash (optional - can use admin-config.json instead)
    adminPasscodeHash: "",
    
    // GitHub Configuration (for automatic repo updates)
    // Required to auto-commit timetable changes to your repository
    github: {
        // Your GitHub username (e.g., "Mark-Emmanuel-ke")
        username: "",
        
        // Repository name (e.g., "maseno-tt-personalizer")
        repo: "",
        
        // SECURITY: Token should be ENCRYPTED!
        // Choose ONE of the following:
        
        // Option 1: Plain token (NOT RECOMMENDED - only for testing)
        // token: "ghp_xxxxxxxxxxxxxxxxxxxx",
        
        // Option 2: Encrypted token (RECOMMENDED - see setup instructions)
        // encryptedToken: "encrypted_value_here",
        
        token: "",
        encryptedToken: ""
    }
};

/*
 * ===== GITHUB AUTO-COMMIT SETUP (SECURE) =====
 * 
 * To enable secure automatic repository updates:
 * 
 * STEP 1: CREATE PERSONAL ACCESS TOKEN
 * ─────────────────────────────────────
 * 1. Go to: https://github.com/settings/tokens
 * 2. Click "Generate new token" → "Generate new token (classic)"
 * 3. Name: "Maseno TT Personalizer"
 * 4. Select scopes: ✓ repo (all) + ✓ workflow
 * 5. Copy the token (save it temporarily)
 * 
 * STEP 2: ENCRYPT THE TOKEN (RECOMMENDED)
 * ──────────────────────────────────────
 * 1. Open browser console (F12)
 * 2. Choose a strong MASTER PASSWORD (you'll enter this to decrypt)
 * 3. Run this in console:
 * 
 *    const token = "ghp_xxxxxxxxxxxxxxxxxxxx";
 *    const masterPassword = "your-strong-password-here";
 *    const encrypted = await encryptGitHubToken(token, masterPassword);
 *    console.log("Encrypted:", encrypted);
 * 
 * 4. Copy the encrypted string
 * 5. Paste into config.js as encryptedToken:
 * 
 *    github: {
 *        username: "your-username",
 *        repo: "your-repo",
 *        encryptedToken: "encrypted_string_here"
 *    }
 * 
 * STEP 3: SAVE SECURELY
 * ─────────────────────
 * 1. Make sure config.js is in .gitignore
 * 2. Save config.js in your local project (NOT in repo)
 * 3. Never share the master password or config.js
 * 
 * STEP 4: USE IT
 * ──────────────
 * When admin uploads timetable or changes password:
 * - System asks for the master password
 * - Token is decrypted in browser memory only
 * - Token is NEVER stored or transmitted unencrypted
 * - Change is auto-committed to your repo!
 * 
 * ===== SECURITY BENEFITS =====
 * ✓ Token is encrypted (AES-256-GCM)
 * ✓ Only decrypted when needed
 * ✓ Safe even if config.js is leaked
 * ✓ Master password protection
 * ✓ No plain text tokens in code
 * 
 * ===== ALTERNATIVE: PLAIN TOKEN (NOT RECOMMENDED) =====
 * If you want to skip encryption (not recommended):
 * 1. Create token as above
 * 2. Paste directly into token field:
 *    token: "ghp_xxxxxxxxxxxxxxxxxxxx"
 * 3. IMPORTANT: Keep config.js secure and out of public repos!
 * 
 * WARNING: Plain tokens are risky. Use encryption if possible!
 */

