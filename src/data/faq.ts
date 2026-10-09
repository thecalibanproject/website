// FAQ answers grounded in docs/architecture and docs/research. HTML allowed (rendered with set:html).
export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is Caliban?',
    a: 'A single AI endpoint for a company. Your apps call Caliban instead of a provider; Caliban authenticates the tenant, applies policy and quotas, pseudonymizes personal data, checks the cache, routes to a model, grounds data questions in your ontology, and streams the answer back. The data plane is one Rust binary; the control plane stores tenants, keys, models, routes and the ontology in Postgres.',
  },
  {
    q: 'Do I have to change my code?',
    a: 'Mostly the base URL. Any OpenAI SDK works with <code>base_url=http://&lt;host&gt;:8080/v1</code> and a <code>cal_…</code> tenant key, and any Anthropic SDK works against <code>POST /v1/messages</code>. Caliban-specific options go in an optional <code>caliban</code> object that other clients simply ignore.',
  },
  {
    q: 'Can it run completely on-prem, with no internet?',
    a: 'Yes. In the air-gapped shape, <code>caliban standalone</code> runs the router and control plane in one process with local Postgres, Qdrant and Valkey, and open-weight models served by vLLM, SGLang, llama.cpp, Ollama or TEI. Images and weights arrive as a signed offline bundle that is verified on site. Nothing calls home and telemetry is off by default.',
  },
  {
    q: 'Do you pool provider API keys across customers?',
    a: 'No. Caliban is BYOK only: each tenant brings its own provider keys or local endpoints. Research on gateways (KeyPooling, 2026) found that pooled upstream credentials collapse providers’ per-organisation prompt-cache isolation; not pooling removes that leak by construction.',
  },
  {
    q: 'Is pseudonymization the same as anonymization?',
    a: 'No, and Caliban does not claim anonymization. Personal data is replaced with realistic surrogates before it reaches an external model and restored in the answer. Under the EDPB’s 2025 guidelines, pseudonymized data is still personal data; pseudonymization is a recognised safeguard, not an exemption from GDPR.',
  },
  {
    q: 'Does a language model write SQL or MongoDB queries against my database?',
    a: 'Not free-form. For questions in scope of the ontology, the model fills a typed query IR (CQIR) that names ontology ids only, and a deterministic Rust compiler validates it, injects row policies and lowers it to a linted aggregation pipeline or to SQL over a CDC replica. Free-form text-to-MQL is never executed. If nothing in the ontology matches, Caliban asks a clarifying question or says it does not know.',
  },
  {
    q: 'Which models can I run on my own hardware?',
    a: 'The default bundle contains only Apache-2.0 and MIT weights: Qwen3.5-9B, the Qwen3.6-35B-A3B GGUF for CPU-only sites, Qwen3 embedding and reranker models, bge-reranker-v2-m3 and gpt-oss-20b. Larger tiers (Qwen3.8-27B, Qwen3.5-122B and 397B, DeepSeek-V4-Flash, gpt-oss-120b) are optional entries. Models with custom or non-commercial licences stay out unless legal review approves them, and Llama 4 is blocked by default for EU tenants.',
  },
  {
    q: 'How does Caliban cut tokens and cost?',
    a: 'In order of return: steering provider prompt caches with a stable prompt layout (cache reads cost 0.05–0.1× the input price), routing easy intents to cheap models, an exact-match cache invalidated by datasource changes, small models making bounded ontology choices, plan caching for nodes, and a semantic cache only on allowlisted intents. Responses report <code>x-caliban-routed-model</code> and <code>x-caliban-cache</code> so savings are visible.',
  },
  {
    q: 'Is Caliban certified for SOC 2, ISO 27001, HIPAA or the EU AI Act?',
    a: 'No. Caliban is designed to support those obligations (pseudonymization, per-tenant keys, a hash-chained audit log, AI Act transparency metadata), but it holds no certification or attestation. Do not treat anything on this site as a compliance claim.',
  },
  {
    q: 'How mature is it?',
    a: 'This is v0.1. The gateway with OpenAI and Anthropic APIs, PII detection with streaming rehydration, the exact cache, quotas, OpenTelemetry tracing, the Postgres control plane with signed snapshots and audit chain, the MongoDB connector, the CQIR compiler and the CDC replica exist. The semantic cache, learned routing classifiers and the durable node executor are in progress. Latency figures on this site are design targets, not measurements.',
  },
  {
    q: 'Who uses Caliban today?',
    a: 'Caliban is in development with design partners, whom we do not name. There are no public customers, case studies or pricing yet; if you want to be one of the early deployments, talk to us.',
  },
  {
    q: 'What is open source?',
    a: 'The TypeScript SDK (<code>@caliban/sdk</code>) and the Python SDK (<code>caliban-sdk</code>) are Apache-2.0. The core, web console, ML tooling, deployment tooling, docs and this website are proprietary, all rights reserved.',
  },
];
