import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata'
];

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener. Call this on app load.
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Handle Google Login and capture the Access Token
export const loginWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    DRIVE_SCOPES.forEach(scope => provider.addScope(scope));

    // Optional: force consent or prompt to choose account to ensure clean token
    provider.setCustomParameters({
      prompt: 'consent'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive login error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setDriveAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

// List backup JSON files from Google Drive
export const listBackupFiles = async (token: string): Promise<DriveFile[]> => {
  const query = "name contains 'messenger_backup_' and mimeType = 'application/json' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive list failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
};

// Upload a new backup JSON to Google Drive
export const uploadBackupFile = async (token: string, backupData: any): Promise<DriveFile> => {
  const fileName = `messenger_backup_${new Date().toISOString().split('T')[0]}_${Math.random().toString(36).substring(7)}.json`;
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'EXO Messenger Backup Data'
  };

  const fileBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive upload failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

// Download backup JSON content from Google Drive
export const downloadBackupContent = async (token: string, fileId: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive download failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

// Delete a backup JSON from Google Drive
export const deleteBackupFile = async (token: string, fileId: string): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive delete failed: ${response.status} - ${errorText}`);
  }
};
