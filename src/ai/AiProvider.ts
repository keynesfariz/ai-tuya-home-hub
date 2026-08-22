import { CachedDevice, DeviceType } from '../tuya';

export interface DeviceCommand {
  code: string;
  value: any;
}

export interface TargetDeviceCommandSet {
  device_id: string;
  commands: DeviceCommand[];
}

export interface AiProvider {
  generateCommands(
    text: string,
    temperature: number,
    humidity: number,
    devices: CachedDevice[]
  ): Promise<TargetDeviceCommandSet[]>;

  classifyDevices(rawDevices: any[]): Promise<{ device_id: string; device_type: DeviceType }[]>;
}
