// Ensure required env vars exist so config/env does not throw when tests load
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
