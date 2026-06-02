import React from 'react';

// Lays out the 3 clues from a round under the 4 keyword columns (1-4).
//
// - A clue decoded correctly sits normally under the column it belongs to.
// - A clue the team decoded WRONG is shown struck-through in BOTH the column
//   it was supposed to be in (per the real code) and the column the team
//   guessed it into.
export default function ClueColumns({ code, clues, decodingGuess, keywords, teamColor }) {
  if (!code || !clues) return null;

  const cols = [[], [], [], []]; // columns 1..4

  clues.forEach((clue, i) => {
    const actual = code[i];                                  // 1..4
    const guessed = decodingGuess ? decodingGuess[i] : actual;
    if (guessed === actual) {
      cols[actual - 1].push({ clue, struck: false });
    } else {
      cols[actual - 1].push({ clue, struck: true });         // where it belonged
      if (guessed >= 1 && guessed <= 4) {
        cols[guessed - 1].push({ clue, struck: true });      // where they put it
      }
    }
  });

  return (
    <div style={s.grid}>
      {cols.map((entries, idx) => (
        <div key={idx} style={s.col}>
          <div style={s.head}>
            <span style={{ ...s.num, color: teamColor, borderColor: teamColor }}>{idx + 1}</span>
            {keywords && keywords[idx] && <span style={s.kw}>{keywords[idx]}</span>}
          </div>
          <div style={s.entries}>
            {entries.map((e, j) => (
              <span
                key={j}
                style={{
                  ...s.chip,
                  ...(e.struck ? s.struck : null),
                }}
              >
                {e.clue}
              </span>
            ))}
            {entries.length === 0 && <span style={s.placeholder}>·</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  col: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 70 },
  head: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  num: { width: 20, height: 20, borderRadius: '50%', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', lineHeight: '20px' },
  kw: { fontSize: 10, opacity: 0.6, textAlign: 'center', wordBreak: 'break-word' },
  entries: { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' },
  chip: { fontSize: 12, textAlign: 'center', wordBreak: 'break-word' },
  struck: { textDecoration: 'line-through', color: '#e53935', opacity: 0.8 },
  placeholder: { opacity: 0.2, fontSize: 12 },
};
