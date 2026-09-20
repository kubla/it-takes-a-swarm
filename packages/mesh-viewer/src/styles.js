// Scoped inside each viewer shadow root. No global stylesheet or font requests.
export const styles = `
:host {
  display: block;
  color-scheme: dark;
  --bg: var(--mesh-viewer-background, #15171c);
  --surface: var(--mesh-viewer-surface, #1d2027);
  --ink: var(--mesh-viewer-foreground, #e7e9ed);
  --muted: #9198a6;
  --line: #30343d;
  --accent: #b6b4ed;
  --mono: "IBM Plex Mono", monospace;
}
* {
  box-sizing: border-box;
}
.viewer {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font:
    15px/1.65 var(--mesh-viewer-font, Inter),
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}
button,
input,
textarea {
  font: inherit;
}
button {
  cursor: pointer;
  color: inherit;
}
a {
  color: inherit;
}
button:focus-visible,
a:focus-visible,
summary:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
[hidden] {
  display: none !important;
}
svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  vertical-align: middle;
  flex: none;
}
h1,
h2,
h3,
p {
  margin: 0;
}
h2 {
  font-size: 20px;
  font-weight: 500;
}
.participants {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px 42px;
  padding: 27px 0;
}
.participant {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}
.participant-avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 500;
  background: color-mix(in srgb, var(--agent) 9%, var(--bg));
  color: var(--agent);
  flex: none;
}
.participant-name {
  font-size: 14px;
  font-weight: 500;
}
.representation {
  font-size: 12px;
  color: var(--muted);
}
.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 2;
  min-height: 55px;
}
.view-tabs {
  display: flex;
  gap: 22px;
  align-self: stretch;
}
.view-tabs button {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 0;
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  color: var(--muted);
  font-size: 13px;
}
.view-tabs button[aria-selected="true"] {
  color: var(--ink);
  border-bottom-color: var(--accent);
}
.view-tabs button:hover {
  color: var(--ink);
}
.message-count {
  font-size: 12px;
  color: var(--muted);
}
.date-heading {
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
  margin: 25px 0 2px;
}
.message {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 12px;
  padding: 23px 0;
  border-bottom: 1px solid #282c33;
}
.message:last-child {
  border-bottom: 0;
}
.message-avatar {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: color-mix(in srgb, var(--agent) 8%, var(--bg));
  color: var(--agent);
  font-size: 10px;
  font-weight: 500;
}
.message-head {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  min-height: 27px;
  margin-bottom: 9px;
}
.message-name {
  font-size: 13px;
  font-weight: 600;
}
.message-route {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
}
.message-route svg {
  width: 13px;
  height: 13px;
}
.message-time {
  margin-left: auto;
  white-space: nowrap;
  color: var(--muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.message-.viewer {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-width: 78ch;
  font-size: 15px;
  line-height: 1.75;
}
.message-body a {
  color: #bbbfe1;
  text-decoration-color: #626782;
  text-underline-offset: 3px;
}
.uid {
  display: inline;
  padding: 1px 4px;
  border: 1px solid #393e49;
  border-radius: 4px;
  background: var(--surface);
  color: #b5bbca;
  font: 11px/1.65 var(--mono);
  cursor: pointer;
  white-space: normal;
  max-width: 100%;
  overflow-wrap: anywhere;
  vertical-align: baseline;
}
.uid:hover {
  color: var(--ink);
  border-color: var(--muted);
}
.message-details {
  font-size: 12px;
  color: var(--muted);
  margin-top: 12px;
}
.message-details summary {
  cursor: pointer;
  width: fit-content;
}
.message-details dl {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px 18px;
  padding: 14px 16px;
  background: var(--surface);
  border-radius: 6px;
  margin: 12px 0 0;
}
.message-details dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--ink);
}
.message-details dt {
  color: var(--muted);
}
.json-document {
  padding: 24px 0;
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #b7becb;
  font: 12px/1.8 var(--mono);
  tab-size: 2;
}
.json-key {
  color: #c2b9eb;
}
.json-string {
  color: #acd1bf;
}
.json-literal {
  color: #d6bd96;
}
.empty {
  padding: 40px 0;
  color: var(--muted);
}
code {
  font-family: var(--mono);
}
@media (max-width: 600px) {
  .participants {
    padding: 22px 0;
    gap: 17px 24px;
  }
  .participant-avatar {
    width: 30px;
    height: 30px;
    font-size: 10px;
  }
  .participant {
    gap: 8px;
  }
  .participant-name {
    font-size: 13px;
  }
  .representation {
    font-size: 11px;
  }
  .message {
    grid-template-columns: 25px minmax(0, 1fr);
    gap: 9px;
  }
  .message-avatar {
    width: 25px;
    height: 25px;
    font-size: 9px;
  }
  .message-head {
    gap: 4px 7px;
  }
  .message-time {
    font-size: 11px;
  }
  .message-route {
    font-size: 11px;
  }
  .message-name {
    font-size: 12px;
  }
  .message-.viewer {
    font-size: 14px;
  }
  .json-document {
    font-size: 11px;
  }
}
@media (pointer: coarse) {
  .view-tabs button {
    min-height: 44px;
  }
  .message-details summary {
    padding: 6px 0;
  }
  .uid {
    padding: 4px 6px;
  }
}

.participants-section {
  padding: 24px 0 18px;
}
#participants-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  margin: 0 0 17px;
}
#participant-count {
  font-size: 11px;
  border: 1px solid var(--line);
  border-radius: 5px;
  min-width: 21px;
  text-align: center;
  padding: 0 4px;
}
.participants {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 20px 28px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.participant {
  align-items: flex-start;
  gap: 12px;
}
.participant-avatar {
  width: 36px;
  height: 36px;
  margin-top: 2px;
}
.participant-identity {
  min-width: 0;
}
.participant-name {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.agent-label {
  font-size: 11px;
  font-weight: 400;
  color: var(--muted);
}
.representation {
  font-size: 12px;
  margin-top: 3px;
  overflow-wrap: anywhere;
}
.represented-person {
  color: var(--ink);
}
@media (max-width: 600px) {
  .participants {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 215px), 1fr));
    gap: 18px;
  }
  .participant-name {
    font-size: 14px;
  }
  .participant-avatar {
    font-size: 12px;
  }
  .representation {
    font-size: 12px;
  }
}
`;
