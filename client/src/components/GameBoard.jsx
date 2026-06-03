import React from 'react';
import CluePhase from './CluePhase';
import GuessPhase from './GuessPhase';
import RevealPhase from './RevealPhase';
import EndedPhase from './EndedPhase';
import ScoreBar from './ScoreBar';
import ClueTracker from './ClueTracker';

const TEAM_COLORS = { white: '#e8e8e8', black: '#7ab4ff' };

export default function GameBoard({ room, playerId, roomCode, keywords, secretCode, onLeave }) {
  if (!room) return null;

  const me = room.players.find((p) => p.id === playerId);
  const myTeam = me?.team;
  const isHost = room.hostId === playerId;
  const cr = room.currentRound;
  const phase = room.phase;

  const amClueGiver = cr && myTeam && cr.clueGivers[myTeam] === playerId;
  const oppTeam = myTeam === 'white' ? 'black' : 'white';

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

      {/* GAME STATUS */}
      <ScoreBar teams={room.teams} />

      {/* ROUND STATUS — phase header + per-team submission indicators */}
      {(phase === 'cluing' || phase === 'guessing') && cr && (
        <div style={s.roundStatus}>
          <h2 style={s.phaseHeader}>
            {phase === 'cluing' ? 'CLUE PHASE' : 'GUESSING PHASE'} — Round {cr.number}
          </h2>
          <div style={s.indicators}>
            {phase === 'cluing' ? (
              <>
                <StatusDot done={cr.cluesSubmitted.white} label="White clues" />
                <StatusDot done={cr.cluesSubmitted.black} label="Black clues" />
              </>
            ) : (
              <>
                <StatusDot done={cr.decodingSubmitted.white} label="White decode" />
                <StatusDot done={cr.decodingSubmitted.black} label="Black decode" />
                <StatusDot done={cr.interceptionSubmitted.white} label="White intercept" />
                <StatusDot done={cr.interceptionSubmitted.black} label="Black intercept" />
              </>
            )}
          </div>
        </div>
      )}

      {/* ROUND ACTIONS */}
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
            history={room.history}
          />
        )}
        {phase === 'guessing' && (
          <GuessPhase
            key={playerId}
            cr={cr}
            myTeam={myTeam}
            playerId={playerId}
            keywords={keywords}
            history={room.history}
          />
        )}
        {phase === 'reveal' && (
          <RevealPhase cr={cr} room={room} isHost={isHost} myTeam={myTeam} playerId={playerId} />
        )}
        {phase === 'ended' && (
          <EndedPhase room={room} myTeam={myTeam} history={room.history} />
        )}
      </div>

      {/* Reveal: show both worksheets below the results (cluing/guessing
          render their own worksheets inline paired with their actions). */}
      {myTeam && phase === 'reveal' && (
        <>
          <ClueTracker
            history={room.history}
            team={myTeam}
            keywords={keywords}
            teamColor={TEAM_COLORS[myTeam]}
            title="YOUR KEYWORDS & CLUE HISTORY"
          />
          <ClueTracker
            history={room.history}
            team={oppTeam}
            keywords={null}
            teamColor={TEAM_COLORS[oppTeam]}
            title="INTERCEPTION NOTES — OPPONENT CLUES BY COLUMN"
          />
        </>
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
  page: { maxWidth: 800, margin: '0 auto', padding: 12, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 },
  roundStatus: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  phaseHeader: { margin: 0, fontSize: 16, letterSpacing: 3, color: '#a0c4ff', textAlign: 'center' },
  indicators: { display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  topBar: { display: 'flex', alignItems: 'center', gap: 16 },
  roomInfo: { display: 'flex', flexDirection: 'column' },
  roomCode: { fontSize: 20, letterSpacing: 4, color: '#a0c4ff', fontWeight: 'bold' },
  round: { fontSize: 12, opacity: 0.5 },
  myTeam: { flex: 1, textAlign: 'center', letterSpacing: 3, fontWeight: 'bold', fontSize: 13 },
  leaveBtn: { background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 },
  content: { flex: 1 },
};
