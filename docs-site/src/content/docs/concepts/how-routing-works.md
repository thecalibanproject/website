---
title: How routing works
description: How Caliban decides which model or assistant answers a request sent to automatic routing.
---

When an app sends a request with the model name `caliban/auto` ([automatic routing](../reference/glossary.md#automatic-routing)), Caliban decides who answers it: a model from your catalogue, or one of your assistants. When the app names a model instead (a [fixed model](../reference/glossary.md#fixed-model)), Caliban uses that model, within your workspace's rules, and skips the rest of this page.

The decision takes a few milliseconds and happens before anything reaches a model. On the 2026-10-13 test bed, classification took 5.2 to 5.9 ms per request (p50 5.4 ms), almost all of it one embedding call on a local GPU.

## The three stages

Routing runs in a fixed order. Each stage either decides or hands over to the next.

1. **Rules.** A request that names a model stops here. Caliban checks that the model is in your workspace's catalogue and allowed by its [trust tier](../reference/glossary.md#trust-tier) rules, and sends the request there. The response header says `x-caliban-intent: pinned;confidence=1.000;stage=rules`.
2. **Examples (the main stage).** Caliban embeds the last user message (its first 2,000 characters) and compares it with the [example sentences](../reference/glossary.md#example-sentences) of every [topic](../reference/glossary.md#topic) it knows. The nearest examples vote. If the vote is clear, the topic is decided. If it is not (the message looks like nothing it knows, or two topics are too close), the stage abstains. The whole stage has a budget of 25 ms by default; over budget, it abstains too.
3. **Keywords.** When the example stage abstains, times out, or is not set up, fixed keyword rules pick a topic. This is the fallback, and it is why `caliban/auto` still works without an embedding model.

The response tells you what happened, for example:

```
x-caliban-intent: billing;confidence=0.999;stage=knn
```

`stage` is `rules`, `knn` (examples) or `keyword`. When the example stage was on but did not decide, a `knn=` reason follows (`abstain_confidence`, `abstain_margin`, `abstain_oos`, `timeout`, and others). See [Response headers](../reference/response-headers.md).

## Where topics come from

Caliban ships with seven built-in topics, each with 30 example prompts: `chat`, `code`, `analytics`, `summarize`, `extraction`, `translate` and `reasoning`. You add your own topics per workspace, with your own example sentences, in any language. In the developer demo, five topics (billing, bug report, how-to, account security, sales) with examples in English, French and Arabic classified 13 of 15 test prompts correctly. Two sales prompts about adding seats went to billing. Adding sales examples about seats, at runtime, brought it to 15 of 15, with no restart.

Changes reach the gateways without a restart. Each gateway rebuilds its index in the background and keeps the old one until the new one is ready. See [Topics](../guides/topics.md).

## Choosing the model

Once the topic is known, Caliban picks a model:

- **Candidates** are the models your workspace lists for that topic, or its default list ([which model answers](../reference/glossary.md#which-model-answers)). A workspace with no lists can use every chat model it can reach.
- Caliban keeps only models that are reachable, have a credential (or need none), fit the trust tier rules, and fit the request (tools, images, context length).
- **With a quality floor** for the topic (a score from 0 to 1, set by the operator), Caliban takes the **cheapest** model whose quality for that topic is at or above the floor. If none qualifies, it falls back to the default list, in order.
- **Without a floor**, it keeps your order: the first model in the list answers, the next ones are fallbacks.

So the operator decides what is good enough per topic, and Caliban spends as little as it can to meet it.

## Sending a topic to an assistant

A workspace can send a topic to one of its [assistants](../reference/glossary.md#assistant) instead of a model. A request classified as `triage` then runs the triage assistant, and the app gets the assistant's answer through the same chat API. The health demo did this for its triage topic.

If the assistant cannot take the request, a model answers and the response says why in `x-caliban-route-fallback`: the example stage did not decide (`low_confidence`), no assistant is mapped (`no_node_for_intent`), the key may not run it, it has no live version, the workspace's assistant spending cap is reached, or the conversation does not fit the assistant's input. A request classified once is never classified again: a running assistant's own model calls never hand off to another assistant.

## Escalation budgets

Some models are expensive. An operator can mark them as the expensive tier and give each [API key](../reference/glossary.md#api-key) a budget of escalations per minute. When a key runs out, its requests are neither refused nor queued: they take the cheaper models of the route, and the answer says `x-caliban-escalation: denied`. This caps how much one key can drain a shared strong model, whatever the classifier decides. Requests that name a model are never escalations.

## What routing does not record

Which topic a person's requests go to, and how often, can reveal sensitive subjects even when no content is logged. So Caliban does not store the topic of individual requests. Usage keeps daily counts only: requests per workspace, day, topic, stage and fallback reason. The app that sent a request still sees its own decision in the response headers.

## What is not built yet

- A trained classifier stage between examples and keywords, and a model-based fallback, are planned. Today, an abstention goes straight to the keywords.
- Model health is not tracked by the gateway yet: every model counts as healthy.
- The built-in example settings are not calibrated for every embedding model. Calibrate on your traffic before you rely on fine distinctions.

## Related

- [Topics](../guides/topics.md): add a topic, add examples, send it to an assistant, fix a misroute.
- [Configuration](../reference/configuration.md): the `[routing]` section.
- [Caching](caching.md): cache hits skip the model entirely.
