import test from "node:test";
import assert from "node:assert/strict";
import { createMeshViewer } from "../src/index.js";
import { normalizeConversation } from "../src/normalize.js";

test("package imports in Node without a DOM or automatic page setup", () => {
  assert.equal(typeof createMeshViewer, "function");
  assert.equal(typeof globalThis.document, "undefined");
  assert.throws(() => createMeshViewer(null), /DOM element/);
});

test("three participants use explicit senders and preserve unknown identities", () => {
  const participants = ["a", "b", "c"].map((id) => ({ id, name: id }));
  const result = normalizeConversation({
    participants,
    messages: [
      { body: "A to B", from_user: "a", to_user: "b" },
      { body: "C to A", from_user: "c", to_user: "a" },
      { body: "Unknown to C", to_user: "c" },
    ],
  });
  assert.deepEqual(
    result.messages.map((m) => m.from),
    ["a", "c", "unknown"],
  );
});

test("discovered accounts do not become an implicit two-person sender mapping", () => {
  const result = normalizeConversation([
    { body: "first", from_user: "a", to_user: "b" },
    { body: "unknown", to_user: "a" },
  ]);
  assert.equal(result.messages[1].from, "unknown");
});

test("bot avatars are stable per agent and neighbors get distinct colors", async () => {
  const { botTraits } = await import("../src/avatar.js");
  assert.deepEqual(botTraits("agent-a", 0), botTraits("agent-a", 0));
  assert.notEqual(botTraits("agent-a", 0).color, botTraits("agent-b", 1).color);
});
