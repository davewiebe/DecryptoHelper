import { io } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3001';
const socket = io(URL, { autoConnect: false });

// Stable per-device id so the server can re-attach our players after a socket
// reconnect (survives drops, tab sleep, brief network blips).
export function getClientId() {
  let id = null;
  try {
    id = localStorage.getItem('decrypto_clientId');
    if (!id) {
      id = 'c' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('decrypto_clientId', id);
    }
  } catch {
    id = 'c' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return id;
}

export default socket;
