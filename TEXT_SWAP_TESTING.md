# 🔄 Text Swap Testing Guide

## What Was Fixed

The extension now properly **swaps/replaces** text when you click a rewrite suggestion!

### Changes Made:

1. ✅ **apiClient.js** - Added `window.apiClient = apiClient` for global access
2. ✅ **contentScript.js** - Updated all text getters/setters to use `window.getEditableText` and `window.setEditableText`
3. ✅ **contentScript.js** - Enhanced rewrite click handlers with:
   - Explicit `window.setEditableText()` calls
   - Fallback method if window functions unavailable
   - Proper focus management
   - Event dispatching for UI updates
   - Better error logging

## How to Test

### 1. Start Backend
```powershell
cd backend_extension
python app.py
```
Backend must be running on `http://localhost:5000`

### 2. Load Extension
1. Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. "Load unpacked" → Select `extension` folder

### 3. Test with HTML Test Page
Open: `test-swap.html` in Chrome

**What to expect:**
- ✅ Page shows "Extension Loaded!" and "Backend Connected!"
- ✅ Type offensive text in any field
- ✅ HS icon appears with score badge
- ✅ Click HS icon → See rewrites in green boxes
- ✅ Click a green rewrite → **TEXT INSTANTLY CHANGES!**

### 4. Test on Real Social Media

Visit Instagram, Facebook, or Twitter:

1. **Type offensive text**: "You're an idiot"
2. **Wait 1 second** - Score badge appears
3. **Click HS icon** - Popup shows:
   - Score: 65/100 🟠
   - Warning: "⚠️ This might come out as hurtful..."
   - Rewrite: "I disagree with this perspective." (in green box)
4. **Click the green rewrite box**
5. **✨ Your text instantly changes to the rewrite!**

## Debugging

### Check Browser Console (F12)

**Good logs:**
```
✅ [HATE-DETECT] Extension loaded
✅ Backend session established
🔄 [HATE-DETECT] Rewrite clicked: I disagree...
✅ [HATE-DETECT] Applied rewrite using window.setEditableText
```

**Bad logs:**
```
❌ window.setEditableText is not a function
⚠️ Cannot apply rewrite - missing text or element
```

### Common Issues & Fixes

**Issue:** Text doesn't swap when clicking rewrite  
**Fix:** Check console - should see "Applied rewrite" log. If not, extension might not be loaded properly. Reload extension and page.

**Issue:** HS icon doesn't appear  
**Fix:** Make sure you're typing in a supported field (textarea, input, contenteditable). Check console for detection logs.

**Issue:** Backend connection failed  
**Fix:** Ensure backend is running on port 5000. Check CORS is enabled in app.py.

**Issue:** No rewrites shown  
**Fix:** Backend might not be detecting hate speech. Try more obvious examples like "You're stupid" or check backend logs.

## Testing Checklist

- [ ] Backend server running
- [ ] Extension loaded in Chrome
- [ ] test-swap.html shows all green checkmarks
- [ ] Typing in textarea shows HS icon
- [ ] Typing offensive text shows score badge
- [ ] Clicking HS icon shows popup with rewrites
- [ ] Rewrites appear as clickable green boxes
- [ ] **Clicking rewrite SWAPS the text in input**
- [ ] New text triggers re-analysis (badge updates)

## What Should Happen

### Before Fix:
❌ Click rewrite → Nothing happens  
❌ Text stays the same  
❌ User confused

### After Fix:
✅ Click rewrite → Text instantly changes  
✅ Input updates with rewrite  
✅ Score recalculates for new text  
✅ Smooth user experience

## Technical Details

### How Text Swapping Works

1. User clicks green rewrite box
2. Event handler extracts rewrite text from `data-rewrite` attribute
3. Focuses the input element
4. Calls `window.setEditableText(element, rewriteText)` which:
   - For `<textarea>` or `<input>`: Sets `.value`
   - For contenteditable: Sets `.textContent`
   - Dispatches `input` and `change` events
5. Refocuses element to keep cursor active
6. Closes tooltip
7. Schedules score update for new text

### Fallback Mechanism

If `window.setEditableText` is unavailable (shouldn't happen), the code has a fallback that:
- Manually sets text based on element type
- Manually dispatches events
- Still works but logs a warning

This ensures text swapping works even if something goes wrong with script loading order.
