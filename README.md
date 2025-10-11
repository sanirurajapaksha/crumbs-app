# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

    ```bash
    npm install
    ```

2. Configure environment variables

    Copy `.env.example` to `.env` and add your Groq API key:

    ```bash
    cp .env.example .env
    ```

    Get a free API key from [Groq Console](https://console.groq.com)

3. Start the app

    ```bash
    npx expo start
    ```

In the output, you'll find options to open the app in a

-   [development build](https://docs.expo.dev/develop/development-builds/introduction/)
-   [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
-   [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
-   [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

### Theming

All color values are centralized in `app/theme/colors.ts`. Import the palette like:

```ts
import { colors } from "../theme/colors";

const styles = StyleSheet.create({
    button: { backgroundColor: colors.accent },
    textMuted: { color: colors.textSecondary },
});
```

Add new colors semantically (e.g. `warning`, `surfaceAlt`) rather than raw hex names.

## Features

### 🎤 Voice Input

Add ingredients to your pantry using voice commands! See [VOICE_INPUT_GUIDE.md](./VOICE_INPUT_GUIDE.md) for detailed documentation.

-   **Mobile**: Tap microphone → speak ingredients → automatic transcription via Groq Whisper API
-   **Web**: Uses browser's built-in speech recognition
-   **Smart Parsing**: Automatically splits multiple ingredients from single voice input
-   Available on: ManualEntry and PantryInput screens

### 📸 Camera Scanning

Scan pantry items with your camera (feature in development)

### 🤖 AI Categorization

Ingredients are automatically categorized using AI when added manually

### 🔐 Firebase Authentication

Secure login and signup with Firebase Authentication

## Join the community

Join our community of developers creating universal apps.

-   [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
