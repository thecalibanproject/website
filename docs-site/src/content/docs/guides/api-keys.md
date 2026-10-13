---
title: API keys
description: Mint a key for an app, limit what it may run and read, and replace it without downtime.
---

Apps call Caliban's [gateway address](../reference/glossary.md#gateway-address) with a workspace [API key](../reference/glossary.md#api-key): `Authorization: Bearer cal_...`. A key belongs to one workspace, and every request made with it is metered and limited as that workspace. Give each app its own key, so you can see its usage, limit it and revoke it on its own. The fintech demo used one key for the support desk and one for the help-centre widget.

API keys are for apps. People sign in to the console with their own account: see [people and roles](people-and-roles.md).

## Create

You need `api_keys.write` (owner, admin, workspace admin, developer).

1. Open the workspace (under **Workspaces**, labelled **Tenants** in consoles before the rename), then the **API keys** tab.
2. Type a **Key name** that says which app uses it, such as `billing-service-prod`.
3. Optionally open **Node access** to limit what the key may run and read (see [scopes](#scopes)).
4. Choose **Mint key**.
5. **Copy the key now.** It is shown once, under "Copy this key now. It will not be shown again." Caliban stores only a SHA-256 hash of it. Choose **Copy key**, store it in your app's secret store, then **I've stored it**.

The list shows each key's name, its first characters (**Prefix**, such as `cal_47de...`), what it may run, its scopes and when it was created.

With the API:

```sh
curl -X POST http://caliban.internal:8081/api/v1/tenants/cedar-bank/api-keys \
  -H "authorization: Bearer $CALIBAN_ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"name": "support-desk-app", "nodes": ["support-desk"]}'
```

The answer holds the key once, in `key`. Then make a first request: see the [gateway quickstart](../start/gateway-quickstart.md).

:::note
One key in the list is managed by Caliban: the workspace's test key, which [test runs](tests-and-go-live.md#run-tests) use. It cannot be used on the gateway, and you cannot change or revoke it (rotate it with **Rotate eval key** between test runs).
:::

## Scopes

A key has two kinds of restriction. Both are optional; they only narrow what the key could otherwise do.

**Which assistants it may run** (**Nodes this key may run**, `nodes` in the API):
- **Every published node** (the default): every live [assistant](../reference/glossary.md#assistant) of the workspace;
- **Only these nodes**: a list, such as `support-desk`;
- **No nodes**: plain model requests only. The help-centre widget in the fintech demo had no assistant access.

Giving a key access to assistants needs `nodes.run`. A key created by someone without it runs no assistants. A request to an assistant the key may not run gets `403` (`node_not_allowed`).

**What its conversations may read** (**Datasource scopes**, [what it may read](../reference/glossary.md#what-it-may-read)): comma-separated scopes that limit what an assistant's database lookups and document searches may reach when this key runs it, on top of the assistant's own scopes.
- `shop.orders:read`: a [data dictionary](data-dictionary.md) entity of a data connection;
- `rag.<library>:read`, such as `rag.handbook:read`: a [knowledge](knowledge.md) library.

Empty means every scope of the assistants it runs (shown as **Nodes' scopes**). A lookup outside both the assistant's and the key's scopes is refused.

To change either later, use `PATCH /api/v1/tenants/{t}/api-keys/{key}` with `{"nodes": [...] | null, "datasource_scopes": [...] | null}` (`null` lifts the restriction). The change is recorded in the [audit log](audit.md) with the old and new values.

**Rate limits per key** are not a key setting: your IT administrator sets them for every key of a workspace in the configuration file. The fintech demo used:

```toml
[limits.tenants.cedar-bank]
key_requests_per_minute = 120   # each key: a burst of 120, then 2 per second
tokens_per_minute = 60000
tokens_per_day = 5000000
usd_per_day = 25.0
```

Over a limit, a request gets `429` with a `retry-after` header. In the demo, a burst of 130 requests on one key got 120 answers and 10 `429`s. See [limits](../reference/limits.md).

:::caution[Coming soon]
Setting request and token limits on one key from the console is planned. Today they apply to every key of a workspace, through the configuration file and a restart.
:::

## Rotate

Replace a key without downtime:

1. **Mint a new key** with the same scopes, named after the app and the date (`support-desk-app-2026-10`).
2. **Deploy it** to the app and check that requests succeed with it (look for the new key's prefix in [Usage](usage-and-costs.md#usage)).
3. **Revoke the old key**: **Revoke** on its row, then **Revoke key** to confirm. With the API: `DELETE /api/v1/tenants/{t}/api-keys/{keyId}`.

A revoked key gets `401` on the gateway. With a single Caliban process, that happens on the next request. With several gateways (split mode), each one applies it on its next configuration poll, within 10 seconds by default. The key's row is kept, marked revoked (tick **Show revoked** to see it), and its id is never reused.

If a key leaks, revoke it first, then mint the replacement.

Deleting a workspace revokes all its keys.
