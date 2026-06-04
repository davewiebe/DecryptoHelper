import React from 'react';

// Round results for one team, shown under that team's worksheet at reveal.
//  - New clue:            the real code -> clue (the truth)
//  - Decode result:       the team's own decoding guess -> clue
//  - Interception result: the opponent's interception guess of this team's code
// Each line lists "column: clue" sorted by column; wrong placements are red.
export default function RoundResult({ cr, team }) {
  if (!cr || !cr.codes || !cr.codes[team]) return null;

  const opp = team === 'white' ? 'black' : 'white';
  const clues = cr.clues[team] || [];
  const code = cr.codes[team] || [];

  const pairs = (guess) =>
    (guess || [])
      .map((col, i) => ({ col, clue: clues[i], correct: col === code[i] }))
      .filter((p) => p.col >= 1 && p.col <= 4)
      .sort((a, b) => a.col - b.col);

  const actual = code
    .map((col, i) => ({ col, clue: clues[i], correct: true }))
    .sort((a, b) => a.col - b.col);

  return (
    <div style={s.wrap}>
      <Line label="New clue" pairs={actual} mark={false} />
      <Line label="Decode result" pairs={pairs(cr.decodingGuesses[team])} mark />
      <Line label="Interception result" pairs={pairs(cr.interceptionGuesses[opp])} mark />
    </div>
  );
}

function Line({ label, pairs, mark }) {
  return (
    <div style={s.line}>
      <span style={s.label}>{label}:</span>
      <span style={s.pairs}>
        {pairs.map((p, i) => (
          <span key={i} style={{ ...s.pair, ...(mark && !p.correct ? s.wrong : null) }}>
            <span style={s.col}>{p.col}:</span> {p.clue}
            {i < pairs.length - 1 ? ',' : ''}
          </span>
        ))}
        {pairs.length === 0 && <span style={s.none}>—</span>}
      </span>
    </div>
  );
}

const s = {
  wrap: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
  line: { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 6, fontSize: 13 },
  label: { fontSize: 11, opacity: 0.5, letterSpacing: 1, flexShrink: 0 },
  pairs: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pair: { whiteSpace: 'nowrap' },
  col: { opacity: 0.6, fontSize: 11 },
  wrong: { color: '#e53935' },
  none: { opacity: 0.3 },
};
