import React from 'react';
import CluePhase from './CluePhase';
import GuessPhase from './GuessPhase';
import RevealPhase from './RevealPhase';
import EndedPhase from './EndedPhase';
import ScoreBar from './ScoreBar';

const TEAM_COLORS = { white: '#e8e8e8', black: '#7ab4ff' };

export default function GameBoard({ room, playerId, roomCode, keywords, secretCode, onLeave }) {
  if (!room) return null;

  const me = room.players.find((p) => p.id === playerId);
  const myTeam = me?.team;
  const isHost = room.hostId === playerId;
  const cr = room.currentRound;
  const phase = room.phase;

  const amClueGiver = cr && myTeam && cr.clueGivers[myTeam] === playerId;

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div style={s.roomInfo}>
          <span style={s.roomCode}>{roomCode}</span>
          <span style={s.round}>Round {room.round}/{room.maxRounds}</span>
        </div>
        {myTeam && (
          <span style={{ ...s.myTeam, color: TEAM_COLORS[myTeam] }}>
            {myTeam.toUpperCase()} TEAM
          </span>
        )}
        <button style={s.leaveBtn} onClick={onLeave}>Leave</button>
      </div>

      <ScoreBar teams={room.teams} />

      <div style={s.keywords}>
        {keywords.map((kw, i) => (
          <div key={i} style={s.kwChip}>
            <span style={s.kwNum}>{i + 1}</span>
            <span style={s.kwWord}>{kw || '?'}</span>
          </div>
        ))}
      </div>

      <div style={s.content}>
        {phase === 'cluing' && (
          <CluePhase
            key={playerId}
            cr={cr}
            myTeam={myTeam}
            playerId={playerId}
            amClueGiver={amClueGiver}
            secretCode={secretCode}
            keywords={keywords}
            players={room.players}
          />
        )}
        {phase === 'guessing' && (
          <GuessPhase key={playerId} cr={cr} myTeam={myTeam} playerId={playerId} />
        )}
        {phase === 'reveal' && (
          <RevealPhase cr={cr} room={room} isHost={isHost} myTeam={myTeam} playerId={playerId} keywords={keywords} />
        )}
        {phase === 'ended' && (
          <EndedPhase room={room} myTeam={myTeam} history={room.history} />
        )}
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: 800, margin: '0 auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  topBar: { display: 'flex', alignItems: 'center', gap: 16 },
  roomInfo: { display: 'flex', flexDirection: 'column' },
  roomCode: { fontSize: 20, letterSpacing: 4, color: '#a0c4ff', fontWeight: 'bold' },
  round: { fontSize: 12, opacity: 0.5 },
  myTeam: { flex: 1, textAlign: 'center', letterSpacing: 3, fontWeight: 'bold', fontSize: 13 },
  leaveBtn: { background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 },
  keywords: { display: 'flex', gap: 10 },
  kwChip: {
    flex: 1, background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 8,
    padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
  kwNum: { fontSize: 11, opacity: 0.4, letterSpacing: 1 },
  kwWord: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-word' },
  content: { flex: 1 },
};
