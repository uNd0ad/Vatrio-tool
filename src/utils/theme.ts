export type Theme = "light" | "dark";

// Must stay in sync with app.css, which themes on the `.dark` root class, and
// with the pre-existing "vatrio_theme" key so saved preferences survive.
const THEME_KEY = "vatrio_theme";

export function getPreferredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage poate fi blocat (ex. WebView fără permisiuni) — cade pe sistem.
  }
  return typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Preferința nu se poate salva; tema rămâne aplicată pentru sesiunea curentă.
  }
}
