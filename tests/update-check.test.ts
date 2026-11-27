import { describe, expect, it } from 'vitest';
import {
  compareVersions,
  evaluateReleases,
  GITHUB_RELEASES_PAGE_URL,
  sanitizeReleaseUrl,
} from '../src/shared/update-check';

describe('update-check semver & release evaluation', () => {
  it('compares stable and prerelease versions accurately', () => {
    expect(compareVersions('0.1.0-beta.2', '0.1.0-beta.1')).toBeGreaterThan(0);
    expect(compareVersions('0.1.0', '0.1.0-beta.1')).toBeGreaterThan(0);
    expect(compareVersions('0.2.0-beta.1', '0.1.0')).toBeGreaterThan(0);
    expect(compareVersions('v0.1.0-beta.1', '0.1.0-beta.1')).toBe(0);
    expect(compareVersions('0.1.0-beta.1', '0.1.0-beta.10')).toBeLessThan(0);
  });

  it('selects the newest non-draft release and ignores drafts', () => {
    const result = evaluateReleases('0.1.0-beta.1', [
      {
        tag_name: 'v0.2.0',
        draft: true,
        html_url: `${GITHUB_RELEASES_PAGE_URL}/tag/v0.2.0`,
      },
      {
        tag_name: 'v0.1.0-beta.2',
        draft: false,
        prerelease: true,
        html_url: `${GITHUB_RELEASES_PAGE_URL}/tag/v0.1.0-beta.2`,
      },
      {
        tag_name: 'v0.1.0-beta.1',
        draft: false,
        prerelease: true,
        html_url: `${GITHUB_RELEASES_PAGE_URL}/tag/v0.1.0-beta.1`,
      },
    ]);

    expect(result).toEqual({
      status: 'update_available',
      latestVersion: '0.1.0-beta.2',
      releaseUrl: `${GITHUB_RELEASES_PAGE_URL}/tag/v0.1.0-beta.2`,
    });
  });

  it('reports up_to_date when no newer release exists', () => {
    const result = evaluateReleases('0.1.0-beta.1', [
      {
        tag_name: 'v0.1.0-beta.1',
        draft: false,
        prerelease: true,
        html_url: `${GITHUB_RELEASES_PAGE_URL}/tag/v0.1.0-beta.1`,
      },
    ]);
    expect(result).toEqual({
      status: 'up_to_date',
      latestVersion: '0.1.0-beta.1',
    });
  });

  it('sanitizes unexpected release URLs back to the repository releases page', () => {
    expect(sanitizeReleaseUrl('https://evil.example.com/phish')).toBe(GITHUB_RELEASES_PAGE_URL);
    expect(sanitizeReleaseUrl(`${GITHUB_RELEASES_PAGE_URL}/tag/v0.1.0-beta.2`)).toBe(
      `${GITHUB_RELEASES_PAGE_URL}/tag/v0.1.0-beta.2`,
    );
  });
});
