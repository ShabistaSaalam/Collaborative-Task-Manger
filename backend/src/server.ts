import http from "http";
import app from "./app";
import { initSocket } from "./socket";
import { config } from "./config/env";

// 🔥 Create HTTP server
const server = http.createServer(app);

// 🔌 Initialize Socket.io
initSocket(server);

// 🚀 Start server
server.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});