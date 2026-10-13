---
title: Data connections
description: Connect a MongoDB database read-only and scan it, so assistants can answer from your data.
---

A data connection (`datasource` in the API) is a read-only link from one workspace to one of your databases. Once it is connected and scanned, you review the suggested [data dictionary](data-dictionary.md), and assistants can query what you approved. Caliban never writes to your database.

MongoDB is the only kind assistants can query today. The console form also lists other kinds (Postgres, MySQL, SQL Server, Snowflake, BigQuery), but they cannot be scanned or queried yet.

In the console, open **Data connections** (labelled **Datasources** in consoles before the rename). You need `datasources.write`.

## Connect MongoDB

Before you start, create a database user with the `read` role only. Caliban checks the user's privileges and refuses one that can write or administer.

1. Open **Data connections** and choose **Register datasource**.
2. Pick the **Tenant** (the workspace) and **Kind** `mongodb`.
3. Enter a **Name**: a lowercase id such as `shop`. Assistants refer to it in their scopes, for example `shop.orders:read`.
4. Fill the connection:
   - **Connection URI**: `mongodb://reader:...@mongo-0.internal:27017/?replicaSet=rs0`. The password is encrypted under the workspace's data key and shown redacted from then on (`mongodb://reader:****@...`).
   - **Database**: the database to describe, for example `sales`.
   - **Read preference**: keep `secondaryPreferred` so scans and assistant queries stay off your primary.
5. Save.

### Keep queries off the primary

Assistant queries read from a replica tagged for analytics (`readPreference: secondary` with the tag `{workload: analytics}`), so they never compete with your application.

| Your deployment | What to do |
|---|---|
| A replica set with a member tagged `workload: analytics`, or an Atlas analytics node | Nothing |
| A replica set without such a member | Tag one (`cfg = rs.conf(); cfg.members[2].tags = {workload: "analytics"}; rs.reconfig(cfg)`), or set the read preference to `secondaryPreferred` |
| A single server, or `directConnection=true` | Set the read preference to `primary` |

Without a matching member, queries fail after about 10 seconds with a message that names the read preference and these two fixes.

:::tip
To keep the password out of Caliban's store entirely, the API accepts a reference instead of the value: `{"env": "SHOP_MONGO_URI"}` or `{"file": "/run/secrets/shop-uri"}`, resolved on the server.
:::

The API equivalent is `POST /api/v1/tenants/{t}/datasources` with `{"name", "kind": "mongodb", "connection": {"uri", "database", "read_preference"}}`.

## Scan the schema

A scan reads the structure of the database and suggests [data dictionary](data-dictionary.md) entries for you to review.

1. On the connection's row, choose **Introspect** (the scan action).
2. Wait for the **Introspection** column to show the result. A scan of the demo databases took seconds.

What the scan does:
- samples every collection (random documents, plus the newest and the oldest), from a secondary;
- infers fields and their types, finds embedded lists of documents, and checks which fields point at other collections;
- writes one suggested entry per collection, field and link, in one new dictionary version.

Nothing is usable until a person approves it. Names come from simple rules (`orders` becomes `Order`, `createdAt` becomes `created_at`), so plan to rename and describe the entries assistants will use.

Scanning again is safe. Entries you already approved, rejected or deprecated keep your decision, and a scan that finds nothing new makes no new version. Only one scan runs per connection at a time.

The API equivalent is `POST /api/v1/datasources/{id}/introspect` (answers `202`), then `GET /api/v1/datasources/{id}/introspection` for the status (`running`, `succeeded`, `failed`) and the counts.

Next: [review the suggestions](data-dictionary.md#review-suggestions).
