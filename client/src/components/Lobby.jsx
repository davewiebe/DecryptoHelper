import React, { useState } from 'react';
import socket from '../socket';

const TEAM_COLORS = { white: '#e8e8e8', black: '#a0c4ff' };
const TEAM_BG = { white: '#1e1e1e', black: '#0d1a2e' };

export default function Lobby({ room, playerId, onLeave }) {
  const [keywords, setKeywords] = useState({ white: ['', '', '', ''], black: ['', '', '', ''] });
  const [editing, setEditing] = useState(null); // 'white' | 'black' | null

  if (!room) return null;

  const isHost = room.hostId === playerId;
  const me = room.players.find((p) => p.id === playerId);
  const myTeam = me?.team;

  const whitePlayers = room.players.filter((p) => p.team === 'white');
  const blackPlayers = room.players.filter((p) => p.team === 'black');
  const unassigned = room.players.filter((p) => !p.team);

  const joinTeam = (team) => socket.emit('room:setTeam', { playerId, team });
  const leaveTeam = () => socket.emit('room:setTeam', { playerId, team: null });

  const saveKeywords = (team) => {
    socket.emit('room:setKeywords', { playerId, team, keywords: keywords[team] });
    setEditing(null);
  };

  const canStart =
    isHost &&
    whitePlayers.length > 0 &&
    blackPlayers.length > 0;

  const start = () => socket.emit('room:start', { playerId });

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <span style={s.label}>ROOM</span>
          <span style={s.code}>{room.code}</span>
        </div>
        <button style={s.leaveBtn} onClick={onLeave}>Leave</button>
      </div>

      <div style={s.teams}>
        {['white', 'black'].map((team) => {
          const players = team === 'white' ? whitePlayers : blackPlayers;
          const isMyTeam = myTeam === team;
          return (
            <div key={team} style={{ ...s.teamCard, background: TEAM_BG[team], borderColor: TEAM_COLORS[team] + '44' }}>
              <div style={{ ...s.teamName, color: TEAM_COLORS[team] }}>
                {team.toUpperCase()} TEAM
              </div>
              <div style={s.playerList}>
                {players.map((p) => (
                  <div key={p.id} style={s.playerRow}>
                    {p.name} {p.id === room.hostId && <span style={s.hostBadge}>HOST</span>}
                  </div>
                ))}
                {players.length === 0 && <div style={s.empty}>No players yet</div>}
              </div>

              {!isMyTeam && (
                <button
                  style={{ ...s.teamBtn, borderColor: TEAM_COLORS[team], color: TEAM_COLORS[team] }}
                  onClick={() => joinTeam(team)}
                >
                  Join {team}
                </button>
              )}
              {isMyTeam && (
                <button style={s.leaveTeamBtn} onClick={leaveTeam}>Leave team</button>
              )}

              {isHost && editing !== team && (
                <button style={s.editKwBtn} onClick={() => setEditing(team)}>
                  Set keywords
                </button>
              )}
              {isHost && editing === team && (
                <div style={s.kwEditor}>
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      style={s.kwInput}
                      placeholder={`Keyword ${i + 1}`}
                      value={keywords[team][i]}
                      onChange={(e) => {
                        const next = [...keywords[team]];
                        next[i] = e.target.value;
                        setKeywords({ ...keywords, [team]: next });
                      }}
                    />
                  ))}
                  <div style={s.row}>
                    <button style={s.saveBtn} onClick={() => saveKeywords(team)}>Save</button>
                    <button style={s.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {unassigned.length > 0 && (
        <div style={s.unassigned}>
          Unassigned: {unassigned.map((p) => p.name).join(', ')}
        </div>
      )}

      {isHost && (
        <button style={{ ...s.startBtn, opacity: canStart ? 1 : 0.4 }} onClick={start} disabled={!canStart}>
          START GAME
        </button>
      )}
      {!isHost && <p style={s.waiting}>Waiting for host to start…</p>}
    </div>
  );
}

const s = {
  page: { maxWidth: 720, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 11, opacity: 0.5, marginRight: 8, letterSpacing: 2 },
  code: { fontSize: 28, letterSpacing: 6, color: '#a0c4ff', fontWeight: 'bold' },
  leaveBtn: { background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' },
  teams: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  teamCard: { border: '1px solid', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  teamName: { fontWeight: 'bold', letterSpacing: 3, fontSize: 13 },
  playerList: { display: 'flex', flexDirection: 'column', gap: 4, minHeight: 40 },
  playerRow: { fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 },
  hostBadge: { fontSize: 9, background: '#3a6fd8', color: '#fff', borderRadius: 3, padding: '1px 5px', letterSpacing: 1 },
  empty: { fontSize: 13, opacity: 0.4, fontStyle: 'italic' },
  teamBtn: { background: 'transparent', border: '1px solid', borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1 },
  leaveTeamBtn: { background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontFamily: 'inherit' },
  editKwBtn: { background: 'transparent', border: '1px dashed #444', color: '#888', borderRadius: 6, padding: '6px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 },
  kwEditor: { display: 'flex', flexDirection: 'column', gap: 8 },
  kwInput: { background: '#0a0a0f', border: '1px solid #3a3a5a', borderRadius: 5, color: '#e0e0e0', padding: '7px 10px', fontFamily: 'inherit', fontSize: 14 },
  row: { display: 'flex', gap: 8 },
  saveBtn: { flex: 1, background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 0', cursor: 'pointer', fontFamily: 'inherit' },
  cancelBtn: { flex: 1, background: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: 5, padding: '8px 0', cursor: 'pointer', fontFamily: 'inherit' },
  unassigned: { fontSize: 13, opacity: 0.5, textAlign: 'center' },
  startBtn: { background: '#3a6fd8', color: '#fff', border: 'none', borderRadius: 8, padding: '16px 0', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 3, fontSize: 16, fontWeight: 'bold' },
  waiting: { textAlign: 'center', opacity: 0.5, fontSize: 14 },
};
