
import React, { useState } from 'react';
import { UserProfile, Skill } from '../types';
import { SKILL_CATEGORIES, SKILL_ICONS } from '../constants';
import { ChevronLeft, X, BookOpen, MessageSquare, ShieldAlert, Award, CreditCard, Layers } from 'lucide-react';

interface Props {
  profile: UserProfile;
  initialSkill?: Skill;
  onSubmit: (skill: Skill) => void;
  onCancel: () => void;
}

export const SkillForm: React.FC<Props> = ({ profile, initialSkill, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialSkill?.title || '');
  const [category, setCategory] = useState(initialSkill?.category || SKILL_CATEGORIES[0]);
  const [description, setDescription] = useState(initialSkill?.description || '');
  const [type, setType] = useState<'OFFER' | 'REQUEST'>(initialSkill?.type || 'OFFER');
  const [price, setPrice] = useState(initialSkill?.price || 'Free');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const skill: Skill = {
      id: initialSkill?.id || crypto.randomUUID(),
      userId: profile.uid,
      parentNickname: profile.parentNickname,
      parentAvatarIcon: profile.avatarIcon,
      roomNumber: profile.roomNumber,
      title,
      category,
      description,
      type,
      price,
      comments: initialSkill?.comments || [],
      createdAt: initialSkill?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    onSubmit(skill);
  };

  return (
    <div className="bg-white p-8 rounded-t-[40px] shadow-2xl overflow-y-auto max-h-[95vh] border-t border-indigo-50 hide-scrollbar relative">
      <div className="flex justify-between items-center mb-10">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-gray-500 font-black text-xs bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 uppercase tracking-widest shadow-sm active:scale-95 transition-all"><ChevronLeft size={18} /> Back</button>
        <h2 className="text-xl font-black text-gray-800 tracking-tighter uppercase">{initialSkill ? 'Update Skill' : 'Share Skill'}</h2>
        <button onClick={onCancel} className="text-gray-300"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        <div className="flex gap-3">
          {[
            { id: 'OFFER', label: 'I can help! 🙋‍♂️' },
            { id: 'REQUEST', label: 'I need help 🎒' }
          ].map(t => (
            <button key={t.id} type="button" onClick={() => setType(t.id as any)} className={`flex-1 py-4 rounded-2xl font-black transition-all text-[11px] uppercase tracking-widest ${type === t.id ? 'bg-indigo-400 text-white shadow-xl scale-[1.02]' : 'bg-gray-50 text-gray-400'}`}>{t.label}</button>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">Heading</label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Piano Lesson / Math Help" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-indigo-50" required />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">Category</label>
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
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">Reward / Price</label>
            <div className="relative">
              <Award className="absolute left-4 top-3.5 text-indigo-200" size={18} />
              <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. Free / RM 30 / Coffee" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 ring-indigo-50" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase tracking-widest ml-1">About the Skill</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell neighbors more about it..." className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-medium text-sm h-32 resize-none focus:ring-2 ring-indigo-50" />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
              Please use discretion when teaching or receiving lessons from neighbors. Safety first!
            </p>
          </div>
        </div>

        <button type="submit" className="w-full py-5 rounded-[28px] font-black bg-indigo-400 text-white shadow-2xl shadow-indigo-100 uppercase tracking-[0.2em] text-[13px] active:scale-95 transition-all">Submit Skill Post</button>
      </form>
    </div>
  );
};
