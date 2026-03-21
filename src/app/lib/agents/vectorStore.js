// app/lib/agents/vectorStore.js
// Note: Requires: npm install @xenova/transformers

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import dbConnect from "@/app/lib/db";
import Transaction from "@/app/models/Transaction";

// ─── Embedding Engine (Singleton) ─────────────────────────────────────────────
class XenovaEngine {
  constructor() {
    this.extractor = null;
    this.initPromise = null;
  }

  async init() {
    // Prevent multiple concurrent initializations
    if (this.initPromise) return this.initPromise;
    if (this.extractor) return;

    this.initPromise = (async () => {
      try {
        const { pipeline } = await import("@xenova/transformers");
        this.extractor = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2",
          { quantized: true }
        );
        console.log("[VectorStore] Embedding model loaded.");
      } catch (err) {
        console.error("[VectorStore] Failed to load model:", err.message);
        this.initPromise = null;
        throw err;
      }
    })();

    return this.initPromise;
  }

  async embed(text) {
    await this.init();
    const output = await this.extractor(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data);
  }
}

const engine = new XenovaEngine();

// ─── In-memory Vector Store ───────────────────────────────────────────────────
// userId → { store: Array<{text, metadata, vector}>, builtAt: Date }
const vectorCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export const buildVectorStore = async (userId, forceRebuild = false) => {
  const cached = vectorCache[userId];
  const now = Date.now();

  // Return valid cache if fresh
  if (!forceRebuild && cached && now - cached.builtAt < CACHE_TTL_MS) {
    return cached.store;
  }

  await dbConnect();
  const txs = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(500);

  if (txs.length === 0) {
    vectorCache[userId] = { store: [], builtAt: now };
    return [];
  }

  const store = [];

  for (const t of txs) {
    const text = [
      `Date: ${t.createdAt.toISOString().split("T")[0]}`,
      `Merchant: ${t.merchant || "Unknown"}`,
      `Amount: ₹${t.amount}`,
      `Category: ${t.category}`,
      `Type: ${t.type}`,
      `Description: ${t.description || "N/A"}`,
    ].join(", ");

    try {
      const vector = await engine.embed(text);
      store.push({
        text,
        metadata: {
          id: t._id.toString(),
          merchant: t.merchant,
          amount: t.amount,
          category: t.category,
          type: t.type,
          date: t.createdAt.toISOString().split("T")[0],
        },
        vector,
      });
    } catch (err) {
      console.warn(`[VectorStore] Skipped transaction ${t._id}:`, err.message);
    }
  }

  vectorCache[userId] = { store, builtAt: now };
  console.log(`[VectorStore] Built store for ${userId}: ${store.length} vectors.`);
  return store;
};

export const semanticSearch = async (userId, query, k = 5) => {
  const store = await buildVectorStore(userId);
  if (!store.length) return [];

  const queryVector = await engine.embed(query);

  const scored = store
    .map((doc) => ({ ...doc, score: cosineSimilarity(queryVector, doc.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored;
};

// ─── Agentic Semantic Search Tool ─────────────────────────────────────────────
export const build_agenticSemanticSearchTool = (userId) => tool(
  async ({ query }) => {
    try {
      const results = await semanticSearch(userId, query, 5);

      if (!results.length) {
        return JSON.stringify({
          success: true,
          summary: `No transactions found matching "${query}".`,
          results: [],
        });
      }

      const formatted = results
        .map(
          (r, i) =>
            `${i + 1}. ${r.metadata.date} | ${r.metadata.merchant} | ₹${r.metadata.amount} | ${r.metadata.category} | ${r.metadata.type} (relevance: ${(r.score * 100).toFixed(0)}%)`
        )
        .join("\n");

      const totalAmount = results.reduce((s, r) => s + r.metadata.amount, 0);

      return JSON.stringify({
        success: true,
        summary: `Found ${results.length} transactions matching "${query}":\n${formatted}\nTotal: ₹${totalAmount.toFixed(2)}`,
        results: results.map((r) => r.metadata),
        totalAmount,
      });
    } catch (e) {
      console.error("[SemanticSearch] Error:", e.message);
      return JSON.stringify({ error: e.message });
    }
  },
  {
    name: "agentic_semantic_search",
    description:
      "Searches the user's transaction history using semantic similarity. Use for abstract queries like 'coffee purchases', 'weekend fun spending', 'subscriptions', 'travel costs'.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "Natural language search query e.g. 'coffee shops', 'online subscriptions', 'food delivery'"
        ),
    }),
  }
);