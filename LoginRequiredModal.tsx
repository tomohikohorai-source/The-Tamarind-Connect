
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

  return (
    <div className="my-6 animate-fade-in">
      <a 
        href={currentBanner.link} 
        target={currentBanner.link.startsWith('http') ? "_blank" : "_self"} 
        rel={currentBanner.link.startsWith('http') ? "noopener noreferrer" : undefined}
        className="block group relative overflow-hidden rounded-[32px] border-2 border-pink-100 shadow-sm active:scale-[0.98] transition-all"
      >
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-pink-50">
          <img 
            src={currentBanner.imageUrl} 
            alt="Special Offer" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
            <div className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest">
              Check it out <ExternalLink size={14} />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">{currentBanner.icon}</div>
            <div>
              <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest leading-none mb-1">{currentBanner.subText}</p>
              <p className="text-[12px] font-bold text-gray-700 leading-tight">{currentBanner.text}</p>
            </div>
          </div>
          <div className="bg-pink-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-100">
            {currentBanner.buttonText}
          </div>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-pink-50">
          <span className="text-[8px] font-black text-pink-400 uppercase tracking-widest">Sponsored</span>
        </div>
      </a>
    </div>
  );
};
