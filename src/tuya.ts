import { TuyaContext } from '@tuya/tuya-connector-nodejs';

import dotenv from 'dotenv';

dotenv.config();

const TUYA_REGION_MAP: Record<string, string> = {
  'cn': 'https://openapi.tuyacn.com', // China Data Center
  'us': 'https://openapi.tuyaus.com', // Western America Data Center
  'us-e': 'https://openapi-ueaz.tuyaus.com', // Eastern America Data Center
  'eu': 'https://openapi.tuyaeu.com', // Central Europe Data Center
  'eu-w': 'https://openapi-weaz.tuyaeu.com', // Western Europe Data Center
  'in': 'https://openapi.tuyain.com', // India Data Center
  'sg': 'https://openapi-sg.iotbing.com', // Singapore Data Center
};
const regionKey = process.env.TUYA_REGION?.toLowerCase() || 'sg';
const baseUrl = TUYA_REGION_MAP[regionKey] || TUYA_REGION_MAP['sg'];

export const tuya = new TuyaContext({
  baseUrl,
  accessKey: process.env.TUYA_ACCESS_ID || '',
  secretKey: process.env.TUYA_ACCESS_KEY || '',
});

export type DeviceType = 'AC' | 'Light' | 'IR';

export interface CachedDevice {
  device_id: string;
  device_name: string;
  device_type: DeviceType;
}

