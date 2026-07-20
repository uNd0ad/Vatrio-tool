import React from 'react';

interface TableSkeletonProps {
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 8 }) => {
  return (
    <div className="table-skeleton-wrap" style={{ width: '100%', padding: '0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--panel-toolbar-border, #e2e8f0)', height: '40px' }}>
            <th style={{ width: '36px', padding: '8px 12px' }} />
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              PROPRIETATE
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              PREȚ
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              LOCAȚIE
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              SURSĂ
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              VÂNZĂTOR
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              ADĂUGAT
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              STATUS
            </th>
            <th style={{ width: '60px', padding: '8px 12px' }} />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom: '1px solid var(--panel-toolbar-border, #f1f5f9)',
                height: '64px',
              }}
            >
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <div
                  className="skeleton-pulse"
                  style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--button-border, #e2e8f0)', margin: '0 auto' }}
                />
              </td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    className="skeleton-pulse"
                    style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--button-border, #e2e8f0)', flexShrink: 0 }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div
                      className="skeleton-pulse"
                      style={{ width: '75%', height: '14px', borderRadius: '4px', background: 'var(--button-border, #e2e8f0)' }}
                    />
                    <div
                      className="skeleton-pulse"
                      style={{ width: '45%', height: '12px', borderRadius: '4px', background: 'var(--table-header-bg, #f1f5f9)' }}
                    />
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px' }}>
                <div
                  className="skeleton-pulse"
                  style={{ width: '85px', height: '16px', borderRadius: '4px', background: 'var(--button-border, #e2e8f0)' }}
                />
              </td>
              <td style={{ padding: '12px' }}>
                <div
                  className="skeleton-pulse"
                  style={{ width: '110px', height: '14px', borderRadius: '4px', background: 'var(--button-border, #e2e8f0)' }}
                />
              </td>
              <td style={{ padding: '12px' }}>
                <div
                  className="skeleton-pulse"
                  style={{ width: '60px', height: '20px', borderRadius: '6px', background: 'var(--button-border, #e2e8f0)' }}
                />
              </td>
              <td style={{ padding: '12px' }}>
                <div
                  className="skeleton-pulse"
                  style={{ width: '70px', height: '20px', borderRadius: '12px', background: 'var(--button-border, #e2e8f0)' }}
                />
              </td>
              <td style={{ padding: '12px' }}>
                <div
                  className="skeleton-pulse"
                  style={{ width: '90px', height: '14px', borderRadius: '4px', background: 'var(--button-border, #e2e8f0)' }}
                />
              </td>
              <td style={{ padding: '12px' }}>
                <div
                  className="skeleton-pulse"
                  style={{ width: '80px', height: '24px', borderRadius: '12px', background: 'var(--button-border, #e2e8f0)' }}
                />
              </td>
              <td style={{ padding: '12px' }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
