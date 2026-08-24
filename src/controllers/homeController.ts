import { Request, Response } from 'express';
import { fetchAndCacheDevices } from '../tuyaApi';
import { AiFactory } from '../ai/AiFactory';
import { GeneratorFactory } from '../generators/GeneratorFactory';

export const setHome = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, temperature, humidity, provider = 'gemini' } = req.body;

    if (!text || temperature === undefined || humidity === undefined) {
      res.status(400).json({ error: 'Missing required fields: text, temperature, humidity' });
      return;
    }

    // 1. Get cached devices from Tuya API / Redis
    const devices = await fetchAndCacheDevices();

    // 2. Instantiate correct AI Provider
    const aiProvider = AiFactory.getProvider(provider);

    // 3. Generate Commands using AI
    console.log(`Using AI provider: ${provider} to generate commands...`);
    const { commands: targetDeviceCommands, text: aiMessage } = await aiProvider.generateCommands(
      text,
      temperature,
      humidity,
      devices
    );

    console.log('AI Generated Commands:', JSON.stringify(targetDeviceCommands, null, 2));
    console.log('AI Message:', aiMessage);

    const results = await Promise.all(
      targetDeviceCommands.map(async (target) => {
        if (!target.device_id || !target.commands || Object.keys(target.commands).length === 0) {
          return null;
        }
        try {
          const generator = GeneratorFactory.getGenerator(target.device_type);
          const result = await generator.execute(target, target.commands, devices);

          return {
            device_id: target.device_id,
            success: result.success,
            msg: result.success ? 'Command executed successfully' : result.msg
          };
        } catch (err: any) {
          return {
            device_id: target.device_id,
            success: false,
            error: err.message
          };
        }
      })
    );

    // 5. Return results
    res.json({
      success: true,
      message: aiMessage,
      commands: targetDeviceCommands,
      execution_results: results.filter(Boolean)
    });
  } catch (error: any) {
    console.error('Error in /set-home:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
