const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function createRoom(hostId, hostName) {
  const code = generateCode();
  const room = {
    code,
    phase: 'lobby',
    hostId,
    players: new Map([[hostId, { id: hostId, name: hostName, team: null }]]),
    teams: {
      white: { keywords: ['', '', '', ''], interceptions: 0, miscommunications: 0 },
      black: { keywords: ['', '', '', ''], interceptions: 0, miscommunications: 0 },
    },
    round: 0,
    maxRounds: 8,
    clueGiverIndex: { white: 0, black: 0 },
    currentRound: null,
    history: [],
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function removePlayer(code, playerId) {
  const room = rooms.get(code);
  if (!room) return null;
  room.players.delete(playerId);
  if (room.players.size === 0) {
    rooms.delete(code);
    return null;
  }
  if (room.hostId === playerId) {
    room.hostId = room.players.keys().next().value;
  }
  return room;
}

function roomView(room) {
  return {
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    players: Array.from(room.players.values()),
    teams: {
      white: {
        interceptions: room.teams.white.interceptions,
        miscommunications: room.teams.white.miscommunications,
      },
      black: {
        interceptions: room.teams.black.interceptions,
        miscommunications: room.teams.black.miscommunications,
      },
    },
    round: room.round,
    maxRounds: room.maxRounds,
    currentRound: room.currentRound,
    history: room.history,
  };
}

module.exports = { createRoom, getRoom, removePlayer, roomView };
