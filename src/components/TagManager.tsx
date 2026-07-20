import React, { useState } from 'react';

interface TagManagerProps {
  tags?: string[] | null;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const TagManager: React.FC<TagManagerProps> = ({ tags = [], onAddTag, onRemoveTag }) => {
  const [newTagInput, setNewTagInput] = useState('');
  const currentTags = tags || [];

  const handleAdd = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !currentTags.includes(trimmed)) {
      onAddTag(trimmed);
      setNewTagInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
        ETICHETE / TAG-URI
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {currentTags.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '12px',
              background: '#e0f2fe',
              color: '#0369a1',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            #{tag}
            <button
              onClick={() => onRemoveTag(tag)}
              style={{
                background: 'transparent',
                border: 0,
                color: '#0369a1',
                cursor: 'pointer',
                fontSize: '12px',
                padding: 0,
                lineHeight: 1,
              }}
              title="Elimină etichetă"
            >
              ×
            </button>
          </span>
        ))}

        <div style={{ display: 'inline-flex', gap: '4px' }}>
          <input
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="+ Adaugă tag"
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid var(--button-border, #cbd5e1)',
              background: 'transparent',
              fontSize: '11px',
              outline: 'none',
              width: '90px',
              color: 'var(--text-main, #0f172a)',
            }}
          />
          {newTagInput.trim() && (
            <button
              onClick={handleAdd}
              style={{
                padding: '2px 6px',
                borderRadius: '6px',
                border: 0,
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
