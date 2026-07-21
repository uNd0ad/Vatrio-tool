import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debounced;
}
