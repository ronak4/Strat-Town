import {
  type SafeUserInfo,
  withAuth,
  zUserAuth,
  zUserUpdateRequest,
  type UserStats,
} from '@strategy-town/shared';
import {
  checkAuth,
  createUser,
  getUserByUsername,
  getUsersByUsername,
  populateSafeUserInfo,
  updateUser,
  searchUsersByUsername,
} from '../services/user.service.ts';
import { uploadProfileImage } from '../services/cloudinary.service.ts';
import { type RestAPI } from '../types.ts';
import { z } from 'zod';
import { UserModel, populateArgsForSafeUserInfo } from '../models/user.model.ts';

/**
 * Handles user login by validating credentials.
 * @param req The request containing username and password in the body.
 * @param res The response, either returning the user or an error.
 */
export const postLogin: RestAPI<SafeUserInfo> = async (req, res) => {
  const userAuth = zUserAuth.safeParse(req.body);
  if (!userAuth.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(userAuth.data);
  if (!user) {
    res.send({ error: 'Invalid username or password' });
    return;
  }

  res.send(await populateSafeUserInfo(user._id));
};

/**
 * Update a user's information
 * @param req A request containing a new password
 * @param res The response, either returning the updated user or an error
 */
export const postByUsername: RestAPI<SafeUserInfo, { username: string }> = async (req, res) => {
  const body = withAuth(zUserUpdateRequest).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user || user.username !== req.params.username) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }

  res.send(await updateUser(req.params.username, body.data.payload));
};

/**
 * Handles the creation of a new user account.
 * @param req The request containing username and password in the body.
 * @param res The response, either returning the created user or an error.
 * @returns A promise resolving to void.
 */
export const postSignup: RestAPI<SafeUserInfo> = async (req, res) => {
  const userAuth = zUserAuth.safeParse(req.body);
  if (!userAuth.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  res.send(await createUser(userAuth.data.username, userAuth.data.password, new Date()));
};

/**
 * Retrieves a user by their username.
 * @param req The request containing the username as a route parameter.
 * @param res The response, either returning the user (200) or an error.
 */
export const getByUsername: RestAPI<SafeUserInfo, { username: string }> = async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  if (!user) {
    res.status(404).send({ error: 'User not found' });
    return;
  }
  res.send(user);
};

/**
 * Returns the user information for a list of users
 */
export const postList: RestAPI<SafeUserInfo[]> = async (req, res) => {
  const usernames = z.array(z.string()).safeParse(req.body);
  if (!usernames.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }

  let users: SafeUserInfo[];
  try {
    users = await getUsersByUsername(usernames.data);
  } catch {
    res.send({ error: 'Usernames do not all exist' });
    return;
  }

  res.send(users);
};

/**
 * Handle POST requests to update user stats after a game
 */
export const postUpdateStats: RestAPI = async (req, res) => {
  const zGameStatsPayload = z.object({
    result: z.enum(['win', 'loss', 'draw']),
  });
  const body = withAuth(zGameStatsPayload).safeParse(req.body);
  if (!body.success) {
    res.status(400).send({ error: 'Poorly-formed request' });
    return;
  }
  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: 'Invalid credentials' });
    return;
  }
  const { result } = body.data.payload;
  const fullUser = await getUserByUsername(user.username);
  if (!fullUser) {
    res.status(404).send({ error: 'User not found' });
    return;
  }
  const stats = {
    gamesPlayed: (fullUser.stats?.gamesPlayed || 0) + 1,
    gamesWon: (fullUser.stats?.gamesWon || 0) + (result === 'win' ? 1 : 0),
    gamesLost: (fullUser.stats?.gamesLost || 0) + (result === 'loss' ? 1 : 0),
    winRate: 0,
  };
  stats.winRate = stats.gamesPlayed > 0 ? stats.gamesWon / stats.gamesPlayed : 0;
  const updatedUser = await updateUser(user.username, { stats });
  res.send(updatedUser);
};

/**
 * Handle GET requests to see users stats
 */
export const getUserStats: RestAPI<UserStats, { username: string }> = async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  if (!user) {
    res.status(404).send({ error: 'User not found' });
    return;
  }
  res.send(
    user.stats || {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
    },
  );
};

/**
 * Fetches users by username based on the search query.
 */
export const getSearchUsers: RestAPI<SafeUserInfo[]> = async (req, res) => {
  const raw = req.query.username;
  const q = Array.isArray(raw) ? raw[0] : raw;
  if (typeof q !== 'string' || q.length < 2) {
    res.status(400).send({ error: 'Provide at least 2 characters' });
    return;
  }
  try {
    const results = await searchUsersByUsername(q);
    res.send(results);
  } catch {
    res.status(500).send({ error: 'Server error' });
  }
};

/**
 * Handles the upload of a user's profile image to Cloudinary, given the image in multipart format.
 */
export const postUploadProfileImage: RestAPI<{ imageUrl: string }> = async (req, res) => {
  try {
    const body = zUserAuth.safeParse(req.body);

    if (!body.success) {
      res.status(400).send({ error: 'Username and password are required' });
      return;
    }

    const user = await checkAuth(body.data);
    if (!user) {
      res.status(403).send({ error: 'Invalid credentials' });
      return;
    }

    if (!req.file) {
      res.status(400).send({ error: 'No image file provided' });
      return;
    }

    if (!req.file.mimetype.startsWith('image/')) {
      res.status(400).send({ error: 'Only image files allowed' });
      return;
    }

    const imageUrl = await uploadProfileImage(req.file.buffer, user.username);

    res.send({ imageUrl });
  } catch (error) {
    res.status(500).send({ error: 'Failed to upload image' });
  }
};

/**
 * Handle GET requests to /api/user/leaderboard to return all users' stats for the leaderboard
 */
export const getLeaderboard: RestAPI<SafeUserInfo[]> = async (req, res) => {
  const users = await UserModel.find({}, populateArgsForSafeUserInfo.select).exec();
  const safeUsers = users.map(user => {
    const userObj = user.toObject();
    return {
      username: userObj.username,
      display: userObj.display,
      createdAt: userObj.createdAt,
      bio: userObj.bio || '',
      image_url: userObj.image_url || '',
      preferences: userObj.preferences,
      stats: userObj.stats,
    };
  });
  safeUsers.sort((a, b) => (b.stats?.winRate ?? 0) - (a.stats?.winRate ?? 0));
  res.send(safeUsers);
};
