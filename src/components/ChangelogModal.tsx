import React from 'react';

interface ChangelogModalProps {
  currentVersion: string;
  onClose: () => void;
}

export const APP_CHANGELOG = [
  {
    version: '1.4.0',
    date: 'Iulie 2026',
    title: 'Ce este nou în Vatrio Tool 🚀',
    changes: [
      '✨ Suport multi-window pentru detașare anunțuri în ferestre individuale',
      '⚡ Command Palette global (⌘K / Ctrl+K) pentru căutare și comenzi rapide',
      '📁 Dosare inteligente (Saved filters) salvate în bara laterală',
      '📈 Istoric schimbări de preț și cronologie detaliată',
      '🖨 Export rapoarte PDF de prezentare client și opțiuni JSON/CSV/Excel',
      '⌨ Navigare facilă de la tastatură (săgeți & Enter) în tabel',
      '🔔 Notificări audio Web Audio API la apariția anunțurilor noi',
    ],
  },
];

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ currentVersion, onClose }) => {
  const latest = APP_CHANGELOG[0];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3500,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--panel-toolbar-border, #dce2e7)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--panel-toolbar-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main, #0f172a)' }}>
              {latest.title}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
              Versiunea {currentVersion} — {latest.date}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 0, fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px', maxHeight: '380px', overflowY: 'auto' }}>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {latest.changes.map((item, idx) => (
              <li key={idx} style={{ fontSize: '13px', color: 'var(--text-main, #1e293b)', lineHeight: 1.5 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            padding: '14px 24px',
            background: 'var(--table-header-bg, #f8fafc)',
            borderTop: '1px solid var(--panel-toolbar-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            className="primary-button"
            style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px' }}
          >
            Am înțeles
          </button>
        </div>
      </div>
    </div>
  );
};
