const { createRoom, getRoom, removePlayer, roomView } = require('../game/roomManager');
const { startRound, submitClues, submitGuess } = require('../game/game');

function emit(io, room, event, data) {
  io.to(room.code).emit(event, data);
}

function broadcastRoom(io, room) {
  // Send room state; keywords are team-private so we send separately
  const view = roomView(room);
  io.to(room.code).emit('room:state', view);
}

function sendKeywords(io, room) {
  for (const [playerId, player] of room.players) {
    if (!player.team) continue;
    const socket = io.sockets.sockets.get(playerId);
    if (socket) {
      socket.emit('game:keywords', room.teams[player.team].keywords);
    }
  }
  // Also send codes only to each team's clue-giver
  if (room.phase === 'cluing' && room.currentRound) {
    for (const team of ['white', 'black']) {
      const giverId = room.currentRound.clueGivers[team];
      const giverSocket = giverId ? io.sockets.sockets.get(giverId) : null;
      if (giverSocket) giverSocket.emit('game:secretCode', room.currentRound.codes[team]);
    }
  }
}

function registerHandlers(io, socket) {
  let currentRoom = null;

  function cleanup() {
    if (!currentRoom) return;
    const room = removePlayer(currentRoom, socket.id);
    if (room) {
      broadcastRoom(io, room);
    }
    currentRoom = null;
  }

  socket.on('room:create', ({ name }) => {
    if (!name) return;
    const room = createRoom(socket.id, name);
    socket.join(room.code);
    currentRoom = room.code;
    socket.emit('room:joined', { code: room.code, playerId: socket.id });
    broadcastRoom(io, room);
  });

  socket.on('room:join', ({ code, name }) => {
    const room = getRoom(code);
    if (!room) return socket.emit('room:error', { message: 'Room not found' });
    if (room.phase !== 'lobby') return socket.emit('room:error', { message: 'Game already started' });
    room.players.set(socket.id, { id: socket.id, name, team: null });
    socket.join(code);
    currentRoom = code;
    socket.emit('room:joined', { code, playerId: socket.id });
    broadcastRoom(io, room);
  });

  socket.on('room:setTeam', ({ team }) => {
    const room = getRoom(currentRoom);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.get(socket.id);
    if (!player) return;
    player.team = team === 'white' || team === 'black' ? team : null;
    broadcastRoom(io, room);
  });

  socket.on('room:setKeywords', ({ team, keywords }) => {
    const room = getRoom(currentRoom);
    if (!room || room.phase !== 'lobby') return;
    if (room.hostId !== socket.id) return socket.emit('room:error', { message: 'Only host can set keywords' });
    if (!Array.isArray(keywords) || keywords.length !== 4) return;
    room.teams[team].keywords = keywords.map(String);
    sendKeywords(io, room);
  });

  socket.on('room:start', () => {
    const room = getRoom(currentRoom);
    if (!room || room.phase !== 'lobby') return;
    if (room.hostId !== socket.id) return;

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
    sendKeywords(io, room);
    emit(io, room, 'game:started', { round: room.round });
  });

  socket.on('game:submitClues', ({ clues }) => {
    const room = getRoom(currentRoom);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player || !player.team) return;

    const cr = room.currentRound;
    if (cr.clueGivers[player.team] !== socket.id) {
      return socket.emit('room:error', { message: 'You are not the clue giver this round' });
    }

    const result = submitClues(room, player.team, clues);
    if (result.error) return socket.emit('room:error', { message: result.error });

    broadcastRoom(io, room);
    if (result.phase === 'guessing') emit(io, room, 'game:phase', { phase: 'guessing' });
  });

  socket.on('game:submitGuess', ({ type, guess }) => {
    const room = getRoom(currentRoom);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player || !player.team) return;

    const result = submitGuess(room, player.team, type, guess);
    if (result.error) return socket.emit('room:error', { message: result.error });

    broadcastRoom(io, room);

    if (result.phase === 'ended') {
      emit(io, room, 'game:ended', { winner: result.winner, results: result.results });
    } else if (result.phase === 'reveal') {
      emit(io, room, 'game:reveal', { results: result.results });
    }
  });

  socket.on('game:nextRound', () => {
    const room = getRoom(currentRoom);
    if (!room || room.phase !== 'reveal') return;
    if (room.hostId !== socket.id) return;
    startRound(room);
    broadcastRoom(io, room);
    sendKeywords(io, room);
    emit(io, room, 'game:roundStarted', { round: room.round });
  });

  socket.on('disconnect', cleanup);
  socket.on('room:leave', cleanup);
}

module.exports = { registerHandlers };
