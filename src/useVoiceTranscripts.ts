import { useEffect, useRef, useState } from 'react';
import { api } from './platform';
import { mergeTranscripts, readTranscripts, writeTranscripts, type TranscriptRecord } from './voiceTranscripts';

// Legacy Firestore remains optional. Never prompt for a second identity or use another account's session.
async function legacyStore(userId: string) {
  try {
    const firebase = await import('./firebase');
    await firebase.auth.authStateReady();
    return firebase.auth.currentUser?.uid === userId ? firebase.db : null;
  } catch { return null; }
}

export function useVoiceTranscripts(userId?: string) {
  const [savedTranscripts, setSavedTranscripts] = useState<TranscriptRecord[]>([]);
  const [archiveNotice, setArchiveNotice] = useState('');
  const recordsRef = useRef<TranscriptRecord[]>([]);
  const currentUserId = useRef(userId);
  currentUserId.current = userId;

  useEffect(() => {
    recordsRef.current = userId ? readTranscripts(userId) : [];
    setSavedTranscripts(recordsRef.current);
    setArchiveNotice('');
    if (!userId) return;
    let active = true;
    const merge = (loaded: TranscriptRecord[]) => {
      if (!active) return;
      recordsRef.current = mergeTranscripts(loaded, recordsRef.current);
      setSavedTranscripts(recordsRef.current);
      writeTranscripts(userId, recordsRef.current);
    };
    void api<{ transcripts: TranscriptRecord[] }>('voice-transcripts')
      .then(result => merge(result.transcripts))
      .catch(() => { if (active) setArchiveNotice('الأرشيف المحلي متاح. تعذرت مزامنة النسخة السحابية حالياً.'); });
    void (async () => {
      const db = await legacyStore(userId);
      if (!db || !active) return;
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const snapshot = await getDocs(query(collection(db, 'voice_transcripts'), where('userId', '==', userId)));
      merge(snapshot.docs.map(record => {
        const data = record.data();
        return {
          id: record.id, title: data.title || 'تسجيل صوتي', transcriptText: data.transcriptText || '',
          durationSeconds: data.durationSeconds || 0,
          createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        };
      }));
    })().catch(() => { /* Legacy access never blocks the platform archive. */ });
    return () => { active = false; };
  }, [userId]);

  function saveTranscript(transcriptText: string, durationSeconds: number) {
    if (!userId || currentUserId.current !== userId) return;
    const record: TranscriptRecord = {
      id: crypto.randomUUID(), title: transcriptText.slice(0, 45), transcriptText,
      durationSeconds, createdAt: new Date().toISOString(),
    };
    recordsRef.current = mergeTranscripts(recordsRef.current, [record]);
    setSavedTranscripts(recordsRef.current);
    const locallySaved = writeTranscripts(userId, recordsRef.current);
    if (!locallySaved) setArchiveNotice('تعذر حفظ النسخة المحلية. تجري محاولة الحفظ السحابي.');
    void api('voice-transcripts', { action: 'save', ...record }).catch(() => {
      if (currentUserId.current === userId) setArchiveNotice(locallySaved
        ? 'التفريغ متاح محلياً. تعذر حفظ النسخة السحابية حالياً.'
        : 'تعذر حفظ التفريغ محلياً وسحابياً. انسخ النص قبل مغادرة الصفحة.');
    });
    void (async () => {
      const db = await legacyStore(userId);
      if (!db || currentUserId.current !== userId) return;
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      await setDoc(doc(db, 'voice_transcripts', record.id), { ...record, userId, createdAt: serverTimestamp() });
    })().catch(() => { /* Optional legacy mirror. */ });
  }

  async function deleteTranscript(id: string) {
    if (!userId) return;
    // Confirm deletion in the primary store before removing a synced record locally.
    if (/^[a-f0-9-]{36}$/i.test(id)) {
      try { await api('voice-transcripts', { action: 'delete', id }); }
      catch { setArchiveNotice('تعذر تأكيد الحذف السحابي. أعد المحاولة عند عودة الاتصال.'); return; }
    }
    if (currentUserId.current !== userId) return;
    recordsRef.current = recordsRef.current.filter(record => record.id !== id);
    setSavedTranscripts(recordsRef.current);
    writeTranscripts(userId, recordsRef.current);
    void (async () => {
      const db = await legacyStore(userId);
      if (db && currentUserId.current === userId) {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'voice_transcripts', id));
      }
    })().catch(() => { /* Legacy permissions never delay deletion from the platform archive. */ });
  }

  return { savedTranscripts, archiveNotice, saveTranscript, deleteTranscript };
}
