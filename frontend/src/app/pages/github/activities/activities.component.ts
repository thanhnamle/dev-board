import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Activity,
  GitCommit,
  GitPullRequest,
  GitBranch,
  GitMerge,
  CheckCircle2,
  Tag,
  FolderGit2,
  Calendar,
  Flame,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  Clock,
  Layers,
  Filter
} from 'lucide-angular';
import { GitHubApiService } from '../../../core/services/github-api.service';

export type ActivityType = 'commit' | 'pr' | 'review' | 'release' | 'branch';

export interface ActivityEvent {
  id: number;
  type: ActivityType;
  repoName: string;
  repoUrl: string;
  title: string;
  description?: string;
  branch?: string;
  commitHash?: string;
  prNumber?: number;
  timeAgo: string;
  timestamp: string;
  author: string;
}

export interface HeatmapCell {
  day: number;
  level: 0 | 1 | 2 | 3 | 4;
  date: string;
  fullDate: string;
  count: number;
}

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.css'
})
export class ActivitiesComponent {
  // 1. Khai báo Lucide Icons
  readonly Activity = Activity;
  readonly GitCommit = GitCommit;
  readonly GitPullRequest = GitPullRequest;
  readonly GitBranch = GitBranch;
  readonly GitMerge = GitMerge;
  readonly CheckCircle2 = CheckCircle2;
  readonly Tag = Tag;
  readonly FolderGit2 = FolderGit2;
  readonly Calendar = Calendar;
  readonly Flame = Flame;
  readonly TrendingUp = TrendingUp;
  readonly ExternalLink = ExternalLink;
  readonly RefreshCw = RefreshCw;
  readonly Search = Search;
  readonly Sparkles = Sparkles;
  readonly Clock = Clock;
  readonly Layers = Layers;
  readonly Filter = Filter;
  
  readonly gitHubApiService = inject(GitHubApiService);

  // 2. Signals quản lý bộ lọc
  selectedType = signal<string>('all');
  selectedRepo = signal<string>('all');
  searchQuery = signal<string>('');
  loading = signal<boolean>(false);

  // Danh sách Repository để filter
  repoList = computed(() => {
    const repos = this.gitHubApiService.repositories();
    const list = [{ label: 'All Repositories', value: 'all' }];
    repos.forEach(r => {
      list.push({ label: r.fullName, value: r.name });
    });
    return list;
  });

  constructor() {
    // Tự động gán activities thật từ service vào danh sách hiển thị
    effect(() => {
      const realActivities = this.gitHubApiService.activities();
      if (realActivities.length > 0) {
        this.activities.set(realActivities);
      }
    });
  }

  commitCount = computed(() => this.activities().filter(a => a.type === 'commit').length);
  prCount = computed(() => this.activities().filter(a => a.type === 'pr').length);
  branchReleaseCount = computed(() => this.activities().filter(a => a.type === 'branch' || a.type === 'release').length);
  
  activeDaysCount = computed(() => {
    const dates = new Set(this.activities().map(a => new Date(a.timestamp).toDateString()));
    return dates.size || 1;
  });

  // 3. Danh sách các sự kiện Activity mẫu
  activities = signal<ActivityEvent[]>([
    {
      id: 1,
      type: 'commit',
      repoName: 'thanhnamle/dev-board',
      repoUrl: 'https://github.com/thanhnamle/dev-board',
      title: 'feat(profile): implement reactive github profile signals and dual-theme styles',
      commitHash: '8f2a1b9',
      branch: 'main',
      timeAgo: '25 minutes ago',
      timestamp: '2026-09-03T18:35:00Z',
      author: 'Thành Nam'
    },
    {
      id: 2,
      type: 'pr',
      repoName: 'thanhnamle/payment-gateway-sdk',
      repoUrl: 'https://github.com/thanhnamle/payment-gateway-sdk',
      title: 'Merged Pull Request #24: Add webhook signature validation & idempotency headers',
      prNumber: 24,
      branch: 'master',
      timeAgo: '2 hours ago',
      timestamp: '2026-09-03T17:00:00Z',
      author: 'Thành Nam'
    },
    {
      id: 3,
      type: 'review',
      repoName: 'thanhnamle/dev-board',
      repoUrl: 'https://github.com/thanhnamle/dev-board',
      title: 'Approved code review on PR #12: Refactor Lucide icon tree-shaking providers',
      prNumber: 12,
      timeAgo: '4 hours ago',
      timestamp: '2026-09-03T15:00:00Z',
      author: 'Thành Nam'
    },
    {
      id: 4,
      type: 'release',
      repoName: 'thanhnamle/angular-signals-recipe',
      repoUrl: 'https://github.com/thanhnamle/angular-signals-recipe',
      title: 'Published Release v1.4.0: Debounced side-effects and hydration helpers',
      description: 'Production release adding optimized RxJS-to-Signal bridges and SSR compatibility.',
      timeAgo: 'Yesterday',
      timestamp: '2026-09-02T11:20:00Z',
      author: 'Thành Nam'
    },
    {
      id: 5,
      type: 'commit',
      repoName: 'thanhnamle/docker-dev-environments',
      repoUrl: 'https://github.com/thanhnamle/docker-dev-environments',
      title: 'chore(compose): bump PostgreSQL image to v16.4-alpine and configure healthchecks',
      commitHash: '3c8e4d1',
      branch: 'main',
      timeAgo: '2 days ago',
      timestamp: '2026-09-01T09:10:00Z',
      author: 'Thành Nam'
    },
    {
      id: 6,
      type: 'branch',
      repoName: 'thanhnamle/dev-board',
      repoUrl: 'https://github.com/thanhnamle/dev-board',
      title: 'Created new branch feature/github-analytics-dashboard',
      branch: 'feature/github-analytics',
      timeAgo: '3 days ago',
      timestamp: '2026-08-31T14:40:00Z',
      author: 'Thành Nam'
    },
    {
      id: 7,
      type: 'commit',
      repoName: 'thanhnamle/payment-gateway-sdk',
      repoUrl: 'https://github.com/thanhnamle/payment-gateway-sdk',
      title: 'perf(crypto): optimize SHA-256 HMAC digest allocation in hot loop',
      commitHash: '9a01f7e',
      branch: 'master',
      timeAgo: '4 days ago',
      timestamp: '2026-08-30T16:00:00Z',
      author: 'Thành Nam'
    }
  ]);

  // 4. Ma trận Contribution Heatmap (30 ngày gần nhất)
  heatmapCells = computed<HeatmapCell[]>(() => {
  const list = this.activities();
  const cells: HeatmapCell[] = [];
  const today = new Date();

  // Quét 35 ngày gần nhất
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toDateString();

    const count = list.filter(a => new Date(a.timestamp).toDateString() === dateStr).length;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count >= 5) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;

    // 🗓️ Định dạng Thứ, Ngày/Tháng/Năm (VD: "Thứ Tư, 09/09/2026")
    const fullDate = d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    cells.push({
      day: 35 - i,
      level,
      date: d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
      fullDate, // <-- Lưu vào cell
      count
    });
  }
  return cells;
});

  // 5. Thống kê tỷ lệ loại hành động
  activityDistribution = computed(() => {
    const list = this.activities();
    const total = list.length;
    if (total === 0) {
      return [
        { label: 'Commits', percentage: 65, color: '#8b5cf6' },
        { label: 'Pull Requests', percentage: 20, color: '#10b981' },
        { label: 'Branches', percentage: 10, color: '#06b6d4' },
        { label: 'Others', percentage: 5, color: '#f59e0b' }
      ];
    }
    const commits = list.filter(a => a.type === 'commit').length;
    const prs = list.filter(a => a.type === 'pr').length;
    const branches = list.filter(a => a.type === 'branch').length;
    const others = total - commits - prs - branches;
    return [
      { label: 'Commits', percentage: Math.round((commits / total) * 100), color: '#8b5cf6' },
      { label: 'Pull Requests', percentage: Math.round((prs / total) * 100), color: '#10b981' },
      { label: 'Branches', percentage: Math.round((branches / total) * 100), color: '#06b6d4' },
      { label: 'Others', percentage: Math.round((others / total) * 100), color: '#f59e0b' }
    ];
  });

  // 6. Hiệu suất theo ngày trong tuần
  weeklyProductivity = computed(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    this.activities().forEach(item => {
      const d = new Date(item.timestamp).getDay(); // 0 = Sun, 1 = Mon...
      const mappedIdx = d === 0 ? 6 : d - 1; // Map: Mon=0, Sun=6
      counts[mappedIdx]++;
    });
    const max = Math.max(...counts, 1);
    return days.map((day, idx) => ({
      day,
      commits: counts[idx],
      height: Math.max(Math.round((counts[idx] / max) * 100), 12) // Giữ tối thiểu 12% để cột hiển thị thanh thoát
    }));
  });

  // 7. Computed Signal: Lọc activities theo search query, type và repo
  filteredActivities = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.selectedType();
    const repo = this.selectedRepo();
    return this.activities().filter(item => {
      const matchesQuery = !query ||
        item.title.toLowerCase().includes(query) ||
        (item.commitHash && item.commitHash.toLowerCase().includes(query)) ||
        item.repoName.toLowerCase().includes(query);
      const matchesType = type === 'all' || item.type === type;
      const matchesRepo = repo === 'all' || item.repoName.toLowerCase().includes(repo.toLowerCase());
      return matchesQuery && matchesType && matchesRepo;
    });
  });

  // 9. Giả lập làm mới dữ liệu
  async refreshActivities() {
    this.loading.set(true);
    try {
      const real = await this.gitHubApiService.fetchActivities();
      if (real.length > 0) {
        this.activities.set(real);
      }
    } finally {
      this.loading.set(false);
    }
  }
}