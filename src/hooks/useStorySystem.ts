import { useState, useEffect, useRef } from 'react';
import { ChatProfile, ChatSettings } from '../../types';
import { ROLE_LABELS } from '../initialProfiles';
import { 
  sendFirestoreStory, 
  listenToFirestoreStories,
  deleteFirestoreStory,
  updateStoryInFirestore,
} from '../../firebaseService';
import { auth } from '../../firebase';

interface UseStorySystemProps {
  profiles: ChatProfile[];
  settings: ChatSettings;
}

export function useStorySystem({ profiles, settings }: UseStorySystemProps) {
  const [userStories, setUserStories] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('user_stories');
      return saved ? JSON.parse(saved).map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp),
        comments: Array.isArray(s.comments) ? s.comments.map((c: any) => ({ ...c, timestamp: new Date(c.timestamp) })) : []
      })) : [];
    } catch (e) {
      return [];
    }
  });

  const profilesRef = useRef<ChatProfile[]>(profiles);
  const userStoriesRef = useRef<any[]>(userStories);
  const isGeneratingStoryRef = useRef(false);
  const recentlyGeneratedStoriesRef = useRef<Set<string>>(new Set());

  // Keep refs in sync
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  useEffect(() => {
    userStoriesRef.current = userStories;
  }, [userStories]);

  // Firestore real-time stories subscription
  useEffect(() => {
    const unsubscribe = listenToFirestoreStories((fsStories) => {
      let localStories: any[] = [];
      try {
        const saved = localStorage.getItem('user_stories');
        if (saved) {
          localStories = JSON.parse(saved).map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp),
            comments: Array.isArray(s.comments) ? s.comments.map((c: any) => ({ ...c, timestamp: new Date(c.timestamp) })) : []
          }));
        }
      } catch (e) {
        console.error("Failed to parse user_stories from localStorage:", e);
      }

      setUserStories(() => {
        const merged = [...fsStories];
        localStories.forEach(p => {
          if (!merged.some(m => m.id === p.id)) {
            // Only merge local stories if they are very fresh (e.g. less than 15 seconds old, to allow offline/local lag)
            const isFresh = Date.now() - new Date(p.timestamp).getTime() < 15000;
            if (isFresh) {
              merged.push(p);
            }
          } else {
            const existing = merged.find(m => m.id === p.id);
            if (existing && p.comments && p.comments.length > (existing.comments?.length || 0)) {
              existing.comments = p.comments;
              existing.likes = p.likes;
            }
          }
        });
        return merged;
      });
    });
    return () => unsubscribe();
  }, []);

  const handlePublishStory = (type: 'text' | 'image', content: string, caption: string) => {
    if (!content.trim()) {
      alert("لطفاً متن یا عکس استوری را انتخاب کنید.");
      return;
    }
    
    const storyId = "user-story-" + Date.now();
    const newStory = {
      id: storyId,
      type,
      content,
      caption: type === 'image' ? caption : undefined,
      timestamp: new Date(),
      likes: [],
      comments: [],
      authorId: settings.userId || auth.currentUser?.uid || 'anonymous',
      authorName: settings.userName,
      authorAvatar: settings.userProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
    };
    
    // Upload story to Firestore central database for all users to see
    sendFirestoreStory({
      id: storyId,
      type,
      content,
      caption: type === 'image' ? caption : undefined,
      authorId: settings.userId || auth.currentUser?.uid || 'anonymous',
      authorName: settings.userName,
      authorAvatar: settings.userProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
    }).catch(e => console.error("Firestore story upload error:", e));

    const updated = [newStory, ...userStoriesRef.current];
    setUserStories(updated);
    localStorage.setItem('user_stories', JSON.stringify(updated));
    
    // Trigger instant comments from other active AI characters
    triggerInstantAiComments(newStory);
  };

  const generateStoryForCharacter = async (char: ChatProfile, force = false) => {
    if (char.isGroup || char.realUser) return;
    
    const now = Date.now();
    const activeStories = (userStoriesRef.current || []).filter(s => s.authorId === char.id || s.characterId === char.id || s.authorName === char.name);
    const hasActiveStory = activeStories.some(s => {
      const raw = s.timestamp;
      let tVal: number;
      if (raw && typeof raw.toDate === 'function') {
        tVal = raw.toDate().getTime();
      } else if (raw instanceof Date) {
        tVal = raw.getTime();
      } else if (raw && raw.seconds) {
        tVal = raw.seconds * 1000;
      } else if (raw) {
        tVal = new Date(raw).getTime();
      } else {
        tVal = Date.now();
      }
      return !isNaN(tVal) && now - tVal < 24 * 60 * 60 * 1000;
    });
    
    if (!force && (hasActiveStory || recentlyGeneratedStoriesRef.current.has(char.id))) {
      console.log(`Character ${char.name} already has an active or recently generated story. Skipping generation.`);
      return;
    }

    if (force) {
      console.log(`Force story generation requested for ${char.name}. Actively cleaning up previous stories...`);
      for (const story of activeStories) {
        try {
          await deleteFirestoreStory(story.id);
        } catch (e) {
          console.error(`Failed to delete old story on force-generate:`, e);
        }
      }
    }

    console.log(`Generating dynamic story for AI character: ${char.name}...`);
    recentlyGeneratedStoriesRef.current.add(char.id);

    const recentMsgs = char.messages || [];
    const recentText = recentMsgs.slice(-5).map(m => `${m.sender === 'user' ? 'کاربر' : char.name}: ${m.text}`).join('\n');

    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: char.name,
          characterRole: char.customRoleLabel || ROLE_LABELS[char.role] || char.role,
          recentChatText: recentText
        })
      });

      if (res.ok) {
        const storyData = await res.json();
        const storyId = await sendFirestoreStory({
          type: storyData.type,
          content: storyData.content,
          caption: storyData.caption,
          authorId: char.id,
          authorName: char.name,
          authorAvatar: char.avatar
        });

        const storyObj = {
          id: storyId,
          type: storyData.type,
          content: storyData.content,
          caption: storyData.caption,
          characterId: char.id,
          authorId: char.id,
          authorName: char.name,
          authorAvatar: char.avatar,
          timestamp: new Date().toISOString()
        };

        console.log(`Successfully generated and uploaded dynamic story for ${char.name}`);
        
        setUserStories(prev => {
          const filtered = prev.filter(s => s.id !== storyId && s.authorId !== char.id);
          const updated = [storyObj, ...filtered];
          try {
            localStorage.setItem('user_stories', JSON.stringify(updated));
          } catch (e) {
            console.error("Failed to save user_stories to localStorage", e);
          }
          return updated;
        });

        // Trigger instant comments from other active AI characters
        triggerInstantAiComments(storyObj);
      } else {
        console.warn(`Failed to generate story for ${char.name}, status code: ${res.status}`);
        recentlyGeneratedStoriesRef.current.delete(char.id);
      }
    } catch (err) {
      console.error(`Failed to generate dynamic story for ${char.name}:`, err);
      recentlyGeneratedStoriesRef.current.delete(char.id);
    }
  };

  const checkAndGenerateAiStories = async () => {
    const currentProfs = profilesRef.current;
    if (currentProfs.length === 0) return;
    if (isGeneratingStoryRef.current) return;
    isGeneratingStoryRef.current = true;

    try {
      const aiProfiles = currentProfs.filter(p => !p.isGroup && !p.realUser);
      const now = Date.now();
      const currentStories = userStoriesRef.current || [];
      
      let localStoriesUpdated = false;
      let localStoriesList: any[] = [];
      try {
        const saved = localStorage.getItem('user_stories');
        if (saved) {
          localStoriesList = JSON.parse(saved);
        }
      } catch (e) {
        console.error(e);
      }

      for (const story of currentStories) {
        const rawTime = story.timestamp;
        let storyTime: number;
        if (rawTime && typeof rawTime.toDate === 'function') {
          storyTime = rawTime.toDate().getTime();
        } else if (rawTime instanceof Date) {
          storyTime = rawTime.getTime();
        } else if (rawTime && rawTime.seconds) {
          storyTime = rawTime.seconds * 1000;
        } else if (rawTime) {
          storyTime = new Date(rawTime).getTime();
        } else {
          storyTime = Date.now();
        }

        if (!isNaN(storyTime) && now - storyTime >= 24 * 60 * 60 * 1000) {
          console.log(`Story ${story.id} is older than 24 hours. Actively deleting expired story...`);
          try {
            await deleteFirestoreStory(story.id);
          } catch (e) {
            console.error(`Failed to delete expired story ${story.id}:`, e);
          }
          
          const initialLen = localStoriesList.length;
          localStoriesList = localStoriesList.filter((s: any) => s.id !== story.id);
          if (localStoriesList.length !== initialLen) {
            localStoriesUpdated = true;
          }
        }
      }

      if (localStoriesUpdated) {
        localStorage.setItem('user_stories', JSON.stringify(localStoriesList));
      }

      let staggerDelay = 0;
      for (const char of aiProfiles) {
        const activeStories = currentStories.filter(s => s.authorId === char.id || s.characterId === char.id || s.authorName === char.name);
        const hasActiveStory = activeStories.some(s => now - new Date(s.timestamp).getTime() < 24 * 60 * 60 * 1000);
        
        if (hasActiveStory || recentlyGeneratedStoriesRef.current.has(char.id)) {
          continue;
        }

        setTimeout(async () => {
          await generateStoryForCharacter(char);
        }, staggerDelay);
        staggerDelay += 5000;
      }
    } finally {
      isGeneratingStoryRef.current = false;
    }
  };

  const triggerInstantAiComments = async (story: any) => {
    const currentProfs = profilesRef.current;
    if (currentProfs.length === 0) return;
    const aiProfiles = currentProfs.filter(p => !p.isGroup && !p.realUser);
    if (aiProfiles.length === 0) return;

    const eligibleCommenters = aiProfiles.filter(p => {
      return p.id !== story.characterId && p.id !== story.authorId && p.name !== story.characterName && p.name !== story.authorName;
    });

    if (eligibleCommenters.length === 0) return;

    const count = Math.min(eligibleCommenters.length, Math.floor(Math.random() * 2) + 1);
    const selectedCommenters = [...eligibleCommenters].sort(() => 0.5 - Math.random()).slice(0, count);

    for (const commenter of selectedCommenters) {
      const delay = 3000 + Math.random() * 8000;
      setTimeout(async () => {
        try {
          const res = await fetch("/api/generate-comment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyAuthorName: story.characterName || story.authorName || "کاربر",
              storyAuthorRole: story.characterId ? (currentProfs.find(p => p.id === story.characterId)?.customRoleLabel || ROLE_LABELS[currentProfs.find(p => p.id === story.characterId)?.role || ''] || story.characterRole || "") : "کاربر حقیقی",
              storyType: story.type,
              storyContent: story.content,
              storyCaption: story.caption || "",
              commenterName: commenter.name,
              commenterRole: commenter.customRoleLabel || ROLE_LABELS[commenter.role] || commenter.role
            })
          });

          if (res.ok) {
            const data = await res.json();
            const newComment = {
              id: "comment-ai-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
              userName: commenter.name,
              text: data.commentText,
              timestamp: new Date().toISOString(),
              avatar: commenter.avatar
            };

            setUserStories(prevStories => {
              const updated = prevStories.map(s => {
                if (s.id === story.id) {
                  const comments = s.comments || [];
                  const updatedComments = [...comments, newComment];
                  updateStoryInFirestore(s.id, { comments: updatedComments }).catch(e => console.error(e));
                  return { ...s, comments: updatedComments };
                }
                return s;
              });
              localStorage.setItem('user_stories', JSON.stringify(updated));
              return updated;
            });
          }
        } catch (err) {
          console.error(`Failed to post dynamic instant comment by ${commenter.name}:`, err);
        }
      }, delay);
    }
  };

  const checkAndGenerateAiComments = async () => {
    const currentProfs = profilesRef.current;
    const currentStories = userStoriesRef.current || [];
    if (currentProfs.length === 0 || currentStories.length === 0) return;
    const aiProfiles = currentProfs.filter(p => !p.isGroup && !p.realUser);
    if (aiProfiles.length === 0) return;

    const now = Date.now();
    let commentsGeneratedThisRun = 0;

    for (const story of currentStories) {
      if (commentsGeneratedThisRun >= 1) {
        console.log("Conserving API quota: Already generated 1 comment this run. Skipping the rest.");
        break;
      }

      const storyTime = new Date(story.timestamp).getTime();
      if (now - storyTime >= 24 * 60 * 60 * 1000) continue;

      const comments = story.comments || [];
      if (comments.length >= 4) continue;

      const eligibleCommenters = aiProfiles.filter(p => {
        const isAuthor = p.id === story.characterId || p.id === story.authorId || p.name === story.characterName || p.name === story.authorName;
        if (isAuthor) return false;

        const hasCommented = comments.some((c: any) => c.userName === p.name || c.characterName === p.name);
        return !hasCommented;
      });

      if (eligibleCommenters.length === 0) continue;

      if (Math.random() > 0.15) continue;

      const commenter = eligibleCommenters[Math.floor(Math.random() * eligibleCommenters.length)];
      console.log(`AI Character ${commenter.name} is writing a comment on ${story.characterName || story.authorName}'s story`);
      commentsGeneratedThisRun++;

      try {
        const res = await fetch("/api/generate-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyAuthorName: story.characterName || story.authorName || "کاربر",
            storyAuthorRole: story.characterId ? (currentProfs.find(p => p.id === story.characterId)?.customRoleLabel || ROLE_LABELS[currentProfs.find(p => p.id === story.characterId)?.role || '']) : "کاربر حقیقی",
            storyType: story.type,
            storyContent: story.content,
            storyCaption: story.caption,
            commenterName: commenter.name,
            commenterRole: commenter.customRoleLabel || ROLE_LABELS[commenter.role] || commenter.role
          })
        });

        if (res.ok) {
          const data = await res.json();
          const newComment = {
            id: "comment-ai-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
            userName: commenter.name,
            text: data.commentText,
            timestamp: new Date().toISOString(),
            avatar: commenter.avatar
          };

          const updatedComments = [...comments, newComment];
          await updateStoryInFirestore(story.id, { comments: updatedComments });
          console.log(`Successfully posted AI comment by ${commenter.name} on story ${story.id}`);
        }
      } catch (err) {
        console.error(`Failed to post AI comment by ${commenter.name}:`, err);
      }
    }
  };

  useEffect(() => {
    const initTimer = setTimeout(() => {
      checkAndGenerateAiStories();
      checkAndGenerateAiComments();
    }, 2000);

    const interval = setInterval(() => {
      checkAndGenerateAiStories();
      checkAndGenerateAiComments();
    }, 120000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  return {
    userStories,
    setUserStories,
    handlePublishStory,
    generateStoryForCharacter,
    triggerInstantAiComments,
  };
}
