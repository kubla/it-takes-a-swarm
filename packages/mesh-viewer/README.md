# Mesh viewer

A reusable, read-only viewer for Fulcra Mesh messages. It shows participants and the people they represent, a chronological message list, expandable IDs, and a Messages / JSON switcher. The JSON view retains the original supplied structure.

This package only renders data supplied by its host. Importing it does not fetch data, mount a page, load fonts, register tools, or contact Fulcra. Each instance uses a separate shadow root, so its styles and element IDs do not affect the host or another viewer.

## Embed

From an npm workspace or a local package installation:

```js
import { createMeshViewer } from '@it-takes-a-swarm/mesh-viewer';

const viewer = createMeshViewer(document.querySelector('#messages'), {
  data: conversation,
  timeZone: 'America/New_York',
});

// Replace messages when your transport supplies new data.
viewer.setData(nextConversation);
viewer.setView('json'); // or 'messages'

// On route change or component unmount:
viewer.destroy();
```

For native browser modules without a bundler, import `packages/mesh-viewer/src/index.js` by its served URL. The standalone [example](../../examples/mesh-viewer) demonstrates this. `npm pack --workspace @it-takes-a-swarm/mesh-viewer` creates a portable package; only source, this README, and the MIT license are included. The package has not been published to a registry.

### API

- `createMeshViewer(element, { data = [], timeZone = 'America/New_York' } = {})` appends a viewer to an element without replacing its existing content. A browser DOM is needed only when mounting.
- `setData(input)` replaces this instance's data. It validates a detached JSON snapshot before updating and returns `{ messages, participants }` counts. Invalid input leaves the previous view intact. The selected Messages / JSON view is retained.
- `setView('messages' | 'json')` switches this instance's view.
- `destroy()` removes the instance and its DOM listeners. It is safe to call twice. Further `setData` or `setView` calls throw.
- `normalizeConversation(input)` and `decodeDisplayText(text)` are also available from `@it-takes-a-swarm/mesh-viewer/normalize`, without a browser DOM.

Multiple viewers can coexist. Each supports any number of explicit participants. The host is responsible for fetching, refreshing, authorization, and subscription cleanup.

## Input

A conversation can be a JSON string or JSON-compatible object:

```json
{
  "participants": [
    { "id": "alex", "name": "Orbit", "represents": "Alex Morgan" },
    { "id": "sam", "name": "Relay", "represents": "Sam Rivera" },
    { "id": "lee", "name": "Scout", "represents": "Lee Chen" }
  ],
  "messages": [
    {
      "mid": "message-1",
      "from_user": "alex",
      "to_user": "sam",
      "time": "2026-09-20T10:00:00-04:00",
      "kind": "response",
      "body": "Here is the workflow we discussed."
    }
  ]
}
```

Also accepted: arrays or single message envelopes; Fulcra records with a JSON `note` and `recorded_at`; `{ records }`; `{ incoming, outgoing }`; and Fulcra MCP `result`, `structuredContent.result`, or text `content` wrappers. Supply a `participants` array alongside `messages` to map account IDs to display names. Optional envelope fields include `to`, `pri`, and `slug`.

Senders come from `from_user` or a record's `metadata.fulcra_userid`. With exactly two explicitly supplied participants and a known recipient, the other participant can be inferred. With three or more, provide sender IDs; missing identities are shown as unknown rather than guessed. A direction flag alone does not establish identity.

Dates are sorted chronologically; undated records follow in source order. The timezone is configurable. Invalid records or timestamps reject the update; the current limit is 2,000 messages.

Original fields and bodies are preserved in the JSON view. Legacy literal newline, quote, and Unicode escapes are decoded for display only. Message markup is treated as text. Links are restricted to HTTP(S). Display names are the supplied current identity mapping; historical recipient labels remain in Details and original source data.

## Styling

The default appearance is dark. CSS custom properties can be set on the mounting container and inherited into the viewer:

```css
#messages {
  --mesh-viewer-background: #15171c;
  --mesh-viewer-surface: #1d2027;
  --mesh-viewer-foreground: #e7e9ed;
  --mesh-viewer-font: system-ui;
}
```

No external stylesheets or web fonts are required.

## Development

From the repository root, run `npm run dev:viewer`. The demo owns loading sample data and optional WebMCP registration. Neither behavior is part of this package.

Run `npm test --workspace @it-takes-a-swarm/mesh-viewer` for adapter and import-contract tests. Open `/examples/mesh-viewer/integration.html` on the demo server for browser lifecycle and instance-isolation checks.
