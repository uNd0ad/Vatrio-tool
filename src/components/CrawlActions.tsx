import { useState } from "react";
import { triggerCrawl } from "../services/crawler";
import { Icon } from "./Icon";

interface CrawlActionsProps {
  onReload: () => void;
  reloading: boolean;
  isOnline: boolean;
}

/**
 * Cele două acțiuni sunt distincte și erau confundabile: „Reîncarcă lista"
 * recitește ce e deja în baza de date, „Caută anunțuri noi" pornește crawlerul
 * pe portaluri. Butonul unic de dinainte doar reîncărca, deși părea că aduce
 * anunțuri noi.
 */
export function CrawlActions({ onReload, reloading, isOnline }: CrawlActionsProps) {
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function handleTrigger() {
    setStarting(true);
    setNotice(null);
    try {
      const result = await triggerCrawl();
      setNotice({ kind: "ok", text: result.message });
    } catch (error) {
      setNotice({ kind: "err", text: error instanceof Error ? error.message : "Crawlerul nu a putut fi pornit." });
    } finally {
      setStarting(false);
      setTimeout(() => setNotice(null), 12000);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className="refresh-button"
          onClick={onReload}
          disabled={reloading || !isOnline}
          title="Recitește anunțurile deja salvate în baza de date."
        >
          <Icon name="refresh" />
          {reloading ? "Se reîncarcă..." : "Reîncarcă lista"}
        </button>
        <button
          className="refresh-button"
          onClick={() => void handleTrigger()}
          disabled={starting || !isOnline}
          title="Pornește crawlerul pe portaluri. Durează câteva minute."
          style={{
            background: "var(--sidebar-nav-active)",
            color: "white",
            border: 0,
          }}
        >
          {starting ? "Se pornește..." : "🔎 Caută anunțuri noi"}
        </button>
      </div>
      {notice && (
        <span
          role="status"
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: notice.kind === "ok" ? "#2b8a3e" : "#d85b5b",
            maxWidth: "420px",
            textAlign: "right",
          }}
        >
          {notice.text}
        </span>
      )}
    </div>
  );
}
