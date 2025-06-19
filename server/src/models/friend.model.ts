import { type InferSchemaType, model, Schema } from 'mongoose';
import { populateArgsForSafeUserInfo } from './user.model.ts';
import { type PopulateArgs } from '../types.ts';

export type FriendRecord = InferSchemaType<typeof friendSchema>;
const friendSchema = new Schema({
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  addressee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    required: true,
    default: 'pending',
  },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
});
friendSchema.index({ requester: 1, addressee: 1 }, { unique: true });

export const FriendModel = model<FriendRecord>('Friend', friendSchema);

export const populateArgsForFriendInfo: PopulateArgs = {
  select: '-__v',
  populate: [
    { path: 'requester', ...populateArgsForSafeUserInfo },
    { path: 'addressee', ...populateArgsForSafeUserInfo },
  ],
};
