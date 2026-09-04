import { Component, signal, computed } from '@angular/core';
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

  // 2. Signals quản lý bộ lọc
  selectedType = signal<string>('all');
  selectedRepo = signal<string>('all');
  searchQuery = signal<string>('');
  loading = signal<boolean>(false);

  // Danh sách Repository để filter
  repoList = [
    { label: 'All Repositories', value: 'all' },
    { label: 'thanhnamle/dev-board', value: 'dev-board' },
    { label: 'thanhnamle/payment-gateway-sdk', value: 'payment-gateway-sdk' },
    { label: 'thanhnamle/angular-signals-recipe', value: 'angular-signals-recipe' },
    { label: 'thanhnamle/docker-dev-environments', value: 'docker-dev-environments' }
  ];

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
  heatmapCells = signal<HeatmapCell[]>(this.generateHeatmapData());

  // 5. Thống kê tỷ lệ loại hành động
  activityDistribution = [
    { label: 'Commits', percentage: 65, color: '#8b5cf6' },
    { label: 'Pull Requests', percentage: 20, color: '#10b981' },
    { label: 'Code Reviews', percentage: 10, color: '#06b6d4' },
    { label: 'Releases', percentage: 5, color: '#f59e0b' }
  ];

  // 6. Hiệu suất theo ngày trong tuần
  weeklyProductivity = [
    { day: 'Mon', commits: 28, height: 80 },
    { day: 'Tue', commits: 34, height: 95 },
    { day: 'Wed', commits: 22, height: 65 },
    { day: 'Thu', commits: 31, height: 90 },
    { day: 'Fri', commits: 19, height: 55 },
    { day: 'Sat', commits: 12, height: 35 },
    { day: 'Sun', commits: 8, height: 25 }
  ];

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

  // 8. Tạo dữ liệu ô ma trận heatmap đóng góp (5 tuần x 7 ngày = 35 ô)
  private generateHeatmapData(): HeatmapCell[] {
    const levels: (0 | 1 | 2 | 3 | 4)[] = [
      0, 1, 3, 2, 4, 3, 1,
      2, 4, 3, 4, 2, 0, 1,
      3, 2, 4, 3, 4, 2, 0,
      1, 3, 4, 2, 4, 3, 1,
      2, 4, 3, 2, 4, 1, 3
    ];
    return levels.map((lvl, index) => ({
      day: index + 1,
      level: lvl,
      date: `Day ${index + 1}`,
      count: lvl * 3 + (lvl > 0 ? 1 : 0)
    }));
  }

  // 9. Giả lập làm mới dữ liệu
  refreshActivities() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
    }, 600);
  }
}