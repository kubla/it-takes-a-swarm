import { normalizeConversation } from "./normalize.js";
import { styles } from "./styles.js";
export { normalizeConversation, decodeDisplayText } from "./normalize.js";

/** Mount a self-contained viewer. Importing this module has no DOM or network effects. */
export function createMeshViewer(
  container,
  { data = [], timeZone = "America/New_York" } = {},
) {
  if (!container || container.nodeType !== 1 || !container.ownerDocument) {
    throw new TypeError("A DOM element is required as the viewer container.");
  }
  new Intl.DateTimeFormat("en-US", { timeZone });
  const initial = snapshot(data);
  const initialConversation = normalizeConversation(initial);
  const document = container.ownerDocument;
  const host = document.createElement("div");
  host.className = "mesh-viewer";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  shadow.append(style);
  const template = document.createElement("template");
  template.innerHTML =
    '    <div class="viewer">\n      <section class="participants-section" aria-labelledby="participants-heading">\n        <h2 id="participants-heading">Participants <span id="participant-count"></span></h2>\n        <ul id="participants" class="participants"></ul>\n      </section>\n      <div class="view-toolbar">\n        <div class="view-tabs" role="tablist" aria-label="Message view">\n          <button id="messages-tab" role="tab" aria-selected="true" aria-controls="messages-panel" tabindex="0"><span data-icon="message"></span>Messages</button>\n          <button id="json-tab" role="tab" aria-selected="false" aria-controls="json-panel" tabindex="-1"><span data-icon="braces"></span>JSON</button>\n        </div>\n        <span id="message-count" class="message-count"></span>\n      </div>\n      <section id="messages-panel" role="tabpanel" aria-labelledby="messages-tab"><div id="timeline"></div></section>\n      <section id="json-panel" role="tabpanel" aria-labelledby="json-tab" hidden><pre class="json-document"><code id="json-document"></code></pre></section>\n    </div>';
  shadow.append(template.content.cloneNode(true));
  let destroyed = false;
  function ensureActive() {
    if (destroyed) throw new Error("This viewer has been destroyed.");
  }
  function snapshot(input) {
    return typeof input === "string"
      ? JSON.parse(input)
      : JSON.parse(JSON.stringify(input));
  }

  const paths = {
    braces: "M8 3H6v6l-3 3 3 3v6h2M16 3h2v6l3 3-3 3v6h-2",
    message: "M3 4h18v13H8l-5 4z",
    arrow: "M4 12h16M15 7l5 5-5 5",
  };
  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", paths[name] ?? paths.message);
    svg.append(path);
    return svg;
  }
  shadow
    .querySelectorAll("[data-icon]")
    .forEach((e) => e.replaceWith(icon(e.dataset.icon)));
  const colors = ["#bca4ff", "#9cdecf", "#e9c782", "#a5c5ff"];
  const $ = (id) => shadow.getElementById(id);
  const text = (tag, value, className) => {
    const el = document.createElement(tag);
    el.textContent = value;
    if (className) el.className = className;
    return el;
  };
  function uid(value) {
    const outbox = value.startsWith("MomentAnnotation/");
    const id = outbox ? value.slice(17) : value;
    const short =
      (outbox ? "outbox " : "") + id.slice(0, 6) + "…" + id.slice(-4);
    const b = text("button", short, "uid");
    b.type = "button";
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-label", "Expand identifier " + value);
    b.addEventListener("click", () => {
      const expanded = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(expanded));
      b.setAttribute(
        "aria-label",
        (expanded ? "Collapse identifier " : "Expand identifier ") + value,
      );
      b.textContent = expanded ? value : short;
    });
    return b;
  }
  function renderText(el, value) {
    const re =
      /(?:MomentAnnotation\/)?[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}|https?:\/\/[^\s)]+/gi;
    let position = 0;
    for (const match of value.matchAll(re)) {
      el.append(document.createTextNode(value.slice(position, match.index)));
      if (/^https?:/i.test(match[0])) {
        const a = text("a", match[0]);
        a.href = match[0];
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        el.append(a);
      } else {
        el.append(uid(match[0]));
      }
      position = match.index + match[0].length;
    }
    el.append(document.createTextNode(value.slice(position)));
  }
  const date = (time, options) =>
    time
      ? new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(
          new Date(time),
        )
      : "Time not provided";

  function render(conversation, source) {
    renderJson(source);
    const agentIndex = new Map(
      conversation.participants.map((p, i) => [p.id, { ...p, index: i }]),
    );
    const participants = $("participants");
    participants.replaceChildren();
    $("participant-count").textContent = String(
      conversation.participants.length,
    );
    conversation.participants.forEach((p, i) => {
      const card = document.createElement("li");
      card.className = "participant";
      card.style.setProperty("--agent", colors[i % colors.length]);
      const initials = p.name
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("");
      const avatar = text("span", initials, "participant-avatar");
      avatar.setAttribute("aria-hidden", "true");
      const identity = document.createElement("div");
      identity.className = "participant-identity";
      const name = text("div", p.name, "participant-name");
      name.append(text("span", "Agent", "agent-label"));
      identity.append(name);
      const representation = text("div", "Representing ", "representation");
      representation.append(
        text("span", p.represents || "Not specified", "represented-person"),
      );
      identity.append(representation);
      card.append(avatar, identity);
      participants.append(card);
    });
    $("message-count").textContent = `${conversation.messages.length} messages`;
    const timeline = $("timeline");
    timeline.replaceChildren();
    let lastDate = "";
    for (const m of conversation.messages) {
      const day = m.time
        ? date(m.time, { month: "long", day: "numeric", year: "numeric" })
        : "Undated";
      if (day !== lastDate) {
        const heading = text(
          "h2",
          day + (m.time ? " · " + timeZone : ""),
          "date-heading",
        );
        timeline.append(heading);
        lastDate = day;
      }
      const sender = agentIndex.get(m.from);
      const recipient = agentIndex.get(m.to);
      const article = document.createElement("article");
      article.className = "message";
      article.style.setProperty(
        "--agent",
        colors[sender.index % colors.length],
      );
      const initials = sender.name
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("");
      const mark = text("div", initials, "message-avatar");
      mark.setAttribute("aria-hidden", "true");
      const main = document.createElement("div");
      const header = document.createElement("header");
      header.className = "message-head";
      header.append(text("span", sender.name, "message-name"));
      const route = text("span", "", "message-route");
      route.append(
        icon("arrow"),
        document.createTextNode(
          recipient?.name || m.toLabel || "Recipient not provided",
        ),
      );
      header.append(route);
      const time = text(
        "time",
        date(m.time, { hour: "numeric", minute: "2-digit" }),
        "message-time",
      );
      if (m.time) time.dateTime = m.time;
      header.append(time);
      const content = document.createElement("div");
      content.className = "message-content";
      const body = document.createElement("div");
      body.className = "message-body";
      renderText(body, m.displayBody);
      const details = document.createElement("details");
      details.className = "message-details";
      details.append(text("summary", "Details"));
      const dl = document.createElement("dl");
      for (const [key, value] of [
        ["Message", String(m.id)],
        ["To (as recorded)", m.toLabel || m.to || "Not provided"],
        ["Topic", m.slug || "Not provided"],
        ["Priority", m.priority || "Not provided"],
        ["Recorded", date(m.time, { dateStyle: "medium", timeStyle: "long" })],
      ]) {
        dl.append(text("dt", key));
        const dd = document.createElement("dd");
        renderText(dd, value);
        dl.append(dd);
      }
      details.append(dl);
      content.append(body, details);
      main.append(header, content);
      article.append(mark, main);
      timeline.append(article);
    }
    if (!conversation.messages.length)
      timeline.append(text("p", "No messages in this exchange.", "empty"));
  }

  function renderJson(value) {
    const target = $("json-document");
    target.replaceChildren();
    const json = JSON.stringify(value, null, 2);
    let end = 0;
    const pattern =
      /("(?:\\.|[^"\\])*"\s*:?)|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gi;
    for (const match of json.matchAll(pattern)) {
      target.append(document.createTextNode(json.slice(end, match.index)));
      const kind = match[0].startsWith('"')
        ? match[0].endsWith(":")
          ? "key"
          : "string"
        : "literal";
      target.append(text("span", match[0], "json-" + kind));
      end = match.index + match[0].length;
    }
    target.append(document.createTextNode(json.slice(end)));
  }
  function setView(view) {
    ensureActive();
    if (!["messages", "json"].includes(view))
      throw new Error("View must be messages or json.");
    for (const name of ["messages", "json"]) {
      const active = name === view;
      $(name + "-tab").setAttribute("aria-selected", String(active));
      $(name + "-tab").tabIndex = active ? 0 : -1;
      $(name + "-panel").hidden = !active;
    }
  }
  for (const name of ["messages", "json"]) {
    $(name + "-tab").addEventListener("click", () => setView(name));
    $(name + "-tab").addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next =
          event.key === "Home"
            ? "messages"
            : event.key === "End"
              ? "json"
              : name === "messages"
                ? "json"
                : "messages";
        setView(next);
        $(next + "-tab").focus();
      }
    });
  }

  function setData(input) {
    ensureActive();
    // Validate a detached copy before changing the current view.
    const source = snapshot(input);
    const conversation = normalizeConversation(source);
    render(conversation, source);
    return {
      messages: conversation.messages.length,
      participants: conversation.participants.length,
    };
  }
  render(initialConversation, initial);
  container.append(host);
  return Object.freeze({
    setData,
    setView,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      host.remove();
      shadow.replaceChildren();
    },
  });
}
