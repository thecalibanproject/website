---
title: Tests and going live
description: Write test cases for an assistant, run its quality and safety tests, set the bar it must meet, and make a version live.
---

An assistant version goes live only after its tests pass. You write [test cases](../reference/glossary.md#test-case), run them a few times each, and compare the results with the [go-live rules](../reference/glossary.md#go-live-rules) you set for the assistant. Caliban refuses to make a version live while it misses them.

In the console, open **Assistants**, pick an assistant, then the **Evals** tab (consoles before the rename label these **Nodes** and **Evals**).

![The Evals tab of the support-desk assistant: the go-live check, the go-live rules and three test cases](../../../assets/shots/assistant-tests-gate.webp)
*The `support-desk` assistant of the fintech demo: its latest tests meet the rules (60% passed every time, 3 repeats, every attack blocked), so version 1 is live.*

## Test cases

A test case is one example request and what a good answer looks like. Test cases belong to one version of the assistant, because the input they send must match that version's input format. Together they are the version's test set (`golden set` in the API).

Each case has:
- **an id**, such as `duplicate-citymetro`;
- **an input**: what the case sends, in the assistant's input format;
- **checks**: what the answer must satisfy;
- **pre-filled replies** (optional): what the test answers when the assistant asks a person something;
- **scripted results** (optional, `tool_results`): what an action answers during the test, by action name or reference. See [write tools in tests](#write-tools-in-tests);
- **tags** (optional).

The checks, by plain name (API name in brackets):

| Check | Passes when |
|---|---|
| Must equal (`exact`, or the `expected` shorthand) | The answer equals the value. Text is trimmed and compared case-sensitively unless you say otherwise |
| Must mention (`contains`) | Every listed value appears in the answer |
| Must match pattern (`regex`) | A regular expression matches the answer (flags `IGNORECASE`, `MULTILINE`, `DOTALL`) |
| Must have these fields (`json_schema`) | The answer matches a JSON schema |
| Grader (`llm_judge`) | A model reads the answer and your description of a good answer (`rubric`), scores it from 0 to 1, and the score reaches `threshold` (default 0.5) |
| Must call an action (`tool_call`) | The assistant called the action `tool` with arguments that include `args` (optional). With `"must_not_call": true`, it passes when no such call happened |

The grader is called through Caliban like any other model call. It uses the check's `model`, else the test run's grader model, else [automatic routing](../reference/glossary.md#automatic-routing). It treats the answer as data, never as instructions. To show it a known good answer, add `reference` (any value) to the check; without it, the grader sees the case's `expected` value, if any.

**Must call an action** names the action by its name (`issue_refund`), its full reference, or its reference without the pin (`mcp://bank-ops/issue_refund`). `args` only lists the arguments you care about: objects match key by key, other values must be equal. Arguments are compared as the action received them, after [personal data protection](privacy.md): an action not trusted with personal data gets stand-ins, so match on amounts, references and ids, not on names or card numbers.

**Pre-filled replies** (`answers`) answer the assistant's questions and approvals during a test, by step id (`clarify#0`, `refund#0@approve`) or step name (`clarify`, `refund@approve`). A question without a reply cancels the run, and the case fails. A write that needs approval and has no reply is denied.

In the console, the **Golden set** card shows the cases. **Edit cases** opens the set as JSON:

```json
{"cases": [
  {"id": "chest", "input": {"case": "Chest pain since Tuesday"},
   "answers": {"clarify": "two days, nobody in danger"},
   "checks": [{"type": "json_schema", "schema": {"type": "object", "required": ["urgency"]}},
              {"type": "contains", "value": ["clinical"]},
              {"type": "llm_judge", "rubric": "Does the recommendation fit the case?", "threshold": 0.7}]},
  {"id": "refund", "input": {"case": "Refund my invoice"}, "expected": "billing"},
  {"id": "tx", "input": {"case": "Refund TX-30015"},
   "tool_results": {"issue_refund": {"status": "refunded", "refund_id": "R-1"}},
   "checks": [{"type": "tool_call", "tool": "issue_refund", "args": {"tx": "TX-30015"}},
              {"type": "tool_call", "tool": "mcp://mail/send_email", "must_not_call": true}]}
]}
```

With the API: `PUT /api/v1/tenants/{t}/nodes/{name}/versions/{v}/golden-set` with that body (permission `nodes.write`). Test cases are your workspace's content: Caliban stores them encrypted, and only roles that may read conversation content (`runs.data`) see them.

:::tip
A version keeps its own test set. When you create a new version, copy the cases of the previous one and adjust them if the input format changed.
:::

## Save a run as a test

The fastest way to grow a test set is from real conversations. When an assistant answers well, or badly, save that conversation as a test case, and every later version is checked against it.

1. Open the conversation (**Conversations**, then pick one). It must have finished.
2. Choose **Save as test**.
3. Say whether the answer was right:
   - **This answer was right** (only for a conversation that succeeded). Optionally, say what a good answer must keep.
   - **This answer was wrong**. Say what it should have done (required, at most 4000 characters): the grader checks future answers against your words. Optionally, pick what went wrong, such as "Should have asked a question first". This failure label is stored on the conversation.
4. Choose **Save test case**. The case is added to the test cases of the conversation's version and runs with its tests from now on.

What the saved case contains:
- its id is the conversation's id, so a conversation is saved once per version;
- its input is the conversation's input, and the replies people gave during it become its pre-filled replies;
- a **Must have these fields** check, when the version declares an output format;
- for a right answer: a **Grader** check (threshold 0.7) with this answer as its `reference`, and a **Must call an action** check for each action that changes something the conversation called (arguments are not checked, since they change from one try to the next);
- for a wrong answer: a **Grader** check (threshold 0.7) whose description of a good answer is what you wrote, with the failure label if you picked one. Actions are not checked, because Caliban does not know which one was the mistake. If it was an action, add a `tool_call` check with `"must_not_call": true` with **Edit cases**;
- the tags `captured`, `good` or `bad`, and `mast:<label>` when you picked a failure label.

Saving needs the permission that edits test cases (`nodes.write`). The case holds the conversation's content, so like the conversation itself only roles with `runs.data` can read it. Each save is recorded in the [audit log](audit.md) (`node.golden_set.capture`) with ids, the verdict, the label and counts, never your note or the conversation's content.

Caliban refuses to save a conversation that has not finished, one already saved in that version, a conversation from a safety test (its input carries an attack), a wrong answer without a note, and a case whose input does not fit the version.

With the API:

```sh
curl -X POST http://caliban.internal:8081/api/v1/tenants/cedar-bank/runs/$RUN_ID/golden-case \
  -H "authorization: Bearer $CALIBAN_ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"verdict": "bad", "note": "Ask which transaction before refunding.", "mast_label": "fail_to_ask_for_clarification"}'
```

| Field | Meaning |
|---|---|
| `verdict` | `good` (the answer was right) or `bad` (it was wrong). Required |
| `note` | What the right behaviour is. Required for `bad`, optional for `good` |
| `mast_label` | What went wrong, one of 14 failure labels (`bad` only). The console shows them in plain words |
| `version` | The version whose test cases receive the case. Default: the conversation's version. Name a newer version to carry a regression case forward; the input must fit that version's input format |

The answer is `201` with the case's id, its check kinds and the test set's new fingerprint (`hash`), and the case itself for roles with `runs.data`. If someone edits the test cases at the same moment, no edit is lost: Caliban retries, and answers `409` if the set keeps changing.

## Run tests

There are two kinds of tests. Run both before you make a version live.

**Quality tests** (`golden` suite) run every test case several times. The number of repeats is `k` (default 3, at most 10). Models do not answer the same way every time, so a case counts only when it [passes every time](../reference/glossary.md#passed-every-time). The results:

| Result | Meaning |
|---|---|
| Passed every time (`pass_hat_k`, pass^k) | The share of cases whose `k` runs all passed. This is the main number |
| Passed once (`pass_at_1`) | The share of single runs that passed |
| Cost per good answer (`cost_per_success_usd`) | What all runs cost, divided by the runs that passed. Failed runs are paid for too |
| Slowest typical time (`latency_ms.p95`) | 95 of 100 runs finish faster than this (time waiting for a person is not counted) |
| Errors | Runs that could not be scored (a limit, the model server, a time-out). They count as not passed |

**Safety tests** (`injection` suite) attack the assistant through the data it reads: a tool result, a document, or a field of its input carrying hidden instructions. Its tools are replaced by stand-ins, so nothing real is called. The results are the share of **attacks blocked**, the attacks that worked, how many times the model was fooled but the defences stopped it, and whether the assistant still did its job under attack. See [the safety model](../concepts/safety-model.md).

To start a test run in the console, choose **Start eval**, pick the suite, and start. You can also pick:
- **Runs as**: the workspace's test key (managed by Caliban, the default), or one of your [API keys](api-keys.md), whose limits then apply;
- **k (runs per case)** and **Concurrency** (test runs at once, default 4, at most 16);
- **Only these cases**, and a **Judge model** for the grader.

With the API:

```sh
curl -X POST http://caliban.internal:8081/api/v1/tenants/cedar-bank/nodes/support-desk/versions/1/evals \
  -H "authorization: Bearer $CALIBAN_ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"suite": "golden", "k": 3}'
```

Test runs are ordinary conversations through the gateway: personal data protection, caching, limits and costs apply as in production. Follow progress on the tab or with `GET /api/v1/tenants/{t}/evals/{id}`.

What the demo of 2026-10-13 measured, on a 27B open model on one GPU:

| Assistant | Tests | Result | Bar |
|---|---|---|---|
| health `triage` | quality, k=3, 6 cases | passed every time 1.0 (18 of 18 runs), p95 28 s | 0.8 |
| health `triage` | safety | 9 of 9 attacks blocked (the model was fooled once, the defences stopped it) | 100% |
| law `legal-assistant` | quality, k=3, 6 cases | 0.833: one case passed 0 of 3, five passed 3 of 3 | 0.8 |
| fintech `support-desk` | quality, k=3, 3 cases | 0.667: `single-charge-refund` failed 0 of 3 | 0.6 |
| fintech `support-desk` | safety | 21 of 21 blocked (fooled once, stopped) | 100% |

A run of 18 quality trials took 17.7 s per trial at the median (28.2 s p95).

## The bar

The bar (the [go-live rules](../reference/glossary.md#go-live-rules), `eval-policy` in the API) is set on the assistant, not on a version. A version never grades itself: changing the bar needs the publish permission (`nodes.publish`), and every change is recorded in the [audit log](audit.md) with the old and new values.

In the console, **Promotion bar** shows it and **Edit bar** changes it:

| Field | API | Meaning |
|---|---|---|
| Least pass^k | `golden.min_pass_k` | The share of cases that must pass every time, 0 to 1 |
| Least k | `golden.min_k` | The fewest repeats per case that count |
| Most cost per success | `golden.max_cost_per_success_usd` | Optional |
| Most p95 latency | `golden.max_p95_latency_ms` | Optional |
| Attacks blocked | `injection.min_pass_rate` | Default 1 (every attack blocked) |
| Read-only versions | `injection.read_only` | Whether a version without write tools also needs safety tests (default: it does) |

```json
{"golden": {"min_pass_k": 0.9, "min_k": 3, "max_cost_per_success_usd": 0.02, "max_p95_latency_ms": 8000},
 "injection": {"min_pass_rate": 1.0}}
```

The check uses the **latest finished** test runs of the version:
- quality tests are checked when the assistant has quality rules;
- safety tests are always required for a version that can change something (a tool with `effect: write`). You can lower that bar, not remove it;
- a version that only reads data needs safety tests too, unless the bar says `"read_only": "optional"`;
- a test run with errors proves nothing and meets no bar: run it again;
- every [sub-assistant](../reference/glossary.md#sub-assistant) the version uses must pass its own rules first. Test children before the assistant that calls them.

:::caution
Choose the bar before you see the results, and keep it. In the fintech demo the bar was 0.6, so a version that failed one case of three still went live. At 0.8 the check would have refused it.
:::

`GET /api/v1/tenants/{t}/nodes/{name}/versions/{v}/gate` says what making the version live would say now. The console shows it as the **Promotion gate** card ("Meets the bar", or what is missing).

## Go live

A version moves through four states: [draft](../reference/glossary.md#draft), [ready to test](../reference/glossary.md#ready-to-test) (`published`), [live](../reference/glossary.md#live) and [archived](../reference/glossary.md#archived) (`retired`). Only the live version answers requests that do not name a version. See [assistants and versions](../concepts/assistants-and-versions.md).

1. **Publish without going live.** A draft has no test results, so publish it first: on the Versions tab, publish the draft, or call `POST .../versions/{v}/publish` with `{"promote": false}`. Publishing checks scopes, limits and tool approvals, then freezes the version.
2. **Run the tests** above, quality and safety.
3. **Go live.** Choose **Make live** on the version, or call `POST /api/v1/tenants/{t}/nodes/{name}/promote` with `{"version": 1}`. If the version misses the bar, Caliban answers `422` with problems of kind `eval_gate` that say what is missing, and nothing changes.

To roll back, make an earlier version live again the same way. Requests already running finish on the version they started on.

:::caution[Coming soon]
A single **Go live** button that publishes, runs both test suites and makes the version live in one visible sequence, stopping with a plain reason ("2 of 6 tests failed; the bar is 80%"), is planned. Today, do the three steps above.
:::

## Write tools in tests

Quality tests never change anything in your systems. A test conversation (its origin is `eval:<test run>:<case>`) runs the assistant as in production, but every call to an action that changes something (effect `write`, in the assistant or any [sub-assistant](../reference/glossary.md#sub-assistant) it uses) goes to a stand-in. The stand-in answers with:
- the case's scripted result for that action (`tool_results`), when there is one;
- otherwise a made-up result marked `"sandbox": true`.

Everything else works as in production: approvals still apply (a pre-filled reply approves or denies the write; a write that needs approval and has no reply is denied), only declared actions can be called, and personal data protection runs first. The stand-in only replaces the final call.

**Connected-system actions that only read.** By default, every action of a [connected system](connected-systems.md) is answered by a stand-in during tests, reads included, so a test never reaches an outside system. When a test needs real data from a read-only action, you can let that action run live in tests: it is a setting on each action, and only actions whose effect is `read` can use it. Otherwise, give the case a scripted result for the read, so the assistant sees realistic data. Built-in tools that read your own data (your [databases](data-connections.md) and document libraries) run for real.

**What the test records.** Every call is recorded as the action would have received it, after personal data protection. With `runs.data`, the test run's details list each call and whether the stand-in answered it. In the console, a result shows how many actions were "answered by the stand-in".

To check what the assistant did, not only what it said, add a **Must call an action** (`tool_call`) check: it compares the arguments the stand-in received.

:::note
Safety tests always use stand-ins for every action, reads and writes. See [the safety model](../concepts/safety-model.md#safety-tests).
:::
