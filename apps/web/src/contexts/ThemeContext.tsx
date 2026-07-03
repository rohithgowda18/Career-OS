import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemePreset, themePresets, defaultThemeId } from "../theme";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  currentTheme: string;
  setTheme: (themeId: string) => void;
  themeTokens: ThemePreset;
  themeMode: ThemeMode;
  toggleDarkMode: () => void;
  resolvedTheme: ThemeMode;
  // Compatibility fields for existing code if needed:
  theme: ThemeMode;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  defaultMode?: ThemeMode;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = defaultThemeId,
  defaultMode = "dark",
  switchable = true,
}: ThemeProviderProps) {
  const [themeId, setThemeId] = useState<string>(() => {
    const stored = localStorage.getItem("theme-preset");
    return stored && themePresets[stored] ? stored : defaultTheme;
  });

  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("theme-mode");
    return (stored as ThemeMode) || defaultMode;
  });

  useEffect(() => {
    const root = document.documentElement;
    // Apply dark mode class
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("theme-preset", themeId);
  }, [themeId]);

  const setTheme = (id: string) => {
    if (themePresets[id]) {
      setThemeId(id);
    }
  };

  const toggleDarkMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const themeTokens = themePresets[themeId] || themePresets[defaultThemeId];

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: themeId,
        setTheme,
        themeTokens,
        themeMode: mode,
        toggleDarkMode,
        resolvedTheme: mode,
        // Compatibility properties:
        theme: mode,
        toggleTheme: toggleDarkMode,
        switchable,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
