import { WebSocketServer, WebSocket } from "ws";
import { createServer, type Server as HttpServer } from "http";
import { ENV } from "./config.js";
import type { WSMessage } from "./shared/types.js";
import { handleHttpRequest } from "./api.js";

let wss: WebSocketServer | null = null;
let httpServer: HttpServer | null = null;

/**
 * Start the combined HTTP + WebSocket server on ENV.WS_PORT.
 * HTTP routes are handled by api.ts, WS upgrades are handled here.
 */
export function startWSServer(): WebSocketServer {
  httpServer = createServer(handleHttpRequest);
  wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress || "unknown";
    console.log(`[WS] Client connected from ${clientIp} (total: ${wss!.clients.size})`);

    // Send a welcome ping so the frontend knows connection is live
    ws.send(
      JSON.stringify({
        type: "BLOCK_UPDATE",
        data: { number: 0, timestamp: Date.now(), txCount: 0, avgBlockTimeMs: 400 },
      })
    );

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

  httpServer.listen(ENV.WS_PORT, () => {
    console.log(`[WS] Server listening on http://localhost:${ENV.WS_PORT} (WS + HTTP API)`);
  });

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
 * Gracefully close both HTTP and WS servers.
 */
export function stopWSServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!wss) {
      resolve();
      return;
    }
    wss.close(() => {
      console.log("[WS] WebSocket server closed");
      wss = null;
      if (httpServer) {
        httpServer.close(() => {
          console.log("[WS] HTTP server closed");
          httpServer = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}
