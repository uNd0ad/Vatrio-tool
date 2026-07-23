import { useEffect, useRef, useState } from "react";

interface PromptDialogProps {
  title: string;
  placeholder?: string;
  confirmLabel?: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

/**
 * Câmp de introducere într-un dialog, ca înlocuitor pentru `window.prompt`, care
 * în webview-ul Tauri returnează null (salvarea de vizualizări/dosare eșua tăcut).
 */
export function PromptDialog({
  title,
  placeholder,
  confirmLabel = "Salvează",
  initialValue = "",
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  }

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
        <h3 style={{ margin: "0 0 14px", fontSize: "16px" }}>{title}</h3>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={placeholder}
          style={{
            width: "100%", height: "38px", padding: "0 12px", boxSizing: "border-box",
            border: "1px solid var(--button-border, #d9dfe5)", borderRadius: "8px",
            background: "var(--input-bg, #fff)", color: "var(--input-color, #263543)", fontSize: "13px",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              border: "1px solid var(--button-border, #d9dfe5)", background: "var(--button-bg, #fff)", color: "var(--button-color, #334150)",
            }}
          >
            Anulează
          </button>
          <button
            onClick={submit}
            disabled={!value.trim()}
            style={{
              padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: 0,
              background: "var(--sidebar-nav-active, #1a73e8)", color: "#fff", opacity: value.trim() ? 1 : 0.5,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
