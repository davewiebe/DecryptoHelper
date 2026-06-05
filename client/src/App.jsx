import React, { useEffect, useReducer, useCallback, useRef } from 'react';
import socket, { getClientId } from './socket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import PlayerSwitcher from './components/PlayerSwitcher';

const initialState = {
  screen: 'home', // home | lobby | game
  roomCode: null,
  room: null,
  ownedIds: [],       // playerIds this device controls (hotseat)
  activeId: null,     // currently-viewed player
  priv: {},           // { [playerId]: { keywords, secretCode } }
  error: null,
  connected: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'JOINED':
      return {
        ...state,
        roomCode: action.code,
        ownedIds: [action.playerId],
        activeId: action.playerId,
        screen: 'lobby',
        error: null,
      };
    case 'LOCAL_ADDED':
      return { ...state, ownedIds: [...state.ownedIds, action.playerId], activeId: action.playerId };
    case 'SEEDED':
      // Append seeded players but keep the host (first owned) as active.
      return { ...state, ownedIds: [...state.ownedIds, ...action.playerIds] };
    case 'RESUMED': {
      // Reconnected: restore owned players; keep active if still ours.
      const activeId = action.playerIds.includes(state.activeId) ? state.activeId : action.playerIds[0];
      return { ...state, ownedIds: action.playerIds, activeId, error: null };
    }
    case 'RESUME_FAILED':
      return {
        ...initialState,
        connected: state.connected,
        error: 'Lost the game session (it may have expired). Returning to the home screen.',
      };
    case 'SET_ACTIVE':
      return { ...state, activeId: action.playerId };
    case 'ROOM_STATE':
      return { ...state, room: action.room, screen: action.room.phase === 'lobby' ? 'lobby' : 'game' };
    case 'PRIVATE':
      return { ...state, priv: action.map };
    case 'CONNECTION':
      return { ...state, connected: action.connected };
    case 'ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LEAVE':
      return { ...initialState };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const roomCodeRef = useRef(null);

  // Keep a ref to the current room code so the (once-mounted) socket
  // listeners can resume after a reconnect.
  useEffect(() => {
    roomCodeRef.current = state.roomCode;
  }, [state.roomCode]);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      dispatch({ type: 'CONNECTION', connected: true });
      // If we were in a room, this is a reconnect — reclaim our players.
      if (roomCodeRef.current) {
        socket.emit('room:resume', { code: roomCodeRef.current, clientId: getClientId() });
      }
    });
    socket.on('disconnect', () => dispatch({ type: 'CONNECTION', connected: false }));

    socket.on('room:joined', ({ code, playerId }) => dispatch({ type: 'JOINED', code, playerId }));
    socket.on('room:localPlayerAdded', ({ playerId }) => dispatch({ type: 'LOCAL_ADDED', playerId }));
    socket.on('room:seededPlayers', ({ playerIds }) => dispatch({ type: 'SEEDED', playerIds }));
    socket.on('room:resumed', ({ playerIds }) => dispatch({ type: 'RESUMED', playerIds }));
    socket.on('room:resumeFailed', () => dispatch({ type: 'RESUME_FAILED' }));
    socket.on('room:state', (room) => dispatch({ type: 'ROOM_STATE', room }));
    socket.on('game:private', (map) => dispatch({ type: 'PRIVATE', map }));
    socket.on('room:error', ({ message }) => dispatch({ type: 'ERROR', message }));

    return () => socket.disconnect();
  }, []);

  // Keep the Render free-tier service awake while the app is open: ping the
  // health endpoint every few minutes (it spins down after ~15 min idle).
  useEffect(() => {
    const ping = () => fetch('/healthz').catch(() => {});
    ping();
    const id = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);
  const setActive = useCallback((playerId) => dispatch({ type: 'SET_ACTIVE', playerId }), []);
  const addPlayer = useCallback((name) => socket.emit('room:addLocalPlayer', { name }), []);
  const leave = useCallback(() => {
    socket.emit('room:leave');
    dispatch({ type: 'LEAVE' });
  }, []);

  const { screen, roomCode, room, ownedIds, activeId, priv, error, connected } = state;
  const activePriv = priv[activeId] || { keywords: [], secretCode: null };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!connected && (
        <div style={styles.reconnectBanner}>Reconnecting…</div>
      )}
      {error && (
        <div onClick={clearError} style={styles.errorBanner}>
          {error} &nbsp; <span style={{ opacity: 0.6 }}>(click to dismiss)</span>
        </div>
      )}

      {screen !== 'home' && room && ownedIds.length > 0 && (
        <PlayerSwitcher
          players={room.players}
          ownedIds={ownedIds}
          activeId={activeId}
          phase={room.phase}
          hostId={room.hostId}
          onSwitch={setActive}
          onAdd={addPlayer}
        />
      )}

      {screen === 'home' && <Home />}
      {screen === 'lobby' && <Lobby room={room} playerId={activeId} onLeave={leave} />}
      {screen === 'game' && (
        <GameBoard
          room={room}
          playerId={activeId}
          roomCode={roomCode}
          keywords={activePriv.keywords}
          secretCode={activePriv.secretCode}
          onLeave={leave}
        />
      )}
    </div>
  );
}

const styles = {
  reconnectBanner: {
    background: '#8a6d00',
    color: '#fff',
    padding: '8px 16px',
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 1,
  },
  errorBanner: {
    background: '#8b0000',
    color: '#fff',
    padding: '10px 16px',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: 14,
  },
};
