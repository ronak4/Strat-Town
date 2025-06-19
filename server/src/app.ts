/* eslint no-console: "off" */

import express, { Router } from 'express';
import * as http from 'node:http';
import multer from 'multer';
import * as chat from './controllers/chat.controller.ts';
import * as game from './controllers/game.controller.ts';
import * as user from './controllers/user.controller.ts';
import * as thread from './controllers/thread.controller.ts';
import * as friendship from './controllers/friend.controller.ts';
import { type StrategyServer } from './types.ts';
import { Server } from 'socket.io';
import * as path from 'node:path';
import * as wb from './controllers/whiteboard.controller.ts';

const PORT = parseInt(process.env.PORT || '8000');
export const app = express();
const httpSever = http.createServer(app);
const io: StrategyServer = new Server(httpSever);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(express.json());

app.use(
  '/api',
  Router()
    .use(
      '/game',
      express
        .Router() //
        .post('/create', game.postCreate)
        .get('/list', game.getList)
        .get('/:id', game.getById),
    )
    .use(
      '/thread',
      express
        .Router() //
        .post('/create', thread.postCreate)
        .get('/list', thread.getList)
        .get('/:id', thread.getById)
        .post('/:id/comment', thread.postByIdComment),
    )
    .use(
      '/user',
      Router() // Any concrete routes here should be disallowed as usernames
        .post('/list', user.postList)
        .post('/login', user.postLogin)
        .post('/signup', user.postSignup)
        .post('/stats', user.postUpdateStats)
        .post('/upload-profile-image', upload.single('profileImage'), user.postUploadProfileImage)
        .get('/:username/stats', user.getUserStats)
        .get('/search', user.getSearchUsers)
        .get('/leaderboard', user.getLeaderboard)
        .post('/:username', user.postByUsername)
        .get('/:username', user.getByUsername),
    )
    .use(
      '/friend',
      express
        .Router()
        .post('/request', friendship.postSendRequest)
        .post('/respond', friendship.postResponse)
        .post('/remove', friendship.deleteFriend)
        .get('/list/:username', friendship.getFriendsList)
        .use('/chat', express.Router().post('/create', chat.postCreateChat)),
    ),
);

io.on('connection', socket => {
  const socketId = socket.id;
  console.log(`CONN [${socketId}] connected`);

  socket.on('disconnect', () => {
    console.log(`CONN [${socketId}] disconnected`);
  });

  socket.on('chatJoin', chat.socketJoin(socket, io));
  socket.on('chatLeave', chat.socketLeave(socket, io));
  socket.on('chatSendMessage', chat.socketSendMessage(socket, io));

  socket.on('gameJoinAsPlayer', game.socketJoinAsPlayer(socket, io));
  socket.on('gameMakeMove', game.socketMakeMove(socket, io));
  socket.on('gameStart', game.socketStart(socket, io));
  socket.on('gameWatch', game.socketWatch(socket, io));

  socket.on('whiteboardInit', wb.socketInitWhiteboard(socket, io));
  socket.on('whiteboardDraw', wb.socketDrawWhiteboard(socket, io));
  socket.on('whiteboardClear', wb.socketClearWhiteboard(socket, io));

  socket.onAny((name, payload) => {
    console.log(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      `RECV [${socketId}] got ${name}${'auth' in payload ? ` from ${payload.auth.username}` : ''} ${'payload' in payload ? JSON.stringify(payload.payload) : ''}`,
    );
  });
  socket.onAnyOutgoing(name => {
    console.log(`SEND [${socketId}] gets ${name}`);
  });
});

export default function startServer() {
  httpSever.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

if (process.env.MODE === 'production') {
  app.use(express.static(path.join(import.meta.dirname, '../../client/dist')));
  app.get(/(.*)/, (req, res) =>
    res.sendFile(path.join(import.meta.dirname, '../../client/dist/index.html')),
  );
} else {
  app.get('/', (req, res) => {
    res.send(
      'You are connecting directly to the API server in development mode! ' +
        'You probably want to look elsewhere for the Vite frontend.',
    );
    res.end();
  });
}
