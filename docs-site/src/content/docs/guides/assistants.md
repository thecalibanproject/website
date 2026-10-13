---
title: Assistants
description: Create an assistant, edit its settings, set its budgets, and manage its versions.
---

An assistant (`node` in the API) is an AI helper with instructions, data access, tools and limits, kept in versions. Apps call it by name, or [a topic](topics.md#send-to-an-assistant) sends requests to it. [Assistants and versions](../concepts/assistants-and-versions.md) explains the model; [the assistant spec](../reference/assistant-spec.md) lists every setting.

In the console, open **Assistants** (labelled **Nodes** in consoles before the rename). You need `nodes.write` to create and edit, and `nodes.publish` to publish and go live.

## Create from template

:::caution[Coming soon]
Templates from the demo use cases (health triage, legal research, support desk), each with its settings, test cases and example sentences, and a short wizard: pick a template, connect data, try it, go live. Until then, start from a working spec: the health demo's specs in the deploy repo (`e2e/health-triage/node/triage.node.json` and `careguide.node.json`), or the reference triage assistant in core (`config/nodes/triage.node.json`), and paste it as described in [Edit JSON](#edit-json).
:::

The intended flow:
1. **Assistants**, then **New assistant**, then pick a template.
2. Connect the data the template needs (a [data connection](data-connections.md) or a [knowledge](knowledge.md) library).
3. Try it on a few questions.
4. Go live once its tests pass. See [Tests and going live](tests-and-go-live.md).

The [first assistant tutorial](../start/first-assistant.md) walks through today's steps end to end.

## Edit with the form

:::caution[Coming soon]
A form for the settings most people change: instructions, what the assistant may read, what it may do, the answer format and the limits, with **Edit as JSON** for the rest. Today, assistants are edited as JSON (below). The assistant page already shows each version's data access, answer check, personal-data floor and steps in plain form, read-only.
:::

## Edit JSON

Every assistant is a JSON document checked against the assistant schema (`node.schema.json`).

1. Open **Assistants** and choose **New node** (or, on an existing assistant, **New version**).
2. Pick the **Tenant** (workspace) and a **Name**: 1 to 64 lowercase letters, digits, `-` and `_`. Apps call it as `POST /v1/nodes/{name}/runs`.
3. Paste or write the spec. The editor checks it against the schema as you type. Tab indents; press Escape to move focus out of the editor.
4. Choose **Create node**. Caliban checks it again and creates version 1 as a **draft**.

A minimal assistant that answers from a document library:

```json
{
  "kind": "agent",
  "prompt": {"system": "You answer from the handbook. Cite your sources."},
  "model_policy": {},
  "budgets": {"steps": 8, "tokens": 100000, "wall_clock_s": 60},
  "datasources": {"scopes": ["rag.handbook:read"]},
  "tools": [{"ref": "builtin://rag_search", "effect": "read"}]
}
```

A version never changes once created. To change an assistant, create a new version. The new draft starts from the spec you picked.

Through the API: `POST /api/v1/tenants/{t}/nodes/{name}/versions` with the spec.

## Budgets

Every version declares how much one conversation may use. A conversation that reaches a limit ends gracefully with what it has so far (status `budget_exhausted`, and the reason in `stop_reason`).

| Field | Plain meaning |
|---|---|
| `budgets.steps` | Steps that call a model, a tool or a person |
| `budgets.tokens` | Tokens processed by all model calls |
| `budgets.wall_clock_s` | Working time in seconds, not counting time waiting for a person |
| `budgets.usd` | The most one conversation may cost (optional) |
| `budgets.depth` | Levels of sub-assistants (default 3) |
| `budgets.fanout` | Tasks in parallel (default 8) |

Three levels sit above and below:
- **The workspace** caps what any version may declare, and what all assistants may spend per day and month. See [limits and budget](workspaces.md#limits-and-budget). A version that does not fit cannot be published.
- **A request** may lower the limits for one conversation: `"budget": {"usd": 0.01}` in the run request.
- **A sub-assistant** gets at most what its parent has left.

The conversation page shows each budget used against its limit. In the fintech demo, a support-desk conversation used 7 of 14 steps, 2,913 of 60,000 tokens and $0.0008 of $0.50.

## Versions

![An assistant page: the versions table and the settings of version 1](../../../assets/shots/assistant-versions.webp)
*The triage assistant from the health demo: version 1 is ready to test but not live yet, so its tests can run first.*

A version moves one way through four states:

| State (plain) | API and console today | Means |
|---|---|---|
| Draft | `draft` | Editable as a new version, not runnable |
| Ready to test | `published` | Frozen and checked, runnable by tests and by apps that name the version |
| Live | `published` and live | What apps get when they name no version. One per assistant |
| Archived | `retired` | No new conversations. Conversations already started finish on it |

What to do:
- **Publish** a draft. Caliban checks the spec against the workspace: the data it may read, its tools (approved versions only), its sub-assistants (published versions only), its budgets against the workspace caps, and its fixed queries against the [data dictionary](data-dictionary.md#versions). A failure lists every problem.
- **Go live** (**Make live** in the console). If the assistant has go-live rules, its latest tests must pass them first: publish without making it live, run the tests, then go live. See [Tests and going live](tests-and-go-live.md#go-live).
- **Roll back** by making an earlier published version live again.
- **Retire** a version you no longer want. Retire the live version only after another one is live.
- **Compare versions** at the bottom of the assistant page shows what changed between two versions.

Each version has a fingerprint (`sha256:...`, **Hash** in the console). It proves which exact version answered a conversation.

| Action | API |
|---|---|
| Publish (and go live) | `POST /api/v1/tenants/{t}/nodes/{name}/versions/{v}/publish` with `{"promote": false}` to publish only |
| Go live, or roll back | `POST /api/v1/tenants/{t}/nodes/{name}/promote` with `{"version": v}` |
| Retire | `POST /api/v1/tenants/{t}/nodes/{name}/versions/{v}/retire` |
| Compare | `GET /api/v1/tenants/{t}/nodes/{name}/diff?from=1&to=2` |
