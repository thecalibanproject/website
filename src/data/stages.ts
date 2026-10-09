// The request path, in the gateway's real order (core/crates/caliban-gateway/src/pipeline.rs):
// auth + limits → route → PII protect → reservation → cache → upstream (fallbacks) → stream + rehydrate → meter + trace.
// Grounding (ontology/CQIR) is built as a compiler + MongoDB connector + replica; wiring it into the gateway is in progress.
export interface Stage {
  id: string; // matches the radar ring ids (#stage-<id>)
  code: string;
  name: string;
  claim: string;
  body: string;
  before: string;
  after: string;
  status: 'built' | 'partial';
  statusNote: string;
  crates: string[];
  link: { label: string; href: string };
}

export const STAGES: Stage[] = [
  {
    id: 'clear', code: 'CLR', name: 'Clear',
    claim: 'Identify the caller, apply policy, reserve the budget.',
    body: 'A cal_ key resolves to a tenant (only its SHA-256 is stored). Per-tenant and per-key rate limits run, and the prompt estimate plus max_tokens is reserved against token and spend budgets, then settled to real usage.',
    before: `POST /v1/chat/completions
authorization: Bearer cal_9f3c…
{ "model": "caliban/auto", "messages": [...] }`,
    after: `tenant   acme          key  ci
limits   600 rpm · 400k tpm
reserve  1,420 tok  → settled 1,187
over?    429 · retry-after: 3`,
    status: 'built', statusNote: 'Built: auth, GCRA limits, token/USD reservations. Shared Valkey store next.',
    crates: ['caliban-gateway', 'caliban-meter'],
    link: { label: 'Developers', href: '/developers/' },
  },
  {
    id: 'route', code: 'RTE', name: 'Route',
    claim: 'Send it to the cheapest model that clears the bar.',
    body: 'The intent picks a route; the route lists candidates in order, filtered by trust tier, capabilities (tools, vision) and licence. Failures fall back to the next candidate. The destination decides how much screening the request needs.',
    before: `"model": "caliban/auto"
user: "Which categories drove EU
       revenue in Q3?"`,
    after: `intent      analytics   (stage: rules)
candidates  local/qwen3.8-27b
            openai/gpt-5-mini  (BYOK)
tier        t0_sovereign → no egress`,
    status: 'partial', statusNote: 'Built: rules, route tables, fallbacks, capability filter. Keyword classifier today; kNN and ONNX heads next.',
    crates: ['caliban-route'],
    link: { label: 'Routing', href: '/platform/routing/' },
  },
  {
    id: 'screen', code: 'PII', name: 'Screen',
    claim: 'Personal data never crosses your boundary.',
    body: 'Patterns with validators plus an in-process multilingual NER model find personal data. When the route leaves your boundary, each value is swapped for a realistic surrogate of the same type; a sovereign route keeps the text as it is.',
    before: `Sarah Johnson (sarah.j@acme.com)
asked Kevin Park to visit Denver
card 4111 1111 1111 1111`,
    after: `Elena Moreau (priya.novak42@example.net)
asked Mateo Lindqvist to visit Castlemere
card 4929 6150 2213 8809   (valid Luhn)`,
    status: 'built', statusNote: 'Built: patterns, NER model (~23 languages, MIT), surrogates, vault. Credentials block the request.',
    crates: ['caliban-pii'],
    link: { label: 'Privacy', href: '/platform/privacy/' },
  },
  {
    id: 'cache', code: 'CCH', name: 'Cache',
    claim: 'Never pay twice for the same answer.',
    body: 'The exact cache keys on the tenant, the exact upstream body, the caller’s permissions and the datasource versions, so a data change or a permission change is a miss. Provider prompt caches are steered with a per-tenant identity, never pooled keys.',
    before: `temperature: 0
upstream body  sha… 41e2
acl  sales:read   epochs  dw@1187`,
    after: `key   blake3(tenant ‖ body ‖ acl ‖ epochs)
hit   → 0 tokens upstream
salt  cache_salt=hmac(tenant)  (vLLM)`,
    status: 'partial', statusNote: 'Built: exact cache, tenant isolation, cache_salt on shared GPUs. Semantic cache planned.',
    crates: ['caliban-cache'],
    link: { label: 'Caching', href: '/platform/caching/' },
  },
  {
    id: 'ground', code: 'GND', name: 'Ground',
    claim: 'The model picks. The compiler writes.',
    body: 'For a data question, the model emits typed CQIR that names ontology ids only. A deterministic Rust compiler injects row policies and lowers it to a linted MongoDB pipeline, or to SQL over a change-stream replica. Free-form text-to-MQL never runs.',
    before: `{ "metrics":    [{ "id": "metric.gross_revenue" }],
  "dimensions": [{ "id": "OrderLine.category" }],
  "filters": [{ "attr": "Customer.region",
                "op": "eq", "value": "EU" }] }`,
    after: `[{ "$match": { "status": { "$in": ["paid","shipped"] },
               "salesOrg": { "$in": ["EU-1","EU-2"] } } },
 { "$lookup": { "from": "customers", … } },
 { "$unwind": "$lines" }, { "$group": … }]
same rows on the replica lane (tested)`,
    status: 'partial', statusNote: 'Built: CQIR compiler, MongoDB connector, CDC replica, planner. Gateway wiring in progress.',
    crates: ['caliban-ontology', 'caliban-connect', 'caliban-replica'],
    link: { label: 'Ontology', href: '/platform/ontology/' },
  },
  {
    id: 'core', code: 'LND', name: 'Land',
    claim: 'Answered on hardware you control.',
    body: 'The call goes to your own model servers (vLLM, SGLang, llama.cpp, Ollama) or to a provider with your key. Streams are restored as they arrive, surrogates split across chunks included, and a model’s inline thinking is separated from the answer.',
    before: `data: {"delta":{"content":"<think>check Q3"}}
data: {"delta":{"content":"</think>Elena Mo"}}
data: {"delta":{"content":"reau leads…"}}`,
    after: `reasoning  "check Q3"
content    "Sarah Johnson leads…"
x-caliban-routed-model: local/qwen3.8-27b`,
    status: 'built', statusNote: 'Built: OpenAI and Anthropic APIs, streaming rehydration, think-tag split, embeddings, rerank.',
    crates: ['caliban-gateway', 'caliban-providers'],
    link: { label: 'Open models', href: '/platform/open-models/' },
  },
  {
    id: 'log', code: 'LOG', name: 'Log',
    claim: 'Every request accounted for, no content kept.',
    body: 'One usage event per request with tokens, cost, cache and PII counts. Control-plane changes append to a hash-chained audit log. OpenTelemetry spans follow the GenAI conventions and never record prompts or answers.',
    before: `response 200 · 1,187 + 312 tokens
cache miss · 3 PII surrogated`,
    after: `usage  { "tokens_saved": 0, "cost_usd": 0,
         "cache": "miss", "pii_entities": 3 }
audit  seq 4182  hash 9c1e…  chain ✓
span   chat local/qwen3.8-27b  (no content)`,
    status: 'built', statusNote: 'Built: usage WAL, audit hash chain, OTel GenAI spans (export off by default).',
    crates: ['caliban-meter', 'caliban-cp'],
    link: { label: 'Architecture', href: '/architecture/' },
  },
];
