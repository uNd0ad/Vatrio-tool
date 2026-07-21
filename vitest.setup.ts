// Node ≥22 definește un `localStorage` global experimental care, fără
// `--localstorage-file`, e nefuncțional — iar Vitest nu copiază varianta jsdom
// peste cheile deja prezente în globalul Node. Testele primesc deci un obiect
// fără getItem/setItem/clear. Îl înlocuim cu un Storage complet, în memorie.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(String(key), String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  const existing = globalThis[name] as Storage | undefined;
  if (typeof existing?.clear !== "function") {
    Object.defineProperty(globalThis, name, {
      value: new MemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}
