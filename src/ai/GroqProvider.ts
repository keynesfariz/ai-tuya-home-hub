import Groq from 'groq-sdk';
import { AiProvider, TargetDeviceCommandSet } from './AiProvider';
import { CachedDevice, DeviceType } from '../tuya';
import { getSystemPrompt } from '../mappings/deviceSchemas';
import dotenv from 'dotenv';

dotenv.config();

export class GroqProvider implements AiProvider {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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

    // Groq doesn't natively enforce complex JSON schema natively like Gemini structured output in all models,
    // but it supports JSON mode. We provide instructions to return JSON.
    const systemPrompt = getSystemPrompt() + `
You MUST respond with ONLY a raw JSON object and nothing else.
Format:
{
  "target_devices": [
    {
      "device_id": "...",
      "commands": [
        { "code": "..." } // value is optional depending on the command
      ]
    }
  ]
}`;

    const response = await this.groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: process.env.GROQ_MODEL || 'llama3-70b-8192',
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    try {
      const parsed = JSON.parse(content);
      return parsed.target_devices || [];
    } catch (err) {
      throw new Error('Failed to parse Groq response: ' + err);
    }
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

    const systemPrompt = `You MUST respond with ONLY a raw JSON object and nothing else.
Format:
{
  "classifications": [
    {
      "device_id": "...",
      "device_type": "AC" | "Light" | "IR"
    }
  ]
}`;

    const response = await this.groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: process.env.GROQ_MODEL || 'llama3-70b-8192',
      response_format: { type: 'json_object' }
    });

    const contentStr = response.choices[0]?.message?.content;
    if (!contentStr) {
      return [];
    }

    try {
      const parsed = JSON.parse(contentStr);
      return parsed.classifications || [];
    } catch (err) {
      console.error('Failed to parse Groq classification', err);
      return [];
    }
  }
}
