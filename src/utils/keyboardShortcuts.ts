export interface ShortcutHandlers {
  onSearch?: () => void;
  onRefresh?: () => void;
  onSetStatus?: (status: 'new' | 'contacted' | 'refused' | 'closed') => void;
  onEscape?: () => void;
}

export function handleKeyboardShortcut(e: KeyboardEvent, handlers: ShortcutHandlers): boolean {
  const isCmdOrCtrl = e.metaKey || e.ctrlKey;

  if (isCmdOrCtrl && (e.key === 'k' || e.key === 'f')) {
    e.preventDefault();
    handlers.onSearch?.();
    return true;
  }

  if (isCmdOrCtrl && e.key === 'r') {
    e.preventDefault();
    handlers.onRefresh?.();
    return true;
  }

  if (e.key === 'Escape') {
    handlers.onEscape?.();
    return true;
  }

  if (!isCmdOrCtrl && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
    if (e.key === '1') { handlers.onSetStatus?.('new'); return true; }
    if (e.key === '2') { handlers.onSetStatus?.('contacted'); return true; }
    if (e.key === '3') { handlers.onSetStatus?.('refused'); return true; }
    if (e.key === '4') { handlers.onSetStatus?.('closed'); return true; }
  }

  return false;
}
