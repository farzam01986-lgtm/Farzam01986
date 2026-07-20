import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebase';
import { Message, ChatProfile, ChatSettings } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow = false) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Ensure user is signed in anonymously and return their firebase UID
export async function ensureAuth(): Promise<string> {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

// Registers or updates user profile in firestore
export async function registerUserInFirestore(uid: string, name: string, phone: string, age: string, profilePic: string, password?: string, gender?: string) {
  const userRef = doc(db, 'users', uid);
  
  // If base64 is extremely large, don't send the entire base64 to firestore to avoid exceeding quota/doc limits
  const safeProfilePic = (profilePic && profilePic.startsWith('data:') && profilePic.length > 30000) 
    ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' // fallback placeholder for firestore
    : profilePic;

  const data: any = {
    id: uid,
    name,
    phone,
    age: age || '25',
    profilePic: safeProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    createdAt: new Date().toISOString()
  };
  
  if (gender) {
    data.gender = gender;
  }
  
  if (password) {
    data.password = password;
  }

  try {
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
  return data;
}

// Deletes a user profile from Firestore
export async function deleteUserFromFirestore(userId: string) {
  const userRef = doc(db, 'users', userId);
  try {
    await deleteDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
  }
}

// Gets all registered users of the app
export async function getRegisteredUsers(): Promise<any[]> {
  try {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const users: any[] = [];
    snapshot.forEach((docSnap) => {
      users.push(docSnap.data());
    });
    return users;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'users');
    return [];
  }
}

// Subscribes to real-time updates for all registered users
export function listenToRegisteredUsers(callback: (users: any[]) => void) {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    const users: any[] = [];
    snapshot.forEach((docSnap) => {
      users.push(docSnap.data());
    });
    callback(users);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'users');
  });
}

// Sends a message to Firestore
export async function sendFirestoreMessage(params: {
  text: string;
  image?: string;
  audio?: string;
  sender: string; // "user" or "ai" or the actual uid
  senderName?: string;
  senderAvatar?: string;
  profileId: string;
  replyTo?: any;
}) {
  const messageId = "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
  const msgRef = doc(db, 'messages', messageId);
  
  const payload: any = {
    id: messageId,
    text: params.text || "",
    sender: params.sender,
    profileId: params.profileId,
    timestamp: new Date().toISOString(),
    seen: false
  };

  if (params.image) payload.image = params.image;
  if (params.audio) payload.audio = params.audio;
  if (params.senderName) payload.senderName = params.senderName;
  if (params.senderAvatar) payload.senderPic = params.senderAvatar;
  if (params.replyTo) {
    payload.replyTo = JSON.stringify(params.replyTo);
  }

  try {
    await setDoc(msgRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `messages/${messageId}`);
  }
  return messageId;
}

// Subscribes to messages of a specific profile / conversation in real time
export function listenToRoomMessages(profileId: string, callback: (messages: Message[]) => void) {
  const q = query(
    collection(db, 'messages'), 
    where('profileId', '==', profileId)
  );

  return onSnapshot(q, (snapshot) => {
    const msgs: Message[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let replyToObj = undefined;
      if (data.replyTo) {
        try {
          replyToObj = JSON.parse(data.replyTo);
        } catch (e) {
          replyToObj = undefined;
        }
      }

      msgs.push({
        id: data.id,
        text: data.text,
        sender: data.sender === auth.currentUser?.uid ? 'user' : (data.sender === 'ai' ? 'ai' : 'user'), // map appropriately
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        image: data.image,
        audioBase64: data.audio,
        senderName: data.senderName,
        senderAvatar: data.senderPic,
        replyTo: replyToObj,
        seen: data.seen !== undefined ? data.seen : false,
        // Carry along the actual sender UID for checkmarks logic
        actualSender: data.sender
      } as any);
    });

    // Sort client-side because compound index is not required this way, preventing errors
    msgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    callback(msgs);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `messages [profile=${profileId}]`);
  });
}

// Mark unread messages in a room as seen/read
export async function markRoomMessagesAsSeen(profileId: string, currentUserId: string) {
  try {
    const q = query(
      collection(db, 'messages'),
      where('profileId', '==', profileId),
      where('seen', '==', false)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      // Only mark seen if the message was sent by the OTHER person
      if (data.sender !== currentUserId) {
        try {
          await updateDoc(docSnap.ref, { seen: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `messages/${docSnap.id}`);
        }
      }
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'messages');
  }
}

// Sends a Story to Firestore
export async function sendFirestoreStory(params: {
  id?: string;
  type: 'text' | 'image';
  content: string;
  caption?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
}) {
  const storyId = params.id || "story-" + Date.now();
  const storyRef = doc(db, 'stories', storyId);
  const payload = {
    id: storyId,
    authorId: params.authorId,
    authorName: params.authorName,
    authorAvatar: params.authorAvatar,
    type: params.type,
    content: params.content,
    caption: params.caption || "",
    timestamp: new Date().toISOString()
  };
  try {
    await setDoc(storyRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `stories/${storyId}`);
  }
  return storyId;
}

// Subscribes to real-time stories posted in the last 24 hours
export function listenToFirestoreStories(callback: (stories: any[]) => void) {
  const q = query(collection(db, 'stories'));
  return onSnapshot(q, (snapshot) => {
    const stories: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const rawTimestamp = data.timestamp;
      let ts: Date;
      if (rawTimestamp) {
        if (typeof rawTimestamp.toDate === 'function') {
          ts = rawTimestamp.toDate();
        } else if (rawTimestamp instanceof Date) {
          ts = rawTimestamp;
        } else if (rawTimestamp.seconds) {
          ts = new Date(rawTimestamp.seconds * 1000);
        } else {
          ts = new Date(rawTimestamp);
        }
      } else {
        ts = new Date();
      }
      
      // Filter out stories older than 24 hours
      if (isNaN(ts.getTime()) || Date.now() - ts.getTime() < 24 * 60 * 60 * 1000) {
        let parsedComments = [];
        if (data.comments) {
          try {
            parsedComments = typeof data.comments === 'string' ? JSON.parse(data.comments) : data.comments;
          } catch (e) {
            console.error("Failed to parse story comments:", e);
          }
        }
        stories.push({
          id: data.id,
          characterId: data.authorId,
          characterName: data.authorName,
          characterAvatar: data.authorAvatar,
          type: data.type,
          content: data.content,
          caption: data.caption,
          timestamp: ts,
          likes: data.likes || [],
          comments: parsedComments
        });
      }
    });
    // Sort descending by timestamp
    stories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    callback(stories);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'stories');
  });
}

// Updates a Story in Firestore (likes, comments)
export async function updateStoryInFirestore(storyId: string, fields: any) {
  const storyRef = doc(db, 'stories', storyId);
  try {
    await updateDoc(storyRef, fields);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `stories/${storyId}`);
  }
}

// Deletes a Story from Firestore
export async function deleteFirestoreStory(storyId: string) {
  const storyRef = doc(db, 'stories', storyId);
  try {
    await deleteDoc(storyRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `stories/${storyId}`);
  }
}

// --- WebRTC Secure Signaling for Real-User Calling ---

export async function initiateRealUserCall(roomId: string, callerId: string, receiverId: string, isVideo: boolean) {
  const callRef = doc(db, 'calls', roomId);
  const payload = {
    roomId,
    callerId,
    receiverId,
    status: 'ringing',
    isVideo,
    createdAt: new Date().toISOString(),
    callerCandidates: [],
    receiverCandidates: [],
    offer: null,
    answer: null
  };
  try {
    await setDoc(callRef, payload);
    console.log(`Initiated secure real-user call session in room: ${roomId}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `calls/${roomId}`);
  }
  return roomId;
}

export async function saveCallOffer(roomId: string, offer: any) {
  const callRef = doc(db, 'calls', roomId);
  try {
    await updateDoc(callRef, { offer: JSON.stringify(offer) });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${roomId} (offer)`);
  }
}

export async function saveCallAnswer(roomId: string, answer: any) {
  const callRef = doc(db, 'calls', roomId);
  try {
    await updateDoc(callRef, { answer: JSON.stringify(answer) });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${roomId} (answer)`);
  }
}

export async function acceptRealUserCall(roomId: string) {
  const callRef = doc(db, 'calls', roomId);
  try {
    await updateDoc(callRef, { status: 'connected' });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${roomId} (accept)`);
  }
}

export async function declineRealUserCall(roomId: string) {
  const callRef = doc(db, 'calls', roomId);
  try {
    await updateDoc(callRef, { status: 'declined' });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${roomId} (decline)`);
  }
}

export async function endRealUserCall(roomId: string) {
  const callRef = doc(db, 'calls', roomId);
  try {
    await updateDoc(callRef, { status: 'ended' });
    // Clean up call document after ending to avoid pollution
    setTimeout(async () => {
      try {
        await deleteDoc(callRef);
      } catch (e) {}
    }, 5000);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${roomId} (end)`);
  }
}

export async function addIceCandidateToFirestore(roomId: string, role: 'caller' | 'receiver', candidate: any) {
  const callRef = doc(db, 'calls', roomId);
  try {
    const snap = await getDoc(callRef);
    if (snap.exists()) {
      const data = snap.data();
      const candidates = role === 'caller' ? (data.callerCandidates || []) : (data.receiverCandidates || []);
      candidates.push(JSON.stringify(candidate));
      await updateDoc(callRef, {
        [role === 'caller' ? 'callerCandidates' : 'receiverCandidates']: candidates
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${roomId} (candidate)`);
  }
}

export function listenToCallSession(roomId: string, callback: (callData: any) => void) {
  const callRef = doc(db, 'calls', roomId);
  return onSnapshot(callRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `calls/${roomId}`);
  });
}

export function listenToIncomingCalls(myId: string, callback: (callData: any) => void) {
  const q = query(
    collection(db, 'calls'),
    where('receiverId', '==', myId),
    where('status', '==', 'ringing')
  );
  return onSnapshot(q, (snapshot) => {
    let call: any = null;
    snapshot.forEach((docSnap) => {
      call = docSnap.data();
    });
    callback(call);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `calls incoming [myId=${myId}]`);
  });
}

