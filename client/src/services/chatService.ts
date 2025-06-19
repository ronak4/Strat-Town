import { api } from './api.ts';
import type { ChatInfo, UserAuth } from '@strategy-town/shared';

export async function createChat(auth: UserAuth, participants: string[]): Promise<ChatInfo> {
  const resp = await api.post<ChatInfo>('/api/friend/chat/create', {
    auth,
    payload: { participants },
  });
  return resp.data;
}
