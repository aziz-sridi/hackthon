# 🔒 Comment Blur & Rewrite Feature Guide

## ✅ What's New

### 1. **Minimal Logging** 
- Reduced verbose logs to essential swap detection only
- Now only shows: `✅ Swapped: [old text]... → [new text]...`
- Errors still logged for debugging

### 2. **Automatic Comment Detection & Blur**
Comments with hate speech are now **automatically blurred** when you browse social media!

**How it works:**
- Extension scans all comments/posts/DMs on Facebook & Instagram
- Calls backend API to detect hate speech
- **If hate score ≥ 40%**: Comment is automatically blurred
- Red 🚨 button appears on blurred content

### 3. **Rewrite Option in Blur Menu**
When you click the 🚨 button on blurred content, you get 3 options:

1. **👁️ Unblur** - View the original hateful comment
2. **✨ Rewrite** - Replace hate speech with respectful version (NEW!)
3. **Keep Blurred** - Leave content hidden

## 🎨 Visual Flow

```
User browses → Comment detected → API analyzes → Hate found (score ≥ 40%)
                                                          ↓
                                             Comment auto-blurred
                                                          ↓
                                       Red 🚨 button appears
                                                          ↓
                                       User clicks 🚨 button
                                                          ↓
                                            Menu appears:
                                    ┌────────────────────────┐
                                    │  Content Filtered      │
                                    │  Category: Bullying    │
                                    │  ⚠️ This might come    │
                                    │  out as hurtful...     │
                                    ├────────────────────────┤
                                    │  👁️ Unblur            │
                                    │  ✨ Rewrite           │
                                    │  Keep Blurred          │
                                    └────────────────────────┘
                                                ↓
                           User clicks "✨ Rewrite"
                                                ↓
                    Hateful text replaced with respectful version
                                                ↓
                              Content automatically unblurred
```

## 🧪 Testing

### 1. Start Backend
```powershell
cd backend_extension
python app.py
```

### 2. Load Extension
- Chrome → `chrome://extensions/`
- Load unpacked → Select `extension` folder

### 3. Test Blur & Rewrite

**Option A: Visit Social Media**
1. Go to Facebook or Instagram
2. Find or post a comment with hate speech (e.g., "You're an idiot")
3. Wait a few seconds - it should automatically blur
4. Click the red 🚨 button
5. Click "✨ Rewrite" to replace with respectful text

**Option B: Use Test Page**
1. Open [test-swap.html](d:\hackthon\test-swap.html)
2. Type hateful text (e.g., "You're stupid")
3. Click HS icon to see rewrites
4. Click green rewrite box to swap text

## 📊 Detection Thresholds

| Score | Action | Example |
|-------|--------|---------|
| 0-39% | No blur | "I disagree with you" |
| 40-69% | Blur (medium) | "You're dumb" |
| 70-100% | Blur (high) | "You should die" |

## 🎯 Rewrite Feature Details

### When is Rewrite Available?
- Only shown when backend returns rewrite suggestions
- Categories: **Bullying** typically gets rewrites
- Serious hate (Racism, Sexism, etc.) may not have rewrites

### What Happens When You Click Rewrite?
1. Original hateful text is **replaced** with respectful version
2. Comment is **unblurred** automatically
3. No undo (user must refresh to see original)

### Example Transformations
```
Before (blurred):    "You're an idiot and pathetic"
After (rewritten):   "I disagree with this perspective."

Before (blurred):    "Go away loser"
After (rewritten):   "I'd prefer if we didn't interact."

Before (blurred):    "You're so dumb"
After (rewritten):   "I see things differently."
```

## 🔧 Technical Details

### API Integration
```javascript
// Detection happens in filterHateContent()
const result = await apiClient.detectHateSpeech(commentText);

if (result.is_hate && result.score >= 0.4) {
  applyBlurOverlay(element, {
    category: result.category,
    message: result.message,
    rewrites: result.rewrites,
    originalText: commentText
  });
}
```

### Rewrite Implementation
```javascript
// Rewrite button in blur menu
menu.querySelector('[data-action="rewrite"]').addEventListener('click', (e) => {
  const rewriteText = detectionResult.rewrites[0];
  targetBlurElement.textContent = rewriteText;
  toggleBlur(false); // Unblur after rewriting
  console.log('✅ Comment rewritten');
});
```

## 🐛 Troubleshooting

### Comments not blurring?
- Check backend is running on `localhost:5000`
- Open console (F12) - should see: `⚠️ Hate detected (XX%): ...`
- Try refreshing the page

### Rewrite button not showing?
- Backend must return `rewrites` array in response
- Check API response in Network tab (F12)
- Try more obvious hate speech examples

### Blur persists after rewrite?
- This is intentional - rewrite should automatically unblur
- If not, check console for errors

## 📝 Console Output (Minimal)

**Normal flow:**
```
✅ Hate speech detection active
⚠️ Hate detected (65%): You're an idiot...
✨ Rewriting hateful comment...
✅ Comment rewritten: I disagree with this...
```

**Error flow:**
```
❌ Detection failed: Network error
❌ Text swap failed: Element not found
```

## 🎨 Button Styling

The new **✨ Rewrite** button has:
- Beautiful purple gradient background
- Hover animation (lifts up slightly)
- Distinct from Unblur (blue) and Keep Blurred (gray)

## 🚀 Next Steps

Potential enhancements:
- [ ] Show multiple rewrite options to choose from
- [ ] Add "Report" option to flag false positives
- [ ] Allow users to customize blur threshold
- [ ] Add undo functionality for rewrites
- [ ] Preview rewrite before applying
