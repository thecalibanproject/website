---
title: Caliban docs
description: Install and run Caliban, put it in front of your models, and build and supervise assistants.
---

Caliban is an AI gateway that runs on your own servers: one address for every AI request in your company, with personal data hidden before a model sees it. These docs show you how to install it, use it and build on it. They work offline, inside your install.

New here? Read [Where to begin](start/index.md).

## I install and run Caliban (IT admin)

1. [Install and check](start/install.md): one host, a local model, a first answer.
2. [Models](guides/models.md): add model servers, models and outside providers.
3. [Workspaces](guides/workspaces.md): one per team or customer, with its privacy, limits and keys.
4. [People and roles](guides/people-and-roles.md): roles and single sign-on.
5. [API keys](guides/api-keys.md): one key per application, rotated when needed.
6. [Configuration](reference/configuration.md): the settings file and environment variables.

## I build and supervise assistants

1. [Your first assistant](start/first-assistant.md): build, test and put live an assistant that answers from your data.
2. [The sample workspace](start/sandbox.md): try an assistant before you connect anything (coming soon).
3. [Topics](guides/topics.md): which requests go to which assistant.
4. [Assistants](guides/assistants.md): edit, version and limit an assistant.
5. [Tests and going live](guides/tests-and-go-live.md): the tests an assistant must pass before it goes live.
6. [Approvals](guides/approvals.md): approve or reject what an assistant wants to change.
7. [Conversations and runs](guides/conversations-and-runs.md): see what an assistant did, step by step, and what it cost.

## I write code against Caliban

1. [Gateway quickstart](start/gateway-quickstart.md): change the base URL and the key of your OpenAI client, and you are done.
2. [SDKs](reference/sdks.md): the Python and TypeScript SDKs.
3. [Response headers](reference/response-headers.md) and the [HTTP API](reference/api.md).

## Look something up

- [Concepts](concepts/how-routing-works.md): how routing, privacy, caching and the safety model work.
- [Glossary](reference/glossary.md): every term, and the old names that mean the same thing.
