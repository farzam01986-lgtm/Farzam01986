import React, { useState, useRef } from 'react';
import { ChatSettings, PersonaType } from '../types';
import { translations } from '../src/translations';

interface SettingsModalProps {
  currentSettings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
  onClose: () => void;
  onDeleteProfile?: () => void;
  onSimulateInactivity?: () => void;
  onDeleteAccount?: () => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose, onDeleteProfile, onSimulateInactivity, onDeleteAccount }) => {
  const [settings, setSettings] = useState<ChatSettings>({
    ...currentSettings,
    language: currentSettings.language || 'fa',
    chatFontSize: currentSettings.chatFontSize || '14px'
  });
  
  const activeLang = settings.language || 'fa';
  const t = translations[activeLang] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  const profileInputRef = useRef<HTMLInputElement>(null);
  const userProfileInputRef = useRef<HTMLInputElement>(null);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    try {
      const data = {
        chat_profiles: localStorage.getItem('chat_profiles'),
        chat_history_archive: localStorage.getItem('chat_history_archive'),
        user_stories: localStorage.getItem('user_stories'),
        chat_settings: localStorage.getItem('chat_settings') || JSON.stringify(settings),
        viewed_stories: localStorage.getItem('viewed_stories'),
        liked_stories: localStorage.getItem('liked_stories'),
        backupDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `messenger_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert((isRtl ? "خطا در ایجاد پشتیبان: " : "Error creating backup: ") + e);
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.chat_profiles) {
          localStorage.setItem('chat_profiles', data.chat_profiles);
        }
        if (data.chat_history_archive) {
          localStorage.setItem('chat_history_archive', data.chat_history_archive);
        }
        if (data.user_stories) {
          localStorage.setItem('user_stories', data.user_stories);
        }
        if (data.chat_settings) {
          localStorage.setItem('chat_settings', data.chat_settings);
        }
        if (data.viewed_stories) {
          localStorage.setItem('viewed_stories', data.viewed_stories);
        }
        if (data.liked_stories) {
          localStorage.setItem('liked_stories', data.liked_stories);
        }
        alert(isRtl ? "اطلاعات با موفقیت بازیابی شد! برنامه اکنون دوباره بارگذاری می‌شود." : "Data successfully restored! App is reloading.");
        window.location.reload();
      } catch (err) {
        alert(isRtl ? "خطا در خواندن فایل پشتیبان. لطفاً فایل معتبری انتخاب کنید." : "Error reading backup file. Please choose a valid file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {isCleared && (
          <div className="absolute inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <i className="fas fa-check text-4xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isRtl ? 'حافظه پاکسازی شد!' : 'Storage Cleared!'}
            </h3>
            <p className="text-gray-500">
              {isRtl ? 'تمام داده‌ها با موفقیت حذف شدند. برنامه در حال بازنشانی است...' : 'All data cleared successfully. Application is resetting...'}
            </p>
          </div>
        )}
        {/* Header like Telegram Profile */}
        <div className="relative h-48 shrink-0">
          <img 
            src={settings.backgroundGradient && settings.backgroundGradient.startsWith('data:image') ? settings.backgroundGradient : 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800'} 
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
                className={`absolute bottom-0 ${isRtl ? 'right-0' : 'left-0'} bg-[#517da2] text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform`}
              >
                <i className="fas fa-camera text-sm"></i>
              </button>
            </div>
            <h3 className="mt-2 text-xl font-bold">{settings.aiName || 'بدون نام'}</h3>
            <p className="text-white/70 text-xs">{isRtl ? 'در حال ویرایش تنظیمات...' : 'Editing settings...'}</p>
          </div>
          <button onClick={onClose} className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-white text-xl p-2`}><i className="fas fa-times"></i></button>
        </div>

        <input type="file" ref={profileInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
        <input type="file" ref={backgroundInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'background')} />

        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar bg-gray-50">
          {/* AI & User Name Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">{t.profileInfo}</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
               <div className="flex items-center gap-3">
                 <i className="fas fa-robot text-blue-400 w-5"></i>
                 <div className="flex-1">
                   <p className="text-[10px] text-gray-400 mb-1">{t.aiName}</p>
                   <input 
                    type="text" 
                    placeholder={t.aiName}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                    value={settings.aiName || ''}
                    onChange={(e) => setSettings({...settings, aiName: e.target.value})}
                  />
                 </div>
               </div>
               <div className="h-px bg-gray-50 w-full"></div>
               <div className="flex items-center gap-3">
                 <i className="fas fa-birthday-cake text-pink-400 w-5"></i>
                 <div className="flex-1">
                   <p className="text-[10px] text-gray-400 mb-1">{t.aiAge}</p>
                   <input 
                    type="number" 
                    placeholder={t.aiAge}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                    value={settings.aiAge || ''}
                    onChange={(e) => setSettings({...settings, aiAge: e.target.value})}
                  />
                 </div>
               </div>
               <div className="h-px bg-gray-50 w-full"></div>
               <div className="flex items-center gap-3">
                 <i className="fas fa-user text-orange-400 w-5"></i>
                 <div className="flex-1">
                   <p className="text-[10px] text-gray-400 mb-1">{t.yourName}</p>
                   <input 
                    type="text" 
                    placeholder={t.yourName}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                    value={settings.userName || ''}
                    onChange={(e) => setSettings({...settings, userName: e.target.value})}
                  />
                 </div>
               </div>
               <div className="h-px bg-gray-50 w-full"></div>
               <div className="flex items-center gap-3">
                 <i className="fas fa-birthday-cake text-purple-400 w-5"></i>
                 <div className="flex-1">
                   <p className="text-[10px] text-gray-400 mb-1">{t.yourAge}</p>
                   <input 
                    type="number" 
                    placeholder={t.yourAge}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                    value={settings.userAge || ''}
                    onChange={(e) => setSettings({...settings, userAge: e.target.value})}
                  />
                 </div>
               </div>
               <div className="h-px bg-gray-50 w-full"></div>
               <div className="flex flex-col gap-1.5 py-1">
                 <p className="text-[10px] text-gray-400">{isRtl ? 'جنسیت شما:' : 'Your Gender:'}</p>
                 <div className="grid grid-cols-2 gap-2">
                   <button
                     type="button"
                     onClick={() => setSettings({ ...settings, userGender: 'male' })}
                     className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${settings.userGender === 'male' ? 'bg-[#517da2]/10 border-[#517da2] text-[#517da2] shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                   >
                     <i className="fas fa-mars text-blue-500 text-xs"></i>
                     <span>{isRtl ? 'مرد' : 'Male'}</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setSettings({ ...settings, userGender: 'female' })}
                     className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${settings.userGender === 'female' ? 'bg-pink-500/10 border-pink-500 text-pink-600 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                   >
                     <i className="fas fa-venus text-pink-500 text-xs"></i>
                     <span>{isRtl ? 'زن' : 'Female'}</span>
                   </button>
                 </div>
               </div>
               <div className="h-px bg-gray-50 w-full"></div>
               <div className="flex flex-col gap-2">
                 <p className="text-[10px] text-gray-400 mb-1">{t.yourPic}</p>
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#517da2]/20 bg-gray-100 relative shadow-inner">
                     <img src={settings.userProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="w-full h-full object-cover" alt="User profile" />
                   </div>
                   <button 
                     type="button"
                     onClick={() => userProfileInputRef.current?.click()}
                     className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                   >
                     {t.changePic}
                   </button>
                   <input 
                     type="file" 
                     ref={userProfileInputRef} 
                     hidden 
                     accept="image/*" 
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onloadend = () => {
                           setSettings({ ...settings, userProfilePic: reader.result as string });
                         };
                         reader.readAsDataURL(file);
                       }
                     }} 
                   />
                 </div>
               </div>
            </div>
          </section>

          {/* Voice Settings Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">{t.audioTitle}</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <i className="fas fa-volume-up text-blue-500 w-5"></i>
                   <span className="text-sm font-medium">{t.audioEnabled}</span>
                 </div>
                 <button 
                   onClick={() => setSettings({...settings, ttsEnabled: !settings.ttsEnabled})}
                   className={`w-10 h-5 rounded-full transition-colors relative ${settings.ttsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                 >
                   <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.ttsEnabled ? (isRtl ? 'right-5' : 'left-5') : (isRtl ? 'right-0.5' : 'left-0.5')}`}></div>
                 </button>
               </div>
               
               {settings.ttsEnabled && (
                 <div className="pt-2 border-t border-gray-50 space-y-3">
                   <div className="flex flex-col gap-2">
                     <p className="text-[10px] text-gray-400 mb-1">{t.audioMode}</p>
                     <div className="grid grid-cols-2 gap-2">
                       <button
                         onClick={() => setSettings({...settings, ttsAutoPlay: true})}
                         className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsAutoPlay ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                       >
                         <i className="fas fa-bolt ml-1"></i>
                         {t.audioAuto}
                       </button>
                       <button
                         onClick={() => setSettings({...settings, ttsAutoPlay: false})}
                         className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${!settings.ttsAutoPlay ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                       >
                         <i className="fas fa-hand-paper ml-1"></i>
                         {t.audioManual}
                       </button>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2 pt-2">
                     <button 
                       onClick={() => setSettings({...settings, ttsVoice: 'Zephyr'})}
                       className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsVoice === 'Zephyr' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                     >
                       {isRtl ? 'دختر بسیار جوان (Zephyr)' : 'Very Young Girl (Zephyr)'}
                     </button>
                     <button 
                       onClick={() => setSettings({...settings, ttsVoice: 'Kore'})}
                       className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsVoice === 'Kore' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                     >
                       {isRtl ? 'زن جوان (Kore)' : 'Young Woman (Kore)'}
                     </button>
                     <button 
                       onClick={() => setSettings({...settings, ttsVoice: 'Puck'})}
                       className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsVoice === 'Puck' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                     >
                       {isRtl ? 'مرد جوان (Puck)' : 'Young Man (Puck)'}
                     </button>
                     <button 
                       onClick={() => setSettings({...settings, ttsVoice: 'Charon'})}
                       className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.ttsVoice === 'Charon' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}
                     >
                       {isRtl ? 'صدای بم (Charon)' : 'Deep Voice (Charon)'}
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </section>

          {/* Chat Appearance & Language Settings Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">{t.fontSize} & {t.appLang}</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              {/* Language Picker */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400">{t.appLang}:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['fa', 'en', 'ar', 'es'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setSettings({ ...settings, language: l })}
                      className={`py-2 rounded-xl text-[10px] font-extrabold border transition-all ${settings.language === l ? 'bg-[#517da2]/10 border-[#517da2] text-[#517da2]' : 'bg-white border-gray-100 text-gray-500'}`}
                    >
                      {l === 'fa' ? 'فارسی' : l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Español'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-gray-50 w-full"></div>

              {/* Font Size Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400">{t.fontSize}:</span>
                <div className="grid grid-cols-6 gap-1">
                  {(['12px', '14px', '16px', '18px', '20px', '22px'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSettings({ ...settings, chatFontSize: sz })}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${settings.chatFontSize === sz ? 'bg-[#517da2]/10 border-[#517da2] text-[#517da2]' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* API Key Management Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">{t.apiKeyTitle}</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  {t.apiKeyDesc}
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
                  {t.apiKeyBtn}
                </button>
              </div>
            </div>
          </section>

          {/* Background Selection Section */}
          <section>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">{t.bgTitle}</label>
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
              <p className="text-[10px] text-gray-400 text-center">{t.bgDesc}</p>
            </div>
          </section>

          {/* Backup & Restore Section */}
          <section className="pt-4 border-t border-gray-100">
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">{t.syncTitle}</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {t.syncDesc}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleBackup}
                  className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <i className="fas fa-download"></i>
                  {t.backupBtn}
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-bold border border-green-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <i className="fas fa-upload"></i>
                  {t.restoreBtn}
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".json" 
                onChange={handleRestore} 
                className="hidden" 
              />
            </div>
          </section>

          {/* Share App Link Section */}
          <section className="pt-4 border-t border-gray-100">
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">{t.shareTitle}</label>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {t.shareDesc}
              </p>
              <button 
                type="button"
                onClick={() => {
                  try {
                    let shareUrl = window.location.href;
                    try {
                      if (window.parent && window.parent.location) {
                        shareUrl = window.parent.location.href;
                      }
                    } catch (crossOriginErr) {
                      shareUrl = window.location.href;
                    }
                    navigator.clipboard.writeText(shareUrl);
                    alert(isRtl ? "لینک دعوت برنامه با موفقیت کپی شد! 🔗\nآن را برای دوستان خود ارسال کنید تا با شماره مستقل خود وارد شوند." : "App link copied to clipboard! 🔗 Share it with friends.");
                  } catch (e) {
                    alert(isRtl ? "خطا در کپی لینک. لطفاً آدرس بالای صفحه مرورگر را کپی و ارسال کنید." : "Failed to copy link. Please manually copy browser URL.");
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-[#517da2] hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <i className="fas fa-share-alt animate-pulse"></i>
                {t.shareBtn}
              </button>
            </div>
          </section>

          {/* Troubleshooting Section */}
          <section className="pt-4 border-t border-gray-100 space-y-3">
            {onSimulateInactivity && (
              <button 
                onClick={() => {
                  onSimulateInactivity();
                  alert(isRtl ? "شبیه‌سازی ۳ روز بی‌فعالیتی انجام شد! هم‌اکنون مخاطبین غایب با پیام‌های عاشقانه و جویای حال، به سراغتان خواهند آمد." : "Simulation of 3 days of inactivity is done! Offline characters will contact you with loving updates.");
                }}
                className="w-full py-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fas fa-history"></i>
                {t.simInactivity}
              </button>
            )}

            <button 
              onClick={async () => {
                if (confirm(isRtl ? "⚠️ هشدار جدی: آیا از حذف کامل حساب کاربری خود اطمینان دارید؟\nبا این کار تمامی اطلاعات شما برای همیشه حذف خواهند شد." : "⚠️ WARNING: Are you sure you want to delete your account permanently? All history will be lost.")) {
                  if (onDeleteAccount) {
                    setIsCleared(true);
                    try {
                      await onDeleteAccount();
                    } catch (err) {
                      console.error("Failed to delete account:", err);
                      alert(isRtl ? "حذف حساب کاربری ناموفق بود." : "Account deletion failed.");
                      setIsCleared(false);
                    }
                  } else {
                    localStorage.clear();
                    setIsCleared(true);
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                  }
                }
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
            >
              <i className="fas fa-user-slash text-sm"></i>
              {t.delAccount}
            </button>
          </section>

          {onDeleteProfile && (
            <section className="pt-4 border-t border-gray-100">
              <button 
                onClick={onDeleteProfile}
                className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-user-minus"></i>
                {isRtl ? 'حذف کامل این مخاطب و گفتگو' : 'Delete this profile & chat'}
              </button>
            </section>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
          <button 
            onClick={() => onSave(settings)}
            className="flex-1 bg-[#517da2] hover:bg-[#436a8d] text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            {t.applyBtn}
          </button>
          <button 
            onClick={onClose} 
            className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
          >
            {t.cancelBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
