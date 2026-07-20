import React, { useState } from 'react';
import { getAppSettings, saveAppSettings, AppSettings } from '../utils/appSettings';

interface SettingsModalProps {
  onClose: () => void;
  onSettingsSaved?: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSettingsSaved }) => {
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    const updated = saveAppSettings(settings);
    onSettingsSaved?.(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
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
          maxWidth: '560px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--panel-toolbar-border, #dce2e7)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main, #1e293b)' }}>
            ⚙ Setări Aplicație
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              fontSize: '22px',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-main, #334155)',
                marginBottom: '6px',
              }}
            >
              Frecvență Crawler (minute)
            </label>
            <select
              value={settings.crawlFrequencyMinutes}
              onChange={(e) =>
                setSettings({ ...settings, crawlFrequencyMinutes: parseInt(e.target.value, 10) })
              }
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--button-border, #cbd5e1)',
                background: 'var(--button-bg, #ffffff)',
                color: 'var(--button-color, #0f172a)',
                fontSize: '13px',
              }}
            >
              <option value={15}>La fiecare 15 minute</option>
              <option value={30}>La fiecare 30 de minute</option>
              <option value={60}>La fiecare oră</option>
              <option value={360}>La fiecare 6 ore</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-main, #334155)',
                marginBottom: '6px',
              }}
            >
              Filtru implicit la lansare
            </label>
            <select
              value={settings.defaultTransactionType}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultTransactionType: e.target.value as AppSettings['defaultTransactionType'],
                })
              }
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--button-border, #cbd5e1)',
                background: 'var(--button-bg, #ffffff)',
                color: 'var(--button-color, #0f172a)',
                fontSize: '13px',
              }}
            >
              <option value="all">Toate tranzacțiile</option>
              <option value="sale">De vânzare</option>
              <option value="rent">De închiriat</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-main, #334155)',
                marginBottom: '6px',
              }}
            >
              Interval auto-actualizare interfață
            </label>
            <select
              value={settings.autoRefreshIntervalSeconds}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  autoRefreshIntervalSeconds: parseInt(e.target.value, 10),
                })
              }
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--button-border, #cbd5e1)',
                background: 'var(--button-bg, #ffffff)',
                color: 'var(--button-color, #0f172a)',
                fontSize: '13px',
              }}
            >
              <option value={0}>Dezactivat (doar manual)</option>
              <option value={30}>La fiecare 30 de secunde</option>
              <option value={60}>La fiecare 60 de secunde</option>
              <option value={300}>La fiecare 5 minute</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.enableDesktopNotifications}
                onChange={(e) =>
                  setSettings({ ...settings, enableDesktopNotifications: e.target.checked })
                }
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Notificări desktop pentru potriviri noi</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.enablePriceDropAlerts}
                onChange={(e) => setSettings({ ...settings, enablePriceDropAlerts: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Alerte pentru scăderi de preț</span>
            </label>
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--panel-toolbar-border, #dce2e7)',
            background: 'var(--table-header-bg, #f8fafc)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            className="secondary-button"
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
          >
            Anulează
          </button>
          <button
            onClick={handleSave}
            className="primary-button"
            style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px' }}
          >
            {savedSuccess ? '✓ Salvat!' : 'Salvează setările'}
          </button>
        </div>
      </div>
    </div>
  );
};
