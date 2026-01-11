
export enum LocationType {
  POOL = 'POOL',
  OUTDOOR = 'OUTDOOR',
  INDOOR = 'INDOOR'
}

export interface Child {
  id: string;
  nickname: string;
  age: string;
  gender: 'boy' | 'girl' | 'other';
  intro: string;
  avatarIcon: string;
}

export interface UserProfile {
  parentNickname: string;
  roomNumber: string;
  children: Child[];
  avatarIcon: string;
}

export interface Activity {
  id: string;
  userId: string;
  parentNickname: string;
  roomNumber: string;
  location: LocationType;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  message: string;
  childNicknames: string[];
  isInvitation: boolean;
  parentAvatarIcon: string;
}

export type AppState = 'LOCKED' | 'SETUP' | 'READY';
