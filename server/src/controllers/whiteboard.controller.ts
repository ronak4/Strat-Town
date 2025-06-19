import type { StrategyServer, StrategySocket } from '../types.ts';

export interface Stroke {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  colour: string;
  size: number;
  isEraser: boolean;
}

// In-memory store: one array of strokes per gameId
const boards = new Map<string, Stroke[]>();

/**
 * Client asks to initialise (or re-join) the whiteboard for a game.
 * - Ensures a board exists
 * - Joins the socket to the gameId room
 * - Sends back the full list of past strokes
 */
export const socketInitWhiteboard =
  (socket: StrategySocket, io: StrategyServer) => async (payload: { gameId: string }) => {
    const { gameId } = payload;
    if (!boards.has(gameId)) boards.set(gameId, []);
    const strokes = boards.get(gameId)!;
    await socket.join(gameId);
    socket.emit('whiteboardInit', strokes);
  };

/**
 * Client has drawn one segment.
 * - Appends it to the server’s board array
 * - Broadcasts that segment to everyone still in the same room
 */
export const socketDrawWhiteboard =
  (socket: StrategySocket, io: StrategyServer) => (payload: { gameId: string; stroke: Stroke }) => {
    const { gameId, stroke } = payload;
    if (!boards.has(gameId)) boards.set(gameId, []);
    boards.get(gameId)!.push(stroke);
    socket.broadcast.to(gameId).emit('whiteboardDraw', stroke);
  };

/**
 * Client pressed “clear”.
 * - Resets the board in memory
 * - Broadcasts the clear event so everyone wipes their canvas
 */
export const socketClearWhiteboard =
  (socket: StrategySocket, io: StrategyServer) => (payload: { gameId: string }) => {
    const { gameId } = payload;
    boards.set(gameId, []);
    io.to(gameId).emit('whiteboardClear');
  };
