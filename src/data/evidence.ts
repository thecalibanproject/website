// Published third-party results quoted in docs/research/03 and 08, each linked to its source.
// These are not Caliban measurements.
export interface Bar {
  label: string;
  detail: string;
  lo: number;
  hi: number;
  value: string;
  highlight?: boolean;
  caveat?: string;
  sources: { label: string; href: string }[];
}
export interface EvidenceSet {
  id: string;
  tab: string;
  title: string;
  note: string;
  bars: Bar[];
}

// Every number below is a published result quoted in docs/research/03 and 08, with its link.
export const EVIDENCE: EvidenceSet[] = [
  {
    id: 'sql',
    tab: 'Enterprise data questions',
    title: 'Correct answers on enterprise data questions',
    note: 'Different benchmarks and models. The pattern, not a single head-to-head, is the point: the same kind of model does far better when it reasons over a curated semantic model than over raw schemas.',
    bars: [
      {
        label: 'Raw text-to-SQL on enterprise schemas',
        detail: 'BEAVER ~10.8–11.4% · EntSQL 15.9% · data.world insurance 16% zero-shot',
        lo: 10, hi: 16, value: '~10–16%',
        sources: [
          { label: 'BEAVER', href: 'https://arxiv.org/abs/2409.02038' },
          { label: 'EntSQL', href: 'https://arxiv.org/abs/2606.03363' },
          { label: 'Sequeda et al. 2023', href: 'https://arxiv.org/abs/2311.07509' },
        ],
      },
      {
        label: 'LLM over a knowledge graph / ontology',
        detail: '54% over the KG representation · 72% with ontology-based query checking and repair',
        lo: 54, hi: 72, value: '54–72%',
        sources: [
          { label: 'Sequeda et al. 2023', href: 'https://arxiv.org/abs/2311.07509' },
          { label: 'Allemang 2024', href: 'https://arxiv.org/abs/2405.11706' },
        ],
      },
      {
        label: 'Governed semantic layer, in-scope questions',
        detail: '98.2–100% vs 84.1–90.0% text-to-SQL on the same modelled schema',
        lo: 98, hi: 100, value: '98–100%', highlight: true,
        caveat: 'Vendor blog, 11 questions × 20 runs. Out-of-scope questions error out instead of being silently wrong.',
        sources: [{ label: 'dbt Labs 2026', href: 'https://docs.getdbt.com/blog/semantic-layer-vs-text-to-sql-2026' }],
      },
    ],
  },
  {
    id: 'mql',
    tab: 'MongoDB / NoSQL',
    title: 'Text-to-MQL on realistic MongoDB data',
    note: 'On MongoDB-native documents (nested arrays, sparse paths, dynamic keys), free-form query generation mostly fails, and 61.5% of failures return wrong rows without an error.',
    bars: [
      {
        label: 'Schema-only prompting',
        detail: 'TEND v3, DeepSeek-V4-Flash backbone, execution accuracy',
        lo: 0.2, hi: 0.2, value: '0.2%',
        sources: [{ label: 'TEND v3', href: 'https://arxiv.org/abs/2502.11201' }],
      },
      {
        label: 'Best published solver (SAG)',
        detail: 'TEND v3: schema-as-data grounding + execution repair',
        lo: 35.8, hi: 35.8, value: '35.8%',
        sources: [{ label: 'TEND v3', href: 'https://arxiv.org/abs/2502.11201' }],
      },
      {
        label: 'Ontology-mediated target',
        detail: '92.5% vs 25% for direct LLM-to-NoSQL, Llama-3.1-8B on one H100',
        lo: 92.5, hi: 92.5, value: '92.5%', highlight: true,
        caveat: 'Different benchmark: an IoT telemetry lake (Cassandra/KairosDB), 100 questions from 12 templates. Optimistic and not directly comparable with TEND.',
        sources: [{ label: 'VKG for IoT telemetry, 2025', href: 'https://arxiv.org/abs/2506.22267' }],
      },
    ],
  },
];
