# It Takes a Swarm

A local viewer for Fulcra Mesh messages, with compact participant identities, chronological messages, expandable identifiers, and a Messages / JSON switcher.

## Run locally

Run `npm run dev` and open http://127.0.0.1:5173. No package dependencies or build step. Python 3 serves `dist/`; Node 18+ runs the adapter tests with `npm test`.

## Data interface

The UI has no manual import controls. Call the exported `displayConversation(input)` from `dist/app.js` with a conversation object or JSON string to replace its data. The interface validates before rendering and returns message and participant counts. `dist/mesh.js` exports `normalizeConversation(input)` independently of the UI. Participant layout supports any number of agents.

Supported inputs:

- `{ title, participants, messages }`, as in `dist/example.json`.
- An array or single envelope with a string `body`.
- Fulcra records containing a JSON-encoded `note`, `recorded_at`, and optionally `metadata.fulcra_userid`.
- `{ records: [...] }`, `{ incoming: [...], outgoing: [...] }`, and Fulcra MCP `result`, `structuredContent.result`, or text `content` wrappers.

Participants use `{ id, name, represents, outbox? }`. Messages use `{ mid?, from_user?, to_user?, to?, time?, kind?, pri?, slug?, body }`. A record's account metadata identifies its sender. With exactly two supplied participants and a known recipient, the adapter can infer the other participant as sender; otherwise missing identity is explicitly unknown. Direction alone does not identify a sender.

Timestamps are sorted chronologically and shown in America/New_York. Undated messages retain input order after dated records. Historical sender labels remain inspectable under Message details; participant display names represent the supplied current identity mapping.

The JSON tab shows the complete original loaded structure, with syntax highlighting. JSON and original message bodies are retained. Legacy literal newline, quote, and Unicode escapes are decoded for display only. UUIDs and outbox IDs are shortened visually and expand on click. Imported markup is rendered as text, never executed. Links are limited to HTTP(S).

## Demo data

The checked-in `example.json` is fictional. If `dist/demo.private.json` exists, the local demo uses it instead. This file contains the current private exchange and is ignored by Git. Do not include it in a public deployment; static hosting publishes every file it serves. The preview is bound to loopback by default.

## Project shape

- `dist/index.html`: app shell and Messages / JSON views
- `dist/style.css`: responsive visual system
- `dist/mesh.js`: reusable data adapter
- `dist/app.js`: rendering and local UI interactions
- `tests/mesh.test.js`: data compatibility and preservation checks

When available, the browser's optional WebMCP surface exposes `display_mesh_conversation({ json })`, using the same integration interface. This only updates the local view; there is no message sending or Fulcra write connection.

## License

[MIT](LICENSE).
