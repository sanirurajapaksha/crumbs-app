# Crumbs Recipe App - AI Coding Assistant Instructions

## Tech Stack & Architecture

This is a React Native recipe app built with Expo SDK 54. Key components:
- **Framework**: React Native + Expo, TypeScript strict mode, React Compiler enabled
- **Routing**: Expo Router with file-based routing (`app/` directory), typed routes enabled
- **State**: Zustand with AsyncStorage persistence + Firebase auth integration
- **Auth**: Firebase Authentication with React Native persistence
- **Navigation**: Stack + Tabs hybrid navigation pattern
- **API**: Firebase Auth (production) + Mock API layer for recipe/community features
- **Camera**: Expo Camera for pantry item scanning (requires permissions)
- **Build**: New Architecture enabled, predictive back gesture disabled

## Project Structure Patterns

### Directory Layout
```
app/
├── _layout.tsx          # Root Stack Navigator (auth + feature flows)
├── (tabs)/              # Bottom tab navigation (main app)
├── screens/             # Feature-specific screen groups
├── components/          # Reusable UI components
├── store/useStore.ts    # Zustand global state
├── api/mockApi.ts       # Mock backend simulation
├── theme/colors.ts      # Centralized color palette
└── types.ts             # Domain types (User, Recipe, PantryItem, etc.)
```

### Navigation Architecture
- **Root Stack** (`app/_layout.tsx`): Handles auth, onboarding, and modal flows
- **Tab Navigator** (`app/(tabs)/_layout.tsx`): Main app sections (Home, Pantry, Community, etc.)
- **Feature Screens**: Organized by domain (`screens/Pantry/`, `screens/Recipe/`)

## State Management Patterns

### Zustand Store (`app/store/useStore.ts`)
```typescript
// State access pattern
const user = useStore((s: StoreState) => s.user);
const pantryItems = useStore((s: StoreState) => s.pantryItems);

// Actions pattern
const addPantryItem = useStore((s: StoreState) => s.addPantryItem);
```

**Persisted state**: `pantryItems`, `favorites`, `user`, `hasOnboarded`
**Runtime state**: `communityPosts` (loaded via `loadPosts()`)

### Firebase Auth Integration
The store integrates Firebase auth with centralized methods:
- `login(email, password)` / `signup(name, email, password)` - Real Firebase auth
- `signOut()` - Firebase logout with navigation
- `startAuthListener()` - Auto-sync Firebase auth state to store
- Auth loading states handled via `authLoading` flag

### Key Store Actions
- `setUser(user)` / `clearUser()` - Auth state (auto-managed by Firebase listener)
- `addPantryItem(item)` / `removePantryItem(id)` - Pantry management
- `saveFavorite(recipe)` / `removeFavorite(id)` - Recipe favorites
- `generateRecipeMock(pantry, options)` - Mock recipe generation (TODO: Replace with Gemini)
- `loadPosts()` / `postCommunity(post)` - Community features (mock implementation)

## Component Conventions

### Modal Patterns
```typescript
// EditIngredientModal - Full-screen modal with form validation
<Modal animationType="slide" transparent={true} visible={visible}>
    <View style={styles.centeredView}>
        <View style={styles.modalView}>
            {/* Header with close button */}
            {/* ScrollView content */}
            {/* Action buttons at bottom */}
        </View>
    </View>
</Modal>

// ModalSheet - Bottom sheet modal for quick actions
<Modal animationType="slide" transparent visible={visible}>
    <View style={styles.backdrop}>
        <View style={styles.sheet}>
            {/* Content */}
        </View>
    </View>
</Modal>
```

### Styling Patterns
```typescript
// Import centralized colors
import { colors } from "../theme/colors";

const styles = StyleSheet.create({
    button: { backgroundColor: colors.accent },
    text: { color: colors.textSecondary },
});
```

**Color Tokens**: Use semantic names (`colors.accent`, `colors.textMuted`) not hex values
**Layout**: Prefer `StyleSheet.create()` over inline styles
**Borders**: Use `StyleSheet.hairlineWidth` for 1px borders
**Modals**: Two patterns - full modals vs bottom sheets (see ModalSheet.tsx vs EditIngredientModal.tsx)

### Component Structure
```typescript
// Functional components with TypeScript interfaces
export const ComponentName: React.FC<{ prop: Type }> = ({ prop }) => {
    return <View>...</View>;
};

export default ComponentName;
```

## Domain Types (`app/types.ts`)

**Core Entities**: `User`, `Recipe`, `PantryItem`, `CommunityPost`
**Key Recipe Fields**: `ingredients[]`, `steps[]`, `proTips?`, `alternatives?`
**Nutrition**: `calories_kcal`, `protein_g`, `carbs_g`, `fat_g`

## API Layer (`app/api/mockApi.ts` & `app/api/auth.ts`)

### Firebase Auth Implementation (`app/api/auth.ts`)
- **Real production auth**: Uses Firebase Auth with React Native persistence
- **Error handling**: Normalizes Firebase errors to user-friendly messages
- **User mapping**: Converts Firebase User to app `User` type via `toAppUser()`
- **Auth persistence**: Configured via `getReactNativePersistence(AsyncStorage)`

### Mock Implementation Pattern (`app/api/mockApi.ts`)
- All functions simulate network latency (`await delay(ms)`)
- `generateRecipeFromPantry()` - TODO: Replace with Gemini integration
- `getCommunityPosts()` / `postCommunityPost()` - TODO: Replace with Firebase/backend
- `seedMockData()` - Demo data initialization

### Data Seeding
The `useAsyncSeed` hook auto-loads demo data on app start:
- Seeds community posts and pantry items if empty
- Called from root layout to ensure data availability
- Integrates with Zustand store for initial state hydration

## Expo Configuration & Permissions

### Critical app.json Settings
```json
{
  "expo": {
    "newArchEnabled": true,
    "experiments": { "typedRoutes": true, "reactCompiler": true },
    "android": { "predictiveBackGestureEnabled": false },
    "plugins": ["expo-router", "expo-camera", "expo-splash-screen"]
  }
}
```

**Camera Permissions**: Configured for iOS (`NSCameraUsageDescription`) and Android (`CAMERA` permission)
**Typed Routes**: Expo Router generates type-safe navigation
**React Compiler**: Enabled for optimization (may affect debugging)

## Development Workflows

### Common Commands
```bash
npm start                # Start Expo dev server
npm run android          # Run on Android emulator
npm run ios              # Run on iOS simulator
npm run web              # Run web version
npm run lint             # ESLint check
```

### Navigation Debugging
- **Tab Navigator**: Check `(tabs)/_layout.tsx` for tab configuration
- **Stack Navigator**: Root `_layout.tsx` handles auth/modal flows
- **Auth Loading**: App shows spinner until Firebase auth state loads (`user === undefined`)
- **Typed Routes**: Use `router.push("/screens/Recipe/RecipeDetail")` with full paths

### File Creation Guidelines
- **New screens**: Add to `app/screens/[Domain]/`
- **Shared components**: Add to `app/components/`
- **Types**: Extend `app/types.ts` or create domain-specific type files
- **Colors**: Add semantic tokens to `app/theme/colors.ts`

### State Management Guidelines
- **Persistent data**: Add to Zustand store with persistence
- **API integration**: Mock in `mockApi.ts`, implement real endpoints later
- **Component state**: Use local `useState` for UI-only state

## TODOs & Integration Points

**Critical TODOs in codebase**:
- Replace mock recipe generation with Gemini API + vision
- Replace in-memory community posts with Firestore
- Consider splitting `types.ts` if it grows large

**Integration Patterns**:
- Auth flow through `setUser()` in store (Firebase integration complete)
- Recipe generation via `generateRecipeMock()` 
- Community features through `loadPosts()` / `postCommunity()`
- Pantry management through store actions

When adding features, follow the established mock → real API pattern and maintain type safety throughout.