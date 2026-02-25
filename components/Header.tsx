
import React from 'react';

interface HeaderProps {
  name: string;
  profilePic: string;
  isTyping: boolean;
  onOpenSettings: () => void;
  onStartCall: () => void;
  onClearHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ name, profilePic, isTyping, onOpenSettings, onStartCall, onClearHistory }) => {
  return (
    <div className="bg-[#517da2] text-white p-3 flex items-center justify-between shadow-md z-10 select-none">
      <div className="flex items-center gap-3">
        <button className="text-xl px-2 hover:bg-black/10 rounded-full transition-colors">
          <i className="fas fa-arrow-right"></i>
        </button>
        <div 
          className="w-10 h-10 rounded-full bg-gray-300 border border-white/20 cursor-pointer overflow-hidden ring-1 ring-white/10"
          onClick={onOpenSettings}
        >
          <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col cursor-pointer" onClick={onOpenSettings}>
          <span className="font-bold text-[17px] leading-tight flex items-center gap-1">
            {name} 
            <i className="fas fa-volume-mute text-[10px] opacity-50"></i>
          </span>
          <span className="text-[13px] font-light">
            {isTyping ? (
              <span className="text-[#89b3d7] font-medium italic flex items-center gap-1">
                در حال تایپ
                <span className="flex gap-0.5 mt-1">
                  <span className="w-1 h-1 bg-[#89b3d7] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 bg-[#89b3d7] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-1 bg-[#89b3d7] rounded-full animate-bounce"></span>
                </span>
              </span>
            ) : (
              <span className="opacity-80">آنلاین</span>
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xl">
        <button 
          onClick={onStartCall}
          className="p-2 opacity-90 hover:opacity-100 hover:bg-black/10 rounded-full transition-all"
          title="تماس صوتی"
        >
          <i className="fas fa-phone-alt text-lg"></i>
        </button>
        <button 
          onClick={onClearHistory}
          className="p-2 opacity-90 hover:opacity-100 hover:bg-black/10 rounded-full transition-all"
          title="پاک کردن تاریخچه"
        >
          <i className="fas fa-trash text-lg"></i>
        </button>
        <button 
          onClick={onOpenSettings}
          className="p-2 opacity-90 hover:opacity-100 hover:bg-black/10 rounded-full transition-all"
          title="تنظیمات"
        >
          <i className="fas fa-ellipsis-v text-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default Header;
