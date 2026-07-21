import { useEffect, useRef, useState } from "react";

/**
 * Urmărește starea online/offline a ferestrei. `onReconnect` rulează la fiecare
 * revenire online (ex. pentru golirea cozii de modificări offline).
 */
export function useOnlineStatus(onReconnect?: () => void): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onReconnectRef.current?.();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
