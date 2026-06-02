import React, { useState } from 'react';
import socket from '../socket';

export default function CluePhase({ cr, myTeam, playerId, amClueGiver, secretCode, keywords, players }) {
  const [clues, setClues] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);

  if (!cr) return null;

  const mySubmitted = cr.cluesSubmitted[myTeam];
  const claimedBy = cr.clueGivers[myTeam];
  const giverName = (players || []).find((p) => p.id === claimedBy)?.name;

  const submit = () => {
    if (clues.some((c) => !c.trim())) return;
    socket.emit('game:submitClues', { playerId, clues });
    setSubmitted(true);
  };

  const claim = () => socket.emit('game:claimClueGiver', { playerId });

  const oppTeam = myTeam === 'white' ? 'black' : 'white';

  return (
    <div style={s.wrap}>
      <h2 style={s.phase}>CLUE PHASE — Round {cr.number}</h2>

      {/* Nobody has claimed the clue-giver role yet */}
      {!mySubmitted && !claimedBy && (
        <div style={s.claimBox}>
          <div style={s.claimText}>No one is giving the clue for your team yet.</div>
          <button style={s.claimBtn} onClick={claim}>I'll give the clue</button>
        </div>
      )}

      {/* I'm the clue giver — show code + clue form */}
      {amClueGiver && secretCode && (
        <div style={s.codeBox}>
          <div style={s.codeLabel}>Your secret code — give clues in this order:</div>
          <div style={s.codeRow}>
            {secretCode.map((n, i) => (
              <div key={i} style={s.codeEntry}>
                <div style={s.codeNum}>{n}</div>
                <div style={s.codeWord}>{keywords[n - 1] || '?'}</div>
              </div>
            ))}
          </div>
          {!mySubmitted && !submitted && (
            <div style={s.clueForm}>
              {secretCode.map((n, i) => (
                <div key={i} style={s.clueRow}>
                  <span style={s.clueNum}>{n}</span>
                  <input
                    style={s.clueInput}
                    placeholder={`Clue for "${keywords[n - 1] || n}"`}
                    value={clues[i]}
                    onChange={(e) => {
                      const next = [...clues];
                      next[i] = e.target.value;
                      setClues(next);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && i === 2 && submit()}
                  />
                </div>
              ))}
              <button
                style={{ ...s.submitBtn, opacity: clues.every((c) => c.trim()) ? 1 : 0.4 }}
                onClick={submit}
                disabled={clues.some((c) => !c.trim())}
              >
                Submit Clues
              </button>
            </div>
          )}
          {(mySubmitted || submitted) && <div style={s.submitted}>Clues submitted — waiting for opponent…</div>}
        </div>
      )}

      {/* I claimed but the code hasn't arrived yet */}
      {amClueGiver && !secretCode && !mySubmitted && (
        <div style={s.waiting}>Revealing your secret code…</div>
      )}

      {/* A teammate (not me) claimed the role */}
      {claimedBy && !amClueGiver && !mySubmitted && (
        <div style={s.claimBox}>
          <div style={s.claimText}><strong>{giverName || 'A teammate'}</strong> is giving the clue.</div>
        </div>
      )}

      {/* My team's clues are in */}
      {mySubmitted && (
        <div style={s.waiting}>Your clues are submitted. Waiting for the other team…</div>
      )}

      <div style={s.status}>
        <StatusDot done={cr.cluesSubmitted.white} label="White clues" />
        <StatusDot done={cr.cluesSubmitted.black} label="Black clues" />
      </div>

      {cr.cluesSubmitted[oppTeam] && (
        <div style={s.oppClues}>
          <div style={s.oppLabel}>Opponent clues (intercept after both submit):</div>
          <div style={s.oppClueList}>
            {cr.clues[oppTeam].map((c, i) => (
              <div key={i} style={s.oppClueRow}>
                <span style={s.oppNum}>{i + 1}</span>
                <span>{c || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ done, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: done ? '#4caf50' : '#444' }} />
      <span style={{ fontSize: 12, opacity: done ? 1 : 0.4 }}>{label}</span>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  phase: { margin: 0, fontSize: 16, letterSpacing: 3, color: '#a0c4ff' },
  claimBox: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  claimText: { fontSize: 14, opacity: 0.8, textAlign: 'center' },
  claimBtn: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, letterSpacing: 1 },
  codeBox: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  codeLabel: { fontSize: 12, opacity: 0.6, letterSpacing: 1 },
  codeRow: { display: 'flex', gap: 12 },
  codeEntry: { flex: 1, background: '#1e1e2e', border: '1px solid #3a3a5a', borderRadius: 8, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  codeNum: { fontSize: 24, fontWeight: 'bold', color: '#a0c4ff' },
  codeWord: { fontSize: 13, opacity: 0.8, textAlign: 'center' },
  clueForm: { display: 'flex', flexDirection: 'column', gap: 10 },
  clueRow: { display: 'flex', alignItems: 'center', gap: 12 },
  clueNum: { fontSize: 20, fontWeight: 'bold', color: '#a0c4ff', width: 24, textAlign: 'center' },
  clueInput: { flex: 1, background: '#0a0a0f', border: '1px solid #3a3a5a', borderRadius: 6, color: '#e0e0e0', padding: '9px 12px', fontFamily: 'inherit', fontSize: 15 },
  submitBtn: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, letterSpacing: 1 },
  submitted: { color: '#4caf50', fontSize: 14, textAlign: 'center' },
  waiting: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 24, textAlign: 'center', opacity: 0.6, fontSize: 14 },
  status: { display: 'flex', gap: 20 },
  oppClues: { background: '#0d1a0d', border: '1px solid #1a3a1a', borderRadius: 10, padding: 16 },
  oppLabel: { fontSize: 11, opacity: 0.5, marginBottom: 10, letterSpacing: 1 },
  oppClueList: { display: 'flex', flexDirection: 'column', gap: 8 },
  oppClueRow: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 15 },
  oppNum: { width: 20, height: 20, background: '#1a3a1a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4caf50', flexShrink: 0 },
};
