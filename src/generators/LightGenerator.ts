import { CommandGenerator } from './CommandGenerator';
import { CachedDevice } from '../tuya';
import { executeCommands } from '../tuyaApi';

export class LightGenerator implements CommandGenerator {
  async execute(device: CachedDevice, commands: { code: string; value: any }[], allDevices: CachedDevice[]): Promise<any> {
    console.log(`Executing commands for Light ${device.device_id}:`, JSON.stringify(commands, null, 2));

    const commandArray = commands;

    if (!commandArray || commandArray.length === 0) {
      return { success: true, msg: 'No commands to execute' };
    }

    const result = await executeCommands(device.device_id, commandArray);
    console.log(`Command execution results for Light ${device.device_id}:`, JSON.stringify(result, null, 2));
    return result;
  }
}
