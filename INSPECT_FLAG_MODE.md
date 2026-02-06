# 🔍 Inspect-Style Flag Mode

## Quick Start

Press **`Ctrl + Shift + F`** to activate Inspect Mode for flagging content.

---

## How It Works

### 1️⃣ **Activate Inspect Mode**
- Press `Ctrl + Shift + F`
- Notification appears: "🔍 Inspect Mode Active"
- Cursor changes to crosshair
- Page is now in inspection mode

### 2️⃣ **Hover Over Content**
Elements are highlighted as you hover:
- **Blue outline** appears around the element
- **Tooltip** shows element info:
  - Tag name (e.g., `div`, `article`)
  - Class name
  - Text preview
  - Example: `div.comment | "This is the comment text..."`

### 3️⃣ **Click to Flag**
Click on any highlighted element:
- Flag menu appears with options:
  - 😡 **Hate Speech**
  - 🤬 **Offensive Language**
  - 👿 **Harassment**
  - 😰 **Makes Me Uncomfortable**
  - ❌ Cancel

### 4️⃣ **Content Gets Blurred**
After selecting a flag type:
- Content is immediately **blurred**
- **Warning overlay** appears with:
  - "🚩 Flagged by You"
  - The flag type you selected
  - Two buttons:
    - **👁️ Show Content** - Reveals but keeps "You Flagged This" badge
    - **🗑️ Remove** - Completely removes with placeholder

---

## Features

### 🎯 **Smart Element Detection**
The system intelligently finds content containers by:
- Checking common selectors (comments, messages, posts)
- Scoring elements based on:
  - Text content (5-1000 characters)
  - Dimensions (reasonable size)
  - Structure (has children but not too many)
  - Semantic tags (article, section, div, etc.)

### 🏷️ **Element Info Tooltip**
Shows detailed element information:
```
tagname#id.classname | "text preview..."
```
Example:
```
div.comment-text | "I really love this post and..."
```

### ✨ **Inspect-Style Highlighting**
- Blue outline (like browser DevTools)
- Light blue background tint
- Crosshair cursor
- Smooth transitions

### 🚨 **Immediate Blur**
Once flagged:
- Content blurs instantly (10px filter)
- Cannot be accidentally re-flagged
- Stored in flagged elements set
- Logged to console with HTML snippet

---

## Visual Feedback

### Inspect Mode Active
```
┌─────────────────────────────────────────┐
│ 🔍 Inspect Mode Active - Hover over    │
│ content to inspect, click to flag      │
└─────────────────────────────────────────┘
```

### Hovering
```
┌─────────────────────────────────┐
│ div.message | "Hello world..."  │  ← Tooltip
└─────────────────────────────────┘
╔═══════════════════════════════════╗
║  This is the content being       ║  ← Blue outline
║  highlighted for inspection      ║
╚═══════════════════════════════════╝
```

### After Flagging
```
╔════════════════════════════════╗
║    🚩 Flagged by You          ║
║                                ║
║  You flagged this as:          ║
║  😡 Hate Speech                ║
║                                ║
║  [👁️ Show] [🗑️ Remove]        ║
╚════════════════════════════════╝
    (Blurred content below)
```

---

## Console Logs

All actions are logged with emoji prefixes:

```javascript
🚩 [HATE-DETECT] Flag mode ACTIVATED
🔍 [HATE-DETECT] Inspect Mode Active
🚩 [HATE-DETECT] Flagging element as: hate
✅ [HATE-DETECT] Element flagged and blurred:
   {
     type: "hate",
     label: "😡 Hate Speech",
     text: "...",
     html: "<div class='comment'>...</div>"
   }
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + F` | Toggle Inspect/Flag Mode |

---

## Smart Detection Logic

### Priority Selectors (checked first)
1. `[aria-label*="Comment by"]` - Facebook comments
2. `[aria-label*="Conversation with"]` - Instagram DMs
3. `[class*="message"]` - Chat messages
4. `[class*="chat-"]` - Chat bubbles
5. `[role="article"]` - Posts and articles
6. `[role="row"]` - Table rows (messages)
7. `.comment` - Generic comments
8. `[data-testid="tweet"]` - Twitter tweets

### Smart Scoring System
If no selector matches, scores elements by:

| Criteria | Points |
|----------|--------|
| Text length 5-1000 chars | +10 |
| Text length > 20 chars | +5 |
| Width 100-800px | +5 |
| Height 30-600px | +5 |
| Has 1-20 children | +3 |
| Semantic tag | +2 |

Minimum score of 10 required to be flaggable.

---

## Examples

### Example 1: Facebook Comment
```
1. Press Ctrl+Shift+F
2. Hover over a comment
   → Tooltip: article.comment | "Great post! I really..."
3. Click the comment
4. Select: 😰 Makes Me Uncomfortable
5. Comment instantly blurs with overlay
```

### Example 2: Instagram DM
```
1. Press Ctrl+Shift+F
2. Hover over a message in DM
   → Tooltip: div.message | "Hey, how are you doing..."
3. Click the message
4. Select: 🤬 Offensive Language
5. Message blurs immediately
```

### Example 3: Twitter Tweet
```
1. Press Ctrl+Shift+F
2. Hover over a tweet
   → Tooltip: article[data-testid="tweet"] | "Just tweeted about..."
3. Click the tweet
4. Select: 👿 Harassment
5. Tweet blurs with flag overlay
```

---

## Technical Details

### Element Storage
```javascript
element.__flagType = 'hate'
element.__flagLabel = '😡 Hate Speech'
element.__flagTimestamp = 1675632000000
element.__hateFiltered = true
element.__hateOverlay = <div>...</div>
```

### Flagged Elements Set
All flagged elements stored in:
```javascript
flaggedElements: Set<HTMLElement>
```

### State Variables
```javascript
flagModeActive: boolean         // Is inspect mode on?
currentHighlightedElement: HTMLElement  // Currently hovered element
highlightTooltip: HTMLElement   // The info tooltip
```

---

## Limitations

- Cannot flag elements already blurred
- Skips overlay buttons and UI elements
- Maximum 8 levels up parent tree
- Text must be 5+ characters
- Element must have reasonable dimensions

---

## Tips

✅ **Best Practices:**
- Hover to see element boundaries before clicking
- Use the tooltip to confirm you're selecting the right element
- Can be used on any text-containing element
- Works on dynamic content (DMs, comments, posts)

❌ **Avoid:**
- Clicking on buttons or links (won't flag them)
- Flagging very large sections (flag specific content)
- Flagging the same element twice (already marked)

---

## Integration with API

When integrating your API, flagged content is logged with:
- Flag type
- Flag label
- Text content (first 100 chars)
- HTML structure (first 200 chars)
- Timestamp

Add your API call in the `flagElement()` function:

```javascript
function flagElement(element, flagType, flagLabel) {
  // ... existing code ...
  
  // YOUR API CALL HERE
  await yourApiClient.reportContent({
    type: flagType,
    label: flagLabel,
    text: element.textContent,
    html: element.outerHTML,
    url: window.location.href,
    timestamp: Date.now()
  });
}
```

---

## Troubleshooting

### Inspect mode not activating?
- Check if `Ctrl+Shift+F` conflicts with browser shortcuts
- Verify Feature 2 is enabled in settings
- Check console for errors

### Elements not highlighting?
- Ensure cursor is in crosshair mode
- Try hovering over different parts of content
- Check if element has text content

### Wrong element being highlighted?
- Smart detection prioritizes meaningful content
- Hover to see what will be selected
- Click the most specific part of content

---

**Ready to try it?** Press `Ctrl + Shift + F` and start inspecting! 🔍
