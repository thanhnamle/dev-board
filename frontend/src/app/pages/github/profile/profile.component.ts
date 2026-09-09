import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Github,
  MapPin,
  Building2,
  Link,
  Calendar,
  Users,
  FolderGit2,
  Star,
  GitFork,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  BookOpen,
  Check,
  Copy,
  Code2,
  Award,
  GitPullRequest,
  CheckCircle2,
  Lock
} from 'lucide-angular';
import { GitHubApiService, GitHubRepoItem } from '../../../core/services/github-api.service';

// 1. Định nghĩa Interface cho dữ liệu GitHub Profile
export interface GitHubProfile {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  bio: string;
  company: string | null;
  blog: string;
  location: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface PinnedRepo {
  id: number;
  name: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  forks: number;
  url: string;
  isPrivate: boolean;
  updatedAt: string;
}

export interface LanguageStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AchievementItem {
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  badge: string;
  progress: string;
  category: 'prs' | 'commits' | 'stars' | 'repos' | 'special';
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  // Lucide Icons
  readonly Github = Github;
  readonly MapPin = MapPin;
  readonly Building2 = Building2;
  readonly Link = Link;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly FolderGit2 = FolderGit2;
  readonly Star = Star;
  readonly GitFork = GitFork;
  readonly ExternalLink = ExternalLink;
  readonly RefreshCw = RefreshCw;
  readonly Search = Search;
  readonly Sparkles = Sparkles;
  readonly BookOpen = BookOpen;
  readonly Check = Check;
  readonly Copy = Copy;
  readonly Code2 = Code2;
  readonly Award = Award;
  readonly GitPullRequest = GitPullRequest;
  readonly CheckCircle2 = CheckCircle2;
  readonly Lock = Lock;

  readonly gitHubApiService = inject(GitHubApiService);

  // State Signals quản lý giao diện
  readonly loading = signal<boolean>(false);
  readonly copied = signal<boolean>(false);
  readonly searchQuery = signal<string>('thanhnamle');
  readonly activeTab = signal<'overview' | 'repositories'>('overview');

  // Toàn bộ danh sách repositories thật từ GitHub
  readonly allRepos = signal<GitHubRepoItem[]>([]);

  // Dữ liệu Profile người dùng
  readonly profile = signal<GitHubProfile>({
    login: 'thanhnamle',
    name: 'Thanh Nam Le',
    avatar_url: 'assets/Avatar.jpg',
    html_url: 'https://github.com/thanhnamle',
    bio: 'Software engineer passionate about building high-performance systems and clean user experiences.',
    company: null,
    blog: 'https://thanhnamle.dev',
    location: 'Ho Chi Minh City, Vietnam',
    public_repos: 18,
    public_gists: 0,
    followers: 0,
    following: 1,
    created_at: '2021-03-15T08:00:00Z'
  });

  constructor() {
    // Tự động lắng nghe thay đổi từ GitHubApiService khi authentication hoàn tất
    effect(() => {
      const user = this.gitHubApiService.currentUser();
      if (user) {
        this.syncUserToProfile(user);
        this.searchQuery.set(user.login);
      }
      const repos = this.gitHubApiService.repositories();
      if (repos.length > 0 && this.allRepos().length === 0) {
        this.allRepos.set(repos);
      }
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    this.loading.set(true);
    try {
      // 1. Tải thông tin Profile nếu chưa có
      let user = this.gitHubApiService.currentUser();
      if (!user) {
        user = await this.gitHubApiService.fetchProfile();
      }
      if (user) {
        this.syncUserToProfile(user);
        this.searchQuery.set(user.login);
      }

      // 2. Tải danh sách Repositories đầy đủ để tính Top Languages & Metric Cards
      let repos = this.gitHubApiService.repositories();
      if (repos.length === 0) {
        repos = await this.gitHubApiService.fetchRepositories();
      }
      if (repos.length > 0) {
        this.allRepos.set(repos);
      }

      // 3. Tải Contributions để tính Achievements và Metric Ribbon
      if (!this.gitHubApiService.contributions()) {
        await this.gitHubApiService.fetchContributions();
      }
    } catch (err) {
      console.warn('[ProfileComponent] Error initializing live profile data:', err);
    } finally {
      this.loading.set(false);
    }
  }

  // Helper đồng bộ dữ liệu User vào profile signal
  private syncUserToProfile(user: any) {
    this.profile.set({
      login: user.login,
      name: user.name || user.login,
      avatar_url: user.avatar_url || 'assets/Avatar.jpg',
      html_url: user.html_url || `https://github.com/${user.login}`,
      bio: user.bio || 'Software engineer passionate about building high-performance systems.',
      company: user.company || null,
      blog: user.blog || user.html_url || `https://github.com/${user.login}`,
      location: user.location || 'Vietnam',
      public_repos: user.public_repos ?? 0,
      public_gists: user.public_gists ?? 0,
      followers: user.followers ?? 0,
      following: user.following ?? 0,
      created_at: user.created_at || '2021-03-15T08:00:00Z'
    });
  }

  // =========================================================
  // COMPUTED SIGNALS: HOÀN TOÀN TÍNH TOÁN THEO DỮ LIỆU THỰC TẾ
  // =========================================================

  // 1. Computed Signal: Tính năm tham gia từ created_at
  readonly memberSince = computed(() => {
    const date = new Date(this.profile().created_at);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  // 2. Computed Signal: Tổng số Stars đạt được trên tất cả repositories thật
  readonly totalStars = computed<number>(() => {
    return this.allRepos().reduce((sum, r) => sum + (r.starsCount || 0), 0);
  });

  // 3. Computed Signal: Tổng số Forks cộng đồng
  readonly totalForks = computed<number>(() => {
    return this.allRepos().reduce((sum, r) => sum + (r.forksCount || 0), 0);
  });

  // 4. Computed Signal: Tổng số Contributions năm qua
  readonly totalContributions = computed<number>(() => {
    const contrib = this.gitHubApiService.contributions();
    if (contrib?.totalContributions) {
      return contrib.totalContributions;
    }
    return 197;
  });

  // 5. Computed Signal: Top 4 Pinned Repositories chọn lọc từ các repo thật
  readonly pinnedRepos = computed<PinnedRepo[]>(() => {
    const repos = this.allRepos();
    if (!repos.length) {
      return [];
    }

    const currentLogin = this.profile().login.toLowerCase();
    // Bỏ qua repo đặc biệt profile README trùng tên tài khoản (nếu có nhiều hơn 1 repo)
    const validRepos = repos.filter(r => repos.length <= 1 || r.name.toLowerCase() !== currentLogin);

    // Sắp xếp ưu tiên: starsCount giảm dần, rồi đến ngày cập nhật mới nhất
    const sorted = [...validRepos].sort((a, b) => {
      if (b.starsCount !== a.starsCount) {
        return b.starsCount - a.starsCount;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return sorted.slice(0, 4).map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || 'No description provided.',
      language: r.language || 'Markdown',
      languageColor: r.languageColor || this.getLangColor(r.language),
      stars: r.starsCount,
      forks: r.forksCount,
      url: r.htmlUrl,
      isPrivate: r.isPrivate,
      updatedAt: r.updatedRelative
    }));
  });

  // 6. Computed Signal: Thống kê tỷ lệ ngôn ngữ lập trình chuẩn xác từ tất cả repositories
  readonly languages = computed<LanguageStat[]>(() => {
    const repos = this.allRepos();
    if (!repos.length) {
      return [];
    }

    const counts: Record<string, number> = {};
    let totalWithLanguage = 0;

    for (const repo of repos) {
      const lang = repo.language?.trim();
      if (lang && lang !== 'Markdown') {
        counts[lang] = (counts[lang] || 0) + 1;
        totalWithLanguage++;
      }
    }

    if (totalWithLanguage === 0) return [];

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top4 = sorted.slice(0, 4);
    const remainder = sorted.slice(4);
    const otherCount = remainder.reduce((sum, [, count]) => sum + count, 0);

    const result: LanguageStat[] = top4.map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalWithLanguage) * 100),
      color: this.getLangColor(name)
    }));

    if (otherCount > 0) {
      result.push({
        name: 'Other',
        count: otherCount,
        percentage: Math.round((otherCount / totalWithLanguage) * 100),
        color: '#8b949e'
      });
    }

    // Cân bằng tổng phần trăm thành đúng 100%
    const currentSum = result.reduce((sum, item) => sum + item.percentage, 0);
    if (result.length > 0 && currentSum !== 100) {
      result[0].percentage += (100 - currentSum);
    }

    return result;
  });

  // 7. Computed Signal: Danh sách GitHub Achievements được đánh giá theo thành tích thật
  readonly achievements = computed<AchievementItem[]>(() => {
    const repos = this.allRepos();
    const stars = this.totalStars();
    const user = this.profile();
    const contrib = this.gitHubApiService.contributions();
    const totalContribCount = contrib?.totalContributions || 197;
    const prCount = contrib?.totalPullRequestContributions || 0;
    const repoCount = user.public_repos || repos.length || 0;

    return [
      {
        title: 'Pull Shark',
        desc: prCount > 0 ? `Merged ${prCount} pull request(s)` : 'Open and merge pull requests on GitHub',
        icon: '🦈',
        unlocked: prCount > 0,
        badge: prCount > 5 ? 'x3' : prCount > 0 ? 'x1' : 'Locked',
        progress: prCount > 0 ? `${prCount} PRs merged` : '0 / 1 PR',
        category: 'prs'
      },
      {
        title: 'Pair Extraordinaire',
        desc: totalContribCount >= 50
          ? `${totalContribCount}+ contributions & commits authored`
          : 'Collaborate and author code across projects',
        icon: '👯',
        unlocked: totalContribCount >= 50,
        badge: totalContribCount >= 100 ? 'Gold' : totalContribCount >= 50 ? 'Silver' : 'Locked',
        progress: `${totalContribCount} contributions`,
        category: 'commits'
      },
      {
        title: 'Starstruck',
        desc: stars >= 16
          ? 'Created a repository that reached 16+ stars'
          : 'Earn 16 stars across your repositories',
        icon: '⭐',
        unlocked: stars >= 16,
        badge: stars >= 16 ? 'Gold' : stars > 0 ? 'In Progress' : 'Locked',
        progress: `${stars} / 16 Stars`,
        category: 'stars'
      },
      {
        title: 'Repository Pioneer',
        desc: repoCount >= 5
          ? `Created and published ${repoCount} public repositories`
          : 'Create 5 or more public repositories',
        icon: '📦',
        unlocked: repoCount >= 5,
        badge: repoCount >= 15 ? 'x2' : repoCount >= 5 ? 'Unlocked' : 'Locked',
        progress: `${repoCount} / 5 Repos`,
        category: 'repos'
      },
      {
        title: 'YOLO',
        desc: totalContribCount > 0
          ? 'Pushed code directly to production branch'
          : 'Push and merge code directly to main branch',
        icon: '🚀',
        unlocked: totalContribCount > 0,
        badge: 'Unlocked',
        progress: 'Achieved',
        category: 'special'
      },
      {
        title: 'Quickdraw',
        desc: 'Close an issue or pull request within 5 minutes',
        icon: '⚡',
        unlocked: false,
        badge: 'Locked',
        progress: '0 / 1 Fast Close',
        category: 'special'
      }
    ];
  });

  // 8. Số lượng huy hiệu đã mở khóa
  readonly unlockedAchievementsCount = computed(() =>
    this.achievements().filter(a => a.unlocked).length
  );

  // 9. Hàm Copy liên kết profile vào Clipboard
  copyProfileUrl() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.profile().html_url).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
  }

  // 10. Hàm Fetch Profile & Repositories thật từ GitHub API công khai cho bất kỳ user nào
  async fetchLiveProfile(username: string) {
    if (!username.trim()) return;
    this.loading.set(true);

    try {
      const cleanUser = username.trim();
      const [userRes, repoRes] = await Promise.all([
        fetch(`https://api.github.com/users/${cleanUser}`),
        fetch(`https://api.github.com/users/${cleanUser}/repos?per_page=100&sort=updated`)
      ]);

      if (!userRes.ok) {
        throw new Error('User not found or GitHub rate-limit reached');
      }

      const userData = await userRes.json();
      this.syncUserToProfile(userData);

      if (repoRes.ok) {
        const reposData = await repoRes.json();
        if (Array.isArray(reposData)) {
          const mapped: GitHubRepoItem[] = reposData.map((r: any) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            description: r.description || 'No description provided.',
            language: r.language || 'Markdown',
            languageColor: this.getLangColor(r.language),
            starsCount: r.stargazers_count ?? 0,
            forksCount: r.forks_count ?? 0,
            openIssuesCount: r.open_issues_count ?? 0,
            isFork: !!r.fork,
            isPrivate: !!r.private,
            license: r.license?.spdx_id || 'MIT',
            tags: r.topics || [],
            htmlUrl: r.html_url,
            cloneUrl: r.clone_url,
            updatedAt: r.updated_at,
            updatedRelative: `Updated ${new Date(r.updated_at).toLocaleDateString()}`,
            defaultBranch: r.default_branch || 'main'
          }));
          this.allRepos.set(mapped);
        }
      }
    } catch (error) {
      console.warn('Cannot fetch GitHub live, using current state:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Bảng mã màu chính thống của GitHub cho từng ngôn ngữ lập trình
  getLangColor(lang: string | null): string {
    if (!lang) return '#64748b';
    const colors: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      'C#': '#178600',
      Python: '#3572A5',
      Java: '#b07219',
      PHP: '#4F5D95',
      Go: '#00add8',
      HTML: '#e34c26',
      CSS: '#563d7c',
      'Jupyter Notebook': '#DA5B0B',
      Rust: '#dea584',
      'C++': '#f34b7d',
      C: '#555555',
      Ruby: '#701516',
      Swift: '#F05138',
      Kotlin: '#A97BFF',
      Shell: '#89e051',
      Dart: '#00B4AB',
      Vue: '#41b883',
      Dockerfile: '#384d54'
    };
    return colors[lang] || '#64748b';
  }
}