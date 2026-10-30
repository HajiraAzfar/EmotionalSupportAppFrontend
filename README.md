# Reframe — Android app

React Native app for **Reframe**: guided CBT journals, an AI chat companion, crisis-aware safeguards, insights and a learning library. The AI is a support companion, not a therapist. The project log is `DEVLOG.md`, beside this repository; the API is [emotional-support-backend](https://github.com/HajiraAzfar/emotional-support-backend).

## Run

```bash
npm install
npm start          # Metro
npm run android    # in a second terminal
```

Debug builds talk to a local backend at `10.0.2.2:8000`; release builds talk to the deployed backend.

## Release APK

```bash
cd android
./gradlew assembleRelease
```

The APK is at `android/app/build/outputs/apk/release/app-release.apk`. It is signed with the debug keystore, so it is for sideloading only. Changes on the server, such as knowledge cards, reach the app with no new APK.

## Test

```bash
npm test
npx tsc --noEmit
npm run lint
```

## Where things are

| Area | Path |
| --- | --- |
| AI Chat and journal threads (New chat, End & save) | `src/screens/ChatEntryScreen.tsx`, `ChatTabScreen.tsx` |
| Check-ins | `src/screens/CheckIn*.tsx` |
| Saving, Thought and Exposure journals | `src/savoring/`, `src/thought/`, `src/exposure/` |
| Breathing and grounding | `src/calm/` |
| API calls | `src/api/` |
| Colours, fonts, spacing | `src/theme.ts` |

Edge-to-edge is on, so Android does not resize the window for the keyboard: a screen with text input needs `KeyboardAvoidingView` with `behavior="padding"`.
