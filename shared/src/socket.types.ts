import {
  type ChatInfo,
  type ChatNewMessagePayload,
  type ChatUserJoinedPayload,
  type ChatUserLeftPayload,
} from './chat.types.ts';
import { type NewMessagePayload } from './message.types.ts';
import { type WithAuth } from './auth.types.ts';
import { type GameMakeMovePayload, type GamePlayInfo, type TaggedGameView } from './game.types.ts';
import { type SafeUserInfo } from './user.types.ts';

export interface Stroke {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  colour: string;
  size: number;
  isEraser: boolean;
}

/**
 * The Socket.io interface for client to server communication
 */
export interface ClientToServerEvents {
  chatJoin: (payload: WithAuth<string>) => void;
  chatLeave: (payload: WithAuth<string>) => void;
  chatSendMessage: (payload: WithAuth<NewMessagePayload>) => void;
  gameJoinAsPlayer: (payload: WithAuth<string>) => void;
  gameMakeMove: (payload: WithAuth<GameMakeMovePayload>) => void;
  gameStart: (payload: WithAuth<string>) => void;
  gameWatch: (payload: WithAuth<string>) => void;
  whiteboardInit: (payload: { gameId: string }) => void;
  whiteboardDraw: (payload: { gameId: string; stroke: Stroke }) => void;
  whiteboardClear: (payload: { gameId: string }) => void;
}

/**
 * The Socket.io interface for server to client information
 */
export interface ServerToClientEvents {
  chatJoined: (payload: ChatInfo) => void;
  chatNewMessage: (payload: ChatNewMessagePayload) => void;
  chatUserJoined: (payload: ChatUserJoinedPayload) => void;
  chatUserLeft: (payload: ChatUserLeftPayload) => void;
  gamePlayersUpdated: (payload: SafeUserInfo[]) => void;
  gameStateUpdated: (payload: TaggedGameView & { forPlayer: boolean }) => void;
  gameWatched: (payload: GamePlayInfo) => void;
  whiteboardInit: (strokes: Stroke[]) => void;
  whiteboardDraw: (stroke: Stroke) => void;
  whiteboardClear: () => void;
}
