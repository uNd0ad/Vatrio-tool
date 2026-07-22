/**
 * Înregistrează service worker-ul care face aplicația instalabilă pe telefon.
 * Rulează doar în build-ul web servit prin HTTP(S); în Tauri (protocol propriu)
 * și în dev nu are ce căuta.
 */
export function registerServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!location.protocol.startsWith("http")) return;
  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker-ul nu a putut fi înregistrat:", error);
    });
  });
}
