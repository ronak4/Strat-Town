import { type InferSchemaType, model, Schema } from 'mongoose';
import { type PopulateArgs } from '../types.ts';
import {
  COLORBLIND_OPTIONS,
  THEME_OPTIONS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
} from '@strategy-town/shared';

const preferencesSchema = new Schema(
  {
    colorblind: { type: String, enum: COLORBLIND_OPTIONS, default: 'none', required: true },
    theme: { type: String, enum: THEME_OPTIONS, default: 'light', required: true },
    fontSize: {
      type: String,
      enum: FONT_SIZE_OPTIONS,
      default: 'M',
      required: true,
    },
    fontFamily: { type: String, enum: FONT_FAMILY_OPTIONS, default: 'default', required: true },
  },
  { _id: false },
);

const statsSchema = new Schema(
  {
    gamesPlayed: { type: Number, default: 0, required: true },
    gamesWon: { type: Number, default: 0, required: true },
    gamesLost: { type: Number, default: 0, required: true },
    winRate: { type: Number, default: 0, required: true },
  },
  { _id: false },
);

export type UserRecord = InferSchemaType<typeof userSchema>;
const userSchema = new Schema({
  username: { type: String, required: true, unique: true, immutable: true },
  password: { type: String, required: true },
  display: { type: String, required: true },
  createdAt: { type: Date, required: true },
  bio: { type: String, required: false, default: '', max_length: 500 },
  image_url: { type: String, required: false, default: '' },
  preferences: {
    type: preferencesSchema,
    required: true,
    default: {},
  },
  stats: {
    type: statsSchema,
    required: true,
    default: {},
  },
});

/**
 * Represents a user document in the database.
 * - `username`: user's password
 * - `password`: user's password
 * - `display`: A display name
 * - `createdAt`: when this user registered.
 */
export const UserModel = model<UserRecord>('User', userSchema);

/**
 * MongoDB options that will cause a populated User path to match the
 * SafeUserInfo interface, without any extras.
 */
export const populateArgsForSafeUserInfo: PopulateArgs = {
  select: '-__v -_id -password',
  populate: [],
};
