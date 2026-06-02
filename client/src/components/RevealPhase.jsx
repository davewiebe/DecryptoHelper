import React from 'react';
import socket from '../socket';
import ClueColumns from './ClueColumns';

const TEAM_COLORS = { white: '#e8e8e8', black: '#7ab4ff' };

export default function RevealPhase({ cr, room, isHost, myTeam, playerId, keywords }) {
  if (!cr?.results) return null;

  const { results } = cr;

  return (
    <div style={s.wrap}>
      <h2 style={s.phase}>RESULTS — Round {cr.number}</h2>

      <div style={s.grid}>
        {['white', 'black'].map((team) => {
          const opp = team === 'white' ? 'black' : 'white';
          const intercepted = results.interceptions[team];
          const decoded = results.decodings[team];
          return (
            <div key={team} style={s.card}>
              <div style={{ ...s.teamLabel, color: TEAM_COLORS[team] }}>{team.toUpperCase()}</div>

              <ResultRow
                label="Interception"
                success={intercepted}
                detail={`Guessed: ${(cr.interceptionGuesses[team] || []).join('-')} | Actual: ${(cr.codes[opp] || []).join('-')}`}
              />
              <ResultRow
                label="Decoding"
                success={decoded}
                detail={`Guessed: ${(cr.decodingGuesses[team] || []).join('-')} | Actual: ${(cr.codes[team] || []).join('-')}`}
              />

              <div style={s.clueHistory}>
                <div style={s.clueHistLabel}>
                  Clues placed by column{!decoded && ' (struck = decoded into the wrong column)'}:
                </div>
                <ClueColumns
                  code={cr.codes[team]}
                  clues={cr.clues[team]}
                  decodingGuess={cr.decodingGuesses[team]}
                  keywords={team === myTeam ? keywords : null}
                  teamColor={TEAM_COLORS[team]}
                />
              </div>

              <div style={s.tokens}>
                <span style={{ color: '#4caf50' }}>⬤ {results.tokens[team].interceptions} interceptions</span>
                <span style={{ color: '#e53935' }}>⬤ {results.tokens[team].miscommunications} miscomms</span>
              </div>
            </div>
          );
        })}
      </div>

      {isHost && (
        <button style={s.nextBtn} onClick={() => socket.emit('game:nextRound', { playerId })}>
          Next Round →
        </button>
      )}
      {!isHost && <p style={s.waiting}>Waiting for host to start next round…</p>}
    </div>
  );
}

function ResultRow({ label, success, detail }) {
  return (
    <div style={s.resultRow}>
      <span style={{ ...s.resultIcon, color: success ? '#4caf50' : '#e53935' }}>
        {success ? '✓' : '✗'}
      </span>
      <div>
        <div style={s.resultLabel}>{label}: <strong style={{ color: success ? '#4caf50' : '#e53935' }}>{success ? 'Success' : 'Failed'}</strong></div>
        <div style={s.resultDetail}>{detail}</div>
      </div>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  phase: { margin: 0, fontSize: 16, letterSpacing: 3, color: '#a0c4ff' },
  grid: { display: 'grid', gridTemplateColumns: '1fr', gap: 16 },
  card: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  teamLabel: { fontWeight: 'bold', letterSpacing: 3, fontSize: 12 },
  resultRow: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  resultIcon: { fontSize: 20, lineHeight: 1 },
  resultLabel: { fontSize: 14 },
  resultDetail: { fontSize: 11, opacity: 0.5, marginTop: 2 },
  clueHistory: { background: '#0a0a0f', borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 5 },
  clueHistLabel: { fontSize: 10, opacity: 0.4, letterSpacing: 1, marginBottom: 2 },
  clueHistRow: { display: 'flex', gap: 10, fontSize: 13, alignItems: 'center' },
  histNum: { width: 18, height: 18, background: '#1e1e2e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, color: '#a0c4ff', textAlign: 'center', lineHeight: '18px' },
  tokens: { display: 'flex', gap: 12, fontSize: 12 },
  nextBtn: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 8, padding: '14px 0', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 2, fontSize: 15 },
  waiting: { textAlign: 'center', opacity: 0.5, fontSize: 13 },
};
