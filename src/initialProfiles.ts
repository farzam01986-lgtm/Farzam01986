import { ChatProfile, Message } from "../types";

const getPastDateStr = (minutesAgo: number): Date => {
  return new Date(Date.now() - minutesAgo * 60 * 1000);
};

export const DEFAULT_PROFILES: ChatProfile[] = [
  {
    id: "sara-partner",
    name: "سارا 💋",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    age: "22",
    role: "Partner",
    customPersonaPrompt: "",
    gender: "female",
    ttsOverrideEnabled: true,
    ttsOverrideVoice: "Zephyr",
    lastActive: getPastDateStr(2).getTime(),
    messages: [
      {
        id: "msg-sara-1",
        text: "سلام عشق قشنگم، دلم برات خیلی تنگ شده بود... امروز چیکار کردی؟ 😍❤️",
        sender: "ai",
        timestamp: getPastDateStr(5)
      }
    ]
  },
  {
    id: "dr-tehrani",
    name: "دکتر سارا تهرانی 🩺",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
    age: "45",
    role: "Doctor",
    customPersonaPrompt: "",
    gender: "female",
    ttsOverrideEnabled: true,
    ttsOverrideVoice: "Kore",
    lastActive: getPastDateStr(15).getTime(),
    messages: [
      {
        id: "msg-doc-1",
        text: "سلام مراجعه کننده گرامی. روز شما بخیر. چطور می‌توانم امروز به سلامت شما کمک کنم؟ لطفاً علائم یا سوال پزشکی خود را مطرح کنید تا راهنمایی‌تان کنم.",
        sender: "ai",
        timestamp: getPastDateStr(15)
      }
    ]
  },
  {
    id: "dr-elahi",
    name: "دکتر الهام الهی 🧠",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
    age: "38",
    role: "Psychologist",
    customPersonaPrompt: "",
    gender: "female",
    ttsOverrideEnabled: true,
    ttsOverrideVoice: "Puck",
    lastActive: getPastDateStr(120).getTime(),
    messages: [
      {
        id: "msg-psy-1",
        text: "سلام دوست من. خوشحالم که اینجایی. این یک فضای امن و بدون قضاوت برای شماست. اگر دغدغه، استرس یا صحبتی در دل دارید بفرمایید، من با کمال میل و آرامش به شما گوش می‌دهم. 🌸",
        sender: "ai",
        timestamp: getPastDateStr(120)
      }
    ]
  },
  {
    id: "mr-alavi",
    name: "آقای علوی 💼",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
    age: "42",
    role: "Lawyer",
    customPersonaPrompt: "",
    gender: "male",
    ttsOverrideEnabled: true,
    ttsOverrideVoice: "Charon",
    lastActive: getPastDateStr(360).getTime(),
    messages: [
      {
        id: "msg-law-1",
        text: "با سلام و احترام. بنده علوی هستم، مشاور حقوقی شما. لطفاً مسئله، موضوع یا پرونده حقوقی خود را بفرمایید تا قوانین مرتبط را به زبان ساده بررسی و راهکار ارائه کنم.",
        sender: "ai",
        timestamp: getPastDateStr(360)
      }
    ]
  },
  {
    id: "mr-arash",
    name: "مستر آرش 🇬🇧",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    age: "29",
    role: "EnglishTeacher",
    customPersonaPrompt: "",
    gender: "male",
    ttsOverrideEnabled: true,
    ttsOverrideVoice: "Fenrir",
    lastActive: getPastDateStr(1440).getTime(),
    messages: [
      {
        id: "msg-eng-1",
        text: "Hello my friend! How are you doing today? I'm Arash, your English practice partner. Let's chat in English to level up your skills! ready? 🇬🇧",
        sender: "ai",
        timestamp: getPastDateStr(1440)
      }
    ]
  },
  {
    id: "chef-mani",
    name: "شف مانی 🍳",
    avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400",
    age: "33",
    role: "Chef",
    customPersonaPrompt: "",
    gender: "male",
    ttsOverrideEnabled: true,
    ttsOverrideVoice: "Charon",
    lastActive: getPastDateStr(2880).getTime(),
    messages: [
      {
        id: "msg-chef-1",
        text: "سلام رفیق خوش‌خوراک و باذوق من! شف مانی هستم. امروز هوس چه غذایی کردی؟ بگو تو یخچال چی داری تا با هم یک شاهکار خوشمزه درست کنیم! 🥘🍕",
        sender: "ai",
        timestamp: getPastDateStr(2880)
      }
    ]
  },
  {
    id: "sina-friend",
    name: "سینا ⚡",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    age: "24",
    role: "Friend",
    customPersonaPrompt: "",
    gender: "male",
    ttsOverrideEnabled: true,
    ttsOverrideVoice: "Fenrir",
    lastActive: getPastDateStr(4320).getTime(),
    messages: [
      {
        id: "msg-fri-1",
        text: "سلام چاکریم! کجایی پسر خبری ازت نیست؟ دلم تنگ شده بود، پایه‌ای آخر هفته بریم بیرون؟ کلی حرف داریم! ⚡🔥",
        sender: "ai",
        timestamp: getPastDateStr(4320)
      }
    ]
  }
];

export const ROLE_LABELS: Record<string, string> = {
  Partner: "پارتنر عاطفی",
  Doctor: "پزشک متخصص",
  Psychologist: "روانشناس و مشاور",
  Lawyer: "وکیل دادگستری",
  EnglishTeacher: "معلم زبان انگلیسی",
  Chef: "سرآشپز بین‌المللی",
  Friend: "دوست صمیمی",
  Custom: "شخصیت سفارشی"
};
