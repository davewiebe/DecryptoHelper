import React, { useState } from 'react';
import socket, { getClientId } from '../socket';
import buildInfo from '../buildInfo.json';

export default function Home() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState(null); // 'create' | 'join'

  const create = () => {
    if (!name.trim()) return;
    // Typing "Davetest" spins up the pre-seeded 4-player test room.
    const seed = name.trim().toLowerCase() === 'davetest';
    socket.emit('room:create', { name: name.trim(), seed, clientId: getClientId() });
  };

  const join = () => {
    if (!name.trim() || !joinCode.trim()) return;
    socket.emit('room:join', { name: name.trim(), code: joinCode.trim().toUpperCase(), clientId: getClientId() });
  };

  return (
    <div style={s.page}>
      <div style={s.main}>
        <div style={s.card}>
        <h1 style={s.title}>DECRYPTO</h1>
        <p style={s.sub}>Multiplayer code-word deduction game</p>

        <input
          style={s.input}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            if (mode === 'join') join();
            else create();
          }}
          autoFocus
        />

        {!mode && (
          <div style={s.row}>
            <button style={s.btn} onClick={create} disabled={!name.trim()}>Create Room</button>
            <button style={{ ...s.btn, ...s.btnOutline }} onClick={() => setMode('join')}>Join Room</button>
          </div>
        )}

        {mode === 'join' && (
          <>
            <input
              style={s.input}
              placeholder="Room code (4 letters)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && join()}
              maxLength={4}
            />
            <button style={s.btn} onClick={join} disabled={!name.trim() || joinCode.length !== 4}>
              Join
            </button>
            <button style={s.back} onClick={() => setMode(null)}>Back</button>
          </>
        )}
        </div>
      </div>

      <footer style={s.footer}>
        Build {buildInfo.commit} · {buildInfo.date}
      </footer>
    </div>
  );
}

const s = {
  page: { flex: 1, display: 'flex', flexDirection: 'column', padding: 16 },
  main: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  footer: { textAlign: 'center', fontSize: 11, opacity: 0.35, paddingTop: 8, flexShrink: 0 },
  card: {
    background: '#13131a',
    border: '1px solid #2a2a3a',
    borderRadius: 12,
    padding: '40px 48px',
    maxWidth: 400,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    textAlign: 'center',
  },
  title: { margin: 0, fontSize: 42, letterSpacing: 8, color: '#a0c4ff' },
  sub: { margin: 0, opacity: 0.5, fontSize: 13 },
  input: {
    background: '#1e1e2e',
    border: '1px solid #3a3a5a',
    borderRadius: 6,
    color: '#e0e0e0',
    padding: '10px 14px',
    fontSize: 16,
    fontFamily: 'inherit',
    outline: 'none',
  },
  row: { display: 'flex', gap: 10 },
  btn: {
    flex: 1,
    background: '#3a6fd8',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '12px 0',
    fontSize: 15,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: 1,
  },
  btnOutline: { background: 'transparent', border: '1px solid #3a6fd8', color: '#a0c4ff' },
  back: {
    background: 'transparent',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
  },
};
