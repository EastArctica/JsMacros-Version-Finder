import type { Build, BuildsData, EnrichedBuild } from './types';

export async function loadBuilds(url = `${import.meta.env.BASE_URL}data/builds.json`): Promise<{
  data: BuildsData | null;
  builds: EnrichedBuild[];
  error?: string;
}> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { data: null, builds: [], error: `Failed to fetch data (${res.status})` };
    }
    const json = (await res.json()) as BuildsData;
    const builds: EnrichedBuild[] = Object.entries(json.versions || {}).flatMap(([mcVersion, arr]: [string, Build[]]) =>
      arr.map((b) => ({ ...b, mcVersion })),
    );
    return { data: json, builds };
  } catch (err) {
    return { data: null, builds: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

export function compareVersions(a: string, b: string): number {
  const ap = a.split('.').map((v) => Number(v) || 0);
  const bp = b.split('.').map((v) => Number(v) || 0);
  const len = Math.max(ap.length, bp.length);
  for (let i = 0; i < len; i++) {
    const av = ap[i] ?? 0;
    const bv = bp[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return ap.length - bp.length;
}

export function sortVersions(values: string[], direction: 'asc' | 'desc' = 'asc'): string[] {
  const uniq = Array.from(new Set(values));
  return uniq.sort((a, b) => (direction === 'asc' ? compareVersions(a, b) : compareVersions(b, a)));
}
