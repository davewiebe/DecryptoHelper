const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { registerHandlers } = require('./src/socket/handlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Lightweight keepalive endpoint — clients ping this so Render's free tier
// doesn't spin the service down for inactivity during a game.
app.get('/healthz', (_req, res) => res.type('text').send('ok'));

const CLIENT_BUILD = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(CLIENT_BUILD));
app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_BUILD, 'index.html')));

io.on('connection', (socket) => {
  registerHandlers(io, socket);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Decrypto server on :${PORT}`));
