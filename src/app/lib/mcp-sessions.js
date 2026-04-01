// src/app/lib/mcp-sessions.js
// globalThis is the ONLY reliable singleton across Next.js webpack chunks in dev+prod.
// Importing a Map from another route file gives a different instance — always use this.

if (!globalThis._mcpSessions) {
    globalThis._mcpSessions = new Map();
}

/** @type {Map<string, { transport: object, userId: string }>} */
export const sessions = globalThis._mcpSessions;