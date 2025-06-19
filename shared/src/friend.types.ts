import { z } from 'zod';
import { type SafeUserInfo } from './user.types.ts';

export interface FriendInfo {
  _id: string;
  requester: SafeUserInfo;
  addressee: SafeUserInfo;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendsListResponse {
  accepted: FriendInfo[];
  pending: FriendInfo[];
  rejected: FriendInfo[];
}

// For sending friend requests
export type FriendRequestPayload = z.infer<typeof zFriendRequestPayload>;
export const zFriendRequestPayload = z.object({
  username: z.string(),
});

// For responding to friend requests
export type FriendResponsePayload = z.infer<typeof zFriendResponsePayload>;
export const zFriendResponsePayload = z.object({
  friendshipId: z.string(),
  action: z.union([z.literal('accept'), z.literal('reject')]),
});

export type FriendRemovePayload = z.infer<typeof zFriendRemovePayload>;
export const zFriendRemovePayload = z.object({
  friendshipId: z.string().min(1),
});
