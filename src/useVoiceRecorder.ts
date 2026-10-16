import { useEffect, useRef, useState } from 'react';
import { api } from './platform';

export function useVoiceRecorder(onTranscript: (text: string, seconds: number) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const mounted = useRef(false);
  const starting = useRef(false);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.onerror = null;
        if (recorder.state !== 'inactive') recorder.stop();
        recorder.stream.getTracks().forEach(track => track.stop());
      }
      recorderRef.current = null;
    };
  }, []);

  function stopRecording(accept = true) {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    if (!accept) recorder.onstop = null;
    recorder.stop();
    recorder.stream.getTracks().forEach(track => track.stop());
    window.clearInterval(timerRef.current);
    if (!accept) recorderRef.current = null;
    setIsRecording(false);
  }

  async function startRecording() {
    if (starting.current || recorderRef.current || transcribing) return;
    starting.current = true;
    setIsStarting(true);
    setRecordingError(null);
    let stream: MediaStream | undefined;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('التسجيل الصوتي غير مدعوم في هذا المتصفح. استخدم متصفحاً حديثاً واتصالاً آمناً.');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      const started = Date.now();
      const receiveTranscript = callback.current;
      let bytes = 0;
      recorder.ondataavailable = event => {
        if (event.data.size) { chunks.push(event.data); bytes += event.data.size; }
        if (bytes > 4_000_000 && recorder.state !== 'inactive') stopRecording();
      };
      recorder.onerror = () => {
        stopRecording(false);
        setRecordingError('تعذر إكمال التسجيل. حاول مجدداً.');
      };
      recorder.onstop = async () => {
        recorder.stream.getTracks().forEach(track => track.stop());
        window.clearInterval(timerRef.current);
        if (!mounted.current) return;
        const durationSeconds = Math.round((Date.now() - started) / 1000);
        setIsRecording(false);
        setTranscribing(true);
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' });
          if (!blob.size || blob.size > 4_000_000) throw new Error('التسجيل فارغ أو طويل جداً. سجّل مقطعاً أقصر.');
          const audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(',')[1]);
            reader.onerror = () => reject(new Error('تعذر قراءة التسجيل.'));
            reader.readAsDataURL(blob);
          });
          const result = await api<{ transcript: string }>('gemini-studio', {
            action: 'transcribe', audio, mimeType: blob.type,
          });
          if (!result.transcript?.trim()) throw new Error('لم يتم التعرف على كلام واضح في التسجيل.');
          if (mounted.current) receiveTranscript(result.transcript, durationSeconds);
        } catch (error) {
          if (mounted.current) setRecordingError(error instanceof Error ? error.message : 'تعذر تفريغ التسجيل.');
        } finally {
          recorderRef.current = null;
          if (mounted.current) setTranscribing(false);
        }
      };
      recorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => {
        const seconds = Math.floor((Date.now() - started) / 1000);
        setRecordingDuration(seconds);
        if (seconds >= 120) stopRecording();
      }, 1000);
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      recorderRef.current = null;
      if (mounted.current) setRecordingError(error instanceof Error && error.name !== 'NotAllowedError'
        ? error.message : 'تعذر الوصول إلى الميكروفون. يرجى منح الإذن في المتصفح.');
    } finally {
      starting.current = false;
      if (mounted.current) setIsStarting(false);
    }
  }

  return { isRecording, isStarting, transcribing, recordingDuration, recordingError, startRecording, stopRecording };
}
