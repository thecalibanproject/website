// Build status per crate. Source: core/README.md "Layout" table (✅ = built, ⏳ = in progress).
export type State = 'built' | 'wip';
export interface CrateStatus {
  crate: string;
  parts: { state: State; label: string }[];
  role: string;
}

export const CRATES: CrateStatus[] = [
  { crate: 'caliban-types', parts: [{ state: 'built', label: 'Built' }], role: 'Ids, trust tiers, PII/cache modes, errors' },
  { crate: 'caliban-config', parts: [{ state: 'built', label: 'Built' }], role: 'TOML config → indexed snapshot behind ArcSwap; secret refs (env, file, sealed AES-256-GCM under CALIBAN_KEK)' },
  { crate: 'caliban-ir', parts: [{ state: 'built', label: 'OpenAI' }, { state: 'built', label: 'Anthropic' }], role: 'Canonical request IR; unknown fields pass through; canonical hashing for cache keys; Anthropic Messages ⇄ IR codecs; SSE parser' },
  { crate: 'caliban-pii', parts: [{ state: 'built', label: 'L0' }, { state: 'built', label: 'L1 NER (ner feature)' }], role: 'Regex + validators (Luhn, IBAN, SSN), tenant dictionaries, in-process multilingual NER (ONNX, MIT-licensed model, hash-verified artifact), realistic surrogates, vault, streaming rehydration with hold-back' },
  { crate: 'caliban-cache', parts: [{ state: 'built', label: 'T1' }, { state: 'wip', label: 'T2' }], role: 'Exact cache (moka), tenant + ACL + datasource-epoch keys; semantic cache trait' },
  { crate: 'caliban-route', parts: [{ state: 'built', label: 'Rules + placeholder classifier' }, { state: 'wip', label: 'kNN / ONNX' }], role: 'Intent → ordered candidates, trust-tier constraints, fallbacks' },
  { crate: 'caliban-providers', parts: [{ state: 'built', label: 'OpenAI-compatible' }, { state: 'built', label: 'Anthropic' }, { state: 'wip', label: 'Bedrock / Vertex' }], role: 'BYOK upstream calls; covers vLLM, SGLang, llama.cpp, Ollama; Anthropic native passthrough or translation' },
  { crate: 'caliban-meter', parts: [{ state: 'built', label: 'Built' }, { state: 'wip', label: 'Valkey quotas' }], role: 'Usage events, cost, in-memory ring + JSONL WAL; GCRA request rate, token/USD budgets with reservation + settlement' },
  { crate: 'caliban-ontology', parts: [{ state: 'built', label: 'Compiler' }, { state: 'wip', label: 'Store / retrieval' }], role: 'CSM types + CQIR compiler → MongoDB pipeline (with lint) or SQL for the CDC replica' },
  { crate: 'caliban-connect', parts: [{ state: 'built', label: 'MongoDB' }, { state: 'wip', label: 'SQL / REST sources' }], role: 'Connector trait; MongoDB: read-only privilege check, stratified sampling, reference discovery, ontology bootstrap, native-lane executor + explain gate, epochs' },
  { crate: 'caliban-replica', parts: [{ state: 'built', label: 'v1' }], role: 'CDC replica: snapshot + change streams → Arrow → Parquet, queried with DataFusion; watermark = last applied clusterTime' },
  { crate: 'caliban-nodes', parts: [{ state: 'built', label: 'Spec / budgets' }, { state: 'wip', label: 'Executor' }], role: 'Node spec validation (pinned tools, bounded cycles), hierarchical budget ledger' },
  { crate: 'caliban-rag', parts: [{ state: 'built', label: 'RRF / budget' }, { state: 'wip', label: 'Index' }], role: 'Rank fusion, token-budgeted context selection' },
  { crate: 'caliban-mcp', parts: [{ state: 'built', label: 'Pinning' }, { state: 'wip', label: 'rmcp' }], role: 'Tool-manifest pinning against description poisoning' },
  { crate: 'caliban-gateway', parts: [{ state: 'built', label: 'Built' }], role: 'Data-plane HTTP app: one pipeline for /v1/chat/completions and Anthropic /v1/messages, embeddings, rate limits, OTel GenAI tracing' },
  { crate: 'caliban-cp', parts: [{ state: 'built', label: 'Memory + Postgres stores' }, { state: 'built', label: 'Audit chain' }, { state: 'built', label: 'Signed snapshots' }], role: 'Admin API per api/openapi.yaml; every mutation is one transaction + one hash-chained audit row; serves signed snapshots to split-mode routers' },
];

export const crates = (...names: string[]) => names.map((n) => CRATES.find((c) => c.crate === n)!).filter(Boolean);
