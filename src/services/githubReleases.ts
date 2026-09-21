export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  updated_at: string;
}

export interface GitHubReleaseInfo {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  assets: GitHubReleaseAsset[];
}

interface CachedRelease {
  data: GitHubReleaseInfo;
  timestamp: number;
}

const CACHE_KEY = 'kinoma_github_latest_release_cache_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function fetchLatestRelease(): Promise<GitHubReleaseInfo> {
  // Check client-side cache
  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (cachedStr) {
      const cached: CachedRelease = JSON.parse(cachedStr);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
    }
  } catch (e) {
    // ignore storage errors
  }

  try {
    const res = await fetch('https://api.github.com/repos/titan717/Kinoma/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 403 || res.status === 429) {
      throw new Error('GitHub API rate limit exceeded. Please try again in a few minutes.');
    }

    if (!res.ok) {
      throw new Error(`GitHub API error: HTTP ${res.status}`);
    }

    const data: GitHubReleaseInfo = await res.json();

    // Cache the result
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      // ignore storage errors
    }

    return data;
  } catch (err: any) {
    // If rate-limited or offline, check if we have stale cache we can use as fallback
    try {
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
        const cached: CachedRelease = JSON.parse(cachedStr);
        return cached.data;
      }
    } catch (e) {}

    throw err;
  }
}

export async function downloadLatestApk(onStatus?: (msg: string) => void): Promise<void> {
  if (onStatus) onStatus('Querying GitHub latest release for Kinoma-Android-TV.apk...');
  
  const release = await fetchLatestRelease();
  
  const apkAsset = release.assets?.find(
    (asset) => asset.name === 'Kinoma-Android-TV.apk'
  );

  if (!apkAsset || !apkAsset.browser_download_url) {
    throw new Error('Kinoma-Android-TV.apk asset was not found in the latest GitHub release.');
  }

  if (onStatus) {
    onStatus(`Found version ${release.tag_name || release.name || 'latest'}! Starting download...`);
  }

  const a = document.createElement('a');
  a.href = apkAsset.browser_download_url;
  a.download = 'Kinoma-Android-TV.apk';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (onStatus) {
    onStatus(`Download started successfully (${release.tag_name || 'latest'})!`);
  }
}
