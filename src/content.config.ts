import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The docs repo (../docs) is the single source of truth. Its Markdown has no frontmatter;
// titles come from the first H1 (see src/lib/docs.ts).
const research = defineCollection({
  loader: glob({ pattern: '[0-9][0-9]-*.md', base: '../docs/research' }),
  schema: z.object({}).passthrough(),
});

const architecture = defineCollection({
  loader: glob({ pattern: '*.md', base: '../docs/architecture' }),
  schema: z.object({}).passthrough(),
});

export const collections = { research, architecture };
