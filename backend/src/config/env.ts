import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Environment Variables Configuration
 * Validates and exports all required environment variables
 */

// Skip validation during tests
const isTest = process.env.NODE_ENV === "test";

// Validate required environment variables
if (!isTest) {
  const requiredEnvVars = [
    "DATABASE_URL",
    "JWT_SECRET"
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingEnvVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingEnvVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error("\nPlease create a .env file with all required variables.");
    console.error("See .env.example for reference.\n");
    process.exit(1);
  }
}

// Export validated config
export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL || "",

  // JWT - properly typed as string
  jwtSecret: process.env.JWT_SECRET as string || "test-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Server
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // CORS
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  // Helpers
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
};

// Log config in development (without secrets)
if (config.isDevelopment) {
  console.log("🔧 Configuration loaded:");
  console.log(`   - Environment: ${config.nodeEnv}`);
  console.log(`   - Port: ${config.port}`);
  console.log(`   - Client URL: ${config.clientUrl}`);
  console.log(`   - Database: ${config.databaseUrl ? "✓ Connected" : "✗ Not configured"}`);
  console.log(`   - JWT Secret: ${config.jwtSecret ? "✓ Set" : "✗ Not set"}`);
}