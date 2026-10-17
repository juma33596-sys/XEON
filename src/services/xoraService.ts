import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  XoraChat,
  XoraMessage,
  XoraMemory,
  XoraUserSettings,
  XoraAction,
  XoraProviderStatus,
} from '../types/xora';

// -------------------------------------------------------------------
// 1. CHAT THREAD PERSISTENCE (users/{uid}/xoraChats/{chatId})
// -------------------------------------------------------------------

export async function getUserChats(userId: string): Promise<XoraChat[]> {
  const path = `users/${userId}/xoraChats`;
  try {
    const q = query(
      collection(db, path),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<XoraChat, 'id'>),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function createChat(userId: string, initialTitle: string = 'New Conversation'): Promise<XoraChat> {
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/xoraChats/${chatId}`;
  const now = new Date().toISOString();

  const newChat: XoraChat = {
    id: chatId,
    userId,
    title: initialTitle,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    archived: false,
  };

  try {
    await setDoc(doc(db, 'users', userId, 'xoraChats', chatId), newChat);
    return newChat;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function renameChat(userId: string, chatId: string, newTitle: string): Promise<void> {
  const path = `users/${userId}/xoraChats/${chatId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'xoraChats', chatId), {
      title: newTitle.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function archiveChat(userId: string, chatId: string, archived: boolean): Promise<void> {
  const path = `users/${userId}/xoraChats/${chatId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'xoraChats', chatId), {
      archived,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteChat(userId: string, chatId: string): Promise<void> {
  const chatPath = `users/${userId}/xoraChats/${chatId}`;
  try {
    // Delete messages subcollection documents first
    const msgsRef = collection(db, 'users', userId, 'xoraChats', chatId, 'messages');
    const msgsSnap = await getDocs(msgsRef);
    for (const mDoc of msgsSnap.docs) {
      await deleteDoc(mDoc.ref);
    }
    // Delete chat document
    await deleteDoc(doc(db, 'users', userId, 'xoraChats', chatId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, chatPath);
  }
}

export async function clearAllUserChats(userId: string): Promise<void> {
  const path = `users/${userId}/xoraChats`;
  try {
    const snap = await getDocs(collection(db, path));
    for (const chatDoc of snap.docs) {
      await deleteChat(userId, chatDoc.id);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------
// 2. CHAT MESSAGES PERSISTENCE (users/{uid}/xoraChats/{chatId}/messages/{messageId})
// -------------------------------------------------------------------

export async function getChatMessages(userId: string, chatId: string): Promise<XoraMessage[]> {
  const path = `users/${userId}/xoraChats/${chatId}/messages`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'asc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<XoraMessage, 'id'>),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function saveChatMessage(
  userId: string,
  chatId: string,
  msg: Omit<XoraMessage, 'id'>,
  customMessageId?: string
): Promise<XoraMessage> {
  const messageId = customMessageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `users/${userId}/xoraChats/${chatId}/messages/${messageId}`;

  const fullMessage: XoraMessage = {
    id: messageId,
    ...msg,
  };

  try {
    await setDoc(doc(db, 'users', userId, 'xoraChats', chatId, 'messages', messageId), fullMessage);

    // Update parent chat metadata
    await updateDoc(doc(db, 'users', userId, 'xoraChats', chatId), {
      updatedAt: new Date().toISOString(),
      lastMessageSnippet: msg.content.slice(0, 80),
    });

    return fullMessage;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function updateMessageFeedback(
  userId: string,
  chatId: string,
  messageId: string,
  feedback: 'helpful' | 'unhelpful'
): Promise<void> {
  const path = `users/${userId}/xoraChats/${chatId}/messages/${messageId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'xoraChats', chatId, 'messages', messageId), {
      feedback,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------------
// 3. PERSISTENT USER MEMORIES (users/{uid}/xoraMemories/{memoryId})
// -------------------------------------------------------------------

export async function getUserMemories(userId: string): Promise<XoraMemory[]> {
  const path = `users/${userId}/xoraMemories`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<XoraMemory, 'id'>),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

export async function saveUserMemory(
  userId: string,
  text: string,
  category: XoraMemory['category'] = 'preference',
  sourceChatId?: string
): Promise<XoraMemory> {
  const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `users/${userId}/xoraMemories/${memoryId}`;
  const now = new Date().toISOString();

  const memory: XoraMemory = {
    id: memoryId,
    userId,
    text: text.trim(),
    category,
    createdAt: now,
    updatedAt: now,
    sourceChatId,
  };

  try {
    await setDoc(doc(db, 'users', userId, 'xoraMemories', memoryId), memory);
    return memory;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function updateUserMemory(userId: string, memoryId: string, text: string): Promise<void> {
  const path = `users/${userId}/xoraMemories/${memoryId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'xoraMemories', memoryId), {
      text: text.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteUserMemory(userId: string, memoryId: string): Promise<void> {
  const path = `users/${userId}/xoraMemories/${memoryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'xoraMemories', memoryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function clearAllUserMemories(userId: string): Promise<void> {
  const path = `users/${userId}/xoraMemories`;
  try {
    const snap = await getDocs(collection(db, path));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------
// 4. USER XORA PREFERENCES (users/{uid}/xoraSettings/preferences)
// -------------------------------------------------------------------

export async function getUserXoraSettings(userId: string): Promise<XoraUserSettings> {
  const path = `users/${userId}/xoraSettings/preferences`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'xoraSettings', 'preferences'));
    if (snap.exists()) {
      return snap.data() as XoraUserSettings;
    }
    return {
      userId,
      memoryEnabled: true,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      userId,
      memoryEnabled: true,
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function saveUserXoraSettings(userId: string, updates: Partial<XoraUserSettings>): Promise<void> {
  const path = `users/${userId}/xoraSettings/preferences`;
  const merged: XoraUserSettings = {
    userId,
    memoryEnabled: updates.memoryEnabled ?? true,
    preferredLanguage: updates.preferredLanguage,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', userId, 'xoraSettings', 'preferences'), merged, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------------
// 5. SERVER API CALLS (GROQ INFERENCE, STREAMING & TOOLS)
// -------------------------------------------------------------------

export async function fetchXoraProviderStatus(): Promise<XoraProviderStatus> {
  try {
    const res = await fetch('/api/xora/status');
    if (!res.ok) {
      return {
        ok: false,
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        latencyMs: 0,
        configured: false,
        errorMessage: `Server status error ${res.status}`,
        timestamp: new Date().toISOString(),
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      ok: false,
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      latencyMs: 0,
      configured: false,
      errorMessage: err.message || 'Offline',
      timestamp: new Date().toISOString(),
    };
  }
}

export interface StreamChatParams {
  messages: Array<{ role: string; content: string }>;
  currentRoute?: string;
  language?: string;
  memories?: string[];
  model?: string;
  onChunk: (chunk: string) => void;
  onDone: (result: { fullContent: string; actions: XoraAction[] }) => void;
  onError: (err: any) => void;
  signal?: AbortSignal;
}

export async function streamXoraChat(params: StreamChatParams): Promise<void> {
  const {
    messages,
    currentRoute = '/',
    language = 'en',
    memories = [],
    model,
    onChunk,
    onDone,
    onError,
    signal,
  } = params;

  try {
    const response = await fetch('/api/xora/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        currentRoute,
        language,
        memories,
        model,
        streaming: true,
      }),
      signal,
    });

    if (!response.ok) {
      let errMsg = `Server returned ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {}
      throw new Error(errMsg);
    }

    if (!response.body) {
      throw new Error('Streaming response body not supported by browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payloadStr = trimmed.slice(6);

        try {
          const parsed = JSON.parse(payloadStr);

          if (parsed.error) {
            onError(new Error(parsed.error));
            return;
          }

          if (parsed.done) {
            onDone({
              fullContent: parsed.fullContent || accumulated,
              actions: parsed.actions || [],
            });
            return;
          }

          if (parsed.text) {
            accumulated += parsed.text;
            onChunk(parsed.text);
          }
        } catch {}
      }
    }

    onDone({
      fullContent: accumulated,
      actions: [],
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onDone({ fullContent: '', actions: [] });
      return;
    }
    onError(err);
  }
}

export async function extractMemoriesAfterTurn(
  userMessage: string,
  assistantResponse: string
): Promise<Array<{ text: string; category: XoraMemory['category'] }>> {
  try {
    const res = await fetch('/api/xora/memory-extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage, assistantResponse }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.memories) ? data.memories : [];
  } catch {
    return [];
  }
}

export async function readPublicUrlSecure(url: string): Promise<{ title: string; text: string }> {
  const res = await fetch('/api/xora/public-reader', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to read public webpage.');
  }

  return await res.json();
}
