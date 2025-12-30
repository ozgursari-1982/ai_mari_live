
import React, { useState, useEffect, useRef } from 'react';
import { Session } from '../types';
import { Icons } from '../constants';

interface Props {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

const HistorySidebar: React.FC<Props> = ({ sessions, activeSessionId, onSelectSession, onNewSession, onRenameSession }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setTempTitle(session.title);
  };

  const saveEdit = (id: string) => {
    onRenameSession(id, tempTitle.trim() || 'Unbenannte Sitzung');
    setEditingId(null);
  };

  // Ensure the editing input is visible and scrolled into view
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [editingId]);

  return (
    <div className="h-full bg-slate-50 flex flex-col p-6">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-light text-slate-800 tracking-tight">Deine Reisen</h2>
          <p className="text-xs text-slate-400 mt-1">Lernfortschritt & Dokumente</p>
        </div>
        <button 
          onClick={onNewSession}
          className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 text-white hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <Icons.Plus className="w-5 h-5" />
        </button>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-20"
      >
        {sessions.length === 0 ? (
          <div className="text-center text-slate-400 py-12 bg-white/50 rounded-2xl border border-dashed border-slate-200">
            <Icons.History className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Noch keine Sitzungen vorhanden.</p>
            <button onClick={onNewSession} className="text-indigo-600 text-xs font-semibold mt-2 hover:underline">Erste Sitzung erstellen</button>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full group text-left p-5 rounded-2xl transition-all border cursor-pointer relative ${
                activeSessionId === session.id 
                  ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-50 ring-1 ring-indigo-50 translate-x-1' 
                  : 'bg-white/40 border-transparent hover:bg-white/80 hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                {editingId === session.id ? (
                  <div className="flex-1 mr-2" onClick={e => e.stopPropagation()}>
                    <input 
                      ref={inputRef}
                      className="text-sm font-semibold bg-indigo-50 border-b-2 border-indigo-600 outline-none w-full px-2 py-1 rounded-t shadow-inner"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={() => saveEdit(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(session.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <p className="text-[10px] text-indigo-400 mt-1">Drücke 'Enter' zum Speichern</p>
                  </div>
                ) : (
                  <span className={`text-base font-medium truncate flex-1 ${activeSessionId === session.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {session.title}
                  </span>
                )}
                
                {!editingId && (
                  <button 
                    onClick={(e) => startEditing(e, session)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-500">
                 <div className="flex items-center gap-1.5">
                    <Icons.Document className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-medium">{session.documents.length}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Icons.Chat className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-medium">
                      {session.documents.reduce((total, doc) => total + doc.messages.length, 0)}
                    </span>
                 </div>
                 <span className="text-[10px] text-slate-400 ml-auto bg-slate-100 px-2 py-0.5 rounded-full">
                  {new Date(session.lastActive).toLocaleDateString()}
                 </span>
              </div>

              {activeSessionId === session.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
              )}
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 mt-auto pt-4 border-t border-slate-200">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-100">
           <div className="flex items-center gap-2 mb-2">
             <div className="p-1 bg-white/20 rounded-md">
               <Icons.History className="w-4 h-4" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest">Mari KI-Hafıza</p>
           </div>
           <p className="text-xs text-indigo-100 leading-relaxed opacity-90">Mari merkt sich alle Dokumente und Ihre Fortschritte über die Sitzungen hinweg.</p>
        </div>
      </div>
    </div>
  );
};

export default HistorySidebar;
