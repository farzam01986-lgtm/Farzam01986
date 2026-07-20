import React from 'react';

interface InactivityModalProps {
  showInactivityPopup: boolean;
  setShowInactivityPopup: (show: boolean) => void;
  setLastActivity: (time: number) => void;
  currentInactivityQuote: string;
  settings: any;
  handleStartCall: () => void;
}

export const InactivityModal: React.FC<InactivityModalProps> = ({
  showInactivityPopup,
  setShowInactivityPopup,
  setLastActivity,
  currentInactivityQuote,
  settings,
  handleStartCall,
}) => {
  if (!showInactivityPopup) return null;

  return (
    <div id="inactivity-overlay" className="absolute inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div id="inactivity-container" className="bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] text-white rounded-3xl p-6 w-full max-w-[320px] shadow-[0_0_50px_rgba(244,63,94,0.25)] border border-pink-500/20 text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <div className="absolute top-[-10px] left-[-10px] w-16 h-16 bg-pink-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute bottom-[-10px] right-[-10px] w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none"></div>

        <button 
          id="btn-close-inactivity"
          type="button"
          onClick={() => {
            setShowInactivityPopup(false);
            setLastActivity(Date.now());
          }}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <i className="fas fa-times text-lg"></i>
        </button>

        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-pink-500/30 relative">
          <img src={settings.aiProfilePic} className="w-full h-full object-cover" alt="AI" />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#1e293b] rounded-full animate-pulse"></div>
        </div>

        <h3 className="text-xl font-extrabold text-pink-400 mb-2 tracking-tight">
          {settings.aiName} دلتنگ شماست... 💕
        </h3>
        
        <p className="text-gray-200 text-sm mb-6 leading-relaxed px-2 font-medium italic">
          «{currentInactivityQuote}»
        </p>

        <div className="flex flex-col gap-2.5">
          <button 
            id="btn-inactivity-text-chat"
            type="button"
            onClick={() => {
              setShowInactivityPopup(false);
              setLastActivity(Date.now());
            }}
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold shadow-lg shadow-pink-600/20 transition-all active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fas fa-comment-alt"></i>
            <span>چت متنی با {settings.aiName} 💬</span>
          </button>

          <button 
            id="btn-inactivity-voice-call"
            type="button"
            onClick={() => {
              setShowInactivityPopup(false);
              setLastActivity(Date.now());
              handleStartCall();
            }}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fas fa-phone-alt"></i>
            <span>تماس صوتی عاشقانه 📞</span>
          </button>
        </div>
      </div>
    </div>
  );
};
