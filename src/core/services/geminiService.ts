import axios from 'axios';
import { AppConfig } from '../config/appConfig';
import { getErrorMessage } from '../api/errors';

/**
 * Gemini AI chat service — port of Flutter's gemini_service.dart.
 *
 * The Flutter version used the google_generative_ai package's ChatSession;
 * here we call the REST generateContent endpoint directly and keep the
 * conversation history ourselves, which is what ChatSession did internally.
 */

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
        // Don't keep the unanswered turn in history
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

  /** Start a fresh conversation. */
  reset(): void {
    this.history = [];
  }
}
