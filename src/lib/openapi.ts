// Build-time reader for ../core/api/openapi.yaml (the API contract owned by core/).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

export const OPENAPI_PATH = resolve(process.cwd(), '../core/api/openapi.yaml');

type Obj = Record<string, any>;

export interface Operation {
  method: string;
  path: string;
  summary: string;
  tag: string;
  plane: 'data' | 'control';
  auth: string;
  responses: string[];
}

export interface Field {
  name: string;
  type: string;
  values?: string[];
  default?: string;
  description?: string;
}

export interface Header {
  name: string;
  type: string;
  values?: string[];
  description?: string;
}

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

function load(): Obj {
  return parse(readFileSync(OPENAPI_PATH, 'utf8')) as Obj;
}

function typeOf(schema: Obj | undefined): string {
  if (!schema) return '';
  if (schema.$ref) return String(schema.$ref).split('/').pop() ?? '';
  if (schema.type === 'array') return `${typeOf(schema.items)}[]`;
  if (Array.isArray(schema.type)) return schema.type.join(' | ');
  return schema.type ?? '';
}

export function readOpenApi() {
  const doc = load();
  const globalSecurity = doc.security ?? [];
  const operations: Operation[] = [];
  for (const [path, item] of Object.entries<Obj>(doc.paths ?? {})) {
    for (const m of METHODS) {
      const op = item[m] as Obj | undefined;
      if (!op) continue;
      const plane = path.startsWith('/v1/') ? 'data' : 'control';
      const security: Obj[] = op.security ?? globalSecurity;
      const schemes = security.flatMap((s) => Object.keys(s));
      let auth: string;
      if (security.length === 0) auth = 'None';
      else if (path === '/api/v1/snapshot') auth = 'Router token';
      else if (plane === 'data') auth = schemes.includes('apiKey') ? 'Tenant key (bearer or x-api-key)' : 'Tenant key';
      else auth = 'Admin token';
      operations.push({
        method: m.toUpperCase(),
        path,
        summary: String(op.summary ?? '').trim(),
        tag: (op.tags ?? ['other'])[0],
        plane,
        auth,
        responses: Object.keys(op.responses ?? {}),
      });
    }
  }

  const ext = doc.components?.schemas?.CalibanExtension ?? {};
  const extension: Field[] = Object.entries<Obj>(ext.properties ?? {}).map(([name, s]) => ({
    name,
    type: typeOf(s),
    values: s.enum?.map(String),
    default: s.default === undefined ? undefined : String(s.default),
    description: s.description,
  }));

  const chat200 = doc.paths?.['/v1/chat/completions']?.post?.responses?.['200']?.headers ?? {};
  const msg200 = doc.paths?.['/v1/messages']?.post?.responses?.['200']?.headers ?? {};
  const headers: Header[] = [];
  for (const [name, h] of [...Object.entries<Obj>(chat200), ...Object.entries<Obj>(msg200)]) {
    if (headers.some((x) => x.name === name)) continue;
    headers.push({ name, type: typeOf(h.schema), values: h.schema?.enum?.map(String), description: h.description });
  }

  const rl = doc.components?.responses?.RateLimited ?? {};
  const rateLimitHeaders: Header[] = Object.entries<Obj>(rl.headers ?? {}).map(([name, h]) => ({ name, type: typeOf(h.schema), description: h.description }));

  return {
    title: String(doc.info?.title ?? ''),
    version: String(doc.info?.version ?? ''),
    openapi: String(doc.openapi ?? ''),
    tags: (doc.tags ?? []).map((t: Obj) => String(t.name)),
    operations,
    extension,
    headers,
    rateLimitDescription: String(rl.description ?? '').trim(),
    rateLimitHeaders,
  };
}
