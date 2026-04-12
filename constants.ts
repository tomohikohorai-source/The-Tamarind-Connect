
import { LocationType } from './types';

export const TAMARIND_CONDO = {
  id: 'tamarind-penang',
  name: 'The Tamarind',
  address: 'Jalan Seri Tanjung 1, 10470 Tanjung Tokong Penang',
  lat: 5.4526,
  lng: 100.3075,
  radius: 400
};

export const CONDO_OPTIONS = [
  { id: 'i-santorini-penang', name: 'i-Santorini' },
  { id: 'Jazz Suite-penang', name: 'Jazz Suite' },
  { id: 'marinox-sky-villas-penang', name: 'Marinox Sky Villas' },
  { id: 'mira-residence-penang', name: 'Mira Residence' },
  { id: 'Other-Penang', name: 'Other' },
  { id: 'quayside-penang', name: 'Quayside' },
  { id: 'Selasih Court-penang', name: 'Selasih Court' },
  { id: 'Straits Residences-Penang', name: 'Straits Residences' },
  { id: 'tamarind-penang', name: 'Tamarind' }
];

export const CONDOS = CONDO_OPTIONS.map(opt => ({
  id: opt.id,
  name: opt.name,
  address: '', // To be filled if needed
  lat: 0,
  lng: 0,
  radius: 400
}));

export const RESIDENT_PASSCODE = '1234';
export const DEMO_PASSCODE = '1111';

export const LOCATION_METADATA = {
  [LocationType.POOL]: {
    label: 'Pool Area',
    icon: '🌊',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  [LocationType.OUTDOOR]: {
    label: 'Outdoor Playground',
    icon: '🌳',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-200'
  },
  [LocationType.INDOOR]: {
    label: 'Indoor Playground',
    icon: '🏠',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200'
  }
};

export const MARKET_LOCATIONS = [
  "Central Red Bench, G Floor Lobby",
  "Lobby 3A Lounge Entrance",
  "5F Gym Entrance",
  "Other (Specify)"
];

export const DEMO_MARKET_LOCATIONS = [
  "Demo Tower A Lobby",
  "Sky Garden Level 25",
  "Parcel Room B1",
  "Other (Specify)"
];

export const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash 💵' },
  { id: 'TNG', label: 'Touch \'n Go 📱' },
  { id: 'FREE', label: 'Free 🎁' }
];

export const MARKET_GENRES = [
  "Furniture",
  "Home Appliances",
  "Baby & Kids",
  "Clothing",
  "Food & Beverage (Unopened)",
  "Sports",
  "Books",
  "Games",
  "Tech (PC/Phone/Tablet)",
  "Beauty",
  "Kitchenware",
  "Pet Supplies",
  "Plants & Flowers",
  "Vehicles (Car/Bike)",
  "Hobby & Music",
  "Others"
];

export const GENRE_ICONS: Record<string, string> = {
  "Furniture": "🛋️",
  "Home Appliances": "📺",
  "Baby & Kids": "🧸",
  "Clothing": "👕",
  "Food & Beverage (Unopened)": "🍎",
  "Sports": "⚽",
  "Books": "📚",
  "Games": "🎮",
  "Tech (PC/Phone/Tablet)": "💻",
  "Beauty": "💄",
  "Kitchenware": "🍳",
  "Pet Supplies": "🐶",
  "Plants & Flowers": "🪴",
  "Vehicles (Car/Bike)": "🚲",
  "Hobby & Music": "🎸",
  "Others": "📦"
};

export const SKILL_CATEGORIES = [
  "Academic & Tutoring",
  "Music & Instruments",
  "Sports & Fitness",
  "Arts & Crafts",
  "Languages",
  "Tech & Digital",
  "Cooking & Baking",
  "Hobby & Others"
];

export const SKILL_ICONS: Record<string, string> = {
  "Academic & Tutoring": "📚",
  "Music & Instruments": "🎵",
  "Sports & Fitness": "🏃",
  "Arts & Crafts": "🎨",
  "Languages": "🗣️",
  "Tech & Digital": "💻",
  "Cooking & Baking": "🍳",
  "Hobby & Others": "🌟"
};

export const AVATAR_ICONS = {
  PARENTS: [
    '👤', '👨', '👩', '👨🏻', '👩🏻', '👨🏼', '👩🏼', '👨🏽', '👩🏽', '👨🏾', '👩🏾', '👨🏿', '👩🏿',
    '🧔', '🧔🏻', '🧔🏼', '🧔🏽', '🧔🏾', '🧔🏿', '🧕', '🧕🏻', '🧕🏼', '🧕🏽', '🧕🏾', '🧕🏿',
    '👴', '👵', '👴🏻', '👵🏻'
  ],
  CHILDREN: [
    '👶', '👶🏻', '👶🏼', '👶🏽', '👶🏾', '👶🏿', 
    '🍼', '🧸', '🐣', '🐥', '🎈', '🍭', '🎠',
    '👦', '👦🏻', '👦🏼', '👦🏽', '👦🏾', '👦🏿',
    '👧', '👧🏻', '👧🏼', '👧🏽', '👧🏾', '👧🏿',
    '🧒', '🧒🏻', '🧒🏼', '🧒🏽', '🧒🏾', '🧒🏿'
  ]
};

// Added AGE_OPTIONS for global access
export const AGE_OPTIONS = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16+"
];
