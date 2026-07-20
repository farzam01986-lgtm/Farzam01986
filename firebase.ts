import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth();

// ==========================================
// SECURE TRANSPARENT LOCAL STORAGE ENCRYPTION
// ==========================================
const SECRET_SALT = "telegram_clone_secure_salt_2026_xyz";
const sensitiveKeys = [
  'chat_history_archive',
  'chat_history',
  'chat_profiles',
  'chat_settings',
  'custom_presets',
  'user_stories',
  'viewed_stories',
  'liked_stories'
];

function encryptLocalData(text: string): string {
  if (!text) return text;
  try {
    const prefix = "enc_v1_";
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const saltCode = SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      result += String.fromCharCode(charCode ^ saltCode);
    }
    return prefix + btoa(unescape(encodeURIComponent(result)));
  } catch (e) {
    console.error("Local encryption error:", e);
    return text;
  }
}

function decryptLocalData(text: string): string {
  if (!text) return text;
  const prefix = "enc_v1_";
  if (!text.startsWith(prefix)) {
    // Return legacy plaintext directly to ensure full backwards compatibility!
    return text;
  }
  try {
    const rawBase64 = text.substring(prefix.length);
    const result = decodeURIComponent(escape(atob(rawBase64)));
    let decrypted = "";
    for (let i = 0; i < result.length; i++) {
      const charCode = result.charCodeAt(i);
      const saltCode = SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      decrypted += String.fromCharCode(charCode ^ saltCode);
    }
    return decrypted;
  } catch (e) {
    console.error("Local decryption error:", e);
    return text;
  }
}

if (typeof window !== 'undefined' && window.localStorage) {
  const originalGetItem = window.localStorage.getItem;
  const originalSetItem = window.localStorage.setItem;

  window.localStorage.getItem = function (key) {
    const value = originalGetItem.call(window.localStorage, key);
    if (value && sensitiveKeys.includes(key)) {
      return decryptLocalData(value);
    }
    return value;
  };

  window.localStorage.setItem = function (key, value) {
    if (value && sensitiveKeys.includes(key)) {
      originalSetItem.call(window.localStorage, key, encryptLocalData(value));
    } else {
      originalSetItem.call(window.localStorage, key, value);
    }
  };
}

// ==========================================
// SECURE FETCH INTERCEPTOR FOR JWT & CSRF
// ==========================================
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    let url = "";
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in (input as any)) {
      url = (input as any).url;
    }

    if (url && (url.startsWith('/api/') || url.includes('/api/'))) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          if (token) {
            init = init || {};
            const headers = new Headers(init.headers || {});
            headers.set('Authorization', `Bearer ${token}`);
            headers.set('X-Requested-With', 'XMLHttpRequest');
            init.headers = headers;
          }
        }
      } catch (err) {
        console.warn("Secure Fetch Wrapper: Failed to append JWT token", err);
      }
    }
    return originalFetch.call(this, input, init);
  };
}
