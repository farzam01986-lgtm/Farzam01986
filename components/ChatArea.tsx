import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';
import { Translate } from './Translate';

interface ChatAreaProps {
  messages: Message[];
  userProfilePic?: string;
  aiProfilePic: string;
  aiName: string;
  ttsEnabled: boolean;
  currentlyPlayingMsgId?: string | null;
  generatingAudioMsgIds?: string[];
  onPlayAudio?: (msg: Message) => void;
  onRetryAudio?: (msg: Message) => void;
  onDeleteMessage?: (msgId: string) => void;
  onStartChat?: () => void;
  onStartCall?: () => void;
  
  // Advanced Telegram features
  isGroup?: boolean;
  onReactMessage?: (msgId: string, emoji: string) => void;
  onReplyMessage?: (msg: Message) => void;
  onEditMessage?: (msg: Message) => void;
  onPinMessage?: (msg: Message) => void;
  onForwardMessage?: (msg: Message) => void;
  pinnedMsgId?: string | null;
  searchQuery?: string;
  onAvatarClick?: (senderName: string) => void;
  chatFontSize?: string;
  activeLang?: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  userProfilePic,
  aiProfilePic, 
  aiName, 
  ttsEnabled, 
  currentlyPlayingMsgId, 
  generatingAudioMsgIds = [], 
  onPlayAudio, 
  onRetryAudio, 
  onDeleteMessage, 
  onStartChat, 
  onStartCall,
  
  isGroup,
  onReactMessage,
  onReplyMessage,
  onEditMessage,
  onPinMessage,
  onForwardMessage,
  pinnedMsgId,
  searchQuery = "",
  onAvatarClick,
  chatFontSize,
  activeLang = 'fa'
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showReactionPickerId, setShowReactionPickerId] = useState<string | null>(null);

  const formatPersianDate = (date: Date) => {
    const d = new Date(date);
    const weekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' }).format(d);
    const year = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(d);
    const month = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: '2-digit' }).format(d);
    const day = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: '2-digit' }).format(d);
    return `${weekday} ${year}/${month}/${day}`;
  };

  const isSameDay = (d1: any, d2: any) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
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

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
    setShowReactionPickerId(null);
  };

  // Double click for rapid Heart reaction!
  const handleDoubleClick = (msgId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onReactMessage) {
      onReactMessage(msgId, '❤️');
    }
  };

  // Highlight matched keyword when searching
  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase()
            ? <mark key={i} className="bg-yellow-300 text-gray-900 rounded-sm px-0.5 font-bold">{part}</mark>
            : part
        )}
      </span>
    );
  };

  const stripEmotions = (text: string): string => {
    if (!text) return text;
    let cleaned = text
      .replace(/\*[^*]+\*/g, '')
      .replace(/\([^)]+\)/g, '');
    cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();
    return cleaned || text;
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter(m => {
    if (!searchQuery.trim()) return true;
    return m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [aiName]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop < 100 && visibleCount < filteredMessages.length) {
      const prevScrollHeight = target.scrollHeight;
      const prevScrollTop = target.scrollTop;
      
      setVisibleCount(prev => Math.min(prev + 50, filteredMessages.length));
      
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const newScrollHeight = scrollRef.current.scrollHeight;
          scrollRef.current.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
        }
      });
    }
  };

  const visibleMessages = filteredMessages.slice(-visibleCount);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-blue-100/50');
      setTimeout(() => el.classList.remove('bg-blue-100/50'), 1500);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center z-10 relative" dir="rtl">
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl max-w-xs border border-white/20 shadow-xl">
          <p className="text-gray-800 font-medium mb-4">هنوز پیامی در اینجا وجود ندارد...</p>
          <p className="text-gray-700 text-sm mb-6">پیامی ارسال کنید تا چت با {aiName} شروع بشه 🔥</p>
          <div 
            onClick={onStartChat}
            className="w-32 h-32 mx-auto animate-bounce overflow-hidden rounded-full border-2 border-white/50 shadow-lg cursor-pointer hover:scale-105 transition-transform active:scale-95"
          >
             <img src={aiProfilePic} alt="Welcome" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    );
  }

  const pinnedMessage = messages.find(m => m.id === pinnedMsgId);

  return (
    <div 
      className="h-full w-full relative overflow-hidden flex flex-col" 
      onClick={() => { setActiveMenuId(null); setShowReactionPickerId(null); }}
    >
      {pinnedMessage && (
        <div 
          onClick={() => scrollToMessage(pinnedMessage.id)}
          className="sticky top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-2 flex items-center justify-between gap-3 shadow-sm cursor-pointer hover:bg-gray-50/90 transition-colors select-none shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1 h-8 bg-[#517da2] rounded-full shrink-0"></div>
            <div className="flex flex-col text-right min-w-0">
              <span className="text-[10px] font-black text-[#517da2]">پیام سنجاق شده</span>
              <span className="text-xs text-gray-500 truncate max-w-[280px]">
                {stripEmotions(pinnedMessage.text) || "پیام رسانه‌ای"}
              </span>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onPinMessage) onPinMessage(pinnedMessage);
            }}
            className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            title="حذف سنجاق"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      )}

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 z-10 scrollbar-thin"
        dir="rtl"
      >

      {visibleMessages.map((msg, index) => {
        const showDateSeparator = index === 0 || !isSameDay(visibleMessages[index - 1]?.timestamp, msg.timestamp);
        const isPinned = pinnedMsgId === msg.id;

        return (
          <React.Fragment key={msg.id}>
            {showDateSeparator && (
              <div className="self-center my-3 bg-gray-800/80 backdrop-blur-md px-4 py-1 rounded-full text-[10px] text-white font-bold shadow-md border border-white/10 tracking-tight">
                {formatPersianDate(msg.timestamp)}
              </div>
            )}
            
            <div 
              id={`msg-${msg.id}`}
              onDoubleClick={(e) => handleDoubleClick(msg.id, e)}
              className={`max-w-[94%] flex gap-2 items-end relative transition-all rounded-2xl ${
                msg.isCallLog || msg.sender === 'system'
                  ? 'self-center w-full max-w-[90%] mx-auto' 
                  : msg.sender === 'user' 
                  ? 'self-end flex-row-reverse' 
                  : 'self-start flex-row'
              } message-appear`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Group Chat Character or User Avatar */}
              {isGroup && !msg.isCallLog && msg.sender !== 'system' && (
                <div 
                  onClick={() => {
                    if (msg.sender !== 'user' && onAvatarClick) {
                      onAvatarClick(msg.senderName || aiName);
                    }
                  }}
                  className={`w-7 h-7 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-gray-100 shrink-0 select-none ${
                    msg.sender !== 'user' ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''
                  }`}
                  title={msg.sender !== 'user' ? 'مشاهده پروفایل و چت خصوصی' : 'شما'}
                >
                  <img 
                    src={msg.sender === 'user' ? (userProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100') : (msg.senderAvatar || aiProfilePic)} 
                    alt={msg.sender === 'user' ? 'شما' : (msg.senderName || aiName)} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                </div>
              )}

              {/* Main message bubble body */}
              <div 
                onClick={(e) => toggleMenu(msg.id, e)}
                style={{ fontSize: chatFontSize || '14px', lineHeight: '1.6' }}
                className={`
                  relative px-6 py-4 rounded-3xl break-words cursor-pointer transition-transform active:scale-[0.99] select-none flex flex-col max-w-[92vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl
                  ${msg.isCallLog
                    ? 'bg-slate-950/70 backdrop-blur-md text-white border border-white/10 text-center font-bold shadow-md w-full'
                    : msg.sender === 'system'
                    ? 'bg-slate-200/90 text-slate-700 text-center font-black text-[10px] py-1.5 px-4 rounded-full shadow-sm max-w-[85%] mx-auto'
                    : msg.sticker
                    ? 'bg-transparent text-gray-800 text-sm shadow-none !p-0 !min-w-[80px] !min-h-[80px] flex items-center justify-center'
                    : msg.sender === 'user' 
                    ? 'bg-[#effdde] text-gray-800 rounded-tr-none shadow-sm' 
                    : 'bg-white text-gray-800 rounded-tl-none shadow-sm'}
                  ${isPinned ? 'border border-blue-200 shadow-blue-100/50 shadow-md' : ''}
                `}
              >
                {/* Pin Icon Label */}
                {isPinned && (
                  <div className="flex items-center gap-1 text-[9px] text-blue-500 font-extrabold mb-1">
                    <i className="fas fa-thumbtack text-[8px]"></i>
                    <span>سنجاق شده</span>
                  </div>
                )}

                {/* Forwarded From Indicator */}
                {msg.forwardedFrom && (
                  <div className="flex items-center gap-1 text-[9px] text-blue-500 font-extrabold mb-1">
                    <i className="fas fa-share text-[8px]"></i>
                    <span>هدایت‌شده از {msg.forwardedFrom}</span>
                  </div>
                )}

                {/* Group Chat Character Sender Name */}
                {isGroup && msg.sender === 'ai' && !msg.isCallLog && (
                  <span className="text-[10px] text-blue-600 font-extrabold mb-1 self-start">
                    {msg.senderName || aiName}
                  </span>
                )}

                {/* Reply Quoted Preview */}
                {msg.replyTo && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.replyTo!.id); }}
                    className="mb-2 p-2 bg-slate-50 border-r-4 border-blue-500 rounded-lg text-[10px] text-right flex flex-col gap-0.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-extrabold text-blue-500">{msg.replyTo.senderName}</span>
                    <span className="text-gray-500 truncate max-w-[200px]">
                      <Translate text={stripEmotions(msg.replyTo.text)} targetLang={activeLang} />
                    </span>
                  </div>
                )}

                {msg.sticker && (
                  <div className="my-2 self-center select-none animate-bounce duration-[4000ms] flex items-center justify-center">
                    <span className="text-7xl drop-shadow-md select-none leading-none hover:scale-110 transition-transform active:scale-95 duration-200">{msg.sticker}</span>
                  </div>
                )}

                {msg.image && (
                  <div className="mb-2 overflow-hidden rounded-xl border border-gray-100">
                    <img src={msg.image} alt="Sent content" className="max-w-full h-auto object-cover max-h-64" loading="lazy" />
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  {msg.text && !msg.sticker ? (
                    <div className="px-0.5 leading-relaxed whitespace-pre-wrap flex-1">
                      <Translate text={stripEmotions(msg.text)} targetLang={activeLang} />
                      {msg.sender === 'ai' && !isGroup && (msg.text.includes("تماس صوتی") || msg.text.includes("صوتی صحبت") || msg.text.includes("تماس بگیریم")) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onStartCall?.(); }}
                          className="mt-3 w-full py-2 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all border border-green-400"
                        >
                          <i className="fas fa-phone animate-pulse text-[10px]"></i>
                          <span className="text-[11px]">تایید و شروع تماس صوتی 🎙️</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    !msg.image && !msg.audioBase64 && !msg.sticker && (
                      <div className="px-2 py-2 flex items-center gap-1.5 flex-1 select-none">
                        <span className="w-2 h-2 bg-pink-500 rounded-full custom-typing-dot"></span>
                        <span className="w-2 h-2 bg-pink-500 rounded-full custom-typing-dot"></span>
                        <span className="w-2 h-2 bg-pink-500 rounded-full custom-typing-dot"></span>
                      </div>
                    )
                  )}

                  {generatingAudioMsgIds.includes(msg.id) ? (
                    <button onClick={(e) => e.stopPropagation()} className="mt-1 p-1 cursor-wait" title="در حال تولید صدا...">
                      <i className="fas fa-spinner fa-spin text-base text-pink-500"></i>
                    </button>
                  ) : msg.audioBase64 ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPlayAudio?.(msg); }}
                      className={`mt-1 p-1 transition-colors ${msg.sender === 'user' ? 'text-green-600 hover:text-green-800' : 'text-blue-400 hover:text-blue-600'}`}
                      title={currentlyPlayingMsgId === msg.id ? "توقف پخش" : "پخش صدا"}
                    >
                      {currentlyPlayingMsgId === msg.id ? (
                        <i className="fas fa-stop-circle text-lg text-red-500 animate-pulse"></i>
                      ) : (
                        <i className="fas fa-play-circle text-lg"></i>
                      )}
                    </button>
                  ) : (
                    msg.sender === 'ai' && ttsEnabled && msg.text && !isGroup && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRetryAudio?.(msg); }}
                        className="mt-1 p-1 text-gray-300 hover:text-blue-400 transition-colors"
                        title={currentlyPlayingMsgId === msg.id ? "توقف پخش" : "پخش صوتی"}
                      >
                        {currentlyPlayingMsgId === msg.id ? (
                          <i className="fas fa-stop-circle text-lg text-red-500 animate-pulse"></i>
                        ) : (
                          <i className="fas fa-volume-up text-lg"></i>
                        )}
                      </button>
                    )
                  )}
                </div>
                
                {/* Message footer timestamp and status */}
                <div className="flex justify-end mt-1 px-1 gap-1 items-center select-none shrink-0">
                  {msg.isEdited && <span className="text-[9px] text-gray-400 font-bold ml-1">ویرایش‌شده</span>}
                  <span className="text-[9px] opacity-65 font-bold tracking-tight">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'user' && (
                    msg.seen ? (
                      <i className="fas fa-check-double text-[10px] text-blue-500" title="خوانده شده"></i>
                    ) : (
                      <i className="fas fa-check text-[10px] text-gray-400" title="ارسال شده"></i>
                    )
                  )}
                </div>

                {/* Reactions list at the bottom of the message bubble */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="absolute bottom-[-10px] right-2 flex gap-1 z-10 select-none">
                    {Array.from(new Set(msg.reactions)).map((emoji, idx) => {
                      const count = msg.reactions!.filter(r => r === emoji).length;
                      return (
                        <button
                          key={`${emoji}-${idx}`}
                          onClick={(e) => { e.stopPropagation(); if (onReactMessage) onReactMessage(msg.id, emoji); }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-100 text-[10px] font-black shadow-sm scale-95"
                        >
                          <span>{emoji}</span>
                          <span className="text-gray-500">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Traditional speech bubble tail */}
                {!msg.isCallLog && (
                  <div className={`absolute top-0 w-3 h-3 ${msg.sender === 'user' ? 'right-[-8px] bg-[#effdde]' : 'left-[-8px] bg-white'}`} 
                       style={{ clipPath: msg.sender === 'user' ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 100% 100%, 0 0)' }}>
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div className="h-4 shrink-0"></div>
    </div>

    {/* Advanced Interactive Telegram Action Menu - Constrained within ChatArea visible area */}
    {activeMenuId && messages.find(m => m.id === activeMenuId) && (() => {
      const activeMsg = messages.find(m => m.id === activeMenuId)!;
      const isMsgPinned = pinnedMsgId === activeMsg.id;
      return (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1.5px] cursor-default" 
            onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}
          ></div>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-gray-100 shadow-2xl rounded-3xl py-3 px-3 z-50 text-right w-64 max-w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200"
            dir="rtl"
          >
            {/* Message Preview header inside the popup */}
            <div className="px-3 py-2.5 bg-slate-50 rounded-2xl mb-1 text-right border border-slate-100">
              <span className="text-[9px] font-black text-gray-400 block mb-0.5">
                {activeMsg.sender === 'user' ? 'شما' : (activeMsg.senderName || aiName)}
              </span>
              <p className="text-[10px] text-gray-600 truncate leading-normal">
                {stripEmotions(activeMsg.text) || "پیام رسانه‌ای 🖼️"}
              </p>
            </div>

            {/* Reaction Quick Picker */}
            <div className="flex items-center gap-1.5 px-2 pb-2 mb-1.5 border-b border-gray-100 justify-between">
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => { e.stopPropagation(); onReactMessage?.(activeMsg.id, emoji); setActiveMenuId(null); }}
                  className="hover:scale-125 transition-transform text-lg p-0.5 active:scale-150 duration-150"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); onReplyMessage?.(activeMsg); setActiveMenuId(null); }}
              className="flex items-center justify-between text-gray-700 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors text-xs font-black w-full text-right"
            >
              <span className="flex items-center gap-2">
                <i className="fas fa-reply text-gray-400 w-4"></i>
                <span>پاسخ</span>
              </span>
            </button>

            {activeMsg.sender === 'user' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEditMessage?.(activeMsg); setActiveMenuId(null); }}
                className="flex items-center justify-between text-gray-700 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors text-xs font-black w-full text-right"
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-edit text-gray-400 w-4"></i>
                  <span>ویرایش پیام</span>
                </span>
              </button>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); onPinMessage?.(activeMsg); setActiveMenuId(null); }}
              className="flex items-center justify-between text-gray-700 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors text-xs font-black w-full text-right"
            >
              <span className="flex items-center gap-2">
                <i className="fas fa-thumbtack text-gray-400 w-4"></i>
                <span>{isMsgPinned ? 'حذف از پین' : 'سنجاق کردن'}</span>
              </span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onForwardMessage?.(activeMsg); setActiveMenuId(null); }}
              className="flex items-center justify-between text-gray-700 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors text-xs font-black w-full text-right"
            >
              <span className="flex items-center gap-2">
                <i className="fas fa-share text-gray-400 w-4"></i>
                <span>هدایت (فوروارد)</span>
              </span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); handleCopy(stripEmotions(activeMsg.text)); }}
              className="flex items-center justify-between text-gray-700 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors text-xs font-black w-full text-right"
            >
              <span className="flex items-center gap-2">
                <i className="far fa-copy text-gray-400 w-4"></i>
                <span>کپی کردن</span>
              </span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteMessage?.(activeMsg.id); setActiveMenuId(null); }}
              className="flex items-center justify-between text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors text-xs font-black w-full text-right border-t border-gray-50 mt-1"
            >
              <span className="flex items-center gap-2">
                <i className="far fa-trash-alt w-4"></i>
                <span>حذف پیام</span>
              </span>
            </button>
          </div>
        </div>
      );
    })()}
  </div>
);
};

export default ChatArea;
