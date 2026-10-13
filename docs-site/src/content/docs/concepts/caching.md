---
title: Caching
description: When Caliban answers from a cache instead of calling a model, what must match, and how cache hits are billed.
---

When a request has been answered before, Caliban can return the stored answer without calling a model. A hit costs no model tokens and takes a couple of milliseconds. On the 2026-10-13 test bed, the fintech FAQ took 1,259 ms the first time and 2.2 ms the second (end to end, measured by the client); a repeated health question took 15,872 ms, then 1.2 ms.

There are two caches, checked in order: [reuse identical answers](../reference/glossary.md#reuse-identical-answers) (the exact cache) and [reuse similar answers](../reference/glossary.md#reuse-similar-answers) (the semantic cache).

## Reuse identical answers

The exact cache answers a request that is byte-for-byte the same as an earlier one, after personal data protection. It is on by default.

A request qualifies when it is deterministic and simple:

- `temperature` is `0`;
- it has no tools;
- it is not streamed.

Personal data does not prevent a hit: with stand-ins scoped per workspace (the default), the same customer message produces the same protected text, so it can hit. With stand-ins per request, requests carrying personal data skip the cache. See [How privacy works](how-privacy-works.md).

## Reuse similar answers

The semantic cache answers a request whose last user message means the same as an earlier one, worded differently: "What is the fee for sending money abroad?" against "How much does an international transfer cost?".

Everything else must match exactly: the model, the system prompt, the earlier turns and every parameter. On top of that, fixed rules compare the two messages and turn a near match into a miss when they differ in what matters: numbers, dates and IDs ("Q3 2025" never matches "Q3 2026"), currencies and directions ("USD to EUR" never matches "EUR to USD"), target languages, names, negation, and opposites such as increase and decrease. A rule can only prevent a hit, never create one.

The similarity bar starts high (0.91 with the default embedding instruction) and is learned per entry: Caliban answers a sample of would-be hits fresh, compares the answers, and tightens the bar when the cache was wrong. Each workspace has an error budget; when a window of checks shows too many wrong answers, all of its bars tighten.

It is **off by default**. It needs both the deployment setting (`[cache.semantic] enabled`) and the workspace setting (`semantic_cache = "on"`), plus an embedding model and a vector store (Qdrant).

:::caution[Embedding speed on CPU]
The lookup must finish within 50 ms, or the request goes on as a miss. A small embedding model fits that budget on CPU (about 6 ms per prompt). A larger one such as Qwen3-Embedding-0.6B takes about 275 ms on CPU, so every lookup times out until it runs on a GPU. On CPU-only sites, choose a small model for the cache, or raise the budget knowingly.
:::

The default similarity settings were calibrated on one embedding model and one hand-written set of pairs. Calibrate on your traffic before you turn the semantic cache on for a workspace.

## Isolation

Cache entries never cross workspaces. Both caches store the protected text (stand-ins, not the real values), and a hit is restored with the reverse map of the request that hits it. Entries are keyed by workspace, so an identical prompt from two workspaces is two entries. When a workspace is deleted, every gateway removes its semantic cache entries.

Shared model servers (vLLM, SGLang) also keep a prompt prefix cache of their own. Caliban gives each workspace and model its own cache key there (`cache_salt`), so one workspace's prompts give no timing signal to another.

## How you can tell

Every response says what the cache did:

```
x-caliban-cache: hit
x-caliban-cache-tier: exact
x-caliban-cost-usd: 0.00000000
```

`x-caliban-cache` is `hit`, `miss` (a cache applied but had no answer) or `bypass` (no cache applies, for example `temperature` above 0 with only the exact cache on). `x-caliban-cache-tier` appears on hits only. A request can opt out with `"caliban": {"cache": "off"}`, or opt in to the semantic cache at any temperature with `"caliban": {"cache": "semantic"}`. See [Response headers](../reference/response-headers.md).

## How hits are billed

A hit calls no model, so its real model cost is 0, and the usage record counts the cached answer's tokens as saved.

For requests sent to automatic routing (`caliban/auto`), which are billed at a flat price, a hit is billed a share of that flat price: 20% by default (`[routing] auto_cache_hit_fraction`), which a workspace can override between 0 and 1. For a fixed model, a hit costs nothing and the usage record shows the model cost it avoided. See [Usage and costs](../guides/usage-and-costs.md).

## What a cache does not cover

- Requests with tools, tool calls or tool results. An assistant's answer as a whole is never cached (`x-caliban-cache: bypass`), though its individual model calls can hit the exact cache: in the health demo, a conversation replayed after the quality tests had its model steps answered in 1 to 2 ms.
- The semantic cache does not yet use database change counters or access rules in its keys, so grounded answers are kept out of it.
- A hit answers instantly, which is a timing signal within one workspace.

## Related

- [Configuration](../reference/configuration.md): `[cache]` and `[cache.semantic]`.
- [Limits](../reference/limits.md): cache budgets and sizes.
