---
title: People and roles
description: Give people access to Caliban with roles, connect your own identity provider, and keep the shared admin token for emergencies.
---

People sign in to the console and the admin API through your own identity provider (Keycloak, Microsoft Entra ID, Okta, ADFS, Authentik, Dex, or any OpenID Connect provider). Caliban contacts nothing else, so this works on an air-gapped network. What each person may do comes from their [role](../reference/glossary.md#role).

App API keys (`cal_...`) are separate: see [API keys](api-keys.md).

## Roles

Three roles cover the whole deployment, and four apply to one [workspace](../reference/glossary.md#workspace):

| Role | Scope | Can |
|---|---|---|
| Owner | Deployment | Everything, including granting and revoking Owner |
| Admin | Deployment | Everything except granting or revoking Owner |
| Auditor | Deployment | Read everything, including the audit log, users and roles; no changes, no conversation content |
| Workspace admin (`tenant_admin`) | One workspace | Workspace settings, API keys, provider keys, which model answers, data connections, the data dictionary, assistants (publishing and going live included), approvals, usage |
| Developer | One workspace | API keys, which model answers, topics, assistant drafts, test runs, the data dictionary review; reads the rest. Cannot publish, go live, approve actions or answer approvals |
| Viewer | One workspace | Read-only. Sees that conversations happened, not what was said |
| Billing | One workspace | The workspace, its usage and its spend |

Every role can read the model catalogue.

The permissions that matter most for assistants:

| Permission | Lets you | Owner, Admin, Workspace admin | Developer | Viewer, Auditor | Billing |
|---|---|---|---|---|---|
| `nodes.write` | Draft assistant versions, edit test cases | yes | yes | no | no |
| `nodes.publish` | Publish, go live, archive, change the bar | yes | no | no | no |
| `nodes.run` | Run assistants and tests, give keys access to assistants | yes | yes | no | no |
| `runs.read` | See that conversations happened (steps, timings, costs) | yes | yes | yes | no |
| `runs.data` | See conversation content and test cases | yes | yes | no | no |
| `runs.answer` | Answer questions, approve or deny actions | yes | no | no | no |
| `tools.approve` | Approve a connected system's actions | yes | no | no | no |
| `rag.approve` | Release a document held for review | yes | no | no | no |

Building and approving are kept apart on purpose: a developer can draft an assistant and register a connected system, but someone else makes it live and approves what it may do. The full route-by-route table is in core's `docs/sso.md`.

Roles add up from three places:
- **group mappings** in the configuration file: members of an identity provider group get a role (read-only in the console, under **Group mappings from the config file**);
- **group bindings** granted in the console or the API;
- **user bindings** granted in the console or the API.

A change takes effect on the person's next request and is recorded in the [audit log](audit.md). A person with no role can sign in and sees an empty console until someone grants one.

## Invite

Today, people are added through your identity provider: there is no invitation e-mail and no local account.

1. Have the person sign in once through single sign-on. Caliban creates their user on the first sign-in, and they appear in **People and roles** (labelled **Users and roles** in consoles before the rename).
2. Open **People and roles**, choose **Grant a role**, and pick:
   - **Grant to**: **A user** (pick them) or **An identity provider group** (type the group name exactly as your provider sends it);
   - **Role**;
   - **Tenant**, for a workspace role.
3. Confirm. To remove access, revoke the binding from **Role bindings**. To end someone's sessions at once, use **Sign out everywhere** on their user.

Granting a group is usually better: people then get access by joining the group in your directory, and lose it when they leave. Only owners and admins grant roles; workspace admins cannot grant roles on their own workspace yet.

With the API (`rbac.write`):

```sh
curl -X POST http://caliban.internal:8081/api/v1/role-bindings \
  -H "authorization: Bearer $CALIBAN_ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"subject_kind": "group", "subject": "acme-developers", "role": "developer", "tenant_id": "acme"}'
```

:::caution[Coming soon]
Inviting a colleague by e-mail without an identity provider (named local accounts) is planned. Today, a deployment without single sign-on has only the shared admin token, which everyone would share. Set up single sign-on before more than one person administers Caliban.
:::

## Single sign-on

Your IT administrator sets this up once in the configuration file (`[security.oidc]`) or with environment variables.

1. **Register Caliban in your identity provider** as a confidential OpenID Connect client using the authorization code flow with PKCE (S256). The redirect URI is the admin service's `/auth/callback`, such as `https://caliban.example.internal/auth/callback`.
2. **Send groups in the token**, under a claim such as `groups` (for Entra ID, prefer app roles and `groups_claim = "roles"`).
3. **Configure Caliban:**

```toml
[security]
admin_token = { env = "CALIBAN_ADMIN_TOKEN" }   # the emergency token once SSO works

[security.oidc]
issuer = "https://keycloak.example.internal/realms/caliban"
client_id = "caliban-console"
client_secret = { env = "CALIBAN_OIDC_CLIENT_SECRET" }
redirect_url = "https://caliban.example.internal/auth/callback"
groups_claim = "groups"
api_audience = "caliban-api"                    # also accept access tokens, for CI and scripts

[[security.oidc.role_mappings]]
group = "caliban-owners"
role = "owner"

[[security.oidc.role_mappings]]
group = "acme-developers"
role = "developer"
tenant = "acme"
```

The same settings exist as environment variables (`CALIBAN_OIDC_ISSUER`, `CALIBAN_OIDC_CLIENT_ID`, `CALIBAN_OIDC_CLIENT_SECRET`, `CALIBAN_OIDC_REDIRECT_URL`, `CALIBAN_OIDC_OWNER_GROUPS`, ...). See [configuration](../reference/configuration.md). Step-by-step setup for Keycloak and Microsoft Entra ID is in core's `docs/sso.md`.

4. **Restart the admin service and sign in** with an account in the owners group.

Sessions last 8 hours, or 1 hour idle. Scripts and CI use access tokens from the same provider for the `api_audience`, sent as `Authorization: Bearer`.

**The shared admin token** (`CALIBAN_ADMIN_TOKEN`) is how you sign in on a first install, before single sign-on exists. It has owner rights. Once single sign-on works, it becomes the emergency key: every use is logged and recorded in the audit log as `auth.break_glass`, and changes made with it show the actor `break_glass`. Keep it offline, or turn it off with `break_glass = false` under `[security]` (or `CALIBAN_BREAK_GLASS=false`).

Limits today: one identity provider per deployment; no refresh tokens (people sign in again, usually silently); roles come only from the token's claims (Entra ID's group overage link is not followed).
