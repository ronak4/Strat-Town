import {
  type FriendInfo,
  type FriendsListResponse,
  zFriendRemovePayload,
  zFriendRequestPayload,
  zFriendResponsePayload,
} from '@strategy-town/shared/src/friend.types.ts';
import type { RestAPI } from '../types.ts';
import { withAuth } from '@strategy-town/shared';
import { checkAuth, getUserWithIdByUsername } from '../services/user.service.ts';
import {
  createFriendRequest,
  getAllFriends,
  removeFriend,
  respondToFriendRequest,
} from '../services/friend.service.ts';

/**
 * Handle POST requests to `/api/friend/request` by sending a friend request to the specified user.
 * The authenticated user becomes the requester.
 *
 * @param req - Express request object containing auth and target username
 * @param res - Express response object, returns the created FriendInfo or error
 */
export const postSendRequest: RestAPI<FriendInfo> = async (req, res) => {
  const body = withAuth(zFriendRequestPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }

  const targetUser = await getUserWithIdByUsername(body.data.payload.username);
  if (!targetUser) {
    res.status(404).send({ error: 'User not found' });
    return;
  }

  if (user.username === targetUser.username) {
    res.status(400).send({ error: 'Cannot send friend request to yourself' });
    return;
  }

  const result = await createFriendRequest(user, targetUser);
  if (!result) {
    res.status(409).send({ error: 'Friend request already exists' });
    return;
  }

  res.send(result);
};

/**
 * Handle POST requests to `/api/friend/respond` by accepting or rejecting
 * a friend request. Only the addressee (recipient) of the request can respond.
 *
 * @param req - Express request object containing auth, friendshipId, and action
 * @param res - Express response object, returns the updated FriendInfo or error
 */
export const postResponse: RestAPI<FriendInfo> = async (req, res) => {
  const body = withAuth(zFriendResponsePayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }

  const result = await respondToFriendRequest(
    user,
    body.data.payload.friendshipId,
    body.data.payload.action,
  );

  if (!result) {
    res.status(404).send({ error: 'Friend request not found or invalid' });
    return;
  }

  res.send(result);
};

export const deleteFriend: RestAPI<FriendInfo> = async (req, res) => {
  const body = withAuth(zFriendRemovePayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }

  const result = await removeFriend(user, body.data.payload.friendshipId);
  if (!result) {
    res.status(404).send({ error: 'Friendship not found or cannot be removed.' });
    return;
  }
  res.send(result);
};

/**
 * Handle GET requests to `/api/friend/list/:username` by returning all friendships related to the
 * provided id.
 *
 * @param req - Express request object containing auth in body
 * @param res - Express response object, returns array of accepted FriendInfo
 */
export const getFriendsList: RestAPI<FriendsListResponse, { username: string }> = async (
  req,
  res,
) => {
  const user = await getUserWithIdByUsername(req.params.username);
  if (!user) {
    res.status(404).send({ error: 'User not found' });
    return;
  }

  const result = await getAllFriends(user);
  res.send(result);
};
