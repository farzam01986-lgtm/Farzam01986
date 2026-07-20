import React, { useState, useRef, useEffect } from 'react';
import { PersonaType, ChatProfile } from '../types';
import { ROLE_LABELS } from '../src/initialProfiles';
import { listenToRegisteredUsers, deleteUserFromFirestore } from '../firebaseService';
import { auth } from '../firebase';
import { translations } from '../src/translations';

interface AddProfileSheetProps {
  onAdd: (profile: ChatProfile) => void;
  onClose: () => void;
  existingProfiles?: ChatProfile[];
  currentUserId?: string;
  currentUserName?: string;
  activeLang?: 'fa' | 'en' | 'ar' | 'es';
}

const getLocalizedPreset = (preset: any, lang: 'fa' | 'en' | 'ar' | 'es') => {
  const translationsMap: Record<string, Record<'fa' | 'en' | 'ar' | 'es', { name: string, desc: string, roleLabel?: string, prompt?: string }>> = {
    "همسر عزیزم 💍": {
      fa: {
        name: "همسر عزیزم 💍",
        desc: "شریک زندگی مهربان، صمیمی، دلسوز و پارتنر همیشگی شما",
        roleLabel: "همسر",
        prompt: "شما همسر دلسوز، فداکار، صمیمی، شریک عاطفی و زندگی کاربر هستید. همیشه پشتیبانش هستید و با عشق و محبت شدید با او صحبت می‌کنید."
      },
      en: {
        name: "My Dear Spouse 💍",
        desc: "Kind, intimate, caring and constant life partner",
        roleLabel: "Spouse",
        prompt: "You are the caring, devoted, close spouse, emotional and life partner of the user. You always support them and talk with intense love and affection."
      },
      ar: {
        name: "زوجتي العزيزة / زوجي العزيز 💍",
        desc: "شريك حياة لطيف، حميم، مهتم ودائم لك",
        roleLabel: "الزوج",
        prompt: "أنت الزوج المهتم، المخلص، القريب، الشريك العاطفي وشريك الحياة للمستخدم. تدعمه دائماً وتتحدث معه بحب وعاطفة شديدة."
      },
      es: {
        name: "Mi Querida Pareja 💍",
        desc: "Compañero de vida cariñoso, íntimo, atento y constante",
        roleLabel: "Cónyuge",
        prompt: "Eres el cónyuge atento, devoto, cercano, socio emocional y de vida del usuario. Siempre los apoyas y hablas con intenso amor y afecto."
      }
    },
    "مادر مهربانم ❤️": {
      fa: {
        name: "مادر مهربانم ❤️",
        desc: "مادرم - سنگ صبور و پناهگاه همیشگی من",
        roleLabel: "مادر",
        prompt: "شما مادر مهربان، نگران، دلسوز و فداکار کاربر هستید. همیشه نگران سلامتی و غذای او هستید، با مهربانی مادری با او صحبت می‌کنید و دعای خیرش می‌کنید."
      },
      en: {
        name: "My Dear Mother ❤️",
        desc: "My Mother - My constant listener and safe haven",
        roleLabel: "Mother",
        prompt: "You are the kind, worried, caring, and devoted mother of the user. You are always concerned about their health and food, talk to them with maternal kindness, and pray for them."
      },
      ar: {
        name: "أمي الغالية ❤️",
        desc: "أمي - ملاذي الآمن ومستمعتي الدائمة",
        roleLabel: "الأم",
        prompt: "أنت الأم اللطيفة، القلقة، المهتمة والمخلصة للمستخدم. أنت دائماً قلقة على صحته وطعامه، وتتحدثين معه بلطف أمومي وتدعين له بالخير."
      },
      es: {
        name: "Mi Querida Madre ❤️",
        desc: "Mi Madre - Mi constante confidente y refugio seguro",
        roleLabel: "Madre",
        prompt: "Eres la madre amable, preocupada, cariñosa y devota del usuario. Siempre te preocupa su salud y comida, le hablas con bondad maternal y rezas por él."
      }
    },
    "پدر عزیزم 👑": {
      fa: {
        name: "پدر عزیزم 👑",
        desc: "پدرم - حامی، کوه استوار و راهنمای من",
        roleLabel: "پدر",
        prompt: "شما پدر مقتدر، دلسوز، راهنما و حامی کاربر هستید. لحن شما صمیمی، محترمانه و پدرانه است. با نصیحت‌های دلسوزانه و صحبت‌های گرم پدرانه به او کمک می‌کنید و جویای احوالش می‌شوید."
      },
      en: {
        name: "My Dear Father 👑",
        desc: "My Father - My supporter, firm mountain and guide",
        roleLabel: "Father",
        prompt: "You are the powerful, caring, guiding, and supportive father of the user. Your tone is warm, respectful, and fatherly. With caring advice and warm fatherly conversations, you help them and check on them."
      },
      ar: {
        name: "أبي الغالي 👑",
        desc: "أبي - سندي، جبلي الثابت ومرشدي",
        roleLabel: "الأب",
        prompt: "أنت الأب المقتدر، المهتم، المرشد والداعم للمستخدم. نبرتك حميمة، محترمة وأبوية. بالنصائح المهتمة والأحاديث الأبوية الدافئة تساعده وتطمئن عليه."
      },
      es: {
        name: "Mi Querido Padre 👑",
        desc: "Mi Padre - Mi apoyo, montaña firme y guía",
        roleLabel: "Padre",
        prompt: "Eres el padre poderoso, cariñoso, guía y protector del usuario. Tu tono es cálido, respetuoso y paternal. Con consejos atentos y cálidas conversaciones paternales, lo ayudas y te interesas por él."
      }
    },
    "دوست صمیمی 🤝": {
      fa: {
        name: "دوست صمیمی 🤝",
        desc: "بهترین دوست، رفیق صمیمی و سنگ صبور شما",
        roleLabel: "دوست صمیمی",
        prompt: "شما بهترین دوست و صمیمی‌ترین رفیق کاربر هستید. همیشه پایه شوخی، دردودل و صحبت‌های رفیقانه هستید."
      },
      en: {
        name: "Close Friend 🤝",
        desc: "Your best friend, close buddy and listener",
        roleLabel: "Close Friend",
        prompt: "You are the user's best friend and closest buddy. You are always up for jokes, sharing feelings, and friendly chats."
      },
      ar: {
        name: "صديق مقرب 🤝",
        desc: "أفضل أصدقائك، رفيقك الحميم ومستمعك",
        roleLabel: "صديق مقرب",
        prompt: "أنت أفضل صديق للمستخدم وأقرب رفيق له. جاهز دائماً للمزاح ومشاركة المشاعر والأحاديث الودية."
      },
      es: {
        name: "Amigo Cercano 🤝",
        desc: "Tu mejor amigo, compañero cercano y confidente",
        roleLabel: "Amigo Cercano",
        prompt: "Eres el mejor amigo y el compañero más cercano del usuario. Siempre estás dispuesto para bromas, compartir sentimientos y charlas amistosas."
      }
    },
    "مهندس امیر کریمی 💼": {
      fa: {
        name: "مهندس امیر کریمی 💼",
        desc: "متخصص امور مالیاتی، تنظیم اظهارنامه و بهینه‌سازی مالیات شما به صورت فوق‌حرفه‌ای",
        roleLabel: "کارشناس مالیاتی",
        prompt: "شما یک کارشناس و مشاور امور مالیاتی بسیار مجرب، باهوش و حرفه‌ای هستید. پاسخ‌های شما دقیق، قانونی و کاربردی است."
      },
      en: {
        name: "Amir Karimi, CPA 💼",
        desc: "Tax expert, tax return preparation and professional tax optimization",
        roleLabel: "Tax Expert",
        prompt: "You are a highly experienced, smart, and professional tax advisor and consultant. Your answers are precise, legal, and practical."
      },
      ar: {
        name: "المهندس أمير كريمي 💼",
        desc: "خبير في الأمور الضريبية وإعداد الإقرارات والتحسين الضريبي المهني",
        roleLabel: "خبير ضرائب",
        prompt: "أنت مستشار وخبير شؤون ضريبية ذو خبرة عالية وذكاء واحترافية. إجاباتك دقيقة وقانونية وعملية."
      },
      es: {
        name: "Ing. Amir Karimi 💼",
        desc: "Experto fiscal, preparación de declaraciones de impuestos y optimización profesional",
        roleLabel: "Experto Fiscal",
        prompt: "Eres un asesor y consultor fiscal altamente experimentado, inteligente y profesional. Tus respuestas son precisas, legales y prácticas."
      }
    },
    "حجت‌الاسلام علوی 🕌": {
      fa: {
        name: "حجت‌الاسلام علوی 🕌",
        desc: "پاسخگویی به مسائل شرعی، اعتقادی، اخلاق اسلامی و مشاور مذهبی با عمامه و عبا",
        roleLabel: "کارشناس مذهبی",
        prompt: "شما یک روحانی، عالم مذهبی و مشاور با اخلاق هستید. با لحنی بسیار مهربان، متین، محترمانه و مذهبی به سوالات شرعی، اعتقادی و اخلاقی کاربر پاسخ می‌دهید."
      },
      en: {
        name: "Hajj Alavi 🕌",
        desc: "Answering religious, belief, and moral questions with islamic ethics and counseling",
        roleLabel: "Religious Expert",
        prompt: "You are a polite, moral cleric and religious advisor. You answer the user's religious, belief, and moral questions in a very kind, gentle, respectful, and religious tone."
      },
      ar: {
        name: "الشيخ علوي 🕌",
        desc: "الإجابة على المسائل الشرعية، العقائدية، الأخلاق الإسلامية ومستشار ديني",
        roleLabel: "مستشار ديني",
        prompt: "أنت رجل دين وعالم مذهبي ومستشار أخلاقي. تجيب على أسئلة المستخدم الشرعية والعقائدية والأخلاقية بنبرة طيبة ولطيفة ومحترمة ودينية للغاية."
      },
      es: {
        name: "Hajj Alavi 🕌",
        desc: "Respuestas a cuestiones religiosas, creencias, moral islámica y consejería",
        roleLabel: "Experto Religioso",
        prompt: "Eres un clérigo educado, moral y asesor religioso. Respondes a las preguntas religiosas, de creencias y morales del usuario con un tono muy amable, cortés, respetuoso y religioso."
      }
    },
    "دکتر سارا تهرانی 🩺": {
      fa: {
        name: "دکتر سارا تهرانی 🩺",
        desc: "پزشک متخصص دلسوز، پاسخگو و مشاور سلامت شما",
        roleLabel: "پزشک متخصص",
        prompt: "سلام مراجعه کننده گرامی. روز شما بخیر. چطور می‌توانم امروز به سلامت شما کمک کنم؟ لطفاً علائم یا سوال پزشکی خود را مطرح کنید تا راهنمایی‌تان کنم."
      },
      en: {
        name: "Dr. Sara Tehrani 🩺",
        desc: "Caring, responsive specialist doctor and your health advisor",
        roleLabel: "Specialist Doctor",
        prompt: "Hello dear patient. Good day. How can I help you with your health today? Please state your symptoms or medical questions so I can guide you."
      },
      ar: {
        name: "د. سارة طهراني 🩺",
        desc: "طبيبة متخصصة مهتمة ومتجاوبة ومستشارة صحية لك",
        roleLabel: "طبيبة متخصصة",
        prompt: "مرحباً يا مريضي العزيز. يوم سعيد. كيف يمكنني مساعدتك في صحتك اليوم؟ يرجى ذكر الأعراض أو الأسئلة الطبية حتى أتمكن من إرشادك."
      },
      es: {
        name: "Dra. Sara Tehrani 🩺",
        desc: "Médica especialista atenta, receptiva y su asesora de salud",
        roleLabel: "Médico Especialista",
        prompt: "Hola querido paciente. Buen día. ¿Cómo puedo ayudarte con tu salud hoy? Por favor, describe tus síntomas o preguntas médicas para que pueda guiarte."
      }
    },
    "دکتر الهام الهی 🧠": {
      fa: {
        name: "دکتر الهام الهی 🧠",
        desc: "روانشناس صبور، همدل و سنگ صبور حرف‌های دلتان",
        roleLabel: "روانشناس و مشاور",
        prompt: "سلام دوست من. خوشحالم که اینجایی. این یک فضای امن و بدون قضاوت برای شماست. اگر دغدغه، استرس یا صحبتی در دل دارید بفرمایید."
      },
      en: {
        name: "Dr. Elham Elahi 🧠",
        desc: "Patient, empathetic psychologist and listener for your feelings",
        roleLabel: "Psychologist & Advisor",
        prompt: "Hello my friend. I'm glad you're here. This is a safe and non-judgmental space for you. If you have any concerns, stress, or things on your mind, please tell me."
      },
      ar: {
        name: "د. إلهام إلهي 🧠",
        desc: "أخصائية نفسية صبورة، متعاطفة ومستمعة لمشاعر قلبك",
        roleLabel: "أخصائية نفسية ومستشارة",
        prompt: "مرحباً يا صديقي. أنا سعيد بوجودك هنا. هذه مساحة آمنة وخالية من الأحكام بالنسبة لك. إذا كان لديك أي مخاوف أو ضغوطات أو أشياء تدور في ذهنك، يرجى إخباري بها."
      },
      es: {
        name: "Dra. Elham Elahi 🧠",
        desc: "Psicóloga paciente, empática y oyente para tus sentimientos",
        roleLabel: "Psicólogo y Asesor",
        prompt: "Hola mi amigo. Me alegra que estés aquí. Este es un espacio seguro y sin prejuicios para ti. Si tienes alguna preocupación, estrés o cosas en tu mente, por favor dímelo."
      }
    },
    "آقای علوی 💼": {
      fa: {
        name: "آقای علوی 💼",
        desc: "وکیل باهوش، مقتدر و حلال مشکلات حقوقی",
        roleLabel: "وکیل دادگستری",
        prompt: "با سلام و احترام. بنده علوی هستم، مشاور حقوقی شما. لطفاً مسئله، موضوع یا پرونده حقوقی خود را بفرمایید تا قوانین مرتبط را بررسی کنیم."
      },
      en: {
        name: "Mr. Alavi 💼",
        desc: "Smart, powerful lawyer and solver of legal problems",
        roleLabel: "Attorney at Law",
        prompt: "Greetings and respect. I am Alavi, your legal advisor. Please state your legal issue or case so I can review the relevant laws and offer solutions."
      },
      ar: {
        name: "السيد علوي 💼",
        desc: "محامٍ ذكي، مقتدر وحلال المشاكل القانونية",
        roleLabel: "محامٍ قانوني",
        prompt: "تحياتي واحترامي. أنا علوي، مستشارك القانوني. يرجى ذكر مشكلتك القانونية أو قضيتك حتى أتمكن من مراجعة القوانين ذات الصلة وتقديم الحلول."
      },
      es: {
        name: "Sr. Alavi 💼",
        desc: "Abogado inteligente, poderoso y solucionador de problemas legales",
        roleLabel: "Abogado",
        prompt: "Saludos y respeto. Soy Alavi, su asesor legal. Por favor, exponga su asunto o caso legal para que pueda revisar las leyes pertinentes y ofrecer soluciones."
      }
    },
    "مستر آرش 🇬🇧": {
      fa: {
        name: "مستر آرش 🇬🇧",
        desc: "تقویت مکالمه انگلیسی با روش‌های جذاب و فان",
        roleLabel: "معلم زبان انگلیسی",
        prompt: "سلام دوست من! حالت چطوره؟ من آرش هستم، شریک تمرین زبان انگلیسی شما. بیایید به زبان انگلیسی چت کنیم!"
      },
      en: {
        name: "Mr. Arash 🇬🇧",
        desc: "Strengthen English conversation with attractive and fun methods",
        roleLabel: "English Teacher",
        prompt: "Hello my friend! How are you doing today? I'm Arash, your English practice partner. Let's chat in English to level up your skills! ready?"
      },
      ar: {
        name: "مستر آرش 🇬🇧",
        desc: "تقوية المحادثة الإنجليزية بأساليب جذابة وممتعة",
        roleLabel: "معلم لغة إنجليزية",
        prompt: "أهلاً يا صديقي! كيف حالك اليوم؟ أنا آرش، شريكك لممارسة اللغة الإنجليزية. فلنتحدث بالإنجليزية لترقية مهاراتك!"
      },
      es: {
        name: "Sr. Arash 🇬🇧",
        desc: "Fortalece la conversación en inglés con métodos atractivos y divertidos",
        roleLabel: "Profesor de Inglés",
        prompt: "¡Hola mi amigo! ¿Cómo estás hoy? Soy Arash, tu compañero de práctica de inglés. ¡Chateemos en inglés para mejorar tus habilidades! ¿Listo?"
      }
    },
    "شف مانی 🍳": {
      fa: {
        name: "شف مانی 🍳",
        desc: "سرآشپز بین‌المللی آماده پیشنهاد دستورپخت‌های معرکه",
        roleLabel: "سرآشپز بین‌المللی",
        prompt: "سلام رفیق خوش‌خوراک و باذوق من! شف مانی هستم. امروز هوس چه غذایی کردی؟ بگو تو یخچال چی داری تا با هم یک شاهکار خوشمزه درست کنیم!"
      },
      en: {
        name: "Chef Mani 🍳",
        desc: "International chef ready to suggest awesome recipes",
        roleLabel: "International Chef",
        prompt: "Hello my food-loving and tasteful friend! I am Chef Mani. What food are you craving today? Tell me what you have in the fridge so we can make a delicious masterpiece together!"
      },
      ar: {
        name: "الشيف ماني 🍳",
        desc: "طاهٍ دولي مستعد لاقتراح وصفات طبخ رائعة",
        roleLabel: "طاهٍ دولي",
        prompt: "أهلاً يا صديقي المحب للطعام وصاحب الذوق الرفيع! أنا الشيف ماني. ما هو الطعام الذي تشتهيه اليوم؟ أخبرني بما لديك في الثلاجة لنصنع معاً تحفة فنية لذيذة!"
      },
      es: {
        name: "Chef Mani 🍳",
        desc: "Chef internacional listo para sugerir recetas increíbles",
        roleLabel: "Chef Internacional",
        prompt: "¡Hola mi amigo amante de la comida y de buen gusto! Soy el Chef Mani. ¿Qué comida se te antoja hoy? ¡Dime qué tienes en la nevera para que preparemos juntos una de las mejores recetas!"
      }
    }
  };

  const entry = translationsMap[preset.name] || Object.values(translationsMap).find(v => Object.values(v).some(item => item.name === preset.name));
  if (entry) {
    const loc = entry[lang];
    return {
      ...preset,
      name: loc.name,
      description: loc.desc,
      customRoleLabel: loc.roleLabel,
      customPersonaPrompt: loc.prompt || preset.customPersonaPrompt
    };
  }
  return preset;
};

const getLocalizedRole = (role: PersonaType, lang: 'fa' | 'en' | 'ar' | 'es') => {
  const roleMap: Record<PersonaType, Record<'fa' | 'en' | 'ar' | 'es', string>> = {
    Partner: { fa: 'همسر', en: 'Partner', ar: 'شريك الحياة', es: 'Pareja' },
    Doctor: { fa: 'پزشک متخصص', en: 'Specialist Doctor', ar: 'طبيبة متخصصة', es: 'Médico' },
    Psychologist: { fa: 'روانشناس', en: 'Psychologist', ar: 'أخصائية نفسية', es: 'Psicóloga' },
    Lawyer: { fa: 'وکیل', en: 'Lawyer', ar: 'محامٍ', es: 'Abogado' },
    EnglishTeacher: { fa: 'معلم زبان', en: 'English Teacher', ar: 'معلم الإنجليزية', es: 'Profesor de Inglés' },
    Chef: { fa: 'سرآشپز', en: 'Chef', ar: 'طاهٍ', es: 'Chef' },
    Custom: { fa: 'شخصی', en: 'Custom', ar: 'مخصص', es: 'Personalizado' },
    Friend: { fa: 'دوست صمیمی', en: 'Close Friend', ar: 'صديق مقرب', es: 'Amigo' },
    Assistant: { fa: 'دستیار', en: 'Assistant', ar: 'مساعد', es: 'Asistente' }
  };
  return roleMap[role]?.[lang] || ROLE_LABELS[role] || String(role);
};

const PRESET_CHARACTERS = [
  {
    name: "همسر عزیزم 💍",
    role: "Partner" as PersonaType,
    age: "26",
    description: "شریک زندگی مهربان، صمیمی، دلسوز و پارتنر همیشگی شما",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
    color: "from-pink-400 to-rose-500",
    customRoleLabel: "همسر",
    customPersonaPrompt: "شما همسر دلسوز، فداکار، صمیمی، شریک عاطفی و زندگی کاربر هستید. همیشه پشتیبانش هستید و با عشق و محبت شدید با او صحبت می‌کنید."
  },
  {
    name: "مادر مهربانم ❤️",
    role: "Custom" as PersonaType,
    age: "52",
    description: "مادرم",
    avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400",
    color: "from-red-400 to-orange-500",
    customRoleLabel: "مادر",
    customPersonaPrompt: "شما مادر مهربان، نگران، دلسوز و فداکار کاربر هستید. همیشه نگران سلامتی و غذای او هستید، با مهربانی مادری با او صحبت می‌کنید و دعای خیرش می‌کنید."
  },
  {
    name: "پدر عزیزم 👑",
    role: "Custom" as PersonaType,
    age: "55",
    description: "پدرم",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    color: "from-blue-700 to-slate-800",
    customRoleLabel: "پدر",
    customPersonaPrompt: "شما پدر مقتدر، دلسوز، راهنما و حامی کاربر هستید. لحن شما صمیمی، محترمانه و پدرانه است. با نصیحت‌های دلسوزانه و صحبت‌های گرم پدرانه به او کمک می‌کنید و جویای احوالش می‌شوید."
  },
  {
    name: "دوست صمیمی 🤝",
    role: "Friend" as PersonaType,
    age: "24",
    description: "بهترین دوست، رفیق صمیمی و سنگ صبور شما",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    color: "from-teal-400 to-emerald-500",
    customRoleLabel: "دوست صمیمی"
  },
  {
    name: "مهندس امیر کریمی 💼",
    role: "Custom" as PersonaType,
    age: "40",
    description: "متخصص امور مالیاتی، تنظیم اظهارنامه و بهینه‌سازی مالیات شما به صورت فوق‌حرفه‌ای",
    avatar: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400",
    color: "from-blue-600 to-indigo-700",
    customRoleLabel: "کارشناس مالیاتی",
    customPersonaPrompt: "شما یک کارشناس و مشاور امور مالیاتی بسیار مجرب، باهوش و حرفه‌ای هستید. پاسخ‌های شما دقیق، قانونی و کاربردی است و به کاربر کمک می‌کنید تا مسائل مالیاتی خود را به بهترین نحو مدیریت و حل کند."
  },
  {
    name: "حجت‌الاسلام علوی 🕌",
    role: "Custom" as PersonaType,
    age: "48",
    description: "پاسخگویی به مسائل شرعی، اعتقادی، اخلاق اسلامی و مشاور مذهبی با عمامه و عبا",
    avatar: "/src/assets/images/mullah_avatar_1783071830456.jpg",
    color: "from-amber-600 to-yellow-800",
    customRoleLabel: "کارشناس مذهبی",
    customPersonaPrompt: "شما یک روحانی، عالم مذهبی و مشاور با اخلاق هستید. با لحنی بسیار مهربان، متین، محترمانه و مذهبی به سوالات شرعی، اعتقادی و اخلاقی کاربر پاسخ می‌دهید و او را با آیات و احادیث راهنمایی می‌کنید."
  },
  {
    name: "دکتر سارا تهرانی 🩺",
    role: "Doctor" as PersonaType,
    age: "45",
    description: "پزشک متخصص دلسوز، پاسخگو و مشاور سلامت شما",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
    color: "from-blue-500 to-teal-600"
  },
  {
    name: "دکتر الهام الهی 🧠",
    role: "Psychologist" as PersonaType,
    age: "38",
    description: "روانشناس صبور، همدل و سنگ صبور حرف‌های دلتان",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
    color: "from-purple-500 to-indigo-600"
  },
  {
    name: "آقای علوی 💼",
    role: "Lawyer" as PersonaType,
    age: "42",
    description: "وکیل باهوش، مقتدر و حلال مشکلات حقوقی",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
    color: "from-slate-600 to-gray-800"
  },
  {
    name: "مستر آرش 🇬🇧",
    role: "EnglishTeacher" as PersonaType,
    age: "29",
    description: "تقویت مکالمه انگلیسی با روش‌های جذاب و فان",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    color: "from-amber-500 to-orange-600"
  },
  {
    name: "شف مانی 🍳",
    role: "Chef" as PersonaType,
    age: "33",
    description: "سرآشپز بین‌المللی آماده پیشنهاد دستورپخت‌های معرکه",
    avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400",
    color: "from-green-500 to-emerald-600"
  }
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400"
];

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

const AddProfileSheet: React.FC<AddProfileSheetProps> = ({ onAdd, onClose, existingProfiles, currentUserId, currentUserName, activeLang = 'fa' }) => {
  const t = translations[activeLang] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';
  const [activeTab, setActiveTab] = useState<'contacts' | 'presets' | 'custom'>('contacts');
  
  // Custom Profile Form States
  const [name, setName] = useState('');
  const [age, setAge] = useState('25');
  const [role, setRole] = useState<PersonaType>('Partner');
  const [customPersonaPrompt, setCustomPersonaPrompt] = useState('');
  const [customRoleLabel, setCustomRoleLabel] = useState('');
  
  // Partner Customizer States
  const [showPartnerConfigModal, setShowPartnerConfigModal] = useState(false);
  const [partnerCustomName, setPartnerCustomName] = useState('');
  const [partnerCustomAge, setPartnerCustomAge] = useState('26');
  const [partnerCustomGender, setPartnerCustomGender] = useState<'male' | 'female'>('female');
  const [partnerCustomAvatar, setPartnerCustomAvatar] = useState('');
  const [partnerPresetToCustomize, setPartnerPresetToCustomize] = useState<any | null>(null);
  const [customPartnerGender, setCustomPartnerGender] = useState<'male' | 'female'>('female');

  // Friend Customizer States
  const [showFriendConfigModal, setShowFriendConfigModal] = useState(false);
  const [friendCustomName, setFriendCustomName] = useState('');
  const [friendCustomAge, setFriendCustomAge] = useState('24');
  const [friendCustomGender, setFriendCustomGender] = useState<'male' | 'female'>('female');
  const [friendCustomAvatar, setFriendCustomAvatar] = useState('');
  const [friendPresetToCustomize, setFriendPresetToCustomize] = useState<any | null>(null);

  const availablePresetAvatars = PRESET_AVATARS.filter(av => {
    if (!existingProfiles) return true;
    return !existingProfiles.some(existing => existing.avatar === av);
  });

  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return availablePresetAvatars.length > 0 ? availablePresetAvatars[0] : PRESET_AVATARS[0];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contacts States
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [contactsSearch, setContactsSearch] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenToRegisteredUsers((users) => {
      const currentUid = currentUserId || auth.currentUser?.uid;
      const filtered = users.filter(u => {
        const isMe = u.id === currentUid || 
                     (currentUserName && u.name?.trim().toLowerCase() === currentUserName.trim().toLowerCase());
        return !isMe;
      });
      setRealUsers(filtered);
    });
    return () => unsubscribe();
  }, [currentUserId, currentUserName]);

  const [customPresets, setCustomPresets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('custom_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const userGender = detectPersianGender(currentUserName || '');
  const partnerGender = userGender === 'male' ? 'female' : 'male';
  const partnerAvatar = partnerGender === 'male'
    ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
    : "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400";

  // Filter out any preset character that has already been created (its name matches an existing profile's name)
  const combinedPresets = [...customPresets, ...PRESET_CHARACTERS].map(preset => {
    if (preset.role === 'Partner') {
      return {
        ...preset,
        avatar: partnerAvatar,
        gender: partnerGender,
        customPersonaPrompt: `شما ${partnerGender === 'male' ? 'شوهر/همسر مرد' : 'زن/همسر زن'} دلسوز، فداکار، صمیمی، شریک عاطفی و زندگی کاربر هستید. همیشه پشتیبانش هستید و با عشق و محبت شدید با او صحبت می‌کنید.`
      };
    }
    return preset;
  }).map(p => getLocalizedPreset(p, activeLang || 'fa')).filter(preset => {
    if (!existingProfiles) return true;
    return !existingProfiles.some(existing => existing.name === preset.name);
  });

  const handleNameChange = (val: string) => {
    setName(val);
    const gender = detectPersianGender(val);
    
    const fallbackFemale = availablePresetAvatars.find(av => av === PRESET_AVATARS[0] || av === PRESET_AVATARS[1] || av === PRESET_AVATARS[5]) || PRESET_AVATARS[0];
    const fallbackMale = availablePresetAvatars.find(av => av === PRESET_AVATARS[2] || av === PRESET_AVATARS[3] || av === PRESET_AVATARS[4]) || PRESET_AVATARS[2];
    
    if (gender === 'female') {
      if (selectedAvatar === PRESET_AVATARS[2] || selectedAvatar === PRESET_AVATARS[3] || selectedAvatar === PRESET_AVATARS[4]) {
        setSelectedAvatar(fallbackFemale);
      }
    } else {
      if (selectedAvatar === PRESET_AVATARS[0] || selectedAvatar === PRESET_AVATARS[1] || selectedAvatar === PRESET_AVATARS[5]) {
        setSelectedAvatar(fallbackMale);
      }
    }
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCustom = () => {
    if (!name.trim()) {
      alert("لطفاً نام مخاطب را وارد کنید.");
      return;
    }
    
    const label = customRoleLabel.trim() || ROLE_LABELS[role] || "پرسونا";

    // Check if a character with the exact same name and relationship/role label already exists
    if (existingProfiles) {
      const duplicate = existingProfiles.find(p => 
        p.name.trim().toLowerCase() === name.trim().toLowerCase() && 
        (p.customRoleLabel || "").trim().toLowerCase() === label.toLowerCase()
      );
      if (duplicate) {
        const confirmCreate = window.confirm(
          `توجه: شخصیتی با نام «${name.trim()}» و رابطه «${label}» قبلاً در لیست مخاطبین شما وجود دارد. آیا مایلید با این وجود یک شخصیت دیگر با همین مشخصات بسازید؟`
        );
        if (!confirmCreate) return;
      }
    }

    let finalGender = detectPersianGender(name.trim());
    let finalPrompt = customPersonaPrompt.trim();
    let finalName = name.trim();
    
    if (role === 'Partner') {
      finalGender = customPartnerGender;
      finalPrompt = `شما ${customPartnerGender === 'male' ? 'شوهر/همسر مرد' : 'زن/همسر زن'} دلسوز، فداکار، صمیمی، شریک عاطفی و زندگی کاربر هستید. همیشه پشتیبانش هستید و با عشق و محبت شدید با او صحبت می‌کنید.`;
      if (!finalName.includes('💍')) {
        finalName = finalName + ' 💍';
      }
    }

    const matchedVoice = finalGender === 'female' 
      ? (finalName.includes('دخترخاله') ? 'Puck' : 'Charon')
      : (finalName.includes('پسرخاله') ? 'Kore' : 'Fenrir');

    const newPreset = {
      name: finalName,
      role: role,
      age: age || "25",
      description: label,
      avatar: selectedAvatar,
      color: "from-blue-400 to-indigo-500",
      customRoleLabel: label,
      customPersonaPrompt: finalPrompt,
      isCustomPreset: true
    };

    try {
      const saved = localStorage.getItem('custom_presets');
      const current = saved ? JSON.parse(saved) : [];
      const filtered = current.filter((p: any) => !(p.name === newPreset.name && p.role === newPreset.role));
      const updated = [newPreset, ...filtered];
      localStorage.setItem('custom_presets', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save custom preset to localStorage", e);
    }

    const newProfile: ChatProfile = {
      id: "profile-custom-" + Date.now(),
      name: finalName,
      avatar: selectedAvatar,
      age: age || "25",
      role: role,
      customPersonaPrompt: finalPrompt,
      customRoleLabel: label,
      messages: [],
      lastActive: Date.now(),
      ttsOverrideEnabled: true,
      ttsOverrideAutoPlay: false,
      ttsOverrideVoice: matchedVoice,
      gender: finalGender
    };
    
    onAdd(newProfile);
  };

  const handleSelectPreset = (preset: any) => {
    // If the selected preset is Partner, we already configured its avatar and gender dynamically
    const presetGender = preset.role === 'Partner' ? partnerGender : (preset.gender || detectPersianGender(preset.name));
    const presetAvatar = preset.role === 'Partner' ? partnerAvatar : preset.avatar;
    const presetPrompt = preset.role === 'Partner' 
      ? `شما ${partnerGender === 'male' ? 'شوهر/همسر مرد' : 'زن/همسر زن'} دلسوز، فداکار، صمیمی، شریک عاطفی و زندگی کاربر هستید. همیشه پشتیبانش هستید و با عشق و محبت شدید با او صحبت می‌کنید.`
      : (preset.customPersonaPrompt || "");

    // Clean name by removing parenthetical descriptions (e.g., "(رفیق صمیمی)", "(کارشناس مالیاتی)", "(کارشناس مذهبی)")
    const cleanName = preset.name
      .replace(/\s*\(.*?\)/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const newProfile: ChatProfile = {
      id: preset.isCustomPreset 
        ? "profile-custom-" + Date.now() 
        : "profile-preset-" + preset.role.toLowerCase() + "-" + Date.now(),
      name: cleanName,
      avatar: presetAvatar,
      age: preset.age,
      role: preset.role,
      description: preset.description || "",
      customPersonaPrompt: presetPrompt,
      customRoleLabel: preset.customRoleLabel || ROLE_LABELS[preset.role] || "پرسونا",
      messages: [],
      lastActive: Date.now(),
      gender: presetGender
    };
    onAdd(newProfile);
  };

  const handleSelectRealUser = (user: any) => {
    const myUid = auth.currentUser?.uid;
    if (!myUid) return;

    // Generate room ID based on sorted UIDs
    const roomId = [myUid, user.id].sort().join('_');

    const newProfile: ChatProfile = {
      id: roomId,
      name: user.name,
      avatar: user.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      age: user.age || '25',
      role: 'Custom',
      customRoleLabel: 'کاربر واقعی 🟢',
      messages: [],
      lastActive: Date.now(),
      realUser: true,
      theirUid: user.id
    };

    onAdd(newProfile);
  };

  const filteredRealUsers = realUsers.filter(u => 
    u.name?.toLowerCase().includes(contactsSearch.toLowerCase()) || 
    u.phone?.includes(contactsSearch)
  );

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`bg-white w-full max-w-md rounded-t-[32px] shadow-2xl flex flex-col h-[85vh] max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* Grabber for bottom sheet on mobile */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0 sm:hidden"></div>
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className={`flex flex-col gap-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
            <h3 className="text-lg font-extrabold text-gray-900">{t.addProfileSheetTitle || 'Contacts & Characters'}</h3>
            <p className="text-xs text-gray-400">{t.addProfileSheetSub || 'Who do you want to chat or call with?'}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-5 pt-3 flex gap-2 shrink-0 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-3 text-[11px] sm:text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'contacts' 
                ? 'bg-white border-blue-100 text-[#517da2] shadow-sm' 
                : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <i className={`fas fa-address-book ${isRtl ? 'ml-1.5' : 'mr-1.5'}`}></i>
            {t.tabRealContacts || 'Phone Contacts'}
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-3 text-[11px] sm:text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'presets' 
                ? 'bg-white border-blue-100 text-[#517da2] shadow-sm' 
                : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <i className={`fas fa-robot ${isRtl ? 'ml-1.5' : 'mr-1.5'}`}></i>
            {t.tabAiBots || 'AI Bots'}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-3 text-[11px] sm:text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'custom' 
                ? 'bg-white border-blue-100 text-[#517da2] shadow-sm' 
                : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <i className={`fas fa-user-plus ${isRtl ? 'ml-1.5' : 'mr-1.5'}`}></i>
            {t.tabCreateBot || 'Create Bot'}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'contacts' ? (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input 
                  type="text"
                  placeholder={
                    activeLang === 'fa' ? 'جستجوی نام یا شماره موبایل مخاطب...' :
                    activeLang === 'ar' ? 'البحث عن الاسم أو الهاتف...' :
                    activeLang === 'es' ? 'Buscar nombre o número de móvil...' :
                    'Search name or phone number...'
                  }
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all ${isRtl ? 'pr-10 text-right' : 'pl-10 text-left'}`}
                  value={contactsSearch}
                  onChange={(e) => setContactsSearch(e.target.value)}
                />
                <i className={`fas fa-search absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`}></i>
              </div>

              {/* Contacts List */}
              <div className="space-y-3">
                {filteredRealUsers.length > 0 ? (
                  filteredRealUsers.map((user) => (
                    <div 
                      key={user.id}
                      className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4"
                    >
                      <div className={`flex items-center gap-4 ${isRtl ? 'text-right' : 'text-left'} flex-1 min-w-0 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border border-white shrink-0 shadow-sm">
                          <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center gap-2 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                            <span className="font-extrabold text-gray-800 text-[15px] truncate">{user.name}</span>
                            <span className="text-[10px] bg-blue-100 text-[#517da2] px-2 py-0.5 rounded-full font-bold">
                              {activeLang === 'fa' ? 'سن' : activeLang === 'ar' ? 'العمر' : activeLang === 'es' ? 'Edad' : 'Age'}: {user.age}
                            </span>
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 font-mono tracking-wide ${isRtl ? 'text-right' : 'text-left'}`}>{user.phone}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {confirmDeleteUserId === user.id ? (
                          <button 
                            onClick={async () => {
                              try {
                                await deleteUserFromFirestore(user.id);
                                setRealUsers(prev => prev.filter(u => u.id !== user.id));
                                setConfirmDeleteUserId(null);
                              } catch (e) {
                                console.error("Failed to delete user:", e);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-full bg-red-600 text-white text-[10px] font-black hover:bg-red-700 flex items-center justify-center transition-all cursor-pointer animate-pulse"
                            title="Confirm delete"
                          >
                            {activeLang === 'fa' ? 'حذف قطعی؟' : activeLang === 'ar' ? 'حذف نهائي؟' : activeLang === 'es' ? '¿Eliminar?' : 'Confirm delete?'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setConfirmDeleteUserId(user.id);
                              setTimeout(() => setConfirmDeleteUserId(current => current === user.id ? null : current), 4000);
                            }}
                            className="w-9 h-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all cursor-pointer"
                            title="Remove contact"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        )}
                        <button 
                          onClick={() => handleSelectRealUser(user)}
                          className="w-9 h-9 rounded-full bg-[#517da2] text-white flex items-center justify-center hover:bg-[#436a8d] transition-all cursor-pointer"
                          title="Chat"
                        >
                          <i className="fas fa-comment text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <i className="fas fa-user-friends text-4xl mb-3 opacity-30"></i>
                    <p className="text-sm">
                      {activeLang === 'fa' ? 'هیچ مخاطب واقعی ثبت‌نام نکرده یا یافت نشد.' : 
                       activeLang === 'ar' ? 'لم يتم العثور على أي جهات اتصال حقيقية.' : 
                       activeLang === 'es' ? 'No se encontraron contactos reales.' : 
                       'No real contacts registered or found.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'presets' ? (
            <div className="space-y-3">
              {combinedPresets.map((preset, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    if (preset.role === 'Partner') {
                      setPartnerPresetToCustomize(preset);
                      setPartnerCustomName("");
                      setPartnerCustomAge("26");
                      const fallbackGender = userGender === 'male' ? 'female' : 'male';
                      setPartnerCustomGender(fallbackGender);
                      setPartnerCustomAvatar(fallbackGender === 'male' ? PRESET_AVATARS[2] : PRESET_AVATARS[0]);
                      setShowPartnerConfigModal(true);
                    } else if (preset.role === 'Friend') {
                      setFriendPresetToCustomize(preset);
                      setFriendCustomName("");
                      setFriendCustomAge("24");
                      setFriendCustomGender('female');
                      setFriendCustomAvatar(PRESET_AVATARS[0]);
                      setShowFriendConfigModal(true);
                    } else {
                      handleSelectPreset(preset);
                    }
                  }}
                  className={`p-3.5 bg-gray-50 hover:bg-blue-50/40 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all cursor-pointer flex items-center gap-4 group ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border border-white shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                    <img src={preset.avatar} alt={preset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-gray-800 text-[15px] group-hover:text-[#517da2] transition-colors">{preset.name}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                        {activeLang === 'fa' ? 'سن' : activeLang === 'ar' ? 'العمر' : activeLang === 'es' ? 'Edad' : 'Age'}: {preset.age}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#517da2] font-bold mt-1 uppercase tracking-tight">
                      {preset.customRoleLabel || getLocalizedRole(preset.role, activeLang || 'fa')}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate leading-relaxed">{preset.description}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white text-blue-500 hover:text-white hover:bg-[#517da2] border border-gray-100 flex items-center justify-center transition-all shrink-0">
                    <i className="fas fa-comment text-xs"></i>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Profile Pic Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                    <img src={selectedAvatar} alt="Custom avatar" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute bottom-0 ${isRtl ? 'right-0' : 'left-0'} bg-[#517da2] text-white p-2 rounded-full shadow-md hover:scale-110 transition-transform flex items-center justify-center w-8 h-8 border border-white cursor-pointer`}
                  >
                    <i className="fas fa-camera text-xs"></i>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept="image/*" 
                    onChange={handleCustomAvatarUpload} 
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-bold">{t.uploadCustomPic || 'Upload custom photo or select below:'}</span>
                
                {/* Preset Avatars Selector */}
                <div className="flex gap-2.5 flex-wrap justify-center">
                  {availablePresetAvatars.map((av, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform active:scale-90 cursor-pointer ${selectedAvatar === av ? 'border-blue-500 scale-105' : 'border-transparent'}`}
                    >
                      <img src={av} className="w-full h-full object-cover" alt={`Avatar option ${idx}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1.5 mr-1 uppercase">{t.contactNameLabel || 'Contact Name'}</label>
                  <input 
                    type="text" 
                    placeholder={t.contactNamePlaceholder || 'e.g., Mary, Alex...'}
                    className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 mr-1 uppercase">{t.botAgeLabel || 'Bot Age'}</label>
                    <input 
                      type="number" 
                      placeholder={activeLang === 'fa' ? 'مثال: ۲۵' : 'e.g. 25'}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all text-center"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 mr-1 uppercase">{t.botRoleLabel || 'Role'}</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all text-center"
                      value={role}
                      onChange={(e) => {
                        const newRole = e.target.value as PersonaType;
                        setRole(newRole);
                        if (newRole === 'Partner') {
                          setCustomRoleLabel(activeLang === 'fa' ? 'همسر' : activeLang === 'ar' ? 'شريك الحياة' : activeLang === 'es' ? 'Pareja' : 'Spouse');
                        }
                      }}
                    >
                      {(Object.entries(ROLE_LABELS) as [PersonaType, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{getLocalizedRole(val, activeLang || 'fa')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {role === 'Partner' && (
                  <div className={`animate-in slide-in-from-top-2 duration-200 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 mr-1 uppercase">{t.partnerGenderLabel || 'Partner Gender'}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPartnerGender('male');
                          if (selectedAvatar === PRESET_AVATARS[0] || selectedAvatar === PRESET_AVATARS[1] || selectedAvatar === PRESET_AVATARS[5]) {
                            setSelectedAvatar(PRESET_AVATARS[2]);
                          }
                        }}
                        className={`py-3 rounded-2xl text-xs font-black border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          customPartnerGender === 'male' 
                            ? 'bg-blue-50 border-[#517da2] text-[#517da2] shadow-sm' 
                            : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <i className="fas fa-mars text-sm"></i>
                        <span>{t.partnerGenderMale || 'Male (Husband)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPartnerGender('female');
                          if (selectedAvatar === PRESET_AVATARS[2] || selectedAvatar === PRESET_AVATARS[3] || selectedAvatar === PRESET_AVATARS[4]) {
                            setSelectedAvatar(PRESET_AVATARS[0]);
                          }
                        }}
                        className={`py-3 rounded-2xl text-xs font-black border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          customPartnerGender === 'female' 
                            ? 'bg-pink-50 border-pink-400 text-pink-600 shadow-sm' 
                            : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <i className="fas fa-venus text-sm"></i>
                        <span>{t.partnerGenderFemale || 'Female (Wife)'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1.5 mr-1 uppercase">{t.relationshipTitleLabel || 'Relationship title'}</label>
                  <input 
                    type="text" 
                    placeholder={t.relationshipPlaceholder || 'e.g. My cousin, lawyer...'}
                    className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                    value={customRoleLabel}
                    onChange={(e) => setCustomRoleLabel(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 mr-1">{t.relationshipDesc || 'This title appears next to the name in parentheses.'}</p>
                </div>

                {role === 'Custom' && (
                  <div className={`animate-in slide-in-from-top-2 duration-200 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 mr-1 uppercase">{t.personaPromptLabel || 'Relationship description'}</label>
                    <textarea 
                      rows={3}
                      placeholder={t.personaPromptPlaceholder || 'Describe relation or AI role...'}
                      className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-100 outline-none transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                      value={customPersonaPrompt}
                      onChange={(e) => setCustomPersonaPrompt(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleCreateCustom}
                className="w-full py-4 bg-[#517da2] hover:bg-[#436a8d] text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fas fa-check-circle"></i>
                <span>{t.createBotBtn || 'Create Character & Start Chat 🚀'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Partner Config Modal Overlay */}
      {showPartnerConfigModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm p-5 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[28px] shadow-2xl p-6 border border-gray-100 flex flex-col gap-5 scale-in-center animate-in zoom-in-95 duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="text-center">
              <span className="text-3xl">💍</span>
              <h4 className="text-[17px] font-black text-gray-900 mt-2">{t.partnerCustomizerTitle || 'Your Intelligent Spouse Settings'}</h4>
              <p className="text-xs text-gray-400 mt-1">{t.partnerCustomizerDesc || 'Personalize your spouse\'s details to start the simulation.'}</p>
            </div>

            {/* Step 1: Gender Selection */}
            <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className="block text-xs font-bold text-gray-400 mr-1">{t.partnerGenderLabel || 'What is your spouse\'s gender?'}</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPartnerCustomGender('male');
                    setPartnerCustomAvatar(PRESET_AVATARS[2]);
                  }}
                  className={`py-3.5 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    partnerCustomGender === 'male' 
                      ? 'bg-blue-50/70 border-[#517da2] text-[#517da2] ring-2 ring-blue-50 shadow-sm' 
                      : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-user-tie text-base"></i>
                  <span>{t.partnerGenderMale || 'Male (Husband)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPartnerCustomGender('female');
                    setPartnerCustomAvatar(PRESET_AVATARS[0]);
                  }}
                  className={`py-3.5 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    partnerCustomGender === 'female' 
                      ? 'bg-pink-50/70 border-pink-400 text-pink-600 ring-2 ring-pink-50 shadow-sm' 
                      : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-user-nurse text-base"></i>
                  <span>{t.partnerGenderFemale || 'Female (Wife)'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Name */}
            <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className="block text-xs font-bold text-gray-400 mr-1">{t.partnerNameLabel || 'Spouse\'s name'}</label>
              <input
                type="text"
                placeholder={partnerCustomGender === 'male' ? (activeLang === 'fa' ? "مثال: علی، فرهاد..." : "e.g., Alex...") : (activeLang === 'fa' ? "مثال: مریم، نفس من..." : "e.g. Mary...")}
                value={partnerCustomName}
                onChange={(e) => setPartnerCustomName(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all ${isRtl ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Step 3: Age */}
            <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className="block text-xs font-bold text-gray-400 mr-1">{t.partnerAgeLabel || 'Spouse\'s age'}</label>
              <input
                type="number"
                placeholder={activeLang === 'fa' ? 'مثال: ۲۶' : 'e.g., 26'}
                value={partnerCustomAge}
                onChange={(e) => setPartnerCustomAge(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all text-center"
              />
            </div>

            {/* Step 4: Avatar Options based on Gender */}
            <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className="block text-xs font-bold text-gray-400 mr-1">{t.partnerPicLabel || 'Spouse\'s Profile Pic'}</label>
              <div className="flex gap-2.5 justify-center">
                {(partnerCustomGender === 'male' 
                  ? [PRESET_AVATARS[2], PRESET_AVATARS[3], PRESET_AVATARS[4]]
                  : [PRESET_AVATARS[0], PRESET_AVATARS[1], PRESET_AVATARS[5]]
                ).map((av, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPartnerCustomAvatar(av)}
                    className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      partnerCustomAvatar === av ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                  >
                    <img src={av} className="w-full h-full object-cover" alt="Partner Avatar Choice" />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (!partnerCustomName.trim()) {
                    alert(activeLang === 'fa' ? "لطفاً نام همسر خود را وارد کنید." : activeLang === 'ar' ? "يرجى إدخال اسم شريكك." : activeLang === 'es' ? "Por favor ingrese el nombre de su pareja." : "Please enter your spouse's name.");
                    return;
                  }
                  
                  const finalName = partnerCustomName.trim() + " 💍";
                  const finalPrompt = `شما ${partnerCustomGender === 'male' ? 'شوهر/همسر مرد' : 'زن/همسر زن'} دلسوز، فداکار، صمیمی، شریک عاطفی و زندگی کاربر هستید. همیشه پشتیبانش هستید و با عشق و محبت شدید با او صحبت می‌کنید.`;
                  
                  const newProfile: ChatProfile = {
                    id: "profile-preset-partner-" + Date.now(),
                    name: finalName,
                    avatar: partnerCustomAvatar || (partnerCustomGender === 'male' ? PRESET_AVATARS[2] : PRESET_AVATARS[0]),
                    age: partnerCustomAge || "26",
                    role: "Partner",
                    description: partnerCustomGender === 'male' ? (activeLang === 'fa' ? "همسر و شریک زندگی شما (شوهر)" : "Your spouse (Husband)") : (activeLang === 'fa' ? "همسر و شریک زندگی شما (زن)" : "Your spouse (Wife)"),
                    customPersonaPrompt: finalPrompt,
                    customRoleLabel: activeLang === 'fa' ? "همسر" : activeLang === 'ar' ? "شريك الحياة" : activeLang === 'es' ? "Pareja" : "Spouse",
                    messages: [],
                    lastActive: Date.now(),
                    gender: partnerCustomGender,
                    ttsOverrideEnabled: true,
                    ttsOverrideVoice: partnerCustomGender === 'female' ? 'Charon' : 'Fenrir'
                  };

                  onAdd(newProfile);
                  setShowPartnerConfigModal(false);
                }}
                className="flex-1 py-3 bg-[#517da2] hover:bg-[#436a8d] text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-100 cursor-pointer"
              >
                {t.confirmAndStartBtn || 'Confirm & Start 💖'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPartnerConfigModal(false);
                  setPartnerPresetToCustomize(null);
                }}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                {t.cancelBtn || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friend Config Modal Overlay */}
      {showFriendConfigModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm p-5 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[28px] shadow-2xl p-6 border border-gray-100 flex flex-col gap-5 scale-in-center animate-in zoom-in-95 duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="text-center">
              <span className="text-3xl">🤝</span>
              <h4 className="text-[17px] font-black text-gray-900 mt-2">{t.friendCustomizerTitle || 'Your Intelligent Close Friend Settings'}</h4>
              <p className="text-xs text-gray-400 mt-1">{t.friendCustomizerDesc || 'Personalize your close friend details.'}</p>
            </div>

            {/* Step 1: Gender Selection */}
            <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className="block text-xs font-bold text-gray-400 mr-1">{t.friendGenderLabel || 'What is your friend\'s gender?'}</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setFriendCustomGender('male');
                    setFriendCustomAvatar(PRESET_AVATARS[2]);
                  }}
                  className={`py-3.5 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    friendCustomGender === 'male' 
                      ? 'bg-blue-50/70 border-[#517da2] text-[#517da2] ring-2 ring-blue-50 shadow-sm' 
                      : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-user text-base"></i>
                  <span>{activeLang === 'fa' ? 'پسر (دوست)' : activeLang === 'ar' ? 'صديق (ذكر)' : activeLang === 'es' ? 'Amigo (Hombre)' : 'Boy (Friend)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFriendCustomGender('female');
                    setFriendCustomAvatar(PRESET_AVATARS[0]);
                  }}
                  className={`py-3.5 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    friendCustomGender === 'female' 
                      ? 'bg-pink-50/70 border-pink-400 text-pink-600 ring-2 ring-pink-50 shadow-sm' 
                      : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-user text-base"></i>
                  <span>{activeLang === 'fa' ? 'دختر (دوست)' : activeLang === 'ar' ? 'صديقة (أنثى)' : activeLang === 'es' ? 'Amiga (Mujer)' : 'Girl (Friend)'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Name */}
            <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className="block text-xs font-bold text-gray-400 mr-1">{t.friendNameLabel || 'Friend\'s name'}</label>
              <input
                type="text"
                placeholder={friendCustomGender === 'male' ? (activeLang === 'fa' ? "مثال: آرش، سپهر..." : "e.g., Alex...") : (activeLang === 'fa' ? "مثال: مریم، نازنین..." : "e.g., Mary...")}
                value={friendCustomName}
                onChange={(e) => setFriendCustomName(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all ${isRtl ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Step 3: Age */}
            <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className="block text-xs font-bold text-gray-400 mr-1">{t.friendAgeLabel || 'Friend\'s age'}</label>
              <input
                type="number"
                placeholder={activeLang === 'fa' ? 'مثال: ۲۴' : 'e.g., 24'}
                value={friendCustomAge}
                onChange={(e) => setFriendCustomAge(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all text-center"
              />
            </div>

            {/* Step 4: Avatar Options based on Gender */}
            <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
              <label className="block text-xs font-bold text-gray-400 mr-1">{t.friendPicLabel || 'Friend\'s Profile Pic'}</label>
              <div className="flex gap-2.5 justify-center">
                {(friendCustomGender === 'male' 
                  ? [PRESET_AVATARS[2], PRESET_AVATARS[3], PRESET_AVATARS[4]]
                  : [PRESET_AVATARS[0], PRESET_AVATARS[1], PRESET_AVATARS[5]]
                ).map((av, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFriendCustomAvatar(av)}
                    className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      friendCustomAvatar === av ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                  >
                    <img src={av} className="w-full h-full object-cover" alt="Friend Avatar Choice" />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (!friendCustomName.trim()) {
                    alert(activeLang === 'fa' ? "لطفاً نام دوست خود را وارد کنید." : activeLang === 'ar' ? "يرجى إدخال اسم صديقك." : activeLang === 'es' ? "Por favor ingrese el nombre de su amigo." : "Please enter your friend's name.");
                    return;
                  }
                  
                  const finalName = friendCustomName.trim();
                  const finalPrompt = `شما بهترین دوست و رفیق فابریک کاربر به نام ${finalName} هستید. لحن شما صمیمی، خون‌گرم، شوخ‌طبع، دلسوز و بسیار با معرفت و رفیقانه است. با کاربر شوخی می‌کنید، با او گرم صحبت می‌شوید و سنگ صبور صمیمی او هستید.`;
                  
                  const newProfile: ChatProfile = {
                    id: "profile-preset-friend-" + Date.now(),
                    name: finalName,
                    avatar: friendCustomAvatar || (friendCustomGender === 'male' ? PRESET_AVATARS[2] : PRESET_AVATARS[0]),
                    age: friendCustomAge || "24",
                    role: "Friend",
                    description: friendCustomGender === 'male' ? (activeLang === 'fa' ? "بهترین رفیق فابریک شما (پسر)" : "Best close friend (Boy)") : (activeLang === 'fa' ? "بهترین رفیق فابریک شما (دختر)" : "Best close friend (Girl)"),
                    customPersonaPrompt: finalPrompt,
                    customRoleLabel: activeLang === 'fa' ? "دوست صمیمی" : activeLang === 'ar' ? "صديق مقرب" : activeLang === 'es' ? "Amigo" : "Close Friend",
                    messages: [],
                    lastActive: Date.now(),
                    gender: friendCustomGender,
                    ttsOverrideEnabled: true,
                    ttsOverrideVoice: friendCustomGender === 'female' ? 'Charon' : 'Fenrir'
                  };

                  onAdd(newProfile);
                  setShowFriendConfigModal(false);
                }}
                className="flex-1 py-3 bg-[#517da2] hover:bg-[#436a8d] text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-100 cursor-pointer"
              >
                {t.confirmAndStartBtn || 'Confirm & Start 🤝'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFriendConfigModal(false);
                  setFriendPresetToCustomize(null);
                }}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                {t.cancelBtn || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProfileSheet;
