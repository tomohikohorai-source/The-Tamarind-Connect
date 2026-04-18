
import React, { useState, useRef } from 'react';
import { UserProfile, MarketItem } from '../types';
import { MARKET_LOCATIONS, DEMO_MARKET_LOCATIONS, PAYMENT_METHODS, MARKET_GENRES, DEMO_PASSCODE, CONDO_OPTIONS } from '../constants';
import { store } from '../services/store';
import { ChevronLeft, X, Package, Tag, Info, MapPin, CreditCard, Clock, Calendar, MessageSquare, Camera, Trash2, Coins, Layers, ShieldAlert, Building2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

import { Language, translations } from '../translations';

interface Props {
  profile: UserProfile;
  language?: Language;
  initialItem?: MarketItem;
  onSubmit: (item: MarketItem) => void;
  onCancel: () => void;
}

const CONDITIONS = [
  { id: 'S', label: 'Rank S', desc: 'New / Unopened' },
  { id: 'A', label: 'Rank A', desc: 'Like New' },
  { id: 'B', label: 'Rank B', desc: 'Good Condition' },
  { id: 'C', label: 'Rank C', desc: 'Well Used' }
];

type PickupMode = 'DATETIME' | 'DATE' | 'PERIOD' | 'NONE';

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800; // Increased from 400 for better resolution
      const MAX_HEIGHT = 800; // Increased from 400 for better resolution
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.75)); // Increased quality from 0.6 to 0.75
    };
  });
};

export const MarketItemForm: React.FC<Props> = ({ profile, language = 'en', initialItem, onSubmit, onCancel }) => {
  const t = translations[language];
  const [title, setTitle] = useState(initialItem?.title || '');
  const [genre, setGenre] = useState(initialItem?.genre || MARKET_GENRES[0]);
  const [description, setDescription] = useState(initialItem?.description || '');
  const [price, setPrice] = useState(initialItem?.price?.toString() || '1');
  const [type, setType] = useState<'SALE' | 'FREE'>(initialItem?.type || 'FREE');
  const [condition, setCondition] = useState<MarketItem['condition']>(initialItem?.condition || 'B');
  const [paymentMethod, setPaymentMethod] = useState<MarketItem['paymentMethod']>(initialItem?.paymentMethod || 'FREE');
  const [images, setImages] = useState<string[]>(initialItem?.images || []);
  const [isCompresing, setIsCompressing] = useState(false);
  const [condoId, setCondoId] = useState(initialItem?.condoId || profile.condoId || 'tamarind-penang');
  const [customCondoName, setCustomCondoName] = useState(initialItem?.customCondoName || (initialItem?.condoId === 'Other-Penang' ? '' : (profile.condoId === 'Other-Penang' ? profile.customCondoName : '')));

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isTamarindSelected = condoId === 'tamarind-penang';
  const locations = store.getPasscode() === DEMO_PASSCODE 
    ? DEMO_MARKET_LOCATIONS 
    : (isTamarindSelected ? MARKET_LOCATIONS : ['LOBBY', 'Other (Specify)']);

  const [pickupLocation, setPickupLocation] = useState(initialItem?.pickupLocation?.startsWith('Other:') ? 'Other (Specify)' : initialItem?.pickupLocation || locations[0]);
  const [otherLocationText, setOtherLocationText] = useState(initialItem?.pickupLocation?.startsWith('Other:') ? initialItem.pickupLocation.replace('Other: ', '') : '');

  const [pickupMode, setPickupMode] = useState<PickupMode>(initialItem?.pickupDateTime?.includes('Between') ? 'PERIOD' : initialItem?.pickupDateTime?.includes('On') ? (initialItem.pickupDateTime.split(' ').length > 2 ? 'DATETIME' : 'DATE') : 'NONE');
  const [pDate, setPDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [pTime, setPTime] = useState('14:00');
  const [pDateEnd, setPDateEnd] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));

  const minDate = format(new Date(), 'yyyy-MM-dd');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - images.length;
    const selectedFiles = (Array.from(files) as File[]).slice(0, remainingSlots);

    setIsCompressing(true);
    const newImages: string[] = [];
    for (const file of selectedFiles) {
      const reader = new FileReader();
      const base64: string = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file as Blob);
      });
      const compressed = await compressImage(base64);
      newImages.push(compressed);
    }
    setImages(prev => [...prev, ...newImages]);
    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalLocation = pickupLocation;
    if (pickupLocation === 'Other (Specify)') {
      finalLocation = `Other: ${otherLocationText}`;
    }

    let finalTime = '';
    switch(pickupMode) {
      case 'DATETIME': finalTime = `On: ${pDate} ${pTime}`; break;
      case 'DATE': finalTime = `On: ${pDate}`; break;
      case 'PERIOD': finalTime = `Between: ${pDate} and ${pDateEnd}`; break;
      case 'NONE': finalTime = `Contact for details`; break;
    }

    const currentPrice = type === 'FREE' ? 0 : Math.max(1, Number(price));
    
    // Check for discount
    const isPriceReduced = initialItem && initialItem.type === 'SALE' && currentPrice < initialItem.price;
    const priceUpdatedAt = isPriceReduced ? new Date().toISOString() : initialItem?.priceUpdatedAt;
    const previousPrice = isPriceReduced ? initialItem.price : initialItem?.previousPrice;

    // Build the final object carefully to avoid 'undefined' properties
    const itemData: any = {
      id: initialItem?.id || crypto.randomUUID(),
      userId: profile.uid,
      condoCode: profile.condoCode || store.getPasscode() || '',
      condoId: condoId,
      customCondoName: condoId === 'Other-Penang' ? customCondoName : '',
      parentNickname: profile.parentNickname,
      roomNumber: profile.roomNumber,
      parentAvatarIcon: profile.avatarIcon,
      title,
      genre,
      description,
      price: currentPrice,
      type,
      condition,
      status: initialItem?.status || 'AVAILABLE',
      requestStatus: initialItem?.requestStatus || 'NONE',
      paymentMethod: type === 'FREE' ? 'FREE' : paymentMethod,
      pickupLocation: finalLocation,
      pickupDateTime: finalTime,
      comments: initialItem?.comments || [],
      images,
      buyerId: initialItem?.buyerId || '',
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Only add optional fields if they have a value
    if (previousPrice !== undefined) itemData.previousPrice = previousPrice;
    if (priceUpdatedAt !== undefined) itemData.priceUpdatedAt = priceUpdatedAt;
    if (initialItem?.buyerNickname) itemData.buyerNickname = initialItem.buyerNickname;
    if (initialItem?.buyerAvatarIcon) itemData.buyerAvatarIcon = initialItem.buyerAvatarIcon;
    if (initialItem?.rejectionReason) itemData.rejectionReason = initialItem.rejectionReason;
    if (initialItem?.buyerConfirmedCompletion !== undefined) itemData.buyerConfirmedCompletion = initialItem.buyerConfirmedCompletion;
    if (initialItem?.sellerConfirmedCompletion !== undefined) itemData.sellerConfirmedCompletion = initialItem.sellerConfirmedCompletion;

    onSubmit(itemData as MarketItem);
  };

  return (
    <div className="bg-white p-8 rounded-t-[40px] shadow-2xl overflow-y-auto max-h-[95vh] border-t border-teal-50 hide-scrollbar relative">
      <div className="flex justify-between items-center mb-10">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-gray-500 font-black text-xs bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 uppercase tracking-widest shadow-sm"><ChevronLeft size={18} /> {t.back}</button>
        <h2 className="text-xl font-black text-gray-800 tracking-tighter uppercase">{initialItem ? t.editListing : t.sellOrGive}</h2>
        <button onClick={onCancel} className="text-gray-300"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        <div>
          <label className="text-[11px] font-black text-gray-400 mb-4 block uppercase tracking-widest ml-1">Images (Max 3)</label>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-teal-100 shadow-sm shrink-0">
                <img src={img} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1.5 bg-red-500/80 text-white rounded-full backdrop-blur-sm"><X size={12} /></button>
              </div>
            ))}
            {images.length < 3 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isCompresing} className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-teal-400 hover:text-teal-400 transition-all shrink-0 active:scale-95">
                {isCompresing ? <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div> : <Camera size={24} />}
                <span className="text-[8px] font-black uppercase">{isCompresing ? t.loading : t.add}</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />
          </div>
        </div>

        <div className="flex gap-3">
          {[{ id: 'FREE', label: t.give }, { id: 'SALE', label: t.sale }].map(t_btn => (
            <button key={t_btn.id} type="button" onClick={() => { setType(t_btn.id as any); if (t_btn.id === 'FREE') setPaymentMethod('FREE'); else if (paymentMethod === 'FREE') setPaymentMethod('CASH'); }} className={`flex-1 py-4 rounded-2xl font-black transition-all text-[11px] uppercase tracking-widest ${type === t_btn.id ? 'bg-teal-400 text-white shadow-xl scale-[1.02]' : 'bg-gray-50 text-gray-400'}`}>{t_btn.label}</button>
          ))}
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-black text-gray-400 block uppercase tracking-widest ml-1">{t.condition} (Rank)</label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(c => (
              <button key={c.id} type="button" onClick={() => setCondition(c.id as any)} className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col gap-0.5 ${condition === c.id ? 'border-teal-400 bg-teal-50 shadow-inner' : 'border-gray-50 bg-white'}`}>
                <span className={`text-[10px] font-black uppercase ${condition === c.id ? 'text-teal-600' : 'text-gray-400'}`}>{t[`rank${c.id}` as keyof typeof t] || c.label}</span>
                <span className="text-[8px] font-bold text-gray-400 leading-tight">{t[c.desc.toLowerCase().replace(/ \/ /g, '').replace(/ /g, '') as keyof typeof t] || c.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.condoLocation}</label>
          <div className="relative">
            <Building2 className="absolute left-4 top-3.5 text-teal-200" size={18} />
            <select 
              value={condoId} 
              onChange={e => {
                const newCondoId = e.target.value;
                setCondoId(newCondoId);
                
                // Reset pickup location if it's not in the new list
                const newIsTamarind = newCondoId === 'tamarind-penang';
                const newLocations = store.getPasscode() === DEMO_PASSCODE 
                  ? DEMO_MARKET_LOCATIONS 
                  : (newIsTamarind ? MARKET_LOCATIONS : ['LOBBY', 'Other (Specify)']);
                
                if (!newLocations.includes(pickupLocation)) {
                  setPickupLocation(newLocations[0]);
                }
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm appearance-none"
            >
              {CONDO_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
            </select>
          </div>
          {condoId === 'Other-Penang' && (
            <div className="animate-fade-in mt-2">
              <input 
                type="text" 
                value={customCondoName} 
                onChange={e => setCustomCondoName(e.target.value)} 
                placeholder="Enter condominium name" 
                className="w-full p-3.5 rounded-2xl bg-gray-50 border-2 border-teal-100 outline-none font-bold text-sm" 
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.itemTitle}</label>
            <div className="relative"><Package className="absolute left-4 top-3.5 text-teal-200" size={18} /><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Kids Tricycle" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm" required /></div>
          </div>
          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.genre}</label>
            <div className="relative">
              <Layers className="absolute left-4 top-3.5 text-teal-200" size={18} />
              <select 
                value={genre} 
                onChange={e => setGenre(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm appearance-none"
              >
                {MARKET_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.description}</label>
            <p className="text-[9px] text-gray-400 font-bold italic mb-2 ml-1">{t.translationNotice}</p>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t.conditionDetails} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-medium text-sm h-24 resize-none" />
          </div>
        </div>

        {type === 'SALE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div className="bg-teal-50/50 p-6 rounded-[32px] border border-teal-100 space-y-3">
              <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-2">{t.price} (RM)</label>
              <input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-4 bg-white border-2 border-teal-100 rounded-2xl outline-none font-black text-xl text-teal-600" />
            </div>
            <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">{t.payment}</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none font-black text-xs appearance-none">
                {PAYMENT_METHODS.filter(m => m.id !== 'FREE').map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="text-[11px] font-black text-gray-400 block uppercase tracking-widest flex items-center gap-2"><Clock size={14} className="text-teal-400"/> {t.preferredPickup}</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'DATETIME', label: t.specificTime },
              { id: 'DATE', label: t.specificDate },
              { id: 'PERIOD', label: t.dateRange },
              { id: 'NONE', label: t.discuss }
            ].map(m => (
              <button key={m.id} type="button" onClick={() => setPickupMode(m.id as any)} className={`py-3 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${pickupMode === m.id ? 'border-teal-400 bg-teal-50 text-teal-600' : 'border-gray-50 bg-white text-gray-300'}`}>
                {m.label}
              </button>
            ))}
          </div>

          {pickupMode !== 'NONE' && (
            <div className="p-4 bg-teal-50/30 rounded-3xl border border-teal-50 space-y-4 animate-fade-in">
              {(pickupMode === 'DATETIME' || pickupMode === 'DATE' || pickupMode === 'PERIOD') && (
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">{pickupMode === 'PERIOD' ? t.startDate : t.targetDate}</label>
                  <input type="date" min={minDate} value={pDate} onChange={e => setPDate(e.target.value)} className="w-full p-3.5 bg-white border border-teal-100 rounded-xl outline-none font-bold text-sm" />
                </div>
              )}
              {pickupMode === 'DATETIME' && (
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">{t.targetTime}</label>
                  <input type="time" value={pTime} onChange={e => setPTime(e.target.value)} className="w-full p-3.5 bg-white border border-teal-100 rounded-xl outline-none font-bold text-sm" />
                </div>
              )}
              {pickupMode === 'PERIOD' && (
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">{t.endDate}</label>
                  <input type="date" min={pDate} value={pDateEnd} onChange={e => setPDateEnd(e.target.value)} className="w-full p-3.5 bg-white border border-teal-100 rounded-xl outline-none font-bold text-sm" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-teal-400"/> {t.pickupLocation}</label>
          <div className="grid grid-cols-1 gap-2">
            {locations.map(loc => (
              <button key={loc} type="button" onClick={() => setPickupLocation(loc)} className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${pickupLocation === loc ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-gray-50 bg-white text-gray-400'}`}>
                <span className="text-[10px] font-black uppercase tracking-tight">
                  {loc === 'Other (Specify)' ? t.otherSpecify : (loc === 'LOBBY' ? t.lobby : loc)}
                </span>
              </button>
            ))}
          </div>
          {pickupLocation === 'Other (Specify)' && (
            <div className="relative animate-fade-in mt-2">
              <input type="text" value={otherLocationText} onChange={e => setOtherLocationText(e.target.value)} placeholder="e.g. Near the 3A Lift Lobby" className="w-full p-4 bg-gray-50 border-2 border-teal-100 rounded-2xl outline-none font-bold text-sm text-gray-700" />
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-5 rounded-[32px] border border-gray-100">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-pink-400 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
              {t.disclaimer}
            </p>
          </div>
        </div>

        <button type="submit" className="w-full py-5 rounded-[28px] font-black bg-teal-400 text-white shadow-2xl shadow-teal-100 uppercase tracking-[0.2em] text-[13px] active:scale-95 transition-all">{t.postListing}</button>
      </form>
    </div>
  );
};
