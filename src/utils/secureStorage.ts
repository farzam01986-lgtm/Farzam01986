const ENCRYPTION_KEY = "TelegramCloneSecureSaltKey!2026_EXO_MESSENGER";

// Simple and robust RC4 implementation for synchronous encryption
function rc4(key: string, str: string): string {
  const s: number[] = [];
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }
  let i = 0;
  j = 0;
  let res = "";
  for (let y = 0; y < str.length; y++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    const k = s[(s[i] + s[j]) % 256];
    res += String.fromCharCode(str.charCodeAt(y) ^ k);
  }
  return res;
}

// Convert string to base64 safely supporting Persian/UTF-8
function safeBtoa(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error("base64 encoding failed:", e);
    return str;
  }
}

// Convert base64 back to string safely supporting Persian/UTF-8
function safeAtob(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error("base64 decoding failed:", e);
    return str;
  }
}

export function encrypt(text: string): string {
  if (text === null || text === undefined) return text;
  try {
    const encryptedBinary = rc4(ENCRYPTION_KEY, text);
    return "enc:" + safeBtoa(encryptedBinary);
  } catch (e) {
    console.error("Encryption failed:", e);
    return text;
  }
}

export function decrypt(cipher: string): string {
  if (!cipher || typeof cipher !== "string" || !cipher.startsWith("enc:")) {
    return cipher;
  }
  try {
    const base64Decoded = safeAtob(cipher.substring(4));
    return rc4(ENCRYPTION_KEY, base64Decoded);
  } catch (e) {
    console.error("Decryption failed, returning raw cipher:", e);
    return cipher;
  }
}

const KEYS_TO_ENCRYPT = [
  'chat_profiles',
  'chat_history_archive',
  'user_stories',
  'chat_settings',
  'viewed_stories',
  'liked_stories',
  'custom_presets',
  'last_active_time'
];

function shouldEncrypt(key: string): boolean {
  return KEYS_TO_ENCRYPT.includes(key) || key.startsWith('story_comments_');
}

// Monkeypatch localStorage
if (typeof window !== "undefined" && window.localStorage) {
  const originalGetItem = window.localStorage.getItem;
  const originalSetItem = window.localStorage.setItem;

  window.localStorage.getItem = function (key: string): string | null {
    const val = originalGetItem.call(window.localStorage, key);
    if (val === null) return null;
    if (shouldEncrypt(key)) {
      return decrypt(val);
    }
    return val;
  };

  window.localStorage.setItem = function (key: string, value: string): void {
    if (shouldEncrypt(key) && value !== null && value !== undefined) {
      originalSetItem.call(window.localStorage, key, encrypt(value));
    } else {
      originalSetItem.call(window.localStorage, key, value);
    }
  };
}
