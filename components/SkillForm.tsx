
import React, { useState } from 'react';
import { UserProfile, Skill } from '../types';
import { SKILL_CATEGORIES, SKILL_ICONS, CONDO_OPTIONS } from '../constants';
import { store } from '../services/store';
import { ChevronLeft, X, BookOpen, MessageSquare, ShieldAlert, Award, CreditCard, Layers, Building2 } from 'lucide-react';

import { Language, translations } from '../translations';

interface Props {
  profile: UserProfile;
  language?: Language;
  initialSkill?: Skill;
  onSubmit: (skill: Skill) => void;
  onCancel: () => void;
}

export const SkillForm: React.FC<Props> = ({ profile, language = 'en', initialSkill, onSubmit, onCancel }) => {
  const t = translations[language];
  const [title, setTitle] = useState(initialSkill?.title || '');
  const [category, setCategory] = useState(initialSkill?.category || SKILL_CATEGORIES[0]);
  const [description, setDescription] = useState(initialSkill?.description || '');
  const [type, setType] = useState<'OFFER' | 'REQUEST'>(initialSkill?.type || 'OFFER');
  const [price, setPrice] = useState(initialSkill?.price || 'Free');
  const [condoId, setCondoId] = useState(initialSkill?.condoId || profile.condoId || 'tamarind-penang');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Numeric comparison for DISCOUNT tracking
    const getNum = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
    const currentVal = getNum(price);
    const oldVal = initialSkill ? getNum(initialSkill.price) : 0;

    const isPriceReduced = initialSkill && currentVal > 0 && oldVal > 0 && currentVal < oldVal;
    const priceUpdatedAt = isPriceReduced ? new Date().toISOString() : initialSkill?.priceUpdatedAt;
    const previousPrice = isPriceReduced ? initialSkill.price : initialSkill?.previousPrice;

    // Clean construction to avoid undefined properties
    const skillData: any = {
      id: initialSkill?.id || crypto.randomUUID(),
      userId: profile.uid,
      condoCode: profile.condoCode || store.getPasscode() || '',
      condoId: condoId,
      parentNickname: profile.parentNickname,
      parentAvatarIcon: profile.avatarIcon,
      roomNumber: profile.roomNumber,
      title,
      category,
      description,
      type,
      status: initialSkill?.status || 'AVAILABLE',
      requestStatus: initialSkill?.requestStatus || 'NONE',
      price,
      comments: initialSkill?.comments || [],
      createdAt: initialSkill?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    if (previousPrice !== undefined) skillData.previousPrice = previousPrice;
    if (priceUpdatedAt !== undefined) skillData.priceUpdatedAt = priceUpdatedAt;
    if (initialSkill?.requesterId) {
      skillData.requesterId = initialSkill.requesterId;
      skillData.requesterNickname = initialSkill.requesterNickname;
      skillData.requesterAvatarIcon = initialSkill.requesterAvatarIcon;
    }

    onSubmit(skillData as Skill);
  };

  return (
    <div className="bg-white p-8 rounded-t-[40px] shadow-2xl overflow-y-auto max-h-[95vh] border-t border-indigo-50 hide-scrollbar relative">
      <div className="flex justify-between items-center mb-10">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-gray-500 font-black text-xs bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 uppercase tracking-widest shadow-sm active:scale-95 transition-all"><ChevronLeft size={18} /> {t.back}</button>
        <h2 className="text-xl font-black text-gray-800 tracking-tighter uppercase">{initialSkill ? t.updateSkill : t.shareSkill}</h2>
        <button onClick={onCancel} className="text-gray-300"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        <div className="flex gap-3">
          {[
            { id: 'OFFER', label: t.iCanHelp },
            { id: 'REQUEST', label: t.iNeedHelp }
          ].map(t_btn => (
            <button key={t_btn.id} type="button" onClick={() => setType(t_btn.id as any)} className={`flex-1 py-4 rounded-2xl font-black transition-all text-[11px] uppercase tracking-widest ${type === t_btn.id ? 'bg-indigo-400 text-white shadow-xl scale-[1.02]' : 'bg-gray-50 text-gray-400'}`}>{t_btn.label}</button>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.condoLocation}</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <select 
                value={condoId} 
                onChange={e => setCondoId(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm appearance-none focus:ring-2 ring-indigo-50"
              >
                {CONDO_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.heading}</label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-indigo-50" required />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.category}</label>
            <div className="relative">
              <Layers className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm appearance-none focus:ring-2 ring-indigo-50"
              >
                {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.reward}</label>
            <div className="relative">
              <Award className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-indigo-50" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">{t.aboutSkill}</label>
            <p className="text-[9px] text-gray-400 font-bold italic mb-2 ml-1">{t.translationNotice}</p>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="..." className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-medium text-sm h-32 resize-none focus:ring-2 ring-indigo-50" />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
              {t.skillDisclaimer}
            </p>
          </div>
        </div>

        <button type="submit" className="w-full py-5 rounded-[28px] font-black bg-indigo-400 text-white shadow-2xl shadow-indigo-100 uppercase tracking-[0.2em] text-[13px] active:scale-95 transition-all">{t.submitSkill}</button>
      </form>
    </div>
  );
};
