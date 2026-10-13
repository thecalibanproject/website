---
title: Assistants and versions
description: What an assistant is made of, why its versions never change, and how a version goes live.
---

An [assistant](../reference/glossary.md#assistant) (`node` in the API) is an AI helper with a job: triage a patient's request, answer from the firm's legal texts, handle a refund. It is defined by one JSON document, its [spec](../reference/assistant-spec.md), and kept in versions.

## What an assistant is made of

- **Instructions.** A system prompt, and optionally the shape of its input and output (JSON schemas that every run is checked against).
- **Steps.** Either a fixed workflow of [steps](../reference/glossary.md#step) (think with a model, look something up, call an action, ask a person, call a sub-assistant, run several tasks in parallel), or an agent: a bounded loop in which the model picks tools itself. Workflows are easier to test and to secure; agents are more flexible.
- **What it may read.** Scopes on your [data connections](../reference/glossary.md#data-connection) and [document libraries](../reference/glossary.md#document-library), such as `shop.orders:read` or `rag.legal_texts:read`. Nothing else is reachable.
- **What it may do.** Actions of [connected systems](../reference/glossary.md#connected-system), each pinned to an approved version and declared as a read or a write, plus other assistants.
- **Limits.** Steps, tokens, working time, cost per conversation, levels of sub-assistants and tasks in parallel. A conversation that hits a limit stops cleanly and returns what it had.
- **Safety settings.** The minimum personal-data protection for its model calls and the [answer check](../reference/glossary.md#answer-check).

The health triage assistant, for example, reads three catalogue collections, classifies the case, may ask the patient one question, looks up services, facilities and appointment slots, and writes a recommendation that must match its output schema.

## Versions never change

A version is frozen once created. Its [fingerprint](../reference/glossary.md#version-fingerprint) (`sha256:...`) is computed from the spec, so the same spec always gives the same fingerprint and any change gives a new one. Changing an assistant means creating a new version. Every conversation records the version that ran, so you can always say exactly what answered.

## The life of a version

A version moves forward through four states, never back:

| State | API name | Meaning |
|---|---|---|
| [Draft](../reference/glossary.md#draft) | `draft` | Being written. Not runnable by apps. |
| [Ready to test](../reference/glossary.md#ready-to-test) | `published` | Checked and frozen. Tests can run it; apps cannot, unless it is also live. |
| [Live](../reference/glossary.md#live) | (the promotion pointer) | The version apps get when they call the assistant. One per assistant. |
| [Archived](../reference/glossary.md#archived) | `retired` | No new conversations. Conversations already running finish on it. |

Publishing checks the version against your workspace: every scope names a real connection or library, every action is approved with exactly that pin, every sub-assistant it calls is itself published, there are no cycles, and the limits fit inside the workspace's caps. A failure lists every problem at once.

Going back is a pointer move: make an earlier version live again. Nothing is rebuilt.

## Going live is gated by tests

An assistant can have [go-live rules](../reference/glossary.md#go-live-rules) (the promotion bar): the share of [test cases](../reference/glossary.md#test-case) that must pass every time they run, how many repeats, the most cost per good answer, the slowest typical response time, and the share of attacks the [safety tests](../reference/glossary.md#safety-tests) must block.

- A version with write actions can go live only after its safety tests meet the rules. The default is every attack blocked. The rule can be lowered, never removed.
- Read-only versions need safety tests too, by default, because what they read can steer their answer.
- With quality rules set, the latest quality tests of that exact version must meet them.

The rules live on the assistant, not in the spec, so the author of a version cannot lower the bar that version is judged against. Changing the rules needs a separate permission and is audited.

A draft has no test results, so the usual flow is: publish without making it live, run the tests, then make it live. See [Tests and going live](../guides/tests-and-go-live.md).

## Sub-assistants, children first

An assistant can call other assistants for part of the job ([sub-assistants](../reference/glossary.md#sub-assistant)). In the developer demo, a support orchestrator plans the tasks in a message, then runs a billing agent and a bug triage agent in parallel and merges one reply. In the law demo, the legal assistant calls a matter desk and a research assistant.

A parent pins exact versions of its children (`node://billing-agent@v1`). Each child must pass its own go-live rules before a parent that pins it can go live. Otherwise a parent with no write actions of its own could reach an untested write through a child. So you test and promote children first, then the parent.

Sub-assistants run inside the parent's conversation and share its limits: a child gets at most what its parent has left.

## Related

- [Assistants guide](../guides/assistants.md): create, edit, set budgets, manage versions.
- [Assistant spec](../reference/assistant-spec.md): every field.
- [The safety model](safety-model.md).
