import { useCallback, useEffect, useState } from "react";
import { applyTheme, getPreferredTheme, type Theme } from "../utils/theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
