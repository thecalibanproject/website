---
title: Configuration
description: The caliban.toml sections and keys, the environment variables, and the caliban commands.
---

Caliban reads one TOML file, `caliban.toml`, from `$CALIBAN_CONFIG` (default `/etc/caliban/caliban.toml`). The core repository ships an annotated example, `config/caliban.example.toml`, and a complete on-premises example with open models, `config/open-models.example.toml`.

:::note[File or database]
With a Postgres database (`CALIBAN_DATABASE_URL`), the file seeds the database **once**, on the first start. From then on, workspaces, keys, provider accounts, model servers, models, routes, data connections, assistants and the data dictionary live in the database and are changed through the console or the admin API; `[[tenants]]`, `[[models]]` and `[[providers]]` in the file are ignored. Every other section always comes from the file. Without a database, the file seeds memory at every start and API changes are lost on restart.
:::

## Secrets

Never write a secret inline. Use one of:

| Form | Meaning |
|---|---|
| `{ env = "VAR" }` | Read from an environment variable |
| `{ file = "/path" }` | Read from a file |
| `{ sealed = "..." }` | Encrypted under the key-encryption key (`CALIBAN_KEK`) |

Keys added through the admin API are encrypted by the control plane under a per-workspace key.

## Sections

### `[server]`

| Key | Default | Meaning |
|---|---|---|
| `router_addr` | `0.0.0.0:8080` | Gateway address (data plane) |
| `control_plane_addr` | `0.0.0.0:8081` | Admin service and console (control plane) |
| `web_dir` | unset | Built console files, served at `/` (`CALIBAN_WEB_DIR` wins) |

### `[security]`

| Key | Default | Meaning |
|---|---|---|
| `egress` | `deny_by_default` | The gateway only calls declared `base_url`s |
| `admin_token` | `{ env = "CALIBAN_ADMIN_TOKEN" }` | Bootstrap admin token; with single sign-on it becomes the emergency credential |
| `break_glass` | `true` | `false` refuses the admin token (needs single sign-on) |

### `[security.oidc]` and `[[security.oidc.role_mappings]]`

Single sign-on against your OpenID Connect provider. Keys: `issuer`, `client_id`, `client_secret`, `redirect_url`, `scopes` (default `openid profile email`), `groups_claim` (default `groups`), `api_audience`, `session_ttl_secs` (28,800), `session_idle_secs` (3,600), `clock_skew_secs` (60), `jwks_cache_secs` (3,600), `ca_file`, `post_logout_redirect_url`. Each role mapping has `group`, `role` and, for workspace roles, `tenant`. See [People and roles](../guides/people-and-roles.md#single-sign-on).

### `[telemetry]`

| Key | Default | Meaning |
|---|---|---|
| `server_timing` | `true` | Send the `Server-Timing` response header with per-stage durations |

### `[cache]`

| Key | Default | Meaning |
|---|---|---|
| `exact_enabled` | `true` | Reuse identical answers |
| `exact_max_entries` | 100,000 | Entries kept |
| `exact_ttl_secs` | 3,600 | Entry lifetime |

### `[cache.semantic]`

Reuse similar answers. Off unless `enabled = true` here **and** the workspace sets `semantic_cache = "on"`. See [Caching](../concepts/caching.md).

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `false` | Turn the semantic cache on for the deployment |
| `store` | `qdrant` | `qdrant` (REST, port 6333) or `memory` (one process) |
| `qdrant_url`, `qdrant_api_key` | unset | Qdrant endpoint and key (`CALIBAN_QDRANT_URL`, `CALIBAN_QDRANT_API_KEY` win) |
| `collection_prefix` | `caliban_semcache` | Qdrant collection prefix |
| `embedding_model` | unset | Catalogue embedding model; the same as `[routing] embedding_model` lets one embedding serve both |
| `threshold` | 0.91 (0.95 without the default instruction) | Starting similarity bar per entry |
| `min_threshold` | 0.91 (0.93 without the default instruction) | Learned bars never go below |
| `grey_band` | 0.03 | Just below the bar: answer fresh, compare, learn |
| `max_error_rate` | 0.02 | Error budget per workspace before its bars tighten |
| `verify_rate` | 0.05 | Share of would-be hits answered fresh to measure errors |
| `verify_answer_similarity` | 0.90 | Answers this close count as the same |
| `max_temperature` | 0.3 | Hotter requests are not cached unless they opt in |
| `ttl_secs` | 86,400 | Entry lifetime |
| `lookup_budget_ms` | 50 | Embed plus search; slower is a miss |
| `embed_timeout_ms` | 2,000 | Embedding call timeout |
| `query_prefix` | Qwen3-Embedding instruction for that model family, none for others | Instruction prepended before embedding; `""` turns it off |

### `[rag]`

Document libraries for the `builtin://rag_search` action.

| Key | Default | Meaning |
|---|---|---|
| `index` | `qdrant` | `qdrant` or `memory` (one process, lost on restart) |
| `qdrant_url` | `CALIBAN_QDRANT_URL`, then the semantic cache's | Qdrant endpoint |
| `qdrant_api_key` | unset | Qdrant key |
| `collection_prefix` | `caliban_rag` | Qdrant collection prefix |
| `index_concurrency` | 2 | Documents one process indexes at once |

### `[pii]`

| Key | Default | Meaning |
|---|---|---|
| `default_mode` | `reversible` in the example | Mode for workspaces that do not set one: `off`, `mask` or `reversible` |

### `[limits]` and `[limits.tenants.<id>]`

Rate limits and token budgets. All optional; unset is unlimited. See [Limits](limits.md#request-rate-and-token-budgets).

| Key | Meaning |
|---|---|
| `store` | `memory` (default) or `valkey` (shared; needs `CALIBAN_VALKEY_URL`) |
| `valkey_key_prefix` | Key namespace (default `caliban`) |
| `valkey_timeout_ms` | Longest wait per quota call (default 30) |
| `requests_per_minute` | Per workspace |
| `key_requests_per_minute` | Per API key |
| `tokens_per_minute`, `tokens_per_day` | Per workspace |
| `usd_per_day` | Per workspace (needs model prices) |

### `[routing]` and its tables

Automatic routing (`caliban/auto`). Without `[routing]`, topics come from keyword rules and each workspace's model order is kept. See [How routing works](../concepts/how-routing-works.md).

| Key | Meaning |
|---|---|
| `embedding_model` | Catalogue embedding model, on a shared model server |
| `embedder_artifact` | The ml embedder artifact it corresponds to (gates the calibration) |
| `query_prefix` | Text prepended to prompts and examples before embedding |
| `budget_ms` | Embed plus nearest-example search budget (default 25) |
| `calibration_dir`, `profile_dir` | ml artifacts: classifier calibration and per-model quality profile |
| `exemplar_cache_dir` | Where example vectors are cached |
| `k`, `temperature`, `abstain_threshold`, `margin_threshold`, `oos_threshold` | Override the calibration |
| `auto_price_in_per_mtok`, `auto_price_out_per_mtok` | Flat price of `caliban/auto`, per million tokens |
| `auto_cache_hit_fraction` | Share of the flat price billed for a cache hit (default 0.2) |

| Table | Meaning |
|---|---|
| `[routing.floors]` | Quality floor per topic (0 to 1); `"*"` covers the rest |
| `[routing.quality."<model>"]` | Quality of a model per topic (overrides the profile) |
| `[routing.tenants.<id>]` | Per-workspace `floors`, prices, `knn = false`, and `exemplars` (topic to example sentences) |
| `[routing.tenants.<id>.routes]` | Topic to assistant (`triage = "node/triage"`) |
| `[routing.escalation]` | `expensive_models`, `min_price_out_per_mtok`, `per_key_per_minute` |

### `[[providers]]`

Deployment-wide model servers that workspaces share (on-premises vLLM, SGLang, TEI, llama.cpp, Ollama). Same fields as a workspace provider below.

### `[[models]]`

The model catalogue.

| Key | Meaning |
|---|---|
| `id` | Catalogue id apps use, such as `local/qwen3-8b` |
| `provider` | Provider id (a shared `[[providers]]` entry or a workspace's own) |
| `upstream_model` | The name the model server knows |
| `trust_tier` | `t0_sovereign`, `t1_attested`, `t2_contracted` or `t3_public` |
| `licence`, `context_window` | Model facts |
| `price_in_per_mtok`, `price_out_per_mtok` | USD per million tokens. No list prices ship with Caliban |
| `price_cache_read_per_mtok`, `price_cache_write_per_mtok`, `price_cache_write_1h_per_mtok` | Prompt-cache prices (OpenAI, Anthropic); unset means the input price |
| `capabilities.rejects_stream_options` | The server rejects `stream_options`; its streams are metered from an estimate |

### `[[tenants]]`

A workspace, with its own providers and routes.

| Key | Meaning |
|---|---|
| `id`, `name` | Workspace id and display name |
| `pii_mode` | `off`, `mask` or `reversible` |
| `pii_surrogate_scope` | `tenant` (default) or `session` |
| `semantic_cache` | `off` (default) or `on` |
| `auto_cache_hit_fraction` | Overrides the deployment's share |
| `api_key_hashes` | SHA-256 hex of each API key (`caliban keygen`) |
| `[[tenants.providers]]` | `id`, `kind` (`openai_compatible`, `openai`, `anthropic`), `base_url`, `trust_tier`, `api_key` (your own provider account) |
| `[[tenants.routes]]` | `intent` (topic, or `default`) and `models` (ordered: first preferred, the rest fallbacks) |

## Environment variables

| Variable | Used by | Meaning |
|---|---|---|
| `CALIBAN_CONFIG` | all | Config file path |
| `CALIBAN_ADMIN_TOKEN` | admin service | Bootstrap admin token |
| `CALIBAN_BREAK_GLASS` | admin service | `false` refuses the admin token (needs single sign-on) |
| `CALIBAN_OIDC_ISSUER`, `_CLIENT_ID`, `_CLIENT_SECRET`, `_REDIRECT_URL`, `_SCOPES`, `_GROUPS_CLAIM`, `_API_AUDIENCE`, `_CA_FILE` | admin service | Single sign-on without, or overriding, `[security.oidc]` |
| `CALIBAN_OIDC_OWNER_GROUPS`, `_ADMIN_GROUPS`, `_AUDITOR_GROUPS` | admin service | Identity provider groups given the deployment roles |
| `CALIBAN_KEK` | all | Key-encryption key (base64, 32 bytes, `caliban gen-kek`) |
| `CALIBAN_KEK_PREVIOUS` | all | Retired keys, during a rotation |
| `CALIBAN_DATABASE_URL` | admin service, standalone, workers | Postgres; unset means in memory |
| `CALIBAN_VALKEY_URL`, `CALIBAN_VALKEY_PASSWORD` | gateway | Shared quotas and idempotency records |
| `CALIBAN_WEB_DIR` | admin service | Built console |
| `CALIBAN_QDRANT_URL`, `CALIBAN_QDRANT_API_KEY` | gateway | Qdrant for the semantic cache and document libraries |
| `CALIBAN_USAGE_WAL`, `_WAL_FSYNC`, `_WAL_QUEUE` | gateway | Local usage log (JSONL) |
| `CALIBAN_USAGE_SHIP`, `CALIBAN_USAGE_SHIP_*`, `CALIBAN_USAGE_SPOOL_*` | gateway | Usage delivery to the admin service |
| `CALIBAN_USAGE_RETENTION_DAYS` | admin service | Raw usage retention (default 90) |
| `CALIBAN_PII_NER_DIR` | gateway | Name detection model (needs a `ner` build) |
| `CALIBAN_PII_NER_SESSIONS`, `_THREADS`, `_QUEUE`, `_QUEUE_WAIT_MS`, `_OVERFLOW` | gateway | Name detection pool; `_OVERFLOW` is `reject` (default) or `degrade` |
| `CALIBAN_TCP_NODELAY` | all | On by default |
| `CALIBAN_TOOL_TOKEN_KEY`, `_ISSUER`, `_PREVIOUS_KEYS` | workers, standalone, admin service | Signs the tokens minted per connected-system call |
| `CALIBAN_MCP_ALLOW_LOOPBACK` | workers, standalone, admin service | `true` allows connected systems on loopback (development only) |
| `CALIBAN_MCP_TASKS`, `CALIBAN_MCP_ALLOWED_HOSTS` | gateway, standalone | The MCP server at `/mcp` |
| `CALIBAN_WORKER_URLS`, `CALIBAN_WORKER_TOKEN` | gateways, workers | Split mode: where assistant runs execute |
| `CALIBAN_WORKER_ADDR`, `CALIBAN_WORKER_ID` | workers | Listen address (default `0.0.0.0:8082`) and name |
| `CALIBAN_NODE_SYNC_WAIT_SECS`, `_LEASE_SECS`, `_POLL_MS`, `_MAX_RUNS`, `_RUN_RETENTION_DAYS`, `_BREAKER_FAILURES`, `_BREAKER_COOLDOWN_SECS` | workers, standalone | Assistant runs (see [Limits](limits.md#conversations-runs)) |
| `CALIBAN_SNAPSHOT_SIGNING_KEY` | admin service | Split mode: signs config snapshots |
| `CALIBAN_ROUTER_TOKEN` | admin service, gateways | Split mode: snapshot and usage delivery credential |
| `CALIBAN_SNAPSHOT_PUBLIC_KEY`, `CALIBAN_CONTROL_PLANE_URL`, `CALIBAN_SNAPSHOT_POLL_SECS`, `CALIBAN_SNAPSHOT_CACHE`, `CALIBAN_ROUTER_ADDR`, `CALIBAN_ROUTER_ID` | gateways | Split mode |
| `CALIBAN_LOG` | all | Log filter (default `info,tower_http=info`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | all | Turns on trace export (off when unset); no prompt or answer content is recorded |

## Commands

| Command | What it does |
|---|---|
| `caliban standalone` | Gateway and admin service in one process (the on-premises default) |
| `caliban router` | Gateway only |
| `caliban router --control-plane-url http://cp:8081` | Gateway in split mode: config from signed snapshots, no file |
| `caliban control-plane` | Admin service and console only |
| `caliban worker --control-plane-url http://cp:8081` | Runs assistant conversations in split mode |
| `caliban check-config` | Validate `$CALIBAN_CONFIG` and exit |
| `caliban keygen` | A new `cal_...` API key and its hash |
| `caliban gen-kek` | A new key-encryption key |
| `caliban keys status` | Which key-encryption key wraps each workspace key (Postgres) |
| `caliban keys rotate` | Re-wrap every workspace key under the current `CALIBAN_KEK` |
| `caliban gen-signing-key` | Snapshot signing key pair (split mode) |
| `caliban gen-tool-token-key` | Key pair for connected-system call tokens |
| `caliban healthcheck` | Exit 0 on a healthy `/healthz` (container health checks) |

Global flags: `--config`, `--usage-wal`, `--usage-wal-fsync` (`off` or `batch`), `--usage-wal-queue`.

## Related

- [Install and check](../start/install.md).
- [Limits](limits.md).
