
import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, Session, Message, LessonDocument } from './types';
import { Icons } from './constants';
import DocumentViewer from './components/DocumentViewer';
import ChatInterface from './components/ChatInterface';
import HistorySidebar from './components/HistorySidebar';
import { gemini, decodeAudioData, createPcmBlob, decode } from './services/geminiService';
import { LiveServerMessage } from '@google/genai';

const STORAGE_KEY = 'deutsch_mit_mari_v5';

type LiveStatus = 'idle' | 'connecting' | 'active' | 'speaking';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.CHAT);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('idle');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const audioContextRef = useRef<{
    input: AudioContext;
    output: AudioContext;
    nextStartTime: number;
    sources: Set<AudioBufferSourceNode>;
  } | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const liveSessionRef = useRef<any>(null);
  const speakingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed.sessions || []);
        setActiveSessionId(parsed.activeSessionId || null);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, activeSessionId }));
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentDoc = activeSession?.documents[activeDocIndex];

  const stopLive = () => {
    setLiveStatus('idle');
    if (liveSessionRef.current) {
      try { liveSessionRef.current.close(); } catch (e) {}
      liveSessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.sources.forEach(s => s.stop());
      try { audioContextRef.current.input.close(); } catch (e) {}
      try { audioContextRef.current.output.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    sessionPromiseRef.current = null;
  };

  const toggleLive = async () => {
    if (liveStatus !== 'idle') {
      stopLive();
      return;
    }

    if (!currentDoc) {
      alert("Bitte laden Sie zuerst ein Dokument hoch.");
      return;
    }

    setLiveStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = {
        input: inputCtx,
        output: outputCtx,
        nextStartTime: 0,
        sources: new Set()
      };

      const connPromise = gemini.connectLive(currentDoc, currentDoc.messages, {
        onopen: () => {
          setLiveStatus('active');
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            connPromise.then((session: any) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);

          if (currentDoc?.data) {
            connPromise.then((session: any) => {
              session.sendRealtimeInput({ 
                media: { data: currentDoc.data, mimeType: currentDoc.type }
              });
              session.sendRealtimeInput({ text: "Ich habe dir das Dokument erneut gezeigt. Beziehe dich bei Fragen auf unsere bisherige Chat-Analyse." });
            });
          }
        },
        onmessage: async (message: LiveServerMessage) => {
          const audioB64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioB64 && audioContextRef.current) {
            setLiveStatus('speaking');
            if (speakingTimeoutRef.current) window.clearTimeout(speakingTimeoutRef.current);
            
            const { output, nextStartTime, sources } = audioContextRef.current;
            const buffer = await decodeAudioData(decode(audioB64), output, 24000, 1);
            const source = output.createBufferSource();
            source.buffer = buffer;
            source.connect(output.destination);
            const startTime = Math.max(nextStartTime, output.currentTime);
            source.start(startTime);
            audioContextRef.current.nextStartTime = startTime + buffer.duration;
            sources.add(source);
            source.onended = () => {
              sources.delete(source);
              if (sources.size === 0) {
                 speakingTimeoutRef.current = window.setTimeout(() => setLiveStatus('active'), 500);
              }
            };
          }
          if (message.serverContent?.interrupted && audioContextRef.current) {
            audioContextRef.current.sources.forEach(s => s.stop());
            audioContextRef.current.sources.clear();
            audioContextRef.current.nextStartTime = 0;
            setLiveStatus('active');
          }
        },
        onerror: (e: any) => {
          console.error(e);
          stopLive();
        },
        onclose: () => setLiveStatus('idle')
      });

      sessionPromiseRef.current = connPromise;
      liveSessionRef.current = await connPromise;

    } catch (err) {
      alert("Mikrofonzugriff erforderlich.");
      setLiveStatus('idle');
    }
  };

  const createNewSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: 'Neue Sitzung',
      documents: [],
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setView(ViewMode.DOCUMENT);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSessionId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const docCount = activeSession?.documents.length || 0;
      
      const newDocId = Date.now().toString();
      const newDoc: LessonDocument = {
        id: newDocId,
        name: file.name,
        displayName: `Lektion ${docCount + 1}`,
        type: file.type,
        data: base64,
        messages: [{
          id: 'system-' + Date.now(),
          role: 'model',
          text: `Hallo! Ich scanne "${file.name}" jetzt ganz genau für dich ein...`,
          timestamp: Date.now()
        }],
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, documents: [...s.documents, newDoc], lastActive: Date.now() }
          : s
      ));
      setActiveDocIndex(docCount);
      setView(ViewMode.CHAT);
      
      setIsAnalyzing(true);
      try {
        const analysis = await gemini.analyzeDocumentInitially(newDoc);
        if (analysis) {
          const analysisMsg: Message = {
            id: 'analysis-' + Date.now(),
            role: 'model',
            text: analysis,
            timestamp: Date.now()
          };
          setSessions(prev => prev.map(s => s.id === activeSessionId ? {
            ...s,
            documents: s.documents.map(d => d.id === newDocId ? { ...d, messages: [...d.messages, analysisMsg] } : d)
          } : s));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !activeSession || !currentDoc) return;
    const newMessage: Message = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
        ...s, documents: s.documents.map((d, i) => i === activeDocIndex ? { ...d, messages: [...d.messages, newMessage] } : d)
    } : s));

    try {
      const response = await gemini.sendChatMessage(text, currentDoc, currentDoc.messages);
      const modelMsg: Message = { id: Date.now().toString(), role: 'model', text: response || "Entschuldigung, das konnte ich nicht verarbeiten.", timestamp: Date.now() };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
          ...s, documents: s.documents.map((d, i) => i === activeDocIndex ? { ...d, messages: [...d.messages, modelMsg] } : d)
      } : s));
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeSessionId && sessions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9FBFF]">
        <div className="text-center space-y-8 px-6 max-w-lg">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <h1 className="relative text-5xl font-bold text-slate-900 tracking-tight">Deutsch mit Mari</h1>
          </div>
          <p className="text-slate-500 text-lg leading-relaxed">Präzise Analysen, interaktive Lektionen. Lerne Deutsch mit deinen eigenen Dokumenten.</p>
          <button onClick={createNewSession} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 text-lg">Lernreise starten</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white font-['Inter']">
      <header className="h-20 border-b flex items-center justify-between px-8 bg-white shrink-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-100">M</div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1">Mari AI</h1>
            <div className="flex items-center gap-2">
               {isAnalyzing ? (
                 <>
                   <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Analysiert...</span>
                 </>
               ) : liveStatus !== 'idle' ? (
                 <>
                   <div className={`w-2 h-2 rounded-full ${liveStatus === 'speaking' ? 'bg-indigo-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     {liveStatus === 'connecting' ? 'Verbindet...' : liveStatus === 'speaking' ? 'Mari spricht...' : 'Mari hört zu...'}
                   </span>
                 </>
               ) : (
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Bereit</span>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {activeSession && activeSession.documents.length > 0 && view === ViewMode.DOCUMENT && (
             <div className="flex items-center gap-2 bg-slate-50 rounded-full p-1.5 px-3 border border-slate-100">
                <button onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))} className="p-1 hover:bg-white rounded-full transition-all text-slate-400"><Icons.ZoomOut className="w-4 h-4" /></button>
                <span className="text-xs font-bold text-slate-600 min-w-[40px] text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.1))} className="p-1 hover:bg-white rounded-full transition-all text-slate-400"><Icons.ZoomIn className="w-4 h-4" /></button>
             </div>
          )}
          
          <button 
            onClick={toggleLive}
            disabled={isAnalyzing}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg relative ${isAnalyzing ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : liveStatus !== 'idle' ? 'bg-red-500 text-white shadow-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
          >
            {liveStatus === 'idle' ? <Icons.Mic className="w-6 h-6" /> : <Icons.Stop className="w-6 h-6 fill-current" />}
            {liveStatus === 'speaking' && (
              <span className="absolute -inset-2 rounded-2xl border-2 border-indigo-400 animate-ping opacity-20"></span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative bg-[#F9FBFF]">
        <div className={`h-full w-full transition-all duration-500 ease-in-out ${view === ViewMode.DOCUMENT ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'}`}>
          <DocumentViewer documents={activeSession?.documents || []} currentIndex={activeDocIndex} onIndexChange={setActiveDocIndex} zoomLevel={zoomLevel} onUpload={handleFileUpload} />
        </div>
        
        <div className={`h-full w-full transition-all duration-500 ease-in-out ${view === ViewMode.CHAT ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'}`}>
          <ChatInterface messages={currentDoc?.messages || []} onSend={handleSendMessage} currentDocName={currentDoc?.displayName} isLiveActive={liveStatus !== 'idle'} />
        </div>

        <div className={`h-full w-full transition-all duration-500 ease-in-out ${view === ViewMode.HISTORY ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'}`}>
          <HistorySidebar sessions={sessions} activeSessionId={activeSessionId} onSelectSession={setActiveSessionId} onNewSession={createNewSession} onRenameSession={(id, title) => setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))} />
        </div>
      </main>

      <nav className="h-24 border-t bg-white flex items-center justify-around px-12 shrink-0 z-40 pb-safe">
        <button onClick={() => setView(ViewMode.DOCUMENT)} className={`flex flex-col items-center gap-2 transition-all group ${view === ViewMode.DOCUMENT ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl transition-all ${view === ViewMode.DOCUMENT ? 'bg-indigo-50' : 'group-hover:bg-slate-50'}`}>
            <Icons.Document className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dokument</span>
        </button>
        <button onClick={() => setView(ViewMode.CHAT)} className={`flex flex-col items-center gap-2 transition-all group ${view === ViewMode.CHAT ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl transition-all ${view === ViewMode.CHAT ? 'bg-indigo-50' : 'group-hover:bg-slate-50'}`}>
            <Icons.Chat className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lernen</span>
        </button>
        <button onClick={() => setView(ViewMode.HISTORY)} className={`flex flex-col items-center gap-2 transition-all group ${view === ViewMode.HISTORY ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl transition-all ${view === ViewMode.HISTORY ? 'bg-indigo-50' : 'group-hover:bg-slate-50'}`}>
            <Icons.History className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Reise</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
