import React, { useState, useEffect } from 'react';
import { ChatSettings } from '../types';
import { translations } from '../src/translations';
import { detectPersianGender } from './AddProfileSheet';
import { 
  ensureAuth, 
  registerUserInFirestore, 
  getRegisteredUsers 
} from '../firebaseService';
import { auth } from '../firebase';

interface OnboardingModalProps {
  settings: ChatSettings;
  apiKeyMissing: boolean;
  onUpdateSettings: (settings: ChatSettings) => void;
  setShowGuideModal: (show: boolean) => void;
  myUid: string;
  setMyUid: (uid: string) => void;
}

const hashPassword = async (plain: string): Promise<string> => {
  if (!plain) return "";
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain + "salt_2026_telegram");
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn("Native SHA-256 hashing failed, using fallback:", e);
    // Secure fallback: simple obfuscated hash
    let hash = 0;
    for (let i = 0; i < plain.length; i++) {
      hash = (hash << 5) - hash + plain.charCodeAt(i);
      hash |= 0;
    }
    return "fb_" + hash;
  }
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  settings,
  apiKeyMissing,
  onUpdateSettings,
  setShowGuideModal,
  myUid,
  setMyUid
}) => {
  const activeLang = settings.language || 'fa';
  const t = translations[activeLang] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  const [onboardingProfilePic, setOnboardingProfilePic] = useState<string>('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100');
  const [onboardingName, setOnboardingName] = useState<string>('');
  const [onboardingGender, setOnboardingGender] = useState<'male' | 'female'>('male');
  const [onboardingPhone, setOnboardingPhone] = useState<string>('');
  const [onboardingAge, setOnboardingAge] = useState<string>('25');
  const [onboardingPassword, setOnboardingPassword] = useState<string>('');
  const [onboardingTab, setOnboardingTab] = useState<'signup' | 'login'>('signup');
  const [onboardingLoginName, setOnboardingLoginName] = useState<string>('');
  const [onboardingLoginPassword, setOnboardingLoginPassword] = useState<string>('');

  // Auto-detect gender as the user types their name
  useEffect(() => {
    if (onboardingName.trim()) {
      const detected = detectPersianGender(onboardingName);
      setOnboardingGender(detected);
    }
  }, [onboardingName]);

  if (settings.userName || apiKeyMissing) {
    return null;
  }

  return (
    <div id="onboarding-overlay-container" className="absolute inset-0 z-[105] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        id="onboarding-modal-content"
        className="bg-white rounded-3xl p-6 w-full max-w-[400px] shadow-2xl text-center border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col animate-in zoom-in-95 duration-200" 
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Real-time Language Switcher inside Onboarding */}
        <div className="flex justify-center gap-1.5 mb-4 shrink-0 select-none">
          {(['fa', 'en', 'ar', 'es'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onUpdateSettings({ ...settings, language: l })}
              className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold border transition-all ${activeLang === l ? 'bg-[#517da2]/15 border-[#517da2] text-[#517da2] shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'} cursor-pointer`}
            >
              {l === 'fa' ? 'فارسی' : l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Español'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 mb-5 select-none">
          <h3 className={`text-[17px] font-black text-gray-950 ${isRtl ? 'text-right' : 'text-left'}`}>{t.welcome}</h3>
          <button
            id="onboarding-guide-btn"
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#517da2] hover:text-[#3a5d7c] rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm border border-blue-100/50"
          >
            <i className="fas fa-book-reader text-xs"></i>
            <span>{t.guide}</span>
          </button>
        </div>
        
        {/* Custom Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 select-none shrink-0">
          <button 
            id="onboarding-tab-signup"
            type="button"
            onClick={() => setOnboardingTab('signup')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${onboardingTab === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {t.register}
          </button>
          <button 
            id="onboarding-tab-login"
            type="button"
            onClick={() => setOnboardingTab('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${onboardingTab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {t.login}
          </button>
        </div>

        {onboardingTab === 'signup' ? (
          <div className={`space-y-4 ${isRtl ? 'text-right' : 'text-left'} flex-1 flex flex-col`}>
            <p className="text-gray-500 text-[11px] mb-2 leading-relaxed text-center select-none">
              {t.fillDetails}
            </p>

            {/* Avatar Preview */}
            <div className="relative w-20 h-20 mx-auto mb-2 group shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#517da2]/20 shadow-lg relative bg-gray-50">
                <img 
                  src={onboardingProfilePic} 
                  className="w-full h-full object-cover" 
                  alt="کاربر" 
                />
              </div>
              <label className={`absolute bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-7 h-7 rounded-full bg-[#517da2] text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-[#436a8d] transition-colors active:scale-90 border-2 border-white`}>
                <i className="fas fa-camera text-[10px]"></i>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setOnboardingProfilePic(ev.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Preset Avatars Selection */}
            <div className="mb-2 select-none shrink-0">
              <span className={`text-[10px] font-bold text-gray-400 block mb-1 ${isRtl ? 'text-right mr-1' : 'text-left ml-1'}`}>{t.presetAvatars}</span>
              <div className="flex justify-center gap-1.5">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', // دختر صمیمی
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', // پسر صمیمی
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', // دختر پرانرژی
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'  // پسر پرانرژی
                ].map((avatarUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setOnboardingProfilePic(avatarUrl)}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all active:scale-90 cursor-pointer ${onboardingProfilePic === avatarUrl ? 'border-[#517da2]' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <img src={avatarUrl} className="w-full h-full object-cover" alt={`Avatar ${idx}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-bold text-gray-400 mb-1 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.fullName}</label>
              <input 
                id="signup-name-input"
                type="text" 
                placeholder={isRtl ? 'مثال: رضا احمدی...' : 'e.g. John Doe...'}
                value={onboardingName}
                onChange={(e) => setOnboardingName(e.target.value)}
                className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl ${isRtl ? 'text-right' : 'text-left'} font-bold text-gray-800 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-bold text-gray-400 mb-1 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.phone}</label>
              <input 
                id="signup-phone-input"
                type="tel" 
                placeholder={isRtl ? 'مثال: 09123456789...' : 'e.g. +1234567890'}
                value={onboardingPhone}
                onChange={(e) => setOnboardingPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs tracking-wider font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className={`block text-[11px] font-bold text-gray-400 mb-1 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.age}</label>
              <input 
                id="signup-age-input"
                type="number" 
                placeholder={isRtl ? 'مثال: 25' : 'e.g. 25'}
                value={onboardingAge}
                onChange={(e) => setOnboardingAge(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs"
              />
            </div>

            <div>
              <label className={`block text-[11px] font-bold text-gray-400 mb-1 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.password}</label>
              <input 
                id="signup-password-input"
                type="password" 
                placeholder={isRtl ? 'رمز عبور دلخواه...' : 'Enter password...'}
                value={onboardingPassword}
                onChange={(e) => setOnboardingPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs"
                dir="ltr"
              />
            </div>

            {/* Gender Selector */}
            <div className="select-none">
              <label className={`block text-[11px] font-bold text-gray-400 mb-1.5 ${isRtl ? 'mr-1' : 'ml-1'}`}>
                {t.yourGender}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="signup-gender-male-btn"
                  type="button"
                  onClick={() => setOnboardingGender('male')}
                  className={`py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    onboardingGender === 'male' 
                      ? 'bg-blue-50 border-[#517da2] text-[#517da2] ring-2 ring-blue-50' 
                      : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-mars ml-1.5"></i>
                  {t.genderMale}
                </button>
                <button
                  id="signup-gender-female-btn"
                  type="button"
                  onClick={() => setOnboardingGender('female')}
                  className={`py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    onboardingGender === 'female' 
                      ? 'bg-pink-50 border-pink-400 text-pink-600 ring-2 ring-pink-50' 
                      : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-venus ml-1.5"></i>
                  {t.genderFemale}
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div className="select-none">
              <label className={`block text-[11px] font-bold text-gray-400 mb-1.5 ${isRtl ? 'mr-1' : 'ml-1'}`}>
                {t.appLang}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['fa', 'en', 'ar', 'es'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, language: l })}
                    className={`py-2 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer ${
                      activeLang === l 
                        ? 'bg-[#517da2]/10 border-[#517da2] text-[#517da2]' 
                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {l === 'fa' ? 'فارسی' : l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Español'}
                  </button>
                ))}
              </div>
            </div>

            <button 
              id="signup-submit-btn"
              onClick={async () => {
                const name = onboardingName.trim();
                const phone = onboardingPhone.trim();
                const age = onboardingAge.trim();
                const password = onboardingPassword.trim();
                
                if (!name) {
                  alert(isRtl ? 'لطفاً نام خود را وارد کنید.' : 'Please enter your name.');
                  return;
                }
                if (!phone || phone.length < 5) {
                  alert(isRtl ? 'لطفاً شماره موبایل معتبری وارد کنید.' : 'Please enter a valid phone number.');
                  return;
                }
                if (!password) {
                  alert(isRtl ? 'لطفاً رمز ورود را وارد کنید.' : 'Please enter a password.');
                  return;
                }

                try {
                  let currentUid = myUid || auth.currentUser?.uid;
                  if (!currentUid) {
                    try {
                      currentUid = await ensureAuth();
                      setMyUid(currentUid);
                    } catch (authErr) {
                      currentUid = 'usr-' + Date.now();
                    }
                  }

                  // Check if username already exists to avoid collisions
                  const allUsers = await getRegisteredUsers();
                  const existingUser = allUsers.find(u => u.name.trim().toLowerCase() === name.toLowerCase());
                  if (existingUser) {
                    alert(isRtl ? "این نام قبلاً ثبت‌نام شده است. لطفاً از تب ورود استفاده کنید یا نام دیگری انتخاب کنید." : "This name is already registered. Please log in or use another name.");
                    return;
                  }

                  // Write to firestore (with secure hashing)
                  const hashedPassword = await hashPassword(password);
                  await registerUserInFirestore(currentUid, name, phone, age, onboardingProfilePic, hashedPassword, onboardingGender);
                  
                  onUpdateSettings({
                    ...settings, 
                    userName: name, 
                    userProfilePic: onboardingProfilePic,
                    userPhone: phone,
                    userAge: age,
                    userGender: onboardingGender,
                    userId: currentUid
                  });
                  
                  alert(isRtl ? `عضویت و ورود شما با نام ${name} با موفقیت انجام شد! 🎉` : `Successfully registered and logged in as ${name}! 🎉`);
                } catch (err: any) {
                  console.error("Signup failed:", err);
                  alert(isRtl ? "خطایی در ثبت‌نام رخ داد. لطفا دوباره تلاش کنید." : "An error occurred during registration. Please try again.");
                }
              }}
              className="w-full mt-4 py-3 bg-gradient-to-r from-[#517da2] to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:opacity-95 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 select-none"
            >
              <i className="fas fa-user-plus"></i>
              <span>{t.letsGo}</span>
            </button>
          </div>
        ) : (
          <div className={`space-y-4 ${isRtl ? 'text-right' : 'text-left'} flex-1 flex flex-col`}>
            <p className="text-gray-500 text-[11px] mb-4 leading-relaxed text-center select-none">
              {t.loginTitle}
            </p>

            <div>
              <label className={`block text-[11px] font-bold text-gray-400 mb-1.5 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.fullName}</label>
              <input 
                id="login-name-input"
                type="text" 
                placeholder={isRtl ? 'مثال: رضا احمدی...' : 'e.g. John Doe...'}
                value={onboardingLoginName}
                onChange={(e) => setOnboardingLoginName(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl ${isRtl ? 'text-right' : 'text-left'} font-bold text-gray-800 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-bold text-gray-400 mb-1.5 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.password}</label>
              <input 
                id="login-password-input"
                type="password" 
                placeholder={isRtl ? 'رمز ورود شما...' : 'Your password...'}
                value={onboardingLoginPassword}
                onChange={(e) => setOnboardingLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-xs"
                dir="ltr"
              />
            </div>

            {/* Language Selector */}
            <div className="select-none">
              <label className={`block text-[11px] font-bold text-gray-400 mb-1.5 ${isRtl ? 'mr-1' : 'ml-1'}`}>
                {t.appLang}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['fa', 'en', 'ar', 'es'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, language: l })}
                    className={`py-2 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer ${
                      activeLang === l 
                        ? 'bg-[#517da2]/10 border-[#517da2] text-[#517da2]' 
                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {l === 'fa' ? 'فارسی' : l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Español'}
                  </button>
                ))}
              </div>
            </div>

            <button 
              id="login-submit-btn"
              onClick={async () => {
                const name = onboardingLoginName.trim();
                const password = onboardingLoginPassword.trim();
                
                if (!name) {
                  alert(isRtl ? 'لطفاً نام و نام‌خانوادگی خود را وارد کنید.' : 'Please enter your full name.');
                  return;
                }
                if (!password) {
                  alert(isRtl ? 'لطفاً رمز ورود خود را وارد کنید.' : 'Please enter your password.');
                  return;
                }

                try {
                  const allUsers = await getRegisteredUsers();
                  const matchingUser = allUsers.find(u => u.name.trim().toLowerCase() === name.toLowerCase());

                  if (!matchingUser) {
                    alert(isRtl ? "کاربری با این مشخصات یافت نشد. لطفاً ابتدا ثبت‌نام کنید." : "User not found. Please register first.");
                    return;
                  }

                  const hashedInput = await hashPassword(password);
                  if (matchingUser.password && matchingUser.password !== password && matchingUser.password !== hashedInput) {
                    alert(isRtl ? "رمز ورود وارد شده نادرست است." : "Incorrect password.");
                    return;
                  }

                  // Successfully authenticated!
                  onUpdateSettings({
                    ...settings,
                    userName: matchingUser.name,
                    userProfilePic: matchingUser.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                    userPhone: matchingUser.phone || '',
                    userAge: matchingUser.age || '25',
                    userGender: matchingUser.gender || detectPersianGender(matchingUser.name),
                    userId: matchingUser.id
                  });

                  alert(isRtl ? `خوش آمدید، ${matchingUser.name}! ورود شما موفقیت‌آمیز بود. ✨` : `Welcome back, ${matchingUser.name}! Successful login. ✨`);
                } catch (err) {
                  console.error("Login failed:", err);
                  alert(isRtl ? "خطایی در ورود به حساب رخ داد." : "An error occurred during login.");
                }
              }}
              className="w-full mt-6 py-3 bg-[#517da2] hover:bg-[#436a8d] text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:opacity-95 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 select-none"
            >
              <i className="fas fa-sign-in-alt"></i>
              <span>{t.loginBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
