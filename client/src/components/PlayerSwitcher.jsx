import React, { useState } from 'react';

const TEAM_COLORS = { white: '#e8e8e8', black: '#7ab4ff' };

export default function PlayerSwitcher({ players, ownedIds, activeId, phase, hostId, onSwitch, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const ownedPlayers = ownedIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);

  if (ownedPlayers.length === 0) return null;

  const submitAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
    setAdding(false);
  };

  return (
    <div style={s.bar}>
      <span style={s.label}>VIEWING AS</span>
      <div style={s.chips}>
        {ownedPlayers.map((p) => {
          const active = p.id === activeId;
          const color = p.team ? TEAM_COLORS[p.team] : '#888';
          return (
            <button
              key={p.id}
              onClick={() => onSwitch(p.id)}
              style={{
                ...s.chip,
                borderColor: color,
                background: active ? color : 'transparent',
                color: active ? '#0a0a0f' : color,
                fontWeight: active ? 'bold' : 'normal',
              }}
            >
              {p.name}
              {p.id === hostId && <span style={s.host}>★</span>}
              {p.team && <span style={s.team}>{p.team[0].toUpperCase()}</span>}
            </button>
          );
        })}

        {phase === 'lobby' && !adding && (
          <button style={s.addBtn} onClick={() => setAdding(true)}>+ Add player</button>
        )}
        {phase === 'lobby' && adding && (
          <span style={s.addForm}>
            <input
              style={s.input}
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitAdd();
                if (e.key === 'Escape') { setAdding(false); setName(''); }
              }}
              autoFocus
            />
            <button style={s.addOk} onClick={submitAdd}>Add</button>
            <button style={s.addCancel} onClick={() => { setAdding(false); setName(''); }}>✕</button>
          </span>
        )}
      </div>
    </div>
  );
}

const s = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '8px 16px',
    background: '#0d0d14',
    borderBottom: '1px solid #2a2a3a',
    flexWrap: 'wrap',
  },
  label: { fontSize: 10, letterSpacing: 2, opacity: 0.5, flexShrink: 0 },
  chips: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid',
    borderRadius: 16,
    padding: '5px 12px',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  host: { fontSize: 11 },
  team: { fontSize: 9, opacity: 0.7, border: '1px solid currentColor', borderRadius: 4, padding: '0 3px' },
  addBtn: {
    background: 'transparent',
    border: '1px dashed #555',
    color: '#888',
    borderRadius: 16,
    padding: '5px 12px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  addForm: { display: 'flex', gap: 6, alignItems: 'center' },
  input: {
    background: '#1e1e2e',
    border: '1px solid #3a3a5a',
    color: '#e0e0e0',
    borderRadius: 14,
    padding: '5px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    width: 110,
  },
  addOk: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 14, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  addCancel: { background: 'transparent', border: 'none', color: '#888', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
};
