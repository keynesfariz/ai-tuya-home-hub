import { CachedDevice } from '../tuya';

export const buildGenerateCommandsPrompt = (
  text: string,
  temperature: number | undefined,
  humidity: number | undefined,
  devices: CachedDevice[]
): string => {
  let prompt = `User Request: "${text}"\n`;
  if (temperature !== undefined) {
    prompt += `Current Room Temperature: ${temperature}°C\n`;
  }
  if (humidity !== undefined) {
    prompt += `Current Room Humidity: ${humidity}%\n`;
  }
  prompt += `Available Devices:\n${JSON.stringify(devices, null, 2)}\n`;
  return prompt;
};

export const buildClassifyDevicesPrompt = (rawDevices: any[]): string => {
  return `Classify the following Tuya devices into one of these types: 'AC', 'Light', or 'IR'.
Analyze the device name to determine its type. The device names may be in Indonesian (e.g., "Lampu" for Light, "AC" for AC).
If the name indicates an air conditioner, return 'AC'.
If the name indicates a light or bulb, return 'Light'.
If the name indicates an IR blaster or universal remote, return 'IR'.
Default to 'Light' if unsure.

Devices:
${JSON.stringify(rawDevices.map((d: any) => ({ id: d.id, name: d.name || d.title || '' })), null, 2)}
`;
};

export const DEVICE_RULES = `
For each device, the commands array must contain objects with "code" and "value" keys.
Example commands format:
[
  { "code": "work_mode", "value": "white" },
  { "code": "temp_value_v2", "value": 10 }
]

The device_id will be provided in the user prompt along with the device_name and device_type.

Here are the strict rules for the available commands per device_type:

=== Light ===
Valid codes:
- "work_mode": "white" (Always include this code, hardcoded to "white")
- "switch_led": boolean (true for on, false for off)
- "bright_value_v2": integer (between 10 to 1000, greater is brighter)
- "temp_value_v2": integer (between 10 to 1000, 10 is warmest, 1000 is coolest. CRITICAL: You MUST include this code whenever the user asks to adjust warmth, coolness, or mentions words like "warm", "warmest", "cool", "coolest".)

=== AC ===
Valid codes:
- "power": "1" for ON, "0" for OFF. (Always include this code, the value 0 or 1 should be guessed correctly based on the user request's context)
- "wind": "0" (auto), "1" (low), "2" (med), "3" (high).
- "mode": "0" (cool), "2" (auto), "3" (wind), "4" (dehumidify).
- "temp": string of integer, e.g. "24" (16 to 30)

Do NOT generate any commands that are not in this list for the given device type.
`;

export const getSystemPrompt = () => {
  return `You are a Smart Home AI Assistant. Your task is to interpret a user's text request about their room (with current temperature and humidity if provided) and generate the appropriate JSON commands to control their Tuya devices.

Note: The user's request may be in Indonesian. The "text" field in your JSON response MUST be in the same language as the user's request (e.g., Indonesian).

${DEVICE_RULES}

You will receive a JSON array of the user's available devices, along with the user's text request and environment data.
You MUST output ONLY a valid JSON object. 
Format:
{
  "text": "A human-readable response describing what actions were taken (in the user's language)",
  "target_devices": [
    {
      "device_id": "...",
      "commands": [
        {
          "code": "command_key",
          "value": "command_value"
        }
      ]
    }
  ]
}
`;
};
