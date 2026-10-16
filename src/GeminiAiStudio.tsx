import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Search,
  MapPin,
  RefreshCw,
  LogIn,
  LogOut,
  Archive,
  MessageSquare,
  Zap,
  Flame,
  ShieldCheck,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
  testConnection,
  type FirebaseUser
} from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  type DocumentData
} from 'firebase/firestore';
import './GeminiAiStudio.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  groundingSources?: string[];
  createdAt: string;
}

interface TranscriptRecord {
  id: string;
  title: string;
  transcriptText: string;
  durationSeconds: number;
  createdAt: string;
}

type ModelTier = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon';
type PersonaKey = 'studio_director' | 'gateway_architect' | 'campaign_strategist';

export default function GeminiAiStudio() {
  const [activeTab, setActiveTab] = useState<'chat' | 'transcripts'>('chat');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firestoreReady, setFirestoreReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Model & Persona Configuration
  const [selectedModel, setSelectedModel] = useState<ModelTier>('gemini-3.8-flash');
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>('studio_director');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(false);
  const [enableMapsGrounding, setEnableMapsGrounding] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Transcripts Archive
  const [savedTranscripts, setSavedTranscripts] = useState<TranscriptRecord[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Check Firestore connection and listen for Auth changes
  useEffect(() => {
    testConnection().then(ok => setFirestoreReady(ok));
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Listen for saved transcripts if user is authenticated
  useEffect(() => {
    if (!user) {
      setSavedTranscripts([]);
      return;
    }
    const path = 'voice_transcripts';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const loaded: TranscriptRecord[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              title: data.title || 'تسجيل صوتي',
              transcriptText: data.transcriptText || '',
              durationSeconds: data.durationSeconds || 0,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            });
          });
          setSavedTranscripts(loaded);
        },
        error => {
          handleFirestoreError(error, OperationType.GET, path);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore snapshot subscription warning:', err);
    }
  }, [user]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle Firebase Sign In
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Audio Recording Handlers (using Web Audio API and MediaRecorder)
  const startRecording = async () => {
    setRecordingError(null);
    setLastTranscript(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioTranscription(audioBlob);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setRecordingError('تعذر الوصول إلى الميكروفون. يرجى منح الإذن في المتصفح.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Convert Blob to Base64 and call server transcription endpoint
  const processAudioTranscription = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          // Strip data url prefix (e.g. "data:audio/webm;base64,")
          const base64Data = result.split(',')[1] || result;
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      const res = await fetch('/.netlify/functions/gemini-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transcribe',
          audio: base64Audio,
          mimeType: blob.type || 'audio/webm',
        }),
      });

      const data = await res.json();
      if (data.transcript) {
        setLastTranscript(data.transcript);
        // If user is authenticated, save automatically to Firestore
        if (user) {
          try {
            await addDoc(collection(db, 'voice_transcripts'), {
              userId: user.uid,
              title: data.transcript.slice(0, 45) + '...',
              transcriptText: data.transcript,
              durationSeconds: recordingDuration,
              createdAt: serverTimestamp(),
            });
          } catch (e) {
            console.warn('Could not auto-save transcript to Firestore:', e);
          }
        }
      } else if (data.error) {
        setRecordingError(data.error);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setRecordingError('حدث خطأ أثناء معالجة الصوت وتحويله إلى نص.');
    } finally {
      setTranscribing(false);
    }
  };

  // Send Multi-Turn Message to Gemini
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || sending) return;

    const userMsg: Message = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: textToSend,
      createdAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setSending(true);

    try {
      // Build history payload for Gemini
      const historyPayload = messages.slice(-8).map(m => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        content: m.content,
      }));

      const res = await fetch('/.netlify/functions/gemini-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          message: textToSend,
          history: historyPayload,
          model: selectedModel,
          persona: selectedPersona,
          enableSearchGrounding,
          enableMapsGrounding,
        }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        id: 'ast-' + Date.now(),
        role: 'assistant',
        content: data.answer || 'تعذر استلام رد من النموذج، يرجى المحاولة لاحقاً.',
        model: data.modelUsed || selectedModel,
        groundingSources: data.groundingSources,
        createdAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من الشبكة وإعادة المحاولة.',
          createdAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const suggestions = [
    {
      title: 'باقات تصوير المنتجات',
      prompt: 'ما هي مواصفات وتكلفة باقة تصوير المنتجات (PHT-01) وكيف يتم تسليم المواد للعميل؟',
    },
    {
      title: 'تفعيل بوابات الدفع بالسعودية',
      prompt: 'كيف أربط بوابة PayTabs وبوابة Telr مع تفعيل بطاقات مدى و Apple Pay في OneShot؟',
    },
    {
      title: 'خطة إعلانات ريلز 4K',
      prompt: 'اقترح لي سيناريو تسويقي جذاب لـ 5 مقاطع ريلز قصيرة لزيادة مبيعات متجر أزياء.',
    },
  ];

  return (
    <div className="gemini-studio-container" dir="rtl">
      {/* Top Header */}
      <div className="gemini-studio-header">
        <div className="gemini-studio-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--flame, #f05b2b)', display: 'flex' }}><Sparkles size={20} /></span>
            <span className="eyebrow" style={{ margin: 0 }}>استوديو الذكاء الاصطناعي المتقدم</span>
          </div>
          <h1>OneShot Gemini AI Suite</h1>
          <p>
            تكامل متعدد الأدوار للمحادثات الذكية وتوليد الأفكار الإنتاجية، مع تحويل الصوت إلى نصوص عبر الميكروفون
            بدقة فائقة وحفظ الجلسات في قاعدة بيانات Firestore.
          </p>
        </div>

        {/* Firebase Authentication & Cloud Status */}
        <div className="gemini-auth-status">
          <div className="firebase-badge">
            <span className={`status-dot ${firestoreReady ? '' : 'offline'}`} />
            <span>{firestoreReady ? 'Firestore متصل' : 'سحابة Firebase'}</span>
          </div>
          <span style={{ color: '#d1d5db' }}>|</span>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="icon-button"
                title="تسجيل الخروج من Firebase"
                style={{ padding: '4px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="outline-button"
              style={{ fontSize: '11px', padding: '6px 12px', minHeight: '34px' }}
            >
              <LogIn size={14} />
              <span>{authLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل دخول Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Model & Persona Configuration Controls */}
      <div className="gemini-controls-grid">
        {/* Persona Selector */}
        <div className="control-group">
          <label className="control-label">
            <Bot size={15} style={{ color: 'var(--flame, #f05b2b)' }} />
            <span>المستشار الذكي المتخصص</span>
          </label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${selectedPersona === 'studio_director' ? 'active' : ''}`}
              onClick={() => setSelectedPersona('studio_director')}
            >
              المدير الإبداعي (Studio)
            </button>
            <button
              type="button"
              className={`segmented-btn ${selectedPersona === 'gateway_architect' ? 'active' : ''}`}
              onClick={() => setSelectedPersona('gateway_architect')}
            >
              مهندس البوابات (FinTech)
            </button>
            <button
              type="button"
              className={`segmented-btn ${selectedPersona === 'campaign_strategist' ? 'active' : ''}`}
              onClick={() => setSelectedPersona('campaign_strategist')}
            >
              خبير الحملات (Growth)
            </button>
          </div>
        </div>

        {/* Model Tier Selector */}
        <div className="control-group">
          <label className="control-label">
            <Zap size={15} style={{ color: '#d97706' }} />
            <span>نموذج المعالجة المختار</span>
          </label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${selectedModel === 'gemini-3.8-flash' ? 'active' : ''}`}
              onClick={() => setSelectedModel('gemini-3.8-flash')}
            >
              Flash (عام ومتوازن)
            </button>
            <button
              type="button"
              className={`segmented-btn ${selectedModel === 'gemini-3.1-flash-lite' ? 'active' : ''}`}
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
            >
              Lite (فوري وسريع)
            </button>
            <button
              type="button"
              className={`segmented-btn ${selectedModel === 'gemini-4-argon' ? 'active' : ''}`}
              onClick={() => setSelectedModel('gemini-4-argon')}
            >
              Argon (تفكير معمّق)
            </button>
          </div>
        </div>

        {/* Grounding Controls */}
        <div className="control-group">
          <label className="control-label">
            <ShieldCheck size={15} style={{ color: '#2563eb' }} />
            <span>الربط والتحقق المباشر (Grounding)</span>
          </label>
          <div className="grounding-toggles">
            <button
              type="button"
              className={`toggle-chip ${enableSearchGrounding ? 'active' : ''}`}
              onClick={() => {
                setEnableSearchGrounding(!enableSearchGrounding);
                if (!enableSearchGrounding) setEnableMapsGrounding(false);
              }}
            >
              <Search size={14} />
              <span>بحث Google مباشر</span>
            </button>
            <button
              type="button"
              className={`toggle-chip ${enableMapsGrounding ? 'active' : ''}`}
              onClick={() => {
                setEnableMapsGrounding(!enableMapsGrounding);
                if (!enableMapsGrounding) setEnableSearchGrounding(false);
              }}
            >
              <MapPin size={14} />
              <span>بيانات خرائط Google</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Recorder & Transcription Bar */}
      <div className="audio-recorder-panel">
        <div className="recorder-info">
          <button
            type="button"
            className={`mic-circle-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={transcribing}
            title={isRecording ? 'إيقاف التسجيل والتحويل إلى نص' : 'بدء تسجيل صوتي عبر الميكروفون'}
          >
            {isRecording ? <Square size={18} /> : <Mic size={20} />}
          </button>
          <div className="recorder-text">
            <strong>
              {isRecording
                ? 'جارٍ التسجيل المباشر...'
                : transcribing
                ? 'جارٍ معالجة الصوت ونقله عبر gemini-3.5-transcribe...'
                : 'التسجيل الصوتي المباشر (Voice Transcription)'}
            </strong>
            <small>
              {isRecording ? formatTimer(recordingDuration) : 'اضغط على الميكروفون للتحدث وسيقوم الذكاء الاصطناعي بتفريغ كلامك'}
            </small>
          </div>
        </div>

        {/* Live Transcript Preview Box */}
        {lastTranscript && (
          <div className="transcript-preview-bar">
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lastTranscript}
            </span>
            <div className="transcript-actions">
              <button
                type="button"
                className="light-button"
                style={{ fontSize: '10px', padding: '4px 8px', minHeight: '28px' }}
                onClick={() => setInputMessage(prev => (prev ? prev + ' ' + lastTranscript : lastTranscript))}
              >
                إدراج في المحادثة
              </button>
              <button
                type="button"
                className="light-button"
                style={{ fontSize: '10px', padding: '4px 8px', minHeight: '28px' }}
                onClick={() => copyToClipboard(lastTranscript, 'trans-preview')}
              >
                {copiedId === 'trans-preview' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        )}

        {recordingError && (
          <div style={{ color: '#f87171', fontSize: '11px', width: '100%', marginTop: '4px' }}>
            {recordingError}
          </div>
        )}
      </div>

      {/* Workspace Tabs (Chat vs Transcripts Archive) */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border, #e8eaeb)', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`outline-button ${activeTab === 'chat' ? 'primary-button' : ''}`}
          style={{ minHeight: '38px', fontSize: '11px' }}
        >
          <MessageSquare size={15} />
          <span>المحادثة والاستشارة الذكية</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transcripts')}
          className={`outline-button ${activeTab === 'transcripts' ? 'primary-button' : ''}`}
          style={{ minHeight: '38px', fontSize: '11px' }}
        >
          <Archive size={15} />
          <span>أرشيف التفريغ الصوتي ({savedTranscripts.length})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'chat' ? (
        <div className="gemini-chat-card">
          {/* Scrollable Message History */}
          <div className="chat-history-scroll">
            {messages.length === 0 ? (
              <div className="chat-empty-slate">
                <div className="icon-box">
                  <Bot size={28} />
                </div>
                <h3>مرحباً بك في جلسة العمل الاستشارية</h3>
                <p>
                  اختر أحد المقترحات أدناه أو اكتب استفسارك مباشرة، كما يمكنك التحدث عبر الميكروفون
                  لتفريغ صوتك فوراً.
                </p>
                <div className="prompt-suggestions">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-btn"
                      onClick={() => handleSendMessage(item.prompt)}
                    >
                      <strong style={{ display: 'block', marginBottom: '2px' }}>{item.title}</strong>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{item.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`chat-message-row ${msg.role}`}>
                  <div className="msg-avatar">
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                  </div>
                  <div className="msg-body-wrapper">
                    <div className="msg-bubble">{msg.content}</div>
                    <div className="msg-meta-line">
                      <span>{msg.createdAt}</span>
                      {msg.model && (
                        <>
                          <span>·</span>
                          <span style={{ fontFamily: 'Outfit', fontWeight: 600 }}>{msg.model}</span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="text-button"
                        style={{ padding: '0 4px', fontSize: '10px' }}
                      >
                        {copiedId === msg.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Citations if Grounded */}
                    {msg.groundingSources && msg.groundingSources.length > 0 && (
                      <div className="msg-citations">
                        <strong style={{ fontSize: '10px', color: '#1e293b' }}>المصادر والتحقق:</strong>
                        {msg.groundingSources.map((source, sIdx) => (
                          <span key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ExternalLink size={10} />
                            <span>{source}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="chat-message-row assistant">
                <div className="msg-avatar">
                  <Bot size={18} />
                </div>
                <div className="msg-body-wrapper">
                  <div className="msg-bubble" style={{ color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>جارٍ التفكير وصياغة الرد عبر {selectedModel}...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            className="chat-input-bar"
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              className="chat-text-input"
              placeholder="اكتب استفسارك أو طلبك هنا..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="send-action-btn"
            >
              <span>إرسال</span>
              <Send size={15} />
            </button>
          </form>
        </div>
      ) : (
        /* Transcripts Archive View */
        <div className="transcripts-archive-grid">
          {savedTranscripts.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '40px',
                textAlign: 'center',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <Mic size={32} style={{ color: '#9ca3af', marginBottom: '10px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>لا توجد تسجيلات محفوظة حالياً</h3>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                {user
                  ? 'سجّل صوتاً عبر الميكروفون وسيقوم النظام بتفريغه وحفظه تلقائياً في حسابك.'
                  : 'سجّل الدخول بحساب Google لحفظ وتصفح أرشيف التفريغات الصوتية عبر Firestore.'}
              </p>
            </div>
          ) : (
            savedTranscripts.map(rec => (
              <div key={rec.id} className="transcript-card">
                <div className="transcript-card-header">
                  <strong style={{ fontSize: '13px', color: '#111827' }}>{rec.title}</strong>
                  <span style={{ fontSize: '10px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} />
                    <span>{new Date(rec.createdAt).toLocaleDateString('ar-SA')}</span>
                  </span>
                </div>
                <p>{rec.transcriptText}</p>
                <div className="transcript-card-actions">
                  <button
                    type="button"
                    className="light-button"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => {
                      setInputMessage(rec.transcriptText);
                      setActiveTab('chat');
                    }}
                  >
                    فتح في المحادثة
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    title="نسخ النص"
                    onClick={() => copyToClipboard(rec.transcriptText, rec.id)}
                  >
                    {copiedId === rec.id ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    title="حذف التسجيل"
                    onClick={async () => {
                      try {
                        await deleteDoc(doc(db, 'voice_transcripts', rec.id));
                      } catch (err) {
                        handleFirestoreError(err, OperationType.DELETE, `voice_transcripts/${rec.id}`);
                      }
                    }}
                  >
                    <Square size={14} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
