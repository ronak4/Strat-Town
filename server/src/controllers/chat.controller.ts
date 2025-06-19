import { type ChatInfo, withAuth, zNewMessageRequest } from '@strategy-town/shared';
import { type RestAPI, type SocketAPI } from '../types.ts';
import { z } from 'zod';
import { addMessageToChat, forceChatById, findOrCreateChat } from '../services/chat.service.ts';
import {
  enforceAuth,
  populateSafeUserInfo,
  getUserWithIdByUsername,
} from '../services/user.service.ts';
import { createMessage, populateMessageInfo } from '../services/message.service.ts';
import { logSocketError } from './socket.controller.ts';
import { Types } from 'mongoose';

/**
 * Handle a socket request to join a chat: send the connection the chat's
 * current contents and  signal to everyone in the chat that the user has
 * joined
 */
export const socketJoin: SocketAPI = socket => async body => {
  try {
    const { auth, payload: chatId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    const chat = await forceChatById(chatId, user);
    await socket.join(chatId);

    // Send a "successfully joined" message to the person who just joined
    socket.emit('chatJoined', chat);

    // Send a "user successfully joined" message to everyone else (does not go
    // to newly-joined user)
    socket
      .to(chatId)
      .emit('chatUserJoined', { chatId, user: await populateSafeUserInfo(user._id) });
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Handle a socket request to leave a chat: stop sending that socket messages
 * about the chat and send everyone else a message that they left.
 */
export const socketLeave: SocketAPI = socket => async body => {
  try {
    const { auth, payload: chatId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    if (!socket.rooms.has(chatId)) {
      throw new Error(`user ${user.username} left chat they weren't in`);
    }
    await socket.leave(chatId);
    socket.to(chatId).emit('chatUserLeft', { chatId, user: await populateSafeUserInfo(user._id) });
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Handle a socket request to send a message to the chat: store the chat and
 * let everyone know about the new message.
 */
export const socketSendMessage: SocketAPI = (socket, io) => async body => {
  try {
    const {
      auth,
      payload: { chatId, text },
    } = withAuth(zNewMessageRequest).parse(body);
    const user = await enforceAuth(auth);
    const now = new Date();
    const messageId = await createMessage(user, text, now);
    await addMessageToChat(chatId, user, messageId);

    // Send the message to everyone, including the sender
    io.to(chatId).emit('chatNewMessage', { chatId, message: await populateMessageInfo(messageId) });
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * HTTP POST /api/chat/create
 * Checks if there is an existing chat for dms or creates a new one.
 * Game chat defaults to a new chat.
 */

export const postCreateChat: RestAPI<ChatInfo> = async (req, res) => {
  const parsed = withAuth(z.object({ participants: z.array(z.string()).min(2).max(2) })).safeParse(
    req.body,
  );
  if (!parsed.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }
  await enforceAuth(parsed.data.auth);

  const participants = parsed.data.payload.participants;

  const userDocsRaw = await Promise.all(
    participants.map(username => getUserWithIdByUsername(username)),
  );

  for (let i = 0; i < userDocsRaw.length; i += 1) {
    if (!userDocsRaw[i]) {
      res.status(404).send({ error: `User not found: ${participants[i]}` });
    }
  }

  const ids: Types.ObjectId[] = userDocsRaw.map(u => new Types.ObjectId(u!._id));

  const chat = await findOrCreateChat(ids);
  res.send(chat);
};
