import {
  type GameInfo,
  withAuth,
  zGameMakeMovePayload,
  zGameCreatePayload,
  type GameKey,
} from '@strategy-town/shared';
import {
  type RestAPI,
  type GameViewUpdates,
  type SocketAPI,
  type StrategyServer,
} from '../types.ts';
import {
  createGame,
  gameServices,
  getGameById,
  getGames,
  joinGame,
  startGame,
  updateGame,
  viewGame,
} from '../services/game.service.ts';
import { checkAuth, enforceAuth } from '../services/user.service.ts';
import { z } from 'zod';
import { logSocketError } from './socket.controller.ts';
import { type Types } from 'mongoose';

/**
 * Per-game in-memory queue: ensures one move at a time per gameId.
 */
const gameQueues: Record<string, Promise<GameViewUpdates>> = {};

/**
 * Queue work so that only one job per gameId runs at once.
 * Ignores prior errors so the chain never breaks.
 */
function queueForMove(
  gameId: string,
  work: () => Promise<GameViewUpdates>,
): Promise<GameViewUpdates> {
  const last = gameQueues[gameId] ?? Promise.resolve();

  const next = last
    .catch(() => {
      /* ignore errors */
    })
    .then(() => work())
    .finally(() => {
      // if nobody queued behind us, delete the slot
      if (gameQueues[gameId] === next) {
        delete gameQueues[gameId];
      }
    });

  gameQueues[gameId] = next;
  return next;
}

/**
 * Handle POST requests to `/api/game/create` by creating a game. The game
 * starts with one player, the user who made the POST request.
 */
export const postCreate: RestAPI<GameInfo> = async (req, res) => {
  const body = withAuth(zGameCreatePayload).safeParse(req.body);
  if (body.error) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }

  // Handle both old format (string) and new format (object)
  const payload = body.data.payload;
  const gameKey = typeof payload === 'string' ? payload : payload.gameKey;
  const settings = typeof payload === 'string' ? undefined : payload.settings;

  // Validate that the game key exists
  if (!(gameKey in gameServices)) {
    res.status(400).send({ error: 'Invalid game type' });
    return;
  }

  const game = await createGame(user, gameKey as GameKey, new Date(), settings);
  res.send(game);
};

/**
 * Handle GET requests to `/api/game/:id`. Returns either 404 or a game info
 * object.
 */
export const getById: RestAPI<GameInfo, { id: string }> = async (req, res) => {
  const game = await getGameById(req.params.id);
  if (!game) {
    res.status(404).send({ error: 'Game not found' });
    return;
  }

  res.send(game);
};

/**
 * Handle GET requests to `/api/game/list` by returning information about all
 * games, sorted in reverse chronological order by creation.
 */
export const getList: RestAPI<GameInfo[]> = async (req, res) => {
  res.send(await getGames());
};

/**
 * Each active game player gets a dedicated room that sends messages
 * to just their socket connections. This function derives that room name from
 * the game id and the username.
 *
 * @param gameId - the game id, also the 'base' room name
 * @param userId - user id (not username!)
 * @returns a room name unique to that game id and user
 */
function userRoom(gameId: string, user: Types.ObjectId) {
  return `${gameId}-${user}`;
}

/**
 * Handle the socket request sent by a user when they load to a game page. The
 * server's job is to respond with full information about the game's current
 * players and the appropriate view of the game's state. The server also needs
 * to register the user for future updates about the game's state.
 */
export const socketWatch: SocketAPI = socket => async body => {
  try {
    const { auth, payload: gameId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    const { isPlayer, view, players } = await viewGame(gameId, user);
    const roomsToJoin = isPlayer ? [gameId, userRoom(gameId, user._id)] : [gameId];
    await socket.join(roomsToJoin);
    socket.emit('gameWatched', { _id: gameId, view, players });
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Broadcast view updates to appropriate users
 */
function sendViewUpdates(io: StrategyServer, gameId: string, updates: GameViewUpdates) {
  io.to(gameId).emit('gameStateUpdated', { ...updates.watchers, forPlayer: false });
  for (const { userId, view } of updates.players) {
    io.to(userRoom(gameId, userId)).emit('gameStateUpdated', { ...view, forPlayer: true });
  }
}

/**
 * Handle the socket request sent by a user when they try to join a game.
 */
export const socketJoinAsPlayer: SocketAPI = (socket, io) => async body => {
  try {
    const { auth, payload: gameId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    const game = await joinGame(gameId, user);

    // Let everyone know the user joined (`io` instead of `socket` includes
    // the joiner)
    io.to(gameId).emit('gamePlayersUpdated', game.players);

    // This socket should receive user-specific updates for this game, if it
    // isn't already
    if (!socket.rooms.has(userRoom(gameId, user._id))) {
      await socket.join(userRoom(gameId, user._id));
    }
    if (!socket.rooms.has(gameId)) {
      await socket.join(gameId);
    }

    // If the game is full, it starts automatically
    if (game.players.length === gameServices[game.type].maxPlayers) {
      sendViewUpdates(io, gameId, await startGame(gameId, user));
    }
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Handle a request to start the game.
 */
export const socketStart: SocketAPI = (socket, io) => async body => {
  try {
    const { auth, payload: gameId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    sendViewUpdates(io, gameId, await startGame(gameId, user));
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Handle a request to make a move in a game.
 */
export const socketMakeMove: SocketAPI = (socket, io) => async body => {
  try {
    const {
      auth,
      payload: { gameId, move },
    } = withAuth(zGameMakeMovePayload).parse(body);
    const user = await enforceAuth(auth);
    // Updated, uses queue for moves
    const viewUpdates = await queueForMove(gameId, () => updateGame(gameId, user, move));
    sendViewUpdates(io, gameId, viewUpdates);
  } catch (err) {
    logSocketError(socket, err);
  }
};
