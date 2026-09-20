# Standalone viewer demo

Run `npm run dev:viewer` from the repository root and open http://127.0.0.1:5173/.

This small host application mounts `createMeshViewer` and loads `example.json`. If `demo.private.json` exists beside it, that local, Git-ignored fixture is used instead. Do not include private fixtures in a public deployment.

The demo alone registers the optional `display_mesh_conversation({ json })` WebMCP tool. An embedding application can choose its own transport and tooling without inheriting this behavior.

The Python server only exposes this example directory and the viewer's package source. It binds to loopback and blocks directory listings and access to repository metadata.
