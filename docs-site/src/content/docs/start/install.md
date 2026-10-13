---
title: Install and check
description: Install Caliban on one host with Docker Compose, sign in, and check that a first request gets an answer.
---

This tutorial is for the IT administrator. You install Caliban on one host with Docker Compose, with one open model on a local GPU, then check that everything answers. At the end you have a workspace, a model and an API key that an application can use.

It follows the single-host path of the deploy repository. For Kubernetes and for sites with no network at all, see [Other install shapes](#other-install-shapes) at the end.

## What you need

- A Linux host with Docker and Docker Compose. For the model on this page, one GPU with 24 GB of memory (an L4, A10 or RTX 4090). A CPU-only host works too, with a slower model.
- The Caliban image. No image is published to a public registry: build it from source with `deploy/images/build.sh`, or load it from a signed offline bundle (see [Other install shapes](#other-install-shapes)).
- `openssl`, to generate secrets.

Caliban sends nothing out: the console, the datastores and the models all run on the host, and telemetry is off.

## 1. Build the image

Put the three repositories side by side and build:

```sh
mkdir caliban && cd caliban
git clone https://github.com/thecalibanproject/core
git clone https://github.com/thecalibanproject/web
git clone https://github.com/thecalibanproject/deploy

deploy/images/build.sh --version 0.1.0
```

The image holds the `caliban` binary and the console. It runs as a non-root user and has no shell.

## 2. Set the secrets

```sh
cd deploy/compose
cp .env.example .env && chmod 600 .env
```

Fill in the four required secrets in `.env`. The file shows the commands:

| Variable | How to generate it | What it is |
|---|---|---|
| `CALIBAN_ADMIN_TOKEN` | `openssl rand -hex 32` | Your sign-in for the console and the admin API until single sign-on is set up |
| `CALIBAN_KEK` | `openssl rand -base64 32` | The key that encrypts every stored provider key and data connection password |
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` | The database password |
| `VALKEY_PASSWORD` | `openssl rand -hex 24` | The password of the store that keeps rate limits |

:::danger[Back up the KEK]
Keep a copy of `CALIBAN_KEK` offline. If you lose it, every stored provider key and data connection password is lost with it.
:::

## 3. Fetch the model weights

On a machine with internet access, fetch the pinned weights into `./models`:

```sh
../airgap/bundle.sh fetch --profile qwen3-small,embeddings,reranker --models-dir ./models
```

This takes Qwen3.5-9B for chat, plus an embedding model and a reranker. The script checks each licence and refuses revisions that are not pinned.

## 4. Start it

Start Caliban, its datastores (Postgres, Qdrant, Valkey) and the model servers for your hardware:

```sh
docker compose --profile qwen3-small --profile embeddings --profile reranker up -d --wait
```

On a CPU-only host use `--profile cpu`; on a 12 GB GPU, `--profile gpu-12gb`. The deploy README has the table of hardware tiers.

`--wait` returns once Caliban reports healthy. The ports listen on `127.0.0.1` only. Put a TLS reverse proxy in front before you open them to the network.

| Port | What |
|---|---|
| `8080` | The gateway address: apps send their requests here |
| `8081` | The admin service: the console at `/` and the admin API at `/api/v1` |

## 5. Check health

```sh
curl -s http://127.0.0.1:8080/healthz
curl -s http://127.0.0.1:8081/api/v1/health
```

Both answer `200`. `/healthz` also says which configuration version the gateway serves and whether its rate-limit store is reachable (`quota.state` is `ok`, or `degraded` while it is not). `/api/v1/health` says which store the admin service uses (`postgres` here).

## 6. Sign in

Open `http://127.0.0.1:8081/` and sign in with `CALIBAN_ADMIN_TOKEN`. The status line at the bottom of the menu shows **Control plane: ok** and the version.

On the first start, `config/caliban.toml` seeds the database once: the model servers of the compose profiles, their models, and a workspace called `default`. From then on you manage them in the console, and those parts of the file are ignored.

## 7. Check the model

Open **Models**. The **Catalogue** tab lists the models Caliban can route to, and **Model servers** lists where they run, with a health badge for each server.

![The Models page: the catalogue of open models, each on a model server marked T0 Sovereign](../../../assets/shots/models-catalogue.webp)

*The model catalogue of a test install with twelve open models. "T0 Sovereign" means the model runs on your own servers.*

To add a model server or a model of your own, see [Models](../guides/models.md#add-a-model-server).

## 8. Create a workspace and a key

A [workspace](../reference/glossary.md#workspace) (`tenant` in the API) is one isolated space: its keys, its data, its assistants and its usage never cross into another. You can use the seeded `default` workspace, or create your own:

1. Open **Workspaces** (labelled **Tenants** in consoles before the rename) and choose **New tenant**. Give it a name and choose the default handling of personal data. **Reversible pseudonymization** is a good start.
2. Open the workspace. On its **API keys** tab, type a key name (for example `first-app`) and choose **Mint key**.
3. Copy the key now. It starts with `cal_` and is shown once only.

See [Workspaces](../guides/workspaces.md#create) and [API keys](../guides/api-keys.md#create) for the options.

## 9. Send a first request

```sh
curl http://127.0.0.1:8080/v1/chat/completions \
  -H "authorization: Bearer cal_..." -H "content-type: application/json" \
  -d '{"model": "caliban/auto", "messages": [{"role": "user", "content": "hello"}]}'
```

You get an answer in the OpenAI format. The deploy repository has a script that runs the same checks and mints a key for the `default` workspace:

```sh
MINT_KEY=1 ../scripts/smoke.sh
```

Now hand the key and the gateway address to a developer: the [Gateway quickstart](gateway-quickstart.md) takes it from there.

## What to do next

- **Single sign-on.** Let people sign in through your own identity provider and give them roles. Then keep the admin token offline as the emergency access. See [People and roles](../guides/people-and-roles.md#single-sign-on).
- **Privacy.** Set how each workspace protects personal data. See [Privacy](../guides/privacy.md#modes).
- **Your own provider account.** To use a provider such as OpenAI next to the local models, add your account to the workspace and open the network path to that provider only. See [Workspaces](../guides/workspaces.md#provider-accounts).
- **Limits.** Requests per minute, tokens and spend per day. See [Limits](../reference/limits.md).
- **Backups.** Back up Postgres, the Qdrant data and the KEK before every upgrade. Database changes are applied at start-up and are forward-only.

:::caution[Coming soon: a setup checklist]
The console will show a setup checklist on its home page for new installs (model, workspace, key, first answer), and the deploy configuration will be able to create the first model, workspace and administrator at first boot with no clicks. Today, follow the steps on this page.
:::

## Other install shapes

Every shape runs the same image and the same binary.

| Shape | Use it for | Where to read |
|---|---|---|
| **One host, Docker Compose** | Trials, small sites, edge appliances | This page, and `deploy/README.md` |
| **Kubernetes, Helm chart** | Production clusters. Gateways and workers scale apart from the admin service | `deploy/helm/caliban/README.md` |
| **Air-gapped** | Sites with no network. A signed bundle carries the images, the weights and the deploy files | `deploy/airgap/README.md` |

The air-gapped procedure in short: on a connected machine, `bundle.sh` fetches the pinned weights, saves the images and signs a manifest. On the site, `load.sh` checks the signature against a public key you received separately, checks every file, and loads the images. Then you deploy with Compose or Helm as above. Updates are a new bundle by the same procedure.
