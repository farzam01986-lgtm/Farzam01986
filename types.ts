
export type PersonaType = 'Doctor' | 'Partner' | 'Friend' | 'Assistant' | 'Custom';

export interface Message {
  id: string;
  text: string;
  image?: string; 
  sender: 'user' | 'ai';
  timestamp: Date;
  audioBase64?: string; // ذخیره موقت صدا در صورت نیاز
}

export interface ChatSettings {
  aiName: string;
  aiProfilePic: string;
  backgroundGradient: string;
  persona: PersonaType;
  customPersonaPrompt: string;
  ttsEnabled: boolean;
  ttsAutoPlay: boolean;
  ttsVoice: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir'; 
}
