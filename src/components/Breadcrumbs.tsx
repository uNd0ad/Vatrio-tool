import React from 'react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span>/</span>}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              style={{ background: 'transparent', border: 0, padding: 0, color: '#1a73e8', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
            >
              {item.label}
            </button>
          ) : (
            <span style={{ color: 'var(--text-main, #0f172a)', fontWeight: 600 }}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
