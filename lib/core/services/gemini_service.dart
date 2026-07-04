import 'package:google_generative_ai/google_generative_ai.dart';
import '../config/app_config.dart';

class GeminiService {
  late final ChatSession _chat;

  GeminiService() {
    final model = GenerativeModel(
      model: 'gemini-1.5-flash',
      apiKey: AppConfig.geminiApiKey,
      systemInstruction: Content.system(AppConfig.geminiSystemPrompt),
    );
    _chat = model.startChat();
  }

  Future<String> sendMessage(String text) async {
    final response = await _chat.sendMessage(Content.text(text));
    return response.text?.trim() ?? 'Sorry, I cannot answer right now.';
  }
}
