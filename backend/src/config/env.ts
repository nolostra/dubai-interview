function getEnv(key: string, defaultValue: string = ''): string {
  const value = process.env[key] ?? defaultValue;
  if (!value && (key === 'DATABASE_URL' || key === 'JWT_SECRET')) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as string;
}

export const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  PORT: parseInt(getEnv('PORT', '3000'), 10),
  DATABASE_URL: getEnv('DATABASE_URL', ''),
  JWT_SECRET: getEnv('JWT_SECRET', ''),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  ADMIN_API_KEY: getEnv('ADMIN_API_KEY', ''),
};
