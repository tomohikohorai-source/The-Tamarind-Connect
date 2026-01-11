
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
  uid: string;
  customUserId: string;
  parentNickname: string;
  roomNumber: string;
  children: Child[];
  avatarIcon: string;
  // Pet features
  totalLoginDays: number;
  lastLoginDate: string; // ISO String
}

export interface Activity {
  id: string;
  userId: string;
  parentNickname: string;
  roomNumber: string;
  parentAvatarIcon: string;
  location: LocationType;
  startTime: string; 
  endTime: string;   
  message: string;
  childNicknames: string[];
  childAvatars: string[]; 
  isInvitation: boolean;
}

export type AppState = 'AUTH' | 'SETUP' | 'READY';
