import type { UserAuth } from '@strategy-town/shared';
import type { FriendInfo, FriendsListResponse } from '@strategy-town/shared/src/friend.types';
import { api } from './api.ts';

const FRIEND_API = '/api/friend';

export async function getAllFriends(username: string): Promise<FriendsListResponse> {
  const res = await api.get<FriendsListResponse>(`${FRIEND_API}/list/${username}`);
  return res.data;
}

export async function sendFriendRequest(
  auth: UserAuth,
  toUsername: string,
): Promise<FriendInfo | null> {
  const res = await api.post<FriendInfo | null>(`${FRIEND_API}/request`, {
    auth,
    payload: { username: toUsername },
  });
  return res.data;
}

export async function respondToFriendRequest(
  auth: UserAuth,
  friendshipId: string,
  action: 'accept' | 'reject',
): Promise<FriendInfo | null> {
  const res = await api.post<FriendInfo | null>(`${FRIEND_API}/respond`, {
    auth,
    payload: { friendshipId, action },
  });
  return res.data;
}

export async function removeFriendship(
  auth: UserAuth,
  friendshipId: string,
): Promise<FriendInfo | null> {
  const res = await api.post<FriendInfo | null>(`${FRIEND_API}/remove`, {
    auth,
    payload: { friendshipId },
  });
  return res.data;
}
