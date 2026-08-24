import Groq from 'groq-sdk';
import { AiProvider, TargetDeviceCommandSet } from './AiProvider';
import { CachedDevice, DeviceType } from '../tuya';
import { buildGenerateCommandsPrompt, buildClassifyDevicesPrompt, getSystemPrompt } from './prompts';
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
  ): Promise<{ commands: TargetDeviceCommandSet[]; text: string }> {
    const prompt = buildGenerateCommandsPrompt(text, temperature, humidity, devices);

    // Groq doesn't natively enforce complex JSON schema natively like Gemini structured output in all models,
    // but it supports JSON mode. We provide instructions to return JSON.
    const systemPrompt = getSystemPrompt();

    const response = await this.groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: process.env.GROQ_MODEL || 'qwen/qwen3.6-27b',
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    try {
      const parsed = JSON.parse(content);
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
    } catch (err) {
      throw new Error('Failed to parse Groq response: ' + err);
    }
  }

  async classifyDevices(rawDevices: any[]): Promise<{ device_id: string; device_type: DeviceType }[]> {
    if (!rawDevices || rawDevices.length === 0) return [];

    const prompt = buildClassifyDevicesPrompt(rawDevices);

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
      model: process.env.GROQ_MODEL || 'qwen/qwen3.6-27b',
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
