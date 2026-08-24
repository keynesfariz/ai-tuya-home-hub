import { CachedDevice, DeviceType } from '../tuya';

export interface TargetDeviceCommandSet extends CachedDevice {
  commands: { code: string; value: any }[];
}

export interface AiProvider {
  generateCommands(
    text: string,
    temperature: number,
    humidity: number,
    devices: CachedDevice[]
  ): Promise<{ commands: TargetDeviceCommandSet[]; text: string }>;

  classifyDevices(rawDevices: any[]): Promise<{ device_id: string; device_type: DeviceType }[]>;
}
