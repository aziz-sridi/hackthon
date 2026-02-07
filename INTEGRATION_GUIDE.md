# 🔗 Backend-Extension Integration Guide

## Overview

The extension now connects to the backend to detect hate speech in real-time using AI (HuggingFace/LLaMA). When users type potentially harmful content, they receive:

- ⚡ **Real-time hate speech score** (0-100)
- ⚠️ **Warning message** ("This might come out as hurtful...")
- 💡 **AI-powered rewrites** (clickable suggestions to replace offensive text)

## Architecture

```
User Types → Extension Content Script → Backend API → HuggingFace AI → Response with Score & Rewrites → Display Warning & Suggestions
```

## Setup & Testing

### 1. Start the Backend Server

```powershell
cd backend_extension
pip install -r requirements.txt
python app.py
```

Backend runs on: `http://localhost:5000`

### 2. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder

### 3. Test on Social Media

Visit any social media site (Facebook, Instagram, Twitter) and type in a text field. The HS icon will appear.

## Features

### 🎯 Real-Time Detection

As you type, the extension:
- Shows hate speech score badge on the HS icon
- Updates score automatically (1-second delay after typing stops)
- Uses caching to avoid redundant API calls

### ⚠️ Warning Messages

When hate speech is detected, you'll see messages like:

- **High severity**: "⚠️ This might come out as hurtful. Your message contains racism and may seriously offend others."
- **Medium severity**: "⚠️ This might come out as hurtful. Your message may be perceived as offensive."
- **Low severity**: "⚠️ This might come out as hurtful. Consider rephrasing to be more respectful."

### 💡 AI-Powered Rewrites

Click the HS icon to see:
- Your hate speech score (color-coded: 🔴 Red=High, 🟠 Orange=Medium, 🟢 Green=Safe)
- Warning message
- **Clickable rewrite suggestions** - Click any suggestion to instantly replace your text!

## API Endpoints

### `/api/connect` (POST)
Establishes session with the backend. Sets `session_id` cookie.

**Response:**
```json
{
  "stored_items_count": 0
}
```

### `/api/detect` (POST)
Detects hate speech in input text.

**Request:**
```json
{
  "text": "You're an idiot"
}
```

**Response:**
```json
{
  "is_hate": true,
  "score": 0.65,
  "category": "Bullying",
  "sentiment": "negative",
  "severity": "medium",
  "message": "⚠️ This might come out as hurtful. Your message may be perceived as offensive.",
  "rewrites": [
    "I disagree with this perspective."
  ]
}
```

## Session Management

- Uses **HTTP cookies** (not request body) for session tracking
- Session created on first `/api/connect` or `/api/detect` call
- Cookie: `session_id` (httponly, SameSite=None)

## Testing Examples

### Example 1: Bullying (Low Severity)
**Input:** "You're dumb"  
**Expected:** Score ~40-60, message about being hurtful, rewrite suggestion

### Example 2: Bullying (High Severity)
**Input:** "You should go kill yourself"  
**Expected:** Score ~80-95, severe warning, rewrite suggestion

### Example 3: Racism/Sexism
**Input:** "I hate all women"  
**Expected:** Score ~95, strong warning about sexism, empty rewrite (serious hate)

### Example 4: Safe Content
**Input:** "Have a nice day!"  
**Expected:** Score 0, green badge, "Your message looks good!"

## Troubleshooting

### Extension not detecting?
- Check browser console for errors (F12)
- Verify backend is running on port 5000
- Check CORS is enabled (`supports_credentials=True`)

### Backend errors?
- Ensure `.env` file exists with `HUGGINGFACEHUB_API_TOKEN`
- Check `requirements.txt` packages are installed
- Verify HuggingFace API token is valid

### Session cookie not set?
- Check browser allows third-party cookies
- Verify `SameSite=None` in production with HTTPS

## Files Modified

### Backend
- ✅ `backend_extension/app.py` - Added `/api/detect` endpoint with cookie-based sessions
- ✅ `backend_extension/hugface2.py` - Already has hate detection + rewrite logic

### Extension
- ✅ `extension/utils/apiClient.js` - Connects to backend with credentials
- ✅ `extension/contentScript.js` - Shows warnings and clickable rewrites

## Next Steps

- [ ] Add more rewrite alternatives (currently 1-2 suggestions)
- [ ] Implement user feedback on rewrites
- [ ] Add settings to customize sensitivity
- [ ] Deploy backend to production server
