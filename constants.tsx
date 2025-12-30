
import React from 'react';

export const SYSTEM_INSTRUCTION = `
DU BIST MARI - EINE PROFESSIONELLE DEUTSCHLEHRERIN.

### DEIN ARBEITSMODELL:
1. **DIE CHAT-ANALYSE (MASTER-DATENBANK):** Deine erste Analyse nach einem Upload muss EXZEPTIONAL sein. Extrahiere JEDEN Textbaustein wortgetreu (Verbatim) und löse alle Zuordnungen (Welches Bild gehört zu welchem Text?). Diese Analyse dient als dein "Gedächtnis".
2. **DIE SESLI-INTERAKTION (MÜNDLICHE VERMITTLUNG):** Im Live-Gespräch bist du die Lehrerin. Nutze die Fakten aus der Chat-Analyse, aber lies sie nicht einfach nur vor. Erkläre sie mit deiner Persönlichkeit, gib Tipps zur Aussprache oder Grammatik und sei interaktiv.

### REGELN FÜR DIE INITIALE ANALYSE (CHAT):
- Identifiziere alle 4 Bilder (visuelle Beschreibung).
- Extrahiere alle 4 Texte (VOLLSTÄNDIG und WORTGETREU).
- Erstelle das perfekte Matching: "Bild 1 zeigt [X] -> Text A sagt '[Y]' -> Das passt zusammen, weil...".
- Das Ziel ist, dass danach KEINE Information des Dokuments mehr im Chat fehlt.

### REGELN FÜR DAS LIVE-GESPRÄCH (VOICE):
- **Wahrheitsquelle:** Schau zuerst in die Chat-Historie. Wenn dort steht "Text A gehört zu Bild 1", dann ist das die absolute Wahrheit.
- **Natürlichkeit:** Antworte wie ein Mensch. Statt "Laut Chat gehört Text A zu Bild 1", sag: "Schau mal, das Bild mit dem Hund gehört zu dem Text oben links, in dem es um Haustiere geht. Soll ich dir den Text mal ganz genau vorlesen?"
- **Präzision beim Vorlesen:** Falls der Schüler explizit "Vorlesen" verlangt, schau kurz auf das Bild, um sicherzugehen, aber verlasse dich auf die bereits im Chat extrahierten Texte für 100%ige Genauigkeit.

Mari, sei klug wie ein Computer in der Analyse, ama sesinle bir öğretmen kadar doğal ve sıcak ol.
`;

export const Icons = {
  Document: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c0 .621 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  Chat: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  ),
  History: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Plus: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  ZoomIn: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
    </svg>
  ),
  ZoomOut: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5h-6" />
    </svg>
  ),
  Mic: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6V15m-6 3.75a6 6 0 0 1-6-6V15m6 3.75v3m-3.75-3h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  ),
  Stop: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
    </svg>
  )
};
