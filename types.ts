
export enum ViewMode {
  DOCUMENT = 'document',
  CHAT = 'chat',
  HISTORY = 'history'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface LessonDocument {
  id: string;
  name: string;
  displayName: string; // Clean title like "Lektion 1"
  type: string;
  data: string; // Base64
  messages: Message[]; // Chat belongs to document
  timestamp: number;
}

export interface AppState {
  currentView: ViewMode;
  sessions: Session[];
  activeSessionId: string | null;
  zoomLevel: number;
}

export interface Session {
  id: string;
  title: string;
  documents: LessonDocument[];
  createdAt: number;
  lastActive: number;
}
