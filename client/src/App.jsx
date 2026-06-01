import React, { useEffect, useReducer, useCallback } from 'react';
import socket from './socket';
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
    case 'SET_ACTIVE':
      return { ...state, activeId: action.playerId };
    case 'ROOM_STATE':
      return { ...state, room: action.room, screen: action.room.phase === 'lobby' ? 'lobby' : 'game' };
    case 'PRIVATE':
      return { ...state, priv: action.map };
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

  useEffect(() => {
    socket.connect();

    socket.on('room:joined', ({ code, playerId }) => dispatch({ type: 'JOINED', code, playerId }));
    socket.on('room:localPlayerAdded', ({ playerId }) => dispatch({ type: 'LOCAL_ADDED', playerId }));
    socket.on('room:state', (room) => dispatch({ type: 'ROOM_STATE', room }));
    socket.on('game:private', (map) => dispatch({ type: 'PRIVATE', map }));
    socket.on('room:error', ({ message }) => dispatch({ type: 'ERROR', message }));

    return () => socket.disconnect();
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);
  const setActive = useCallback((playerId) => dispatch({ type: 'SET_ACTIVE', playerId }), []);
  const addPlayer = useCallback((name) => socket.emit('room:addLocalPlayer', { name }), []);
  const leave = useCallback(() => {
    socket.emit('room:leave');
    dispatch({ type: 'LEAVE' });
  }, []);

  const { screen, roomCode, room, ownedIds, activeId, priv, error } = state;
  const activePriv = priv[activeId] || { keywords: [], secretCode: null };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
  errorBanner: {
    background: '#8b0000',
    color: '#fff',
    padding: '10px 16px',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: 14,
  },
};
