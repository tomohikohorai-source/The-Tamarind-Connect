
import { UserProfile } from '../types';

const STORAGE_KEYS = {
  PASSCODE_VERIFIED: 'play_share_verified',
  USER_PROFILE: 'play_share_user_profile',
  ACKNOWLEDGED_ACTIVITIES: 'play_share_seen_activities',
  ACKNOWLEDGED_MARKET: 'play_share_seen_market',
  ACKNOWLEDGED_SKILLS: 'play_share_seen_skills',
  LANGUAGE: 'play_share_language',
  USED_PASSCODE: 'play_share_used_passcode'
};

export const store = {
  getLanguage: (): any => {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
  },
  setLanguage: (lang: string) => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },
  isVerified: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.PASSCODE_VERIFIED) === 'true';
  },
  setVerified: (v: boolean) => {
    localStorage.setItem(STORAGE_KEYS.PASSCODE_VERIFIED, v.toString());
  },
  getPasscode: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.USED_PASSCODE);
  },
  setPasscode: (code: string) => {
    localStorage.setItem(STORAGE_KEYS.USED_PASSCODE, code);
  },
  getUserProfile: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  },
  setUserProfile: (profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },
  getAcknowledgedActivities: (): Record<string, string> => {
    const data = localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGED_ACTIVITIES);
    return data ? JSON.parse(data) : {};
  },
  setAcknowledgedActivities: (mapping: Record<string, string>) => {
    localStorage.setItem(STORAGE_KEYS.ACKNOWLEDGED_ACTIVITIES, JSON.stringify(mapping));
  },
  getAcknowledgedMarket: (): Record<string, string> => {
    const data = localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGED_MARKET);
    return data ? JSON.parse(data) : {};
  },
  setAcknowledgedMarket: (mapping: Record<string, string>) => {
    localStorage.setItem(STORAGE_KEYS.ACKNOWLEDGED_MARKET, JSON.stringify(mapping));
  },
  getAcknowledgedSkills: (): Record<string, string> => {
    const data = localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGED_SKILLS);
    return data ? JSON.parse(data) : {};
  },
  setAcknowledgedSkills: (mapping: Record<string, string>) => {
    localStorage.setItem(STORAGE_KEYS.ACKNOWLEDGED_SKILLS, JSON.stringify(mapping));
  },
  clearAll: () => {
    localStorage.clear();
  }
};
