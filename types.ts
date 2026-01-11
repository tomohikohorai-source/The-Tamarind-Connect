
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
  parentNickname: string;
  roomNumber: string;
  children: Child[];
  avatarIcon: string;
}

export interface Activity {
  id: string;
  userId: string;
  parentNickname: string; // Denormalized for fast display
  roomNumber: string;     // Denormalized for fast display
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
