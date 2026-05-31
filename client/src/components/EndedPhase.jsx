import React from 'react';

const TEAM_COLORS = { white: '#e8e8e8', black: '#7ab4ff', draw: '#aaa' };

export default function EndedPhase({ room, myTeam, history }) {
  const winner = room.winner;
  const iWon = winner === myTeam;
  const isDraw = winner === 'draw';

  return (
    <div style={s.wrap}>
      <div style={s.banner}>
        <div style={{ ...s.winnerText, color: winner ? TEAM_COLORS[winner] : '#aaa' }}>
          {isDraw ? 'DRAW' : `${(winner || '').toUpperCase()} WINS`}
        </div>
        {myTeam && !isDraw && (
          <div style={{ ...s.youLabel, color: iWon ? '#4caf50' : '#e53935' }}>
            {iWon ? 'Your team won!' : 'Your team lost.'}
          </div>
        )}
      </div>

      <div style={s.finalScores}>
        {['white', 'black'].map((team) => (
          <div key={team} style={s.scoreCard}>
            <div style={{ ...s.teamName, color: TEAM_COLORS[team] }}>{team.toUpperCase()}</div>
            <div style={s.scoreRow}>
              <span style={{ color: '#4caf50' }}>{room.teams[team].interceptions} interceptions</span>
              <span style={{ color: '#e53935' }}>{room.teams[team].miscommunications} miscommunications</span>
            </div>
          </div>
        ))}
      </div>

      <div style={s.historySection}>
        <div style={s.histTitle}>ROUND HISTORY</div>
        {history.filter((h) => h.type === 'round').map((h) => (
          <div key={h.round} style={s.histCard}>
            <div style={s.histRound}>Round {h.round}</div>
            {['white', 'black'].map((team) => (
              <div key={team} style={s.histTeam}>
                <span style={{ color: TEAM_COLORS[team], fontSize: 11 }}>{team.toUpperCase()}</span>
                <span style={s.histClues}>{h.summary.clues[team].join(' / ')}</span>
                <span style={{ color: h.summary.results?.interceptions[team] ? '#4caf50' : '#666', fontSize: 11 }}>
                  intercept {h.summary.results?.interceptions[team] ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  banner: { textAlign: 'center', padding: 32, background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 12 },
  winnerText: { fontSize: 48, fontWeight: 'bold', letterSpacing: 8 },
  youLabel: { fontSize: 18, marginTop: 8, letterSpacing: 2 },
  finalScores: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  scoreCard: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  teamName: { fontWeight: 'bold', letterSpacing: 3, fontSize: 13 },
  scoreRow: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 },
  historySection: { display: 'flex', flexDirection: 'column', gap: 10 },
  histTitle: { fontSize: 11, letterSpacing: 3, opacity: 0.4 },
  histCard: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 },
  histRound: { fontSize: 12, opacity: 0.5, marginBottom: 2 },
  histTeam: { display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 },
  histClues: { flex: 1, opacity: 0.7 },
};
