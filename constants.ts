
import { LocationType } from './types';

export const RESIDENT_PASSCODE = '1234'; // Demo passcode

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
