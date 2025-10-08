// Centralized color palette for the Crumbs app.
// Add or adjust tokens as visual design evolves. Keep semantic naming (avoid raw purpose-less names).

export const colors = {
    // Base / Neutral
    white: "#FFFFFF",
    black: "#000000",
    neutral50: "#EFEFEFFF",
    neutral100: "#eee",
    neutral200: "#ddd",
    neutral300: "#cfd9cf", // used placeholder tint
    neutral400: "#bbb",
    neutral500: "#888",
    neutral600: "#777",
    neutral700: "#555",
    neutral800: "#444",
    neutral900: "#222",

    // Brand / Accent
    accent: "#ff7f4d", // primary action (login button)
    accentAlt: "#ff914d", // onboarding active dot
    accentSubtle: "#f1cfc2", // inactive dots
    success: "#0a7", // existing green accent usage
    danger: "#c00",

    // Semantic mapping (future-proofing)
    textPrimary: "#222",
    textSecondary: "#555",
    textMuted: "#777",
    border: "#ddd",
};

// Convenience aliases (optional)
export const palette = colors;

export type ColorName = keyof typeof colors;

export const getColor = (name: ColorName) => colors[name];
