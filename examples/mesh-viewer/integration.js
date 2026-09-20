import { createMeshViewer } from "../../packages/mesh-viewer/src/index.js";
const results = document.getElementById("results");
const lines = [];
function check(name, fn) {
  try {
    fn();
    lines.push("PASS " + name);
  } catch (error) {
    lines.push("FAIL " + name + ": " + error.message);
  }
}
function assert(value) {
  if (!value) throw new Error("Assertion failed");
}
const one = document.getElementById("one"),
  two = document.getElementById("two");
const data = {
  participants: [
    { id: "a", name: "Orbit", represents: "Alex" },
    { id: "b", name: "Relay", represents: "Sam" },
    { id: "c", name: "Scout", represents: "Lee" },
  ],
  messages: [
    {
      body: "Hello <img src=x onerror=alert(1)>",
      from_user: "a",
      to_user: "b",
      time: "2026-09-20T14:00:00Z",
    },
  ],
};
const first = createMeshViewer(one, { data, timeZone: "UTC" });
const second = createMeshViewer(two, { data: [] });
const firstRoot = one.querySelector(".mesh-viewer").shadowRoot;
const secondRoot = two.querySelector(".mesh-viewer").shadowRoot;
check("three participants and original JSON", () => {
  assert(firstRoot.querySelectorAll(".participant").length === 3);
  assert(
    firstRoot.getElementById("json-document").textContent ===
      JSON.stringify(data, null, 2),
  );
});
check("no host markup or CSS changes", () => {
  assert(one.querySelector(".host-content").textContent === "Host content");
  assert(
    getComputedStyle(one.querySelector(".host-content")).color ===
      "rgb(255, 0, 0)",
  );
  assert(document.querySelectorAll("style").length === 1);
});
check("untrusted message markup remains text", () => {
  assert(!firstRoot.querySelector("img"));
  assert(
    firstRoot.querySelector(".message-body").textContent ===
      data.messages[0].body,
  );
});
check("view switches are isolated per instance", () => {
  firstRoot.getElementById("json-tab").click();
  assert(!firstRoot.getElementById("json-panel").hidden);
  assert(secondRoot.getElementById("json-panel").hidden);
});
check(
  "replacing data preserves selected view and does not affect other instance",
  () => {
    second.setData({ messages: [{ body: "Second instance" }] });
    first.setData({ messages: [{ body: "Updated first instance" }] });
    assert(
      firstRoot.querySelector(".message-body").textContent ===
        "Updated first instance",
    );
    assert(
      secondRoot.querySelector(".message-body").textContent ===
        "Second instance",
    );
    assert(!firstRoot.getElementById("json-panel").hidden);
  },
);
check("invalid data leaves previous view intact", () => {
  let failed = false;
  try {
    first.setData({ messages: [{ body: 5 }] });
  } catch {
    failed = true;
  }
  assert(
    failed &&
      firstRoot.querySelector(".message-body").textContent ===
        "Updated first instance",
  );
});
check("invalid initial data does not mount an orphan viewer", () => {
  const count = two.children.length;
  let failed = false;
  try {
    createMeshViewer(two, { data: { messages: [{ body: null }] } });
  } catch {
    failed = true;
  }
  assert(failed && two.children.length === count);
});
check("caller mutation does not alter snapshot", () => {
  first.setData(data);
  data.messages[0].body = "Changed elsewhere";
  assert(
    !firstRoot
      .getElementById("json-document")
      .textContent.includes("Changed elsewhere"),
  );
});
check("destroy removes only its own instance and blocks later updates", () => {
  first.destroy();
  first.destroy();
  let failed = false;
  try {
    first.setData([]);
  } catch {
    failed = true;
  }
  assert(
    failed &&
      !one.querySelector(".mesh-viewer") &&
      one.querySelector(".host-content"),
  );
  assert(two.querySelector(".mesh-viewer"));
});
second.destroy();
results.textContent = lines.join("\n");
document.title = lines.some((line) => line.startsWith("FAIL"))
  ? "FAIL — Mesh viewer checks"
  : "PASS — Mesh viewer checks";
