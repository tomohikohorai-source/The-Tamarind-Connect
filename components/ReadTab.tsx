
import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, query, orderBy, onSnapshot, addDoc, getDocs, where, limit, doc, getDoc, setDoc, updateDoc, deleteDoc } from '../firebase';
import { ReadContent, ReadSeriesState, UserProfile } from '../types';
import { translations } from '../translations';
import { Book, Lightbulb, ChevronRight, Lock, Clock, History, Sparkles, BookOpen } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface ReadTabProps {
  profile: UserProfile | null;
  language: 'en' | 'zh' | 'ko' | 'ja';
  onShowAuth: () => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const ReadTab: React.FC<ReadTabProps> = ({ profile, language, onShowAuth }) => {
  const t = translations[language];
  const [contents, setContents] = useState<ReadContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const isGeneratingRef = React.useRef(false);
  const [selectedItem, setSelectedItem] = useState<ReadContent | null>(null);

  // Cleanup duplicates and extras (to return to 1 each as requested)
  useEffect(() => {
    const cleanup = async () => {
      if (contents.length === 0) return;
      
      const novels = contents.filter(c => c.type === 'NOVEL').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const columns = contents.filter(c => c.type === 'COLUMN').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      
      const toDelete: string[] = [];
      
      // If we have more than 1 of each, it means we have extras from the previous seeding
      // We trim it down to 1 each to "reset" as requested.
      // This logic will only trigger if there are more than 1, 
      // and since we only generate 1 per day from now on, it won't interfere with the daily archive
      // unless we somehow get multiple items on the same day again.
      if (novels.length > 1) {
        novels.slice(1).forEach(item => toDelete.push(item.id));
      }
      if (columns.length > 1) {
        columns.slice(1).forEach(item => toDelete.push(item.id));
      }

      if (toDelete.length > 0) {
        console.log(`Trimming ${toDelete.length} extra items to return to 1 each...`);
        for (const id of toDelete) {
          try {
            await deleteDoc(doc(db, "readContent", id));
          } catch (e) {
            console.error("Failed to delete extra content:", e);
          }
        }
      }
    };

    cleanup();
  }, [contents]);

  useEffect(() => {
    const q = query(collection(db, "readContent"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: ReadContent[] = [];
      snapshot.forEach((doc) => data.push({ ...doc.data(), id: doc.id } as ReadContent));
      setContents(data);
      setLoading(false);
      
      // Check if we need to seed or generate today's content
      checkAndGenerate(data);
    });
    return () => unsub();
  }, []);

  const checkAndGenerate = async (existingContents: ReadContent[]) => {
    if (isGeneratingRef.current) return;

    const novels = existingContents.filter(c => c.type === 'NOVEL');
    const columns = existingContents.filter(c => c.type === 'COLUMN');

    // Seeding: Ensure at least 1 novel and 1 column
    if (novels.length < 1 || columns.length < 1) {
      isGeneratingRef.current = true;
      setGenerating(true);
      try {
        await seedMissingContent(novels.length, columns.length);
      } catch (error) {
        console.error("Failed to seed missing content:", error);
      } finally {
        setGenerating(false);
        isGeneratingRef.current = false;
      }
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const hasToday = existingContents.some(c => c.createdAt.startsWith(today));
    
    if (!hasToday) {
      isGeneratingRef.current = true;
      setGenerating(true);
      try {
        await generateDailyContent(today);
      } catch (error) {
        console.error("Failed to generate daily content:", error);
      } finally {
        setGenerating(false);
        isGeneratingRef.current = false;
      }
    }
  };

  const seedMissingContent = async (currentNovels: number, currentColumns: number) => {
    console.log(`Seeding missing content: ${1 - currentNovels} novels, ${1 - currentColumns} columns`);
    
    const stateDoc = await getDoc(doc(db, "readSeriesState", "current_novel"));
    let state: ReadSeriesState;
    
    if (!stateDoc.exists()) {
      state = {
        id: "current_novel",
        currentSeriesId: `series_${Date.now()}`,
        currentChapter: 1,
        lastGeneratedDate: "",
        characters: "A young expat named Sarah who just moved to Penang, and her mysterious neighbor Mr. Tan who knows all the local secrets.",
        plotPoints: "Sarah finds an old map in her apartment that leads to hidden gems in Penang.",
        title: "The Penang Map Mystery"
      };
    } else {
      state = stateDoc.data() as ReadSeriesState;
    }

    // Seed Novels
    for (let i = currentNovels; i < 1; i++) {
      const novelPrompt = `
        Write Chapter ${state.currentChapter} of a 15-chapter novel titled "${state.title}".
        Setting: Penang, Malaysia.
        Characters: ${state.characters}
        Current Plot: ${state.plotPoints}
        Requirements: About 500 words, English, Engaging tone. Use Markdown for formatting (paragraphs, bold text for emphasis).
      `;
      const novelRes = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: novelPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              snippet: { type: Type.STRING }
            },
            required: ["title", "content", "snippet"]
          }
        }
      });
      const novelData = JSON.parse(novelRes.text || '{}');

      const date = new Date();
      
      await addDoc(collection(db, "readContent"), {
        ...novelData,
        type: 'NOVEL',
        chapterNumber: state.currentChapter,
        seriesId: state.currentSeriesId,
        createdAt: date.toISOString()
      });

      state.currentChapter++;
      const updatePrompt = `Based on: "${novelData.content}", summarize updated plot for next chapter. Under 100 words.`;
      const updateRes = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: updatePrompt
      });
      state.plotPoints = updateRes.text || '';
    }

      // Seed Columns
    for (let i = currentColumns; i < 1; i++) {
      const columnPrompt = `
        Write a short educational column about Penang, Malaysia.
        Topic: Interesting trivia, history, or local food.
        Requirements: About 200 words, English, Friendly tone. Use Markdown for formatting (paragraphs, bold text for emphasis).
      `;
      const columnRes = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: columnPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              snippet: { type: Type.STRING }
            },
            required: ["title", "content", "snippet"]
          }
        }
      });
      const columnData = JSON.parse(columnRes.text || '{}');

      const date = new Date();

      await addDoc(collection(db, "readContent"), {
        ...columnData,
        type: 'COLUMN',
        createdAt: date.toISOString()
      });
    }

    state.lastGeneratedDate = format(new Date(), 'yyyy-MM-dd');
    await setDoc(doc(db, "readSeriesState", "current_novel"), state);
  };

  const generateDailyContent = async (today: string) => {
    // 1. Get Series State
    const stateDoc = await getDoc(doc(db, "readSeriesState", "current_novel"));
    let state: ReadSeriesState;
    
    if (!stateDoc.exists()) {
      state = {
        id: "current_novel",
        currentSeriesId: `series_${Date.now()}`,
        currentChapter: 1,
        lastGeneratedDate: "",
        characters: "A young expat named Sarah who just moved to Penang, and her mysterious neighbor Mr. Tan who knows all the local secrets.",
        plotPoints: "Sarah finds an old map in her apartment that leads to hidden gems in Penang.",
        title: "The Penang Map Mystery"
      };
      await setDoc(doc(db, "readSeriesState", "current_novel"), state);
    } else {
      state = stateDoc.data() as ReadSeriesState;
    }

    // Don't generate if already generated today (double check)
    if (state.lastGeneratedDate === today) return;

    // 2. Generate Novel Chapter
    const novelPrompt = `
      Write Chapter ${state.currentChapter} of a 15-chapter novel titled "${state.title}".
      Setting: Penang, Malaysia.
      Characters: ${state.characters}
      Current Plot: ${state.plotPoints}
      
      Requirements:
      - Length: About 500 words.
      - Language: English.
      - Tone: Engaging and slightly mysterious.
      - Format: Use Markdown (paragraphs, bold text for emphasis).
      - If this is chapter 15, make sure to conclude the story.
    `;

    const novelResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: novelPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            snippet: { type: Type.STRING }
          },
          required: ["title", "content", "snippet"]
        }
      }
    });

    const novelData = JSON.parse(novelResponse.text || '{}');

    // 3. Generate Column
    const columnPrompt = `
      Write a short educational column about Penang, Malaysia.
      Topic: Interesting trivia, history, or local food.
      Requirements:
      - Length: About 200 words.
      - Language: English.
      - Tone: Informative and friendly.
      - Format: Use Markdown (paragraphs, bold text for emphasis).
    `;

    const columnResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: columnPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            snippet: { type: Type.STRING }
          },
          required: ["title", "content", "snippet"]
        }
      }
    });

    const columnData = JSON.parse(columnResponse.text || '{}');

    // 4. Save to Firestore
    const batch = [];
    batch.push(addDoc(collection(db, "readContent"), {
      ...novelData,
      type: 'NOVEL',
      chapterNumber: state.currentChapter,
      seriesId: state.currentSeriesId,
      createdAt: new Date().toISOString()
    }));

    batch.push(addDoc(collection(db, "readContent"), {
      ...columnData,
      type: 'COLUMN',
      createdAt: new Date().toISOString()
    }));

    await Promise.all(batch);

    // 5. Update Series State
    let nextChapter = state.currentChapter + 1;
    let nextSeriesId = state.currentSeriesId;
    let nextTitle = state.title;
    let nextCharacters = state.characters;
    let nextPlot = state.plotPoints;

    if (state.currentChapter >= 15) {
      // Start new series
      nextChapter = 1;
      nextSeriesId = `series_${Date.now()}`;
      
      // Generate new series concept
      const conceptResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a new 15-chapter novel concept set in Penang. Return JSON with 'title', 'characters' (short description), and 'plotPoints' (starting point).",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              characters: { type: Type.STRING },
              plotPoints: { type: Type.STRING }
            },
            required: ["title", "characters", "plotPoints"]
          }
        }
      });
      const concept = JSON.parse(conceptResponse.text || '{}');
      nextTitle = concept.title;
      nextCharacters = concept.characters;
      nextPlot = concept.plotPoints;
    } else {
      // Update plot points for next chapter
      const updatePrompt = `Based on the chapter just written: "${novelData.content}", summarize the updated plot points and character status for the next chapter. Keep it under 200 words.`;
      const updateResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: updatePrompt
      });
      nextPlot = updateResponse.text || '';
    }

    await updateDoc(doc(db, "readSeriesState", "current_novel"), {
      currentChapter: nextChapter,
      currentSeriesId: nextSeriesId,
      lastGeneratedDate: today,
      title: nextTitle,
      characters: nextCharacters,
      plotPoints: nextPlot
    });
  };

  const novels = useMemo(() => contents.filter(c => c.type === 'NOVEL'), [contents]);
  const columns = useMemo(() => contents.filter(c => c.type === 'COLUMN'), [contents]);

  if (selectedItem) {
    return (
      <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-gray-100">
          <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="rotate-180 text-gray-400" size={24} />
          </button>
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight truncate">{selectedItem.title}</h2>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-6 pb-24">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedItem.type === 'NOVEL' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'}`}>
              {selectedItem.type === 'NOVEL' ? t.dailyNovel : t.penangColumn}
            </span>
            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
              <Clock size={10} />
              {format(new Date(selectedItem.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>

          <h1 className="text-2xl font-black text-gray-900 leading-tight">{selectedItem.title}</h1>

          <div className="prose prose-sm max-w-none prose-indigo">
            {profile ? (
              <div className="text-gray-700 leading-relaxed font-medium">
                <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-gray-700 leading-relaxed font-medium">
                  <ReactMarkdown>{selectedItem.snippet + "..."}</ReactMarkdown>
                </div>
                <div className="bg-gradient-to-b from-transparent to-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-500">
                    <Lock size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">{t.loginToRead}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.authAnnouncement}</p>
                  </div>
                  <button 
                    onClick={onShowAuth}
                    className="px-8 py-3 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                  >
                    {t.loginPrompt}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7]">
      <div className="p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-500">
            <Sparkles size={16} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.read}</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            Daily Stories<br/>& Insights
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            Fresh content every day, powered by community spirit.
          </p>
        </div>

        {generating && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
              <BookOpen size={20} className="animate-bounce" />
            </div>
            <div className="flex-grow">
              <div className="h-2 w-24 bg-indigo-200 rounded-full mb-2"></div>
              <div className="h-2 w-48 bg-indigo-100 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-10 pb-24">
          {/* Today's Picks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} />
                Latest Updates
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {contents.slice(0, 2).map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4 group active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${item.type === 'NOVEL' ? 'bg-indigo-50 text-indigo-500' : 'bg-teal-50 text-teal-500'}`}>
                      {item.type === 'NOVEL' ? t.dailyNovel : t.penangColumn}
                    </span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 font-medium">
                      {item.snippet}...
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Archive */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <History size={14} />
              {t.archive}
            </h3>
            <div className="space-y-3">
              {contents.slice(2).map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-50 hover:border-indigo-100 transition-all group active:scale-[0.99]"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'NOVEL' ? 'bg-indigo-50 text-indigo-400' : 'bg-teal-50 text-teal-400'}`}>
                    {item.type === 'NOVEL' ? <Book size={18} /> : <Lightbulb size={18} />}
                  </div>
                  <div className="flex-grow min-w-0 text-left">
                    <h4 className="text-xs font-black text-gray-700 truncate uppercase tracking-tight">{item.title}</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      {format(new Date(item.createdAt), 'MMM dd')} • {item.type === 'NOVEL' ? `Chapter ${item.chapterNumber}` : 'Local Insight'}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-200 group-hover:text-indigo-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
