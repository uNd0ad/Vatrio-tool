import React, { useState } from 'react';
import { getDismissedTips, dismissTip } from '../utils/featureOnboarding';

interface FeatureTooltipProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({ id, title, description, children }) => {
  const [dismissed, setDismissed] = useState(() => getDismissedTips().has(id));

  if (dismissed) return <>{children}</>;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '8px 12px',
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '8px',
          fontSize: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
          zIndex: 2000,
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div>
          <strong>💡 {title}:</strong> {description}
        </div>
        <button
          onClick={() => {
            dismissTip(id);
            setDismissed(true);
          }}
          style={{
            background: '#334155',
            color: '#fff',
            border: 0,
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Am înțeles
        </button>
      </div>
    </div>
  );
};
