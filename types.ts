
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
  showPastSales: boolean;
  showBuying: boolean;
  showPlayHistory: boolean;
  showSkills?: boolean;
  showWanted?: boolean;
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
  previousPrice?: number; // For discount tracking
  priceUpdatedAt?: string; // For discount timing
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
  buyerNickname?: string;
  buyerAvatarIcon?: string;
  images: string[]; 
  createdAt: string;
  lastUpdated: string;
  // Transaction flow flags
  buyerConfirmedCompletion?: boolean;
  sellerConfirmedCompletion?: boolean;
  buyerRequestedCancellation?: boolean;
  sellerRequestedCancellation?: boolean;
}

export interface SkillComment {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Skill {
  id: string;
  userId: string;
  parentNickname: string;
  parentAvatarIcon: string;
  roomNumber: string;
  title: string;
  category: string;
  description: string;
  type: 'OFFER' | 'REQUEST'; // Providing a skill or asking for one
  status: 'AVAILABLE' | 'RESERVED' | 'CLOSED';
  requestStatus: 'NONE' | 'PENDING' | 'REJECTED';
  requesterId?: string;
  requesterNickname?: string;
  requesterAvatarIcon?: string;
  price: string; // e.g. "Free", "RM 20/hr", "Exchange for coffee"
  previousPrice?: string; // For discount tracking
  priceUpdatedAt?: string; // For discount timing
  comments: SkillComment[];
  createdAt: string;
  lastUpdated: string;
  requesterRequestedCancellation?: boolean;
  sellerRequestedCancellation?: boolean;
}

export interface WantedComment {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface WantedItem {
  id: string;
  userId: string;
  parentNickname: string;
  roomNumber: string;
  parentAvatarIcon: string;
  title: string;
  genre: string;
  description: string;
  hopePrice: number;
  previousHopePrice?: number;
  hopePriceUpdatedAt?: string;
  pickupLocation: string;
  preferredTiming: string;
  images: string[];
  comments: WantedComment[];
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  lastUpdated: string;
}

export type AppTab = 'MARKET' | 'WANTED' | 'SKILLS' | 'PLAY' | 'PROFILE';
export type AppState = 'AUTH' | 'SETUP' | 'READY';
