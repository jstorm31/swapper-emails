# Issue tracker: Linear

Issues and specs for this repo live in Linear, on the shared **Swapper** team (key `SW`).
This repo is distinguished within the team by the `emails` label — apply it to every
issue that belongs here.

## Access

Skills use the **Linear MCP connector** to read and write issues. If the connector
reports it isn't authorized, tell the user to authorize it in their claude.ai connector
settings (or via `/mcp` in an interactive session) — don't attempt the OAuth flow
yourself and don't ask for tokens.

## Conventions

- **Create an issue**: create it on the Swapper (SW) team, applying the `emails` label.
- **Read an issue**: fetch by identifier (e.g. `SW-123`), including comments and labels.
- **List issues**: filter by team Swapper, label `emails`, and state as needed.
- **Comment on an issue**: add a comment with the update or answer.
- **Apply / remove labels**: add or remove labels, always keeping the `emails` label.
- **Close / resolve**: move the issue to its terminal workflow state per the team's workflow.

## When a skill says "publish to the issue tracker"

Create a Linear issue on the Swapper (SW) team with the `emails` label.

## When a skill says "fetch the relevant ticket"

Fetch the issue by its Linear identifier (e.g. `SW-123`), including comments.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single Linear issue with **child** issues as tickets.

- **Map**: issue labelled `wayfinder:map` + `emails`, holding Notes / Decisions-so-far / Fog.
- **Child ticket**: a Linear **sub-issue** of the map, labelled `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`) + `emails`.
- **Blocking**: Linear's native issue relations (`blocks` / `blocked by`). A ticket is unblocked when every blocker is closed.
- **Frontier query**: the map's open sub-issues, minus any with an open blocker or an assignee; first in map order wins.
- **Claim**: assign the issue to yourself — the session's first write.
- **Resolve**: comment with the answer, move the issue to Done, then append a context pointer to the map's Decisions-so-far.
