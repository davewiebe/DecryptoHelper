import React, { useEffect, useReducer, useCallback } from 'react';
import socket from './socket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

const initialState = {
  screen: 'home', // home | lobby | game
  playerId: null,
  roomCode: null,
  room: null,
  keywords: [],       // my team's keywords
  secretCode: null,   // current round code (clue giver only)
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'JOINED':
      return { ...state, playerId: action.playerId, roomCode: action.code, screen: 'lobby', error: null };
    case 'ROOM_STATE':
      return { ...state, room: action.room, screen: action.room.phase === 'lobby' ? 'lobby' : 'game' };
    case 'KEYWORDS':
      return { ...state, keywords: action.keywords };
    case 'SECRET_CODE':
      return { ...state, secretCode: action.code };
    case 'CLEAR_SECRET':
      return { ...state, secretCode: null };
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
    socket.on('room:state', (room) => dispatch({ type: 'ROOM_STATE', room }));
    socket.on('game:keywords', (keywords) => dispatch({ type: 'KEYWORDS', keywords }));
    socket.on('game:secretCode', (code) => dispatch({ type: 'SECRET_CODE', code }));
    socket.on('room:error', ({ message }) => dispatch({ type: 'ERROR', message }));
    socket.on('game:started', () => dispatch({ type: 'CLEAR_SECRET' }));
    socket.on('game:roundStarted', () => dispatch({ type: 'CLEAR_SECRET' }));

    return () => socket.disconnect();
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);
  const leave = useCallback(() => {
    socket.emit('room:leave');
    dispatch({ type: 'LEAVE' });
  }, []);

  const { screen, playerId, roomCode, room, keywords, secretCode, error } = state;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <div onClick={clearError} style={styles.errorBanner}>
          {error} &nbsp; <span style={{ opacity: 0.6 }}>(click to dismiss)</span>
        </div>
      )}
      {screen === 'home' && <Home />}
      {screen === 'lobby' && (
        <Lobby room={room} playerId={playerId} onLeave={leave} />
      )}
      {screen === 'game' && (
        <GameBoard
          room={room}
          playerId={playerId}
          roomCode={roomCode}
          keywords={keywords}
          secretCode={secretCode}
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
