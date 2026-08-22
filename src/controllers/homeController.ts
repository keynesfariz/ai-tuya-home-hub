import { Request, Response } from 'express';
import { fetchAndCacheDevices, executeCommands } from '../tuya';
import { AiFactory } from '../ai/AiFactory';

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
    const targetDeviceCommands = await aiProvider.generateCommands(
      text,
      temperature,
      humidity,
      devices
    );

    console.log('AI Generated Commands:', JSON.stringify(targetDeviceCommands, null, 2));

    const results = [];

    // 4. Execute commands on Tuya
    for (const target of targetDeviceCommands) {
      if (!target.device_id || !target.commands || target.commands.length === 0) {
        continue;
      }
      try {
        const device = devices.find((d: any) => d.device_id === target.device_id);
        const isAc = device?.device_type === 'AC';

        if (isAc) {
          console.log(`Executing AC commands for device ${target.device_id} one by one:`, JSON.stringify(target.commands, null, 2));
          let allSuccess = true;
          let lastMsg = 'Executed';

          for (let i = 0; i < target.commands.length; i++) {
            const cmd = target.commands[i];
            if (!('value' in cmd) || cmd.value === undefined || cmd.value === "") {
              cmd.value = (cmd.code === 'PowerOn' || cmd.code === 'PowerOff') ? cmd.code : "";
            }
            
            // Tuya requires ENUM and STRING types for IR AC commands.
            // Even if AI generated numbers (e.g., T: 24), we must send them as strings ("24").
            if (cmd.value !== undefined && cmd.value !== null) {
              cmd.value = String(cmd.value);
            }

            console.log(`Sending AC command:`, JSON.stringify(cmd, null, 2));
            const result = await executeCommands(target.device_id, [cmd]);
            console.log(`AC command execution result for ${target.device_id}:`, JSON.stringify(result, null, 2));
            if (!result.success) {
              allSuccess = false;
              lastMsg = `${result.msg}`;
            }
          }

          results.push({
            device_id: target.device_id,
            success: allSuccess,
            msg: allSuccess ? 'Executed all AC commands' : lastMsg
          });
        } else {
          console.log(`Executing commands for device ${target.device_id} concurrently:`, JSON.stringify(target.commands, null, 2));

          const promises = target.commands.map((cmd: any) =>
            executeCommands(target.device_id, [cmd])
          );

          const promiseResults = await Promise.all(promises);
          console.log(`Command execution results for ${target.device_id}:`, JSON.stringify(promiseResults, null, 2));

          const allSuccess = promiseResults.every(r => r.success);
          const lastMsg = promiseResults.length > 0 ? promiseResults[promiseResults.length - 1].msg : 'Executed';

          results.push({
            device_id: target.device_id,
            success: allSuccess,
            msg: allSuccess ? 'Executed all commands concurrently' : lastMsg
          });
        }
      } catch (err: any) {
        results.push({
          device_id: target.device_id,
          success: false,
          error: err.message
        });
      }
    }

    // 5. Return results
    res.json({
      success: true,
      commands: targetDeviceCommands,
      execution_results: results
    });
  } catch (error: any) {
    console.error('Error in /set-home:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
