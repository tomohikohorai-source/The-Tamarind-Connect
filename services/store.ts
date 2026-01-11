
import { UserProfile } from '../types';

const STORAGE_KEYS = {
  PASSCODE_VERIFIED: 'play_share_verified',
  USER_PROFILE: 'play_share_user_profile'
};

export const store = {
  isVerified: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.PASSCODE_VERIFIED) === 'true';
  },
  setVerified: (v: boolean) => {
    localStorage.setItem(STORAGE_KEYS.PASSCODE_VERIFIED, v.toString());
  },
  getUserProfile: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  },
  setUserProfile: (profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },
  clearAll: () => {
    localStorage.clear();
  }
};
