---
title: Usage and costs
description: See every request and what it cost, cap what assistants may spend, and read how long each stage of a request took.
---

Caliban meters every request: which model answered, how many [tokens](../reference/glossary.md#tokens) it used, whether a cache answered, how much personal data it hid, and what it cost. Nothing about the content of the request is stored.

## Usage

Open **Usage** in the console. It has:
- **cards** for what was billed, the flat price, cache-hit savings, the routed model cost and the margin;
- **cost per assistant** (per version), for model calls made by assistant conversations;
- **retrieval spend**: embedding and rerank calls Caliban made for your [knowledge](knowledge.md) libraries;
- **routing per day**: requests per day, [topic](../reference/glossary.md#topic), the stage that decided it and why a model answered instead of an assistant;
- **the request list**, filtered by workspace, cache result, assistant or conversation id.

![The Usage page after a developer's first request: billing cards, cost per assistant, retrieval spend, and one request in Routing per day](../../../assets/shots/usage-first-request.webp)
*The Usage page after the developer demo's first call: one request to a fixed model (`pinned`), decided by a rule. The catalogue model had no price, so every card shows $0.00.*

Each request in the list shows the time, the requested and routed model, the workspace, the assistant and conversation (if any), prompt, completion, cached and saved tokens, the cache result (`hit`, `miss`, `bypass`) and tier, the personal data count, the cost, what was billed, and the latency.

**Routing is kept as daily counts only.** Which topic each request went to can reveal sensitive subjects, so Caliban does not store it per request. The request itself carries its routing decision back to the app in the `x-caliban-intent` header (see [response headers](../reference/response-headers.md)), and the usage store keeps only counts per day.

**What the amounts mean:**

| Amount | API field | Meaning |
|---|---|---|
| Cost | `cost_usd` | What the model call cost, at the catalogue prices (prompt-cache prices included). `0` on a cache hit |
| Routed model cost | `routed_model_cost_usd` | For `caliban/auto`: the real cost of the model it picked |
| Flat price | `flat_price_usd` | For `caliban/auto`: the flat price for the same tokens |
| Billed | `billed_usd` | What the workspace is charged: the flat price, or a share of it on a cache hit |
| Saved | `saved_usd`, `auto_saved_usd` | What cache hits saved |
| Margin | `margin_usd` | Billed minus routed model cost (for operators who resell) |
| Charged | `charged_usd` | Per assistant: the billed `caliban/auto` price, or the model's cost otherwise |

`caliban/auto` is billed at a flat price per million tokens, set by your IT administrator (`[routing] auto_price_in_per_mtok` and `auto_price_out_per_mtok`). When a cache answers, no model is called and the workspace is billed a share of the flat price: 20% by default (`auto_cache_hit_fraction`), changeable per workspace in its **Privacy and caching** settings (**Cache-hit price for caliban/auto (%)**). A request to a [fixed model](../reference/glossary.md#fixed-model) is billed at that model's price, and a cache hit costs nothing.

Caliban ships no model prices. Enter your provider's prices on each catalogue model, cache prices included, or costs show `$0.00`. See [models](models.md).

With the API:

```sh
curl "http://caliban.internal:8081/api/v1/usage?tenant_id=acme-dev&from=2026-10-01T00:00:00Z&to=2026-11-01T00:00:00Z" \
  -H "authorization: Bearer $CALIBAN_ADMIN_TOKEN"
```

It returns the recent events, `totals` over the whole range, `by_node` (totals per assistant version) and `by_route` (the daily routing counts). Filters: `tenant_id`, `node`, `run_id`, `from`, `to`, `limit`. Every role may read usage for the workspaces it sees.

Raw events are kept 90 days (`CALIBAN_USAGE_RETENTION_DAYS`), then rolled up into one row per workspace, day and assistant version. Totals do not change when that happens, but older days keep no conversation ids.

:::note
Usage totals need the Postgres store. A test install without a database (in-memory store) keeps only the last 10,000 requests, and loses them on restart.
:::

## Spend caps

There are three kinds of limit on spend.

**Per conversation.** Each assistant version can declare a USD limit per conversation (`budgets.usd` in its spec), and an app can lower it per request. A conversation that reaches it stops cleanly with its partial result (`budget_exhausted`).

**Per workspace, for assistants.** Set a daily and a monthly cap on what all assistants of a workspace may spend. In the console: the workspace's **Node limits** section, fields **Daily spend cap (USD)** and **Monthly spend cap (USD)**. The same section has **USD per run**: when set, every assistant version must declare a per-conversation limit within it. With the API:

```sh
curl -X PATCH http://caliban.internal:8081/api/v1/tenants/acme-dev \
  -H "authorization: Bearer $CALIBAN_ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"node_spend_caps": {"daily_usd": 50, "monthly_usd": 1000}}'
```

Days and months are UTC. Before every model call, Caliban compares the workspace's spend today and this month with the caps, across all workers. When a cap is reached, conversations stop with `budget_exhausted` and the reason "the tenant's daily node spend cap is reached". Calls already in flight finish, so the overshoot is at most one call per running conversation. `null` removes the caps.

To see spend against the caps: `GET /api/v1/tenants/{t}/node-spend` returns `today_usd`, `month_usd`, `caps`, `remaining` and `capped`.

:::caution[Coming soon]
The console does not show current spend against the caps yet (a spend bar on Home, the workspace and each assistant is planned), and does not alert at 80%. Today, read `node-spend` from the API.
:::

**Per workspace and per key, for all traffic.** Requests per minute, tokens per minute and per day, and USD per day are set by your IT administrator in the configuration file (`[limits]` and `[limits.tenants.<id>]`), not in the console. Over a limit, requests get `429` with `retry-after`. See [limits](../reference/limits.md) and [configuration](../reference/configuration.md).

:::caution[Coming soon]
Setting request and token limits on a workspace or a key from the console is planned. Today they need the configuration file and a restart.
:::

## Timings

Every response carries a standard `Server-Timing` header with how long each stage took, in milliseconds. Browser developer tools, `curl -i` and APM agents show it without any Caliban client. A real request from the developer demo, classified by [automatic routing](../reference/glossary.md#automatic-routing):

```text
Server-Timing: auth;dur=0.010, route;dur=5.342;desc="knn", embed;dur=5.266, pii;dur=0.022, upstream;dur=6373.522, upstream_total;dur=6373.592, total;dur=6379.061
```

| Stage | What it measures |
|---|---|
| `auth` | Checking the key and the rate limits |
| `route` | Choosing the topic and the model; `desc` says which stage decided (`pinned`, `rules`, `knn`, `keyword`) |
| `embed` | Turning the message into a vector for topic matching (part of `route`) |
| `pii` | Finding and hiding personal data |
| `cache` | Looking up the caches; `desc` is `hit` or `miss` |
| `upstream` | The model, until its first byte |
| `upstream_total` | The model, the whole call (not on streams) |
| `node` | An assistant's conversation; `desc` is its id |
| `total` | From the request to the response headers |

What the 2026-10-13 demo measured on real traffic:
- choosing a topic took about 5 ms (5.4 ms median, 5.9 ms p95), almost all of it the embedding;
- hiding personal data took under 0.5 ms (0.4 ms for a message with a card, an IBAN, a phone number and an e-mail address);
- a cache hit answered in 1 to 2 ms end to end (1.2 ms and 2.2 ms), against 1.3 to 16 s for the model.

So almost all the time of a request is the model. Caliban's own stages add a few milliseconds.

Each usage event stores the same durations as `timings` (`auth_ms`, `route_ms`, `embed_ms`, `pii_ms`, `cache_ms`, `upstream_ms`, `upstream_total_ms`, `total_ms`), returned by `GET /api/v1/usage`. For an assistant's conversation, each step's duration is on its [timeline](conversations-and-runs.md#timeline).

Your IT administrator can remove the header with `[telemetry] server_timing = false`; the durations are still stored.
