import { type InferSchemaType, model, Schema } from 'mongoose';
import { type PopulateArgs } from '../types.ts';
import { populateArgsForMessageInfo } from './message.model.ts';

export type ChatRecord = InferSchemaType<typeof chatSchema>;
const chatSchema = new Schema({
  messages: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Message', required: true }],
    required: true,
  },
  createdAt: { type: Date, required: true },
  participants: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    required: false,
    default: [],
  },
});

/**
 * Represents a chat document in the database.
 * - `messages`: the ordered list of messages in the chat
 * - `createdAt`: when the chat was created
 */
export const ChatModel = model<ChatRecord>('Chat', chatSchema);

export const populateArgsForChatInfo: PopulateArgs = {
  select: '-__v',
  populate: [
    { path: 'messages', ...populateArgsForMessageInfo },
    {
      path: 'participants',
      select: 'username displayName',
      model: 'User',
    },
  ],
};
