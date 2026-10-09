// Card metadata for the research notes in ../docs/research. Titles on note pages come from
// the Markdown itself; these short blurbs summarise each note's own summary paragraph.
export interface ResearchMeta {
  slug: string;
  num: string;
  short: string;
  blurb: string;
  tags: string[];
  platform?: string;
}

export const RESEARCH: ResearchMeta[] = [
  {
    slug: '01-semantic-caching-and-rust-vector-stack',
    num: '01',
    short: 'Semantic caching, prefix/KV reuse and the Rust vector stack',
    blurb: 'Static-threshold semantic caches give false hits, shared caches leak across tenants, and steering provider prompt caches is the biggest cheap win.',
    tags: ['caching', 'vectors', 'isolation', 'rust'],
    platform: '/platform/caching/',
  },
  {
    slug: '02-intent-classification-and-routing',
    num: '02',
    short: 'Intent classification and LLM routing',
    blurb: 'Simple routers match complex ones: most of the routing gain comes from the task type. Staged rules → kNN → small encoder → LLM fallback.',
    tags: ['routing', 'classification', 'bandits'],
    platform: '/platform/routing/',
  },
  {
    slug: '03-ontology-and-datasource-layer',
    num: '03',
    short: 'Ontology and datasource layer',
    blurb: 'Raw text-to-SQL on enterprise schemas scores ~10–16%. Bounded choices over a curated semantic graph, compiled deterministically, do far better.',
    tags: ['ontology', 'text-to-sql', 'datafusion', 'mcp'],
    platform: '/platform/ontology/',
  },
  {
    slug: '04-agent-orchestration',
    num: '04',
    short: 'Agent orchestration (“nodes”), MCP and A2A',
    blurb: 'Free-form multi-agent systems fail often. Typed, durable, budgeted graphs with plan-then-execute give cost, latency and security wins.',
    tags: ['agents', 'mcp', 'a2a', 'security'],
    platform: '/platform/nodes/',
  },
  {
    slug: '05-anonymization-and-privacy',
    num: '05',
    short: 'Anonymization and privacy',
    blurb: 'No single PII detector is enough; realistic surrogates beat placeholders; embeddings and caches are leakage channels; pseudonymized data is still personal data.',
    tags: ['privacy', 'pii', 'gdpr', 'embeddings'],
    platform: '/platform/privacy/',
  },
  {
    slug: '06-rag-and-token-efficiency',
    num: '06',
    short: 'RAG and token efficiency',
    blurb: 'Hybrid retrieval with rerank, a token budget instead of a stuffed window, adaptive retrieval, and compression off by default.',
    tags: ['rag', 'tokens', 'latency', 'compression'],
    platform: '/platform/caching/',
  },
  {
    slug: '07-gateway-serving-and-sovereign-deployment',
    num: '07',
    short: 'Gateway landscape, model serving and sovereign deployment',
    blurb: 'The gateway market is crowded but split. No product combines streaming PII rehydration, data-aware routing, a multi-tenant control plane and one binary for SaaS, VPC and air-gap.',
    tags: ['gateway', 'serving', 'sovereign', 'eu-ai-act'],
    platform: '/deployment/',
  },
  {
    slug: '08-ontology-deep-dive-nosql',
    num: '08',
    short: 'Ontology deep dive: MongoDB as the warehouse',
    blurb: 'Never let the LLM write MQL. It emits a typed query IR (CQIR) that a Rust compiler lowers to a validated pipeline or to SQL over a CDC replica.',
    tags: ['ontology', 'mongodb', 'cqir', 'cdc'],
    platform: '/platform/ontology/',
  },
  {
    slug: '09-open-models-on-prem',
    num: '09',
    short: 'Open-weight models on-prem',
    blurb: 'The Qwen lineup, licences, tool and reasoning parsers, KV arithmetic and a recommended model per hardware tier.',
    tags: ['open-models', 'qwen', 'vllm', 'hardware'],
    platform: '/platform/open-models/',
  },
];

export const researchBySlug = (slug: string) => RESEARCH.find((r) => r.slug === slug);
