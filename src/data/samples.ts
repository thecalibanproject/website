// Code samples shown on the site. Sources are noted per sample; keep them in sync with core/.

/** core/crates/caliban-ontology/src/compile/mod.rs → fixtures::query() */
export const CQIR = `{
  "ir_version": "1",
  "ontology_version": "acme@42",
  "metrics":    [{ "id": "metric.gross_revenue" }],
  "dimensions": [{ "id": "OrderLine.category" }],
  "filters": [
    { "attr": "Customer.region",  "op": "eq", "value": { "type": "string", "v": "EU" } },
    { "attr": "Order.created_at", "op": "between", "half_open": true,
      "value": { "type": "timestamp_range", "v": ["2026-07-01T00:00:00Z", "2026-10-01T00:00:00Z"] } }
  ],
  "order_by": [{ "metric": "metric.gross_revenue", "dir": "desc" }],
  "limit": 5,
  "freshness": "PT15M"
}`;

/** core/crates/caliban-ontology/src/compile/mongo.rs → tests::compiles_the_reference_example (expected pipeline) */
export const PIPELINE = `[
  { "$match": {
      "status": { "$in": ["paid", "shipped"] },
      "salesOrg": { "$in": ["EU-1", "EU-2"] },
      "createdAt": { "$gte": { "$date": "2026-07-01T00:00:00Z" },
                     "$lt":  { "$date": "2026-10-01T00:00:00Z" } } } },
  { "$lookup": { "from": "customers", "localField": "customerId", "foreignField": "_id",
                 "as": "__customer",
                 "pipeline": [ { "$project": { "_id": 1, "region": 1 } } ] } },
  { "$unwind": "$__customer" },
  { "$match": { "__customer.region": { "$eq": "EU" } } },
  { "$unwind": "$lines" },
  { "$group": { "_id": "$lines.category",
                "gross_revenue": { "$sum": { "$multiply": ["$lines.qty", "$lines.unitPrice"] } } } },
  { "$project": { "_id": 0, "category": "$_id", "gross_revenue": 1 } },
  { "$sort": { "gross_revenue": -1 } },
  { "$limit": 5 }
]`;

/** core/crates/caliban-ontology/src/compile/sql.rs → tests::compiles_the_reference_example (expected SQL) */
export const SQL = `SELECT t1."category" AS "category", SUM((t1."qty" * t1."unit_price")) AS "gross_revenue"
FROM "orders" t0
JOIN "orders__lines" t1 ON t1."_parent_id" = t0."_id"
JOIN "customers" t2 ON t2."_id" = t0."customer_id"
WHERE t0."status" IN ('paid', 'shipped')
  AND t0."sales_org" IN ('EU-1', 'EU-2')
  AND t2."region" = 'EU'
  AND t0."created_at" >= TIMESTAMP '2026-07-01T00:00:00Z' AND t0."created_at" < TIMESTAMP '2026-10-01T00:00:00Z'
GROUP BY t1."category"
ORDER BY "gross_revenue" DESC
LIMIT 5`;

/** A node spec that validates against core/schemas/node.schema.json (shape from research 04 §1). */
export const NODE_YAML = `# invoice-triage@v7  (validated against core/schemas/node.schema.json)
kind: workflow
description: Triage incoming vendor invoices and route approvals
prompt:
  system: You triage vendor invoices for the finance team.
model_policy:                       # handed to the router, not a fixed model
  intent_classes: [extraction, reasoning]
  candidates: [tier:small, tier:frontier]
  escalate_on: [schema_violation, low_confidence]
  max_cost_usd: 0.05
  min_trust_tier: t0_sovereign
tools:                              # pinned and hashed MCP tools, other nodes
  - { ref: "mcp://erp/lookup_invoice#sha256:…", effect: read }
  - { ref: "mcp://erp/approve_invoice#sha256:…", effect: write,
      requires: [untainted_args, human_approval>1000usd] }
  - { ref: "node://vendor-risk@v3", effect: read }
datasources: { scopes: [erp.invoices:read, docs.vendor_contracts:read] }
guardrails: { pii: reversible, injection_mode: plan_then_execute }
budgets: { steps: 20, depth: 3, fanout: 8, tokens: 200000, wall_clock_s: 120 }
exposure: { http: true, mcp_tool: true, a2a_agent: true }
graph:
  vertices:
    - { id: plan,    type: llm }
    - { id: lookup,  type: tool }
    - { id: risk,    type: subnode }
    - { id: check,   type: verify, max_iterations: 2 }
    - { id: approve, type: human }
  edges:
    - { from: plan,   to: lookup }
    - { from: plan,   to: risk }
    - { from: lookup, to: check }
    - { from: risk,   to: check }
    - { from: check,  to: approve, when: "amount > 1000" }`;

/** core/config/open-models.example.toml (excerpt) */
export const OPEN_MODELS_TOML = `# 1×48/80 GB tier: Qwen3.8-27B-FP8 (vLLM). compose profile: qwen3-large
[[providers]]
id = "vllm-qwen3-large"
kind = "openai_compatible"
base_url = "http://qwen3-large:8000/v1"
trust_tier = "t0_sovereign"
cache_salt = true

[[models]]
id = "local/qwen3.8-27b"
provider = "vllm-qwen3-large"
upstream_model = "Qwen/Qwen3.8-27B-FP8"
kind = "chat"
family = "qwen3.8"
trust_tier = "t0_sovereign"
licence = "apache-2.0"
# Native 262144 (YaRN to 1M). 131072 fits 1×48 GB with fp8 KV; use 262144 on 1×80 GB.
context_window = 131072
[models.capabilities]
tools = true
vision = true                         # native image/video input
reasoning = "hybrid"
reasoning_control = "enable_thinking" # also accepts reasoning_effort (xhigh default, medium, low)
inline_think_tags = false

[[tenants.routes]]
intent = "analytics"
models = ["local/qwen3.8-27b", "local/gpt-oss-20b", "local/qwen3.6-35b-a3b", "local/qwen3.5-9b"]`;

/** docs/research/09 §3.2: per-request thinking control for Qwen3.5+ (no /think soft switch). */
export const ENABLE_THINKING = `{
  "model": "local/qwen3.6-35b-a3b",
  "messages": [{ "role": "user", "content": "Summarise this ticket thread." }],
  "chat_template_kwargs": { "enable_thinking": false }
}`;

/** docs/research/09 §5: vLLM recipe Caliban relies on. */
export const VLLM_RECIPE = `vllm serve Qwen/Qwen3.8-27B-FP8 --max-model-len 131072 --kv-cache-dtype fp8 \\
  --reasoning-parser qwen3 --enable-auto-tool-choice --tool-call-parser qwen3_coder`;

/** docs/architecture/repos-and-conventions.md → Request extension */
export const EXTENSION = `{ "model": "caliban/auto", "messages": [...],
  "caliban": { "pii": "reversible", "cache": "exact", "datasources": ["sales_dw"],
               "node": "invoice-triage", "max_cost_usd": 0.05, "zdr": true } }`;

/** core/README.md → Quick start */
export const CURL = `curl localhost:8080/v1/chat/completions -H "authorization: Bearer cal_…" -H 'content-type: application/json' \\
  -d '{"model":"caliban/auto","messages":[{"role":"user","content":"hello"}]}'`;

/** sdk-typescript/README.md §2 */
export const TS_SDK = `import { CalibanClient } from '@caliban/sdk';

const caliban = new CalibanClient({
  apiKey: process.env.CALIBAN_API_KEY,  // defaults to $CALIBAN_API_KEY
  baseURL: 'http://localhost:8080/v1',  // defaults to $CALIBAN_BASE_URL or this value
  defaultCaliban: { pii: 'reversible' }, // merged into every request (request keys win)
});

const completion = await caliban.chat.completions.create({
  model: 'caliban/auto',
  messages: [{ role: 'user', content: 'Which invoices are overdue for ACME?' }],
  caliban: {
    pii: 'reversible',          // off | mask | reversible
    cache: 'exact',             // off | exact | semantic
    datasources: ['sales_dw'],
    node: 'invoice-triage',
    max_cost_usd: 0.05,
    reasoning: 'low',           // off | low | medium | high (reasoning models only)
    zdr: true,                  // zero data retention
  },
});`;

/** sdk-typescript/README.md §1 */
export const TS_OPENAI = `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.CALIBAN_API_KEY, // cal_…
  baseURL: 'http://localhost:8080/v1',
});

const { data, response } = await openai.chat.completions
  .create({
    model: 'caliban/auto',
    messages: [{ role: 'user', content: 'Summarise last quarter’s churn.' }],
    // @ts-expect-error Caliban extension
    caliban: { pii: 'reversible', cache: 'semantic', datasources: ['sales_dw'] },
  })
  .withResponse();

console.log(response.headers.get('x-caliban-routed-model'), response.headers.get('x-caliban-cache'));`;

/** sdk-python/README.md §2 */
export const PY_SDK = `from caliban import Caliban, CalibanOptions

client = Caliban(api_key="cal_...", base_url="http://localhost:8080/v1")
# or set CALIBAN_API_KEY / CALIBAN_BASE_URL and call Caliban()

resp = client.chat.completions.create(
    model="caliban/auto",
    messages=[{"role": "user", "content": "Which vendors are overdue?"}],
    caliban=CalibanOptions(
        pii="reversible",  # off | mask | reversible
        cache="semantic",  # off | exact | semantic
        datasources=["erp"],
        node="invoice-triage",
        max_cost_usd=0.05,
        reasoning="low",  # off | low | medium | high (reasoning models only)
        zdr=True,
    ),
    temperature=0,
)`;

/** sdk-python/README.md §1 */
export const PY_OPENAI = `from openai import OpenAI

client = OpenAI(base_url="http://localhost:8080/v1", api_key="cal_...")  # tenant key

resp = client.chat.completions.create(
    model="caliban/auto",  # router decides; or a tenant alias / registry id
    messages=[{"role": "user", "content": "Summarise Q3 sales"}],
    extra_body={"caliban": {
        "pii": "reversible", "cache": "exact", "datasources": ["sales_dw"],
    }},
)`;

/** Anthropic SDK against Caliban (core/README.md: base_url=http://<host>:8080, api_key=cal_…) */
export const ANTHROPIC_PY = `from anthropic import Anthropic

client = Anthropic(base_url="http://localhost:8080", api_key="cal_...")
msg = client.messages.create(
    model="caliban/auto", max_tokens=512,
    messages=[{"role": "user", "content": "Summarise Q3 sales"}],
)`;
