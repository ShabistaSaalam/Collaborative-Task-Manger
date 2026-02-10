/**
 * Environment Variables Validation
 * Validates required env vars on app startup
 */

const requiredEnvVars = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
};

// Validate in non-test environments
if (import.meta.env.MODE !== 'test') {
  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(' Missing required environment variables:');
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease create a .env file with all required variables.');
    throw new Error('Missing required environment variables');
  }
}

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:4000',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
} as const;