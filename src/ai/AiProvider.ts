import { CachedDevice, DeviceType } from '../tuya';

export interface TargetDeviceCommandSet extends CachedDevice {
  commands: { code: string; value: any }[];
}

export interface AiProvider {
  generateCommands(
    text: string,
    temperature: number | undefined,
    humidity: number | undefined,
    devices: CachedDevice[],
    preferred_response_lang?: string
  ): Promise<{ commands: TargetDeviceCommandSet[]; text: string }>;

  classifyDevices(rawDevices: any[]): Promise<{ device_id: string; device_type: DeviceType }[]>;
}
