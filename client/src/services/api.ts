import { ErrorMsg } from '@strategy-town/shared';
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Function to handle successful responses
 */
const handleRes = (res: AxiosResponse) => res;

/**
 * Function to handle errors
 */
const handleErr = (err: AxiosError) => {
  return Promise.reject(err);
};

export const api = axios.create({ withCredentials: true });

/**
 * Add a request interceptor to the Axios instance.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: AxiosError) => handleErr(error),
);

/**
 * Add a response interceptor to the Axios instance.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => handleRes(response),
  (error: AxiosError) => handleErr(error),
);

/**
 *
 * @param error An unknown exception
 * @returns An error message
 */
export function exceptionToErrorMsg(error: unknown): ErrorMsg {
  if (axios.isAxiosError(error) && error.response) {
    return { error: `Error during request: ${error.response.statusText}` };
  } else {
    return { error: 'Error during request' };
  }
}
