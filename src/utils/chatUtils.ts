import { ChatProfile, Message, ChatSettings } from '../../types';
import { PROFILE_TRANSLATIONS, LOCALIZED_ROLE_LABELS } from '../translations';
import { ROLE_LABELS } from '../initialProfiles';

export const getTranslatedProfileName = (p: ChatProfile | null | undefined, language: string): string => {
  if (!p) return "";
  const trans = (PROFILE_TRANSLATIONS as any)[p.id];
  if (trans) {
    return trans[language || 'fa']?.name || p.name;
  }
  return p.name;
};

export const getTranslatedProfileRoleLabel = (p: ChatProfile | null | undefined, language: string): string => {
  if (!p) return "";
  if (p.isGroup) return "";
  if (p.customRoleLabel) return p.customRoleLabel;
  
  const transRole = LOCALIZED_ROLE_LABELS[language || 'fa']?.[p.role];
  if (transRole) {
    return transRole;
  }
  return ROLE_LABELS[p.role] || "پرسونا";
};

export const getTranslatedMessageText = (msg: Message, profileId: string, language: string): string => {
  if (!msg) return "";
  const trans = (PROFILE_TRANSLATIONS as any)[profileId];
  if (trans) {
    const isInitial = msg.id === `msg-sara-1` || 
                      msg.id === `msg-doc-1` || 
                      msg.id === `msg-psy-1` || 
                      msg.id === `msg-law-1` || 
                      msg.id === `msg-eng-1` || 
                      msg.id === `msg-chef-1` || 
                      msg.id === `msg-fri-1`;
    if (isInitial) {
      return trans[language || 'fa']?.msg || msg.text;
    }
  }
  return msg.text;
};

export const formatLastActive = (timestamp: number | undefined): string => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
};

export function detectPersianGender(name: string): 'female' | 'male' {
  const lowercaseName = name.toLowerCase();
  
  const femaleKeywords = [
    'سارا', 'فاطمه', 'زهرا', 'ندا', 'مریم', 'نازنین', 'الهام', 'مهسا', 'پریسا', 'رویا', 'ساناز',
    'شیما', 'عسل', 'ناز', 'دختر', 'زن', 'مامان', 'مادر', 'خاله', 'عمه', 'خواهر', 'آوا', 'غزل', 
    'ستاره', 'آیدا', 'مهشید', 'سحر', 'نیلوفر', 'مژگان', 'بهار', 'پرستو', 'شقایق', 'یاس', 'نرگس',
    'رها', 'باران', 'شیوا', 'تینا', 'شکیبا', 'یکتا', 'نگین', 'نگار', 'هلیا', 'یسنا', 'ملیکا',
    'کیانا', 'شیرین', 'لیلا', 'مینا', 'هانیه', 'ریحانه', 'محدثه', 'هستی', 'روژین', 'ثنا', 'اسما',
    'ستایش', 'نفس', 'ساغر', 'سوگند', 'دریا', 'حدیث', 'پرنیا', 'کیمیا', 'آیسان', 'ژاله'
  ];

  const maleKeywords = [
    'سینا', 'آرش', 'علی', 'رضا', 'محمد', 'حسین', 'حسن', 'امیر', 'بابک', 'کوروش', 'داریوش', 'امید',
    'سامان', 'میلاد', 'پدر', 'بابا', 'پسر', 'مرد', 'برادر', 'شاه', 'سلطان', 'پسرخاله', 'عمو', 'دایی',
    'نیما', 'پیمان', 'سعید', 'وحید', 'حمید', 'نوید', 'کیوان', 'فرزاد', 'سهراب', 'رستم', 'بردیا', 'آبتین',
    'مهدی', 'علیرضا', 'محمدرضا', 'امیرحسین', 'امیرعلی', 'جواد', 'یاسر', 'ابوالفضل', 'عرفان', 'عرشیا',
    'پارس', 'شایان', 'پویا', 'سپهر', 'بردیا', 'مانی', 'بهرام', 'سام', 'کیان', 'سوشا', 'شاهین', 'کامران'
  ];

  for (const k of femaleKeywords) {
    if (lowercaseName.includes(k)) return 'female';
  }
  for (const k of maleKeywords) {
    if (lowercaseName.includes(k)) return 'male';
  }

  const lastChar = lowercaseName.slice(-1);
  if (lastChar === 'ا' || lastChar === 'ه' || lastChar === 'ی') {
    return 'female';
  }

  return 'male';
}

