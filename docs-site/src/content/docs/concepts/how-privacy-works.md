---
title: How privacy works
description: How Caliban finds personal data, replaces it before a model sees it, and restores it in the answer.
---

Caliban screens every text a model is about to read for [personal data](../reference/glossary.md#personal-data): names, e-mail addresses, phone numbers, card numbers, IBANs, national IDs and your own identifier formats. Depending on your workspace's setting, it replaces them before the model sees them and, if you choose, restores them in the answer your app receives. The model provider never gets the real values.

This runs in the gateway, in Rust, on every request. On the 2026-10-13 test bed it took under 0.5 ms per request (0.4 ms for a support ticket carrying five identifiers).

## The three modes

Each workspace picks a mode (`pii_mode` in the API):

| Mode | The model sees | Your app sees |
|---|---|---|
| **Hide and restore** (`reversible`) | Realistic stand-ins: a valid-looking card number, a valid IBAN, a plausible phone number | The real values, put back in the answer |
| **Hide everywhere** (`mask`) | Typed markers such as `[PHONE]` | The markers too: nothing is restored |
| **Off** | The text as it is | The text as it is |

Hide and restore suits assistants that must quote identifiers back (a refund to the customer's IBAN). Hide everywhere suits cases where nobody downstream needs the values. See [Privacy](../guides/privacy.md#modes) to set it.

## How detection works

Detection is layered:

- **Built-in detectors** find e-mail addresses, phone numbers (international with a country code, North American, French national format), card numbers (checked with the Luhn digit; 15-digit UATP airline cards included), IBANs (checked with their mod-97 key), US social security numbers and French social security numbers (with their key). The checks keep false alarms down: a digit run inside a longer number, such as a score of `0.0322...`, is never taken for a card.
- **Your own patterns.** Identifier formats the built-ins do not know, such as a patient or matter number. Up to 50 per workspace.
- **Your dictionary.** Names and codes to always hide, matched as whole words, case-insensitive. Up to 10,000 terms per workspace. The law demo used a 25-name dictionary of clients and parties.
- **Name detection (optional).** A multilingual model that finds names of people, organisations and places. It is a separate build option and was not deployed in the demos: there, names in free text reached the model in clear unless they were in the dictionary. If names matter, deploy it, or list the names you know.
- **Credentials.** A request that carries a secret (an API key, a password) is refused, wherever the secret appears.

## Stand-ins that keep their shape

In Hide and restore mode a value is replaced by a stand-in ([placeholder](../reference/glossary.md#placeholder)) of the same kind and format. A card number becomes another card number with a valid check digit; an IBAN becomes a valid IBAN. Models handle well-formed values better than markers, and tools that validate formats keep working.

Stand-ins are computed from the value with a key, not stored in a table. Two values in one request never share a stand-in.

## Restoring the answer

For each request, Caliban keeps a reverse map of the stand-ins it issued for that request only. When the answer comes back (streams included, with a small hold-back buffer so a stand-in split across chunks is still caught), it puts the real values back. Only stand-ins issued for this request are restored; anything else stays as it is.

A structured value is restored whatever separators the model uses. An IBAN sent with spaces whose stand-in the model writes compact comes back as the real IBAN, compact.

In the fintech demo, a customer's message carried a card number, an IBAN, a phone number and an e-mail address. The model received none of them in clear, only valid stand-ins, and the support agent's answer showed the original values.

## Same stand-in every time, or fresh each time

The stand-in scope decides whether the same value gets the same stand-in across requests:

- **Per workspace** (the default, `tenant`): the same value always gets the same stand-in in your workspace. A repeated question is byte-identical after protection, so it can be answered from the [cache](caching.md). The cost: the model provider could link requests of your workspace through their stand-ins (linkable, not identifiable).
- **Per request** (`session`): fresh stand-ins on every request. Nothing links two requests, and requests carrying personal data skip the caches.

Stand-ins never cross workspaces.

## Models on your own servers

Models inside your trust boundary (trust tiers "On your servers" and "Verified enclave", `t0_sovereign` and `t1_attested`) receive the text as it is by default, because it never leaves your infrastructure. You can turn protection on for them too ("Also hide personal data from models on our own servers", `pii_on_sovereign`). Models outside the boundary always get protected text.

## The assistant's floor

An [assistant](../reference/glossary.md#assistant) can set its own minimum protection, applied to every model call it makes, on-premises models included. A floor only makes protection stricter: the call gets the stricter of the floor and the workspace's mode, ordered off, then Hide and restore, then Hide everywhere. The health triage assistant set Hide everywhere so patients' identifiers never reached any model.

A single request can also ask for stricter protection (`caliban.pii`), never weaker: a request asking for less than the workspace's mode is handled with the workspace's mode, and the answer reports it in `x-caliban-pii-override`.

Text from tools and documents follows the same rules. Only string values are rewritten in structured data: keys and numbers never change, so the model always receives valid JSON.

## Failing closed

If the name detection model's queue is full, the request is refused with `503` and nothing is sent upstream (the default). An operator can choose to degrade to the built-in detectors instead, in which case names are not protected for those requests. A detector failure always blocks the request with `403`. A privacy gateway that sends unscreened text when busy is not one.

## Seeing what the model saw

The response header `x-caliban-pii-entities` counts the values protected in a request. To check the text a model actually received, see [Check what the model saw](../guides/privacy.md#check-what-the-model-saw).

## Related

- [Privacy guide](../guides/privacy.md): set the mode, add patterns and dictionary terms.
- [The safety model](safety-model.md): how personal data is kept away from tools.
- [Limits](../reference/limits.md): pattern and dictionary limits.
