
export type PersonaType = 
  | 'Partner' 
  | 'Doctor' 
  | 'Psychologist' 
  | 'Lawyer' 
  | 'EnglishTeacher' 
  | 'Chef' 
  | 'Friend' 
  | 'Assistant'
  | 'Custom';

export interface Message {
  id: string;
  text: string;
  originalText?: string; // متن اصلی قبل از حذف احساسات برای موتور صوتی
  image?: string; 
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  audioBase64?: string; // ذخیره موقت صدا در صورت نیاز
  isCallLog?: boolean;  // فلگ برای پیام‌های ثبت تماس
  replyTo?: { id: string; text: string; senderName: string };
  reactions?: string[];
  isEdited?: boolean;
  senderName?: string;
  senderAvatar?: string;
  durationSeconds?: number; // برای ضبط ویس
  forwardedFrom?: string; // پیام‌های فوروارد شده
  sticker?: string; // ایموجی استیکر بزرگ برای پاسخ‌ها
  seen?: boolean; // برای وضعیت تیک اول و دوم پیام
}

export interface ChatProfile {
  id: string;
  name: string;
  avatar: string;
  age: string;
  role: PersonaType;
  description?: string;
  customPersonaPrompt?: string;
  messages: Message[];
  lastActive?: number;
  customRoleLabel?: string;
  ttsOverrideEnabled?: boolean;
  ttsOverrideAutoPlay?: boolean;
  ttsOverrideVoice?: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir';
  unreadCount?: number;
  isGroup?: boolean;
  isLeft?: boolean;
  memberIds?: string[]; // شناسه شخصیت‌های عضو گروه
  pinnedMsgId?: string | null; // پیام پین شده
  gender?: 'male' | 'female';
  realUser?: boolean; // مشخص کردن کاربر واقعی برای چت ابری زنده
  theirUid?: string; // شناسه کاربر واقعی مقابل
  chatBackground?: string; // پس‌زمینه اختصاصی چت
  creatorName?: string; // نام سازنده گروه
  handle?: string; // شناسه گروه (آیدی تلگرامی)
  inviteLink?: string; // لینک دعوت گروه
}

export interface ChatSettings {
  userName: string;
  userProfilePic?: string; // تصویر پروفایل کاربر
  userAge?: string; // سن کاربر
  userPhone?: string; // شماره موبایل کاربر
  userId?: string; // شناسه منحصر به فرد کاربر در فایربیس
  userGender?: 'male' | 'female'; // جنسیت کاربر واقعی
  ttsEnabled: boolean;
  ttsAutoPlay: boolean;
  ttsVoice: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir'; 
  aiName?: string;
  aiAge?: string;
  aiProfilePic?: string;
  backgroundGradient?: string;
  persona?: PersonaType;
  customPersonaPrompt?: string;
  customRoleLabel?: string;
  chatFontSize?: '12px' | '14px' | '16px' | '18px' | '20px' | '22px';
  language?: 'fa' | 'en' | 'ar' | 'es';
}

export interface ChannelComment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: Date;
}

export interface ChannelPost {
  id: string;
  text: string;
  image?: string;
  timestamp: Date;
  views: number;
  likes: string[];
  comments: ChannelComment[];
  text_translations?: Partial<Record<'fa' | 'en' | 'ar' | 'es', string>>;
}

export interface Channel {
  id: string;
  ownerId: string;
  name: string;
  avatar: string;
  description: string;
  subscribersCount: number;
  posts: ChannelPost[];
  unreadCount?: number;
  isSubscribed?: boolean;
  handle?: string; // شناسه کانال (آیدی تلگرامی)
  inviteLink?: string; // لینک دعوت کانال
  name_translations?: Partial<Record<'fa' | 'en' | 'ar' | 'es', string>>;
  description_translations?: Partial<Record<'fa' | 'en' | 'ar' | 'es', string>>;
}
