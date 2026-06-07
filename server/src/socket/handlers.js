const {
  createRoom,
  addPlayer,
  getRoom,
  detachSocket,
  reattachClient,
  removePlayersByClient,
  roomView,
} = require('../game/roomManager');
const { startRound, submitClues, submitGuess } = require('../game/game');

// On disconnect, keep a device's players for this long so a reconnect can
// reclaim them instead of dropping out of the game. Generous, because phones
// lock/background sockets constantly; the free instance spins down after ~15
// min idle anyway, which caps how long an abandoned room can actually live.
const GRACE_MS = 60 * 60 * 1000;
const pendingRemovals = new Map(); // `${code}:${clientId}` -> timeout

function scheduleRemoval(io, code, clientId) {
  const key = `${code}:${clientId}`;
  clearTimeout(pendingRemovals.get(key));
  pendingRemovals.set(
    key,
    setTimeout(() => {
      pendingRemovals.delete(key);
      const room = removePlayersByClient(code, clientId);
      if (room) {
        broadcastRoom(io, room);
        sendPrivate(io, room);
      }
    }, GRACE_MS)
  );
}

function cancelRemoval(code, clientId) {
  const key = `${code}:${clientId}`;
  clearTimeout(pendingRemovals.get(key));
  pendingRemovals.delete(key);
}

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

// Populate a fresh room with 4 players (2 per team) + keywords, all owned by
// the creating socket/device. Returns the extra (non-host) playerIds.
function seedTestRoom(room, socketId, clientId, hostId) {
  room.players.get(hostId).team = 'white';
  const w2 = addPlayer(room.code, socketId, clientId, 'White 2').playerId;
  const b1 = addPlayer(room.code, socketId, clientId, 'Black 1').playerId;
  const b2 = addPlayer(room.code, socketId, clientId, 'Black 2').playerId;
  room.players.get(w2).team = 'white';
  room.players.get(b1).team = 'black';
  room.players.get(b2).team = 'black';
  room.teams.white.keywords = ['APPLE', 'RIVER', 'TIGER', 'PLANET'];
  room.teams.black.keywords = ['GUITAR', 'CASTLE', 'ROCKET', 'GARDEN'];
  return [w2, b1, b2];
}

// Like seedTestRoom but starts in reveal phase with a completed round where
// White succeeds at both decryption and interception, Black fails both.
function seedTestRoom2(room, socketId, clientId, hostId) {
  room.players.get(hostId).team = 'white';
  const w2 = addPlayer(room.code, socketId, clientId, 'White 2').playerId;
  const b1 = addPlayer(room.code, socketId, clientId, 'Black 1').playerId;
  const b2 = addPlayer(room.code, socketId, clientId, 'Black 2').playerId;
  room.players.get(w2).team = 'white';
  room.players.get(b1).team = 'black';
  room.players.get(b2).team = 'black';
  room.teams.white.keywords = ['APPLE', 'RIVER', 'TIGER', 'PLANET'];
  room.teams.black.keywords = ['GUITAR', 'CASTLE', 'ROCKET', 'GARDEN'];

  // White code [2,4,1] = RIVER, PLANET, APPLE
  // Black code [3,1,4] = ROCKET, GUITAR, GARDEN
  const whiteCode = [2, 4, 1];
  const blackCode = [3, 1, 4];
  const cr = {
    number: 1,
    codes: { white: whiteCode, black: blackCode },
    clueGivers: { white: hostId, black: b1 },
    clues: { white: ['flow', 'orbit', 'fruit'], black: ['launch', 'strings', 'grow'] },
    cluesSubmitted: { white: true, black: true },
    interceptionGuesses: { white: [3, 1, 4], black: [1, 3, 2] }, // white correct, black wrong
    interceptionSubmitted: { white: true, black: true },
    decodingGuesses: { white: [2, 4, 1], black: [1, 2, 3] },     // white correct, black wrong
    decodingSubmitted: { white: true, black: true },
    results: {
      interceptions: { white: true, black: false },
      decodings: { white: true, black: false },
      tokens: {
        white: { interceptions: 1, miscommunications: 0 },
        black: { interceptions: 0, miscommunications: 1 },
      },
    },
  };

  room.round = 1;
  room.currentRound = cr;
  room.phase = 'reveal';
  room.teams.white.interceptions = 1;
  room.teams.black.miscommunications = 1;
  room.history = [{ type: 'round', round: 1, summary: cr, ts: Date.now() }];

  return [w2, b1, b2];
}

// Like seedTestRoom but jumps to a finished game: White wins by reaching 2
// interceptions over two rounds (Black also racks up 2 miscommunications).
function seedTestRoom3(room, socketId, clientId, hostId) {
  room.players.get(hostId).team = 'white';
  const w2 = addPlayer(room.code, socketId, clientId, 'White 2').playerId;
  const b1 = addPlayer(room.code, socketId, clientId, 'Black 1').playerId;
  const b2 = addPlayer(room.code, socketId, clientId, 'Black 2').playerId;
  room.players.get(w2).team = 'white';
  room.players.get(b1).team = 'black';
  room.players.get(b2).team = 'black';
  room.teams.white.keywords = ['APPLE', 'RIVER', 'TIGER', 'PLANET'];
  room.teams.black.keywords = ['GUITAR', 'CASTLE', 'ROCKET', 'GARDEN'];

  const mkRound = (number) => ({
    number,
    codes: { white: [2, 4, 1], black: [3, 1, 4] },
    clueGivers: { white: hostId, black: b1 },
    clues: { white: ['flow', 'orbit', 'fruit'], black: ['launch', 'strings', 'grow'] },
    cluesSubmitted: { white: true, black: true },
    // White intercepts Black correctly; Black intercepts White wrong.
    interceptionGuesses: { white: [3, 1, 4], black: [1, 3, 2] },
    interceptionSubmitted: { white: true, black: true },
    // White decrypts its own correctly; Black mis-decrypts (miscommunication).
    decodingGuesses: { white: [2, 4, 1], black: [1, 2, 3] },
    decodingSubmitted: { white: true, black: true },
    results: {
      interceptions: { white: true, black: false },
      decodings: { white: true, black: false },
      tokens: {
        white: { interceptions: number, miscommunications: 0 },
        black: { interceptions: 0, miscommunications: number },
      },
    },
  });

  const r1 = mkRound(1);
  const r2 = mkRound(2);

  room.round = 2;
  room.currentRound = r2;
  room.phase = 'ended';
  room.teams.white.interceptions = 2;
  room.teams.black.miscommunications = 2;
  room.winner = 'white';
  room.history = [
    { type: 'round', round: 2, summary: r2, ts: Date.now() },
    { type: 'round', round: 1, summary: r1, ts: Date.now() - 1000 },
  ];

  return [w2, b1, b2];
}

// Reveal phase: both teams intercept each other AND both fail their own decryption — a tie.
function seedTestRoom11(room, socketId, clientId, hostId) {
  room.players.get(hostId).team = 'white';
  const w2 = addPlayer(room.code, socketId, clientId, 'White 2').playerId;
  const b1 = addPlayer(room.code, socketId, clientId, 'Black 1').playerId;
  const b2 = addPlayer(room.code, socketId, clientId, 'Black 2').playerId;
  room.players.get(w2).team = 'white';
  room.players.get(b1).team = 'black';
  room.players.get(b2).team = 'black';
  room.teams.white.keywords = ['APPLE', 'RIVER', 'TIGER', 'PLANET'];
  room.teams.black.keywords = ['GUITAR', 'CASTLE', 'ROCKET', 'GARDEN'];

  // White code [2,4,1] = RIVER, PLANET, APPLE
  // Black code [3,1,4] = ROCKET, GUITAR, GARDEN
  // Both teams crack the other's code; both mis-decrypt their own.
  const whiteCode = [2, 4, 1];
  const blackCode = [3, 1, 4];
  const cr = {
    number: 1,
    codes: { white: whiteCode, black: blackCode },
    clueGivers: { white: hostId, black: b1 },
    clues: { white: ['flow', 'orbit', 'fruit'], black: ['launch', 'strings', 'grow'] },
    cluesSubmitted: { white: true, black: true },
    interceptionGuesses: { white: [3, 1, 4], black: [2, 4, 1] }, // both correct
    interceptionSubmitted: { white: true, black: true },
    decodingGuesses: { white: [1, 3, 2], black: [4, 2, 1] },     // both wrong
    decodingSubmitted: { white: true, black: true },
    results: {
      interceptions: { white: true, black: true },
      decodings: { white: false, black: false },
      tokens: {
        white: { interceptions: 1, miscommunications: 1 },
        black: { interceptions: 1, miscommunications: 1 },
      },
    },
  };

  room.round = 1;
  room.currentRound = cr;
  room.phase = 'reveal';
  room.teams.white.interceptions = 1;
  room.teams.white.miscommunications = 1;
  room.teams.black.interceptions = 1;
  room.teams.black.miscommunications = 1;
  room.history = [{ type: 'round', round: 1, summary: cr, ts: Date.now() }];

  return [w2, b1, b2];
}

function registerHandlers(io, socket) {
  let currentRoom = null;
  let clientId = null; // stable per-device id, survives socket reconnects
  const owned = new Set(); // playerIds this socket controls

  function ownedPlayer(room, playerId) {
    if (!room || !playerId || !owned.has(playerId)) return null;
    return room.players.get(playerId) || null;
  }

  // Disconnect: keep the device's players for a grace period so a reconnect
  // (room:resume) can reclaim them. Explicit leave removes immediately.
  function onDisconnect() {
    if (!currentRoom || !clientId) return;
    const room = detachSocket(currentRoom, socket.id);
    if (room) {
      sendPrivate(io, room);
      scheduleRemoval(io, currentRoom, clientId);
    }
  }

  function onLeave() {
    if (!currentRoom) return;
    if (clientId) cancelRemoval(currentRoom, clientId);
    const room = clientId ? removePlayersByClient(currentRoom, clientId) : null;
    if (room) {
      broadcastRoom(io, room);
      sendPrivate(io, room);
    }
    owned.clear();
    currentRoom = null;
  }

  socket.on('room:create', ({ name, seed, clientId: cid }) => {
    if (!name) return;
    clientId = cid || socket.id;
    const { room, playerId } = createRoom(socket.id, clientId, name);
    socket.join(room.code);
    currentRoom = room.code;
    owned.add(playerId);
    socket.emit('room:joined', { code: room.code, playerId });

    if (seed === 'davetest') {
      const extras = seedTestRoom(room, socket.id, clientId, playerId);
      extras.forEach((id) => owned.add(id));
      socket.emit('room:seededPlayers', { playerIds: extras });
    } else if (seed === 'davetest2') {
      const extras = seedTestRoom2(room, socket.id, clientId, playerId);
      extras.forEach((id) => owned.add(id));
      socket.emit('room:seededPlayers', { playerIds: extras });
    } else if (seed === 'davetest3') {
      const extras = seedTestRoom3(room, socket.id, clientId, playerId);
      extras.forEach((id) => owned.add(id));
      socket.emit('room:seededPlayers', { playerIds: extras });
    } else if (seed === 'davetest11') {
      const extras = seedTestRoom11(room, socket.id, clientId, playerId);
      extras.forEach((id) => owned.add(id));
      socket.emit('room:seededPlayers', { playerIds: extras });
    }

    broadcastRoom(io, room);
    sendPrivate(io, room);
  });

  socket.on('room:join', ({ code, name, clientId: cid }) => {
    const room = getRoom(code);
    if (!room) return socket.emit('room:error', { message: 'Room not found' });
    if (room.phase !== 'lobby') return socket.emit('room:error', { message: 'Game already started' });
    if (!name) return;
    clientId = cid || socket.id;
    const { playerId } = addPlayer(code, socket.id, clientId, name);
    socket.join(code);
    currentRoom = code;
    owned.add(playerId);
    socket.emit('room:joined', { code, playerId });
    broadcastRoom(io, room);
    sendPrivate(io, room);
  });

  // Reconnect: re-attach this device's existing players to the new socket.
  socket.on('room:resume', ({ code, clientId: cid }) => {
    const room = getRoom(code);
    if (!room || !cid) return socket.emit('room:resumeFailed', {});
    const { playerIds } = reattachClient(code, cid, socket.id);
    if (!playerIds.length) return socket.emit('room:resumeFailed', {});
    clientId = cid;
    currentRoom = code;
    cancelRemoval(code, cid);
    owned.clear();
    playerIds.forEach((id) => owned.add(id));
    socket.join(code);
    socket.emit('room:resumed', { code, playerIds });
    socket.emit('room:state', roomView(room));
    sendPrivate(io, room);
  });

  // Hotseat: add another local player controlled by this same socket/device.
  socket.on('room:addLocalPlayer', ({ name }) => {
    const room = getRoom(currentRoom);
    if (!room) return;
    if (room.phase !== 'lobby') return socket.emit('room:error', { message: 'Can only add players in the lobby' });
    if (!name) return;
    const { playerId } = addPlayer(currentRoom, socket.id, clientId, name);
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
    // Need 2+ per team: one gives the clue, another decodes it.
    if (whitePlayers.length < 2 || blackPlayers.length < 2) {
      return socket.emit('room:error', { message: 'Each team needs at least two players' });
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

  // The first teammate to claim the clue-giver role gets it for the round;
  // claiming reveals the secret code to that player. No take-overs once
  // someone has claimed it.
  socket.on('game:claimClueGiver', ({ playerId }) => {
    const room = getRoom(currentRoom);
    const player = ownedPlayer(room, playerId);
    if (!player || !player.team || room.phase !== 'cluing') return;
    const cr = room.currentRound;
    if (cr.clueGivers[player.team]) return; // already claimed
    cr.clueGivers[player.team] = playerId;
    broadcastRoom(io, room);
    sendPrivate(io, room);
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

    // The clue giver knows their own code — they may not decode it.
    if (type === 'decoding' && room.currentRound.clueGivers[player.team] === playerId) {
      return socket.emit('room:error', { message: 'The clue giver cannot decode their own code' });
    }

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

  socket.on('disconnect', onDisconnect);
  socket.on('room:leave', onLeave);
}

module.exports = { registerHandlers };
