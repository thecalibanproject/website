---
title: Connected systems
description: Register a system your assistants may call (an MCP tool server), review its actions, and approve the ones they may use.
---

A [connected system](../reference/glossary.md#connected-system) is one of your own systems that assistants may call: a CRM, a ticket tracker, a refund service. It speaks MCP (the Model Context Protocol) over HTTP, and Caliban is its only client. Caliban decides which systems exist, which of their actions are approved, which addresses can be reached, which credentials are sent and which personal data may leave.

In the console these are under **Connected systems** (labelled **Tools** in consoles before the rename). The example on this page is the fintech demo's refund service, `bank-ops`, with one action, `issue_refund`.

## Add a tool server

You need `tools.write` (owner, admin, workspace admin, developer).

1. Open **Connected systems**, pick the workspace, and choose **Register server**.
2. Fill in:
   - **Name**: lower-case letters, digits, `-` and `_`, such as `bank-ops`. Assistant specs refer to it as `mcp://bank-ops/...`.
   - **URL**: the server's Streamable HTTP endpoint, `http` or `https`, such as `http://bank-ops.internal:8000/mcp`. Servers that only run as a local process (stdio) are not supported: put them behind an HTTP endpoint first.
   - **Authentication**: how Caliban proves who it is (table below).
   - **Trusted with personal data**: on only for your own core systems that must receive real values (the bank's refund system needs the real IBAN). Off, the system receives [placeholders](../reference/glossary.md#placeholder) instead of personal data.
3. Choose **Register server**. Then choose **Discover** on its row: Caliban connects, lists its actions and records each one.

| Authentication | Caliban sends | The server checks |
|---|---|---|
| Caliban token (default) | A token made for this one call, valid 60 seconds, naming the workspace, the assistant, the run and the action | Its signature, against `GET /.well-known/caliban-tool-jwks.json` on the admin service |
| API key | The key the server gave you, in a header (default `Authorization: Bearer`) | Its own key |
| OAuth client credentials | An access token from your authorization server | Its authorization server |
| None | Nothing | Nothing (a server on a private network) |

A key or client secret is encrypted as soon as it reaches Caliban and is never shown again. Your app's own key is never forwarded to a connected system.

Which addresses are allowed:
- only registered URLs are reached; redirects and proxies are not followed;
- private network ranges (`10/8`, `172.16/12`, `192.168/16`) are allowed: registering the server is the decision that allows it;
- link-local and cloud metadata addresses are always refused; the gateway's own host (loopback) is refused outside development.

If the admin service cannot reach the server, import its action list instead: `POST /api/v1/tenants/{t}/tool-servers/{server}/tools` with `{"manifests": [{"name", "description", "input_schema"}]}`.

With the API:

```sh
curl -X POST http://caliban.internal:8081/api/v1/tenants/cedar-bank/tool-servers \
  -H "authorization: Bearer $CALIBAN_ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"name": "bank-ops", "url": "http://bank-ops.internal:8000/mcp",
       "auth": {"method": "api_key"}, "credential": "...", "trusted": true}'
curl -X POST http://caliban.internal:8081/api/v1/tenants/cedar-bank/tool-servers/bank-ops/discover \
  -H "authorization: Bearer $CALIBAN_ADMIN_TOKEN"
```

## Approve a tool

Discovery does not make an action callable. Someone who may approve (`tools.approve`: owner, admin, workspace admin, the people who may publish assistants) must review it first. Developers can register and discover, but not approve.

1. On the server's row, show its tools and choose **Review** on an action.
2. Read its **Description** and **Input schema**: this is exactly what the model will see.
3. Read the **Injection scan findings**. Caliban scans every text the model would see for:
   - instructions aimed at the model ("ignore previous instructions", "do not tell the user");
   - hidden characters (zero-width or direction controls);
   - links and e-mail addresses;
   - requests for secrets or to send data somewhere.

   A flagged action can still be approved, but only after you tick **I have read these findings and still approve this tool**. The findings are kept in the audit log with your approval.
4. Choose **Approve tool**. The console shows the reference to use in assistant specs, with its fingerprint (the **pin**):

```text
mcp://bank-ops/issue_refund#sha256:...
```

An assistant spec names that exact reference and declares the action's effect (`read` or `write`). A version is only published when every reference names an approved action with that pin. See the [assistant spec](../reference/assistant-spec.md).

**When the server changes an action.** The pin is a fingerprint of the action's name, description and input schema. If the server changes any of them, discovery records a new version that needs its own approval, and calls pinned to the old one are refused at call time ("manifest changed since it was approved; it needs re-approval"). The model only ever sees the approved text. Changing the server's URL withdraws every approval of that server.

**Reads that reach the network.** An action whose arguments choose where it connects (a URL to fetch) can leak data like a write. Caliban detects these from the input schema (URL, host or e-mail fields) and treats them like writes for [approvals](approvals.md#what-needs-approval). When you approve, you can override the detection (`"network": true` or `false` in the API).

**Retries and repeats.** Caliban retries a call that failed on the network, and replays a step after a worker restarts, always with the same token id (`jti`). Have your server record the `jti` of each write it applies and answer a repeat with the first result, so each write happens once. The `bank-ops` server in the demo refunds a transaction once and answers a repeat with the first refund.

To withdraw an approval, choose **Revoke approval** (`POST .../tools/{tool}/revoke`). Published versions that use the action then fail when they call it.

:::note
During tests, approved actions are answered by a stand-in, not by your system. An assistant can let a read-only action run live in tests (`eval_live` in its spec). See [write tools in tests](tests-and-go-live.md#write-tools-in-tests).
:::
