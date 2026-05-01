# ⚽ RefCheck

A proof-of-concept React Native (Expo) app for detecting soccer/football faults in video clips using AI. Think of it as a Snapchat-style camera app that records short clips and asks an AI whether a foul was committed.

---

## Features

- 📷 **Live camera preview** — full-screen camera view, ready to record at any time
- ⏺️ **Hold-to-record button** — press and hold the circular button to record; release to stop
- 🖼️ **Gallery picker** — tap the gallery icon to pick an existing video from your device
- 🤖 **AI analysis** — automatically analyzes the clip after recording (Gemini or Mock mode)
- 🏁 **Verdict popup** — displays one of three statuses:
  - ⚠️ **FAULT** (red) — a foul was detected
  - ✅ **NOT FAULT** (green) — no foul detected
  - ❓ **INCONCLUSIVE** (orange) — could not determine
- 💬 **Expandable reasoning** — tap "View Reasoning" to see the AI's full explanation
- ⚙️ **API key settings** — tap the gear icon to configure your AI provider and API key

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) or use `npx expo`
- [Expo Go app](https://expo.dev/client) on your iOS/Android device (for testing)

### Install & Run

```bash
# Install dependencies
npm install

# Start the development server
npm start
# or
npx expo start
```

Then scan the QR code with **Expo Go** on your phone.

---

## AI Configuration

Tap the **⚙️ gear icon** (top-right) to open settings:

| Provider | Description |
|----------|-------------|
| **Gemini** | Uses Google's Gemini 1.5 Flash API. Get a free key at [aistudio.google.com](https://aistudio.google.com) |
| **Mock** | Simulates AI analysis locally — no API key needed, great for testing |

> **Note:** This is a proof of concept. API keys are stored locally in AsyncStorage (not encrypted). Do not use production keys.

---

## Project Structure

```
src/
├── screens/
│   └── CameraScreen.js     # Main camera + recording screen
├── components/
│   ├── RecordButton.js      # Hold-to-record circular button
│   ├── StatusModal.js       # FAULT / NOT FAULT / INCONCLUSIVE popup
│   └── APIKeyModal.js       # AI settings form
└── services/
    └── aiAnalysis.js        # Gemini API integration + mock mode
```

---

## Permissions Required

- **Camera** — to show live preview and record clips
- **Microphone** — to record audio with video
- **Photo Library** — to pick videos from the gallery (optional)
