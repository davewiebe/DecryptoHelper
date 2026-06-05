import React from 'react';

const WHITE = '#e8e8e8';
const RED = '#e53935';
const GREEN = '#4caf50';

const arrEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
const cap = (t) => (t === 'white' ? 'White' : 'Black');

// Round results for one team, laid out in the same 4 keyword columns as the
// team's worksheet so each clue lines up under its column.
//  - <giver>'s clues:     the real code -> column
//  - decryption attempt:  this team decrypting its own clues
//  - interception attempt: the opponent intercepting this team's code
//
// `mine` = this is the viewing player's team block. The highlight colour for
// "bad for me / good for me" outcomes is red in your block, green in the
// opponent's.
export default function RoundResult({ cr, team, players, mine }) {
  if (!cr || !cr.codes || !cr.codes[team]) return null;

  const opp = team === 'white' ? 'black' : 'white';
  const clues = cr.clues[team] || [];
  const code = cr.codes[team] || [];
  const giverName = (players || []).find((p) => p.id === cr.clueGivers[team])?.name;
  const highlight = mine ? RED : GREEN;

  // Place each clue into its assigned column (guesses are 3 distinct columns,
  // so at most one clue per column).
  const columns = (guess) => {
    const cells = [null, null, null, null];
    (guess || []).forEach((col, i) => {
      if (col >= 1 && col <= 4) cells[col - 1] = { clue: clues[i], correct: col === code[i] };
    });
    return cells;
  };

  // Decryption: this team decoding their own code. Success neutral (white),
  // failure highlighted.
  const decodeOk = arrEq(cr.decodingGuesses[team], code);
  const decodePrefix = `${mine ? "Your team's" : `${cap(team)} team's`} decryption:`;
  const decodeStatus = decodeOk ? '✓ Successful' : '✗ Unsuccessful';

  // Interception: the opponent guessing this team's code. Success highlighted
  // (they cracked it), failure neutral.
  const interceptOk = arrEq(cr.interceptionGuesses[opp], code);
  const interceptPrefix = `${cap(opp)} team interception:`;
  const interceptStatus = interceptOk ? '✓ Successful' : '✗ Unsuccessful';

  return (
    <div style={s.wrap}>
      <Row label={`${giverName ? `${giverName}'s` : "Clue giver's"} clues`} cells={columns(code)} mark={false} />
      <Row label={decodePrefix} status={decodeStatus} statusColor={decodeOk ? WHITE : highlight} cells={columns(cr.decodingGuesses[team])} mark />
      <Row label={interceptPrefix} status={interceptStatus} statusColor={interceptOk ? highlight : WHITE} cells={columns(cr.interceptionGuesses[opp])} mark />
    </div>
  );
}

function Row({ label, cells, mark, status, statusColor }) {
  const rowStyle = status
    ? { ...s.row, borderLeft: `3px solid ${statusColor}`, paddingLeft: 10, borderRadius: 4 }
    : s.row;
  return (
    <div style={rowStyle}>
      <div style={status ? s.statusLabel : s.label}>
        {label}{status && (
          <span style={{
            marginLeft: 7,
            color: statusColor,
            background: `${statusColor}22`,
            border: `1px solid ${statusColor}55`,
            borderRadius: 10,
            padding: '1px 8px',
            fontSize: 11,
            fontWeight: 'bold',
            letterSpacing: 0.4,
          }}>{status}</span>
        )}
      </div>
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
  statusLabel: { fontSize: 12, fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  cell: { border: '1px solid #1e1e2e', borderRadius: 6, padding: 8, minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 12, wordBreak: 'break-word' },
  wrong: { color: '#e53935' },
  empty: { opacity: 0.2 },
};
