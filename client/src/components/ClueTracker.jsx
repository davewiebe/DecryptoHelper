import React from 'react';

// Persistent Decrypto note sheet: 4 keyword columns with the clues given for
// each one accumulated across all completed rounds. Codes from finished rounds
// are public, so clues can be filed under the column (keyword) they encoded.
//
// - keywords provided  -> headers show your own keyword words (your team)
// - keywords null      -> headers show numbers only (opponent / interception)
//
// When a team mis-decoded one of its own clues, that clue is also shown
// struck-through in the column the team *guessed* it belonged to.
export default function ClueTracker({ history, team, keywords, teamColor, title }) {
  const cols = [[], [], [], []];

  // history is newest-first; reverse so clues read oldest -> newest per column.
  (history || [])
    .filter((h) => h.type === 'round')
    .slice()
    .reverse()
    .forEach((h) => {
      const code = h.summary?.codes?.[team];
      const clues = h.summary?.clues?.[team];
      const guesses = h.summary?.decodingGuesses?.[team];
      if (!code || !clues) return;
      clues.forEach((clue, i) => {
        const actual = code[i];
        if (actual >= 1 && actual <= 4) cols[actual - 1].push({ round: h.round, clue, struck: false });
        const guess = guesses ? guesses[i] : null;
        if (guess && guess !== actual && guess >= 1 && guess <= 4) {
          cols[guess - 1].push({ round: h.round, clue, struck: true });
        }
      });
    });

  return (
    <div style={s.wrap}>
      <div style={s.title}>{title}</div>
      <div style={s.grid}>
        {cols.map((entries, idx) => (
          <div key={idx} style={s.col}>
            <div style={s.head}>
              <span style={{ ...s.num, color: teamColor, borderColor: teamColor }}>{idx + 1}</span>
              {keywords && keywords[idx] && <span style={s.kw}>{keywords[idx]}</span>}
            </div>
            <div style={s.entries}>
              {entries.map((e, j) => (
                <div key={j} style={s.entry}>
                  <span style={s.round}>{e.round}</span>
                  <span style={{ ...s.clue, ...(e.struck ? s.struck : null) }}>{e.clue}</span>
                </div>
              ))}
              {entries.length === 0 && <span style={s.placeholder}>—</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 },
  title: { fontSize: 10, letterSpacing: 2, opacity: 0.5 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  col: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 56 },
  head: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  num: { width: 22, height: 22, borderRadius: '50%', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', lineHeight: '22px' },
  kw: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-word' },
  entries: { display: 'flex', flexDirection: 'column', gap: 3 },
  entry: { display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 12 },
  round: { fontSize: 9, opacity: 0.35, width: 10, flexShrink: 0, textAlign: 'right' },
  clue: { wordBreak: 'break-word' },
  struck: { textDecoration: 'line-through', color: '#e53935', opacity: 0.85 },
  placeholder: { opacity: 0.2, fontSize: 12, textAlign: 'center' },
};
