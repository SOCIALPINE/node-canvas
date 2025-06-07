const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const SIZE = 1000;
const canvas = Array(SIZE).fill().map(() => Array(SIZE).fill('#FFFFFF'));
const cooldown = {}; // userId: timestamp

app.use(express.static(path.join(__dirname, 'public')));

function isValidColor(color) {
  return /^#[0-9A-F]{6}$/i.test(color);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.emit('init', canvas);

  socket.on('place_pixel', ({ x, y, color, userId }) => {
    const now = Date.now();
    if (cooldown[userId] && now - cooldown[userId] < 5000) return;
    if (!isValidColor(color)) return;
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;

    canvas[y][x] = color;
    cooldown[userId] = now;
    io.emit('pixel_update', { x, y, color });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
