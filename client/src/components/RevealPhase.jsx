import React from 'react';
import socket from '../socket';

export default function RevealPhase({ cr, isHost, playerId }) {
  if (!cr?.results) return null;

  return (
    <div style={s.wrap}>
      <h2 style={s.phase}>RESULTS — Round {cr.number}</h2>

      {isHost && (
        <button style={s.nextBtn} onClick={() => socket.emit('game:nextRound', { playerId })}>
          Next Round →
        </button>
      )}
      {!isHost && <p style={s.waiting}>Waiting for host to start next round…</p>}
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  phase: { margin: 0, fontSize: 16, letterSpacing: 3, color: '#a0c4ff' },
  nextBtn: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 2, fontSize: 15 },
  waiting: { textAlign: 'center', opacity: 0.5, fontSize: 13 },
};
