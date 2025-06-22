// index.js
import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import { v4 as uuidV4 } from 'uuid';
import { pool } from './db.js';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

// serve static files
app.use(express.static('public'));

// Create a new room
app.get('/new', async (_req, res) => {
  const code = uuidV4().slice(0, 8); // shorter link
  await pool.query('INSERT INTO chat_rooms(code) VALUES($1)', [code]);
  res.redirect(`/room/${code}`);
});

// Serve chat UI
app.get('/room/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM chat_rooms WHERE code = $1',
      [code]
    );

    if (rowCount === 0) {
      // room not found → redirect to homepage
      return res.redirect('/');
    }

    // room exists → serve chat UI
    res.sendFile(path.resolve('public/chat.html'));
  } catch (err) {
    console.error('DB error checking room:', err);
    // on error, fallback to homepage
    return res.redirect('/');
  }
});

io.on('connection', async socket => {
  const { room, name: requestedName } = socket.handshake.query;
  if (!room) return socket.disconnect();

  // look up room
  const rm = await pool.query(
    'SELECT id FROM chat_rooms WHERE code=$1', [room]
  );
  if (!rm.rows.length) return socket.disconnect();
  const roomId = rm.rows[0].id;

  // decide on name
  let name = requestedName;
  if (!name) {
    // brand-new user → count & insert
    const cnt = await pool.query(
      'SELECT COUNT(*) FROM participants WHERE room_id=$1', [roomId]
    );
    const n = parseInt(cnt.rows[0].count, 10) + 1;
    name = `Badmos ${n}`;
    await pool.query(
      'INSERT INTO participants(name, room_id) VALUES($1,$2)',
      [name, roomId]
    );
  }
  socket.data = { room, roomId, name };
  socket.join(room);

  // immediately tell the client who they are
  socket.emit('yourIdentity', { name });

  // then send the history
  const history = await pool.query(
    `SELECT participant_name, content, sent_at
     FROM messages
     WHERE room_id=$1
     ORDER BY sent_at`, [roomId]
  );
  socket.emit('chatHistory', history.rows);

  // broadcast join
  socket.broadcast
    .to(room)
    .emit('message', { system: true, text: `${name} joined.` });

  // incoming chat
  socket.on('chatMessage', async text => {
    const { name, roomId } = socket.data;
    const result = await pool.query(
      `INSERT INTO messages(room_id, participant_name, content)
       VALUES($1,$2,$3) RETURNING sent_at`,
      [roomId, name, text]
    );
    io
      .to(room)
      .emit('message', { system: false, name, text, sentAt: result.rows[0].sent_at });
  });

  socket.on('disconnect', () => {
    const { name } = socket.data;
    socket.broadcast
      .to(room)
      .emit('message', { system: true, text: `${name} left.` });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
