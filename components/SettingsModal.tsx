
import React, { useState, useRef } from 'react';
import { ChatSettings, PersonaType } from '../types';

interface SettingsModalProps {
  currentSettings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<ChatSettings>(currentSettings);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const personas: PersonaType[] = ['Partner', 'Doctor', 'Friend', 'Assistant', 'Custom'];

  const gradients = [
    { name: 'Default', val: 'linear-gradient(180deg, #d8e4f1 0%, #a2c2e1 100%)' },
    { name: 'Warm', val: 'linear-gradient(to bottom, #f2994a, #f2c94c)' },
    { name: 'Midnight', val: 'linear-gradient(to bottom, #2c3e50, #4ca1af)' },
    { name: 'Soft', val: 'linear-gradient(to bottom, #834d9b, #d04ed6)' },
    { name: 'Blue', val: 'linear-gradient(to bottom, #1e3c72, #2a5298)' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'profile') {
          setSettings({ ...settings, aiProfilePic: base64 });
        } else {
          setSettings({ ...settings, backgroundGradient: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [isCleared, setIsCleared] = useState(false);

  const handleClearStorage = () => {
    if (confirm("آیا از پاک کردن تمام داده‌ها و تاریخچه چت اطمینان دارید؟")) {
      localStorage.clear();
      setIsCleared(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        {isCleared && (
          <div className="absolute inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <i className="fas fa-check text-4xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">حافظه پاکسازی شد!</h3>
            <p className="text-gray-500">تمام داده‌ها با موفقیت حذف شدند. برنامه در حال بازنشانی است...</p>
          </div>
        )}
        {/* Header like Telegram Profile */}
        <div className="relative h-48 shrink-0">
          <img 
            src={settings.backgroundGradient.startsWith('data:image') ? settings.backgroundGradient : 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800'} 
            className="w-full h-full object-cover brightness-50" 
            alt="Header Background"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200">
                <img src={settings.aiProfilePic} className="w-full h-full object-cover" alt="AI Profile" />
              </div>
              <button 
                onClick={() => profileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#517da2] text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <i className="fas fa-camera text-sm"></i>
              </button>
            </div>
            <h3 className="mt-2 text-xl font-bold">{settings.aiName || 'بدون نام'}</h3>
            <p className="text-white/70 text-xs">در حال ویرایش پروفایل...</p>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-white text-xl p-2"><i className="fas fa-times"></i></button>
        </div>

        <input type="file" ref={profileInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
        <input type="file" ref={backgroundInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'background')} />

        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar bg-gray-50">
          {/* AI & User Name Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">اطلاعات کاربری</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
               <div className="flex items-center gap-3">
                 <i className="fas fa-robot text-blue-400 w-5"></i>
                 <div className="flex-1">
                   <p className="text-[10px] text-gray-400 mb-1">نام هوش مصنوعی</p>
                   <input 
                    type="text" 
                    placeholder="نام هوش مصنوعی"
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                    value={settings.aiName}
                    onChange={(e) => setSettings({...settings, aiName: e.target.value})}
                  />
                 </div>
               </div>
               <div className="h-px bg-gray-50 w-full"></div>
               <div className="flex items-center gap-3">
                 <i className="fas fa-birthday-cake text-pink-400 w-5"></i>
                 <div className="flex-1">
                   <p className="text-[10px] text-gray-400 mb-1">سن هوش مصنوعی</p>
                   <input 
                    type="number" 
                    placeholder="سن"
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                    value={settings.aiAge}
                    onChange={(e) => setSettings({...settings, aiAge: e.target.value})}
                  />
                 </div>
               </div>
               <div className="h-px bg-gray-50 w-full"></div>
               <div className="flex items-center gap-3">
                 <i className="fas fa-user text-orange-400 w-5"></i>
                 <div className="flex-1">
                   <p className="text-[10px] text-gray-400 mb-1">نام شما (کاربر)</p>
                   <input 
                    type="text" 
                    placeholder="نام شما"
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                    value={settings.userName}
                    onChange={(e) => setSettings({...settings, userName: e.target.value})}
                  />
                 </div>
               </div>
            </div>
          </section>

          {/* Persona Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">رابطه و شخصیت (پرسونا)</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
              <div className="flex flex-wrap gap-2 mb-4">
                {personas.map(p => (
                  <button
                    key={p}
                    onClick={() => setSettings({...settings, persona: p})}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      settings.persona === p ? 'bg-[#517da2] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {p === 'Partner' ? 'عشقی' : p === 'Doctor' ? 'پزشک' : p === 'Friend' ? 'رفیق' : p === 'Assistant' ? 'دستیار' : 'دستی (آزاد)'}
                  </button>
                ))}
              </div>
              
              {settings.persona === 'Custom' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                   <textarea 
                    rows={3}
                    placeholder="رابطه خود را اینجا دستی بنویسید (مثلاً: تو خواهر ناتنی من هستی که خیلی با هم صمیمی هستیم...)"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs leading-relaxed focus:ring-1 focus:ring-blue-200 outline-none"
                    value={settings.customPersonaPrompt}
                    onChange={(e) => setSettings({...settings, customPersonaPrompt: e.target.value})}
                  />
                  <p className="text-[10px] text-gray-400 mt-2 mr-1">در اینجا می‌توانید دقیقاً بنویسید که هوش مصنوعی چه نقشی داشته باشد.</p>
                </div>
              )}
            </div>
          </section>

          {/* Voice Settings Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">تنظیمات صوتی</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fas fa-volume-up text-blue-500 w-5"></i>
                  <span className="text-sm font-medium">قابلیت پخش صوت</span>
                </div>
                <button 
                  onClick={() => setSettings({...settings, ttsEnabled: !settings.ttsEnabled})}
                  className={`w-10 h-5 rounded-full transition-colors relative ${settings.ttsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.ttsEnabled ? 'left-5' : 'left-0.5'}`}></div>
                </button>
              </div>
              
              {settings.ttsEnabled && (
                <div className="pt-2 border-t border-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">پخش خودکار پیام‌ها</span>
                    <input 
                      type="checkbox" 
                      className="rounded text-blue-500 focus:ring-0" 
                      checked={settings.ttsAutoPlay} 
                      onChange={(e) => setSettings({...settings, ttsAutoPlay: e.target.checked})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setSettings({...settings, ttsVoice: 'Zephyr'})}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsVoice === 'Zephyr' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      دختر بسیار جوان (Zephyr)
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, ttsVoice: 'Kore'})}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsVoice === 'Kore' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      زن جوان (Kore)
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, ttsVoice: 'Puck'})}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsVoice === 'Puck' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      مرد جوان (Puck)
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, ttsVoice: 'Charon'})}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsVoice === 'Charon' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      صدای بم (Charon)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* API Key Management Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">مدیریت کلید API (برای ویدیو)</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  برای استفاده از قابلیت **تماس تصویری**، حتماً باید یک API Key از پروژه‌ای انتخاب کنید که **Billing (پرداخت)** آن فعال باشد. پروژه‌های رایگان اجازه تولید ویدیو را نمی‌دهند.
                </p>
                <button 
                  onClick={async () => {
                    if ((window as any).aistudio) {
                      await (window as any).aistudio.openSelectKey();
                    }
                  }}
                  className="w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-key"></i>
                  تغییر یا انتخاب کلید API
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-500 hover:underline text-center"
                >
                  مشاهده مستندات فعال‌سازی Billing
                </a>
              </div>
            </div>
          </section>

          {/* Background Selection Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">پس‌زمینه چت</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="grid grid-cols-6 gap-2 mb-4">
                {gradients.map((g, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSettings({...settings, backgroundGradient: g.val})}
                    className={`aspect-square rounded-lg border-2 shadow-inner transition-transform active:scale-90 ${settings.backgroundGradient === g.val ? 'border-blue-500 scale-105' : 'border-transparent'}`}
                    style={{ background: g.val }}
                  />
                ))}
                <button
                  onClick={() => backgroundInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center">انتخاب از رنگ‌ها یا آپلود عکس دلخواه</p>
            </div>
          </section>

          {/* Troubleshooting Section */}
          <section className="pt-4 border-t border-gray-100">
            <button 
              onClick={handleClearStorage}
              className="w-full py-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fas fa-trash-alt"></i>
              پاک کردن حافظه مرورگر (رفع خطاها)
            </button>
            <p className="text-[9px] text-gray-400 mt-2 text-center leading-relaxed">
              اگر با خطای Quota Exceeded مواجه شدید یا برنامه به درستی کار نمی‌کند، از این دکمه برای ریست کردن کامل استفاده کنید.
            </p>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
          <button 
            onClick={() => onSave(settings)}
            className="flex-1 bg-[#517da2] hover:bg-[#436a8d] text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            اعمال تغییرات
          </button>
          <button 
            onClick={onClose} 
            className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
          >
            لغو
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
