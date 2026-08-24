# AI Tuya Home Hub

AI Tuya Home Hub is a smart home app that uses AI to control your Tuya devices. It integrates with the Tuya OpenAPI to fetch your home's devices and uses Large Language Models (like Google Gemini or Groq) to understand your intent, context (like room temperature or humidity), and execute commands to control your Tuya devices.

## Tech Stacks Used

*   **Language & Runtime:** TypeScript, Node.js (Express)
*   **Smart Home API:** Tuya OpenAPI (`@tuya/tuya-connector-nodejs`)
*   **AI Providers:** Google Gemini API (`@google/genai`), Groq API (`groq-sdk`)
*   **Caching & Auth:** Redis
*   **Development Tools:** `tsx` for TypeScript execution, Bun/NPM for package management

## Features

*   **Simple Auth**: The API routes are protected using a simple Bearer token authentication mechanism. The expected valid token is stored in Redis under the key `auth:token`. Clients must send this token in the `Authorization` header as `Bearer <token>`.
*   **Supported Tuya Devices**: The system uses AI to automatically classify devices fetched from your Tuya account. Currently supported device types are:
    *   **Light** (Smart bulbs, switches)
    *   **IR** (Infrared controllers and blasters)
    *   **AC** (Infrared Air Conditioners)
*   **Natural Language Control**: You can send requests like *"It's too hot in here"* or *"Turn on the living room light"*, and the AI will determine the best actions for your specific mapped devices.
*   **Context-Aware**: The `/set-home` endpoint accepts contextual parameters like `temperature` and `humidity` to allow the AI to make smarter decisions about what to turn on or off.
*   **Multi-Model Support**: Switch seamlessly between Gemini and Groq via request parameters.

## Prerequisites

Before running the project, make sure you have the following installed and configured:

1.  **Node.js** (v18+) or **Bun** installed on your machine.
2.  **Redis Server** installed and running on default port (or available via URL).
3.  **Tuya Developer Account**:
    *   A Tuya Cloud project configured with Smart Home API authorization.
    *   Access ID and Access Key.
4.  **AI API Keys**:
    *   Google Gemini API Key and/or Groq API Key.

## How to Run

1.  **Install Dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using bun:
    ```bash
    bun install
    ```

2.  **Environment Variables:**
    Copy the example environment file and fill in your keys:
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your Tuya Access ID, Tuya Access Key, Region, and AI API Keys.

3.  **Setup Authentication Token in Redis:**
    You need to set a secure token in your Redis instance for the simple auth middleware to authenticate requests.
    ```bash
    redis-cli set auth:token "your-secret-token"
    ```

4.  **Start the Server:**
    Run the development server:
    ```bash
    npm run dev
    ```
    Or with bun:
    ```bash
    bun run dev
    ```
    The server will start on `http://localhost:3000`.

5.  **Test the API:**
    Make a POST request to the `/set-home` endpoint.

    ```bash
    curl -X POST http://localhost:3000/set-home \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer your-secret-token" \
      -d '{
        "text": "It is getting dark, turn on the lights",
        "temperature": 25,
        "humidity": 60
      }'
    ```
