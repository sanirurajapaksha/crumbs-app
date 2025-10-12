// Centralized color palette for the Crumbs app.
// Add or adjust tokens as visual design evolves. Keep semantic naming (avoid raw purpose-less names).

export const colors = {
    // Base / Neutral
    white: "#FFFFFF",
    black: "#000000",
    neutral50: "#F9FAFB",
    neutral100: "#F2F4F7",
    neutral200: "#E4E7EC",
    neutral300: "#D0D5DD", // light divider
    neutral400: "#98A2B3",
    neutral500: "#667085",
    neutral600: "#475467",
    neutral700: "#344054",
    neutral800: "#1D2939",
    neutral900: "#101828",

    // Brand / Accent
    accent: "#FF7F4D", // primary action (login button)
    accentAlt: "#FF915E", // onboarding active dot
    accentSubtle: "#FFE6D9", // inactive dots / subtle fills
    secondary: "#3D4C5F", // complementary slate tone
    secondarySubtle: "#E6ECF2",
    success: "#22C55E",
    danger: "#EF4444",

    // Semantic mapping (future-proofing)
    textPrimary: "#1D2939",
    textSecondary: "#475467",
    textMuted: "#667085",
    border: "#D0D5DD",
    surface: "#FFFFFF",
    surfaceMuted: "#F9FAFB",
    shadow: "rgba(15,23,42,0.12)",
};

// Convenience aliases (optional)
export const palette = colors;

export type ColorName = keyof typeof colors;

export const getColor = (name: ColorName) => colors[name];
