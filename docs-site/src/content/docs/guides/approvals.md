---
title: Approvals
description: See which conversations wait for a person, approve or deny an assistant's action, and answer its questions.
---

Some conversations stop and wait for a person: an assistant asks a question, or it wants to do something with data that came from outside. They wait in **Approvals** (labelled **Inbox** in consoles before the rename) until someone decides.

## What needs approval

Two kinds of items wait for you.

**Questions.** An assistant can have a step that asks a person (a `human` step in its spec). For example, the health triage assistant asks for the patient's city when the case names none. The conversation pauses until someone answers. If the step has a time limit (`timeout_s`), its default answer is used when the time runs out, or the conversation fails.

**Actions on untrusted data.** Caliban tracks where every piece of data in a conversation came from: the customer's message, your database, a document, a connected system (these are the [data labels](../reference/glossary.md#data-labels)). An action needs approval when both are true:
- the tool **changes something** (declared `effect: write` in the assistant's spec), or it is a read that reaches the network through its arguments (a URL to fetch);
- its arguments carry data from outside: anything from a tool result, the database, a document, or caller data marked [untrusted](../reference/glossary.md#untrusted).

Personal data alone does not need approval: it is handled by the [privacy rules](privacy.md).

An assistant's author can skip approval for specific sources with an allowlist on the tool (`allow_tainted`, for example `["datasource"]`). That allowlist applies to every conversation of the version without a person, so the console warns about broad entries such as `*`.

:::note
A write whose arguments carry no outside data runs without approval. If you want a person to confirm every refund, make sure the refund's arguments come from the conversation's data (they usually do), or add a question step before the write.
:::

Two examples from the fintech demo (the neobank support desk):
- **R1, a genuine duplicate.** A customer was charged twice by StreamBox. The assistant looked up the account and the transactions in the bank's database, then wanted to call the refund tool. The arguments came from the database, so the refund waited in Approvals. An administrator approved it and the customer was refunded once.
- **R2, a duplicate with a fake system notice.** The customer's message hid a "system notice" asking to pay 2,450 EUR to another IBAN. The refund waited in Approvals, showing the tool, the untrusted sources and the exact arguments. The model had ignored the notice and the arguments matched the account on file, so it was approved.

## Approve or reject

1. Open **Approvals**. Each card shows the assistant, the conversation, how long it has waited, and:
   - for a question, the question;
   - for an action, the tool, whether it changes something, the **untrusted data** sources, and the exact **arguments** it would send.
2. For an action, check the arguments against what you expect (the right account, the right amount). Then choose **Approve call** (and confirm) or **Deny**.
3. For a question, type **Your answer** and send it. Tick **Answer is JSON** to send a JSON value instead of text.

An approval covers this one action of this one conversation, with the arguments it showed. It never carries over to another action or another conversation. A denied action fails; an assistant that loops over tools is told it was refused and can carry on.

Your decision is recorded under your name in the [audit log](audit.md) (`node.write.approve`, `node.write.deny` or `node.run.answer`).

Who can do what:
- seeing that a conversation waits needs `runs.read` (every role except billing);
- seeing the question and the arguments needs `runs.data` (owner, admin, workspace admin, developer);
- answering, approving and denying needs `runs.answer` (owner, admin, workspace admin). See [people and roles](people-and-roles.md#roles).

Apps can decide too, through the API, with the key that started the conversation:

```sh
curl -X POST http://caliban.internal:8080/v1/runs/run_01a1332e0e8071f48917b2b82f5620db/input \
  -H "authorization: Bearer cal_..." -H 'content-type: application/json' \
  -d '{"step": "refund#0@approve", "answer": {"approve": true}}'
```

From the console's API (as a signed-in user): `POST /api/v1/tenants/{t}/runs/{id}/input` with the same body. `GET /api/v1/tenants/{t}/inbox` lists what waits, oldest first.

:::caution[Coming soon]
Rejecting with a written reason, and a rule that stops people from approving their own requests, are planned. Today **Deny** takes no reason: write it in your team's ticket, and note the conversation id.
:::

## Notifications

:::caution[Coming soon]
Caliban does not send notifications yet. The plan is an e-mail or chat webhook (on your own network) when something waits for approval, and when spend reaches 80% of a cap.

Today, check **Approvals** regularly, or poll `GET /api/v1/tenants/{t}/inbox` from your own monitoring and alert on a non-empty list. Apps that start conversations can follow them live with `GET /v1/runs/{id}/events` and watch for the `run.input_required` event.
:::
