# Quick Start: Testing the Icon Feature

## Step 1: Load the Extension

### Chrome/Edge Instructions:
1. Open your browser
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `extension` folder: `d:\hackthon\extension`
6. Extension should now appear in your extensions list

## Step 2: Open Test Page

Option A: **Local Test Page**
```
Open file: d:\hackthon\test-icon.html
```

Option B: **Real Website**
- Go to Facebook, Twitter, or Instagram
- Find any comment box or text field

## Step 3: See the Icon

1. **Click on any input field** (textarea, text input, contenteditable)
2. **Look for the red "HS" icon** in the bottom-right corner
3. **Start typing** - the score badge will appear after 1 second

## Step 4: Test the Icon Click

1. **Click the red HS icon**
2. You should see a tooltip with:
   - Hate score (0-100)
   - Status (Safe/Warning)
   - Suggestions list

## Test Phrases

Copy and paste these to see different scores:

### ✅ Low Score (~10-20)
```
Have a great day! Let's work together and build something amazing.
```

### ⚠️ Medium Score (~40-60)
```
I don't like your ideas at all. This is completely wrong.
```

### 🚫 High Score (~70-90)
```
You're stupid and worthless. Nobody likes you.
```

## Expected Behavior

### When You Type:
- Icon appears immediately when input is focused
- After 1 second of no typing, score badge appears
- Badge color changes based on score:
  - 🟢 Green (0-39)
  - 🟠 Orange (40-69)
  - 🔴 Red (70-100)

### When You Click Icon:
- Detailed tooltip appears above icon
- Shows large score number
- Lists 3 suggestions
- Can close with × button
- Auto-closes after 10 seconds

## Troubleshooting

### Icon Not Appearing?

**Check Console:**
```javascript
Press F12 → Console tab
Look for errors related to "hate-detect"
```

**Verify Extension:**
- Make sure extension is enabled
- Check that icon in toolbar shows extension is active
- Try reloading the extension

**Refresh Page:**
- Press Ctrl+R or F5
- Extension loads on page load

### API Errors?

The extension uses a mock API by default. Check `utils/apiClient.js` if you need to connect to a real API.

**Default Mock Detection:**
- Uses keyword matching for testing
- No internet connection required
- Returns immediate results

### Score Not Updating?

**Wait 1 Second:**
- Score updates are debounced
- Type, then wait 1 second
- Badge should appear/update

**Check Text Length:**
- Empty text = no badge
- Very short text might not trigger analysis

## Advanced Testing

### Test Multiple Inputs
Open test-icon.html which has:
- Text input field
- Textarea
- ContentEditable div

Each should have its own icon.

### Test Scrolling
1. Type in an input
2. Scroll the page
3. Icon should move with the input field

### Test Window Resize
1. Type in an input
2. Resize browser window
3. Icon should reposition correctly

## Browser Console Commands

**Check if extension loaded:**
```javascript
console.log(typeof getEditableElements)  // Should show "function"
```

**Check API client:**
```javascript
console.log(typeof apiClient)  // Should show "object"
```

**Test hate detection:**
```javascript
apiClient.detectHateSpeech("test text").then(console.log)
```

## Visual Checklist

- [ ] Red circular icon appears in input
- [ ] Icon has white "HS" text
- [ ] Icon is in bottom-right corner
- [ ] Icon has white border
- [ ] Hover makes icon slightly larger
- [ ] Score badge appears after typing
- [ ] Badge has colored background (green/orange/red)
- [ ] Clicking icon shows tooltip
- [ ] Tooltip has score, status, and suggestions
- [ ] Tooltip has working × close button
- [ ] Tooltip auto-closes after 10 seconds

## Files to Check

If something's not working, verify these files:

1. **manifest.json** - Extension config
   - Check `content_scripts` includes apiClient.js
   
2. **contentScript.js** - Main logic
   - Check for JavaScript errors
   
3. **utils/apiClient.js** - API client
   - Check if loaded correctly

## Success Screenshot Locations

The icon should appear like this:

```
┌────────────────────────────────────────────┐
│ Type your message here...            [HS]  │ ← Icon here
│                                       ⬆72  │ ← Score badge
└────────────────────────────────────────────┘
```

When clicked:
```
                               ┌─────────────────┐
                               │ Hate Speech   × │
                               │       72        │
                               │     WARNING     │
                               │ Suggestions:    │
                               │ • Rephrase...   │
                               └─────────────────┘
```

## Next Steps

Once you verify the icon works:

1. **Test on real sites** (Facebook, Twitter)
2. **Check different input types**
3. **Test with various text samples**
4. **Verify score accuracy**
5. **Check performance**

## Need Help?

Check these files for documentation:
- `ICON_IMPLEMENTATION.md` - Full technical details
- `ICON_VISUAL_GUIDE.md` - Visual reference
- `README.md` - General extension info

---

**Ready to Test!** 🚀

Load the extension and open test-icon.html to begin!
