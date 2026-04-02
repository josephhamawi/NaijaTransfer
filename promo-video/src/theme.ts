import { loadFont } from "@remotion/google-fonts/Roboto";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
});

export const FONT = fontFamily;

// Theme colors — matches the actual website
export const BRAND_BLUE = "#4EA8DE";
export const BLUE_DARK = "#2E86C1";
export const BLUE_LIGHT = "#BEE0F5";
export const CHARCOAL = "#1A1A2E";
export const CHARCOAL_800 = "#12121F";
export const GOLD = "#FFD700";
export const GOLD_DARK = "#CC9900";
export const ERROR_RED = "#E74C3C";
export const WHITE = "#FFFFFF";
export const MUTED = "#6B6B7B";
