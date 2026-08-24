import { GoogleGenAI, Type } from '@google/genai';
import { AiProvider, TargetDeviceCommandSet } from './AiProvider';
import { CachedDevice, DeviceType } from '../tuya';
import { buildGenerateCommandsPrompt, buildClassifyDevicesPrompt, getSystemPrompt } from './prompts';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiProvider implements AiProvider {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async generateCommands(
    text: string,
    temperature: number,
    humidity: number,
    devices: CachedDevice[]
  ): Promise<{ commands: TargetDeviceCommandSet[]; text: string }> {
    const prompt = buildGenerateCommandsPrompt(text, temperature, humidity, devices);

    const response = await this.ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: getSystemPrompt(),
        responseMimeType: 'application/json'
      }
    });

    if (!response.text) {
      throw new Error('No response from Gemini');
    }

    const parsed = JSON.parse(response.text);
    const targetDevices = parsed.target_devices || [];

    const commands = targetDevices.map((target: any) => {
      const device = devices.find(d => d.device_id === target.device_id);
      return {
        ...target,
        device_name: device?.device_name || 'Unknown',
        device_type: device?.device_type || 'Light'
      };
    });

    return {
      commands,
      text: parsed.text || 'Command executed'
    };
  }

  async classifyDevices(rawDevices: any[]): Promise<{ device_id: string; device_type: DeviceType }[]> {
    if (!rawDevices || rawDevices.length === 0) return [];

    const prompt = buildClassifyDevicesPrompt(rawDevices);

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        classifications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              device_id: { type: Type.STRING },
              device_type: { type: Type.STRING, enum: ['AC', 'Light', 'IR'] }
            },
            required: ["device_id", "device_type"]
          }
        }
      },
      required: ["classifications"]
    };

    const response = await this.ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    if (!response.text) {
      return [];
    }

    try {
      const parsed = JSON.parse(response.text);
      return parsed.classifications || [];
    } catch (e) {
      console.error('Failed to parse Gemini classification', e);
      return [];
    }
  }
}
