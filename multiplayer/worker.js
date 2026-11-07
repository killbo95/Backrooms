const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" }
  });
}
function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join("");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (url.pathname === "/api/rooms" && request.method === "POST") {
      let body = {};
      try { body = await request.json(); } catch {}
      const code = makeCode();
      const seed = Number.isFinite(body.seed) ? Math.abs(Math.floor(body.seed)) : Math.floor(Math.random() * 0x7fffffff);
      const id = env.ROOMS.idFromName(code);
      const room = env.ROOMS.get(id);
      const response = await room.fetch("https://room.internal/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed })
      });
      if (!response.ok) return json({ error: "Could not create room." }, 503);
      return json({ code, seed });
    }

    const match = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{6})$/i);
    if (match && request.method === "GET") {
      const code = match[1].toUpperCase();
      const id = env.ROOMS.idFromName(code);
      return env.ROOMS.get(id).fetch(new Request("https://room.internal/connect" + url.search, request));
    }
    return json({ error: "Not found" }, 404);
  }
};

export class BackroomsRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.state = { seed: null, level: 0, found: 0 };
    this.sockets = new Map();
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/init" && request.method === "POST") {
      const data = await request.json();
      if (this.state.seed === null) this.state.seed = data.seed;
      return Response.json({ ok: true });
    }
    if (url.pathname !== "/connect" || request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket upgrade required", { status: 426 });
    }
    if (this.state.seed === null) return new Response("Room not found", { status: 404 });

    const name = (url.searchParams.get("name") || "Explorer").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 16) || "Explorer";
    if (this.sockets.size >= 4) return new Response("Room is full", { status: 409 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const playerId = crypto.randomUUID();
    server.accept();
    this.sockets.set(playerId, { socket: server, name });
    server.send(JSON.stringify({
      type: "welcome",
      id: playerId,
      slot: this.sockets.size - 1,
      seed: this.state.seed,
      level: this.state.level,
      found: this.state.found,
      players: Array.from(this.sockets, ([id, p]) => ({ id, name: p.name }))
    }));
    this.broadcast({ type: "player-joined", id: playerId, name }, playerId);

    server.addEventListener("message", event => {
      if (typeof event.data !== "string" || event.data.length > 2048) return;
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === "state") {
        const state = {
          type: "player-state",
          id: playerId,
          x: Number(data.x) || 0,
          y: 1.65,
          z: Number(data.z) || 0,
          yaw: Number(data.yaw) || 0,
          level: Number(data.level) === 1 ? 1 : 0
        };
        this.broadcast(state, playerId);
      } else if (data.type === "progress") {
        this.state.level = data.level === 1 ? 1 : 0;
        this.state.found = Math.max(0, Math.min(3, Number(data.found) || 0));
        this.broadcast({ type: "progress", level: this.state.level, found: this.state.found }, playerId);
      } else if (data.type === "collected") {
        this.state.found = Math.max(this.state.found, Math.min(3, Number(data.found) || 0));
        this.broadcast({ type: "collected", found: this.state.found }, playerId);
      }
    });
    const close = () => {
      this.sockets.delete(playerId);
      this.broadcast({ type: "player-left", id: playerId });
    };
    server.addEventListener("close", close);
    server.addEventListener("error", close);
    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(message, exceptId) {
    const text = JSON.stringify(message);
    for (const [id, player] of this.sockets) {
      if (id === exceptId) continue;
      try { player.socket.send(text); } catch { this.sockets.delete(id); }
    }
  }
}
