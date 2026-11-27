export const GITHUB_RELEASES_API_URL =
  'https://api.github.com/repos/harysuryanto/chrome-native-scroll/releases?per_page=10';
export const GITHUB_RELEASES_PAGE_URL =
  'https://github.com/harysuryanto/chrome-native-scroll/releases';

export interface GitHubReleaseItem {
  readonly tag_name?: string;
  readonly html_url?: string;
  readonly draft?: boolean;
  readonly prerelease?: boolean;
}

export type UpdateCheckResult =
  | {
      readonly status: 'update_available';
      readonly latestVersion: string;
      readonly releaseUrl: string;
    }
  | {
      readonly status: 'up_to_date';
      readonly latestVersion: string;
    };

interface ParsedVersion {
  readonly core: readonly [number, number, number];
  readonly prerelease: readonly (number | string)[];
}

export function normalizeVersion(raw: string): string {
  return raw.trim().replace(/^v/i, '');
}

function parseVersion(raw: string): ParsedVersion | null {
  const cleaned = normalizeVersion(raw);
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(
    cleaned,
  );
  if (!match) return null;

  const core: [number, number, number] = [
    Number(match[1]),
    Number(match[2] ?? '0'),
    Number(match[3] ?? '0'),
  ];
  const prerelease = match[4]
    ? match[4].split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part))
    : [];

  return { core, prerelease };
}

/**
 * Standard SemVer comparison. Returns:
 *  > 0 if a > b
 *  < 0 if a < b
 *    0 if equal or unparseable
 */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;

  for (let i = 0; i < 3; i += 1) {
    const ca = pa.core[i] ?? 0;
    const cb = pb.core[i] ?? 0;
    if (ca !== cb) {
      return ca - cb;
    }
  }

  // Stable release has higher precedence than a prerelease of the same core version.
  if (pa.prerelease.length === 0 && pb.prerelease.length === 0) return 0;
  if (pa.prerelease.length === 0) return 1;
  if (pb.prerelease.length === 0) return -1;

  const maxLen = Math.max(pa.prerelease.length, pb.prerelease.length);
  for (let i = 0; i < maxLen; i += 1) {
    const idA = pa.prerelease[i];
    const idB = pb.prerelease[i];
    if (idA === undefined) return -1;
    if (idB === undefined) return 1;
    if (idA === idB) continue;

    const numA = typeof idA === 'number';
    const numB = typeof idB === 'number';
    if (numA && numB) return idA - idB;
    if (numA) return -1;
    if (numB) return 1;
    return idA < idB ? -1 : 1;
  }

  return 0;
}

export function sanitizeReleaseUrl(url: string | undefined): string {
  if (typeof url === 'string' && url.startsWith(`${GITHUB_RELEASES_PAGE_URL}/`)) {
    return url;
  }
  return GITHUB_RELEASES_PAGE_URL;
}

export function evaluateReleases(
  currentVersion: string,
  releases: readonly GitHubReleaseItem[],
): UpdateCheckResult {
  const normalizedCurrent = normalizeVersion(currentVersion);
  let bestVersion = normalizedCurrent;
  let bestUrl = GITHUB_RELEASES_PAGE_URL;
  let foundNewer = false;

  for (const release of releases) {
    if (release.draft || typeof release.tag_name !== 'string') continue;
    const candidate = normalizeVersion(release.tag_name);
    if (!parseVersion(candidate)) continue;
    if (compareVersions(candidate, bestVersion) > 0) {
      bestVersion = candidate;
      bestUrl = sanitizeReleaseUrl(release.html_url);
      foundNewer = true;
    }
  }

  if (foundNewer) {
    return {
      status: 'update_available',
      latestVersion: bestVersion,
      releaseUrl: bestUrl,
    };
  }

  return {
    status: 'up_to_date',
    latestVersion: normalizedCurrent,
  };
}

export async function checkForGitHubUpdate(currentVersion: string): Promise<UpdateCheckResult> {
  const response = await fetch(GITHUB_RELEASES_API_URL, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`GitHub Releases request failed (${response.status})`);
  }
  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error('Unexpected GitHub Releases response');
  }
  return evaluateReleases(currentVersion, data as GitHubReleaseItem[]);
}
