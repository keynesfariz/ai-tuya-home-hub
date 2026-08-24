import { CommandGenerator } from './CommandGenerator';
import { CachedDevice, tuya } from '../tuya';

export class AcGenerator implements CommandGenerator {
  async execute(device: CachedDevice, commands: { code: string; value: any }[], allDevices: CachedDevice[]): Promise<any> {
    console.log(`Executing AC commands for device ${device.device_id}:`, JSON.stringify(commands, null, 2));

    const irDevice = allDevices.find((d) => d.device_type === 'IR');
    const infrared_id = irDevice ? irDevice.device_id : 'guess_ir_id';

    const result = await this.executeAcCommand(infrared_id, device.device_id, commands);
    console.log(`AC command execution result for ${device.device_id}:`, JSON.stringify(result, null, 2));

    return result;
  }

  private async executeAcCommand(infraredId: string, remoteId: string, commandsArray: { code: string; value: any }[]) {
    // IR AC endpoint expects a dictionary object, so we reduce the array back to a dictionary
    const body = commandsArray.reduce((acc, curr) => {
      acc[curr.code] = curr.value;
      return acc;
    }, {} as Record<string, any>);

    console.log(`Executing AC command for device ${remoteId}:`, JSON.stringify(body, null, 2));

    return await tuya.request({
      path: `/v2.0/infrareds/${infraredId}/air-conditioners/${remoteId}/scenes/command`,
      method: 'POST',
      body
    });
  }
}
