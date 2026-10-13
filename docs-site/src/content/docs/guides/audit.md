---
title: Audit log
description: Read who changed what in Caliban, and check that nobody has edited the log since.
---

Every change made through the admin service is recorded in the [audit log](../reference/glossary.md#audit-log): creating a workspace, minting or revoking a key, publishing an assistant, approving an action, changing a bar, signing in. Decisions made inside conversations (answers, approvals, cancellations, test results) are recorded there too. Secrets, tokens and cookies never are.

Reading the log needs `audit.read`: owner, admin or auditor.

## Read the log

Open **Audit log** in the console. Entries are newest first. Filter by workspace or by action, and load more at the bottom.

| Column | Meaning |
|---|---|
| Time | When it happened (UTC in the API) |
| Actor | Who did it: a person as `email <issuer#subject>`, `break_glass` (the shared admin token), `system` (startup work), `api_key:<prefix>` (an app answering a question), or `anonymous` (a failed sign-in) |
| Action | What happened (below) |
| Target | What it happened to: a workspace, a key, an assistant, a conversation |
| Tenant | The [workspace](../reference/glossary.md#workspace), or **Global** for deployment-wide changes |
| Details | What changed, as JSON (old and new values where it helps; never secrets) |
| Hash | The entry's place in the [tamper check](#verify-the-chain) |

Actions use internal ids. The common ones, in plain words:

| Action | What happened |
|---|---|
| `tenant.create`, `tenant.update`, `tenant.delete` | A workspace was created, changed (privacy, caching, limits) or deleted |
| `api_key.create`, `api_key.update`, `api_key.revoke` | An API key was minted, its access changed, or it was revoked |
| `provider_key.create`, `provider_key.delete` | A [provider account](../reference/glossary.md#provider-account) key was added or removed |
| `routes.set`, `tenant.intent.set` | Which model answers, or a [topic](../reference/glossary.md#topic), was changed |
| `node.create`, `node.publish`, `node.promote`, `node.retire` | An assistant version was drafted, published, made live or archived |
| `node.golden_set.update`, `node.eval_policy.update` | Test cases, or the bar, were changed (old and new bar in the details) |
| `node.eval.start`, `node.eval.finish` | A test run started or finished, with its main result |
| `node.run.answer` | A person or an app answered an assistant's question |
| `node.write.approve`, `node.write.deny` | An action was approved or denied in [approvals](approvals.md) |
| `node.run.cancel` | A conversation was stopped |
| `tool_server.create`, `tool.approve`, `tool.revoke` | A [connected system](connected-systems.md) was registered, or an action approved or revoked (with the scan findings) |
| `auth.login`, `auth.logout`, `auth.login_failed` | Sign-ins and sign-outs, and failed sign-ins with the reason |
| `auth.break_glass` | The shared admin token was used while single sign-on is on |
| `role_binding.create`, `role_binding.delete` | A role was granted or revoked |
| `keys.rotate` | The master encryption key was rotated |

With the API:

```sh
curl "http://caliban.internal:8081/api/v1/audit?limit=100" \
  -H "authorization: Bearer $CALIBAN_ADMIN_TOKEN"
```

It returns `entries` (newest first, `limit` up to 1,000), the `head` (the latest entry's sequence number and hash) and `chain_verified`.

## Verify the chain

Each entry is linked to the one before it. Its hash is computed over the previous entry's hash and its own content:

```text
hash = sha256(prev_hash ‖ canonical_json({seq, ts, tenant_id, actor, action, target, detail}))
```

The JSON has sorted keys and no whitespace, `ts` is RFC 3339 UTC with microseconds, and the first entry uses 32 zero bytes as `prev_hash`. Editing or deleting any entry changes its hash, which breaks every later link. The database also refuses updates and deletes on the log.

**In the console**, the top of the page says **Chain verified** or **Chain not verified**. When it is not verified, entries with a broken link are marked **Link broken**. **Copy head hash** copies the latest hash.

**With the API**, `chain_verified` re-checks the window of entries the call returned.

To prove later that the log has not been rewritten, record the head hash somewhere outside Caliban at regular intervals (a ticket, a signed e-mail, your SIEM). If an earlier head hash no longer appears in the chain with the same sequence number, the log was changed after you recorded it.

You can also re-compute the chain yourself from the API's entries with the formula above, without trusting Caliban's check.

:::note
Several admin service replicas share one log; writes are serialised, so the chain stays a single line. Decisions made on workers are delivered at least once and recorded once, so a redelivery never adds an entry or breaks the chain.
:::
