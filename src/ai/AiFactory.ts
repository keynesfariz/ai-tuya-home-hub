import { AiProvider } from './AiProvider';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';

export class AiFactory {
  static getProvider(providerName: string): AiProvider {
    switch (providerName.toLowerCase()) {
      case 'groq':
        return new GroqProvider();
      case 'gemini':
      default:
        return new GeminiProvider();
    }
  }
}
