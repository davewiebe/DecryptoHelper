import React, { useState } from 'react';
import socket from '../socket';

const NUMS = [1, 2, 3, 4];

export default function GuessPhase({ cr, myTeam }) {
  const [interception, setInterception] = useState(['', '', '']);
  const [decoding, setDecoding] = useState(['', '', '']);
  const [sent, setSent] = useState({ interception: false, decoding: false });

  if (!cr || !myTeam) return null;

  const oppTeam = myTeam === 'white' ? 'black' : 'white';
  const oppClues = cr.clues[oppTeam];
  const myClues = cr.clues[myTeam];

  const submitGuess = (type, guess) => {
    socket.emit('game:submitGuess', { type, guess: guess.map(Number) });
    setSent((prev) => ({ ...prev, [type]: true }));
  };

  const valid = (arr) => arr.every((v) => v !== '') && new Set(arr).size === 3;

  return (
    <div style={s.wrap}>
      <h2 style={s.phase}>GUESSING PHASE — Round {cr.number}</h2>

      <div style={s.panels}>
        <div style={s.panel}>
          <div style={s.panelTitle}>INTERCEPT opponent's code</div>
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
                disabled={sent.interception || cr.interceptionSubmitted[myTeam]}
              />
            </div>
          ))}
          {!sent.interception && !cr.interceptionSubmitted[myTeam] && (
            <button
              style={{ ...s.submitBtn, opacity: valid(interception) ? 1 : 0.4 }}
              onClick={() => submitGuess('interception', interception)}
              disabled={!valid(interception)}
            >
              Submit Interception
            </button>
          )}
          {(sent.interception || cr.interceptionSubmitted[myTeam]) && (
            <div style={s.done}>Interception submitted</div>
          )}
        </div>

        <div style={s.panel}>
          <div style={s.panelTitle}>DECODE your own code</div>
          <div style={s.subLabel}>Your clues (confirm the order):</div>
          {myClues.map((clue, i) => (
            <div key={i} style={s.clueRow}>
              <span style={s.clueText}>{clue}</span>
              <Select
                value={decoding[i]}
                options={NUMS}
                onChange={(v) => {
                  const next = [...decoding];
                  next[i] = v;
                  setDecoding(next);
                }}
                disabled={sent.decoding || cr.decodingSubmitted[myTeam]}
              />
            </div>
          ))}
          {!sent.decoding && !cr.decodingSubmitted[myTeam] && (
            <button
              style={{ ...s.submitBtn, opacity: valid(decoding) ? 1 : 0.4 }}
              onClick={() => submitGuess('decoding', decoding)}
              disabled={!valid(decoding)}
            >
              Submit Decoding
            </button>
          )}
          {(sent.decoding || cr.decodingSubmitted[myTeam]) && (
            <div style={s.done}>Decoding submitted</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Select({ value, options, onChange, disabled }) {
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
        width: 60,
      }}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  phase: { margin: 0, fontSize: 16, letterSpacing: 3, color: '#a0c4ff' },
  panels: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  panel: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  panelTitle: { fontWeight: 'bold', letterSpacing: 2, fontSize: 12, color: '#a0c4ff' },
  subLabel: { fontSize: 11, opacity: 0.5, marginBottom: 4 },
  clueRow: { display: 'flex', alignItems: 'center', gap: 10 },
  clueText: { flex: 1, fontSize: 14 },
  submitBtn: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, letterSpacing: 1, marginTop: 4 },
  done: { color: '#4caf50', fontSize: 13, textAlign: 'center', marginTop: 4 },
};
