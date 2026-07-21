import api from '../api/client';
import { getErrorMessage } from '../api/errors';

const HEALTH_INSIGHT_SESSION_ID = 'health-insight';

export class GeminiService {
  private sessionId: string = HEALTH_INSIGHT_SESSION_ID;

  async sendMessage(text: string): Promise<string> {
    try {
      const res = await api.post('/chat/message', {
        message: text,
        sessionId: this.sessionId,
      });

      const content: string | undefined = res.data?.content;
      if (!content || content.trim().length === 0) {
        return 'Sorry, I cannot answer right now.';
      }

      return content.trim();
    } catch (e) {
      console.warn(`Chat AI error: ${getErrorMessage(e)}`);
      return 'Sorry, I cannot answer right now.';
    }
  }

  reset(): void {
    this.sessionId = HEALTH_INSIGHT_SESSION_ID;
  }
}
