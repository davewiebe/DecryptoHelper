import React from 'react';

export default function ScoreBar({ teams }) {
  return (
    <div style={s.bar}>
      <TeamScore name="WHITE" team={teams.white} color="#e8e8e8" />
      <div style={s.divider} />
      <TeamScore name="BLACK" team={teams.black} color="#7ab4ff" />
    </div>
  );
}

function TeamScore({ name, team, color }) {
  return (
    <div style={s.side}>
      <span style={{ ...s.name, color }}>{name}</span>
      <div style={s.tokens}>
        <span style={s.label}>Interceptions</span>
        <Pips count={team.interceptions} max={2} color="#4caf50" />
      </div>
      <div style={s.tokens}>
        <span style={s.label}>Miscommunications</span>
        <Pips count={team.miscommunications} max={2} color="#e53935" />
      </div>
    </div>
  );
}

function Pips({ count, max, color }) {
  return (
    <div style={s.pips}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{ ...s.pip, background: i < count ? color : '#2a2a3a' }} />
      ))}
    </div>
  );
}

const s = {
  bar: { display: 'flex', background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: '12px 14px', gap: 14 },
  side: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  name: { fontWeight: 'bold', letterSpacing: 2, fontSize: 12 },
  tokens: { display: 'flex', alignItems: 'center', gap: 8 },
  label: { flex: 1, minWidth: 0, fontSize: 11, opacity: 0.5 },
  pips: { display: 'flex', gap: 5, flexShrink: 0 },
  pip: { width: 16, height: 16, borderRadius: '50%' },
  divider: { width: 1, background: '#2a2a3a', flexShrink: 0 },
};
