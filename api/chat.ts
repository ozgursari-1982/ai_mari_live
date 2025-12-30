import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, document, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Import Gemini SDK
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const SYSTEM_INSTRUCTION = `
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

        // Build conversation history
        const contents: any[] = (history || []).map((m: any) => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        // Add current message with optional document
        const userParts: any[] = [];
        if (document?.data) {
            userParts.push({ inlineData: { data: document.data, mimeType: document.type } });
        }
        userParts.push({ text: message });

        contents.push({
            role: 'user',
            parts: userParts
        });

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.0
            }
        });

        return res.status(200).json({
            text: response.text,
            success: true
        });

    } catch (error: any) {
        console.error('Chat error:', error);
        return res.status(500).json({
            error: 'Chat failed',
            message: error.message
        });
    }
}
