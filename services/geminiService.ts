
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Helper to decode base64 strings to Uint8Array for audio processing
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to encode Uint8Array to base64 strings for audio streaming
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decode raw PCM audio bytes to an AudioBuffer for playback
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Create an audio/pcm blob for the Live API from Float32Array microphone data
export function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export class GeminiService {
  constructor() { }

  // Initial deep analysis: Verbatim extraction and problem solving from images
  async analyzeDocumentInitially(currentDoc: any) {
    if (!currentDoc?.data) return null;
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document: currentDoc })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Initial Analysis Error:", error);
      return null;
    }
  }

  // Handle standard text chat with history and document context
  async sendChatMessage(message: string, currentDoc: any, history: any[] = []) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          document: currentDoc,
          history
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Es gab ein Problem. Können wir es nochmal versuchen?";
    }
  }

  // Connect to Live API: Focus on personality using Chat History as "The Truth"
  connectLive(currentDoc: any, chatHistory: any[], callbacks: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const historyContext = chatHistory.length > 0
      ? `\n\n### DEINE MASTER-DATENBANK (CHAT-HISTORIE):\n${chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}`
      : "";

    const livePrompt = `### DEIN AUFTRAG IM GESPRÄCH:
    - Du hast alle Fakten bereits in der MASTER-DATENBANK (siehe unten).
    - Wenn der Schüler fragt, antworte basierend auf dieser Datenbank.
    - Sei eine motivierende Lehrerin. Sag nicht "Laut Chat...", sondern sag "In dem Text steht...".
    - Nutze die Live-Kamera/Bilder nur zur Bestätigung, verlasse dich für Texte auf die Datenbank.
    ${historyContext}`;

    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: SYSTEM_INSTRUCTION + `\n\n${livePrompt}`,
      },
    });
  }
}

export const gemini = new GeminiService();
