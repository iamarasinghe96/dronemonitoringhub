import { GoogleGenAI } from '@google/genai';
import { ChatMessage, GroundingSource } from '../types';

const SYSTEM_PROMPT = `You are a knowledgeable assistant specializing in Sri Lanka's drone regulations,
managed by the Civil Aviation Authority of Sri Lanka (CAASL) and the Ministry of Defence.
Answer questions about drone categories (A/B/C), restricted zones, permit requirements, and flight rules.
Be concise, accurate, and always recommend consulting official CAASL Gazette publications for legal matters.`;

class GeminiService {
  private client: GoogleGenAI | null = null;
  private chatHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  private getClient(): GoogleGenAI | null {
    if (this.client) return this.client;
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key || key === 'undefined') return null;
    this.client = new GoogleGenAI({ apiKey: key });
    return this.client;
  }

  async askDroneQuestion(question: string): Promise<{ text: string; sources: GroundingSource[] }> {
    const client = this.getClient();
    if (!client) {
      return {
        text: 'AI Assistant is not configured. Please set VITE_GEMINI_API_KEY in your .env file to enable this feature.',
        sources: [],
      };
    }

    try {
      this.chatHistory.push({ role: 'user', parts: [{ text: question }] });

      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: this.chatHistory,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text ?? 'No response generated.';
      this.chatHistory.push({ role: 'model', parts: [{ text }] });

      const sources: GroundingSource[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      for (const chunk of chunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      }

      return { text, sources };
    } catch (err: any) {
      const msg = err?.message ?? 'An error occurred with the AI service.';
      this.chatHistory.pop();
      return { text: `Error: ${msg}`, sources: [] };
    }
  }

  clearHistory(): void {
    this.chatHistory = [];
  }
}

export const geminiService = new GeminiService();
