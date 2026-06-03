
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface Props {
  index?: number;
}

export const AffiliateBanner: React.FC<Props> = ({ index }) => {
  const banners = [
    {
      id: 'danceWorkout',
      imageUrl: "https://lh3.googleusercontent.com/d/1hPj6vp2aGYF5_MRct1jIJcQhONmKjhoE",
      text: "DANCE WORKOUT",
      subText: "RECOMMENDED FOR YOU",
      icon: "💃",
      link: "/#skills?id=jRxXkTQI8Nh9V0eL4ar2",
      buttonText: "CHECK NOW"
    },
    {
      id: 'pickleball',
      imageUrl: "https://lh3.googleusercontent.com/d/1lOe6eBWShInwWQ_0Zy1_lRdKTcrt4gVh",
      text: "Pickleball racket: Special Sale - Up to 95% OFF!",
      subText: "Recommended for you",
      icon: "🎾",
      link: "https://invl.me/clncbf1",
      buttonText: "Shop Now"
    },
    {
      id: 'airPurifier',
      imageUrl: "https://lh3.googleusercontent.com/d/1K20SBIbP8hFQqf1oOzIuQRF6aSpZ4MRE",
      text: "Air Purifiers: Special Sale - Up to 83% OFF!",
      subText: "Recommended for you",
      icon: "🌬️",
      link: "https://invl.me/clnc3qg",
      buttonText: "Shop Now"
    }
  ];

  // Use provided index if available, otherwise fallback to daily rotation
  const today = new Date().getDate();
  const rotationIndex = index !== undefined ? index % banners.length : (today - 1) % banners.length;

  const currentBanner = banners[rotationIndex];

  return null;
};
