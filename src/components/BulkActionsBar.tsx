import type { ListingStatus } from "../types";
import { STATUS_ICONS, STATUS_LABELS } from "../utils/listingDisplay";

interface BulkActionsBarProps {
  selectedCount: number;
  updatingBulk: boolean;
  isOnline: boolean;
  /** Comparația și printarea au sens doar la 2-3 anunțuri selectate. */
  canCompare: boolean;
  onBulkStatusChange: (status: ListingStatus) => void;
  onBulkDelete: () => void;
  onCompare: () => void;
  onPrintPdf: () => void;
  onDeselect: () => void;
}

export function BulkActionsBar({
  selectedCount,
  updatingBulk,
  isOnline,
  canCompare,
  onBulkStatusChange,
  onBulkDelete,
  onCompare,
  onPrintPdf,
  onDeselect,
}: BulkActionsBarProps) {
  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      background: "var(--card-bg, #ffffff)",
      border: "1px solid var(--panel-toolbar-border, #dce2e7)",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
      borderRadius: "12px",
      padding: "10px 18px",
      display: "flex",
      alignItems: "center",
      gap: "14px"
    }}>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
        {selectedCount} {selectedCount === 1 ? "anunț selectat" : "anunțuri selectate"}
      </span>
      <div style={{ height: "18px", width: "1px", background: "var(--panel-toolbar-border)" }} />
      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Schimbă status în:</span>
      {(["contacted", "refused", "closed", "new"] as ListingStatus[]).map((status) => (
        <button
          key={status}
          disabled={updatingBulk || !isOnline}
          onClick={() => onBulkStatusChange(status)}
          className="secondary-button"
          style={{
            padding: "5px 12px",
            borderRadius: "7px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>{STATUS_ICONS[status]}</span>
          {STATUS_LABELS[status]}
        </button>
      ))}
      <div style={{ height: "18px", width: "1px", background: "var(--panel-toolbar-border)" }} />
      <button
        disabled={updatingBulk || !isOnline}
        onClick={onBulkDelete}
        className="secondary-button"
        style={{
          padding: "5px 12px",
          borderRadius: "7px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          color: "#d85b5b",
          borderColor: "#f0b0b0"
        }}
      >
        🗑 Șterge
      </button>
      {canCompare && (
        <>
          <div style={{ height: "18px", width: "1px", background: "var(--panel-toolbar-border)" }} />
          <button
            onClick={onCompare}
            className="secondary-button"
            style={{
              padding: "5px 12px",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#1a73e8",
              borderColor: "#aecbfa",
            }}
          >
            🔍 Compară ({selectedCount})
          </button>
          <button
            onClick={onPrintPdf}
            className="secondary-button"
            style={{
              padding: "5px 12px",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--button-color)",
              borderColor: "var(--button-border)",
            }}
          >
            🖨 Printează PDF
          </button>
        </>
      )}
      <button
        onClick={onDeselect}
        style={{
          background: "transparent",
          border: 0,
          color: "var(--text-muted)",
          fontSize: "12px",
          cursor: "pointer",
          fontWeight: 600
        }}
      >
        Deselectează
      </button>
    </div>
  );
}
