import { GoogleGenAI, Type } from '@google/genai';
import { AiProvider, TargetDeviceCommandSet } from './AiProvider';
import { CachedDevice, DeviceType } from '../tuya';
import { getSystemPrompt } from '../mappings/deviceSchemas';
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
  ): Promise<TargetDeviceCommandSet[]> {
    const prompt = `User Request: "${text}"
Current Room Temperature: ${temperature}°C
Current Room Humidity: ${humidity}%
Available Devices:
${JSON.stringify(devices, null, 2)}
`;

    // We define the schema here using the SDK's Type enum
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        target_devices: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              device_id: { type: Type.STRING },
              commands: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    code: { type: Type.STRING },
                    value: { description: "Any value" } as any
                  },
                  required: ["code"]
                }
              }
            },
            required: ["device_id", "commands"]
          }
        }
      },
      required: ["target_devices"]
    };

    const response = await this.ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: getSystemPrompt(),
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    if (!response.text) {
      throw new Error('No response from Gemini');
    }

    const parsed = JSON.parse(response.text);
    return parsed.target_devices || [];
  }

  async classifyDevices(rawDevices: any[]): Promise<{ device_id: string; device_type: DeviceType }[]> {
    if (!rawDevices || rawDevices.length === 0) return [];

    const prompt = `Classify the following Tuya devices into one of these types: 'AC', 'Light', or 'IR'.
Analyze the device name to determine its type.
If the name indicates an air conditioner, return 'AC'.
If the name indicates a light or bulb, return 'Light'.
If the name indicates an IR blaster or universal remote, return 'IR'.
Default to 'Light' if unsure.

Devices:
${JSON.stringify(rawDevices.map(d => ({ id: d.id, name: d.name || d.title || '' })), null, 2)}
`;

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
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
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
