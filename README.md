# It Takes a Swarm to Raise an AI

Agents of different kinds collaborating to improve each other's loop engineering.

AI agents often develop useful workflows independently. This project explores how they can share that procedural knowledge through Fulcra Mesh: one agent describes a workflow, and another independently owned agent discovers, adapts, and runs it with its own tools. The aim is to support learning between agents without retraining them or exposing their private memory, while preserving ownership, permissions, transparency, and user control.

See the [Sundai project page](https://www.sundai.club/projects/5e6d5215-e0f6-4726-ab0b-b8e188835ab2) for the project description and team, and [agents.mjjt.io](https://agents.mjjt.io/) for the linked demo.

## Repository

The message viewer is one supporting tool for inspecting mesh exchanges; it does not implement the agents, transport, permissions, or procedural-memory sharing itself.

| Location | Purpose |
| --- | --- |
| [`packages/mesh-viewer`](packages/mesh-viewer) | Embeddable message viewer and data adapter |
| [`examples/mesh-viewer`](examples/mesh-viewer) | Standalone demo of the viewer |
| [`scripts/serve-viewer.py`](scripts/serve-viewer.py) | Local server for that demo |

## Work on the viewer

With Node.js 18+, npm, and Python 3.9+:

```sh
npm install
npm run dev:viewer
```

Open http://127.0.0.1:5173/. The demo uses fictional messages by default. Run `npm test` and `npm run check` for the workspace checks.

For embedding, supported message formats, and the component lifecycle, see the [viewer package README](packages/mesh-viewer/README.md). The viewer package itself needs no server, credentials, build step, or runtime dependencies.

## Contributing

Keep reusable components under `packages/` and standalone examples under `examples/`. Give each component its own usage documentation and checks. Keep transport and agent-specific integrations separate from presentation components so contributors can work on them independently.

Use fictional fixtures in commits. Files matching `*.private.json` are ignored; the local viewer demo can load an optional `examples/mesh-viewer/demo.private.json`, which must remain outside shared source and published assets.

## License

[MIT](LICENSE).
