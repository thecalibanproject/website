---
title: Glossary
description: Every Caliban term in plain words, with the internal or API name it replaces.
tableOfContents:
  maxHeadingLevel: 2
---

Each term has its own anchor, so the console can link straight to it (`/docs/reference/glossary/#workspace`). The console, these docs and the API sometimes use different names for the same thing: the plain term comes first, and the API name follows in code. Older names are listed at the end, under [Old and API names](#old-and-api-names), and point back here.

## Workspaces and access

### Workspace

A separate space with its own keys, data connections, assistants, budget and privacy settings. Nothing crosses between workspaces: not cached answers, not placeholders, not usage. `tenant` in the API and in consoles before the rename. See [Workspaces](../guides/workspaces.md).

### Sample workspace

A workspace filled with sample data and one working assistant, so you can try Caliban before connecting your own systems. Not built yet; see [The sample workspace](../start/sandbox.md).

### API key

The secret an app sends to the gateway to act for one workspace: `Authorization: Bearer cal_...`. It is shown once, when you create it. Each key can be limited to some assistants and some data. See [API keys](../guides/api-keys.md).

### What it may read

The data an API key or an assistant may reach, written as scopes such as `shop.orders:read` (a collection of a data connection) or `rag.legal_texts:read` (a document library). `scopes` in the API.

### Role

What a person may do in the console and the admin API. Deployment roles are `owner`, `admin` and `auditor`; workspace roles are `tenant_admin`, `developer`, `viewer` and `billing`. See [People and roles](../guides/people-and-roles.md#roles).

### Provider account

Your own account with an outside model provider (OpenAI, Anthropic, ...), added to a workspace with its key. Caliban never pools keys between workspaces, and the key is never shown again (only its last four characters). Also called BYOK (bring your own key); `provider-keys` in the API.

### Gateway address

Where your apps send requests: the data plane, port 8080 by default. It speaks the OpenAI and Anthropic APIs.

### Admin service

Where settings are managed: the control plane, port 8081 by default. The console and the admin API live here.

### Audit log

The record of every change and every sign-in, newest first. Each entry is linked to the one before it, so an edit to the history is detectable. See [Audit log](../guides/audit.md).

### Tamper check

The verification that every audit entry still links to the one before it (`chain_verified` in the API). See [Verify the chain](../guides/audit.md#verify-the-chain).

## Models and routing

### Model server

A server that runs models and that Caliban calls: vLLM, SGLang, llama.cpp, Ollama, TEI, or an outside provider's API. `providers` in the API. See [Models](../guides/models.md).

<span id="trust-level"></span>

### Trust tier

Where a model runs, which decides what data it may receive. In plain words: **On your servers** (`t0_sovereign`), **Verified enclave** (`t1_attested`), **Provider under contract** (`t2_contracted`), **Public provider** (`t3_public`). Models on your servers and in a verified enclave are inside the trust boundary.

### Automatic routing

Send `"model": "caliban/auto"` and Caliban picks the model, or the assistant, for each request from its topic. See [How routing works](../concepts/how-routing-works.md).

### Fixed model

Name a model in the request (for example `"model": "local/qwen3.8-27b"`) and Caliban uses that model, within the workspace's rules. Shown as `pinned` in headers and reports.

### Topic

A kind of request, such as billing questions or triage, recognised from example sentences. A topic can be sent to an assistant. `intent` in the API. See [Topics](../guides/topics.md).

### Example sentences

The sentences that define a topic. A new request goes to the topic whose examples it resembles most. `exemplars` in the API.

### Which model answers

The ordered list of models a workspace uses for a topic, or by default, when no assistant takes the request. `routes` in the API.

### Tokens

The unit models count and bill by. One token is about three quarters of an English word. Prices are per million tokens.

## Assistants

### Assistant

An AI helper with instructions, access to some of your data, tools and limits, kept in versions. It answers one kind of request. `node` in the API. See [Assistants](../guides/assistants.md).

### Step

One thing an assistant does: think with a model, look something up, call a tool, check a value or ask a person. `vertex` in the spec.

### Sub-assistant

An assistant that another assistant calls for part of the job. Its own tests must pass before the version that uses it can go live. `subnode` in the spec.

### Assistant spec

The full definition of an assistant as JSON: steps, data access, tools, limits and checks. Most people never edit it by hand. See [Assistant spec](assistant-spec.md).

### Template

A ready-made assistant (spec, test cases and example sentences) to start from. Not built yet; see [Your first assistant](../start/first-assistant.md#pick-a-template).

### Version

One frozen state of an assistant. A version never changes once it leaves draft; editing makes a new version.

### Draft

A version you are still editing. It cannot run for apps.

### Ready to test

A frozen version that can be tested but does not serve apps yet. `published` in the API.

### Live

The version apps get. One version per assistant is live at a time.

### Archived

A version taken out of use. `retired` in the API.

### Version fingerprint

A hash of the spec (`sha256:...`) that proves which exact version ran.

### Go live

Make a version the live one. Caliban checks the go-live rules first. `promote` in the API, **Make live** in the console.

## Tests and going live

### Tests

Example conversations with a description of a good answer, run before a version goes live. `evals` in the API. See [Tests and going live](../guides/tests-and-go-live.md).

<span id="test-cases"></span>

### Test case

One example input with the checks its answer must pass. A version's test cases are its golden set (`golden-set` in the API).

### Safety tests

Attacks hidden in the data an assistant reads, to check it is not tricked into acting on them. `injection` suite in the API.

### Passed every time

A test case counts as passed only if it passes in every repeat. "80% passed every time, 3 repeats" means 80% of the cases passed all 3 runs. `pass^k` in the API.

### Grader

A model that reads an answer and the description of a good answer, and says pass or fail. `llm_judge` in the API.

<span id="go-live-bar"></span>

### Go-live rules

The minimum test results a version needs before it can go live: share of cases passed every time, repeats, cost per good answer, slowest typical response, attacks blocked. `eval-policy` or promotion bar in the API. See [The bar](../guides/tests-and-go-live.md#the-bar).

## Data and knowledge

### Data connection

A read-only link to one of your databases (MongoDB today). `datasource` in the API. See [Data connections](../guides/data-connections.md).

### Scan

Read the structure of a data connection and suggest dictionary entries. `introspect` in the API.

### Data dictionary

The business names and meanings of your data, reviewed by a person. Assistants can only query what is approved. `ontology` in the API. See [The data dictionary](../concepts/data-dictionary.md).

### Entry

One item in the data dictionary: a thing, a detail of it, a link between things, a measure, a rule, an alternative name. `element` in the API.

### Query plan

The structured question a model writes when it needs data. Caliban checks it against the data dictionary and compiles it into a safe, read-only database query. The model never writes the database query itself. `CQIR` internally.

### Knowledge

The documents your assistants can search and cite. `rag` in the API. See [Knowledge](../guides/knowledge.md).

### Document library

One set of documents in Knowledge, searched with the same models and rules. `collection` in the API.

### Held for review

A document that failed a check (for example, it contains instructions aimed at the assistant). It is never searched until someone allowed to approve documents releases it. `quarantined` in the API.

### From outside

Text that did not come from your team: a customer message, an uploaded document, a tool result. Caliban treats it as data, never as instructions. `untrusted` in the API.

## Privacy and safety

### Personal data

Names, identifiers, card numbers, IBANs, phone numbers, e-mail addresses and similar values. `pii` in the API. See [How privacy works](../concepts/how-privacy-works.md).

### Hide and restore

Personal data is replaced with placeholders before the model sees it, and the real values are put back in the answer. `reversible` in the API.

### Hide everywhere

Personal data is replaced before the model sees it and is not restored: the caller sees the placeholder too (for example `[PHONE]`). `mask` in the API.

### Placeholder

A realistic stand-in for a personal value (a valid card number, a valid IBAN), used in place of the real one. `surrogate` in the API.

<span id="untrusted-data"></span>

### Untrusted

See [From outside](#from-outside).

### Data labels

Tags that follow data through a run and say where it came from: the caller, a database, documents, a tool, personal data. They decide what needs approval and what the answer check looks at. `taint` labels in the API.

### Answer check

A last check on an assistant's answer that removes links, contacts and instructions that only came from untrusted text (or refuses the answer). `guardrails.answer` in the spec.

### Connected system

An outside system an assistant may use, such as your refund service, reached as an MCP tool server. Each action is approved by a person and pinned to the version they approved. See [Connected systems](../guides/connected-systems.md).

### Approvals

Runs waiting for a person: an action that changes something (a refund) or a question the assistant asks. `inbox` in the API. See [Approvals](../guides/approvals.md).

## Runs and costs

### Conversation

One execution of an assistant, from the request to the answer, with every step, its time and its cost. `run` in the API (`run_01...`). See [Conversations and runs](../guides/conversations-and-runs.md).

### Reuse identical answers

The exact cache: the same request in the same workspace is answered from the earlier answer, without calling the model. See [Caching](../concepts/caching.md).

### Reuse similar answers

The semantic cache: a request that means the same as an earlier one is answered from it. Off unless your administrator turns it on.

## Old and API names

The console and the API used these names before the rename. They still appear in the API, the SDKs, config files and headers.

| Old or API name | Plain term |
|---|---|
| <span id="tenant"></span>tenant | [Workspace](#workspace) |
| <span id="node"></span>node | [Assistant](#assistant) |
| <span id="node-spec"></span>node spec, `node.schema.json` | [Assistant spec](#assistant-spec) |
| <span id="vertex"></span>vertex | [Step](#step) |
| <span id="subnode"></span>subnode, `node://` | [Sub-assistant](#sub-assistant) |
| <span id="intent"></span>intent, routing intent | [Topic](#topic) |
| <span id="exemplar"></span>exemplar | [Example sentences](#example-sentences) |
| <span id="caliban-auto"></span>`caliban/auto` | [Automatic routing](#automatic-routing) |
| <span id="pinned"></span>pinned | [Fixed model](#fixed-model) |
| <span id="cqir"></span>CQIR | [Query plan](#query-plan) |
| <span id="ontology"></span>ontology, Caliban Semantic Model, CSM | [Data dictionary](#data-dictionary) |
| <span id="datasource"></span>datasource | [Data connection](#data-connection) |
| <span id="introspection"></span>introspection, introspect | [Scan](#scan) |
| <span id="rag"></span>RAG, retrieval | [Knowledge](#knowledge) |
| <span id="collection"></span>collection | [Document library](#document-library) |
| <span id="quarantined"></span>quarantined | [Held for review](#held-for-review) |
| <span id="eval"></span>eval | [Tests](#tests) |
| <span id="golden-set"></span>golden set | [Test case](#test-case) |
| <span id="injection-suite"></span>injection suite | [Safety tests](#safety-tests) |
| <span id="passk"></span>pass^k | [Passed every time](#passed-every-time) |
| <span id="promotion-bar"></span>promotion bar, promotion gate | [Go-live rules](#go-live-rules) |
| <span id="judge"></span>judge, `llm_judge` | [Grader](#grader) |
| <span id="pii"></span>PII | [Personal data](#personal-data) |
| <span id="reversible"></span>reversible pseudonymisation | [Hide and restore](#hide-and-restore) |
| <span id="mask"></span>mask | [Hide everywhere](#hide-everywhere) |
| <span id="surrogate"></span>surrogate, stand-in | [Placeholder](#placeholder) |
| <span id="taint"></span>taint, taint labels | [Data labels](#data-labels) |
| <span id="answer-guard"></span>answer guard | [Answer check](#answer-check) |
| <span id="mcp"></span>MCP, tool server | [Connected system](#connected-system) |
| <span id="inbox"></span>inbox | [Approvals](#approvals) |
| <span id="run"></span>run | [Conversation](#conversation) |
| <span id="byok"></span>BYOK, provider key | [Provider account](#provider-account) |
| <span id="data-plane"></span>data plane, router | [Gateway address](#gateway-address) |
| <span id="control-plane"></span>control plane | [Admin service](#admin-service) |
| <span id="hash-chain"></span>hash chain | [Tamper check](#tamper-check) |
| <span id="exact-cache"></span>exact cache | [Reuse identical answers](#reuse-identical-answers) |
| <span id="semantic-cache"></span>semantic cache | [Reuse similar answers](#reuse-similar-answers) |
| published, retired, promote | [Ready to test](#ready-to-test), [Archived](#archived), [Go live](#go-live) |
| trust tiers t0 to t3 | [Trust tier](#trust-tier) |
