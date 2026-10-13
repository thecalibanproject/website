---
title: Topics
description: Teach automatic routing your topics with example sentences, send a topic to an assistant, and fix a request that went to the wrong place.
---

When an app sends `"model": "caliban/auto"`, Caliban decides what kind of request it is, its **topic** (`intent` in the API), and picks who answers: one of your assistants, or the cheapest suitable model. It decides by comparing the message with **example sentences** you give each topic. [How routing works](../concepts/how-routing-works.md) explains the mechanism.

Topics belong to a workspace. In the console they are on the workspace page, tab **Topics** (labelled **Routing intents** in consoles before the rename). You need `routes.write`.

## Add a topic

1. Open the workspace, tab **Topics**, and choose **New intent**.
2. Enter the topic name: lowercase letters, digits, dots, hyphens and underscores, for example `billing` or `legal.review`.
3. Enter the [example sentences](#examples), one per line.
4. Save. The change reaches the gateways without a restart.

The API equivalent:

```sh
curl -s -X PUT http://caliban.internal:8081/api/v1/tenants/acme-dev/intents/billing \
  -H "authorization: Bearer $ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"exemplars": ["I was charged twice this month", "where is last month'\''s invoice", "أريد استرداد قيمة الاشتراك"]}'
```

The response carries a `config_version` such as `cp-42`. A gateway uses the new examples once its `GET /healthz` reports `routing.version` at `cp-42` or later.

Without topics of its own, a workspace routes on the deployment's built-in topics (`chat`, `code`, `analytics`, `summarize`, `extraction`, `translate`, `reasoning`).

## Examples

Write example sentences the way your users phrase their requests.

- **A handful of varied phrasings is enough to start.** The developer demo started with 12 to 16 per topic.
- **Cover your languages.** Examples in English, French and Arabic let a topic match all three. The health demo's single `triage` topic had 21 examples in three languages.
- **Cover the edges.** If two topics share words ("seats" for sales and billing), add examples that show the difference.
- **Limits:** at most 100 topics per workspace and 200 examples per topic, each 1 to 2,000 characters. Duplicates are dropped.

Classification takes about 5 ms per request with an embedding model on your own GPU. A repeated prompt is classified in about 0.1 ms.

## Send to an assistant

A topic can hand its requests to one of your assistants instead of a model. The topics table shows this in **Hands to** ("A model answers" when no assistant is set).

Today this mapping is set through the admin API, on the workspace:

```sh
curl -s -X PATCH http://caliban.internal:8081/api/v1/tenants/medmarket \
  -H "authorization: Bearer $ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"node_routes": {"triage": "node/triage"}}'
```

- `node/triage` sends to the live version. `node/triage@v3` pins a version.
- `null` clears all mappings.
- The API key that sends the request must be allowed to run that assistant.

When a request matches the topic, the assistant runs and the response says so: `x-caliban-route: node/triage@v1`. When a model answers instead, `x-caliban-route-fallback` says why, for example `no_node_for_intent` or `low_confidence`. See [Response headers](../reference/response-headers.md).

:::caution[Coming soon]
A **Sends to** field on the topic form, and **Answers these topics** on the assistant page. Today, use `PATCH /api/v1/tenants/{t}` with `node_routes` as above, as all four demos did.
:::

**Which model answers otherwise.** When no assistant handles a topic, the workspace's routes decide which models may answer, in order. They are set with `PUT /api/v1/tenants/{t}/routes`, for example `{"routes": [{"intent": "default", "models": ["local/qwen3.8-27b"]}]}`. There is no console page for routes yet.

## Fix a misroute

The developer demo shows the whole loop. Fifteen test prompts went through `caliban/auto`. Thirteen landed on the right topic. Two did not:

| Prompt | Expected | Got |
|---|---|---|
| We need 40 more seats for the team before Monday, is there a volume discount? | `sales` | no topic: the match was too weak (`abstain_confidence`), so keyword rules decided |
| Nous voulons ajouter 60 sièges pour l'équipe support, quelle remise ? | `sales` | `billing`, confidence 0.678 |

The `sales` topic only had examples about demos and plans. Growing a team is a sales conversation, but the closest examples were billing ones about seats.

To fix it:

1. Read the topic of the misrouted request from the `x-caliban-intent` header of its response, for example `billing;confidence=0.678;stage=knn`. A low confidence or `stage=keyword` means no topic matched well.
2. Add examples to the right topic that look like the request. The demo added eight to `sales`, in three languages:

   ```json
   ["we need more seats for our growing team",
    "can we get a volume discount for 50 more seats",
    "nous voulons ajouter des sièges pour toute l'équipe",
    "نحتاج إلى مقاعد إضافية لفريقنا"]
   ```
3. Save, then send the requests again. In the demo all 15 routed correctly, with confidence 0.999 for both sales prompts. No restart.

:::note
In the 2026-10-13 recordings, the scripts sent one small `caliban/auto` request after each change and waited a few seconds before testing, to be sure the gateways had rebuilt their index. Check `routing.version` on `GET /healthz` to know for sure.
:::

## Test a sentence

To see which topic a sentence gets, send it and read the headers:

```sh
curl -si http://caliban.internal:8080/v1/chat/completions \
  -H "authorization: Bearer cal_..." -H 'content-type: application/json' \
  -d '{"model":"caliban/auto","max_tokens":1,"messages":[{"role":"user","content":"we want to add 40 seats before next week"}]}' \
  | grep -i '^x-caliban-'
```

`x-caliban-intent` gives the topic, the confidence and the stage that decided (`knn` for examples, `keyword` for the fallback rules, `pinned` for a fixed model). `max_tokens: 1` keeps the model's answer, and its cost, small.

:::caution[Coming soon]
A **Test a sentence** box on the topics page that shows the topic, the confidence and the assistant it would reach, without calling a model. Today, send a request as above.
:::
