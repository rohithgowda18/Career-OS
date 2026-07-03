import { glassTheme } from "./presets/glass";
import { cyberpunkTheme } from "./presets/cyberpunk";
import { brutalistTheme } from "./presets/brutalist";
import { terminalTheme } from "./presets/terminal";
import { claymorphismTheme } from "./presets/claymorphism";
import { ThemePreset } from "./types";

export * from "./types";

export const themePresets: Record<string, ThemePreset> = {
  glass: { ...glassTheme, name: "Glass" },
  cyberpunk: cyberpunkTheme,
  brutalist: { ...brutalistTheme, name: "Neo Brutalist" },
  terminal: terminalTheme,
  claymorphism: claymorphismTheme,
};

export const defaultThemeId = "glass";
