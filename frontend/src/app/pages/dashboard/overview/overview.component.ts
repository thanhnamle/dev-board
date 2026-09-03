import { Component, signal } from '@angular/core';
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
export class OverviewComponent {
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

  // Trạng thái đồng bộ GitHub
  isSyncing = signal<boolean>(false);

  // Trạng thái copy snippet
  copiedSnippet = signal<boolean>(false);

  // Danh sách nhiệm vụ hôm nay (Daily Focus)
  dailyTasks = signal<DailyTask[]>([
    { id: 1, text: 'Review PR #42: GitHub OAuth 2.0 token caching', done: true, tag: 'Code Review' },
    { id: 2, text: 'Complete Angular 17 Signals refactoring in Snippet module', done: false, tag: 'Frontend' },
    { id: 3, text: 'Draft Architecture RFC for Local-First persistence', done: false, tag: 'Design' },
    { id: 4, text: 'Verify PostgreSQL migration scripts on staging', done: false, tag: 'Database' }
  ]);

  // Danh sách Pull Requests đang mở
  activePRs: PullRequest[] = [
    {
      id: 42,
      title: 'feat(auth): implement GitHub SSO & token refresh cycle',
      repo: 'payoo-devboard/core-api',
      author: 'thanhnamle',
      avatar: 'assets/Avatar.jpg',
      branch: 'feature/oauth-refresh',
      ciStatus: 'passing',
      reviewsCount: 2,
      timeAgo: '25m ago',
      url: 'https://github.com'
    },
    {
      id: 39,
      title: 'refactor(ui): migrate dashboard widgets to Angular signals',
      repo: 'payoo-devboard/frontend',
      author: 'alex-engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      branch: 'refactor/signals-ui',
      ciStatus: 'running',
      reviewsCount: 1,
      timeAgo: '2h ago',
      url: 'https://github.com'
    },
    {
      id: 38,
      title: 'fix(ssr): resolve hydration mismatch on static code blocks',
      repo: 'payoo-devboard/frontend',
      author: 'sarah-dev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      branch: 'fix/ssr-hydration',
      ciStatus: 'passing',
      reviewsCount: 3,
      timeAgo: '4h ago',
      url: 'https://github.com'
    }
  ];

  // Luồng commit mới nhất
  recentActivities: GitActivity[] = [
    {
      id: 1,
      repo: 'payoo-devboard/frontend',
      branch: 'main',
      message: 'chore: polish sidebar typography and logo badge styling',
      hash: 'a7f92b1',
      timeAgo: '12m ago',
      additions: 48,
      deletions: 12
    },
    {
      id: 2,
      repo: 'payoo-devboard/core-api',
      branch: 'main',
      message: 'perf: optimize GitHub API webhook ingestion queue',
      hash: '90c41e8',
      timeAgo: '1h ago',
      additions: 120,
      deletions: 34
    },
    {
      id: 3,
      repo: 'payoo-devboard/docs',
      branch: 'docs/v2',
      message: 'docs: update keyboard shortcuts and deployment runbook',
      hash: '3bf19a4',
      timeAgo: '3h ago',
      additions: 85,
      deletions: 4
    }
  ];

  // Pinned Engineering Notes
  pinnedNotes = [
    {
      id: 1,
      title: 'DevBoard 2.0 SSR Pipeline RFC',
      category: 'Architecture',
      categoryClass: 'badge-purple',
      updatedAt: 'Today',
      readTime: '4 min read'
    },
    {
      id: 2,
      title: 'PostgreSQL Connection Pooling & SSL Setup',
      category: 'Infrastructure',
      categoryClass: 'badge-cyan',
      updatedAt: 'Yesterday',
      readTime: '6 min read'
    },
    {
      id: 3,
      title: 'Git Commit Standards & PR Review Checklist',
      category: 'Guidelines',
      categoryClass: 'badge-emerald',
      updatedAt: '3 days ago',
      readTime: '2 min read'
    }
  ];

  // Ghim snippet nhanh (Quick Scratchpad)
  pinnedSnippetCode = `// Core Signal Auth Guard
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(DevBoardAuthService);
  return auth.isAuthenticated() ? true : createUrlTreeFromSnapshot(route, ['/login']);
};`;

  // Chuyển đổi trạng thái task
  toggleTask(taskId: number): void {
    this.dailyTasks.update(tasks =>
      tasks.map(t => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
  }

  // Giả lập kích hoạt đồng bộ GitHub
  triggerSync(): void {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    setTimeout(() => {
      this.isSyncing.set(false);
    }, 1500);
  }

  // Copy code snippet
  copyCode(): void {
    navigator.clipboard.writeText(this.pinnedSnippetCode);
    this.copiedSnippet.set(true);
    setTimeout(() => {
      this.copiedSnippet.set(false);
    }, 2000);
  }
}

