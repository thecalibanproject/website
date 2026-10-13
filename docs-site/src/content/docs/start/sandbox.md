---
title: The sample workspace
description: A ready-made workspace with sample data and a working assistant, to try Caliban before you connect anything of your own.
---

The sample workspace lets you see a first answer before you configure anything: ask a question, open the conversation, see why the assistant answered as it did. Then reset it and try again.

:::caution[Coming soon]
The sample workspace is not built yet. This page describes how it will work. [What you can do today](#what-you-can-do-today) explains how to get the same four sample workspaces on a test install.
:::

## What it will contain

On first start, Caliban will create a workspace called `sandbox` from files inside the image, so it needs no network:

- a small sample database (a product catalogue);
- a dozen documents in a document library;
- one live assistant that answers from both, with its test cases and its go-live rules;
- a **Sandbox** badge everywhere it appears, so nobody mistakes it for real data.

Sample usage is left out of billing and of audit exports.

## Try it

1. Open the console. The sample workspace is selected for you.
2. Ask the sample assistant a question from the **Try it** panel.
3. Open the conversation: each step, how long it took, what it cost, and which personal data was hidden.
4. Change the assistant's instructions, run its tests, and see what changed.

## Reset the sample workspace

Resetting puts the sample data, the assistant and its tests back as they shipped, and removes the conversations and usage of the sample workspace. Other workspaces are not touched.

- In the console: open the sample workspace and choose **Reset**.
- To remove it for good: delete the workspace like any other. A deploy setting will also skip creating it, for production installs.

## What you can do today

The deploy repository has end-to-end scenarios that set up complete sample workspaces on a test install, with sample data, assistants, tests and requests. They are the scenarios recorded on 2026-10-13:

| Workspace | Use case | What it sets up |
|---|---|---|
| `medmarket` | Health triage for a medical marketplace | A MongoDB catalogue of services, clinics and slots, a `triage` assistant, care guides in a document library |
| `cabinet-hadad` | A law firm's legal assistant | A practice database, legal texts, a `legal-assistant` with two sub-assistants |
| `acme-dev` | A developer trying Caliban from code | Five topics, five small assistants written in Python |
| `cedar-bank` | A neobank's support desk | Accounts and transactions, a refund system the assistant calls, approvals |

They run on a separate test stack with their own MongoDB, model recorder and mock services. The health scenario is `e2e/health-triage` in the deploy repository: `e2e/health-triage/e2e.sh all` brings the stack up, sets up the `medmarket` workspace and sends the requests. Its README lists what it needs (a model, Docker, Python).

To reset, remove everything the scenario created (containers, volumes and its work folder), then run it again:

```sh
e2e/health-triage/e2e.sh down
e2e/health-triage/e2e.sh all
```

:::danger[Test installs only]
`e2e.sh down` deletes volumes. Run the scenarios on a test install, never next to real workspaces.
:::

The law, developer and fintech scenarios are not yet on the deploy repository's main branch. Ask your Caliban contact for them.
