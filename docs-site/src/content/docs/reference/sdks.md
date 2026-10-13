---
title: SDKs
description: The Caliban Python and TypeScript SDKs, how to install them from source, and what they cover.
---

You do not need an SDK to use Caliban: any OpenAI or Anthropic client works (see the [Gateway quickstart](../start/gateway-quickstart.md)). The Caliban SDKs add typed access to the [`caliban` request options](response-headers.md#the-caliban-request-options), parse the [response headers](response-headers.md) for you, and wrap the admin API.

Both SDKs are open source under the Apache License 2.0. They send no telemetry and call only the URLs you configure. Both are at version 0.1.0, and their API may still change.

| | Python | TypeScript |
|---|---|---|
| Package | `caliban-sdk`, imported as `caliban` | `@caliban/sdk` |
| Needs | Python 3.11 or newer (`httpx`, `pydantic` 2, `pyyaml`) | Node.js, built with pnpm |
| Gateway client | `Caliban`, `AsyncCaliban` | `CalibanClient` |
| Admin client | `CalibanAdmin` | `CalibanAdmin` |
| Assistant specs | `caliban.nodes` (`load_node`, typed models) | `defineNode` |
| Tests | `caliban.evals` and the `caliban-eval` command | |

## Install

Neither SDK is published to a package registry yet. Install them from source.

**Python:**

```sh
pip install git+https://github.com/thecalibanproject/sdk-python
```

This also installs the `caliban-eval` command. In an air-gapped site, build a wheel on a connected machine (`pip wheel`) and carry it across.

**TypeScript:** build the package and install the tarball.

```sh
git clone https://github.com/thecalibanproject/sdk-typescript.git
cd sdk-typescript
pnpm install
pnpm build
npm pack            # writes caliban-sdk-0.1.0.tgz
```

Then, in your project:

```sh
npm install /path/to/sdk-typescript/caliban-sdk-0.1.0.tgz
```

`npm install github:...` does not work: the build output is not committed.

## Configure

Both SDKs read the same environment variables, so a script picks up its settings from the shell:

| Variable | Used by | Default |
|---|---|---|
| `CALIBAN_API_KEY` | gateway client | none (required): your `cal_...` key |
| `CALIBAN_BASE_URL` | gateway client | `http://localhost:8080/v1` |
| `CALIBAN_ADMIN_TOKEN` | admin client | none (required): the admin token, or an access token from your identity provider |
| `CALIBAN_ADMIN_URL` | admin client | `http://localhost:8081` |

Never ship an admin token to a browser.

## Send a request

**Python:**

```python
from caliban import Caliban

client = Caliban(api_key="cal_...", base_url="http://caliban.internal:8080/v1")

resp = client.chat.completions.create(
    model="caliban/auto",
    messages=[{"role": "user", "content": "Which vendors are overdue?"}],
    caliban={"pii": "reversible", "cache": "exact"},
)
print(resp.text)
print(resp.caliban.routed_model, resp.caliban.cache, resp.caliban.pii_entities)
```

**TypeScript:**

```ts
import { CalibanClient } from '@caliban/sdk';

const caliban = new CalibanClient({ apiKey: 'cal_...', baseURL: 'http://caliban.internal:8080/v1' });

const completion = await caliban.chat.completions.create({
  model: 'caliban/auto',
  messages: [{ role: 'user', content: 'Which vendors are overdue?' }],
  caliban: { pii: 'reversible', cache: 'exact' },
});
console.log(completion.choices[0]?.message?.content);
console.log(completion.meta.routedModel, completion.meta.cache, completion.meta.piiEntities);
```

The Python SDK checks the `caliban` options before sending: an unknown key raises a validation error, so a typo cannot silently drop a privacy setting.

The response metadata (`.caliban` in Python, `.meta` in TypeScript) holds the request id, the model that answered, the cache result and tier, the parsed topic decision, the personal-data count, the cost and billed amount, and, for assistant answers, the route, run id and run status. See [Response headers](response-headers.md).

Streaming, embeddings, rerank and the model list are covered too: `stream=True`, `embeddings.create`, `rerank.create`, `models.list()`.

## Use the admin API

**Python:**

```python
from caliban import CalibanAdmin

admin = CalibanAdmin(token="...", base_url="http://caliban.internal:8081")

t = admin.tenants.create(name="Acme", pii_default="reversible")
key = admin.api_keys.create(t.id, name="first-app")  # key.key is the plaintext, shown once
```

**TypeScript:**

```ts
import { CalibanAdmin } from '@caliban/sdk';

const admin = new CalibanAdmin({ token: process.env.CALIBAN_ADMIN_TOKEN, baseUrl: 'http://caliban.internal:8081' });

const tenant = await admin.tenants.create({ name: 'Acme', pii_default: 'reversible' });
const { key } = await admin.apiKeys.create(tenant.id, { name: 'first-app' }); // shown once
```

The admin clients use the API names: `tenants` for workspaces, `nodes` for assistants, `datasources` for data connections, `ontology` for the data dictionary, `intents` for topics. The [glossary](glossary.md) maps each one to its plain name.

## What they do not cover yet

The developer scenario recorded on 2026-10-13 wrote five assistants, their tests and their topics in Python. At that time the Python SDK did not wrap these calls, and the scenario made them with the SDK's own HTTP client:

- publishing a version, making a version live, listing versions;
- a workspace's model routes and its topic-to-assistant mapping (`node_routes`), and its assistant spending caps;
- conversations as the console lists them, assistant spend against caps, and usage grouped by assistant or by day of routing;
- reading a test run while its trials are still in flight (the `Eval` model rejected it).

Some of these may be covered by a newer SDK version: check the SDK's README for the version you install. For anything missing, call the endpoint directly: every operation is in the [HTTP API](api.md).

## Licence

Both SDKs: Apache License 2.0, copyright 2026 Elie Sfeir. The Caliban gateway itself is proprietary and source-available.
