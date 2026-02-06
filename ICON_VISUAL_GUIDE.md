# Icon Visual Guide

## What You'll See

### 1. Icon Appearance (Default State)
```
┌─────────────────────────────────────────┐
│  Input field with your text...      [HS]│  ← Red circular icon
└─────────────────────────────────────────┘
                                        ↑
                               Bottom-right position
```

### 2. Icon with Score Badge
```
┌─────────────────────────────────────────┐
│  This is some text I'm typing...   [HS] │
└─────────────────────────────────────────┘
                                       ↑
                                     [72] ← Score badge (auto-updates)
```

### 3. When Clicked - Detailed Tooltip
```
┌─────────────────────────────────────────┐
│  Input field...                     [HS] │
└─────────────────────────────────────────┘
                               ┌───────────────────────┐
                               │ Hate Speech Score   × │
                               ├───────────────────────┤
                               │                       │
                               │         72            │ ← Large score
                               │        WARNING        │ ← Status
                               │                       │
                               │ Suggestions:          │
                               │ • Consider rephrasing │
                               │ • Avoid offensive...  │
                               │ • Focus on issue...   │
                               └───────────────────────┘
```

## Color Scheme

### Icon Colors
- **Background**: Red gradient (#e74c3c → #c0392b)
- **Text**: White (#ffffff)
- **Border**: White (2px)
- **Shadow**: Soft red glow

### Score Badge Colors
- 🟢 **0-39** = Green (#27ae60) - "Safe"
- 🟠 **40-69** = Orange (#f39c12) - "Warning"  
- 🔴 **70-100** = Red (#e74c3c) - "High Risk"

## States

### Hover State
- Icon scales up 1.1x
- Shadow becomes more prominent
- Smooth transition (0.2s)

### Active/Click State
- Icon scales down 0.95x
- Provides click feedback
- Tooltip appears

### No Text State
- Icon visible but no score badge
- Clicking shows "No text to analyze" message

## Size Specifications

- **Icon**: 24px × 24px (circular)
- **Score Badge**: 16px × auto (min-width)
- **Tooltip**: 280px × auto
- **Icon Position**: 8px from bottom, 8px from right edge of input

## Animation Details

### Icon Appearance
- Fades in when input is focused
- Position updates on scroll/resize
- Smooth transitions

### Tooltip Animation
- Slides up from icon (translateY)
- Fades in (opacity 0 → 1)
- Duration: 0.2 seconds
- Easing: ease

### Score Badge Update
- Appears with smooth transition
- Color changes based on score
- Updates every 1 second after typing stops

## Real-World Example

### Low Score (Friendly Message)
```
Input: "Have a great day! Let's work together."
Icon: [HS] with green [12] badge
Click shows:
  Score: 12
  Status: SAFE ✓
  Suggestions:
  • Your message looks good!
  • Keep maintaining a respectful tone
```

### Medium Score (Borderline)
```
Input: "I don't like your ideas at all."
Icon: [HS] with orange [45] badge
Click shows:
  Score: 45
  Status: WARNING ⚠
  Suggestions:
  • Consider rephrasing your message
  • Focus on the issue rather than personal attacks
```

### High Score (Hateful)
```
Input: "You're stupid and worthless."
Icon: [HS] with red [85] badge
Click shows:
  Score: 85
  Status: WARNING ⚠
  Suggestions:
  • Consider rephrasing your message to be more respectful
  • Avoid using offensive or discriminatory language
  • Focus on the issue rather than personal attacks
```

## Responsive Behavior

### On Scroll
- Icon follows input field
- Position recalculates dynamically
- No flickering or lag

### On Resize
- Icon repositions automatically
- Maintains bottom-right corner position
- Tooltip adjusts if needed

### On Input Field Move
- Detects field position changes
- Updates icon position
- Handles dynamic page layouts

## Browser DevTools View

### DOM Structure
```html
<div class="hate-detect-icon" style="position: fixed; ...">
  #shadow-root (open)
    <style>...</style>
    <div class="icon-button">
      <span class="icon-text">HS</span>
      <div class="score-badge show high">72</div>
    </div>
    <!-- Tooltip appears here when clicked -->
</div>
```

### CSS Classes Applied to Input
```html
<textarea class="hate-detect-ready hate-detect-active">
  Your text here...
</textarea>
```

## Accessibility

- **Click Target**: 24×24px (meets minimum 24px requirement)
- **Keyboard**: Can be focused with Tab (if needed)
- **Screen Readers**: Icon has semantic meaning
- **Contrast**: High contrast (white on red)

## Performance

- **Debouncing**: 1 second delay after typing
- **Caching**: API results cached to reduce calls
- **Shadow DOM**: Isolated styles, no page conflicts
- **Event Listeners**: Efficiently managed, cleaned up on removal

## Troubleshooting

### Icon Not Appearing?
1. Check browser console for errors
2. Verify extension is loaded
3. Make sure you're on a supported site
4. Try refreshing the page

### Score Not Updating?
1. Wait 1 second after typing
2. Check if API is responding (console)
3. Clear extension cache
4. Reload extension

### Tooltip Not Showing?
1. Make sure icon is clickable (not covered by other elements)
2. Check z-index conflicts
3. Look for JavaScript errors in console

### Position Issues?
1. Check if page has complex CSS transforms
2. Verify input field is not inside iframe
3. Test on different scroll positions

## Comparison to Grammarly

| Feature | Grammarly | Our Implementation |
|---------|-----------|-------------------|
| Position | Bottom-right | ✓ Bottom-right |
| Always Visible | Yes | ✓ Yes |
| Clickable | Yes | ✓ Yes |
| Score Display | Yes | ✓ Yes (0-100) |
| Suggestions | Yes | ✓ Yes |
| Auto-Update | Yes | ✓ Yes (1s debounce) |
| Shadow DOM | Yes | ✓ Yes |
| Animations | Yes | ✓ Yes |

## Next: How to Test

1. **Load extension** in Chrome
2. **Open** [test-icon.html](test-icon.html)
3. **Type** in any input field
4. **Click** the red HS icon
5. **See** hate score and suggestions

---

**Visual Guide Complete** ✅
