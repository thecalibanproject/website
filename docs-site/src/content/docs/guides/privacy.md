---
title: Privacy and personal data
description: Choose how personal data is hidden from models, add your own identifier formats and names, and check what a model received.
---

Caliban finds personal data in every request (names, e-mail addresses, phone numbers, card numbers, IBANs, national ids and credentials) and replaces it before a model reads it. You choose how, per workspace. This guide covers the settings. [How privacy works](../concepts/how-privacy-works.md) explains the mechanism.

All settings are on the workspace page (**Tenants** in consoles before the rename), in the **Privacy and caching** and **Personal data detectors** cards. You need `tenant.write` on the workspace.

## Modes

**PII default mode** has three values:

| Console label | Plain name | What the model sees | What your app gets back |
|---|---|---|---|
| Reversible pseudonymization | Hide and restore | Realistic placeholders: a fake but valid card number, IBAN or phone number | The answer with the real values put back |
| Mask (irreversible) | Hide everywhere | Typed markers such as `[PHONE]` | The answer with the markers, never the real values |
| Off | No protection | The text as typed | The answer as written |

Pick **Hide and restore** for assistants that must quote a customer's details back (a support desk, a case note). Pick **Hide everywhere** when nobody downstream needs the values. In the fintech demo, a ticket with a card number, an IBAN, a phone number and an e-mail address reached the model as valid-looking stand-ins, and the support agent got the real values back. The protection step took 0.4 ms.

Three more settings refine the mode:

- **PII mode on sovereign models.** Off by default: models on your own servers and in verified enclaves (trust tiers T0 and T1) receive the text as is, since it never leaves your boundary. Turn it on to protect personal data from them too. Outside models always get the mode.
- **Surrogate scope.** With `Tenant` (the default), the same value always gets the same placeholder in this workspace, so a repeated question can be answered from the cache. The provider could link those requests to each other (not to a person). With `Session`, every request gets fresh placeholders, and requests with personal data skip the cache.
- **The assistant's floor.** Each assistant can set its own minimum protection (`guardrails.pii` in its settings). It applies to every model call of that assistant, in-house models included, and it can only make protection stronger. See [the assistant spec](../reference/assistant-spec.md).

A prompt that carries a credential (an API key, a password) is refused, whatever the mode.

Through the API: `PATCH /api/v1/tenants/{id}` with `pii_default` (`off`, `mask`, `reversible`), `pii_surrogate_scope` (`tenant`, `session`) and `pii_on_sovereign`.

## Custom patterns

The built-in detectors know common formats. Add a pattern for an identifier of your own, such as a patient number or a national id.

1. In **Personal data detectors**, under **Patterns**, add a row.
2. Enter a **label** and a **pattern**:
   - A built-in label (`NATIONAL_ID`, `PHONE`, `EMAIL`, `PERSON`, `ORG`, `LOCATION`, `IBAN`, `CARD`) gets a realistic placeholder of that type.
   - Any other label (`MRN`, `STAFF_ID`) gets a placeholder of the same shape, or `[MRN]` in Hide everywhere mode.
3. Save.

The health demo used one pattern for a Lebanese-style national id such as `LB-4471-9902-3`:

```json
{"label": "NATIONAL_ID", "pattern": "\\bLB-\\d{4}-\\d{4}-\\d\\b"}
```

Rules for patterns:
- At most 50 per workspace, each up to 500 characters.
- Rust regex syntax: no lookaround and no backreferences, so a pattern always runs in linear time.
- A pattern must not match the empty string.
- Labels ignore case: `phone` is `PHONE`.

:::caution[Coming soon]
"Add a pattern from examples": paste two or three real identifiers and the console proposes the pattern, with a live test box. Today, write the regular expression yourself and check it on a test request (see [below](#check-what-the-model-saw)).
:::

## Dictionary

The dictionary hides names and codes that no pattern describes: your staff, your clients, a building, a project.

In **Personal data detectors**, fill **Dictionary** with one term per line, as `LABEL: term`:

```text
ORG: Northwind Clinic
LOCATION: Building C
STAFF_ID: K-1207
```

Terms match whole words, ignoring case. A workspace holds up to 10,000 terms, each 2 to 200 characters. The law demo kept the 25 names of the firm's lawyers and clients in its dictionary.

The terms themselves may be personal data, so only people with `tenant.write` can read them back. Others see the count. The audit log records the count, never the terms.

:::note
Names in free text are found by the name detector (the NER tier), which is an optional part of the deployment. Without it, add the names you know to the dictionary. The 2026-10-13 demos ran without it.
:::

## Check what the model saw

To confirm protection works, look at what one request carried.

1. **The response header.** Every chat response has `x-caliban-pii-entities`, the number of values Caliban protected:

   ```sh
   curl -si http://caliban.internal:8080/v1/chat/completions \
     -H "authorization: Bearer cal_..." -H 'content-type: application/json' \
     -d '{"model":"local/qwen3.8-27b","temperature":0,"messages":[{"role":"user","content":"Call me on +33 6 12 48 90 17"}]}' \
     | grep -i x-caliban-pii
   ```

   With a model on your own servers, the count is 0 unless **PII mode on sovereign models** is on (see [Modes](#modes)).
2. **The conversation.** For an assistant, open the conversation in the console (**Runs** in consoles before the rename). The **Personal data** line says how many values were protected in its model calls, for example "15 entities protected in its model calls".
3. **The model server's log.** On a model server you operate, the request log shows the exact text it received. The fintech demo read it to show the placeholders next to the originals.

:::caution[Coming soon]
A **What the model saw** view on each conversation, showing the protected text next to the original. Today, use the header, the conversation's count and your model server's request log.
:::
