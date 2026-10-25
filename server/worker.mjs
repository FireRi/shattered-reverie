"use strict";
import { DurableObject } from "cloudflare:workers";

const PROTO = 1;
const CODE_RE = /^[A-HJ-NP-Z2-9]{5}$/;

function json(obj, status = 200) {
	return new Response(JSON.stringify(obj), {
		status,
		headers: { "content-type": "application/json", "cache-control": "no-store" },
	});
}

function originAllowed(env, origin) {
	const list = String(env.ALLOWED_ORIGINS || "*")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	if (!list.length || list.includes("*")) return true;
	if (!origin) return true;
	return list.includes(origin);
}

function validateConfig(c) {
	if (!c || typeof c !== "object") return null;
	const diff = Number.isInteger(c.diff) && c.diff >= 0 && c.diff <= 5 ? c.diff : null;
	if (diff === null) return null;
	if (c.story === true) return null;
	const oneCC = c.oneCC === true;
	const seed = Number.isInteger(c.seed) ? c.seed | 0 : null;
	if (seed === null) return null;
	const D = Number.isInteger(c.D) && c.D >= 4 && c.D <= 12 ? c.D : null;
	if (D === null) return null;
	let flags = [];
	if (Array.isArray(c.flags)) {
		if (c.flags.length > 64) return null;
		flags = c.flags.map((v) => v === true);
	}
	const chara = Number.isInteger(c.chara) ? Math.max(0, Math.min(5, c.chara)) : 0;
	const p2chara = Number.isInteger(c.p2chara) ? Math.max(0, Math.min(5, c.p2chara)) : 0;
	return { diff, oneCC, story: false, seed, D, flags, autoFire: c.autoFire === true, chara, p2chara };
}

function send(ws, obj) {
	try {
		ws.send(JSON.stringify(obj));
	} catch (e) {}
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === "/health" || url.pathname === "/healthz")
			return json({ ok: true, proto: PROTO, backend: "cloudflare" });
		if (url.pathname !== "/ws" && url.pathname !== "/")
			return json({ service: "shattered-reverie-relay", proto: PROTO, backend: "cloudflare" });
		if (!originAllowed(env, request.headers.get("Origin") || ""))
			return new Response("forbidden", { status: 403 });
		const upgrade = (request.headers.get("Upgrade") || "").toLowerCase();
		if (upgrade !== "websocket") return new Response("expected websocket", { status: 426 });
		const code = (url.searchParams.get("code") || "").toUpperCase();
		const role = url.searchParams.get("role") || "";
		if (!CODE_RE.test(code) || (role !== "host" && role !== "guest"))
			return new Response("bad code", { status: 400 });
		const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
		return stub.fetch(request);
	},
};

export class RoomDO extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.room = null;
		ctx.blockConcurrencyWhile(async () => {
			this.room = (await ctx.storage.get("room")) || null;
		});
	}

	socketsByRole(role) {
		return this.ctx.getWebSockets().filter((s) => {
			const a = s.deserializeAttachment();
			return a && a.role === role;
		});
	}

	peerOf(ws) {
		for (const s of this.ctx.getWebSockets()) if (s !== ws) return s;
		return null;
	}

	relay(ws, obj) {
		const p = this.peerOf(ws);
		if (p) send(p, obj);
	}

	async save() {
		try {
			await this.ctx.storage.put("room", this.room || null);
		} catch (e) {}
	}

	async fetch(request) {
		const url = new URL(request.url);
		const role = url.searchParams.get("role");
		const code = url.searchParams.get("code");
		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);
		this.ctx.acceptWebSocket(server);
		try {
			server.serializeAttachment({ role, code });
		} catch (e) {}
		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws, message) {
		if (typeof message !== "string") {
			const peer = this.peerOf(ws);
			if (peer) {
				try {
					peer.send(message);
				} catch (e) {}
			}
			return;
		}
		let m;
		try {
			m = JSON.parse(message);
		} catch (e) {
			return;
		}
		await this.onControl(ws, ws.deserializeAttachment() || {}, m);
	}

	async onControl(ws, att, m) {
		const role = att.role;
		switch (m.t) {
			case "hello": {
				if (m.proto !== PROTO) {
					send(ws, { t: "error", code: "proto" });
					try {
						ws.close(1008, "proto");
					} catch (e) {}
					return;
				}
				if (role === "host") {
					const others = this.socketsByRole("host").filter((s) => s !== ws);
					if (others.length) {
						send(ws, { t: "error", code: "busy" });
						try {
							ws.close(1008, "busy");
						} catch (e) {}
						return;
					}
					if (!this.room) this.room = { config: null, ready: { host: false, guest: false } };
					await this.save();
					send(ws, { t: "created", code: att.code, role: "host" });
					return;
				}
				if (role === "guest") {
					const hosts = this.socketsByRole("host");
					if (!hosts.length) {
						send(ws, { t: "error", code: "no-room" });
						try {
							ws.close(1008, "no-room");
						} catch (e) {}
						return;
					}
					const guests = this.socketsByRole("guest").filter((s) => s !== ws);
					if (guests.length) {
						send(ws, { t: "error", code: "full" });
						try {
							ws.close(1008, "full");
						} catch (e) {}
						return;
					}
					send(ws, { t: "joined", code: att.code, role: "guest" });
					if (this.room && this.room.config) send(ws, { t: "config", config: this.room.config });
					send(hosts[0], { t: "peer", role: "guest" });
					return;
				}
				send(ws, { t: "error", code: "bad-code" });
				try {
					ws.close(1008, "bad");
				} catch (e) {}
				return;
			}
			case "config": {
				if (role !== "host") {
					send(ws, { t: "error", code: "host-only" });
					return;
				}
				const clean = validateConfig(m.config);
				if (!clean) {
					send(ws, { t: "error", code: "bad-config" });
					return;
				}
				this.room = this.room || { config: null, ready: { host: false, guest: false } };
				this.room.config = clean;
				this.room.ready = { host: false, guest: false };
				await this.save();
				this.relay(ws, { t: "config", config: clean });
				return;
			}
			case "ready": {
				this.room = this.room || { config: null, ready: { host: false, guest: false } };
				this.room.ready[role] = m.ready === true;
				await this.save();
				this.relay(ws, { t: "ready", role, ready: m.ready === true });
				return;
			}
			case "start": {
				if (role !== "host") {
					send(ws, { t: "error", code: "host-only" });
					return;
				}
				const clean = validateConfig(m.config || (this.room && this.room.config));
				if (!clean) {
					send(ws, { t: "error", code: "bad-config" });
					return;
				}
				this.room = this.room || { config: null, ready: { host: false, guest: false } };
				this.room.config = clean;
				await this.save();
				this.relay(ws, { t: "start", config: clean });
				return;
			}
			case "pick":
			case "pause-request":
			case "pause-at":
			case "resume":
			case "ping":
			case "pong": {
				this.relay(ws, m);
				return;
			}
			case "leave": {
				await this.notifyClose(ws);
				try {
					ws.close(1000, "leave");
				} catch (e) {}
				return;
			}
			default:
				send(ws, { t: "error", code: "unknown" });
		}
	}

	async webSocketClose(ws) {
		await this.notifyClose(ws);
	}

	async webSocketError(ws) {
		await this.notifyClose(ws);
	}

	async notifyClose(ws) {
		const att = ws.deserializeAttachment() || {};
		const peer = this.peerOf(ws);
		if (att.role === "host") {
			if (peer) send(peer, { t: "room-closed", reason: "host-left" });
			this.room = null;
			try {
				await this.ctx.storage.deleteAll();
			} catch (e) {}
		} else if (att.role === "guest") {
			if (peer) send(peer, { t: "peer-left", reason: "left" });
			if (this.room) {
				this.room.ready = this.room.ready || { host: false, guest: false };
				this.room.ready.guest = false;
				await this.save();
			}
		}
		if (this.ctx.getWebSockets().filter((s) => s !== ws).length === 0) this.room = null;
	}
}
