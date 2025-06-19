import { z } from 'zod';

/**
 * Constants for user preference options
 */
export const COLORBLIND_OPTIONS = ['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const;
export const THEME_OPTIONS = [
  'light',
  'dark',
  'blue',
  'green',
  'purple',
  'orange',
  'pink',
  'teal',
  'amber',
] as const;
export const FONT_FAMILY_OPTIONS = ['default', 'arial', 'times', 'comic'] as const;
export const FONT_SIZE_OPTIONS = ['S', 'M', 'L'] as const;

/**
 * Represents the user's preferences. This contains the user's colorblindness
 * and theme preferences, as well as the font size and font family.
 */
export interface UserPreferences {
  colorblind: (typeof COLORBLIND_OPTIONS)[number];
  theme: (typeof THEME_OPTIONS)[number];
  fontSize: (typeof FONT_SIZE_OPTIONS)[number];
  fontFamily: (typeof FONT_FAMILY_OPTIONS)[number];
}

/**
 * Represents the user's game stats.
 */
export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
}

/**
 * Represents a "safe" user object that excludes sensitive information like
 * the password, suitable for exposing to clients,
 * - `username`: unique username of the user
 * - `display`: A display name
 * - `createdAt`: when this when the user registered.
 * - 'bio': a short description filled by the user about themselves.
 * - 'image_url': the URL for their profile picture, if any.
 * - 'preferences': the user's UI preferences
 * - 'stats': the user's game stats and win history.
 */
export interface SafeUserInfo {
  username: string;
  display: string;
  createdAt: Date;
  bio: string;
  image_url: string;
  preferences: UserPreferences;
  stats: UserStats;
}

/*** TYPES USED IN THE USER API ***/

/**
 * Represents allowed updates to a user.
 */
export type UserUpdateRequest = z.infer<typeof zUserUpdateRequest>;
export const zUserUpdateRequest = z.object({
  password: z.string().optional(),
  display: z.string().optional(),
  bio: z.string().optional(),
  image_url: z.string().optional(),
  preferences: z
    .object({
      colorblind: z.enum(COLORBLIND_OPTIONS).optional(),
      theme: z.enum(THEME_OPTIONS).optional(),
      fontSize: z.enum(FONT_SIZE_OPTIONS).optional(),
      fontFamily: z.enum(FONT_FAMILY_OPTIONS).optional(),
    })
    .optional(),
  stats: z
    .object({
      gamesPlayed: z.number().optional(),
      gamesWon: z.number().optional(),
      gamesLost: z.number().optional(),
      winRate: z.number().optional(),
    })
    .optional(),
});
