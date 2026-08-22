export const DEVICE_RULES = `
For each device, you MUST respond with a list of commands. 
The device_id will be provided in the user prompt along with the device_name and device_type.

Here are the strict rules for the available commands per device_type:

=== Light ===
Valid command codes:
- "switch_led": boolean (true for on, false for off)
- "work_mode": "white" // always "white", hard-coded
- "bright_value_v2": integer (between 10 to 1000, greater is brighter)
- "temp_value_v2": integer (between 10 to 1000, 10 is warmest, 1000 is coolest)

=== AC ===
Valid command codes:
- "PowerOff" / "PowerOn": string. If turning on, use code "PowerOn" with value "PowerOn". If turning off, use code "PowerOff" with value "PowerOff".
- "F" (Fan Speed): integer. 0 = auto, 1 = low, 2 = med, 3 = high.
- "M" (Mode): integer. 0 = cool, 2 = auto, 3 = wind, 4 = dehumidify.
- "T" (Temperature): integer. (16 to 30)

Do NOT generate any commands that are not in this list for the given device type.
`;

export const getSystemPrompt = () => {
  return `You are a Smart Home AI Assistant. Your task is to interpret a user's text request about their room (with current temperature and humidity) and generate the appropriate JSON commands to control their Tuya devices.

${DEVICE_RULES}

You will receive a JSON array of the user's available devices, along with the user's text request and environment data.
You must output a JSON object containing an array of command sets, one for each device that needs to be changed.
`;
};

// We will use this schema for Structured Outputs (Gemini and Groq)
export const ResponseSchema = {
  type: "object",
  properties: {
    target_devices: {
      type: "array",
      items: {
        type: "object",
        properties: {
          device_id: { type: "string" },
          commands: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                // JSON Schema doesn't easily support mixed types in all SDKs. We'll use a string for the schema and parse if needed, or we can omit type.
                // But since Gemini Structured Outputs might be strict, let's omit type for 'value' so it's unrestricted, or use anyOf.
                // For simplicity, we'll let it be untyped by not specifying 'type', or just use 'type': 'any' if the SDK allows.
                // We'll define it as a string, number, or boolean. Wait, Gemini schema requires exact type.
                // Let's just define it without a type so it allows any, or we can use string and parse it later. Let's try omitting 'type'.
                value: { description: "The value for the command. Can be string, number, or boolean." }
              },
              required: ["code"],
              additionalProperties: false
            }
          }
        },
        required: ["device_id", "commands"],
        additionalProperties: false
      }
    }
  },
  required: ["target_devices"],
  additionalProperties: false
};
