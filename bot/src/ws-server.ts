import { WebSocketServer, WebSocket } from "ws";
import { ENV } from "./config.js";
import type { WSMessage } from "./shared/types.js";

let wss: WebSocketServer | null = null;

/**
 * Start the WebSocket server on ENV.WS_PORT.
 * Returns the server instance so scanner/index can broadcast messages.
 */
export function startWSServer(): WebSocketServer {
  wss = new WebSocketServer({ port: ENV.WS_PORT });

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress || "unknown";
    console.log(`[WS] Client connected from ${clientIp} (total: ${wss!.clients.size})`);

    // Send a welcome ping so the frontend knows connection is live
    ws.send(JSON.stringify({ type: "BLOCK_UPDATE", data: { number: 0, timestamp: Date.now(), txCount: 0, avgBlockTimeMs: 400 } }));

    ws.on("close", () => {
      console.log(`[WS] Client disconnected (total: ${wss!.clients.size})`);
    });

    ws.on("error", (err) => {
      console.error("[WS] Client error:", err.message);
    });
  });

  wss.on("error", (err) => {
    console.error("[WS] Server error:", err);
  });

  console.log(`[WS] Server listening on ws://localhost:${ENV.WS_PORT}`);
  return wss;
}

/**
 * Broadcast a typed WSMessage to all connected clients.
 */
export function broadcast(msg: WSMessage): void {
  if (!wss) return;
  const payload = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/**
 * Get current connected client count.
 */
export function clientCount(): number {
  return wss?.clients.size ?? 0;
}

/**
 * Gracefully close the WS server.
 */
export function stopWSServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!wss) { resolve(); return; }
    wss.close(() => {
      console.log("[WS] Server closed");
      wss = null;
      resolve();
    });
  });
}
