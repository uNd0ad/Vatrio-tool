export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

const STORAGE_KEY = 'vatrio_window_state_v1';

export const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1280,
  height: 800,
};

export function getSavedWindowState(): WindowState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WINDOW_STATE;
    return { ...DEFAULT_WINDOW_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_WINDOW_STATE;
  }
}

export function saveWindowState(state: WindowState): WindowState {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function initWindowStateListener(): () => void {
  const saveCurrent = () => {
    saveWindowState({
      width: window.innerWidth,
      height: window.innerHeight,
      x: window.screenX,
      y: window.screenY,
    });
  };

  window.addEventListener('resize', saveCurrent);
  window.addEventListener('beforeunload', saveCurrent);

  return () => {
    window.removeEventListener('resize', saveCurrent);
    window.removeEventListener('beforeunload', saveCurrent);
  };
}
