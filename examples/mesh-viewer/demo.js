import { createMeshViewer } from "../../packages/mesh-viewer/src/index.js";

// Loading sample data belongs to this demo, not the reusable viewer.
const viewer = createMeshViewer(document.getElementById("viewer"));
try {
  let response = await fetch("./demo.private.json");
  if (!response.ok) response = await fetch("./example.json");
  if (!response.ok) throw new Error("Messages could not be loaded.");
  viewer.setData(await response.json());
} catch (error) {
  const message = document.getElementById("error");
  message.textContent = error.message;
  message.hidden = false;
}

// Optional demo-only agent tooling. Host apps choose their own integration.
if (document.modelContext?.registerTool) {
  try {
    await document.modelContext.registerTool({
      name: "display_mesh_conversation",
      description:
        "Display supplied conversation JSON in this local demo. No sending or uploading.",
      inputSchema: {
        type: "object",
        properties: { json: { type: "string" } },
        required: ["json"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        if (typeof input?.json !== "string")
          throw new Error("json must be a string.");
        return viewer.setData(input.json);
      },
    });
  } catch (error) {
    console.warn("Optional demo tool unavailable:", error.message);
  }
}
