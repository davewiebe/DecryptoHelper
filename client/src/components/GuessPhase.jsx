import React, { useState } from 'react';
import socket from '../socket';
import ClueTracker from './ClueTracker';

const NUMS = [1, 2, 3, 4];
const TEAM_COLORS = { white: '#e8e8e8', black: '#7ab4ff' };

export default function GuessPhase({ cr, myTeam, playerId, keywords, history, players }) {
  const [interception, setInterception] = useState(['', '', '']);
  const [decoding, setDecoding] = useState(['', '', '']);
  const [sent, setSent] = useState({ interception: false, decoding: false });

  if (!cr || !myTeam) return null;

  const oppTeam = myTeam === 'white' ? 'black' : 'white';
  const oppClues = cr.clues[oppTeam];
  const myClues = cr.clues[myTeam];
  // The clue giver knows their own code, so they can't decode it — only intercept.
  const amClueGiver = cr.clueGivers[myTeam] === playerId;
  const giverName = (players || []).find((p) => p.id === cr.clueGivers[myTeam])?.name;

  const submitGuess = (type, guess) => {
    socket.emit('game:submitGuess', { playerId, type, guess: guess.map(Number) });
    setSent((prev) => ({ ...prev, [type]: true }));
  };

  const valid = (arr) => arr.every((v) => v !== '') && new Set(arr).size === 3;

  return (
    <div style={s.wrap}>
      <ClueTracker
        history={history}
        team={myTeam}
        keywords={keywords}
        teamColor={TEAM_COLORS[myTeam]}
        title="YOUR KEYWORDS & CLUE HISTORY"
      />

      <div style={s.panel}>
        <div style={s.panelTitle}>Decrypt your teammate's clues</div>
        {sent.decoding || cr.decodingSubmitted[myTeam] ? (
          <div style={s.done}>Decryption submitted</div>
        ) : amClueGiver ? (
          <div style={s.giverNote}>
            You gave the clues this round, so you can't decrypt them.
            A teammate needs to decrypt them.
          </div>
        ) : (
          <>
            <div style={s.subLabel}>{giverName ? `${giverName}'s` : "Your teammate's"} clues (select the keywords):</div>
            {myClues.map((clue, i) => (
              <div key={i} style={s.clueRow}>
                <span style={s.clueText}>{clue}</span>
                <Select
                  value={decoding[i]}
                  options={NUMS}
                  keywords={keywords}
                  onChange={(v) => {
                    const next = [...decoding];
                    next[i] = v;
                    setDecoding(next);
                  }}
                />
              </div>
            ))}
            <button
              style={{ ...s.submitBtn, opacity: valid(decoding) ? 1 : 0.4 }}
              onClick={() => submitGuess('decoding', decoding)}
              disabled={!valid(decoding)}
            >
              Submit Decryption
            </button>
          </>
        )}
      </div>

      <ClueTracker
        history={history}
        team={oppTeam}
        keywords={null}
        teamColor={TEAM_COLORS[oppTeam]}
        title="OPPONENTS' CLUES BY COLUMN"
      />

      <div style={s.panel}>
        <div style={s.panelTitle}>INTERCEPT opponent's code</div>
        {sent.interception || cr.interceptionSubmitted[myTeam] ? (
          <div style={s.done}>Interception submitted</div>
        ) : (
          <>
            <div style={s.subLabel}>Their clues (guess which keyword 1–4 each refers to):</div>
            {oppClues.map((clue, i) => (
              <div key={i} style={s.clueRow}>
                <span style={s.clueText}>{clue}</span>
                <Select
                  value={interception[i]}
                  options={NUMS}
                  onChange={(v) => {
                    const next = [...interception];
                    next[i] = v;
                    setInterception(next);
                  }}
                />
              </div>
            ))}
            <button
              style={{ ...s.submitBtn, opacity: valid(interception) ? 1 : 0.4 }}
              onClick={() => submitGuess('interception', interception)}
              disabled={!valid(interception)}
            >
              Submit Interception
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Select({ value, options, onChange, disabled, keywords }) {
  const label = (o) => (keywords && keywords[o - 1] ? `${o} – ${keywords[o - 1]}` : `${o}`);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        background: '#1e1e2e',
        border: '1px solid #3a3a5a',
        color: '#e0e0e0',
        borderRadius: 5,
        padding: '6px 10px',
        fontFamily: 'inherit',
        fontSize: 15,
        cursor: disabled ? 'default' : 'pointer',
        width: keywords ? 'auto' : 60,
        minWidth: 60,
      }}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>{label(o)}</option>
      ))}
    </select>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  panel: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  panelTitle: { fontWeight: 'bold', letterSpacing: 2, fontSize: 12, color: '#a0c4ff' },
  subLabel: { fontSize: 11, opacity: 0.5, marginBottom: 4 },
  clueRow: { display: 'flex', alignItems: 'center', gap: 10 },
  clueText: { flex: 1, fontSize: 14 },
  submitBtn: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, letterSpacing: 1, marginTop: 4 },
  done: { color: '#4caf50', fontSize: 13, textAlign: 'center', marginTop: 4 },
  giverNote: { fontSize: 13, opacity: 0.6, lineHeight: 1.5, fontStyle: 'italic' },
};
