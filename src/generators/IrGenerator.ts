import { CommandGenerator } from './CommandGenerator';
import { CachedDevice } from '../tuya';
import { executeCommands } from '../tuyaApi';

export class IrGenerator implements CommandGenerator {
  async execute(device: CachedDevice, commands: { code: string; value: any }[], allDevices: CachedDevice[]): Promise<any> {
    console.log(`Executing commands for IR ${device.device_id}:`, JSON.stringify(commands, null, 2));

    // By default, IR devices don't have a standard commands array unless it's a specific sub-device.
    // If we need to send standard commands to an IR, we format it as an array.
    const commandArray = commands;

    if (!commandArray || commandArray.length === 0) {
      return { success: true, msg: 'No commands to execute' };
    }

    const result = await executeCommands(device.device_id, commandArray);
    console.log(`Command execution results for IR ${device.device_id}:`, JSON.stringify(result, null, 2));
    return result;
  }
}
