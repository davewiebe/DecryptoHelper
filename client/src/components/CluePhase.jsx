import React, { useState } from 'react';
import socket from '../socket';
import ClueTracker from './ClueTracker';

const TEAM_COLORS = { white: '#e8e8e8', black: '#7ab4ff' };

export default function CluePhase({ cr, myTeam, playerId, amClueGiver, secretCode, keywords, players, history }) {
  const [clues, setClues] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);

  if (!cr) return null;

  const mySubmitted = cr.cluesSubmitted[myTeam];
  const claimedBy = cr.clueGivers[myTeam];
  const giverName = (players || []).find((p) => p.id === claimedBy)?.name;
  const oppTeam = myTeam === 'white' ? 'black' : 'white';

  const submit = () => {
    if (clues.some((c) => !c.trim())) return;
    socket.emit('game:submitClues', { playerId, clues });
    setSubmitted(true);
  };

  const claim = () => socket.emit('game:claimClueGiver', { playerId });

  return (
    <div style={s.wrap}>
      <ClueTracker
        history={history}
        team={myTeam}
        keywords={keywords}
        teamColor={TEAM_COLORS[myTeam]}
        title="YOUR KEYWORDS & CLUES"
      />

      {/* Nobody has claimed the clue-giver role yet */}
      {!mySubmitted && !claimedBy && (
        <div style={s.claimBox}>
          <div style={s.claimText}>No one is giving the clue for your team yet.</div>
          <button style={s.claimBtn} onClick={claim}>I'll give the clue</button>
        </div>
      )}

      {/* I'm the clue giver and haven't submitted — show code + clue form */}
      {amClueGiver && secretCode && !mySubmitted && !submitted && (
        <div style={s.codeBox}>
          <div style={s.codeLabel}>Your secret code — give clues in this order:</div>
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
      {(mySubmitted || submitted) && (
        <div style={s.waiting}>Your clues are submitted. Waiting for the other team…</div>
      )}

      <ClueTracker
        history={history}
        team={oppTeam}
        keywords={null}
        teamColor={TEAM_COLORS[oppTeam]}
        title={`${oppTeam.toUpperCase()} TEAM'S CLUES`}
      />
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  claimBox: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  claimText: { fontSize: 14, opacity: 0.8, textAlign: 'center' },
  claimBtn: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, letterSpacing: 1 },
  codeBox: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  codeLabel: { fontSize: 12, opacity: 0.6, letterSpacing: 1 },
  clueForm: { display: 'flex', flexDirection: 'column', gap: 10 },
  clueRow: { display: 'flex', alignItems: 'center', gap: 12 },
  clueNum: { fontSize: 20, fontWeight: 'bold', color: '#a0c4ff', width: 24, textAlign: 'center' },
  clueInput: { flex: 1, background: '#0a0a0f', border: '1px solid #3a3a5a', borderRadius: 6, color: '#e0e0e0', padding: '9px 12px', fontFamily: 'inherit', fontSize: 15 },
  submitBtn: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, letterSpacing: 1 },
  waiting: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 24, textAlign: 'center', opacity: 0.6, fontSize: 14 },
};
