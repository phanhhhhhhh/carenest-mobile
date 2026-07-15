import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  TOKEN: 'jwt_token',
  REFRESH_TOKEN: 'jwt_refresh_token',
  ROLE: 'user_role',
  NAME: 'user_name',
  PHONE: 'user_phone',
  USER_ID: 'user_id',
  EMAIL: 'user_email',
} as const;

const isWeb = Platform.OS === 'web';

const webStore = {
  getItemAsync: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItemAsync: (key: string, value: string) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  deleteItemAsync: (key: string) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const store = isWeb ? webStore : SecureStore;

export const saveToken = (v: string) => store.setItemAsync(KEYS.TOKEN, v);
export const getToken = () => store.getItemAsync(KEYS.TOKEN);
export const saveRefreshToken = (v: string) => store.setItemAsync(KEYS.REFRESH_TOKEN, v);
export const getRefreshToken = () => store.getItemAsync(KEYS.REFRESH_TOKEN);

export const saveRole = (v: string) => store.setItemAsync(KEYS.ROLE, v);
export const getRole = () => store.getItemAsync(KEYS.ROLE);
export const saveName = (v: string) => store.setItemAsync(KEYS.NAME, v);
export const getName = () => store.getItemAsync(KEYS.NAME);
export const savePhone = (v: string) => store.setItemAsync(KEYS.PHONE, v);
export const getPhone = () => store.getItemAsync(KEYS.PHONE);
export const saveUserId = (v: string) => store.setItemAsync(KEYS.USER_ID, v);
export const getUserId = () => store.getItemAsync(KEYS.USER_ID);
export const saveEmail = (v: string) => store.setItemAsync(KEYS.EMAIL, v);
export const getEmail = () => store.getItemAsync(KEYS.EMAIL);

export const clearAll = () =>
  Promise.all(Object.values(KEYS).map((k) => store.deleteItemAsync(k)));
