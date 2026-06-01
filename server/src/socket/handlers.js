const {
  createRoom,
  addPlayer,
  getRoom,
  removePlayersBySocket,
  roomView,
} = require('../game/roomManager');
const { startRound, submitClues, submitGuess } = require('../game/game');

function emit(io, room, event, data) {
  io.to(room.code).emit(event, data);
}

function broadcastRoom(io, room) {
  io.to(room.code).emit('room:state', roomView(room));
}

// Send each socket the private data (team keywords + secret code) for every
// player it owns, keyed by playerId. Supports several local players per device.
function sendPrivate(io, room) {
  const bySocket = new Map();
  for (const player of room.players.values()) {
    if (!player.ownerSocketId) continue;
    let entry = bySocket.get(player.ownerSocketId);
    if (!entry) {
      entry = {};
      bySocket.set(player.ownerSocketId, entry);
    }
    const priv = {
      keywords: player.team ? room.teams[player.team].keywords : [],
      secretCode: null,
    };
    if (
      room.phase !== 'lobby' &&
      room.currentRound &&
      player.team &&
      room.currentRound.clueGivers[player.team] === player.id
    ) {
      priv.secretCode = room.currentRound.codes[player.team];
    }
    entry[player.id] = priv;
  }
  for (const [socketId, map] of bySocket) {
    const s = io.sockets.sockets.get(socketId);
    if (s) s.emit('game:private', map);
  }
}

function registerHandlers(io, socket) {
  let currentRoom = null;
  const owned = new Set(); // playerIds this socket controls

  function ownedPlayer(room, playerId) {
    if (!room || !playerId || !owned.has(playerId)) return null;
    return room.players.get(playerId) || null;
  }

  function cleanup() {
    if (!currentRoom) return;
    const room = removePlayersBySocket(currentRoom, socket.id);
    if (room) {
      broadcastRoom(io, room);
      sendPrivate(io, room);
    }
    owned.clear();
    currentRoom = null;
  }

  socket.on('room:create', ({ name }) => {
    if (!name) return;
    const { room, playerId } = createRoom(socket.id, name);
    socket.join(room.code);
    currentRoom = room.code;
    owned.add(playerId);
    socket.emit('room:joined', { code: room.code, playerId });
    broadcastRoom(io, room);
    sendPrivate(io, room);
  });

  socket.on('room:join', ({ code, name }) => {
    const room = getRoom(code);
    if (!room) return socket.emit('room:error', { message: 'Room not found' });
    if (room.phase !== 'lobby') return socket.emit('room:error', { message: 'Game already started' });
    if (!name) return;
    const { playerId } = addPlayer(code, socket.id, name);
    socket.join(code);
    currentRoom = code;
    owned.add(playerId);
    socket.emit('room:joined', { code, playerId });
    broadcastRoom(io, room);
    sendPrivate(io, room);
  });

  // Hotseat: add another local player controlled by this same socket/device.
  socket.on('room:addLocalPlayer', ({ name }) => {
    const room = getRoom(currentRoom);
    if (!room) return;
    if (room.phase !== 'lobby') return socket.emit('room:error', { message: 'Can only add players in the lobby' });
    if (!name) return;
    const { playerId } = addPlayer(currentRoom, socket.id, name);
    owned.add(playerId);
    socket.emit('room:localPlayerAdded', { playerId });
    broadcastRoom(io, room);
    sendPrivate(io, room);
  });

  socket.on('room:setTeam', ({ playerId, team }) => {
    const room = getRoom(currentRoom);
    const player = ownedPlayer(room, playerId);
    if (!player || room.phase !== 'lobby') return;
    player.team = team === 'white' || team === 'black' ? team : null;
    broadcastRoom(io, room);
    sendPrivate(io, room);
  });

  socket.on('room:setKeywords', ({ playerId, team, keywords }) => {
    const room = getRoom(currentRoom);
    const player = ownedPlayer(room, playerId);
    if (!player || room.phase !== 'lobby') return;
    if (room.hostId !== playerId) return socket.emit('room:error', { message: 'Only host can set keywords' });
    if (!Array.isArray(keywords) || keywords.length !== 4) return;
    if (team !== 'white' && team !== 'black') return;
    room.teams[team].keywords = keywords.map(String);
    sendPrivate(io, room);
  });

  socket.on('room:start', ({ playerId }) => {
    const room = getRoom(currentRoom);
    const player = ownedPlayer(room, playerId);
    if (!player || room.phase !== 'lobby') return;
    if (room.hostId !== playerId) return;

    const whitePlayers = Array.from(room.players.values()).filter((p) => p.team === 'white');
    const blackPlayers = Array.from(room.players.values()).filter((p) => p.team === 'black');
    if (!whitePlayers.length || !blackPlayers.length) {
      return socket.emit('room:error', { message: 'Each team needs at least one player' });
    }
    for (const team of ['white', 'black']) {
      if (room.teams[team].keywords.some((k) => !k.trim())) {
        return socket.emit('room:error', { message: `${team} team keywords are incomplete` });
      }
    }

    startRound(room);
    broadcastRoom(io, room);
    sendPrivate(io, room);
    emit(io, room, 'game:started', { round: room.round });
  });

  socket.on('game:submitClues', ({ playerId, clues }) => {
    const room = getRoom(currentRoom);
    const player = ownedPlayer(room, playerId);
    if (!player || !player.team) return;

    if (room.currentRound.clueGivers[player.team] !== playerId) {
      return socket.emit('room:error', { message: 'You are not the clue giver this round' });
    }

    const result = submitClues(room, player.team, clues);
    if (result.error) return socket.emit('room:error', { message: result.error });

    broadcastRoom(io, room);
    sendPrivate(io, room);
    if (result.phase === 'guessing') emit(io, room, 'game:phase', { phase: 'guessing' });
  });

  socket.on('game:submitGuess', ({ playerId, type, guess }) => {
    const room = getRoom(currentRoom);
    const player = ownedPlayer(room, playerId);
    if (!player || !player.team) return;

    const result = submitGuess(room, player.team, type, guess);
    if (result.error) return socket.emit('room:error', { message: result.error });

    broadcastRoom(io, room);
    sendPrivate(io, room);

    if (result.phase === 'ended') {
      emit(io, room, 'game:ended', { winner: result.winner, results: result.results });
    } else if (result.phase === 'reveal') {
      emit(io, room, 'game:reveal', { results: result.results });
    }
  });

  socket.on('game:nextRound', ({ playerId }) => {
    const room = getRoom(currentRoom);
    const player = ownedPlayer(room, playerId);
    if (!player || room.phase !== 'reveal') return;
    if (room.hostId !== playerId) return;
    startRound(room);
    broadcastRoom(io, room);
    sendPrivate(io, room);
    emit(io, room, 'game:roundStarted', { round: room.round });
  });

  socket.on('disconnect', cleanup);
  socket.on('room:leave', cleanup);
}

module.exports = { registerHandlers };
