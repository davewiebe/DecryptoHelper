const OPPONENT = { white: 'black', black: 'white' };

function randomCode() {
  const pool = [1, 2, 3, 4];
  const result = [];
  while (result.length < 3) {
    const i = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(i, 1)[0]);
  }
  return result;
}

function startRound(room) {
  room.round += 1;
  const roundNum = room.round;

  room.currentRound = {
    number: roundNum,
    codes: { white: randomCode(), black: randomCode() },
    // Clue giver is claimed each round by whichever teammate presses
    // "give the clue" (null = unclaimed).
    clueGivers: { white: null, black: null },
    clues: { white: ['', '', ''], black: ['', '', ''] },
    cluesSubmitted: { white: false, black: false },
    // interception: each team guesses the OPPONENT's code
    interceptionGuesses: { white: null, black: null },
    interceptionSubmitted: { white: false, black: false },
    // decoding: each team guesses THEIR OWN code (to check for miscommunication)
    decodingGuesses: { white: null, black: null },
    decodingSubmitted: { white: false, black: false },
    results: null,
  };

  room.phase = 'cluing';
}

function submitClues(room, team, clues) {
  if (room.phase !== 'cluing') return { error: 'Not in cluing phase' };
  if (!Array.isArray(clues) || clues.length !== 3) return { error: 'Must provide 3 clues' };
  room.currentRound.clues[team] = clues.map(String);
  room.currentRound.cluesSubmitted[team] = true;

  const bothDone = room.currentRound.cluesSubmitted.white && room.currentRound.cluesSubmitted.black;
  if (bothDone) room.phase = 'guessing';
  return { ok: true, phase: room.phase };
}

function submitGuess(room, team, type, guess) {
  if (room.phase !== 'guessing') return { error: 'Not in guessing phase' };
  if (!Array.isArray(guess) || guess.length !== 3) return { error: 'Must provide 3 numbers' };

  if (type === 'interception') {
    room.currentRound.interceptionGuesses[team] = guess.map(Number);
    room.currentRound.interceptionSubmitted[team] = true;
  } else if (type === 'decoding') {
    room.currentRound.decodingGuesses[team] = guess.map(Number);
    room.currentRound.decodingSubmitted[team] = true;
  } else {
    return { error: 'Unknown guess type' };
  }

  const allDone =
    room.currentRound.interceptionSubmitted.white &&
    room.currentRound.interceptionSubmitted.black &&
    room.currentRound.decodingSubmitted.white &&
    room.currentRound.decodingSubmitted.black;

  if (allDone) return resolveRound(room);
  return { ok: true };
}

function resolveRound(room) {
  const cr = room.currentRound;
  const results = { interceptions: {}, decodings: {}, tokens: { white: {}, black: {} } };

  for (const team of ['white', 'black']) {
    const opp = OPPONENT[team];
    // Did this team correctly intercept the opponent's code?
    const intercepted = arrEqual(cr.interceptionGuesses[team], cr.codes[opp]);
    // Did this team correctly decode their own code?
    const decoded = arrEqual(cr.decodingGuesses[team], cr.codes[team]);

    results.interceptions[team] = intercepted;
    results.decodings[team] = decoded;

    if (intercepted) room.teams[team].interceptions += 1;
    if (!decoded) room.teams[team].miscommunications += 1;

    results.tokens[team] = {
      interceptions: room.teams[team].interceptions,
      miscommunications: room.teams[team].miscommunications,
    };
  }

  cr.results = results;
  room.history.unshift({ type: 'round', round: room.round, summary: cr, ts: Date.now() });
  if (room.history.length > 50) room.history.pop();

  const winner = checkWinner(room);
  if (winner || room.round >= room.maxRounds) {
    room.phase = 'ended';
    room.winner = winner || resolveByScore(room);
    return { ok: true, phase: 'ended', results, winner: room.winner };
  }

  room.phase = 'reveal';
  return { ok: true, phase: 'reveal', results };
}

function checkWinner(room) {
  if (room.teams.white.interceptions >= 2) return 'white';
  if (room.teams.black.interceptions >= 2) return 'black';
  if (room.teams.white.miscommunications >= 2) return 'black';
  if (room.teams.black.miscommunications >= 2) return 'white';
  return null;
}

function resolveByScore(room) {
  const w = room.teams.white.interceptions;
  const b = room.teams.black.interceptions;
  if (w > b) return 'white';
  if (b > w) return 'black';
  return 'draw';
}

function arrEqual(a, b) {
  if (!a || !b) return false;
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

module.exports = { startRound, submitClues, submitGuess };
