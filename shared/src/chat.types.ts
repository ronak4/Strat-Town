import { type SafeUserInfo } from './user.types.ts';
import { type MessageInfo } from './message.types.ts';

/**
 * Represents a chat document in the database.
 * - `_id`: database key
 * - `messages`: the ordered list of messages in the chat
 * - `createdAt`: when the chat was created
 * - 'participants': Optional field for to separate game chat and DMs
 */
export interface DatabaseChat {
  _id: string;
  messages: string[];
  createdAt: Date;
  participants?: string[];
}

/**
 * Represents a chat as exposed to the client
 * - `_id`: database key
 * - `messages`: the ordered list of messages in the chat
 * - `createdAt`: when the chat was created
 * - 'participants': Optional field for to separate game chat and DMs
 */
export interface ChatInfo {
  _id: string;
  messages: MessageInfo[];
  createdAt: Date;
  participants?: SafeUserInfo[];
}

/*** TYPES USED IN THE CHAT API ***/

/**
 * Relevant information for informing the client that a user joined a chat
 */
export interface ChatUserJoinedPayload {
  chatId: string;
  user: SafeUserInfo;
}

/**
 * Relevant information for informing the client that a user left a chat
 */
export interface ChatUserLeftPayload {
  chatId: string;
  user: SafeUserInfo;
}

/**
 * Relevant information for informing the client that a message was added to a
 * chat
 */
export interface ChatNewMessagePayload {
  chatId: string;
  message: MessageInfo;
}
