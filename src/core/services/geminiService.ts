import axios from 'axios';
import { AppConfig } from '../config/appConfig';
import { getErrorMessage } from '../api/errors';



const MODEL = 'gemini-1.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface ContentPart {
  text: string;
}

interface Content {
  role: 'user' | 'model';
  parts: ContentPart[];
}

export class GeminiService {
  private history: Content[] = [];

  async sendMessage(text: string): Promise<string> {
    this.history.push({ role: 'user', parts: [{ text }] });

    try {
      const res = await axios.post(
        `${ENDPOINT}?key=${AppConfig.geminiApiKey}`,
        {
          systemInstruction: {
            parts: [{ text: AppConfig.geminiSystemPrompt }],
          },
          contents: this.history,
        },
        { timeout: 15000 },
      );

      const data = res.data;
      const reply: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply || reply.trim().length === 0) {
        this.history.pop();
        return 'Sorry, I cannot answer right now.';
      }

      const trimmed = reply.trim();
      this.history.push({ role: 'model', parts: [{ text: trimmed }] });
      return trimmed;
    } catch (e) {
      this.history.pop();
      console.warn(`Gemini API error: ${getErrorMessage(e)}`);
      return 'Sorry, I cannot answer right now.';
    }
  }

  
  reset(): void {
    this.history = [];
  }
}
