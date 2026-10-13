---
title: Limits
description: Every numeric limit in Caliban, its default, and where it is set.
---

"Unset" means unlimited unless a default is given. Workspace-level settings are set with `PATCH /api/v1/tenants/{id}` (the console's workspace page) unless the table says otherwise.

## Request rate and token budgets

Set in the config file, `[limits]` for the deployment and `[limits.tenants.<id>]` per workspace. A request over a limit gets `429` with `retry-after` and `x-caliban-ratelimit-scope` naming the limit. Changes need a gateway restart.

| Key | Default | Applies to |
|---|---|---|
| `requests_per_minute` | unset | Requests per workspace (smooth rate, GCRA) |
| `key_requests_per_minute` | unset | Requests per API key |
| `tokens_per_minute` | unset | Tokens per workspace. Each request reserves its prompt estimate plus `max_tokens`, then settles to actual usage |
| `tokens_per_day` | unset | Tokens per workspace per UTC day |
| `usd_per_day` | unset | Spend per workspace per UTC day (needs model prices) |
| `store` | `memory` | `memory` (each gateway counts alone) or `valkey` (shared by all gateways) |
| `valkey_timeout_ms` | 30 (1 to 1,000) | Longest wait for the shared store before limiting locally |

:::caution[Coming soon]
Setting rate limits and token budgets per key or per workspace from the console. Today they live in the config file and need a restart (the fintech demo did exactly this).
:::

## Escalations

| Key | Default | Where |
|---|---|---|
| `per_key_per_minute` | unset (escalations only counted) | `[routing.escalation]`: requests per API key per minute that may use the expensive tier |

## Assistant limits (per version)

Set in the spec's `budgets` and `guards` ([assistant spec](assistant-spec.md)). A run request may lower `steps`, `tokens`, `usd` and `wall_clock_s` for one conversation, never raise them.

| Field | Default | Range | Counts |
|---|---|---|---|
| `budgets.steps` | required | 1 to 200 | Steps that call something (a model, an action, a person) |
| `budgets.tokens` | required | 1 or more | Prompt plus completion tokens of every model call |
| `budgets.wall_clock_s` | required | 1 or more | Working time in seconds, not counting time waiting for a person |
| `budgets.usd` | unset | above 0 | Model spend per conversation, priced as metered |
| `budgets.depth` | 3 | 1 to 10 | Levels of sub-assistants |
| `budgets.fanout` | 8 | 1 to 64 | Tasks in parallel in one step |
| `agent.max_turns` | `budgets.steps` | 1 or more | Model turns of an agent |
| `guards.max_repeats` | 3 | 1 or more | The same step with the same input, before the run stops |
| `guards.tool_retries` | 2 | 0 or more | Retries of an action that failed transiently |

## Workspace caps on assistants

| Setting | Default | Meaning |
|---|---|---|
| `node_caps` | steps 200, tokens 2,000,000, wall_clock_s 3,600, depth 5, fanout 32 | The most any version's `budgets` may declare. Checked at publish and when a version goes live. Can include `usd`, which every version must then declare within |
| `node_spend_caps.daily_usd`, `node_spend_caps.monthly_usd` | unset | Assistant spend per UTC day and month, across all workers. Calls already running when the cap is reached complete |

## Personal data

| Limit | Value |
|---|---|
| Custom patterns per workspace (`pii_patterns`) | 50 |
| Dictionary terms per workspace (`pii_dictionary`) | 10,000 |
| Name detection queue (`CALIBAN_PII_NER_QUEUE`) | 128 waiting requests; when full, `503` (default) or the built-in detectors only |
| Name detection queue wait (`CALIBAN_PII_NER_QUEUE_WAIT_MS`) | 0 ms |

## Routing

| Limit | Default | Where |
|---|---|---|
| Text classified | first 2,000 characters of the last user message | fixed |
| Example stage budget (`budget_ms`) | 25 ms | `[routing]`; over budget, keyword rules decide |
| Index rebuild retry after a failure | 30 s | fixed |

## Caches

| Key | Default | Where |
|---|---|---|
| `exact_max_entries` | 100,000 | `[cache]` |
| `exact_ttl_secs` | 3,600 | `[cache]` |
| `ttl_secs` | 86,400 | `[cache.semantic]` |
| `lookup_budget_ms` | 50 | `[cache.semantic]`: embed plus search; slower is a miss |
| `embed_timeout_ms` | 2,000 | `[cache.semantic]` |
| `max_temperature` | 0.3 | `[cache.semantic]`: hotter requests are not cached unless they opt in |
| `threshold`, `min_threshold` | 0.91 with the default instruction; 0.95 and 0.93 without | `[cache.semantic]` |
| `auto_cache_hit_fraction` | 0.2 (0 to 1) | `[routing]`, overridable per workspace |

## Idempotency-Key

| Limit | Value |
|---|---|
| Key length | 1 to 255 visible ASCII characters |
| Replay window | 24 hours after a `2xx` |
| Largest stored response | 4 MiB (larger: duplicates get `409 idempotency_response_not_stored`) |
| Abandoned claim expiry | 15 minutes |
| In-memory store budget | 256 MiB per gateway |

## Conversations (runs)

| Setting | Default | Where |
|---|---|---|
| Sync wait of a run request (`CALIBAN_NODE_SYNC_WAIT_SECS`) | 60 s | Then `202` with the run so far (`wait_s` per request) |
| Runs at once per worker (`CALIBAN_NODE_MAX_RUNS`) | 64 | Environment |
| Run retention (`CALIBAN_NODE_RUN_RETENTION_DAYS`) | 30 days (0 keeps them) | Environment |
| Action circuit breaker (`CALIBAN_NODE_BREAKER_FAILURES`, `..._COOLDOWN_SECS`) | 5 failures, 30 s | Environment |

## Tests (evals)

| Limit | Value |
|---|---|
| Repeats per test (`k`) | default 3 for quality tests, 1 for safety tests; at most 10 |
| Test cases per run | at most 200 |
| Tests run at once (`concurrency`) | default 4, at most 16 |
| Grader score threshold | default 0.5 |
| Safety tests, go-live rule | default 100% of attacks blocked |

## Knowledge (document libraries)

| Limit | Value |
|---|---|
| Document size | at most 5 MB of text; PDF is refused (convert to Markdown or text) |
| Formats | `text/markdown` (default), `text/html`, `text/plain` |
| Chunk size (`chunk_tokens`) | 384 estimated tokens by default (64 to 2,048) |
| Navigation tree | documents of 24 chunks or more (`nav_min_chunks`) |
| Search results (`k`) | default 8 (1 to 20) |
| Search context (`max_tokens`) | default 2,000 (100 to 8,000) |
| Default trust of new documents | untrusted |

## Data connections

| Limit | Default |
|---|---|
| Time limit per database operation (`max_time_ms`) | 15,000 ms |
| Scan job timeout | 10 minutes |

## Usage and audit

| Limit | Value |
|---|---|
| Raw usage retention (`CALIBAN_USAGE_RETENTION_DAYS`) | 90 days, then daily totals (0 keeps raw events) |
| Events per usage delivery batch | at most 5,000 |
| Usage spool per gateway (`CALIBAN_USAGE_SPOOL_MAX`) | 100,000 events |
| Usage report with the in-memory store | last 10,000 events of the process |

## Admin sessions

| Key | Default | Where |
|---|---|---|
| `session_ttl_secs` | 28,800 (8 h) | `[security.oidc]` |
| `session_idle_secs` | 3,600 (1 h) | `[security.oidc]` |

## Related

- [Configuration](configuration.md): every config key and environment variable.
- [Errors](errors.md): what a request over a limit receives.
