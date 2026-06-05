const rooms = new Map();
let playerSeq = 0;

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function genPlayerId() {
  playerSeq += 1;
  return `p${Date.now().toString(36)}${playerSeq}`;
}

function createRoom(socketId, clientId, hostName) {
  const code = generateCode();
  const hostId = genPlayerId();
  const room = {
    code,
    phase: 'lobby',
    hostId,
    players: new Map([[hostId, { id: hostId, name: hostName, team: null, ownerSocketId: socketId, clientId }]]),
    teams: {
      white: { keywords: ['', '', '', ''], interceptions: 0, miscommunications: 0 },
      black: { keywords: ['', '', '', ''], interceptions: 0, miscommunications: 0 },
    },
    round: 0,
    maxRounds: 8,
    currentRound: null,
    history: [],
  };
  rooms.set(code, room);
  return { room, playerId: hostId };
}

function addPlayer(code, socketId, clientId, name) {
  const room = rooms.get(code);
  if (!room) return null;
  const id = genPlayerId();
  room.players.set(id, { id, name, team: null, ownerSocketId: socketId, clientId });
  return { room, playerId: id };
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function removePlayer(code, playerId) {
  const room = rooms.get(code);
  if (!room) return null;
  room.players.delete(playerId);
  return reconcile(code, room);
}

// Detach (don't remove) a socket's players on disconnect, so a quick
// reconnect can reclaim them. Returns the room (not deleted here).
function detachSocket(code, socketId) {
  const room = rooms.get(code);
  if (!room) return null;
  for (const p of room.players.values()) {
    if (p.ownerSocketId === socketId) p.ownerSocketId = null;
  }
  return room;
}

// Re-attach all of a device's players (matched by clientId) to a new socket.
function reattachClient(code, clientId, socketId) {
  const room = rooms.get(code);
  if (!room) return null;
  const playerIds = [];
  for (const p of room.players.values()) {
    if (p.clientId === clientId) {
      p.ownerSocketId = socketId;
      playerIds.push(p.id);
    }
  }
  return { room, playerIds };
}

// Remove every player belonging to a device (explicit leave / grace expiry).
function removePlayersByClient(code, clientId) {
  const room = rooms.get(code);
  if (!room) return null;
  for (const [pid, p] of [...room.players]) {
    if (p.clientId === clientId) room.players.delete(pid);
  }
  return reconcile(code, room);
}

function reconcile(code, room) {
  if (room.players.size === 0) {
    rooms.delete(code);
    return null;
  }
  if (!room.players.has(room.hostId)) {
    room.hostId = room.players.keys().next().value;
  }
  return room;
}

function roomView(room) {
  // Hide each team's secret code until results are shown.
  let currentRound = room.currentRound;
  if (currentRound) {
    const showCodes = room.phase === 'reveal' || room.phase === 'ended';
    currentRound = {
      ...currentRound,
      codes: showCodes ? currentRound.codes : { white: null, black: null },
    };
  }

  return {
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    players: Array.from(room.players.values()).map((p) => ({ id: p.id, name: p.name, team: p.team })),
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
    currentRound,
    history: room.history,
  };
}

module.exports = {
  createRoom,
  addPlayer,
  getRoom,
  removePlayer,
  detachSocket,
  reattachClient,
  removePlayersByClient,
  roomView,
};
