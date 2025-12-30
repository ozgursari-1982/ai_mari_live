
import React from 'react';
import { LessonDocument } from '../types';
import { Icons } from '../constants';

interface Props {
  documents: LessonDocument[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  zoomLevel: number;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DocumentViewer: React.FC<Props> = ({ documents, currentIndex, onIndexChange, zoomLevel, onUpload }) => {
  const currentDoc = documents[currentIndex];

  const nextDoc = () => {
    if (currentIndex < documents.length - 1) onIndexChange(currentIndex + 1);
  };

  const prevDoc = () => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  };

  return (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center p-8 overflow-auto relative">
      <div className="absolute top-4 left-6 z-20">
        <h2 className="text-sm font-bold text-slate-400 bg-white/50 backdrop-blur px-3 py-1 rounded-full uppercase tracking-tighter">
          {currentDoc ? currentDoc.displayName : 'Kein Dokument'}
        </h2>
      </div>

      <div className="absolute top-4 right-6 z-20">
        <label className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg cursor-pointer hover:bg-slate-50 transition-all border border-slate-200 active:scale-95">
          <Icons.Plus className="w-6 h-6 text-indigo-600" />
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      </div>

      {documents.length > 1 && (
        <>
          <button 
            onClick={prevDoc}
            className={`absolute left-4 z-30 p-4 bg-white/90 backdrop-blur rounded-full shadow-xl transition-all ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-white active:scale-90'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-slate-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button 
            onClick={nextDoc}
            className={`absolute right-4 z-30 p-4 bg-white/90 backdrop-blur rounded-full shadow-xl transition-all ${currentIndex === documents.length - 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-white active:scale-90'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-slate-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {!currentDoc ? (
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icons.Document className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">Laden Sie einen Screenshot hoch</p>
          <p className="text-slate-400 text-sm mt-1">Mari wird Ihnen helfen, die Lektion zu meistern.</p>
        </div>
      ) : (
        <div 
          className="bg-white shadow-2xl origin-center transition-transform duration-200 ease-out p-1 relative"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img 
            src={`data:${currentDoc.type};base64,${currentDoc.data}`} 
            alt={currentDoc.name} 
            className="max-w-[85vw] max-h-[65vh] object-contain pointer-events-none"
          />
        </div>
      )}

      {documents.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
            <div className="flex gap-1.5 bg-white/50 backdrop-blur px-3 py-1.5 rounded-full border border-white/50 shadow-sm">
              {documents.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => onIndexChange(i)}
                    className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-indigo-600 w-8' : 'bg-slate-300 w-4 hover:bg-slate-400'}`} 
                  />
              ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
