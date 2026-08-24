import { tuya, CachedDevice, DeviceType } from './tuya';
import { redisClient } from './redis';

export const fetchAndCacheDevices = async (): Promise<CachedDevice[]> => {
  // Check cache first
  const cached = await redisClient.get('tuya_devices');
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from Tuya
  console.log('Fetching devices from Tuya...');
  const response = await tuya.request({
    path: '/v2.0/cloud/thing/device?page_size=10',
    method: 'GET'
  });

  if (!response.success) {
    throw new Error(`Failed to fetch Tuya devices: ${response.msg}`);
  }

  // response.result should contain a list or array of devices depending on API shape.
  // We'll safely assume response.result is an array or has a data/list property.
  const resultAny = response.result as any;
  const rawDevices: any[] = Array.isArray(resultAny)
    ? resultAny
    : (resultAny?.list || resultAny?.data || []);

  const aiProvider = (await import('./ai/AiFactory')).AiFactory.getProvider(process.env.AI_PROVIDER || 'gemini');
  const classifiedTypes = await aiProvider.classifyDevices(rawDevices);
  const typeMap = new Map(classifiedTypes.map((c: any) => [c.device_id, c.device_type]));

  const devicesToCache: CachedDevice[] = rawDevices.map((d: any) => {
    const name = d.name || d.title || '';
    return {
      device_id: d.id,
      device_name: name,
      device_type: (typeMap.get(d.id) as DeviceType) || 'Light'
    };
  });

  // Cache in Redis without TTL as requested
  await redisClient.set('tuya_devices', JSON.stringify(devicesToCache));

  return devicesToCache;
};

export const executeCommands = async (deviceId: string, commands: any[]) => {
  return await tuya.request({
    path: `/v1.0/iot-03/devices/${deviceId}/commands`,
    method: 'POST',
    body: { commands }
  });
};
