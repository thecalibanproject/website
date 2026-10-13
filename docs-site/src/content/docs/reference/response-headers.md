---
title: Response headers
description: The headers Caliban adds to every answer, the Server-Timing stages, the caliban request options and Idempotency-Key.
---

Caliban answers in the OpenAI or Anthropic format your client expects. What it did on the way is in the response headers, so stock clients keep working. Browsers can read every header listed here (they are exposed through CORS).

## Headers on every answer

These come on chat completions (`/v1/chat/completions`) and Anthropic messages (`/v1/messages`).

| Header | Value |
|---|---|
| `x-caliban-request-id` | The request id, such as `req_01a1330fcb2f701f985b62e29f90c844`. Quote it when you report a problem. `/v1/messages` also sends it as `request-id`, which Anthropic SDKs show as `_request_id` |
| `x-caliban-routed-model` | The catalogue id of the model that answered, or `node/<name>@v<N>` when an [assistant](glossary.md#assistant) answered |
| `x-caliban-intent` | How the [topic](glossary.md#topic) was chosen: `<topic>;confidence=<0..1>;stage=<rules\|knn\|keyword>`. A request that names a model reports `pinned;confidence=1.000;stage=rules`. When matching by examples was on but did not decide, `;knn=<reason>` is added: `timeout`, `embed_error`, `unavailable`, `no_text`, `abstain_oos`, `abstain_confidence`, `abstain_margin`, `abstain_empty` |
| `x-caliban-cache` | `hit` (a cached answer, no model called), `miss` (a cache applied but had no answer) or `bypass` (no cache applies to this request) |
| `x-caliban-cache-tier` | On hits only: `exact` (an identical request) or `semantic` (a similar one) |
| `x-caliban-pii-entities` | How many items of [personal data](glossary.md#personal-data) were protected |
| `x-caliban-cost-usd` | Non-streaming answers, when the model has prices: the cost in USD. `0.00000000` on a cache hit |
| `x-caliban-billed-usd` | Non-streaming answers: what the request is billed. For `caliban/auto`, the flat `caliban/auto` price (a share of it on a cache hit); for an assistant, the cost of its run |
| `x-caliban-route` | `caliban/auto` in a workspace that sends topics to assistants: the path taken, `node/<name>@v<N>` or `model:<id>` |
| `x-caliban-route-fallback` | When `caliban/auto` answered with a model rather than an assistant, why (see below) |
| `x-caliban-escalation` | `caliban/auto` choosing a model in the expensive tier: `admitted`, or `denied` when the key's budget for expensive models was used up and a cheaper model answered |
| `caliban-run-id` | Assistant answers: the run (conversation), to follow it or answer its question with the run API |
| `x-caliban-run-status` | Assistant answers: the run's status, such as `succeeded` or `input_required` |
| `Server-Timing` | The time of each stage, in milliseconds (see below) |

A recorded answer of the health triage scenario, where `caliban/auto` sent a patient's message to the `triage` assistant:

```http
x-caliban-intent: triage;confidence=0.999;stage=knn
x-caliban-route: node/triage@v1
x-caliban-routed-model: node/triage@v1
caliban-run-id: run_01a1330fcb2c70af8f1029b53773d245
x-caliban-run-status: succeeded
x-caliban-pii-entities: 6
x-caliban-cost-usd: 0.00078980
x-caliban-billed-usd: 0.01184700
x-caliban-cache: bypass
x-caliban-request-id: req_01a1330fcb2f701f985b62e29f90c844
```

And a message of the same workspace that was not triage, so a model answered:

```http
x-caliban-intent: code;confidence=0.945;stage=knn
x-caliban-route: model:e2e/chat
x-caliban-route-fallback: no_node_for_intent
x-caliban-routed-model: e2e/chat
x-caliban-cache: miss
```

Assistant answers always report `x-caliban-cache: bypass`. On non-streaming answers, `x-caliban-pii-entities` and `x-caliban-cost-usd` cover every model call of the run. `/v1/embeddings` and `/v1/rerank` send `x-caliban-request-id`, `x-caliban-routed-model`, `x-caliban-pii-entities` and `Server-Timing`.

### Why a model answered instead of an assistant

| `x-caliban-route-fallback` | Meaning |
|---|---|
| `low_confidence` | Matching by examples did not decide the topic, so the keyword rules did |
| `no_node_for_intent` | The topic is not sent to any assistant |
| `node_not_allowed` | The API key may not run that assistant |
| `node_unavailable` | The assistant has no live version, or no worker answers |
| `nodes_not_enabled` | This gateway runs no assistants |
| `node_over_budget` | The workspace's assistant spending caps leave no room for a run |
| `node_input_invalid` | The conversation does not fit the assistant's input |

## Server-Timing

The standard `Server-Timing` header gives each stage's duration, so browser developer tools, `curl -i` and monitoring agents show it without any Caliban client. Stages that did not run are left out.

```http
Server-Timing: auth;dur=0.010, route;dur=5.342;desc="knn", embed;dur=5.266, pii;dur=0.022, upstream;dur=6373.522, upstream_total;dur=6373.592, total;dur=6379.061
```

| Stage | What it measures |
|---|---|
| `auth` | Checking the key and the rate limits |
| `route` | Choosing the topic and the model. `desc` is the stage that decided: `pinned` (a named model), `rules`, `knn` (matched by examples) or `keyword` |
| `embed` | Turning the message into a vector to compare with the example sentences (part of `route`) |
| `pii` | Finding and hiding personal data |
| `cache` | Looking up the exact, then the similar-answer cache. `desc` is `hit` or `miss`. A hit has no `upstream` entries |
| `upstream` | The model, up to its first byte |
| `upstream_total` | The model, the whole call (non-streaming answers) |
| `node` | An assistant run that answered. `desc` is the run id; `GET /v1/runs/{id}` has each step's duration |
| `total` | From the start of the request to the response headers |

Streams send their headers before the body, so they carry only the stages known by then: `upstream` but not `upstream_total`, and `node` with the run id but no duration.

Recorded on 2026-10-13 (one L40S GPU, Qwen3.8-27B): choosing the topic took 5.2 to 5.9 ms, hiding personal data 0.4 ms on a ticket with five identifiers, and a cache hit 1.2 to 2.2 ms end to end.

An administrator can switch the header off (`[telemetry] server_timing = false`). The durations are still recorded with each request's usage.

## Rate limits

A request over a limit gets `429` with:

| Header | Value |
|---|---|
| `retry-after` | Seconds to wait before retrying |
| `x-caliban-ratelimit-scope` | Which limit refused it: `requests_per_minute` (the workspace), `key_requests_per_minute` (the key), `tokens_per_minute`, `tokens_per_day` or `usd_per_day` |

See [Limits](limits.md) and [Errors](errors.md).

## The caliban request options

Every request body can carry a `caliban` object. OpenAI and Anthropic clients that do not know it simply leave it out. In the OpenAI Python SDK, send it with `extra_body={"caliban": {...}}`; in the TypeScript SDK, as an extra body field.

| Field | Values | Effect |
|---|---|---|
| `pii` | `off`, `mask`, `reversible` | How personal data is handled for this request, in place of the workspace's mode |
| `pii_floor` | `off`, `mask`, `reversible` | A minimum protection, applied to every model, models on your own servers included. It only strengthens: the request gets the stricter of this and its mode, in the order `off`, `reversible`, `mask`. An assistant's own privacy setting is sent this way on each of its model calls |
| `cache` | `off`, `exact`, `semantic` | `off`: no cache. `exact`: identical requests only. `semantic`: also similar requests, when the workspace has that cache on, at any temperature. Unset: exact, plus similar requests up to the temperature limit when the workspace has it on |
| `reasoning` | `off`, `low`, `medium`, `high` | Whether a reasoning model thinks first, translated for each model family. OpenAI's `reasoning_effort` is accepted too |
| `zdr` | `true`, `false` | Zero data retention: the request skips both caches, so its answer is neither served from nor stored in a cache |
| `datasources` | list of names | The data connections the request may query |
| `untrusted` | `true`, or a list of JSON pointers | With `model: "node/<name>"`: marks the caller's input, or parts of it, as [untrusted](glossary.md#untrusted) data |

The contract also lists `node`, `max_cost_usd` and `trace_id`. This release accepts them but does not act on them. To run an assistant, use `model: "node/<name>"`.

Example, from the developer scenario: a hybrid model (Qwen3) answering without thinking first.

```json
{
  "model": "dev/qwen3.8-27b",
  "messages": [{"role": "user", "content": "In two sentences: what can an AI assistant do for a SaaS support team?"}],
  "max_tokens": 200,
  "caliban": {"reasoning": "off"}
}
```

## Idempotency-Key

Send an `Idempotency-Key` header (1 to 255 visible ASCII characters) on `POST /v1/chat/completions`, `/v1/messages`, `/v1/embeddings` or `/v1/rerank`, and you can retry without being charged twice. Keys are kept per workspace and per API key.

| Situation | Response |
|---|---|
| First request with the key | Runs to completion, even if the client disconnects, so a retry can be answered from the record |
| Same key while the first is still running | `409`, `Retry-After: 1`, code `idempotency_key_in_use` |
| Same key after a success (within 24 hours) | The stored response: same status, headers and body, plus `Idempotent-Replayed: true`. Nothing runs again, no usage is recorded and no quota is used. A stream is replayed as one body |
| Same key, different method, path or body | `422`, code `idempotency_key_reused` |
| The first request failed | The key is freed; the retry runs again |
| The first response was over 4 MiB | Not kept; repeats get `409`, code `idempotency_response_not_stored` |

`POST /v1/nodes/{name}/runs` honours the header too: a repeat returns the run the first request created, with `Idempotent-Replayed: true`.
