#!/usr/bin/env python3
"""
Fulcra Cross-Account Procedural Memory Demo
===========================================

Goal
----
Demonstrate permissioned agent-to-agent procedural-memory transfer between
independently owned Fulcra accounts.

Current peer
------------
Ujwal's agent  <->  Get Civilized (Michael Tiffany's agent)

Security note
-------------
This file intentionally contains no device codes, access tokens, passwords,
or other authentication secrets. Authenticate interactively with Fulcra before
running the demo.

Prerequisites
-------------
1. Python 3.10+
2. `uv` installed
3. Fulcra CLI available via `uvx fulcra-api`
4. An authenticated Fulcra session
5. The reciprocal Mesh shares shown in CONFIG below

Typical authentication flow:
    uvx fulcra-api auth login --get-auth-url
    # Complete browser authorization, then:
    uvx fulcra-api auth login --device-code "<DEVICE_CODE>"

Do not commit device codes or credentials to GitHub.
"""

import argparse
import json
import subprocess
import time
import uuid
from datetime import datetime, timedelta, timezone


# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------

UJWAL_USER_ID = "7fe139a2-2622-4c3c-905f-a0f499b7162a"
MICHAEL_USER_ID = "a24a9667-c2c6-4bbf-9a0f-36ea0afcb521"

MICHAEL_AGENT_ADDRESS = "michael-tiffany"
MICHAEL_AGENT_NAME = "Get Civilized"

# Working Ujwal -> Michael channel acknowledged by Michael's agent.
UJWAL_OUTBOX = "MomentAnnotation/438e8e6e-d100-4bc1-8de6-83e3df2535cc"

# Michael -> Ujwal reply channel shared by Michael's Fulcra account.
MICHAEL_OUTBOX = "MomentAnnotation/cc3bf01b-1059-4e70-b5e3-db36156c493e"


# ---------------------------------------------------------------------------
# LOW-LEVEL HELPERS
# ---------------------------------------------------------------------------

def run_cli(args, stdin_text=None, check=False):
    """Run `uvx fulcra-api ...` and return CompletedProcess."""
    cmd = ["uvx", "fulcra-api", *args]
    result = subprocess.run(
        cmd,
        input=stdin_text,
        capture_output=True,
        text=True,
    )
    if check and result.returncode != 0:
        raise RuntimeError(
            f"Command failed: {' '.join(cmd)}\n"
            f"STDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        )
    return result


def make_envelope(slug, body, kind="directive", priority="P2"):
    """Build a Fulcra Mesh message envelope."""
    return {
        "v": 1,
        "mid": str(uuid.uuid4()),
        "to": MICHAEL_AGENT_ADDRESS,
        "to_user": MICHAEL_USER_ID,
        "kind": kind,
        "pri": priority,
        "slug": slug,
        "body": body,
    }


def send_envelope(envelope):
    """
    Send one envelope through Ujwal's dedicated outbox.

    IMPORTANT: the Mesh envelope is serialized as a JSON STRING inside `note`.
    """
    payload = {"note": json.dumps(envelope)}
    result = run_cli(
        ["record", UJWAL_OUTBOX],
        stdin_text=json.dumps(payload),
    )

    print("=== SEND RESULT ===")
    print(result.stdout.strip())
    if result.stderr.strip():
        print("\n=== STDERR ===")
        print(result.stderr.strip())

    print("\nMID:", envelope["mid"])
    print("Slug:", envelope["slug"])
    return result


def get_michael_records(hours=12):
    """Read records from Michael's dedicated reply outbox."""
    start = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    end = datetime.now(timezone.utc).isoformat()

    result = run_cli([
        "get-records",
        MICHAEL_OUTBOX,
        start,
        end,
        "--user-id",
        MICHAEL_USER_ID,
    ])

    if result.stderr.strip():
        print("STDERR:", result.stderr.strip())

    records = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return records


def decode_mesh_message(record):
    """Decode the JSON string stored in a MomentAnnotation note."""
    note = record.get("note")
    if not note:
        return None
    try:
        return json.loads(note)
    except (TypeError, json.JSONDecodeError):
        return None


# ---------------------------------------------------------------------------
# CONNECTION / INSPECTION
# ---------------------------------------------------------------------------

def show_connection():
    print("""
FULCRA PROCEDURAL MEMORY DEMO

Ujwal Kumar
  Fulcra user: {ujwal}
  Agent outbox: {u_outbox}
          |
          |  Fulcra Mesh
          v
Michael Tiffany / {agent}
  Fulcra user: {michael}
  Agent address: {address}
  Reply outbox: {m_outbox}
""".format(
        ujwal=UJWAL_USER_ID,
        u_outbox=UJWAL_OUTBOX,
        agent=MICHAEL_AGENT_NAME,
        michael=MICHAEL_USER_ID,
        address=MICHAEL_AGENT_ADDRESS,
        m_outbox=MICHAEL_OUTBOX,
    ))


def list_incoming_shares():
    result = run_cli(["share", "list-incoming"])
    print(result.stdout)
    if result.stderr.strip():
        print("STDERR:", result.stderr)


def read_messages(hours=12):
    records = get_michael_records(hours=hours)

    if not records:
        print("No readable records returned.")
        return

    for record in records:
        msg = decode_mesh_message(record)
        if not msg:
            continue

        print("=" * 72)
        print(f"{MICHAEL_AGENT_NAME} -> Ujwal's agent")
        print("Slug:", msg.get("slug"))
        print("MID :", msg.get("mid"))
        print("Kind:", msg.get("kind"))
        print()
        print(msg.get("body", ""))


# ---------------------------------------------------------------------------
# DEMO MESSAGES
# ---------------------------------------------------------------------------

def send_calendar_test():
    """
    Connectivity/context-boundary test.

    This does NOT grant Michael's agent access to Ujwal's calendar. It asks the
    peer to report what context it actually has and to avoid fabrication.
    """
    body = """Hi Michael's agent - we'd like to test our agent-to-agent connection.

Can you help determine what Ujwal's calendar looks like for today?

Please tell us what calendar/context you actually have access to. If you do not
have access to Ujwal's calendar, do not infer or fabricate events. Instead,
tell Ujwal's agent what context or permission would need to be shared through
Fulcra for you to answer.

This is also a test of our shared-memory experiment, so briefly explain what
context you used when producing your answer."""

    send_envelope(make_envelope("ujwal-calendar-test", body))


def send_procedural_memory_trial():
    """Ask Get Civilized for a portable, non-private procedure artifact."""
    body = """Thanks Get Civilized. Let's run a bounded procedural-memory trial.

Goal:
Test whether procedural knowledge can move between independently owned agents
without retraining either model.

Trial:
Please choose one reusable procedure that you use to perform a research or
reasoning task more effectively - for example a deep-research, verification,
planning, or decision-making loop.

Please send the procedure back as an explicit portable artifact containing:

1. procedure_name
2. purpose
3. trigger - when an agent should use it
4. ordered_steps
5. required_tools
6. stop_condition
7. verification/check steps
8. any important constraints

Please make it general rather than specific to Michael's private information.

Evidence we want back:
- the procedure artifact itself
- why your agent considers the procedure useful
- how a receiving agent should adapt it if it has different tools

Ujwal's agent will then import the procedure, adapt it to its available tools,
and demonstrate how its execution loop changes.

This is explicitly a synthetic/shareable hackathon experiment; please do not
expose Michael's private context."""

    send_envelope(make_envelope("procedural-memory-trial-1", body))


def watch_for_slug(slug="procedural-memory-trial-1", minutes=10, interval=30):
    """Poll Michael's outbox until a matching response arrives."""
    attempts = max(1, int((minutes * 60) / interval))
    seen = set()

    print(f"Watching for '{slug}' for up to {minutes} minute(s)...")

    for attempt in range(attempts):
        records = get_michael_records(hours=12)

        for record in records:
            msg = decode_mesh_message(record)
            if not msg:
                continue

            mid = msg.get("mid")
            if mid in seen:
                continue
            seen.add(mid)

            if slug in msg.get("slug", ""):
                print("=" * 72)
                print(f"{MICHAEL_AGENT_NAME} -> Ujwal's agent")
                print("Thread:", msg.get("slug"))
                print("MID   :", mid)
                print("Type  :", msg.get("kind"))
                print("\nRESPONSE:\n")
                print(msg.get("body", ""))
                return msg

        print(f"Check {attempt + 1}/{attempts}: no matching response yet.")
        if attempt < attempts - 1:
            time.sleep(interval)

    print("No matching response arrived during the watch window.")
    return None


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Fulcra cross-account procedural-memory demo"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("connection", help="Show configured peer/channel details")
    sub.add_parser("incoming", help="List incoming Fulcra shares")

    read_p = sub.add_parser("read", help="Read recent messages from Michael")
    read_p.add_argument("--hours", type=int, default=12)

    sub.add_parser("calendar-test", help="Send the bounded calendar/context test")
    sub.add_parser("procedure-trial", help="Request a portable procedure artifact")

    watch_p = sub.add_parser("watch", help="Watch for a response slug")
    watch_p.add_argument(
        "--slug", default="procedural-memory-trial-1",
        help="Substring expected in the response slug"
    )
    watch_p.add_argument("--minutes", type=int, default=10)
    watch_p.add_argument("--interval", type=int, default=30)

    args = parser.parse_args()

    if args.command == "connection":
        show_connection()
    elif args.command == "incoming":
        list_incoming_shares()
    elif args.command == "read":
        read_messages(hours=args.hours)
    elif args.command == "calendar-test":
        send_calendar_test()
    elif args.command == "procedure-trial":
        send_procedural_memory_trial()
    elif args.command == "watch":
        watch_for_slug(
            slug=args.slug,
            minutes=args.minutes,
            interval=args.interval,
        )


if __name__ == "__main__":
    main()
