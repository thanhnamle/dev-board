import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivityEvent } from '../../pages/github/activities/activities.component';

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
      console.error('[GitHubApiService] Lỗi lấy profile:', err);
    }
    return null;
  }

  // 3. Lấy danh sách Repositories (Public + Private) của tài khoản
  async fetchRepositories(): Promise<GitHubRepoItem[]> {
    if (!isPlatformBrowser(this.platformId)) return [];

    try {
      this.loading.set(true);
      const res = await fetch(`${this.baseUrl}/github/repositories`, {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const rawRepos = await res.json();
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
          defaultBranch: r.default_branch || 'main'
        }));

        this.repositories.set(mapped);
        return mapped;
      }
    } catch (err) {
      console.error('[GitHubApiService] Lỗi lấy danh sách repos:', err);
    } finally {
      this.loading.set(false);
    }
    return [];
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
      const res = await fetch(`${this.baseUrl}/github/activities`, {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const rawEvents = await res.json();
        
        // Ánh xạ các loại sự kiện GitHub thành định dạng giao diện dễ đọc
        const mapped = rawEvents.map((event: any, index: number) => {
          let type = 'commit';
          let title = 'Activity on repository';
          let branch = '';
          let commitHash = '';
          let prNumber: number | undefined;

          switch (event.type) {
            case 'PushEvent':
              type = 'commit';
              const commit = event.payload?.commits?.[0];
              title = commit ? commit.message : `Pushed ${event.payload?.size || 1} commit(s)`;
              commitHash = commit?.sha ? commit.sha.substring(0, 7) : '';
              branch = event.payload?.ref ? event.payload.ref.replace('refs/heads/', '') : 'main';
              break;

            case 'PullRequestEvent':
              type = 'pr';
              const pr = event.payload?.pull_request;
              title = `${event.payload?.action === 'closed' && pr?.merged ? 'Merged' : 'Opened'} PR #${pr?.number}: ${pr?.title || ''}`;
              prNumber = pr?.number;
              branch = pr?.head?.ref || '';
              break;

            case 'CreateEvent':
              type = 'branch';
              title = `Created ${event.payload?.ref_type || 'ref'} ${event.payload?.ref || ''}`;
              branch = event.payload?.ref || '';
              break;

            case 'WatchEvent':
              type = 'release';
              title = `Starred repository ${event.repo?.name}`;
              break;

            default:
              title = `${event.type.replace('Event', '')} on ${event.repo?.name}`;
          }

          const date = new Date(event.created_at);

          return {
            id: event.id || index + 1,
            type,
            repoName: event.repo?.name || 'unknown-repo',
            repoUrl: `https://github.com/${event.repo?.name}`,
            title,
            branch,
            commitHash,
            prNumber,
            timestamp: event.created_at,
            timeAgo: date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
            author: event.actor?.login || 'You'
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