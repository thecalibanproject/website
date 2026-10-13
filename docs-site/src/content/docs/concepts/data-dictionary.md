---
title: The data dictionary
description: Why assistants query your database through reviewed business names, and how a query plan becomes a safe database query.
---

The [data dictionary](../reference/glossary.md#data-dictionary) (the ontology, or Caliban Semantic Model, in the API) holds the business names and meanings of your database: what an order is, which field is a customer's city, how a refund relates to a transaction. A person reviews every [entry](../reference/glossary.md#entry). Assistants can only query what has been approved.

## Why not let the model write queries

A model that writes MongoDB pipelines or SQL itself can write a query that is wrong, slow, or reads more than it should, and nothing checks it before it runs. Caliban splits the job:

1. The model picks from the approved entries: which measure, which groupings, which filters. That choice is a small typed document, the [query plan](../reference/glossary.md#query-plan) (CQIR in the API).
2. A compiler written in Rust turns the query plan into a database query. It is deterministic: the same plan always gives the same query.

The model makes a bounded choice; code writes, checks and runs the query. A model cannot name a collection or a field that is not in the dictionary, because the plan only accepts entry ids.

## Two ways to run a query

The compiler writes one of two queries from the same plan:

- **A MongoDB aggregation pipeline**, run on your database, read-only, against a replica tagged for analytics so assistant queries never compete with your application.
- **SQL over a copy**, run on a replica that Caliban keeps up to date from MongoDB's change stream, in columnar files. This suits heavy analytical questions.

Both give the same rows; this is tested on a real replica set.

Before a pipeline runs, Caliban asks MongoDB to explain it. A query that would scan a whole collection instead of using an index can be refused. Every operation also carries a time limit (15 seconds by default) and a row cap.

## Read-only, by construction

When you add a [data connection](../reference/glossary.md#data-connection), Caliban checks that its database user can only read. A user with any write or admin right is refused. Credentials are encrypted under your workspace's key and shown redacted.

## How the dictionary gets built

You do not write it from scratch. A [scan](../reference/glossary.md#scan) samples every collection and suggests entries: one thing per collection, details for its fields, links where a field points to another collection's ids, and embedded things for arrays of documents. Names come from fixed rules (`orders` becomes `Order`, `createdAt` becomes `created_at`). Everything a scan finds is **suggested**, never approved: a person reviews it. Entries can also be imported from a file.

In the health demo, the review queue held 78 entries across seven kinds.

## Kinds of entries

| Plain name | API name | What it is |
|---|---|---|
| Thing | entity | A kind of record: an order, a patient, a matter |
| Detail | attribute | A field of a thing: the order's date, the matter's client |
| Link | relation | How two things connect: an order belongs to a customer |
| Measure | metric | A number to compute: total refunded, count of open matters |
| Grouping | dimension | A way to split a measure: by month, by city |
| Also called | glossary term | Other words people use for an entry |
| Rule | policy | A restriction applied to every query, always as it is now |
| Saved question | verified query | A query plan a person checked |

## Versions keep assistants working

Every review batch, import or scan makes one new version of the dictionary. A query plan names the version it was written for, and it keeps compiling on later versions as long as nothing it uses has changed. Approving new entries or editing ones the query does not touch is safe.

Withdrawing an entry that a live assistant's fixed query uses is refused at review time, naming the assistants it would break, unless the reviewer confirms. See [Data dictionary](../guides/data-dictionary.md#versions).

## What is not built yet

- The AI pass of the scan (suggesting names, descriptions and personal-data classes from redacted samples). Names come from fixed rules today.
- SQL databases and REST sources as data connections. MongoDB is the only kind with a query lane today.

## Related

- [Data connections](../guides/data-connections.md): connect MongoDB and scan it.
- [Data dictionary guide](../guides/data-dictionary.md): review suggestions, approve in bulk, versions.
