import React from 'react';

export interface PriceHistoryItem {
  price: number;
  date: string;
  currency?: string;
}

interface PriceHistoryTimelineProps {
  currentPrice: number | null;
  currentCurrency?: string | null;
  history?: PriceHistoryItem[] | null;
}

export const PriceHistoryTimeline: React.FC<PriceHistoryTimelineProps> = ({
  currentPrice: _currentPrice,
  currentCurrency = '€',
  history,
}) => {
  if (!history || history.length === 0) {
    return (
      <div style={{ padding: '8px 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
        Nicio modificare de preț înregistrată.
      </div>
    );
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
        ISTORIC SCHIMBĂRI PREȚ
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid #cbd5e1', paddingLeft: '12px', marginLeft: '4px' }}>
        {sorted.map((item, idx) => {
          const prevPrice = idx < sorted.length - 1 ? sorted[idx + 1].price : null;
          const diff = prevPrice ? item.price - prevPrice : 0;
          const percent = prevPrice ? ((diff / prevPrice) * 100).toFixed(1) : null;
          const isDrop = diff < 0;

          return (
            <div key={idx} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-main, #1e293b)' }}>
                  {item.price.toLocaleString('ro-RO')} {item.currency || currentCurrency}
                </span>
                {percent !== null && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isDrop ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {isDrop ? '📉 ' : '📈 +'}{percent}%
                  </span>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                {new Date(item.date).toLocaleDateString('ro-RO')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
