"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

const ThemeContext = createContext(undefined);

function getSystemTheme() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getTheme(storageKey, defaultTheme) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) return stored;
  } catch (e) {}
  return defaultTheme;
}

function getResolvedTheme(theme, enableSystem) {
  if (theme === "system" && enableSystem) return getSystemTheme();
  return theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  enableSystem = true,
  disableTransitionOnChange = false,
  attribute = "class",
  enableColorScheme = true,
  themes = ["light", "dark"],
  forcedTheme,
}) {
  const [theme, setThemeState] = useState(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    getResolvedTheme(defaultTheme, enableSystem)
  );
  const [mounted, setMounted] = useState(false);

  // Apply theme to DOM
  const applyTheme = useCallback(
    (rawTheme) => {
      const resolved = getResolvedTheme(rawTheme, enableSystem);
      const finalTheme = forcedTheme || resolved || rawTheme;

      if (attribute === "class") {
        const root = document.documentElement;
        const allThemes = forcedTheme
          ? [forcedTheme]
          : [...themes, ...(enableSystem ? ["system"] : [])];
        root.classList.remove(...allThemes);
        root.classList.add(finalTheme);
      }

      if (enableColorScheme) {
        if (finalTheme === "light" || finalTheme === "dark") {
          document.documentElement.style.colorScheme = finalTheme;
        }
      }
    },
    [attribute, enableSystem, enableColorScheme, forcedTheme, themes]
  );

  // Sync with system theme changes
  useEffect(() => {
    if (!enableSystem) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        const newResolved = getSystemTheme();
        setResolvedTheme(newResolved);
        if (!forcedTheme) applyTheme("system");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, enableSystem, applyTheme, forcedTheme]);

  // Apply theme on mount and when theme/forcedTheme changes
  useLayoutEffect(() => {
    setMounted(true);
    const storedTheme = getTheme(storageKey, defaultTheme);
    const effectiveTheme = forcedTheme || storedTheme;
    setThemeState(effectiveTheme);
    setResolvedTheme(getResolvedTheme(effectiveTheme, enableSystem));
    applyTheme(effectiveTheme);
  }, [forcedTheme]);

  const setTheme = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
      const resolved = getResolvedTheme(
        typeof newTheme === "function" ? newTheme(theme) : newTheme,
        enableSystem
      );
      setResolvedTheme(resolved);
      applyTheme(newTheme);
      try {
        localStorage.setItem(
          storageKey,
          typeof newTheme === "function" ? newTheme(theme) : newTheme
        );
      } catch (e) {}
    },
    [applyTheme, enableSystem, storageKey, theme]
  );

  const value = useMemo(
    () => ({
      theme: mounted ? theme : defaultTheme,
      setTheme,
      forcedTheme,
      resolvedTheme: mounted
        ? forcedTheme || getResolvedTheme(theme, enableSystem)
        : undefined,
      themes: enableSystem ? [...themes, "system"] : themes,
      systemTheme: enableSystem && mounted ? getSystemTheme() : undefined,
    }),
    [theme, setTheme, forcedTheme, enableSystem, themes, mounted, defaultTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: undefined,
      setTheme: () => {},
      themes: [],
      systemTheme: undefined,
      resolvedTheme: undefined,
      forcedTheme: undefined,
    };
  }
  return context;
}