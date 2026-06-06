import React from 'react';

const TEAM_COLORS = { white: '#e8e8e8', black: '#7ab4ff', draw: '#aaa' };

// Big winner banner shown at the end of the game. The rest of the end screen
// (round status, worksheets, round results) is rendered by GameBoard, reusing
// the round-reveal layout.
export default function EndedPhase({ room, myTeam }) {
  const winner = room.winner;
  const iWon = winner === myTeam;
  const isDraw = winner === 'draw';

  return (
    <div style={s.banner}>
      <div style={{ ...s.winnerText, color: winner ? TEAM_COLORS[winner] : '#aaa' }}>
        {isDraw ? 'DRAW' : `${(winner || '').toUpperCase()} TEAM WON`}
      </div>
      {myTeam && !isDraw && (
        <div style={{ ...s.youLabel, color: iWon ? '#4caf50' : '#e53935' }}>
          {iWon ? 'Your team won!' : 'Your team lost.'}
        </div>
      )}
    </div>
  );
}

const s = {
  banner: { textAlign: 'center', padding: 32, background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 12 },
  winnerText: { fontSize: 40, fontWeight: 'bold', letterSpacing: 6 },
  youLabel: { fontSize: 18, marginTop: 8, letterSpacing: 2 },
};
