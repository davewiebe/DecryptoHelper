import React from 'react';

const TEAM_COLORS = { white: '#e8e8e8', black: '#7ab4ff' };

// Per-team round progress. Two rows: your team, then the opponent. Each row
// steps through Submit clue > Decode > Intercept > Result.
export default function RoundStatus({ cr, myTeam, oppTeam }) {
  if (!cr) return null;
  return (
    <div style={s.wrap}>
      <Row cr={cr} team={myTeam} label="You" />
      <Row cr={cr} team={oppTeam} label="Opponent" />
    </div>
  );
}

function Row({ cr, team, label }) {
  const color = TEAM_COLORS[team];
  return (
    <div style={s.row}>
      <span style={{ ...s.team, color }}>{label}</span>
      <Step done={cr.cluesSubmitted[team]} color={color} label="Submit clue" />
      <Sep />
      <Step done={cr.decodingSubmitted[team]} color={color} label="Decode" />
      <Sep />
      <Step done={cr.interceptionSubmitted[team]} color={color} label="Intercept" />
      <Sep />
      <Result results={cr.results} team={team} />
    </div>
  );
}

function Step({ done, color, label }) {
  return (
    <span style={s.step}>
      <Box done={done} color={color} />
      <span style={{ opacity: done ? 1 : 0.5 }}>{label}</span>
    </span>
  );
}

function Box({ done, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 15,
        height: 15,
        borderRadius: 3,
        border: `1.5px solid ${color}`,
        background: done ? color : 'transparent',
        color: '#0a0a0f',
        fontSize: 10,
        fontWeight: 'bold',
        lineHeight: 1,
      }}
    >
      {done ? '✓' : ''}
    </span>
  );
}

function Sep() {
  return <span style={s.sep}>›</span>;
}

function Result({ results, team }) {
  if (!results) return <span style={s.pending}>Result: —</span>;
  return (
    <span style={s.result}>
      <Tag ok={results.interceptions[team]} label="Intercept" />
      <Tag ok={results.decodings[team]} label="Decode" />
    </span>
  );
}

function Tag({ ok, label }) {
  return (
    <span style={{ color: ok ? '#4caf50' : '#e53935', fontSize: 11, whiteSpace: 'nowrap' }}>
      {ok ? '✓' : '✗'} {label}
    </span>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%' },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12, justifyContent: 'center' },
  team: { fontWeight: 'bold', letterSpacing: 1, fontSize: 11, minWidth: 60 },
  step: { display: 'inline-flex', alignItems: 'center', gap: 5 },
  sep: { opacity: 0.3 },
  pending: { opacity: 0.4 },
  result: { display: 'inline-flex', gap: 8 },
};
