import React from 'react';
import { Message, ChatProfile } from '../types';

const ROLE_LABELS: Record<string, string> = {
  Sassy: "صمیمی و شیطون (سارا)",
  Romantic: "عاشقانه و رویایی (سارا)",
  Formal: "رسمی و اداری",
  Philosophical: "فلسفی و عمیق",
  Teacher: "آموزگار مهربان",
  Custom: "شخصی‌سازی شده"
};

interface ForwardMessageModalProps {
  forwardingMsg: Message | null;
  setForwardingMsg: (msg: Message | null) => void;
  profiles: ChatProfile[];
  currentProfileId: string | null;
  executeForward: (targetProfileId: string) => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  forwardingMsg,
  setForwardingMsg,
  profiles,
  currentProfileId,
  executeForward,
}) => {
  if (!forwardingMsg) return null;

  return (
    <div id="forward-message-overlay" className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div id="forward-message-container" className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200" dir="rtl">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#517da2] text-white select-none">
          <h3 className="text-sm font-black">هدایت پیام به...</h3>
          <button 
            id="btn-close-forward"
            type="button"
            onClick={() => setForwardingMsg(null)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
        
        <div className="p-4 bg-gray-50 border-b border-gray-100 shrink-0 select-none">
          <div className="p-3 bg-white border border-gray-100 rounded-2xl flex items-center gap-3">
            <div className="text-gray-400 text-xs shrink-0">
              <i className="fas fa-quote-right"></i>
            </div>
            <div className="text-right min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-500 mb-1">پیام انتخابی:</p>
              <p className="text-xs text-gray-700 truncate">{forwardingMsg.text || "[تصویر یا فایل صوتی]"}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
          {profiles.filter(p => p.id !== currentProfileId).map(p => (
            <div 
              key={p.id}
              onClick={() => executeForward(p.id)}
              className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm bg-gray-50 shrink-0">
                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-right min-w-0 flex-1">
                <p className="text-xs font-black text-gray-900">{p.name}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">{ROLE_LABELS[p.role] || p.customRoleLabel || "پرسونا"}</p>
              </div>
              <div className="text-[#517da2] shrink-0 text-xs">
                <i className="fas fa-chevron-left"></i>
              </div>
            </div>
          ))}
          {profiles.filter(p => p.id !== currentProfileId).length === 0 && (
            <p className="text-center text-xs text-gray-400 py-8 font-bold">مخاطب دیگری برای هدایت پیام وجود ندارد.</p>
          )}
        </div>
      </div>
    </div>
  );
};
