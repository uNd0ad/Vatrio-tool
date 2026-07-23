import { useEffect } from "react";

interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog de confirmare în aplicație, ca înlocuitor pentru `window.confirm`.
 * În webview-ul Tauri `window.confirm` nu e implementat și returnează fals, deci
 * orice acțiune păzită de el (ștergerea) eșua tăcut. Acesta funcționează identic
 * în Tauri, browser și PWA.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmă",
  cancelLabel = "Anulează",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 3000, display: "grid", placeItems: "center",
        background: "rgba(15,23,42,.5)", padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg, #fff)", color: "var(--text-main, #0f172a)",
          borderRadius: "12px", padding: "22px", width: "min(420px, 100%)",
          boxShadow: "0 20px 50px rgba(0,0,0,.3)", border: "1px solid var(--panel-toolbar-border, #dce2e7)",
        }}
      >
        <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>{title}</h3>
        {message && <p style={{ margin: "0 0 18px", fontSize: "13px", color: "var(--text-secondary, #64748b)" }}>{message}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: message ? 0 : "18px" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              border: "1px solid var(--button-border, #d9dfe5)", background: "var(--button-bg, #fff)", color: "var(--button-color, #334150)",
            }}
          >
            {cancelLabel}
          </button>
          <button
            autoFocus
            onClick={onConfirm}
            style={{
              padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: 0,
              background: danger ? "#d85b5b" : "var(--sidebar-nav-active, #1a73e8)", color: "#fff",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
