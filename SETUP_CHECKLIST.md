# Setup Checklist

## Before Testing

### ✅ Step 1: Load Extension

1. Open Chrome/Edge
2. Go to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Navigate to and select: `d:\hackthon\extension`
6. Extension should appear in list with green "On" toggle

### ✅ Step 2: Enable File Access (IMPORTANT!)

**This is required for test-icon.html to work!**

1. In `chrome://extensions/`
2. Find "Hate Speech Prevention & Protection"
3. Click **"Details"** button
4. Scroll down to find **"Allow access to file URLs"**
5. **TURN IT ON** (toggle switch)

Without this, the extension won't run on local HTML files!

### ✅ Step 3: Verify Extension Loaded

1. Extension icon should appear in toolbar
2. Check for checkmark or "On" indicator
3. No error messages shown

### ✅ Step 4: Open Test Page

**Option A: Double-click file**
- Navigate to `d:\hackthon\`
- Double-click `test-icon.html`
- Should open in browser

**Option B: Drag and drop**
- Drag `test-icon.html` to browser window

**Option C: URL bar**
```
file:///d:/hackthon/test-icon.html
```

### ✅ Step 5: Open DevTools

1. Press `F12` (or right-click → Inspect)
2. Go to **Console** tab
3. Keep it open to see debug messages

## What You Should See

### In Console (F12):
```
🚀 [HATE-DETECT] Content script file loaded!
🚀 [HATE-DETECT] Current URL: file:///...
📦 [HATE-DETECT] Settings loaded: {feature1Enabled: true, ...}
✅ [HATE-DETECT] DOM loaded, initializing...
🚀 [HATE-DETECT] Extension loaded and initializing...
✅ [HATE-DETECT] Feature 1 (Pre-Send Detection) enabled
🔧 [HATE-DETECT] Setting up pre-send detection...
✅ [HATE-DETECT] Styles injected
📝 [HATE-DETECT] Found 3 editable elements
```

### On Page:
- Debug panel in bottom-right showing "Extension detected"
- 3 input fields visible

### When You Click Input:
- Console messages about focus
- Red "HS" icon appears in bottom-right of input
- Debug panel logs the focus event

## Troubleshooting

### ❌ No console messages at all

**Problem:** Extension not loaded on page

**Solutions:**
1. Check "Allow access to file URLs" is enabled (Step 2)
2. Reload extension in `chrome://extensions/`
3. Refresh the test page (Ctrl+R)
4. Check manifest.json includes `file://*/*` in matches

### ❌ Console shows "Extension NOT detected"

**Problem:** Content script not running

**Solutions:**
1. Verify extension is enabled (green toggle)
2. Check no errors on `chrome://extensions/` page
3. Make sure all 3 files are in `extension` folder:
   - utils/apiClient.js
   - utils/domDetection.js
   - contentScript.js
4. Click reload button on extension card

### ❌ Messages show but no icon

**Problem:** Icon creation or positioning issue

**Check in console:**
```javascript
document.querySelectorAll('.hate-detect-icon').length
```

**If returns 0:**
- Icons not being created
- Check for errors in console
- Look for "❌" prefixed error messages

**If returns > 0:**
- Icons exist but not visible
- Check positioning with:
```javascript
const icon = document.querySelector('.hate-detect-icon');
console.log(icon.style);
```

### ❌ Icon shows but in wrong place

**Problem:** Positioning calculation issue

**Try:**
1. Scroll the page
2. Resize window
3. Click input again
4. Check if input has unusual CSS (transforms, position fixed, etc.)

### ❌ Click on icon doesn't work

**Problem:** Event listener or Shadow DOM issue

**Test:**
```javascript
const icon = document.querySelector('.hate-detect-icon');
console.log('Icon exists:', !!icon);
console.log('Shadow DOM:', !!icon?.shadowRoot);
console.log('Button:', !!icon?.shadowRoot?.querySelector('.icon-button'));
```

## Quick Test

**Run this in console to test everything at once:**

```javascript
console.log('=== EXTENSION DEBUG INFO ===');
console.log('1. Extension loaded:', typeof getEditableElements === 'function');
console.log('2. API loaded:', typeof apiClient === 'object');
console.log('3. DOM ready:', document.readyState);
console.log('4. Body exists:', !!document.body);
console.log('5. Inputs on page:', document.querySelectorAll('input, textarea, [contenteditable]').length);
console.log('6. Icons created:', document.querySelectorAll('.hate-detect-icon').length);
console.log('7. Elements marked:', document.querySelectorAll('.hate-detect-ready').length);
console.log('8. Active elements:', document.querySelectorAll('.hate-detect-active').length);

// Test API
if (typeof apiClient === 'object') {
    apiClient.detectHateSpeech('test text').then(result => {
        console.log('9. API test result:', result);
    }).catch(err => {
        console.error('9. API test failed:', err);
    });
}

// List all icons
document.querySelectorAll('.hate-detect-icon').forEach((icon, i) => {
    console.log(`Icon ${i} style:`, {
        display: icon.style.display,
        top: icon.style.top,
        left: icon.style.left,
        visible: icon.offsetHeight > 0
    });
});
```

## Expected Results

After running the quick test, you should see:

```javascript
1. Extension loaded: true          ✅
2. API loaded: true                 ✅
3. DOM ready: "complete"            ✅
4. Body exists: true                ✅
5. Inputs on page: 3                ✅
6. Icons created: 0-3               ⚠️ 0 before focus, 1+ after
7. Elements marked: 0-3             ⚠️ Increases as you focus
8. Active elements: 0-1             ⚠️ 1 when input is focused
9. API test result: {is_hate: false, confidence: 0.15, ...} ✅
```

## Testing Workflow

1. ✅ Load extension
2. ✅ Enable file access
3. ✅ Open test-icon.html
4. ✅ Open DevTools (F12)
5. ✅ Run quick test script
6. ✅ Click on first input
7. ✅ Watch for icon appearance
8. ✅ Type text
9. ✅ Wait 1 second
10. ✅ Check for score badge
11. ✅ Click icon
12. ✅ Verify tooltip shows

## Files to Check

If issues persist, verify these files exist:

```
d:\hackthon\
├── extension\
│   ├── manifest.json           ← Extension config
│   ├── contentScript.js        ← Main logic (with debug logs)
│   ├── background.js           ← Service worker
│   ├── utils\
│   │   ├── apiClient.js        ← API functions
│   │   └── domDetection.js     ← Input detection
│   ├── popup.html
│   ├── popup.js
│   └── styles.css
└── test-icon.html              ← Test page (with debug panel)
```

## Next Steps

Once you see the icon working:

1. Test on real websites (Facebook, Twitter)
2. Try different input types
3. Test score updates
4. Test click functionality
5. Verify suggestions appear

## Need More Help?

See:
- [DEBUGGING_GUIDE.md](DEBUGGING_GUIDE.md) - Detailed troubleshooting
- [ICON_VISUAL_GUIDE.md](ICON_VISUAL_GUIDE.md) - What it should look like
- [TESTING_QUICK_START.md](TESTING_QUICK_START.md) - Testing instructions

---

**Start here:** Enable "Allow access to file URLs" then open test-icon.html!
