
import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';

interface ChatAreaProps {
  messages: Message[];
  aiProfilePic: string;
  onPlayAudio?: (msg: Message) => void;
  onDeleteMessage?: (msgId: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, aiProfilePic, onPlayAudio, onDeleteMessage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const formatPersianDate = (date: Date) => {
    const weekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' }).format(date);
    const year = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: '2-digit' }).format(date);
    const day = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: '2-digit' }).format(date);
    return `${weekday} ${year}/${month}/${day}`;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setActiveMenuId(null);
    });
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ text: text, title: 'پیام از چت سارا' });
      } catch (err) { console.error(err); }
    }
    setActiveMenuId(null);
  };

  const toggleMenu = (id: string) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center z-10 relative">
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl max-w-xs border border-white/20 shadow-xl">
          <p className="text-gray-800 font-medium mb-4">هنوز پیامی در اینجا وجود ندارد...</p>
          <p className="text-gray-700 text-sm mb-6">پیامی ارسال کنید تا چت با سارا شروع بشه 🔥</p>
          <div className="w-32 h-32 mx-auto animate-bounce overflow-hidden rounded-full border-2 border-white/50 shadow-lg">
             <img src={aiProfilePic} alt="Welcome" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto p-4 flex flex-col gap-2 z-10 relative"
      onClick={() => setActiveMenuId(null)}
    >
      {messages.map((msg, index) => {
        const showDateSeparator = index === 0 || !isSameDay(messages[index - 1].timestamp, msg.timestamp);
        
        return (
          <React.Fragment key={msg.id}>
            {showDateSeparator && (
              <div className="self-center my-4 bg-gray-800/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] text-white font-bold shadow-lg border border-white/20 tracking-tight">
                {formatPersianDate(msg.timestamp)}
              </div>
            )}
            <div 
              className={`max-w-[85%] flex flex-col ${msg.sender === 'user' ? 'self-end' : 'self-start'} message-appear relative`}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                onClick={() => toggleMenu(msg.id)}
                className={`
                  relative p-2 rounded-2xl shadow-sm text-sm break-words cursor-pointer transition-transform active:scale-[0.98]
                  ${msg.sender === 'user' 
                    ? 'bg-[#effdde] text-gray-800 rounded-tr-none ml-8' 
                    : 'bg-white text-gray-800 rounded-tl-none mr-8'}
                `}
              >
                {msg.image && (
                  <div className="mb-2 overflow-hidden rounded-lg">
                    <img src={msg.image} alt="Sent content" className="max-w-full h-auto object-cover max-h-64" />
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  {msg.text && <div className="px-1 leading-relaxed whitespace-pre-wrap flex-1">{msg.text}</div>}
                  {msg.audioBase64 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPlayAudio?.(msg); }}
                      className={`mt-1 p-1 transition-colors ${msg.sender === 'user' ? 'text-green-600 hover:text-green-800' : 'text-blue-400 hover:text-blue-600'}`}
                    >
                      <i className="fas fa-play-circle text-lg"></i>
                    </button>
                  )}
                </div>
                
                <div className="flex justify-end mt-1 px-1 gap-1">
                  <span className="text-[10px] opacity-60">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'user' && <i className="fas fa-check-double text-[10px] text-blue-500"></i>}
                </div>
                
                <div className={`absolute top-0 w-3 h-3 ${msg.sender === 'user' ? 'right-[-8px] bg-[#effdde]' : 'left-[-8px] bg-white'}`} 
                     style={{ clipPath: msg.sender === 'user' ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 100% 100%, 0 0)' }}>
                </div>
              </div>

              {activeMenuId === msg.id && (
                <div className={`absolute z-30 top-[-40px] ${msg.sender === 'user' ? 'right-0' : 'left-0'} flex bg-white/90 backdrop-blur-md border border-gray-100 shadow-xl rounded-full px-2 py-1 gap-4 animate-in fade-in zoom-in-95 duration-150`}>
                  <button 
                    onClick={() => handleCopy(msg.text)}
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 px-2 py-1 transition-colors"
                  >
                    <i className="far fa-copy"></i>
                    <span className="text-xs font-bold">کپی</span>
                  </button>
                  <div className="w-[1px] h-4 bg-gray-200 self-center"></div>
                  <button 
                    onClick={() => handleShare(msg.text)}
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 px-2 py-1 transition-colors"
                  >
                    <i className="fas fa-share-alt"></i>
                    <span className="text-xs font-bold">اشتراک</span>
                  </button>
                  <div className="w-[1px] h-4 bg-gray-200 self-center"></div>
                  <button 
                    onClick={() => { onDeleteMessage?.(msg.id); setActiveMenuId(null); }}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 px-2 py-1 transition-colors"
                  >
                    <i className="far fa-trash-alt"></i>
                    <span className="text-xs font-bold">حذف</span>
                  </button>
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
      <div className="h-4 shrink-0"></div>
    </div>
  );
};

export default ChatArea;
