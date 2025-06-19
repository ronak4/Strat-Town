import { ErrorMsg, GameInfo, GameKey, UserAuth, SkribblSettings } from '@strategy-town/shared';
import { api, exceptionToErrorMsg } from './api.ts';
import { APIResponse } from '../util/types.ts';

const GAME_API_URL = `/api/game`;

/**
 * Sends a POST request to create a game
 */
export const createGame = async (
  auth: UserAuth,
  payload: GameKey | { gameKey: GameKey; settings: SkribblSettings },
): APIResponse<GameInfo> => {
  try {
    const res = await api.post<GameInfo | ErrorMsg>(`${GAME_API_URL}/create`, {
      auth,
      payload,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a GET request to get a game
 */
export const getGameById = async (gameId: string): APIResponse<GameInfo> => {
  try {
    const res = await api.get<GameInfo | ErrorMsg>(`${GAME_API_URL}/${gameId}`);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a GET request for all games
 */
export const gameList = async (): APIResponse<GameInfo[]> => {
  try {
    const res = await api.get<GameInfo[] | ErrorMsg>(`${GAME_API_URL}/list`);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
