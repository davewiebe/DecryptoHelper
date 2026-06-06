import React from 'react';

const arrEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
const cap = (t) => (t === 'white' ? 'White' : 'Black');

// Round results for one team, laid out in the same 4 keyword columns as the
// team's worksheet so each clue lines up under its column.
//  - <giver>'s clues:      the real code -> column
//  - decryption attempt:   this team decrypting its own clues
//  - interception attempt: the opponent intercepting this team's code
//
// The ✓/✗ status only appears for outcomes that change the score — a failed
// decryption (miscommunication token) or a successful interception (interception
// token). Coloured red in your block, green in the opponent's. Wrong clue
// placements in the columns stay red.
export default function RoundResult({ cr, team, players, mine }) {
  if (!cr || !cr.codes || !cr.codes[team]) return null;

  const opp = team === 'white' ? 'black' : 'white';
  const clues = cr.clues[team] || [];
  const code = cr.codes[team] || [];
  const giverName = (players || []).find((p) => p.id === cr.clueGivers[team])?.name;
  const highlight = mine ? '#e53935' : '#4caf50';

  const columns = (guess) => {
    const cells = [null, null, null, null];
    (guess || []).forEach((col, i) => {
      if (col >= 1 && col <= 4) cells[col - 1] = { clue: clues[i], correct: col === code[i] };
    });
    return cells;
  };

  const decodeOk = arrEq(cr.decodingGuesses[team], code);
  const interceptOk = arrEq(cr.interceptionGuesses[opp], code);

  const cluesLabel = `${giverName ? `${giverName}'s` : "Clue giver's"} clues`;
  const decodeLabel = `${mine ? "Your team's" : `${cap(team)} team's`} decryption`;
  const interceptLabel = `${cap(opp)} team interception`;

  return (
    <div style={s.wrap}>
      <Row label={cluesLabel} cells={columns(code)} mark={false} />
      <Row
        label={decodeLabel}
        status={decodeOk ? null : '✗ Unsuccessful'}
        statusColor={highlight}
        cells={columns(cr.decodingGuesses[team])}
        mark
      />
      <Row
        label={interceptLabel}
        status={interceptOk ? '✓ Successful' : null}
        statusColor={highlight}
        cells={columns(cr.interceptionGuesses[opp])}
        mark
      />
    </div>
  );
}

function Row({ label, cells, mark, status, statusColor }) {
  return (
    <div style={s.row}>
      <div style={s.label}>
        {label}
        {status && <>: <span style={{ color: statusColor, fontWeight: 'bold' }}>{status}</span></>}
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
  label: { fontSize: 10, letterSpacing: 1, color: '#8a8a93', textTransform: 'uppercase' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  cell: { border: '1px solid #1e1e2e', borderRadius: 6, padding: 8, minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 12, wordBreak: 'break-word' },
  wrong: { color: '#e53935' },
  empty: { opacity: 0.2 },
};
