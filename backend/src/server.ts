import http from "http";
import app from "./app";
import { initSocket } from "./socket";

// 🔥 Create HTTP server
const server = http.createServer(app);

// 🔌 Initialize Socket.io
initSocket(server);

// 🚀 Start server
server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
