// Entry file for Expo if needed for custom providers (expo-router uses app/_layout by default)
// We export default from '../app' structure automatically, so this can host global context later.

import { Slot } from "expo-router";
import React from "react";

export default function App() {
    return <Slot />;
}
