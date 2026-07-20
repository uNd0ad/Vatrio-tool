const STORAGE_KEY = 'vatrio_dismissed_tips_v1';

export function getDismissedTips(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function dismissTip(tipId: string): void {
  const current = getDismissedTips();
  current.add(tipId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
}
