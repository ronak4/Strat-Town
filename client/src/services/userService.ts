import { APIResponse } from '../util/types.ts';
import { api, exceptionToErrorMsg } from './api.ts';
import { ErrorMsg, SafeUserInfo, UserAuth, UserUpdateRequest } from '@strategy-town/shared';

const USER_API_URL = `/api/user`;

/**
 * Sends a POST request to authenticate a user.
 */
export const loginUser = async (auth: UserAuth): APIResponse<SafeUserInfo> => {
  try {
    const res = await api.post<SafeUserInfo | ErrorMsg>(`${USER_API_URL}/login`, auth);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a POST request to update parts of a user's profile
 */
export const updateUser = async (
  auth: UserAuth,
  updates: UserUpdateRequest,
): APIResponse<SafeUserInfo> => {
  try {
    const res = await api.post<SafeUserInfo | ErrorMsg>(`${USER_API_URL}/${auth.username}`, {
      auth,
      payload: updates,
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a POST request to create a user
 *
 * @param user - The user credentials (username and password) for login.
 * @returns The authenticated user object, or an error message.
 */
export const signupUser = async (user: UserAuth): APIResponse<SafeUserInfo> => {
  try {
    const res = await api.post<SafeUserInfo | ErrorMsg>(`${USER_API_URL}/signup`, user);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * Sends a GET request for a user's data
 *
 * @param username - The username
 * @returns The user's information, or an error message.
 */
export const getUserById = async (username: string): APIResponse<SafeUserInfo> => {
  try {
    const res = await api.get<SafeUserInfo | ErrorMsg>(`${USER_API_URL}/${username}`);
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const searchUsers = async (query: string): APIResponse<SafeUserInfo[]> => {
  try {
    const res = await api.get<SafeUserInfo[]>(`${USER_API_URL}/search`, {
      params: { username: query },
    });
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

export const uploadProfileImage = async (
  auth: UserAuth,
  imageFile: File,
): APIResponse<{ imageUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('profileImage', imageFile);
    formData.append('username', auth.username);
    formData.append('password', auth.password);

    const res = await api.post<{ imageUrl: string } | ErrorMsg>(
      `${USER_API_URL}/upload-profile-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
