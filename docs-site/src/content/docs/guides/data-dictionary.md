---
title: Data dictionary
description: Review the entries a scan suggests, approve them in bulk, and understand dictionary versions.
---

The data dictionary (`ontology` in the API) gives your database business names and meanings, reviewed by a person. Assistants can only query what is approved. [The data dictionary](../concepts/data-dictionary.md) explains why.

In the console, open **Data dictionary** (labelled **Ontology** or **Ontology studio** in consoles before the rename) and pick the workspace. You need `ontology.review`.

Entries come in kinds: things (entities, such as `Order`), details (attributes, such as `Order.total`), links (relations, such as an order's customer), measures (metrics), groupings (dimensions), alternative names, rules (policies) and saved questions.

## Review suggestions

Suggestions come from a [scan](data-connections.md#scan-the-schema), or from a file you import.

1. Open the **Review queue**. Suggested entries are listed least confident first.
2. For each entry, read its name, description and spec, then choose **Approve** or **Reject**. Add a **Review note** if you want the reason kept in the audit log.
3. Deprecate an approved entry that should no longer be used.

Each decision is one new dictionary version. For a database with many collections, use [bulk approval](#bulk-approve) instead.

To import entries made elsewhere (an exported model, a curated file), choose **Propose elements** and paste the JSON. They arrive as suggestions in one version. Importing the same file again changes nothing and keeps your decisions.

:::tip
Approve what your assistants need first. An entry an assistant does not use can stay suggested.
:::

## Bulk approve

Approving one entry at a time is slow: the health demo's dictionary had 78 entries. The admin API takes a batch of decisions as one version:

```sh
curl -s http://caliban.internal:8081/api/v1/tenants/medmarket/ontology/review \
  -H "authorization: Bearer $ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"decisions": [
        {"id": "Service", "decision": "approve"},
        {"id": "Service.city", "decision": "approve"},
        {"id": "rel.slot_facility", "decision": "reject"}
      ]}'
```

Decisions are `approve`, `reject` and `deprecate`. A batch that changes nothing makes no version. Every batch is audited with its decisions.

:::caution[Coming soon]
Bulk select and approve in the console, and a keyboard review queue (approve, reject, edit). Today, the console reviews one entry at a time; for a batch, use `POST /api/v1/tenants/{t}/ontology/review` as above, as the health, law and fintech demos did.
:::

## Versions

The dictionary is versioned. Each review batch, import or scan makes one version, numbered per workspace. Each entry records the version in which it last changed (**Changed in** in the console).

Why it matters: a published assistant's fixed queries name the dictionary version they were written for (`"ontology_version": "medmarket@52"`). They keep working on later versions as long as nothing they touch has changed.

- **Compatible changes** keep assistants working: approving new entries, rejecting suggestions, editing entries the assistant does not use.
- **Breaking changes** are caught at review time. If you reject or deprecate an approved entry that a published assistant uses, Caliban refuses and names the affected versions (for example `triage@v3`). The console then asks you to confirm **I understand these node versions will fail on their queries**. Through the API, send `"acknowledge_breaking": true`.
- After a breaking change, the affected assistant versions fail on that query until you publish a version written for the new dictionary.

When you publish an assistant, Caliban checks that every fixed query names an existing version and still compiles on it. See [Assistants and versions](../concepts/assistants-and-versions.md).
