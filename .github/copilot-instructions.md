# Crumbs Recipe App - AI Coding Assistant Instructions

## Tech Stack & Architecture

React Native recipe app built with Expo SDK 54:

-   **Framework**: React Native + Expo, TypeScript strict mode, React Compiler enabled
-   **Routing**: Expo Router file-based routing (`app/` directory), typed routes enabled
-   **State**: Zustand with AsyncStorage persistence + Firebase auth integration
-   **AI/ML**: Groq API (LLaVA vision model for image analysis, Whisper for audio transcription, Llama for text processing)
-   **Auth**: Firebase Authentication with React Native persistence + Firestore for user data
-   **Navigation**: Stack + Tabs hybrid (root stack for auth/modals, tabs for main app)
-   **Camera & Audio**: Expo Camera for pantry scanning, Expo AV for voice input
-   **Build**: New Architecture enabled, predictive back gesture disabled

## Project Structure

```
app/
├── _layout.tsx              # Root Stack (auth/onboarding/modals) + auth listener
├── (tabs)/_layout.tsx       # Bottom tabs (Home, Generate, Pantry, Community, Profile)
├── screens/                 # Feature screens by domain (Auth/, Pantry/, Recipe/, Community/, Settings/)
├── components/              # Reusable UI (modals, voice input, recipe cards)
├── store/useStore.ts        # Zustand global state (persisted: user, pantry, favorites, hasOnboarded)
├── api/                     # API layer (auth.ts, groqApi.ts, pantryAnalysis.ts, post-api.ts)
│   ├── auth.ts              # Firebase Auth wrapper (login/signup/logout/deleteAccount)
│   ├── groqApi.ts           # Groq vision/audio/text AI integration
│   ├── pantryAnalysis.ts    # High-level pantry item detection from images/audio
│   └── mockApi.ts           # Mock recipe generation (TODO: Replace with real AI)
├── firebase/config.ts       # Firebase initialization (Auth + Firestore)
├── utils/                   # Utilities (speechUtils, imageUtils, errorHandling, audioUtils)
├── theme/colors.ts          # Centralized semantic color tokens
└── types.ts                 # Domain types (User, Recipe, PantryItem, CommunityPost, Notification)
```

## State Management (Zustand)

### Access Pattern

```typescript
const user = useStore((s: StoreState) => s.user);
const addPantryItem = useStore((s: StoreState) => s.addPantryItem);
```

### Persisted State

`user`, `pantryItems`, `favorites`, `myRecipes`, `likedPosts`, `hasOnboarded`, `notifications` (via AsyncStorage)

### Key Actions

-   **Auth**: `login()`, `signup()`, `signOut()`, `deleteAccount()`, `resetPassword()`, `startAuthListener()` (called in root layout)
-   **Pantry**: `addPantryItem()`, `addBatchPantryItems()`, `updatePantryItem()`, `removePantryItem()`, `clearPantry()`
-   **Recipes**: `saveFavorite()`, `removeFavorite()`, `saveMyRecipe()`, `removeMyRecipe()`, `generateRecipeMock()`
-   **Community**: `loadPosts()`, `postCommunity()`, `likePost()`, `unlikePost()`
-   **Notifications**: `addNotification()`, `markNotificationAsRead()`, `markAllNotificationsAsRead()`, `clearAllNotifications()`

## AI Integration Architecture

### Groq API (`app/api/groqApi.ts`)

**Environment Variable Required**: `EXPO_PUBLIC_GROQ_API_KEY`

**Vision Analysis** (`analyzeImageForPantryItems(base64Image)`):

-   Model: `meta-llama/llama-4-scout-17b-16e-instruct`
-   Input: Base64 JPEG image
-   Output: `{ items: DetectedItem[], rawResponse: string }`
-   Extracts food items with name, category (12 predefined categories), quantity, confidence

**Audio Transcription** (`transcribeAudioForPantryItems(audioUri)`):

-   Currently uses mock transcription (TODO: Implement real Whisper API integration)
-   Extracts pantry items from transcribed text via Llama model

**AI Categorization** (`categorizePantryItem(itemName)`):

-   Model: `llama-3.1-8b-instant`
-   Auto-categorizes ingredient into 12 categories (vegetables, fruits, dairy & eggs, meat & poultry, seafood, grains & cereals, legumes & nuts, spices & herbs, oils & condiments, beverages, baking & desserts, frozen foods, canned goods)

**Helper Functions**:

-   `convertToPantryItems(detectedItems, userId?)`: Converts detected items to PantryItem format with AI categorization
-   `extractItemsFromText(text)`: Fallback parser if JSON extraction fails

### Pantry Analysis Layer (`app/api/pantryAnalysis.ts`)

High-level orchestration functions:

-   `analyzePantryItemsFromImage(imageUri, userId?)`: Image → Base64 → Groq vision → PantryItem[]
-   `analyzePantryItemsFromAudio(audioUri, userId?)`: Audio → Transcription → Item extraction → PantryItem[]

Returns `AnalysisResult` with `success`, `items`, `detectedItems`, `rawResponse`, `error?`

## Voice Input System

### Speech Recognition (`app/utils/speechUtils.ts`)

**Platform-specific implementations**:

-   **Mobile (iOS/Android)**: Expo AV recording → M4A file → Groq Whisper API transcription
-   **Web**: Browser Speech Recognition API (`useWebSpeechRecognition` hook)

**Recording Configuration**:

-   Sample rate: 16000 Hz
-   Format: M4A (mobile), WebM (web)
-   Bit rate: 128000

**Key Functions**:

-   `initializeSpeechRecognition()`: Request permissions + set audio mode
-   `startVoiceRecording()`: Create recording with platform-specific config
-   `stopVoiceRecording(recording)`: Stop and return URI
-   `transcribeAudio(audioUri)`: Upload to Groq Whisper API, parse transcript
-   `cleanupAudioFile(audioUri)`: Delete temp recording files

### VoiceInputModal Component

Full-featured voice input modal with:

-   Wave animations during recording (3 animated circles)
-   Auto-stop after 15s (configurable `maxDuration`)
-   Real-time recording timer
-   Haptic feedback on transcript success/error
-   Error handling with user-friendly messages
-   Platform detection for web vs mobile UI

**Usage Pattern**:

```typescript
<VoiceInputModal
    visible={showVoice}
    onClose={() => setShowVoice(false)}
    onTranscript={(text) => processIngredients(text)}
    title="Add Ingredients"
    maxDuration={15}
/>
```

## Error Handling

### Custom Error System (`app/utils/errorHandling.ts`)

```typescript
enum ErrorType {
    NETWORK,
    PERMISSION,
    API_QUOTA,
    PROCESSING,
    VALIDATION,
    UNKNOWN,
}

class AIProcessingError extends Error {
    type: ErrorType;
    recoverable: boolean;
    details?: string;
}
```

**Pattern**: Throw `AIProcessingError` in AI/API layers, catch in UI layer with `handleError(error)` to normalize errors into user-friendly messages.

## Firebase Integration

### Configuration (`app/firebase/config.ts`)

**Environment Variables Required** (all prefixed `EXPO_PUBLIC_`):

-   `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`

**Exports**:

-   `app`: Firebase app instance
-   `auth`: Auth instance with React Native persistence (AsyncStorage)
-   `db`: Firestore instance

### Auth Flow (`app/api/auth.ts`)

-   `loginWithEmail()`, `signupWithEmail()`: Return normalized `User` type via `toAppUser()`
-   `logout()`: Firebase signOut
-   `deleteAccount(password)`: Reauthenticate + delete user + Firestore cleanup
-   `subscribeToAuth(onAuthChanged)`: Real-time auth state listener (called via `startAuthListener()` in store)
-   `updateUserProfileInFirestore(userId, updates)`: Merge updates into Firestore user doc

### Community Posts (`app/api/post-api.ts`)

-   `postCommunityPost(uid, post)`: Write to Firestore `users/{uid}/communityPosts/{postId}`
-   `getCommunityPosts()`: Placeholder (TODO: Implement real Firestore query)

## Navigation Patterns

### Root Layout Auth Flow

```typescript
// app/_layout.tsx
if (user === undefined) return <ActivityIndicator />; // Auth loading state
```

Auth listener auto-started via `useEffect` → store updates → re-render with user or null

### Routing Convention

Use **full typed paths**: `router.push("/screens/Recipe/RecipeDetail")`
**Tabs** accessed via `/(tabs)` (tab names: `index`, `favorites`, `pantry`, `community`, `profile`)

### Stack Screens Organization

-   **Auth**: `screens/Auth/LoginScreen`, `SignupScreen`, `ForgotPasswordScreen`
-   **Onboarding**: `screens/Onboarding/Slide1`, `Slide2`, `Slide3`
-   **Pantry**: `screens/Pantry/PantryInput`, `CameraScreen`, `ManualEntry`, `PantryManage`
-   **Recipe**: `screens/Recipe/RecipeDetail`, `StepsOverview`, `StepDetail`
-   **Settings**: `screens/Settings/SettingsScreen`, `ChangePasswordScreen`, `DeleteAccountScreen`

## Component Patterns

### Modal Variants

**EditIngredientModal**: Full-screen modal with form validation, scrollable content, action buttons
**ModalSheet**: Bottom sheet modal (backdrop + sheet), quick actions, no form validation

### Styling Convention

```typescript
import { colors } from "../theme/colors";
const styles = StyleSheet.create({
    button: { backgroundColor: colors.accent },
    border: { borderWidth: StyleSheet.hairlineWidth },
});
```

**Always use semantic color tokens** (`colors.accent`, `colors.textMuted`), never raw hex values.

### Image Generation

`app/utils/imageUtils.ts` provides `generateFoodImage(itemName)` using Pollinations.ai API with deterministic seeds for consistent item images.

## Development Workflows

### Commands

```bash
npm start          # Expo dev server
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
npm run lint       # ESLint
```

### Environment Setup

1. Create `.env` file (not tracked in git)
2. Add `EXPO_PUBLIC_GROQ_API_KEY=<your-key>`
3. Add Firebase config vars (`EXPO_PUBLIC_apiKey`, etc.)

### Testing AI Features

-   **Vision**: Run `node test-groq.js` (tests image analysis with 1x1 PNG)
-   **Categorization**: Run `node test-categorize.js` (tests ingredient categorization)

### Debugging Tips

-   **Auth issues**: Check `startAuthListener()` called in root layout, verify Firebase config vars
-   **Voice not working**: Check permissions, verify Groq API key, check platform (web uses browser API)
-   **Navigation errors**: Ensure typed routes use full paths (`/screens/...`), check `_layout.tsx` screen declarations
-   **Persisted state not loading**: Check AsyncStorage, clear app data if corrupted

## Critical TODOs

1. **Recipe Generation**: Replace `generateRecipeMock()` in `mockApi.ts` with Groq vision + Llama-based recipe generation
2. **Audio Transcription**: Implement real Whisper API in `transcribeAudioForPantryItems()` (currently mock)
3. **Community Backend**: Replace in-memory `communityPosts` with Firestore queries (`getCommunityPosts()`)
4. **Type Safety**: Consider splitting `types.ts` into domain-specific files if it exceeds 150 lines

## Integration Patterns

**Adding New AI Features**:

1. Add function to `groqApi.ts` with error handling
2. Create wrapper in domain-specific file (e.g., `pantryAnalysis.ts`)
3. Throw `AIProcessingError` on failures
4. UI layer catches and calls `handleError()` for user messages

**Adding New Persisted State**:

1. Add property to `StoreState` interface
2. Add to `persist()` middleware whitelist
3. Add action methods
4. Use via `useStore((s) => s.yourProperty)`

**Adding New Screens**:

1. Create in `app/screens/[Domain]/YourScreen.tsx`
2. Add to `<Stack.Screen>` in `app/_layout.tsx` or tabs
3. Navigate via `router.push("/screens/Domain/YourScreen")`
