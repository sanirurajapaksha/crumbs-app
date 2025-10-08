# App Folder README

This folder implements a file-based routing pattern via **expo-router**. Any file inside `app/` becomes a route; `_layout.tsx` files define navigation boundaries (stacks, tabs). We place _all_ source here for simplicity in the student MVP.

## Key Structure

-   `(tabs)/_layout.tsx` – bottom tab navigator (Home, Pantry, Community, Favorites, Settings)
-   `screens/` – feature-focused screens (Auth, Pantry, Recipe, Community, etc.)
-   `api/mockApi.ts` – mock data + generation functions (TODO: replace with Gemini + Vision + backend)
-   `store/useStore.ts` – global Zustand store with persistence (AsyncStorage)
-   `hooks/useAsyncSeed.ts` – seeds demo data on first load
-   `components/` – small reusable UI pieces

## Running

Install deps then start Expo:

```bash
npm install
npm run start
```

Open the app, use Demo Login, add pantry items and Generate to view a mock recipe. Favorites & pantry persist. Community posts are in-memory but seeded.

## Environment / Secrets TODOs

-   Firebase config & auth: `store/useStore.ts` (setUser) & future `/firebase` integration.
-   Gemini / Vision API: `api/mockApi.ts` `generateRecipeFromPantry`.

Add your keys via secure storage / secrets management before production.
