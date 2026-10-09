// Hardware tiers and recommended models. Source: docs/research/09-open-models-on-prem.md §4.3 and §6,
// and deploy/README.md "Hardware tiers". VRAM/RAM figures there are estimates.
export interface Tier {
  id: string;
  label: string;
  hardware: string;
  chat: string;
  chatAlt?: string;
  engine: string;
  embedding: string;
  reranker: string;
  profiles: string[];
  /** 'compose' for single-host profiles, 'helm' when the tier needs Helm modelPools. */
  via: 'compose' | 'helm';
  composeEnv?: string;
  memory: string;
  bundled: string;
}

export const TIERS: Tier[] = [
  {
    id: 'cpu', label: 'CPU only', hardware: '≥ 32 GB RAM, 16+ cores (64 GB comfortable)',
    chat: 'Qwen3.6-35B-A3B Q4_K_M GGUF', chatAlt: 'Qwen3.5-9B Q4_K_M or gpt-oss-20b MXFP4',
    engine: 'llama.cpp (llama-server); TEI cpu for embeddings and rerank',
    embedding: 'Qwen3-Embedding-0.6B (TEI cpu)', reranker: 'bge-reranker-v2-m3 (TEI cpu)',
    profiles: ['cpu'], via: 'compose',
    memory: '≈ 26 GB RAM total (20.4 GB weights + KV + embedder + reranker)',
    bundled: 'In the default bundle',
  },
  {
    id: '24', label: '1 × 24 GB', hardware: 'L4, A10, RTX 4090 / 3090',
    chat: 'Qwen3.5-9B (online FP8, 128k context)', chatAlt: 'gpt-oss-20b (≈ 13 GB)',
    engine: 'vLLM; TEI GPU for embeddings; vLLM pooling for the reranker',
    embedding: 'Qwen3-Embedding-0.6B (TEI)', reranker: 'Qwen3-Reranker-0.6B (vLLM pooling)',
    profiles: ['qwen3-small', 'embeddings', 'reranker'], via: 'compose',
    memory: '≈ 21 GB of 24 GB; ≈ 120k KV tokens for chat',
    bundled: 'In the default bundle',
  },
  {
    id: '48', label: '1 × 48 GB', hardware: 'L40S, RTX 6000 Ada, A6000',
    chat: 'Qwen3.8-27B-FP8 (128k context, fp8 KV)', chatAlt: 'Qwen3.6-35B-A3B-FP8 for throughput',
    engine: 'vLLM',
    embedding: 'Qwen3-Embedding-0.6B', reranker: 'Qwen3-Reranker-0.6B',
    profiles: ['qwen3-large', 'embeddings', 'reranker'], via: 'compose',
    memory: '≈ 200k KV tokens with fp8 KV (≈ 100k BF16)',
    bundled: 'Optional bundle entry (31–38 GB)',
  },
  {
    id: '80', label: '1 × 80 GB', hardware: 'H100, A100-80G, H200',
    chat: 'Qwen3.8-27B-FP8 at the full 262k context', chatAlt: 'Qwen3.6-35B-A3B-FP8 or gpt-oss-120b (≈ 65 GB)',
    engine: 'vLLM',
    embedding: 'Qwen3-Embedding-4B (Helm) or 0.6B', reranker: 'Qwen3-Reranker-4B (Helm) or 0.6B',
    profiles: ['qwen3-large', 'embeddings', 'reranker'], via: 'compose', composeEnv: 'QWEN3_LARGE_MAX_MODEL_LEN=262144',
    memory: '≈ 320k KV tokens BF16 (≈ 640k FP8)',
    bundled: 'Optional bundle entry',
  },
  {
    id: '2x80', label: '2 × 80 GB', hardware: 'Two 80 GB GPUs',
    chat: 'Qwen3.5-122B-A10B-FP8, tensor-parallel 2',
    engine: 'vLLM via Helm modelPools',
    embedding: 'Qwen3-Embedding-8B', reranker: 'Qwen3-Reranker-8B',
    profiles: ['modelPools (e.g. qwen3-xl)'], via: 'helm',
    memory: '≈ 600k KV tokens; embedder and reranker on a third GPU or lower util',
    bundled: 'Optional bundle entry',
  },
  {
    id: '8x80', label: '4–8 × 80 GB', hardware: '4 to 8 × 80 GB GPUs',
    chat: 'Qwen3.5-397B-A17B-FP8 (TP8) or DeepSeek-V4-Flash (MIT)', chatAlt: 'plus a 1-GPU Qwen3.8-27B-FP8 fast tier',
    engine: 'vLLM via Helm modelPools; llm-d or NVIDIA Dynamo at scale',
    embedding: 'Qwen3-Embedding-8B', reranker: 'Qwen3-Reranker-8B',
    profiles: ['modelPools'], via: 'helm',
    memory: 'Qwen3.5-397B: ≈ 5M KV tokens across 8 GPUs',
    bundled: 'Optional bundle entry',
  },
];

export interface Shape {
  id: string;
  label: string;
  short: string;
  dataPlane: string;
  controlPlane: string;
  models: string;
  connectivity: string;
  included: string[];
}

// docs/architecture/caliban-reference-architecture.md §6 and deploy/README.md
export const SHAPES: Shape[] = [
  {
    id: 'saas', label: 'SaaS', short: 'Operated by Caliban',
    dataPlane: 'Caliban-run regional cells (EU, US)', controlPlane: 'Caliban-hosted',
    models: 'Third-party APIs via BYOK + Caliban-hosted open models', connectivity: 'Internet',
    included: ['Regional data-plane cells', 'Hosted control plane and web console', 'BYOK provider keys, never pooled', 'OpenAI- and Anthropic-compatible endpoints'],
  },
  {
    id: 'vpc', label: 'VPC / dedicated', short: 'Your cloud or cluster',
    dataPlane: 'Your Kubernetes via Helm, single tenant', controlPlane: 'Caliban-hosted (outbound-only link) or self-hosted',
    models: 'BYOK + your GPUs', connectivity: 'Private link; egress per provider, by policy',
    included: ['Helm chart: stateless router (HPA) + control plane', 'Default-deny NetworkPolicy, PSS restricted', 'Model pools on vLLM, SGLang, TEI or llama.cpp', 'Postgres, Qdrant and Valkey (bring your own)'],
  },
  {
    id: 'airgap', label: 'Air-gapped', short: 'Sovereign, no egress',
    dataPlane: 'Your hardware, on-prem', controlPlane: 'Embedded: caliban standalone with local Postgres',
    models: 'Open-weight only, pinned and hashed', connectivity: 'None. Signed offline bundles.',
    included: ['Signed bundle: images + weights + MANIFEST.sha256', 'Verified on site with cosign or minisign', 'Apache-2.0 / MIT weights by default', 'Postgres 17, Qdrant and Valkey containers'],
  },
];

export function commandFor(shape: string, tier: Tier): { kind: 'compose' | 'helm' | 'sdk'; lines: string[] } {
  if (shape === 'saas') {
    return { kind: 'sdk', lines: ['# SaaS: nothing to install. Point any OpenAI SDK at your Caliban endpoint:', 'export OPENAI_BASE_URL="https://<your-caliban-endpoint>/v1"', 'export OPENAI_API_KEY="cal_…"'] };
  }
  const helmValues = shape === 'airgap' ? ' -f helm/caliban/values-airgap.yaml' : '';
  if (shape === 'vpc' || tier.via === 'helm') {
    const lines = [];
    if (shape === 'airgap') lines.push('deploy/airgap/load.sh caliban-bundle-<version>.tar --pubkey caliban-bundle.pub --registry <site-registry> --env-out images.env');
    lines.push(`helm install caliban helm/caliban -n caliban${helmValues}   # model pools: ${tier.profiles.join(', ')}`);
    return { kind: 'helm', lines };
  }
  const profiles = tier.profiles.map((p) => `--profile ${p}`).join(' ');
  const lines = [];
  if (shape === 'airgap') lines.push('deploy/airgap/load.sh caliban-bundle-<version>.tar --pubkey caliban-bundle.pub --models-dest /srv/caliban/models --env-out /srv/caliban/images.env');
  lines.push(`${tier.composeEnv ? tier.composeEnv + ' ' : ''}docker compose ${profiles} up -d`);
  return { kind: 'compose', lines };
}
