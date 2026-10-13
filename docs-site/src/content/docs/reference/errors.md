---
title: Errors
description: The error format of the gateway and the admin API, and what each status code means.
---

## The error format

The gateway and the admin API answer errors with one JSON shape:

```json
{
  "error": {
    "message": "rate limited: tokens_per_minute",
    "type": "rate_limited",
    "code": "tokens_per_minute"
  }
}
```

| Field | Meaning |
|---|---|
| `message` | What happened, in words |
| `type` | The class of error (table below) |
| `code` | A precise reason, or `null` |
| `problems` | Only when an assistant version is refused: every reason, one by one |
| `breaking` | Only when a data dictionary change would break live assistants |

Requests to the Anthropic-compatible endpoints (`/v1/messages`) get Anthropic's shape instead, so Anthropic SDKs parse them:

```json
{ "type": "error", "error": { "type": "rate_limit_error", "message": "..." } }
```

## Status codes

| Status | `type` | When | What to do |
|---|---|---|---|
| `400` | `invalid_request_error` | The request is malformed: bad JSON, an input that does not match the assistant's input schema (`invalid_input`), a malformed untrusted mark | Fix the request; the message says what is expected |
| `401` | `authentication_error` | Missing, unknown or revoked API key, a key of a deleted workspace, the test key used from outside, or no admin session | Check the key; mint a new one if it was revoked |
| `403` | `policy_violation` (gateway) | The request carries a credential (an API key, a password), or personal data screening failed. Nothing was sent upstream | Remove the secret from the prompt; for a screening failure, contact the operator |
| `403` | `permission_error` (admin API) | Your roles do not allow this action | Ask an administrator for the role ([People and roles](../guides/people-and-roles.md#roles)) |
| `403` | | `node_not_allowed`: the API key may not run this assistant | Allow the assistant on the key ([API keys](../guides/api-keys.md#scopes)) |
| `404` | `not_found` | Unknown id, an id of another workspace, or one already deleted. A repeated delete is always `404` | Check the id and the workspace |
| `404` | | `node_not_found`: the assistant has no live version, or is not published; `run_not_found` | Make a version live |
| `409` | `conflict` | The resource is in use or in the wrong state: deleting a model or provider account a route still uses, archiving a version another live version calls, answering a conversation that is not waiting, a scan already running, changing the test key | Remove the dependency first, or wait |
| `409` | `conflict` | `ontology_breaking_change`: a data dictionary decision would withdraw entries that live assistants query (see `breaking`) | Confirm with `acknowledge_breaking: true`, or publish new assistant versions first |
| `409` | | `idempotency_key_in_use`: a request with the same `Idempotency-Key` is still running. Comes with `Retry-After: 1` | Retry after a second |
| `409` | | `idempotency_response_not_stored`: the first response was over 4 MiB and was not kept | Use a new key |
| `422` | `invalid_request_error` | The change would leave an invalid configuration (rolled back) | Read the message |
| `422` | `invalid_request_error` | `validation_failed`: an assistant version cannot be created, published or made live; `problems` lists each reason | Fix each problem (below) |
| `422` | | `idempotency_key_reused`: the same key with a different method, path or body | Use a new key for a new request |
| `429` | `rate_limited` | A rate limit or token budget was hit. `code` and the `x-caliban-ratelimit-scope` header name it (`requests_per_minute`, `key_requests_per_minute`, `tokens_per_minute`, `tokens_per_day`, `usd_per_day`) | Wait `retry-after` seconds |
| `502` | `upstream_error` | The model server or provider failed; `node_run_failed` when an assistant's conversation failed behind the chat API | Retry; check the model server |
| `503` | `overloaded` | The name detection queue is full. Nothing was sent upstream. Comes with `retry-after: 1` | Retry; the operator can add detection capacity |
| `503` | `unavailable` | The admin service has no database for this feature (assistant runs, tests), or `nodes_not_enabled` on the gateway | Configure the database and `CALIBAN_KEK` |
| `504` | | `node_run_timeout`: a synchronous assistant request still running after the wait (60 s by default) | Use async runs, or follow the run |

Every successful or failed gateway response carries `x-caliban-request-id`. Quote it when you report a problem.

## Assistant version problems

When a version is refused (`422`, `validation_failed`), each entry of `problems` has a `kind`, a `message` and often a `path` into the spec:

| `kind` | Means |
|---|---|
| `spec` | The spec does not match the schema |
| `tool` | An action is not approved with that pin, or not registered |
| `datasource_scope` | A scope names no live data connection, approved entry or document library |
| `budget` | A limit is above the workspace's caps |
| `node_ref` | A sub-assistant reference is not a published version of this workspace |
| `cycle` | Assistants call each other in a loop |
| `eval_gate` | The version does not meet its go-live rules (or a sub-assistant it pins does not) |
| `golden_set` | The test cases are invalid (when saving a set of test cases) |
| `allowlist` | A warning only: a broad standing permission (`allow_tainted`) |

```json
{
  "error": {
    "message": "budgets.steps 300 exceeds the tenant cap 200",
    "type": "invalid_request_error",
    "code": "validation_failed",
    "problems": [
      { "kind": "budget", "message": "budgets.steps 300 exceeds the tenant cap 200", "path": "budgets.steps" }
    ]
  }
}
```

The message text above is illustrative; the `kind` and `path` values are the contract.

## When an assistant answers instead of failing

A request to automatic routing that cannot run its assistant does not fail: a model answers, and `x-caliban-route-fallback` says why. See [How routing works](../concepts/how-routing-works.md#sending-a-topic-to-an-assistant).

A conversation that hits one of its limits does not fail either: it ends with status `budget_exhausted`, the last completed output (`partial: true`) and a `stop_reason`.

## Related

- [Limits](limits.md).
- [HTTP API](api.md).
