# Debugging Guide - Icon Not Showing

## Quick Checks

### 1. Check Browser Console
Press `F12` to open DevTools, go to Console tab.

**Look for these messages:**
```
🚀 [HATE-DETECT] Content script file loaded!
🚀 [HATE-DETECT] Current URL: ...
📦 [HATE-DETECT] Settings loaded: ...
✅ [HATE-DETECT] DOM loaded, initializing...
🚀 [HATE-DETECT] Extension loaded and initializing...
✅ [HATE-DETECT] Feature 1 (Pre-Send Detection) enabled
🔧 [HATE-DETECT] Setting up pre-send detection...
✅ [HATE-DETECT] Styles injected
✅ [HATE-DETECT] Focus listener added
✅ [HATE-DETECT] Mutation observer started
🔍 [HATE-DETECT] Scanning page for initial editable elements...
📝 [HATE-DETECT] Found X editable elements: ...
```

### 2. Test Extension is Loaded

**In the console, type:**
```javascript
typeof getEditableElements
```
**Expected:** Should return `"function"`
**If not:** Extension is not loaded

```javascript
typeof apiClient
```
**Expected:** Should return `"object"`  
**If not:** API client not loaded

### 3. Test Input Detection

**Click on an input field, check console for:**
```
👁️ [HATE-DETECT] Focus event detected on: ...
✅ [HATE-DETECT] Editable element focused: ...
🎯 [HATE-DETECT] Marking element for detection: ...
🎨 [HATE-DETECT] Injecting icon into element...
✅ [HATE-DETECT] Icon appended to DOM
🎉 [HATE-DETECT] Icon injection complete and visible!
```

### 4. Check for Icons in DOM

**In console, type:**
```javascript
document.querySelectorAll('.hate-detect-icon').length
```
**Expected:** Should return number > 0 after focusing inputs
**If 0:** Icons not being created

### 5. Check Icon Visibility

**In console, type:**
```javascript
const icon = document.querySelector('.hate-detect-icon');
if (icon) {
    console.log('Icon found:', icon);
    console.log('Display:', icon.style.display);
    console.log('Position:', icon.style.position);
    console.log('Top:', icon.style.top);
    console.log('Left:', icon.style.left);
} else {
    console.log('No icon found!');
}
```

## Common Issues

### Issue: "Extension not loaded" / No console messages

**Solutions:**
1. Check extension is enabled in `chrome://extensions/`
2. Make sure "Developer mode" is ON
3. Check extension shows no errors on extensions page
4. Try reloading the extension (click reload button)
5. Refresh the webpage after reloading extension

**Check manifest.json matches pattern:**
- For local files: Extension needs `file://*/*` permission
- Check "Allow access to file URLs" is enabled in `chrome://extensions/`

### Issue: Console shows "No editable elements found"

**Solutions:**
1. Make sure page has input fields
2. Check if inputs match selectors in `domDetection.js`
3. Try focusing the input manually

**Test manually:**
```javascript
document.querySelectorAll('input, textarea, [contenteditable]').length
```
Should show number of inputs on page.

### Issue: Icon created but not visible

**Check these:**
```javascript
const icon = document.querySelector('.hate-detect-icon');
// Should not be null
console.log('Icon exists:', !!icon);

// Should be 'fixed'
console.log('Position:', icon?.style.position);

// Should be 'block'
console.log('Display:', icon?.style.display);

// Should have values
console.log('Coordinates:', icon?.style.top, icon?.style.left);

// Check z-index
console.log('Z-index:', icon?.style.zIndex);
```

### Issue: "document.body is not available"

This means DOM wasn't ready. Check:
```javascript
console.log('Body exists:', !!document.body);
console.log('Ready state:', document.readyState);
```

**Solution:** Manifest now uses `document_idle` which waits for DOM.

### Issue: Icon shows on wrong position

**Debug position:**
```javascript
const input = document.querySelector('input');
const rect = input.getBoundingClientRect();
console.log('Input rect:', rect);
console.log('Expected icon position:', {
    top: rect.bottom - 32,
    left: rect.right - 32
});
```

### Issue: Icon not updating score

**Check:**
1. Wait 1 second after typing (debounce)
2. Check API is working:
```javascript
apiClient.detectHateSpeech("test").then(console.log);
```

3. Look for these messages:
```
⏰ [HATE-DETECT] Scheduling score update...
🔍 [HATE-DETECT] Timer fired, updating score...
📝 [HATE-DETECT] Current text: ...
📡 [HATE-DETECT] Calling API for score update...
✅ [HATE-DETECT] API response: ...
📊 [HATE-DETECT] Calculated score: ...
🎨 [HATE-DETECT] Updating badge...
✅ [HATE-DETECT] Badge updated successfully
```

### Issue: Click not working

**Check:**
```javascript
const icon = document.querySelector('.hate-detect-icon');
const shadow = icon?.shadowRoot;
console.log('Shadow DOM exists:', !!shadow);
console.log('Button exists:', !!shadow?.querySelector('.icon-button'));
```

**Test click manually:**
```javascript
const icon = document.querySelector('.hate-detect-icon');
const button = icon?.shadowRoot?.querySelector('.icon-button');
button?.click();
```

## Using Debug Panel on Test Page

The [test-icon.html](test-icon.html) page has a debug panel in the bottom-right corner.

**It shows:**
- ✅ Extension detection status
- 📍 Focus/blur events
- ✏️ Input changes  
- 🎉 Icon detection
- All [HATE-DETECT] console messages

**If panel shows:**
- "Extension NOT detected" → Extension not loaded
- "API Client NOT loaded" → Check manifest.json includes apiClient.js
- No focus events when clicking inputs → Focus listeners not working
- "0 icon(s) found" → Icons not being created

## Step-by-Step Test Procedure

1. **Open test page** (test-icon.html)
2. **Open DevTools** (F12)
3. **Check console** for initialization messages
4. **Check debug panel** (bottom-right) for "Extension detected"
5. **Click on first input** field
6. **Watch console** for focus and icon injection messages
7. **Look for red icon** in bottom-right of input
8. **Type some text**
9. **Wait 1 second**
10. **Check for score badge** on icon
11. **Click icon**
12. **Check for tooltip**

## Extension Reload Process

When you make changes:

1. Go to `chrome://extensions/`
2. Find "Hate Speech Prevention & Protection"
3. Click reload icon 🔄
4. **Refresh all open tabs** where you want to test
5. Check console for initialization messages

## Manual Test Commands

**Force scan for inputs:**
```javascript
attachSendListeners();
```

**Force icon injection:**
```javascript
const input = document.querySelector('input');
injectIconIntoInput(input);
```

**Check what's marked:**
```javascript
document.querySelectorAll('.hate-detect-ready').length
document.querySelectorAll('.hate-detect-active').length
```

**Find all icons:**
```javascript
Array.from(document.querySelectorAll('.hate-detect-icon')).forEach((icon, i) => {
    console.log(`Icon ${i}:`, {
        display: icon.style.display,
        position: icon.style.position,
        top: icon.style.top,
        left: icon.style.left,
        visible: icon.offsetHeight > 0
    });
});
```

## Still Not Working?

**Collect this info:**

1. Browser version
2. Extension version
3. Console error messages
4. Screenshot of DevTools console
5. Screenshot of `chrome://extensions/` page showing extension
6. Result of these commands:
```javascript
console.log('Extension loaded:', typeof getEditableElements);
console.log('API loaded:', typeof apiClient);
console.log('Document ready:', document.readyState);
console.log('Body exists:', !!document.body);
console.log('Inputs found:', document.querySelectorAll('input, textarea').length);
console.log('Icons created:', document.querySelectorAll('.hate-detect-icon').length);
```

## Success Checklist

- [ ] Console shows initialization messages
- [ ] Extension detected in debug panel
- [ ] Focus events logged when clicking inputs
- [ ] Icon injection messages appear
- [ ] Red icon visible in input field
- [ ] Icon positioned bottom-right of input
- [ ] Badge appears 1 second after typing
- [ ] Click shows tooltip with score
- [ ] Score updates as you type

---

**If all checks pass but icon still not visible:**
Check your monitor scaling, zoom level, or try inspecting the icon element in DevTools to see its actual position.

**If console shows errors:**
Copy the exact error message and check what line it's failing on.
