import { Component, signal, computed } from '@angular/core';
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
  CheckCircle2
} from 'lucide-angular';

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
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  // 2. Khai báo Lucide Icons
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

  // 3. State quản lý bằng Angular Signals
  loading = signal<boolean>(false);
  copied = signal<boolean>(false);
  searchQuery = signal<string>('thanhnamle');
  activeTab = signal<'overview' | 'repositories'>('overview');

  // Dữ liệu Profile (Có sẵn dữ liệu khởi tạo mặc định để giao diện render ngay)
  profile = signal<GitHubProfile>({
    login: 'thanhnamle',
    name: 'Thành Nam',
    avatar_url: 'assets/Avatar.jpg',
    html_url: 'https://github.com/thanhnamle',
    bio: 'Lead Architect & Fullstack Engineer. Passionate about Angular 17, Cloud Architecture, Microservices & High-Performance UI.',
    company: '@payoo-devboard',
    blog: 'https://thanhnamle.dev',
    location: 'Ho Chi Minh City, Vietnam',
    public_repos: 28,
    public_gists: 14,
    followers: 184,
    following: 76,
    created_at: '2021-03-15T08:00:00Z'
  });

  // 4. Danh sách Top Pinned Repositories mẫu
  pinnedRepos = signal<PinnedRepo[]>([
    {
      id: 1,
      name: 'dev-board',
      description: 'Modern developer workspace & internal tooling built with Angular 17, SSR, and Signals.',
      language: 'TypeScript',
      languageColor: '#3178c6',
      stars: 42,
      forks: 12,
      url: 'https://github.com/thanhnamle/dev-board',
      isPrivate: false,
      updatedAt: 'Updated 2 hours ago'
    },
    {
      id: 2,
      name: 'payment-gateway-sdk',
      description: 'High-throughput Go & Node.js SDK for secure QR & payment processing integration.',
      language: 'Go',
      languageColor: '#00add8',
      stars: 88,
      forks: 24,
      url: 'https://github.com/thanhnamle/payment-gateway-sdk',
      isPrivate: false,
      updatedAt: 'Updated 1 day ago'
    },
    {
      id: 3,
      name: 'angular-signals-recipe',
      description: 'Comprehensive design patterns and state management recipes using Angular 17 Signals.',
      language: 'TypeScript',
      languageColor: '#3178c6',
      stars: 65,
      forks: 19,
      url: 'https://github.com/thanhnamle/angular-signals-recipe',
      isPrivate: false,
      updatedAt: 'Updated 3 days ago'
    },
    {
      id: 4,
      name: 'docker-dev-environments',
      description: 'Curated Docker Compose stacks for local microservices, PostgreSQL, and Redis caching.',
      language: 'Dockerfile',
      languageColor: '#384d54',
      stars: 31,
      forks: 7,
      url: 'https://github.com/thanhnamle/docker-dev-environments',
      isPrivate: false,
      updatedAt: 'Updated 1 week ago'
    }
  ]);

  // 5. Thống kê tỷ lệ ngôn ngữ lập trình
  languages = signal<LanguageStat[]>([
    { name: 'TypeScript', percentage: 54, color: '#3178c6' },
    { name: 'Go', percentage: 22, color: '#00add8' },
    { name: 'HTML & CSS', percentage: 14, color: '#e34c26' },
    { name: 'Shell / Docker', percentage: 10, color: '#384d54' }
  ]);

  // 6. Huy hiệu GitHub Achievements
  achievements = [
    { title: 'Pull Shark', desc: 'Opened 128+ PRs merged', icon: '🦈' },
    { title: 'Arctic Vault', desc: '2020 Code Contributor', icon: '❄️' },
    { title: 'Quickdraw', desc: 'Closed issue in 5 min', icon: '⚡' },
    { title: 'YOLO', desc: 'Merged without review', icon: '🚀' }
  ];

  // 7. Computed Signal: Tính năm tham gia từ created_at
  memberSince = computed(() => {
    const date = new Date(this.profile().created_at);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  // 8. Hàm Copy liên kết profile vào Clipboard
  copyProfileUrl() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.profile().html_url).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    }
  }

  // 9. Hàm Fetch Profile thật từ GitHub API công khai
  async fetchLiveProfile(username: string) {
    if (!username.trim()) return;
    this.loading.set(true);

    try {
      const response = await fetch(`https://api.github.com/users/${username.trim()}`);
      if (!response.ok) {
        throw new Error('User not found or GitHub rate-limit reached');
      }
      const data = await response.json();
      
      // Cập nhật State Profile thông qua Signal
      this.profile.set({
        login: data.login,
        name: data.name || data.login,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        bio: data.bio || 'Software developer passionate about code & design.',
        company: data.company,
        blog: data.blog || `https://github.com/${data.login}`,
        location: data.location || 'Remote',
        public_repos: data.public_repos,
        public_gists: data.public_gists,
        followers: data.followers,
        following: data.following,
        created_at: data.created_at
      });

      // Fetch luôn các Repositories của user đó
      const repoRes = await fetch(`https://api.github.com/users/${username.trim()}/repos?sort=updated&per_page=4`);
      if (repoRes.ok) {
        const reposData = await repoRes.json();
        const mappedRepos: PinnedRepo[] = reposData.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || 'No description provided.',
          language: r.language || 'Markdown',
          languageColor: this.getLangColor(r.language),
          stars: r.stargazers_count,
          forks: r.forks_count,
          url: r.html_url,
          isPrivate: r.private,
          updatedAt: `Updated ${new Date(r.updated_at).toLocaleDateString()}`
        }));
        this.pinnedRepos.set(mappedRepos);
      }
    } catch (error) {
      console.warn('Cannot fetch GitHub live, using local state:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private getLangColor(lang: string | null): string {
    const colors: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Go: '#00add8',
      Python: '#3572A5',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Java: '#b07219',
      Rust: '#dea584'
    };
    return (lang && colors[lang]) ? colors[lang] : '#64748b';
  }
}