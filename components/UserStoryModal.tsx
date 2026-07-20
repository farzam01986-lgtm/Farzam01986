import React, { useState, useRef } from 'react';
import { translations } from '../src/translations';
import { deleteFirestoreStory } from '../firebaseService';

interface UserStoryModalProps {
  activeLang: 'fa' | 'en' | 'ar' | 'es';
  settings: any;
  userStories: any[];
  setUserStories: React.Dispatch<React.SetStateAction<any[]>>;
  showCreateStoryModal: boolean;
  setShowCreateStoryModal: (show: boolean) => void;
  activeUserStoryViewer: any | null;
  setActiveUserStoryViewer: (story: any | null) => void;
  onPublishStory: (type: 'text' | 'image', content: string, caption: string) => void;
}

export const UserStoryModal: React.FC<UserStoryModalProps> = ({
  activeLang,
  settings,
  userStories,
  setUserStories,
  showCreateStoryModal,
  setShowCreateStoryModal,
  activeUserStoryViewer,
  setActiveUserStoryViewer,
  onPublishStory,
}) => {
  const t = translations[activeLang] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  // State for Create Story
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const [storyContent, setStoryContent] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  // State for Story Viewer
  const [confirmDeleteStoryId, setConfirmDeleteStoryId] = useState<string | null>(null);

  const handlePublish = () => {
    if (!storyContent.trim()) {
      alert(isRtl ? "لطفاً متن یا عکس استوری را انتخاب کنید." : "Please choose text or an image for your story.");
      return;
    }
    onPublishStory(storyType, storyContent, storyCaption);
    // Reset
    setStoryContent('');
    setStoryCaption('');
  };

  return (
    <>
      {/* Create Story Modal */}
      {showCreateStoryModal && (
        <div id="create-story-overlay" className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" dir={isRtl ? "rtl" : "ltr"}>
          <div id="create-story-container" className="bg-white rounded-3xl p-6 w-full max-w-[340px] shadow-2xl scale-in-center flex flex-col border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-black text-gray-900">{t.newStoryTitle}</h3>
              <button 
                type="button"
                onClick={() => {
                  setShowCreateStoryModal(false);
                  setStoryContent('');
                  setStoryCaption('');
                }}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4 select-none">
              <button
                type="button"
                onClick={() => { setStoryType('text'); setStoryContent(''); }}
                className={`flex-1 py-2 rounded-lg text-[11px] font-black transition-all ${
                  storyType === 'text' ? 'bg-white text-[#517da2] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.textStoryBtn}
              </button>
              <button
                type="button"
                onClick={() => { setStoryType('image'); setStoryContent(''); }}
                className={`flex-1 py-2 rounded-lg text-[11px] font-black transition-all ${
                  storyType === 'image' ? 'bg-white text-[#517da2] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.imageStoryBtn}
              </button>
            </div>

            {storyType === 'text' ? (
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[10px] font-black text-gray-400">{t.storyTextLabel}</label>
                <textarea
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  placeholder={t.storyTextPlaceholder}
                  className={`w-full h-24 p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-blue-400 font-bold placeholder-gray-400 resize-none ${isRtl ? 'text-right' : 'text-left'}`}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4 mb-4">
                <div 
                  onClick={() => storyFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer bg-slate-50/50"
                >
                  <input 
                    type="file" 
                    ref={storyFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setStoryContent(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  {storyContent ? (
                    <img src={storyContent} alt="پیش‌نمایش" className="w-full h-32 object-cover rounded-xl shadow-inner" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                        <i className="fas fa-cloud-upload-alt text-base"></i>
                      </div>
                      <span className="text-[11px] font-black text-gray-700">{t.selectStoryImage}</span>
                      <span className="text-[9px] text-gray-400 font-bold">{t.allowedFormats}</span>
                    </>
                  )}
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400">{t.storyCaptionLabel}</label>
                  <input
                    type="text"
                    value={storyCaption}
                    onChange={(e) => setStoryCaption(e.target.value)}
                    placeholder={t.storyCaptionPlaceholder}
                    className={`w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:border-blue-400 font-bold placeholder-gray-400 ${isRtl ? 'text-right' : 'text-left'}`}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handlePublish}
              disabled={!storyContent}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all active:scale-95 text-xs shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {t.publishStoryBtn}
            </button>
          </div>
        </div>
      )}

      {/* User Own Story Viewer */}
      {activeUserStoryViewer !== null && (
        <div id="user-story-viewer-overlay" className="absolute inset-0 z-[110] bg-black/95 flex flex-col text-white" dir={isRtl ? "rtl" : "ltr"}>
          <div className="flex items-center justify-between p-4 border-b border-white/10 select-none shrink-0">
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-black text-white text-xs">
                {activeLang === 'fa' ? 'من' : 'Me'}
              </div>
              <div className={`flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="text-xs font-black">{t.myStoryLabel}</span>
                <span className="text-[9px] text-gray-400 font-bold">{t.justNow}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {confirmDeleteStoryId === activeUserStoryViewer.id ? (
                <button 
                  type="button"
                  onClick={async () => {
                    const storyId = activeUserStoryViewer.id;
                    try {
                      await deleteFirestoreStory(storyId);
                    } catch (e) {
                      console.error("Failed to delete from firestore:", e);
                    }
                    const updated = userStories.filter(s => s.id !== storyId);
                    setUserStories(updated);
                    localStorage.setItem('user_stories', JSON.stringify(updated));
                    setActiveUserStoryViewer(null);
                    setConfirmDeleteStoryId(null);
                  }}
                  className="px-2.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-black flex items-center justify-center transition-all cursor-pointer animate-pulse mr-2"
                  title={t.confirmDeleteStory}
                >
                  {t.confirmDeleteYes}
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    setConfirmDeleteStoryId(activeUserStoryViewer.id);
                    setTimeout(() => setConfirmDeleteStoryId(current => current === activeUserStoryViewer.id ? null : current), 4000);
                  }}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors cursor-pointer mr-2"
                  title={t.deleteStoryBtn}
                >
                  <i className="far fa-trash-alt text-xs"></i>
                </button>
              )}
              <button 
                type="button"
                onClick={() => {
                  setActiveUserStoryViewer(null);
                  setConfirmDeleteStoryId(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-gray-900 to-black">
            {activeUserStoryViewer.type === 'image' ? (
              <div className="relative max-w-full max-h-full">
                <img src={activeUserStoryViewer.content} alt="Story" className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl" />
                {activeUserStoryViewer.caption && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm p-3 rounded-xl text-center text-xs font-bold leading-relaxed border border-white/5">
                    {activeUserStoryViewer.caption}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 bg-gradient-to-tr from-[#3a5d7c] to-[#517da2] rounded-3xl w-full max-w-[280px] shadow-2xl text-center text-sm font-black leading-relaxed border border-white/10">
                {activeUserStoryViewer.content}
              </div>
            )}
          </div>

          {/* Likes & Comments lists (Telegram / Instagram style) */}
          <div className="bg-slate-900/90 border-t border-white/10 p-4 rounded-t-3xl max-h-[30vh] overflow-y-auto shrink-0 select-none">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
              <i className="fas fa-heart text-red-500 text-xs"></i>
              <span className="text-[10px] font-black text-gray-300">
                {activeLang === 'fa' 
                  ? `ری‌اکشن‌ها و نظرات مخاطبین (${activeUserStoryViewer.comments?.length || 0})` 
                  : `User reactions and comments (${activeUserStoryViewer.comments?.length || 0})`}
              </span>
            </div>

            {(!activeUserStoryViewer.comments || activeUserStoryViewer.comments.length === 0) ? (
              <p className="text-[10px] text-gray-500 font-bold text-center py-4">
                {activeLang === 'fa' 
                  ? 'هنوز بازخوردی ثبت نشده، چند لحظه دیگر دوباره بررسی کنید... 💫' 
                  : 'No feedback yet, check back in a few moments... 💫'}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {activeUserStoryViewer.comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-2.5 items-start bg-white/5 p-2 rounded-xl border border-white/5 animate-in slide-in-from-bottom-2 duration-200">
                    <img src={comment.avatar} alt={comment.characterName} className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-400">{comment.characterName || comment.userName}</span>
                        <span className="text-[8px] text-gray-500 font-mono">{t.justNow}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-200 mt-1 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
