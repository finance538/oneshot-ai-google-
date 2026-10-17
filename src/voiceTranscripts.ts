export interface TranscriptRecord {
  id: string;
  title: string;
  transcriptText: string;
  durationSeconds: number;
  createdAt: string;
}

export const transcriptStorageKey = (userId: string) => `oneshot_voice_transcripts:${userId}`;

export function readTranscripts(userId: string): TranscriptRecord[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(transcriptStorageKey(userId)) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is TranscriptRecord => Boolean(item)
      && typeof item.id === 'string' && typeof item.title === 'string'
      && typeof item.transcriptText === 'string' && typeof item.durationSeconds === 'number'
      && typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt))).slice(0, 100);
  } catch { return []; }
}

export function writeTranscripts(userId: string, records: TranscriptRecord[]): boolean {
  try { localStorage.setItem(transcriptStorageKey(userId), JSON.stringify(records.slice(0, 100))); return true; }
  catch { return false; }
}

export function mergeTranscripts(...groups: TranscriptRecord[][]): TranscriptRecord[] {
  const records = new Map<string, TranscriptRecord>();
  for (const group of groups) for (const record of group) records.set(record.id, record);
  return [...records.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 100);
}
