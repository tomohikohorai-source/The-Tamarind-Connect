
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

export interface PrivacySettings {
  showChildren: boolean;
  showListings: boolean;
  showReservations: boolean;
  showPlayHistory: boolean;
}

export interface UserProfile {
  uid: string;
  customUserId: string;
  parentNickname: string;
  roomNumber: string;
  children: Child[];
  avatarIcon: string;
  totalLoginDays: number;
  lastLoginDate: string; // ISO String
  privacySettings?: PrivacySettings;
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
  lastUpdated: string; // ISO String
}

export interface MarketComment {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface MarketItem {
  id: string;
  userId: string;
  parentNickname: string;
  roomNumber: string;
  parentAvatarIcon: string;
  title: string;
  genre: string;
  description: string;
  price: number;
  type: 'SALE' | 'FREE';
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  requestStatus: 'NONE' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
  paymentMethod: 'CASH' | 'TNG' | 'FREE';
  pickupLocation: string;
  pickupDateTime: string; 
  condition: 'S' | 'A' | 'B' | 'C'; 
  comments: MarketComment[];
  buyerId?: string; 
  images: string[]; 
  createdAt: string;
  lastUpdated: string;
  // Transaction flow flags
  buyerConfirmedCompletion?: boolean;
  sellerConfirmedCompletion?: boolean;
}

export type AppTab = 'HOME' | 'MARKET' | 'PROFILE';
export type AppState = 'AUTH' | 'SETUP' | 'READY';
