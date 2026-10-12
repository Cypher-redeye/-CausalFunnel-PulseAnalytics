import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  mongodbUri: string;
  clientUrl: string;
  nodeEnv: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config: Config = {
  port: parseInt(getEnvVar('PORT', '5000'), 10),
  mongodbUri: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/user_analytics'),
  clientUrl: getEnvVar('CLIENT_URL', 'http://localhost:5173'),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '60000'), 10),
  rateLimitMaxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
};
