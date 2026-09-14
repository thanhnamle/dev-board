import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  Activity,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  Code,
  Copy,
  ExternalLink,
  FileText,
  Flame,
  FolderGit2,
  GitBranch,
  GitCommit,
  Github,
  GitPullRequest,
  Layers,
  ListTodo,
  LucideAngularModule,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-angular';
import { GitHubApiService } from '../../../core/services/github-api.service';
import { WorkspaceDataService } from '../../../core/services/workspace-data.service';
import { UserService } from '../../../core/services/user.service';

interface DailyTask {
  id: number;
  text: string;
  done: boolean;
  tag: string;
}

interface PullRequest {
  id: number;
  title: string;
  repo: string;
  author: string;
  avatar: string;
  branch: string;
  ciStatus: 'passing' | 'running' | 'failed';
  reviewsCount: number;
  timeAgo: string;
  url: string;
}

interface GitActivity {
  id: number;
  repo: string;
  branch: string;
  message: string;
  hash: string;
  timeAgo: string;
  additions: number;
  deletions: number;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit {
  // Lucide Icons
  readonly Flame = Flame;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly FolderGit2 = FolderGit2;
  readonly GitCommit = GitCommit;
  readonly GitBranch = GitBranch;
  readonly GitPullRequest = GitPullRequest;
  readonly FileText = FileText;
  readonly Code = Code;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly ArrowUpRight = ArrowUpRight;
  readonly ExternalLink = ExternalLink;
  readonly Copy = Copy;
  readonly Check = Check;
  readonly Sparkles = Sparkles;
  readonly Activity = Activity;
  readonly Zap = Zap;
  readonly Bookmark = Bookmark;
  readonly ListTodo = ListTodo;
  readonly ShieldCheck = ShieldCheck;
  readonly Layers = Layers;
  readonly Github = Github;
  readonly gitHubApiService = inject(GitHubApiService);
  readonly workSpaceDataService = inject(WorkspaceDataService);
  readonly userService = inject(UserService);

  // Trạng thái đồng bộ GitHub
  readonly isSyncing = signal<boolean>(false);

  // Trạng thái copy snippet
   readonly copiedSnippet = signal<boolean>(false);

    // Lời chào tự động thay đổi theo thời gian thực: Sáng / Chiều / Tối
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  // Tên hiển thị ưu tiên tên từ GitHub SSO hoặc UserService
  readonly displayName = computed(() => {
    return this.gitHubApiService.currentUser()?.name 
      || this.userService.currentUser().name 
      || 'Thành Nam';
  });

  // Tính số ngày commit liên tiếp (Active Streak) từ calendar thật
  readonly streakDays = computed(() => {
    const contrib = this.gitHubApiService.contributions();
    if (!contrib?.weeks?.length) return 12; // Fallback nếu chưa tải xong

    const allDays = contrib.weeks.flatMap((w: any) => w.contributionDays || []);
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let streakStarted = false;

    for (let i = allDays.length - 1; i >= 0; i--) {
      const day = allDays[i];
      if (day.date > today) continue; // Bỏ qua ngày trong tương lai

      if (day.contributionCount > 0) {
        streak++;
        streakStarted = true;
      } else if (streakStarted) {
        break; // Đứt chuỗi streak
      } else if (day.date === today) {
        continue; // Hôm nay chưa commit thì xét tiếp hôm qua
      } else {
        break;
      }
    }
    return streak > 0 ? streak : 1;
  });

    // Card 1: Số lượng Repositories đang quản lý
  readonly trackedReposCount = computed(() => {
    const repos = this.gitHubApiService.repositories();
    return repos.length > 0 ? repos.length : (this.gitHubApiService.currentUser()?.public_repos || 18);
  });

  // Card 2: Số commit trong 7 ngày gần nhất
  readonly weeklyCommitsCount = computed(() => {
    const contrib = this.gitHubApiService.contributions();
    if (contrib?.weeks?.length) {
      const allDays = contrib.weeks.flatMap((w: any) => w.contributionDays || []);
      const last7Days = allDays.slice(-7);
      const sum = last7Days.reduce((acc: number, d: any) => acc + (d.contributionCount || 0), 0);
      if (sum > 0) return sum;
    }
    // Đếm số events trong 7 ngày từ activities
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const count = this.gitHubApiService.activities().filter(a => new Date(a.timestamp).getTime() >= sevenDaysAgo).length;
    return count > 0 ? count : 7;
  });

  // Card 3: Số lượng Notes từ WorkspaceDataService
  readonly notesCount = computed(() => this.workSpaceDataService.notes().length);

  // Card 4: Số lượng Snippets từ WorkspaceDataService
  readonly snippetsCount = computed(() => this.workSpaceDataService.snippets().length);

  // Lấy 4 hoạt động commit mới nhất từ GitHub
  readonly recentActivities = computed<GitActivity[]>(() => {
    const acts = this.gitHubApiService.activities();
    if (!acts.length) return [];

    return acts.slice(0, 4).map(a => ({
      id: a.id,
      repo: a.repoName,
      branch: a.branch || 'main',
      message: a.title,
      hash: a.commitHash || 'latest',
      timeAgo: a.timeAgo,
      additions: 12, // Metadata tượng trưng cho giao diện diff
      deletions: 4
    }));
  });

  // Lọc các hoạt động liên quan đến PR từ GitHub
  readonly activePRs = computed<PullRequest[]>(() => {
    const acts = this.gitHubApiService.activities();
    return acts.filter(a => a.type === 'pr').slice(0, 3).map(pr => ({
      id: pr.prNumber || pr.id,
      title: pr.title,
      repo: pr.repoName,
      author: pr.author,
      avatar: this.gitHubApiService.currentUser()?.avatar_url || 'assets/Avatar.jpg',
      branch: pr.branch || 'main',
      ciStatus: 'passing',
      reviewsCount: 1,
      timeAgo: pr.timeAgo,
      url: pr.repoUrl
    }));
  });

  readonly pinnedNotes = computed(() => {
    const all = this.workSpaceDataService.notes();
    const favs = all.filter(n => n.pinned);
    const list = favs.length ? favs.slice(0, 3) : all.slice(0, 3);

    return list.map(n => ({
      id: n.id,
      title: n.title,
      category: n.tags[0] || 'Architecture',
      categoryClass: this.getTagColor(n.tags[0]),
      updatedAt: n.lastUpdated,
      readTime: `${Math.max(2, Math.ceil(n.content.join(' ').length / 350))} min read`
    }));
  });

  private getTagColor(tag?: string): string {
    const map: Record<string, string> = {
      Architecture: 'badge-purple',
      Frontend: 'badge-cyan',
      Backend: 'badge-emerald',
      DevOps: 'badge-amber',
      Security: 'badge-rose'
    };
    return tag && map[tag] ? map[tag] : 'badge-purple';
  }

  private readonly STORAGE_KEY = 'devboard_daily_focus';

  dailyTasks = signal<DailyTask[]>(this.loadTasks());

  private loadTasks(): DailyTask[] {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(this.STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 1, text: 'Review dev-board repository architecture & signals', done: true, tag: 'Code Review' },
      { id: 2, text: 'Complete Angular 17 SSR hydration & optimization', done: false, tag: 'Frontend' },
      { id: 3, text: 'Verify GitHub OAuth 2.0 session persistence on reload', done: true, tag: 'Security' },
      { id: 4, text: 'Draft Architecture RFC for Local-First Workspace', done: false, tag: 'Design' }
    ];
  }

  toggleTask(taskId: number): void {
    this.dailyTasks.update(tasks => {
      const updated = tasks.map(t => (t.id === taskId ? { ...t, done: !t.done } : t));
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }

  // Snippet được lấy trực tiếp từ danh sách snippets trong Workspace
  readonly pinnedSnippet = computed(() => {
    const list = this.workSpaceDataService.snippets();
    return list.length ? list[0] : null;
  });

  copyCode(): void {
    const code = this.pinnedSnippet()?.rawCode || `// DevBoard Core Signal Guard\nexport const authGuard = () => true;`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.copiedSnippet.set(true);
        setTimeout(() => this.copiedSnippet.set(false), 2000);
      });
    }
  }

  async ngOnInit() {
    // Tự động tải dữ liệu nếu chưa có sẵn
    if (this.gitHubApiService.repositories().length === 0) {
      this.gitHubApiService.fetchRepositories();
    }
    if (this.gitHubApiService.activities().length === 0) {
      this.gitHubApiService.fetchActivities();
    }
    if (!this.gitHubApiService.contributions()) {
      this.gitHubApiService.fetchContributions();
    }
  }

  // Hàm Sync thật gọi API backend/GitHub
  async triggerSync(): Promise<void> {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      await Promise.all([
        this.gitHubApiService.fetchRepositories(),
        this.gitHubApiService.fetchActivities(),
        this.gitHubApiService.fetchContributions()
      ]);
    } finally {
      this.isSyncing.set(false);
    }
  }
}

