import { DeviceType } from '../tuya';
import { CommandGenerator } from './CommandGenerator';
import { LightGenerator } from './LightGenerator';
import { AcGenerator } from './AcGenerator';
import { IrGenerator } from './IrGenerator';

export class GeneratorFactory {
  static getGenerator(deviceType: DeviceType): CommandGenerator {
    switch (deviceType) {
      case 'AC':
        return new AcGenerator();
      case 'IR':
        return new IrGenerator();
      case 'Light':
      default:
        return new LightGenerator();
    }
  }
}
