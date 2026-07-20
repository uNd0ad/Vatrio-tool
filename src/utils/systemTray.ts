export function updateSystemTrayStatus(statusText: string, count: number): void {
  const badge = count > 0 ? `(${count}) ` : '';
  document.title = `${badge}Vatrio Property CRM — ${statusText}`;

  try {
    const nav = navigator as any;
    if (nav.setAppBadge) {
      if (count > 0) {
        void nav.setAppBadge(count);
      } else {
        void nav.clearAppBadge();
      }
    }
  } catch {
    // Ignore badge permission error
  }
}
