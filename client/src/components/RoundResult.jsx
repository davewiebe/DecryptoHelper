import React from 'react';

// Round results for one team, laid out in the same 4 keyword columns as the
// team's worksheet so each clue lines up under its column.
//  - New clue:            the real code -> column
//  - Decode result:       the team's own decoding guess
//  - Interception result: the opponent's interception of this team's code
// Wrong placements (decode / intercept) are shown in red.
export default function RoundResult({ cr, team }) {
  if (!cr || !cr.codes || !cr.codes[team]) return null;

  const opp = team === 'white' ? 'black' : 'white';
  const clues = cr.clues[team] || [];
  const code = cr.codes[team] || [];

  // Place each clue into its assigned column (guesses are 3 distinct columns,
  // so at most one clue per column).
  const columns = (guess) => {
    const cells = [null, null, null, null];
    (guess || []).forEach((col, i) => {
      if (col >= 1 && col <= 4) cells[col - 1] = { clue: clues[i], correct: col === code[i] };
    });
    return cells;
  };

  return (
    <div style={s.wrap}>
      <Row label="New clue" cells={columns(code)} mark={false} />
      <Row label="Decode result" cells={columns(cr.decodingGuesses[team])} mark />
      <Row label="Interception result" cells={columns(cr.interceptionGuesses[opp])} mark />
    </div>
  );
}

function Row({ label, cells, mark }) {
  return (
    <div style={s.row}>
      <div style={s.label}>{label}</div>
      <div style={s.grid}>
        {cells.map((c, i) => (
          <div key={i} style={s.cell}>
            {c ? (
              <span style={mark && !c.correct ? s.wrong : undefined}>{c.clue}</span>
            ) : (
              <span style={s.empty}>·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 },
  row: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 10, letterSpacing: 1, opacity: 0.5 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  cell: { border: '1px solid #1e1e2e', borderRadius: 6, padding: 8, minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 12, wordBreak: 'break-word' },
  wrong: { color: '#e53935' },
  empty: { opacity: 0.2 },
};
