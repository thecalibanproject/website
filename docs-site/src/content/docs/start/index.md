---
title: Where to begin
description: What Caliban is, who does what, and which page to read first.
---

Caliban is an AI gateway that runs on your own servers. Your applications send their AI requests to one address, Caliban's, instead of to a model provider. Caliban checks the key, hides personal data before a model sees it, picks the model (or the assistant) that should answer, reuses answers it has already given, and records what each request cost. It works with models on your own hardware and with your own accounts at providers: you bring the keys, Caliban never shares them. An install can run with no connection to the internet at all.

## Who does what

Caliban has two kinds of users, and most teams have both.

| Role | What you do | Where you work |
|---|---|---|
| **IT administrator** | Install Caliban, add models, create workspaces, manage people, keys and limits | The console's administration pages, the deploy files |
| **Assistant owner** (a clinic manager, a law partner, a support lead) | Build assistants that answer from your data, test them, put them live, approve what they want to change, read their conversations | The console's daily pages |
| **Developer** | Point an application at Caliban and call models or assistants from code | The gateway API, the SDKs |

A [workspace](../reference/glossary.md#workspace) separates teams or customers: each has its own keys, data, assistants, budget and usage, and nothing crosses between them.

## Where to begin

- **You install and run Caliban:** start with [Install and check](install.md).
- **You build and supervise assistants:** start with [Your first assistant](first-assistant.md). Once it exists, the [sample workspace](sandbox.md) will let you try one before connecting your own data.
- **You write code against Caliban:** start with the [Gateway quickstart](gateway-quickstart.md).

## The order of things

A first answer from your own data takes these steps. Each one links to its guide.

1. **Install** Caliban and check that it answers ([Install and check](install.md)).
2. **Add a model**: a model server on your hardware, or your own provider account ([Models](../guides/models.md)).
3. **Create a workspace** and choose how it protects personal data ([Workspaces](../guides/workspaces.md), [Privacy](../guides/privacy.md)).
4. **Mint an API key** for an application ([API keys](../guides/api-keys.md)). From here, apps can already use Caliban as a gateway ([Gateway quickstart](gateway-quickstart.md)).
5. **Connect your data**: a database ([Data connections](../guides/data-connections.md), [Data dictionary](../guides/data-dictionary.md)) or documents ([Knowledge](../guides/knowledge.md)).
6. **Build an assistant**, test it and put it live ([Your first assistant](first-assistant.md), [Tests and going live](../guides/tests-and-go-live.md)).
7. **Send requests to it**, directly or by [topic](../guides/topics.md), then supervise it: [approvals](../guides/approvals.md), [conversations](../guides/conversations-and-runs.md), [usage and costs](../guides/usage-and-costs.md).

Words you do not know are in the [glossary](../reference/glossary.md).
