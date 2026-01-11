
import { UserProfile, Activity } from '../types';

const STORAGE_KEYS = {
  PASSCODE_VERIFIED: 'play_share_verified',
  USER_PROFILE: 'play_share_user_profile',
  ACTIVITIES: 'play_share_activities'
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
  getActivities: (): Activity[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return data ? JSON.parse(data) : [];
  },
  addActivity: (activity: Activity) => {
    const activities = store.getActivities();
    activities.push(activity);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  },
  updateActivity: (activity: Activity) => {
    const activities = store.getActivities().map(a => a.id === activity.id ? activity : a);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  },
  deleteActivity: (id: string) => {
    const activities = store.getActivities().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }
};
