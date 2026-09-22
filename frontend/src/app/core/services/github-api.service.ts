import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivityEvent, ActivityType } from '../../pages/github/activities/activities.component';

// 1. Interface cho thông tin User GitHub
export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email?: string;
  bio?: string;
  company?: string;
  blog?: string;
  location?: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

// 2. Interface cho từng Repository
export interface GitHubRepoItem {
  id: number;
  name: string;
  fullName: string;
  description: string;
  language: string;
  languageColor: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  isFork: boolean;
  isPrivate: boolean;
  license: string;
  tags: string[];
  htmlUrl: string;
  cloneUrl: string;
  updatedAt: string;
  updatedRelative: string;
  defaultBranch: string;
}

export interface GitCommitDetail {
  id: number;
  sha: string;
  shortSha: string;
  message: string;
  description?: string;
  authorName: string;
  authorAvatar?: string;
  authorLogin?: string;
  timestamp: string;
  timeAgo: string;
  parents: string[];
  htmlUrl: string;
  verified?: boolean;
  lane?: number;
}

export interface GitPullRequestItem {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  merged: boolean;
  authorName: string;
  authorAvatar?: string;
  headRef: string;
  baseRef: string;
  createdAt: string;
  updatedAt: string;
  timeAgo: string;
  htmlUrl: string;
  commentsCount: number;
  body?: string;
  draft: boolean;
}

export interface GitBranchItem {
  name: string;
  commitSha: string;
  shortSha: string;
  isDefault: boolean;
  protected: boolean;
}

export interface RepoCommitsResult {
  commits: GitCommitDetail[];
  totalCount: number;
  hasMore: boolean;
  page: number;
}

@Injectable({
  providedIn: 'root'
})
export class GitHubApiService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = 'http://localhost:3000/api';

  // State Signals quản lý trạng thái dữ liệu GitHub
  readonly isAuthenticated = signal<boolean>(false);
  readonly currentUser = signal<GitHubUser | null>(null);
  readonly repositories = signal<GitHubRepoItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly activities = signal<ActivityEvent[]>([]);
  readonly contributions = signal<any | null>(null);
  private readonly repoCommitsCache = new Map<string, ActivityEvent[]>();

  // Computed Signal: tự động tính số lượng Repo thật để hiển thị badge ở Sidebar
  readonly repoCount = computed(() => {
    const list = this.repositories();
    if (list.length > 0) return list.length;
    const user = this.currentUser();
    return user?.public_repos ?? 8;
  });

  constructor() {
    // Tự động kiểm tra trạng thái đăng nhập khi ứng dụng vừa chạy trên trình duyệt
    if (isPlatformBrowser(this.platformId)) {
      this.checkSession();
    }
  }

  // 1. Kiểm tra session cookie HttpOnly qua NestJS backend
  async checkSession(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;

    try {
      this.loading.set(true);
      const res = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Gửi cookie devboard_session
      });

      if (!res.ok) {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        return false;
      }

      const data = await res.json();
      if (data.authenticated && data.user) {
        this.isAuthenticated.set(true);
        // Khi đã đăng nhập, tải luôn Profile đầy đủ và Repositories thật
        await Promise.all([
          this.fetchProfile(),
          this.fetchRepositories(),
          this.fetchActivities()
        ]);
        return true;
      } else {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        return false;
      }
    } catch (err) {
      console.warn('[GitHubApiService] Backend offline hoặc chưa đăng nhập:', err);
      this.isAuthenticated.set(false);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  // 2. Lấy thông tin Profile chi tiết từ Backend
  async fetchProfile(): Promise<GitHubUser | null> {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const res = await fetch(`${this.baseUrl}/github/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const profileData = await res.json();
        this.currentUser.set(profileData);
        return profileData;
      }
    } catch (err) {
      console.warn('[GitHubApiService] Backend profile fetch failed, will try public fallback', err);
    }

    return null;
  }

  // 3. Lấy danh sách Repositories (Public + Private) của tài khoản
  async fetchRepositories(): Promise<GitHubRepoItem[]> {
    if (!isPlatformBrowser(this.platformId)) return [];

    try {
      this.loading.set(true);
      let rawRepos: any[] = [];

      let backendSuccess = false;
      // 1. Thử gọi backend API
      try {
        const res = await fetch(`${this.baseUrl}/github/repositories`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            rawRepos = data;
            backendSuccess = true;
          }
        }
      } catch (e) {
        console.warn('[GitHubApiService] Backend repositories fetch failed, will try public fallback', e);
      }

      // 2. Fallback trực tiếp GitHub API chỉ khi backend lỗi mạng VÀ có user login
      if (!backendSuccess && this.currentUser()?.login) {
        const username = this.currentUser()!.login;
        try {
          const directRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
          if (directRes.ok) {
            const data = await directRes.json();
            if (Array.isArray(data)) {
              rawRepos = data;
            }
          }
        } catch (err) {
          console.error('[GitHubApiService] Direct repos fallback failed', err);
        }
      }

      const mapped: GitHubRepoItem[] = rawRepos.map((r: any) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description || 'No description provided.',
        language: r.language || 'Markdown',
        languageColor: this.getLanguageColor(r.language),
        starsCount: r.stargazers_count ?? 0,
        forksCount: r.forks_count ?? 0,
        openIssuesCount: r.open_issues_count ?? 0,
        isFork: !!r.fork,
        isPrivate: !!r.private,
        license: r.license?.spdx_id || 'MIT',
        tags: r.topics && r.topics.length ? r.topics : ['github', 'repository'],
        htmlUrl: r.html_url,
        cloneUrl: r.clone_url,
        updatedAt: r.updated_at,
        updatedRelative: `Updated ${new Date(r.updated_at).toLocaleDateString()}`,
        defaultBranch: r.default_branch || 'main',
      }));

      this.repositories.set(mapped);
      return mapped;
    } catch (err) {
      console.error('[GitHubApiService] Lỗi lấy danh sách repos:', err);
      this.repositories.set([]);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  // 4. Đăng xuất: Xóa cookie ở Backend và reset state ở Frontend
  async logout(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[GitHubApiService] Lỗi đăng xuất:', err);
    } finally {
      this.isAuthenticated.set(false);
      this.currentUser.set(null);
      this.repositories.set([]);
    }
  }

  // Lấy dòng thời gian hoạt động thực tế từ GitHub
  async fetchActivities(): Promise<any[]> {
    if (!isPlatformBrowser(this.platformId)) return [];

    try {
      this.loading.set(true);
      let rawEvents: any[] = [];

      let backendSuccess = false;
      // 1. Thử gọi qua Backend API (kèm cookie devboard_session)
      try {
        const res = await fetch(`${this.baseUrl}/github/activities`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            rawEvents = data;
            backendSuccess = true;
          }
        }
      } catch (e) {
        console.warn('[GitHubApiService] Backend activities fetch failed, will try public fallback', e);
      }

      // 2. Fallback trực tiếp GitHub API chỉ khi backend lỗi mạng VÀ có user login
      if (!backendSuccess && this.currentUser()?.login) {
        const username = this.currentUser()!.login;
        try {
          const directRes = await fetch(`https://api.github.com/users/${username}/events?per_page=100`, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          });
          if (directRes.ok) {
            const data = await directRes.json();
            if (Array.isArray(data)) {
              rawEvents = data;
            }
          }
        } catch (err) {
          console.error('[GitHubApiService] Direct GitHub events fallback failed', err);
        }
      }

      if (rawEvents.length > 0) {
        // Ánh xạ các loại sự kiện GitHub thành định dạng giao diện dễ đọc
        const mapped: ActivityEvent[] = rawEvents.map((event: any, index: number) => {
          let type: ActivityType = 'commit';
          let title = 'Activity on repository';
          let branch = '';
          let commitHash = '';
          let prNumber: number | undefined;

          switch (event.type) {
            case 'PushEvent': {
              type = 'commit';
              branch = event.payload?.ref ? event.payload.ref.replace('refs/heads/', '') : 'main';
              const commit = event.payload?.commits?.[0];
              if (commit?.message) {
                title = commit.message;
              } else if (event.payload?.size) {
                title = `Pushed ${event.payload.size} commit(s) to ${branch}`;
              } else {
                title = `Pushed updates to ${branch}`;
              }
              commitHash = commit?.sha
                ? commit.sha.substring(0, 7)
                : (event.payload?.head ? event.payload.head.substring(0, 7) : '');
              break;
            }

            case 'PullRequestEvent': {
              type = 'pr';
              const pr = event.payload?.pull_request;
              title = `${event.payload?.action === 'closed' && pr?.merged ? 'Merged' : 'Opened'} PR #${pr?.number || ''}: ${pr?.title || ''}`;
              prNumber = pr?.number;
              branch = pr?.head?.ref || '';
              break;
            }

            case 'CreateEvent':
              type = 'branch';
              branch = event.payload?.ref || '';
              title = `Created ${event.payload?.ref_type || 'repository'} ${branch || event.repo?.name || ''}`;
              break;

            case 'DeleteEvent':
              type = 'branch';
              branch = event.payload?.ref || '';
              title = `Deleted ${event.payload?.ref_type || 'branch'} ${branch}`;
              break;

            case 'WatchEvent':
              type = 'release';
              title = `Starred repository ${event.repo?.name}`;
              break;

            default:
              title = `${event.type.replace('Event', '')} on ${event.repo?.name || 'repository'}`;
          }

          const date = new Date(event.created_at);

          return {
            id: typeof event.id === 'number' ? event.id : (parseInt(event.id, 10) || index + 1),
            type,
            repoName: event.repo?.name || 'unknown-repo',
            repoUrl: `https://github.com/${event.repo?.name || ''}`,
            title,
            branch,
            commitHash,
            prNumber,
            timestamp: event.created_at,
            timeAgo: date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
            author: event.actor?.login || this.currentUser()?.login || 'developer',
          };
        });

        this.activities.set(mapped);
        return mapped;
      }
    } catch (err) {
      console.error('[GitHubApiService] Lỗi lấy activities:', err);
    } finally {
      this.loading.set(false);
    }
    return [];
  }

  // Lấy full contribution calendar 1 năm từ GitHub GraphQL thông qua Backend
  async fetchContributions(year?: number): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      this.loading.set(true);
      const url = year ? `${this.baseUrl}/github/contributions?year=${year}` : `${this.baseUrl}/github/contributions`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        this.contributions.set(data);
        return data;
      }
    } catch (err) {
      console.error('[GitHubApiService] Lỗi lấy contributions calendar:', err);
    } finally {
      this.loading.set(false);
    }
    return null;
  }

  // 6. Lấy danh sách commits của một repository cụ thể
  async fetchRepoCommits(repoName: string): Promise<ActivityEvent[]> {
    if (!isPlatformBrowser(this.platformId) || !repoName || repoName === 'all') return [];

    const cacheKey = repoName.toLowerCase();
    if (this.repoCommitsCache.has(cacheKey)) {
      return this.repoCommitsCache.get(cacheKey)!;
    }

    try {
      let rawCommits: any[] = [];
      const owner = repoName.includes('/') ? repoName.split('/')[0] : (this.currentUser()?.login || 'developer');
      const name = repoName.includes('/') ? repoName.split('/')[1] : repoName;

      // 1. Thử gọi backend API
      try {
        const res = await fetch(`${this.baseUrl}/github/commits?repo=${encodeURIComponent(repoName)}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            rawCommits = data;
          } else if (data && Array.isArray(data.commits)) {
            rawCommits = data.commits;
          }
        }
      } catch (e) {
        console.warn(`[GitHubApiService] Backend commits fetch failed for ${repoName}`, e);
      }

      // 2. Fallback trực tiếp GitHub API
      if (rawCommits.length === 0) {
        try {
          const directRes = await fetch(`https://api.github.com/repos/${owner}/${name}/commits?per_page=100`, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          });
          if (directRes.ok) {
            const data = await directRes.json();
            if (Array.isArray(data)) {
              rawCommits = data;
            }
          }
        } catch (err) {
          console.error(`[GitHubApiService] Direct commits fetch failed for ${repoName}:`, err);
        }
      }

      if (rawCommits.length > 0) {
        const repoFullName = repoName.includes('/') ? repoName : `${owner}/${name}`;
        const mapped: ActivityEvent[] = rawCommits.map((item: any, index: number) => {
          const sha = item.sha || '';
          const shortHash = sha.substring(0, 7);
          const fullMsg = item.commit?.message || 'Update repository';
          const title = fullMsg.split('\n')[0];
          const description = fullMsg.split('\n').slice(1).join('\n').trim();
          const dateStr = item.commit?.author?.date || item.commit?.committer?.date || new Date().toISOString();
          const d = new Date(dateStr);
          const timeAgo = d.toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });

          return {
            id: index + 10000,
            type: 'commit' as ActivityType,
            repoName: repoFullName,
            repoUrl: item.html_url || `https://github.com/${repoFullName}/commit/${sha}`,
            title,
            description: description || undefined,
            commitHash: shortHash,
            timestamp: dateStr,
            timeAgo,
            author: item.author?.login || item.commit?.author?.name || this.currentUser()?.login || 'developer',
          };
        });

        this.repoCommitsCache.set(cacheKey, mapped);
        return mapped;
      }
    } catch (err) {
      console.error(`[GitHubApiService] Lỗi lấy commits cho repo ${repoName}:`, err);
    }
    return [];
  }

  // 7. Lấy danh sách Commits đầy đủ kèm parents cho Git Graph
  async fetchRepoFullCommits(repoName: string, page = 1, perPage = 100): Promise<RepoCommitsResult> {
    if (!isPlatformBrowser(this.platformId) || !repoName) {
      return { commits: [], totalCount: 0, hasMore: false, page: 1 };
    }

    try {
      let rawCommits: any[] = [];
      let totalCount = 0;
      let hasMore = false;
      const owner = repoName.includes('/') ? repoName.split('/')[0] : (this.currentUser()?.login || 'developer');
      const name = repoName.includes('/') ? repoName.split('/')[1] : repoName;

      // Gọi backend API
      try {
        const res = await fetch(`${this.baseUrl}/github/commits?repo=${encodeURIComponent(repoName)}&page=${page}&per_page=${perPage}&all=true`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            rawCommits = data;
            totalCount = data.length;
          } else if (data && typeof data === 'object') {
            rawCommits = Array.isArray(data.commits) ? data.commits : [];
            totalCount = typeof data.totalCount === 'number' ? data.totalCount : rawCommits.length;
            hasMore = !!data.hasMore;
          }
        }
      } catch (e) {
        console.warn(`[GitHubApiService] Backend commits fetch failed for ${repoName}`, e);
      }

      // Fallback trực tiếp GitHub API
      if (rawCommits.length === 0) {
        try {
          const directRes = await fetch(`https://api.github.com/repos/${owner}/${name}/commits?per_page=100&page=${page}`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
          });
          if (directRes.ok) {
            const data = await directRes.json();
            if (Array.isArray(data)) rawCommits = data;
            totalCount = rawCommits.length;
          }
        } catch (err) {
          console.error(`[GitHubApiService] Direct commits fetch failed:`, err);
        }
      }

      if (rawCommits.length > 0) {
        const mappedCommits: GitCommitDetail[] = rawCommits.map((item: any, index: number) => {
          const sha = item.sha || '';
          const shortSha = sha.substring(0, 7);
          const fullMsg = item.commit?.message || 'Commit message';
          const lines = fullMsg.split('\n');
          const message = lines[0];
          const description = lines.slice(1).join('\n').trim();
          const dateStr = item.commit?.author?.date || item.commit?.committer?.date || new Date().toISOString();
          const parents = Array.isArray(item.parents) ? item.parents.map((p: any) => p.sha) : [];

          // Tính relative time
          const diffMs = Date.now() - new Date(dateStr).getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          let timeAgo = 'Just now';
          if (diffDays > 0) timeAgo = `${diffDays}d ago`;
          else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
          else {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            timeAgo = diffMins > 0 ? `${diffMins}m ago` : 'Just now';
          }

          return {
            id: (page - 1) * perPage + index + 1,
            sha,
            shortSha,
            message,
            description: description || undefined,
            authorName: item.commit?.author?.name || item.author?.login || 'Developer',
            authorAvatar: item.author?.avatar_url,
            authorLogin: item.author?.login,
            timestamp: dateStr,
            timeAgo,
            parents,
            htmlUrl: item.html_url || `https://github.com/${owner}/${name}/commit/${sha}`,
            verified: item.commit?.verification?.verified || false
          };
        });

        return {
          commits: mappedCommits,
          totalCount: Math.max(totalCount, mappedCommits.length),
          hasMore,
          page
        };
      }
    } catch (err) {
      console.error(`[GitHubApiService] Error fetching full commits for ${repoName}:`, err);
    }
    return { commits: [], totalCount: 0, hasMore: false, page };
  }

  // 8. Lấy danh sách Pull Requests
  async fetchRepoPulls(repoName: string, state = 'all'): Promise<GitPullRequestItem[]> {
    if (!isPlatformBrowser(this.platformId) || !repoName) return [];

    try {
      let rawPulls: any[] = [];
      const owner = repoName.includes('/') ? repoName.split('/')[0] : (this.currentUser()?.login || 'developer');
      const name = repoName.includes('/') ? repoName.split('/')[1] : repoName;

      try {
        const res = await fetch(`${this.baseUrl}/github/pulls?repo=${encodeURIComponent(repoName)}&state=${state}&per_page=30`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) rawPulls = data;
        }
      } catch (e) {
        console.warn(`[GitHubApiService] Backend pulls fetch failed for ${repoName}`, e);
      }

      if (rawPulls.length === 0) {
        try {
          const directRes = await fetch(`https://api.github.com/repos/${owner}/${name}/pulls?state=${state}&per_page=30`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
          });
          if (directRes.ok) {
            const data = await directRes.json();
            if (Array.isArray(data)) rawPulls = data;
          }
        } catch (err) {
          console.error(`[GitHubApiService] Direct pulls fetch failed:`, err);
        }
      }

      return rawPulls.map((item: any) => {
        const isMerged = !!item.merged_at;
        const prState: 'open' | 'closed' | 'merged' = isMerged ? 'merged' : item.state;
        const diffMs = Date.now() - new Date(item.updated_at || item.created_at).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const timeAgo = diffDays > 0 ? `${diffDays}d ago` : 'Today';

        return {
          id: item.id,
          number: item.number,
          title: item.title,
          state: prState,
          merged: isMerged,
          authorName: item.user?.login || 'contributor',
          authorAvatar: item.user?.avatar_url,
          headRef: item.head?.ref || 'feature-branch',
          baseRef: item.base?.ref || 'main',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          timeAgo,
          htmlUrl: item.html_url,
          commentsCount: item.comments || 0,
          body: item.body || '',
          draft: !!item.draft
        };
      });
    } catch (err) {
      console.error(`[GitHubApiService] Error fetching pulls for ${repoName}:`, err);
      return [];
    }
  }

  // 9. Lấy danh sách Branches
  async fetchRepoBranches(repoName: string): Promise<GitBranchItem[]> {
    if (!isPlatformBrowser(this.platformId) || !repoName) return [];

    try {
      let rawBranches: any[] = [];
      const owner = repoName.includes('/') ? repoName.split('/')[0] : (this.currentUser()?.login || 'developer');
      const name = repoName.includes('/') ? repoName.split('/')[1] : repoName;

      try {
        const res = await fetch(`${this.baseUrl}/github/branches?repo=${encodeURIComponent(repoName)}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) rawBranches = data;
        }
      } catch (e) {
        console.warn(`[GitHubApiService] Backend branches fetch failed for ${repoName}`, e);
      }

      if (rawBranches.length === 0) {
        try {
          const directRes = await fetch(`https://api.github.com/repos/${owner}/${name}/branches?per_page=30`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
          });
          if (directRes.ok) {
            const data = await directRes.json();
            if (Array.isArray(data)) rawBranches = data;
          }
        } catch (err) {
          console.error(`[GitHubApiService] Direct branches fetch failed:`, err);
        }
      }

      const defaultBranch = this.repositories().find(r => r.fullName.toLowerCase() === repoName.toLowerCase())?.defaultBranch || 'main';

      return rawBranches.map((b: any) => {
        const commitSha = b.commit?.sha || '';
        return {
          name: b.name,
          commitSha,
          shortSha: commitSha.substring(0, 7),
          isDefault: b.name === defaultBranch,
          protected: !!b.protected
        };
      });
    } catch (err) {
      console.error(`[GitHubApiService] Error fetching branches for ${repoName}:`, err);
      return [];
    }
  }

  // Hàm tiện ích phân loại mã màu đại diện từng ngôn ngữ
  private getLanguageColor(lang: string | null): string {
    const map: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Go: '#00add8',
      Python: '#3572A5',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Dockerfile: '#384d54',
      Shell: '#89e051',
      Rust: '#dea584',
      Java: '#b07219',
      C: '#555555',
      'C++': '#f34b7d',
      'C#': '#178600'
    };
    return (lang && map[lang]) ? map[lang] : '#94a3b8';
  }
}